## Audit result — one real risk, two minor nits

### ✅ Clean (re-verified this pass)
- `prek_merge_level_json(uuid, text, jsonb)` RPC exists — both edge functions use it for `redub_audio_paths` / `redub_isolated_paths` / `music_audio_paths`. No lost-update race.
- Partial unique indexes `prek_audio_clips_redub_uniq` and `prek_audio_clips_music_uniq` on `(level_id, track_index, anchor_scene_key) WHERE source_kind IN ('redub','music') AND deleted_at IS NULL` — one clip per scene per lane, enforced by DB.
- Track upsert uses `onConflict: "level_id,track_index", ignoreDuplicates: true` on both lanes — no duplicate-key race.
- LALAL polling capped at 90s per invocation, client resumes with `resumeJobId` for up to 10 min without re-uploading/re-splitting.
- Retry helper on all upstream calls (5xx + network only, 4xx short-circuits).
- Isolated + redub + music paths all timestamped → CDN cache-bust guaranteed.
- Music clip: `pause_on_word_card = false` (bed keeps playing under cards); redub clip: `pause_on_word_card = true` (ducks under cards). Backfill ran.
- `mute_source_video_audio` auto-flips on first redub write.
- R2 mirror is fire-and-forget with Service Role JWT.
- Full Auto worker pool (CONCURRENCY=3) processes each scene exactly once — no in-scene clip race.
- CORS unified via `../_shared/cors.ts` on both functions.

---

### 🔴 Real risk — Redub pipeline can hit 150s wall-clock on long clips
`prek-clip-redub` does **Isolation (30–60s) → STS (30–90s)** in a single HTTP request. On a long Benny clip (>20s of audio) the two ElevenLabs calls stacked can exceed Supabase Edge Function's ~150s ceiling, killing the function mid-STS. Unlike LALAL, there's no resume path — the user just sees "Failed to fetch" and burns credits.

**Fix:** add a two-phase mode to `prek-clip-redub`, mirroring the LALAL resume pattern:
- Phase A (`stage: "isolate"`): download source → isolate → upload → merge `redub_isolated_paths` → return `{ status: "isolated", isolatedStoragePath }`.
- Phase B (`stage: "sts", isolatedStoragePath }`): download isolated MP3 → STS → upload → merge `redub_audio_paths` → ensure clip → return final payload.

`useBennyRedub.redubScene` calls the function twice back-to-back when `isolate !== false`. Each phase is <90s comfortably. If Phase B fails the isolated MP3 is already durable — user retries STS only, no re-isolation cost. `isolateOnly` behavior is unchanged (only calls Phase A).

---

### 🟡 Nit 1 — `runFullAuto` doesn't call `reload()` on completion
Per-scene success updates `settings.audioPaths` / `musicPaths` in-memory correctly, but the `generatedAt` / `musicGeneratedAt` timestamps and any writes from parallel workers landing after their local `setSettings` won't reflect until the next mount. Add `await reload()` at the end of `runFullAuto` so the "generated ✓" state is authoritative.

### 🟡 Nit 2 — Music extraction "pending" status message is misleading
`extractMusic` writes `{ status: "running", errorMessage: "Separating stems…" }` — putting a progress note into `errorMessage` looks like an error in any UI that renders it red. Add a proper `progressMessage` field to `MusicState` (and `RedubState` for symmetry) and stop overloading `errorMessage`.

---

## What I'll ship on approval

1. **`prek-clip-redub`** — split into isolate/sts stages driven by a `stage` request field; keep single-shot behavior for `isolateOnly`. Return `{ status: "isolated", isolatedStoragePath, isolatedSignedUrl }` from Phase A.
2. **`useBennyRedub.redubScene`** — when `isolate !== false` and not `isolateOnly`, run Phase A → capture `isolatedStoragePath` → run Phase B with `{ stage: "sts", isolatedStoragePath }`. Single-call fallback preserved for `isolate === false`.
3. **`useBennyRedub`** — add `progressMessage` to `RedubState` / `MusicState`; stop writing status text into `errorMessage`. Call `await reload()` at the tail of `runFullAuto`.
4. **Redeploy** `prek-clip-redub`. No DB migration needed. No UI schema change beyond the new optional `progressMessage` field.

After this, Full Auto is safe on arbitrarily long clips and the UI stops flashing fake errors during LALAL waits.