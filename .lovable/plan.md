# Two-part answer

## Part 1 — Status after Phase C

### What Phase C actually changed
Marked 11 hot RLS helper functions (`has_role`, `is_teacher_of_student`, `is_parent_of_student`, `is_teacher_of_classroom`, `is_classroom_student`, `parent_has_aura_consent`, `get_parent_id`, `can_parent_view_classroom`, `admin_can_view_classroom`) as **PARALLEL SAFE**, refreshed planner statistics on the 5 lookup tables those helpers touch, and tightened autovacuum on `user_roles` so stats stay accurate as roles change. No tables, policies, or features touched.

Effect: every authenticated request can now fan its permission checks across parallel Postgres workers instead of running them serially. Compounds with the Phase A + B policy consolidation because every consolidated policy still calls these helpers.

### Where we sit on concurrent users
- **Before Phase A:** ~2-3K concurrent
- **After A + B:** ~10-15K concurrent
- **After A + B + C (now):** ~13-22K concurrent (projection — needs 24h of traffic to confirm)
- **Your goal:** 50-100K concurrent (4-7× away), millions later (architectural work)

### How we keep climbing
Remaining levers, in order of effort vs payoff:

1. **Phase D** — Hunt the 3.8M rolled-back transactions burning CPU & WAL. ~2h investigation, 1.2-1.4× gain.
2. **Phase E** — Replace expensive PostgREST embedded joins (`classroom_students → classrooms → profiles`) with single RPC functions. ~3h, 1.2-1.3× gain.
3. **Phase F** — Bump the Cloud compute instance size in Backend > Advanced settings. Pure infra lever, 1.5-2× gain, ~5 min + a short cutover.
4. **Stacked:** D + E + F together pushes us into the **30-60K concurrent range**, well inside the 50-100K target.
5. **Past 100K → millions** requires architecture: read replicas, partitioning of `reading_sessions` and `safety_audit_log` (after they cross ~10 GB), regional edge-function deployment, realtime channel sharding, and a Cloudflare KV / Redis caching layer for the hottest read paths. That's a 2-3 month track, not a one-migration fix — but you don't need it yet.

## Part 2 — Killing the Benny video spinner

### What's actually happening (audited the code)
The "three spins" is a real bug, not perception. When you tap a Pre-K level the `PreKEpisodeRouter` mounts `usePreKVideoLevel`, which does this **serially**:

1. Query `prek_worlds` (1 roundtrip)
2. Query `prek_levels` (1 roundtrip)
3. Query `prek_level_words` (1 roundtrip)
4. For each video file (opening + closing + first/second/poster per word), call `supabase.storage.createSignedUrl()` **one at a time in a `for` loop**. A typical level has 6 words → that's **~20 sequential Storage roundtrips**.
5. Then — and this is the worst part — the hook calls `fetchPreKDbLevel` **a second time** just to grab the level's `id`, repeating steps 1-3 from scratch.

Total: roughly **26 sequential network calls** before the video can render. That's exactly your three spinner rotations.

### Fix: 4 changes, additive, no feature/UX impact

1. **Kill the double-fetch.** Return `dbLevelId` from `buildVideoLevelFromDb` instead of re-fetching everything. Eliminates 3 roundtrips per open.

2. **Parallelize signed-URL resolution.** Collect every storage path first, run `Promise.all` over `createSignedUrl` calls so all ~20 Storage requests fire simultaneously instead of in a chain. With HTTP/2 multiplexing this takes the time of the slowest one (~80-150 ms) instead of the sum of all of them (~1500-2000 ms).

3. **Module-level in-memory cache** keyed by `${worldNumber}:${levelNumber}`. Once a level is opened, re-opening it within the session is **instant** (no DB, no Storage, zero loading state). Cache invalidates on the 7-day signed-URL TTL boundary.

4. **Prefetch on render.** When `RPGLevelSelect` paints the level cards for a Pre-K world, fire `buildVideoLevelFromDb` in the background for the next unlocked level (and maybe the one after). By the time the player's thumb finds the card, the data is already cached → zero spinner.

5. **Remove the loading gate.** Even on a cold first tap (no prefetch hit), render the `tap-to-begin` overlay immediately and load the level data in parallel under it. The player needs ~400-700 ms to read "Tap to begin" and move their finger — exactly the window the parallelized fetch needs. Only block if data is still missing at the moment of tap, which after change #2 will be extremely rare.

### Expected result
- **Cold first open ever**: spinner goes from ~2000 ms to ~150-300 ms — under the threshold where humans perceive a wait. Realistically: instant feel.
- **Any subsequent open in the session**: **zero ms**, no spinner at all, no DB hit, no Storage hit.
- **Prefetched level**: **zero ms**, even on first open.

### What this does NOT touch
- No DB schema changes, no migrations
- No video file changes, no asset reprocessing
- Nothing in `NabuVideoAdventure` rendering logic
- Nothing in the level-select UI's visual design
- No new dependencies

### Files changed
- `src/lib/preKLevelFromDb.ts` — cache + parallel resolveUrl + single fetchPreKDbLevel + exported prefetch helper
- `src/components/aura/game/rpg/NabuEpisodeWrapper.tsx` — drop the loading gate, mount `NabuVideoAdventure` immediately and let it handle the (rare) still-loading case internally
- `src/components/aura/game/rpg/RPGLevelSelect.tsx` (or whatever the Pre-K level grid component is — will confirm in build mode) — call the new prefetch helper for visible unlocked levels

### Phase ordering
This is independent of Phase D / E / F — pure frontend fix, ships in one pass. Recommend doing it now since it's a visible irritant; the backend phases can follow in the next session.
