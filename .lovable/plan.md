# Redub Studio v2 — Isolate, Auto-Place, Splice

Goal: make the existing Redub Studio produce clean Benny audio even when source clips have background music / secondary voices, and drop the finished redubs straight onto the timeline so they replace the original audio without manual dragging.

Because re-shooting VO3 clips is cheap (~$25–30/level), we treat re-shoot as the fallback for the rare clip Isolator can't save — not the default.

## What ships

### 1. Voice Isolator pre-pass (default ON)
`supabase/functions/prek-clip-redub/index.ts`:
- Before calling STS, POST the source audio to `https://api.elevenlabs.io/v1/audio-isolation` (multipart `audio` field).
- Feed the isolated MP3 bytes into the existing STS call instead of raw MP4.
- Store the isolated MP3 alongside the redub at `redub/<levelId>/<sceneKey>-isolated.mp3` so the editor can preview it and confirm quality before wasting STS credits on a bad isolation.
- Add request fields: `isolate: boolean` (default true), `isolateOnly: boolean` (skip STS, just return isolated audio for preview).
- Return `{ storagePath, signedUrl, isolatedStoragePath, isolatedSignedUrl }`.

### 2. Auto-place redubs on a dedicated timeline track
When STS succeeds, the edge function also:
- Ensures a track named **"Benny (Redub)"** exists in `prek_level_audio_tracks` for this level (create if missing, with `role='dialogue'`, high track_index).
- Inserts a row into `prek_level_audio_clips` for this scene with:
  - `storage_path` = redub MP3 path
  - `scene_anchor_key` = sceneKey, `start_offset_seconds` = 0
  - `duration_mode` = `fill-scene`
  - `volume` = 1.0
- Upserts by `(level_id, track_id, scene_anchor_key)` so re-redubbing replaces the clip in place instead of stacking.

Result: hit "Redub entire level" → every scene gets a clip on the Redub track automatically. No manual dragging.

### 3. Auto-mute the source video's audio on that track
`AudioMixEditor` already has a "Main video audio" concept. Add a per-level toggle **"Mute source video where redub exists"** (default ON when any redub is present). The student player (`YubiVideoAdventure` / `usePreKRedubPlayback`) already mutes source when a redub is available — this just mirrors that into the editor preview so what you hear in the editor matches what students hear.

### 4. Micro-splice handles on Redub Studio rows
Each scene row in `RedubStudioPanel.tsx` gets an expand chevron. Expanded view shows:
- Waveform of the **isolated** audio (uses existing `ClipWaveform`).
- Two draggable handles → `trim_start_seconds` / `trim_end_seconds` on the auto-placed clip row.
- "Re-redub with this trim" button → sends `trimStart/trimEnd` to the edge function, which slices the isolated MP3 with `ffmpeg` (already available in Deno via `npm:fluent-ffmpeg` alt: use the WebCodecs-free `npm:@ffmpeg-installer/ffmpeg` — spawn subprocess) before STS. Fixes the "repeats a word" clips without re-shooting.

### 5. Multi-speaker heuristic warning
After isolation, run a cheap check: if isolated audio RMS in the first 2s vs middle 2s vs last 2s differs by >12dB, OR if isolated file size <30% of source audio size, flag the row with an amber "⚠ Possible multi-speaker / heavy music — preview before redubbing whole level" badge. Doesn't block, just warns.

### 6. Preview isolated vs redubbed vs source
Row gets three tiny play buttons: **Src / Iso / Redub**. Lets you A/B before spending credits on a full-level redub.

## Technical details

**Migration** (one file):
```sql
ALTER TABLE public.prek_levels
  ADD COLUMN IF NOT EXISTS redub_isolated_paths jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS redub_mute_source boolean DEFAULT true;

ALTER TABLE public.prek_level_audio_clips
  ADD COLUMN IF NOT EXISTS source_kind text DEFAULT 'manual'
    CHECK (source_kind IN ('manual','redub'));

CREATE UNIQUE INDEX IF NOT EXISTS prek_audio_clips_redub_uniq
  ON public.prek_level_audio_clips(level_id, track_id, scene_anchor_key)
  WHERE source_kind = 'redub';
```

**Edge function changes** (`prek-clip-redub/index.ts`):
1. Download source (existing).
2. If `isolate !== false`: POST to `/v1/audio-isolation`, capture MP3, upload to `redub/<levelId>/<sceneKey>-isolated.mp3`, patch `prek_levels.redub_isolated_paths`.
3. If `isolateOnly`: return here.
4. Optional trim: shell out to ffmpeg on isolated bytes.
5. POST trimmed isolated MP3 to `/v1/speech-to-speech/{voiceId}` (existing).
6. Upload redub MP3 (existing).
7. **New:** upsert Redub track + clip row via service role.
8. Return both signed URLs.

**Files touched**
- `supabase/functions/prek-clip-redub/index.ts` — isolate + auto-place + trim
- new migration (above)
- `src/hooks/useBennyRedub.ts` — pass `isolate`, `trimStart`, `trimEnd`; expose isolated URLs
- `src/components/superadmin/prek/RedubStudioPanel.tsx` — per-row expand, waveform + handles, Src/Iso/Redub A/B, warning badge, "Mute source video where redub exists" checkbox
- `src/hooks/usePreKAudioMix.ts` — surface auto-placed redub clips (they already load; just tag `source_kind='redub'` in the UI so admin knows not to hand-edit them)
- `src/components/aura/game/rpg/YubiVideoAdventure.tsx` — read `redub_mute_source` to gate the auto-mute (already effectively on; makes it explicit)

## What you'll do after this ships

1. Open any level → Redub Studio → paste world default voice ID once.
2. Click **"Preview isolation"** on 1–2 scenes to sanity-check the model separated Benny cleanly.
3. Click **"Redub entire level"** — clips auto-drop onto the "Benny (Redub)" track, source video auto-mutes.
4. For any flagged/bad scene: expand row → drag trim handles → **"Re-redub with this trim"**. If still bad after two attempts → re-shoot that one VO3 clip (cheap).

## Out of scope this pass
- Muxing MP3 back into MP4 for offline (later; not needed for streaming playback).
- Batch "Redub whole world" button (trivial follow-up once per-level flow is solid).
