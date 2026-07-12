
# One-Click Benny: Redub + Music Bed

## The Suno reality check (read this first)

Suno's public API only does **music generation from a prompt**. It does not expose a stem-separation / voice-removal endpoint — what you did in their UI is not something we can call from a backend. If we wire "Suno" into our automation, every scene would get *brand-new AI music that doesn't match the original clip*, which is the opposite of what you want.

To automate exactly what you did by hand (strip voice → keep music + little SFX), we need a real stem-separation API. The two production-grade options:

| Service | Fit for us | Notes |
|---|---|---|
| **LALAL.AI** | Best fit | Documented REST API, splits into `vocals` + `no_vocals` (music + SFX preserved — matches what you described). Pay-per-minute credits, no seat cost. |
| **AudioShake** | Also good | Higher quality on dialogue-heavy sources, enterprise pricing, requires sales contact. |
| Suno API | ❌ won't work | Generation only, no separation endpoint. |

**Recommendation:** ship on LALAL.AI. Same connector pattern as ElevenLabs (API key in Supabase secrets, called from an edge function). If you later get an AudioShake contract, we swap the provider inside one edge function — the timeline, DB, and UI don't change.

I'll ask you to paste a `LALAL_API_KEY` once the plan is approved.

---

## What gets built

### 1. New edge function: `prek-clip-music-extract`
Mirrors `prek-clip-redub` exactly:
- Auth gate (super_admin / content_editor).
- Downloads the source MP4 from `prek-level-videos`.
- POSTs to LALAL.AI split endpoint, polls until `no_vocals` stem is ready, downloads the MP3.
- Uploads to `prek-level-audio` at `music/<levelId>/<sceneKey>-<ts>.mp3`, mirrors to R2.
- Writes path into a new `prek_levels.music_audio_paths jsonb` column.
- Auto-creates a **"Benny (Music)"** track at `track_index = 89` (one below redub's 90) and upserts a `source_kind='music'` clip anchored to the scene — same "fill-scene, aligned to source" behavior as redub.

### 2. Timeline lane pinning
In `TimelineCanvas.tsx`, extend the pinned-lane ordering so the layout becomes:
```
Video (source)
Benny (Redub)   ← track 90, locked, aligned
Benny (Music)   ← track 89, locked, aligned  ← NEW
… user tracks …
```
Both pinned lanes get the purple "🔒 aligned to source" chip. Existing split + drag-trim handles work on the music clips with zero extra code.

### 3. Redub Studio panel — one button, both stems
- Add a "Music" column next to "Redub" showing status + inline `ClipWaveform` for each scene.
- Add a top-level **"Full auto: Redub + Music (this level)"** button that, per scene, runs redub → music extract in parallel (independent API calls, no shared state) and updates progress.
- Per-clip: hover action gets a second button **"Extract music"** alongside the existing "Redub this clip".

### 4. Data + hook wiring
- New migration: `alter table prek_levels add column music_audio_paths jsonb not null default '{}'::jsonb;` (no new grants needed — table already granted).
- Extend `useBennyRedub.ts` → rename internally to `useBennyStems` (keeps the same public surface plus `musicAudioPaths`, `signedMusicUrls`, `extractMusic(scene)`, `extractMusicAll()`, `runFullAuto()`).
- `usePreKAudioMix` already renders any clip on any track — the new track shows up automatically once the edge function inserts it.

### 5. Playback
`usePreKRedubPlayback` already mutes source video audio when the redub track has clips. No change needed — the music lane plays as a normal audio clip through the existing mix engine.

---

## What we are *not* changing
- Splice / trim / delete / drag-to-extend tools — you said current handles are enough.
- ElevenLabs redub pipeline — untouched.
- Prewarm, teach engine, retry-button logic — untouched.

---

## Rollout order once approved
1. You paste `LALAL_API_KEY` when I request it.
2. Migration adds `music_audio_paths`.
3. Edge function `prek-clip-music-extract` deploys.
4. UI: pinned Music lane + Redub Studio "Music" column + "Full auto" button.
5. Smoke test on one Pre-K level: click Full Auto → confirm both lanes populate under the video with waveforms aligned.

---

## Open confirmation before I build
- **Go with LALAL.AI?** (Fastest path. If you'd rather I try to reverse-engineer Suno's web app, I'll flag that as brittle and against their ToS — not recommended for production.)
