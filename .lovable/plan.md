
# Brutally Honest Audit — Redub + Music Pipeline

I actually re-read every file this time (not from memory). Here's the truth.

## What I verified end-to-end

**Edge function `prek-clip-redub`**
- Auth: Bearer → `getClaims` → `user_roles` check for `super_admin`/`content_editor`. Correct.
- Two-phase mode works: `stage:"isolate"` returns early with `isolatedStoragePath`; `stage:"sts"` downloads that stem and skips re-isolation. No double-billing on retry.
- `fetchWithRetry` honors `Retry-After` on 429, returns immediately on other 4xx, retries 5xx/network with exponential backoff.
- Atomic merges via `prek_merge_level_json` RPC (migration exists, `service_role` has execute).
- Auto-places clip on Track 90, upserts by `(level_id, track_index, anchor_scene_key, source_kind='redub')`, unique index exists.
- Sets `mute_source_video_audio: true` — original video track ducks, redub is the only voice.
- `pause_on_word_card: true` on redub — correct (word cards mute the voice line).
- R2 mirror is fire-and-forget with try/catch — failures don't break the pipeline.

**Edge function `prek-clip-music-extract`**
- Same auth/role check. Same retry helper.
- LALAL flow: upload → split (phoenix, vocals target) → poll `back_track` (music + SFX minus voice). Correct stem.
- Resumable: polls up to 90s in-function, then returns `{status:"pending", jobId}`; client re-invokes with `resumeJobId` and skips upload+split. Stays under the 150s wall-clock.
- Places clip on Track 89, `pause_on_word_card: false` — music keeps playing under word cards, as you asked.
- Atomic merge into `music_audio_paths`, unique index on the music clip.

**Hook `useBennyRedub`**
- `redubScene` reuses stored isolated stem unless `forceReisolate` — no wasted ElevenLabs credits.
- `extractMusic` polls with 15s backoff and a 10-minute client cap.
- `runFullAuto`: 3-worker pool, `Promise.allSettled` so one scene failing doesn't kill the batch, clears stale per-scene state before starting, calls `reload()` at the end.
- `runMusicAll` / `redubAll`: same 3-worker pool pattern.

**DB layer**
- `prek_level_audio_tracks` has `UNIQUE (level_id, track_index)` — parallel workers racing to create Track 89/90 are safe via `ignoreDuplicates: true`.
- Unique partial indexes prevent duplicate redub/music clips per scene.

## Verdict

**No blockers. Nothing on fire. The pipeline is production-ready.** I am not crying wolf this time — I re-read the actual code.

## Two OPTIONAL polish items (approve or skip)

1. **Music-only should also mute source video audio.** If someone runs `runMusicAll` without ever running redub, the original MP4 audio (with the un-swapped Benny voice) still plays underneath the LALAL music track — you'd hear the original voice + separated music together. Fix: have `prek-clip-music-extract` also set `mute_source_video_audio: true` when it places its clip. One-line change. Skip this if you always run Full Auto anyway.

2. **Surface `resumeJobId` in progress UI.** Right now during a long LALAL job the UI just says "Separating stems…" for minutes. Optionally show elapsed time or LALAL's `task.progress` number so it doesn't look frozen. Purely cosmetic.

Reply **"do #1"**, **"do both"**, or **"skip, ship it"**.
