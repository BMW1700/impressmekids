## One-Click "Redub + Music" Automation

Ship a single button that, for any Benny clip, runs redub (ElevenLabs voice) and music extraction (LALAL.AI) in parallel and drops both results onto the timeline — voice on the Redub lane, clean music/SFX on a new lane directly below it.

### 1. Database
- Add `music_audio_paths jsonb` to `prek_levels` (mirrors `redub_audio_paths`).
- Add `music_job_id`, `music_status`, `music_error` columns to `prek_redub_jobs` (or a sibling `prek_music_jobs` table — one row per clip, same shape as redub jobs).

### 2. Edge function: `prek-clip-music-extract`
- Input: `{ levelId, clipIndex, sourceUrl }`.
- Uploads the clip to LALAL.AI (`/api/upload/`), starts a split with `splitter=phoenix`, `stem=vocals` (we keep the **inverse** — the `back_track` URL = music + SFX minus voice).
- Polls `/api/check/` until `state=success`.
- Downloads `back_track` URL, uploads to storage at `prek-audio/{levelId}/music/{clipIndex}.mp3`.
- Writes path into `prek_levels.music_audio_paths[clipIndex]` and updates job row.
- Uses `LALAL_API_KEY` (already saved), full CORS, JWT verified in code.

### 3. Redub pipeline hardening
- Before ElevenLabs voice-changer step, run the clip through **ElevenLabs Voice Isolator** (`/v1/audio-isolation`) so the redub track contains ONLY Benny's new voice — no bleed of original music. Store isolated stem as the source for voice-change.
- Result: Redub lane = clean dubbed voice, Music lane = clean instrumental/SFX. Layering reconstructs the scene.

### 4. Hook + UI
- Extend `useBennyRedub` with `runFullAuto(levelId)` that fires both edge functions in parallel per clip, tracks combined progress, and refreshes level data when both complete.
- `RedubStudioPanel.tsx`: add **"Full Auto: Redub + Music"** button next to existing redub button. Shows dual progress bars (Voice / Music) per clip.
- `TimelineCanvas.tsx`: add pinned **Track 89 "Benny (Music)"** lane immediately under Track 90 "Redub". Reads from `music_audio_paths`. Same split/drag-trim/extend handles as other audio clips (already implemented — no new editor code).

### 5. Safety
- Both pipelines are fully independent (different APIs, different storage paths, different DB columns) — running them in one button cannot cross-contaminate audio.
- If one side fails, the other still lands; failed side shows retry button per clip.

### Technical notes
- LALAL.AI `phoenix` splitter chosen for highest music-preservation quality on voice-dominant clips.
- Voice Isolator + Voice Changer chain adds ~2–4s per clip but eliminates background bleed in redub.
- `music_audio_paths` and `redub_audio_paths` are indexed by clip index so timeline reassembly is O(1).
