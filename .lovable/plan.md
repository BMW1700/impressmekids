## The emergency — diagnosed

Both problems come from the **same root cause**: published playback and editor preview use **two different audio systems** that don't agree on when a redub starts or ends.

### System A — editor preview (looks and sounds perfect)
Reads `prek_level_audio_clips` on tracks 89/90 with proper `anchor_scene_key`, `trim_start`, `trim_end`, `duration_mode`. Plays via `usePreKAudioTimelineTransport` locked to the timeline playhead. Trims are honored, tails play out naturally, scene changes don't chop audio.

### System B — published/runtime playback (drifts + cuts last word)
`YubiVideoAdventure` runs **two hooks in parallel**:
1. `usePreKAudioMixerRuntime` — correctly reads clips from tracks 89/90.
2. `usePreKRedubPlayback` — a **separate legacy hook** that reads `prek_levels.redub_audio_paths` (scene → single URL) and does `new Audio(url).play()` the instant the scene-start event fires, then `pause()` the instant scene-end fires.

Hook #2 is what's destroying you:

- **3–4 second drift**: `emitScene("start")` fires from a React `useEffect` when `stepIndex` changes — **not** when the swapped video slot actually starts rendering frames. In the editor preview there is one controlled `<video>` scrubbed by the playhead, so audio and video line up. In the runtime crossfade player, `onPlaying` for the incoming slot can arrive 200–800 ms after the effect runs (buffering, decode, network). Hook #2 has already started the redub audio by then. Over 5–7 scenes that compounds into the 3–4 s offset you're seeing.
- **Last word cut before/after a word box**: Hook #2 also **hard-pauses** the audio on `emitScene("end")`. That fires the moment `onEnded` fires on the source video — but the redub's final syllable often has 150–500 ms of tail past the video's cut. The mixer (Hook #1) would let a `fixed`-mode clip play to its natural `trim_end`; Hook #2 overrides that by killing the element. This also explains why even the preview sometimes clips the final word — Hook #2 runs there too.

## The fix — one audio system, gated on real video playback

### 1. Delete `usePreKRedubPlayback` entirely
- Remove the hook file and every import/usage in `YubiVideoAdventure.tsx`.
- Runtime audio (redub + music) is served exclusively by `usePreKAudioMixerRuntime` reading `prek_level_audio_clips`. Preview and production then use the **same data + same trims + same timing rules**.
- `muteSourceVideo` will now key off `mix.settings.mute_source_video_audio` plus the presence of any track-90 clip for the scene (small helper in the mix hook).

### 2. Gate scene-start events on the video actually playing
In `YubiVideoAdventure.tsx`:
- Remove the `useEffect` at line 186 that emits `("start")` on step-change.
- Emit `("start")` from `handleVideoPlaying(slot)` — i.e., only after the swapped-in `<video>` actually fires `onPlaying`. The mixer only starts the redub clip when the corresponding video frame is on screen. Drift → gone.
- Keep `("end")` emission on `onEnded` **but** stop using it to interrupt `fixed` clips (see #3).

### 3. Never hard-cut a `fixed`-mode clip on scene end
In `usePreKAudioMixerRuntime.ts`:
- On `edge === "end"`, only fade `fill-scene` / `fill-level` / `span-videos` clips. Leave `fixed` clips (which is what redub and short SFX are) to finish on their own `trim_end` timer that `playClip` already schedules.
- Result: the redub's final syllable always plays to the end of `trim_end_seconds`, regardless of whether the source video already cut.

### 4. Auto-hold the last video frame while a redub tail is still playing
In `YubiVideoAdventure.tsx`:
- When a clip's `onEnded` fires, check whether any `fixed` clip anchored to that scene on track 90 still has unplayed audio (mixer exposes an `isSceneAudioBusy(sceneKey)` helper — cheap: it's just "is there a clip element still playing whose `anchor_scene_key === sceneKey`?").
- If busy, freeze on the last frame (pause the video, keep it visible) until the audio finishes, then advance. Matches the "extend bar" behavior you already have in the editor.

### 5. Small mixer helper for parity
Add `isSceneAudioBusy(sceneKey: string): boolean` on `PreKAudioMixerHandle`. Uses the existing `clipStatesRef` to check if any element bound to a clip whose `anchor_scene_key` matches is currently `!paused`.

## Files touched

- `src/hooks/usePreKRedubPlayback.ts` — **delete**
- `src/components/aura/game/rpg/YubiVideoAdventure.tsx` — remove hook import + usage, move `emitScene("start")` into `handleVideoPlaying`, add "hold last frame while audio busy" branch in `handleClipEnded`
- `src/hooks/usePreKAudioMixerRuntime.ts` — skip `fixed` clips in the `edge === "end"` fade loop, expose `isSceneAudioBusy` on the handle

## What this does NOT touch

- LALAL / ElevenLabs pipelines (Pro key still required for music).
- Editor UI, splicing tools, drag-to-crop bar, track lanes.
- Database schema.
- Any Pre-K level content, cards, or scene graph.

## Expected outcome

- Published playback matches the editor preview frame-for-frame because both now read the exact same clip data and only start audio once the paired video frame is on screen.
- The redub's final word always plays because `fixed` clips terminate on their own `trim_end`, and the video holds its last frame if the audio hasn't finished — so you'll never again hear a word land after a cut.
