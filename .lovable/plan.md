# Benny Voice Redub — Speech-to-Speech pipeline

Rebuild every Benny clip's voice using the cloned "Benny" voice in ElevenLabs, without re-recording anything, without breaking lip-sync, and without shuffling audio on the timeline.

## How it works

For each video clip in a Pre-K level:

```text
[Original Benny mp4]
        │
        ▼
  ffmpeg strips audio → clip.wav
        │
        ▼
  ElevenLabs Speech-to-Speech
  model: eleven_multilingual_sts_v2
  voice: <cloned Benny voice id>
        │
        ▼
  New audio, identical timing to original
        │
        ▼
  ffmpeg mux: video stream copy + new audio
        │
        ▼
  Redubbed mp4 in Supabase Storage
        │
        ▼
  Level automatically points at redubbed mp4
```

Lip-sync survives because STS preserves phoneme boundaries from the source. Voice identity becomes consistent across every clip because every clip uses the same cloned voice ID.

## What gets built

### 1. Store the Benny voice per level (and per world)
- `prek_levels.redub_voice_id text` — override per level
- `prek_worlds.redub_voice_id text` — inherited default
- `app_settings` gets a global default too so a brand-new world just works
- Admin UI: voice picker on the level and world edit modals with a "Test voice" button that reads a short sample

### 2. New edge function: `prek-clip-redub`
Input: `{ clipId, sourceStoragePath, voiceId, stability?, similarity_boost? }`
- Downloads the original mp4 from `aura-video` storage
- Runs `ffmpeg -i input.mp4 -vn -ac 1 -ar 44100 -f wav pipe:1` to get clean mono audio
- POSTs the audio to `https://api.elevenlabs.io/v1/speech-to-speech/{voiceId}?output_format=mp3_44100_128` with `model_id=eleven_multilingual_sts_v2` and `remove_background_noise=true`
- Downloads the returned mp3
- Runs `ffmpeg -i input.mp4 -i redub.mp3 -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest output.mp4`
- Uploads to `aura-video/redubs/<levelId>/<clipId>.mp4`
- Writes back to `prek_level_words.redub_video_path` and `prek_level_words.redub_generated_at`

Uses the existing ElevenLabs standard connector (`ELEVENLABS_API_KEY`). No new secrets.

### 3. New edge function: `prek-level-redub`
- Fans out `prek-clip-redub` calls for every clip in a level, concurrency 2
- Streams progress via a `prek_redub_jobs` table row so the UI can poll
- On failure of any single clip, keeps going and marks that clip failed for retry

### 4. Level builder UI (`AudioMixEditor` + `PreKLevelBuilder`)
- New "Redub with Benny" panel
- Buttons: "Redub this clip" / "Redub entire level" / "Redub entire world"
- Live progress bar reading from `prek_redub_jobs`
- Per-clip status chips: Original / Redubbed / Regenerating / Failed
- "Revert to original" button per clip (just clears `redub_video_path`)
- STS tuning sliders (stability, similarity) stored per level, defaults to `stability=0.5, similarity=0.85`

### 5. Playback swap (student side)
- `usePreKLevelVideoUrls.ts` already resolves clip video URLs. Add: if `redub_video_path` is set and file exists, sign that instead of the original. Zero other player changes needed.

### 6. Fix the "flat waveform" bug at the same time
Separate from redub, add a lightweight `prek-video-peaks` edge function that returns 600 downsampled peaks per video so the timeline's Video lane actually shows the waveform (currently blank because of muxed-audio decode failures in the browser). Cached per storage path in a new `prek_video_peaks` table. This gives you a visual reference to confirm STS lined up before publishing.

## Cost & speed

- Speech-to-Speech pricing: ~1000 characters-equivalent per 60s of input, roughly **$0.30 per minute of Benny audio**. A typical level with 40 clips × ~4s = ~2.5 min → **~$0.75 per level redub**.
- ffmpeg mux: 1–3 seconds per clip on a Supabase Edge Function.
- End-to-end wall clock: about **90 seconds to redub a full 40-clip level**.
- Idempotent — re-running the level redub overwrites the previous output.

## What I need from you to build it

1. **The cloned Benny voice ID** from your ElevenLabs account (looks like `abc123XyZ...`). Send it and I'll set it as the workspace default.
2. Confirm you want redubbed files to **replace playback by default** as soon as they're generated (recommended) vs a manual "Publish redub" toggle per clip.

## Technical section

**Files touched**
- `src/hooks/usePreKLevelVideoUrls.ts` — prefer `redub_video_path` when present
- `src/components/superadmin/prek/AudioMixEditor.tsx` — add Redub panel + progress UI
- `src/components/superadmin/prek/ClipWaveform.tsx` — call `prek-video-peaks` first, browser decode as fallback
- `src/pages/superadmin/PreKLevelBuilder.tsx` — voice picker, "Redub entire level" button
- `src/pages/superadmin/PreKWorldsList.tsx` — "Redub entire world" bulk action + world-level voice picker

**New edge functions** (`supabase/functions/`)
- `prek-clip-redub/index.ts`
- `prek-level-redub/index.ts`
- `prek-video-peaks/index.ts`

**Migrations**
- `prek_levels.redub_voice_id text null`, `prek_levels.redub_stability numeric default 0.5`, `prek_levels.redub_similarity_boost numeric default 0.85`
- `prek_worlds.redub_voice_id text null`
- `prek_level_words.redub_video_path text null`, `prek_level_words.redub_generated_at timestamptz null`
- `prek_redub_jobs (id uuid pk, level_id uuid, status text, total int, completed int, failed int, created_at, updated_at, created_by uuid)` with RLS: super_admin + content_editor read/write
- `prek_video_peaks (storage_path text pk, peaks bytea, created_at)` with SELECT to `authenticated`, writes via `service_role` only
- Standard GRANT + RLS on every new public table
- `app_settings` row for global default voice id

**Edge function config**
- All three use existing `ELEVENLABS_API_KEY` from the ElevenLabs connector; no new secrets
- ffmpeg via the standard Deno ffmpeg wasm binding (`https://deno.land/x/ffmpeg`), streamed to avoid loading full mp4s in memory
- `verify_jwt = true` for all three; role check enforces super_admin or content_editor before running redubs

**What we're deliberately not doing**
- Not transcribing the source audio (STS doesn't need it)
- Not manually aligning audio on the timeline (STS preserves timing)
- Not re-encoding the video stream (ffmpeg `-c:v copy` = zero quality loss)
- Not touching the original mp4 files (redubs live in a separate `redubs/` prefix so revert is trivial)
