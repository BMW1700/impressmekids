# Benny Voice Redub + Clip Micro-Splice + Waveform Fix

Three connected upgrades that make the Pre-K editor production-ready for App Store launch:

1. **Bulk-redub every Benny clip** with your cloned ElevenLabs voice (fixes voice inconsistency between clips)
2. **Micro-splice tool** on the Video lane (cut out stuttered/repeated words in source clips before redubbing)
3. **Waveform for the Video track** (see the source Benny audio you're aligning to)

## Flow when you use it

```text
For each Benny clip in a level:

  [Source mp4]  ─► See waveform in Track 1  ─► Spot a stutter
                                                     │
                                                     ▼
                                        Micro-splice: mark in/out, "Cut"
                                                     │
                                                     ▼
                                          New trimmed mp4 in storage
                                                     │
                                                     ▼
                                    Click "Redub this scene"
                                                     │
                                                     ▼
                       Browser extracts audio → Edge fn → ElevenLabs STS
                       model: eleven_multilingual_sts_v2
                       voice: <cloned Benny voice id>
                                                     │
                                                     ▼
                       Clean, consistent Benny voice, identical timing
                                                     │
                                                     ▼
                   Stored at redubs/<levelId>/<sceneKey>.mp3
                   Plays as synced track over the muted source video
```

Lip-sync survives because STS preserves phoneme boundaries from the (now clean) source. Voice identity is consistent because every clip uses the same cloned voice. Repeated words are gone because you cut them before the redub even runs.

## What gets built

### 1. Waveform fix (30-second fix, ships first)
- `TimelineCanvas.tsx`: on the Video lane, pass `fallbackVideoUrls[scene.key] ?? videoUrls[scene.key]` into `ClipWaveform`. Signed Supabase URLs return CORS headers; the R2 CDN doesn't, which is why `decodeAudioData` was silently failing and rendering a flat line.
- Result: Track 1 shows the actual Benny audio waveform per scene.

### 2. Micro-splice tool (Video lane)
- New "Splice" mode toggle on each Video-lane clip
- Two draggable handles on the clip: **In** and **Out** (default: 0 and duration)
- Two buttons:
  - **Keep selection** — writes a new mp4 containing only In→Out
  - **Cut selection** — writes a new mp4 with In→Out removed (concatenates the two halves)
- Trim happens client-side using MediaBunny (already in the stack) — no server ffmpeg needed
- New mp4 uploaded to `prek-level-videos/<levelId>/spliced/<sceneKey>-<timestamp>.mp4`
- `prek_words.first_video_url` / `second_video_url` (or `prek_levels.opening_video_url` / `closing_video_url`) is updated to the new path
- Undo: keeps the previous path in a `spliced_history` column so one click restores the original

### 3. Redub Studio (in `AudioMixEditor`)
- Right-side panel: "Benny Voice Redub"
- Voice ID input (persists to `prek_levels.redub_voice_id`, falls back to world default)
- Stability + Similarity sliders (0–1)
- "Mute original video audio when redub exists" toggle
- Per-scene rows: status chip (Original / Redubbed / Regenerating / Failed) + Preview / Redub / Revert buttons
- Bulk buttons: **Redub entire level**, **Revert all**
- Live progress bar via `prek_redub_jobs`

### 4. Edge function `prek-clip-redub`
- Validates caller is super_admin or content_editor
- Calls `https://api.elevenlabs.io/v1/speech-to-speech/{voiceId}?output_format=mp3_44100_128` with `model_id=eleven_multilingual_sts_v2`, `remove_background_noise=true`
- Uploads mp3 to `prek-level-videos/redubs/<levelId>/<sceneKey>.mp3`
- Updates `prek_levels.redub_audio_paths` jsonb with `{[sceneKey]: storagePath}`
- Uses linked `ELEVENLABS_API_KEY` (already provisioned via the connector)

### 5. Client orchestrator `useBennyRedub`
- Per scene: fetches source video → decodes audio via Web Audio API → WAV-encodes (16kHz mono) → base64 → calls `prek-clip-redub`
- Sequential (STS is heavy)
- Updates `prek_redub_jobs` for live progress
- Idempotent — re-run any scene without regenerating others

### 6. Playback swap (student + admin preview)
- `usePreKLevelVideoUrls` gains `redubAudioUrls: Record<sceneKey, string>` when `level.redub_audio_paths` is set
- `usePreKAudioTimelineTransport` gains a virtual "Redub" track injected first, one clip per scene anchored to scene start
- When `mute_source_video_audio` is true AND a redub exists for current scene → source `<video>.muted = true`

## Cost & speed

- STS: ~$0.30 / minute of audio input. Typical 40-clip level (~2.5 min) ≈ **$0.75 per full-level redub**
- Full-level redub end-to-end: **~90 seconds**, one clip at a time with live progress
- Splice: instant (client-side MediaBunny), ~1s upload per new clip
- Waveform fix: zero cost, one line

## Files touched

| File | Change |
|---|---|
| `src/components/superadmin/prek/TimelineCanvas.tsx` | Waveform CORS fix + splice-mode overlay on Video lane |
| `src/components/superadmin/prek/ClipSpliceControls.tsx` | NEW — in/out handles + Keep/Cut buttons |
| `src/lib/preKClipSplice.ts` | NEW — MediaBunny-based client-side mp4 trim/concat |
| `src/components/superadmin/prek/AudioMixEditor.tsx` | Redub Studio panel |
| `src/hooks/useBennyRedub.ts` | NEW — orchestrator |
| `src/hooks/usePreKLevelVideoUrls.ts` | Resolve redub audio URLs |
| `src/hooks/usePreKAudioTimelineTransport.ts` | Inject virtual redub track, conditional source mute |
| `src/lib/preKWavEncoder.ts` | NEW — browser WAV encoder |
| `supabase/functions/prek-clip-redub/index.ts` | NEW — STS proxy + storage upload |
| Migration | `prek_levels.redub_voice_id`, `redub_audio_paths jsonb`, `mute_source_video_audio bool`, `prek_words.spliced_history jsonb`, `prek_redub_jobs` table |

## What we're deliberately NOT doing

- Not muxing redub back into the mp4 (ffmpeg-in-Deno is unreliable; synced audio track achieves identical UX). Baked mp4 export is a follow-up if needed for offline distribution.
- Not doing server-side splice (MediaBunny in the browser is faster and free).
- Not transcribing (STS uses source audio directly as the timing template).
