# Make the Pre-K editor the single source of truth — instantly

## What's actually broken

Honest read on what's happening, not a guess:

The trim In/Out values you set in the editor **are saved correctly** to the database, and the runtime player **does know how to apply them** (it seeks to `trimIn` on load and pauses at `trimOut`). So the wiring exists.

The reason you see "the exact same thing" after editing is in `src/lib/preKLevelFromDb.ts`. There is a **module-level cache** that holds the fully-built level (URLs + trim values + word steps) for **6 days**:

```text
const CACHE_TTL_MS = 6 * 24 * 60 * 60 * 1000;   // 6 days
const levelCache = new Map<string, CacheEntry>();
```

Every time the player opens a level it reads from that cache first. Once a level is built in a session, **no edit anywhere in the CMS can change what the player sees** — not trims, not words, not videos — until the cache entry expires or the tab is fully reloaded. Publishing/unpublishing happens to nuke the in-memory cache as a side effect of the page reload, which is why that "fixes" it.

That cache is the root cause. Everything else is icing.

## Honest opinion on the "Update Live" button

Yes — add it, with a caveat. The right design is **both**:

1. **Auto-invalidate on every save.** The editor is the source of truth; every mutation (trim change, word edit, video upload, reorder, add/delete word) should immediately bust the cache for that `world:level` and broadcast a "level changed" signal. The user shouldn't have to think about it.
2. **A single explicit "Update Live" button at the top** that does the same thing manually and shows a clear "Pushed live · students will see this on their next tap" toast. This is a trust/peace-of-mind feature. You and the team will use it constantly during content QA, even if technically every edit already pushes live.

What I would *not* do: gate edits behind the button (i.e., make it a "publish draft" workflow). That's the workflow you're complaining about. Inline edits should go live immediately; the button is a confirmation/refresh, not a gate.

## Plan

### 1. Add cache invalidation to `src/lib/preKLevelFromDb.ts`

Export a new function:

```ts
export function invalidatePreKLevelCacheByDbId(dbLevelId: string): void
export function invalidatePreKLevelCache(worldNumber: number, levelNumber: number): void
```

Both clear the matching entry from `levelCache` and any matching `inflight` promise. The DB-id variant scans the cache once and removes the entry whose `dbLevelId` matches — needed because the editor only knows the level UUID, not the world/level numbers at mutation time.

### 2. Wire invalidation into every editor mutation in `src/pages/superadmin/PreKLevelBuilder.tsx`

After each `supabase.update / insert / delete` that affects what the player renders, call `invalidatePreKLevelCacheByDbId(level.id)`. Touch points:

- `uploadLevelVideo` (opening / closing)
- `clearLevelVideo`
- `updateLevelTrim`
- `uploadWordVideo`
- `clearWordVideo`
- `updateWordTrim`
- `addWord`, `removeWord`, `moveWord`
- the on-blur `updateWord` for spoken word / ask line / success line
- `saveProgress` (the "Save" button)

### 3. Broadcast a "level changed" signal so open player sessions refresh

Use a Supabase Postgres-changes realtime subscription on `prek_levels` and `prek_level_words` filtered by `level_id` inside the player hook `usePreKVideoLevel`. On any change:

- bust the cache for that level
- re-run `buildVideoLevelFromDb`
- update the hook's state

Result: a student already inside a level sees the new cut on the next clip boundary (or immediately if the level is just sitting on a still). No reload, no republish.

### 4. Add the "Update Live" button to the editor header

Top-right of `PreKLevelBuilder`, next to the existing "Save" button:

- Label: **Update Live**
- Icon: `Radio` or `Rocket`
- Click:
   1. Run `saveProgress()` to flush any unblurred inputs
   2. `invalidatePreKLevelCacheByDbId(level.id)`
   3. Send a no-op `supabase.from('prek_levels').update({ updated_at: new Date().toISOString() }).eq('id', level.id)` — this both bumps the row and triggers the realtime broadcast in step 3 for any open student session
   4. Toast: `"Pushed live — next play will use these edits"`

The button is always enabled (no draft/published distinction); it's a manual nudge, not a gate.

### 5. Wording cleanup

The existing toast `"Progress saved"` is misleading because it implies you still need to publish. Change it to `"Saved — live for the next play"`. Same for the trim/video save toasts.

## Technical notes

- **No DB migration needed.** Trim columns already exist; the runtime already honors them. This is purely cache + signal plumbing.
- **No schema changes, no RLS changes.** Realtime on `prek_levels` / `prek_level_words` reuses existing read policies; super admins are already authorized to read.
- **Backward-compat:** the existing 6-day cache stays — it's still a perf win for the common case of a student opening the same level twice in a row. We just bust it on edits and on realtime updates.
- **Out of scope (intentionally):** the audio mixer cache. That hook (`usePreKAudioMixerRuntime`) reads its own data from `prek_audio_clips` and doesn't share `levelCache`, so it already updates on every save. If you see audio edits failing to apply too, that's a separate bug.

## Files touched

- `src/lib/preKLevelFromDb.ts` — add `invalidatePreKLevelCache*` exports
- `src/pages/superadmin/PreKLevelBuilder.tsx` — wire invalidation into every mutation; add the "Update Live" button
- (optionally) realtime subscription inside `usePreKVideoLevel` in the same `preKLevelFromDb.ts` file
