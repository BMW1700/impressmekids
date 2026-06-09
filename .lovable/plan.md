## The whole thing in one sentence

**Play a video. Pause for one word. Play the next video. Repeat until the level is done.**

That's it. No emojis, no dog sprite, no gradient skies, no "scene objects." A level is just a list of video clips with word prompts in between. The kid sees video the whole time — except for the brief pauses where the world freezes on the last frame, the word card pops up, and the kid says the word into the mic. The moment they say it, the next clip plays.

## The data — as simple as it gets

A level is a flat list of **steps**. A step is one of three things:

- `{ kind: "clip", video }` — play a video, advance when it ends.
- `{ kind: "word", word, askLine }` — freeze the world on the last frame of the previous clip, narrate the cloze stem ("I need to..."), show the word card, listen on the mic, advance when the kid says the word.
- `{ kind: "say", line }` — let Benny's voiceover play over the frozen frame (used for the success line *during* the next clip, optional; we may not even need this).

For the trial level "Help Benny visit Grandma!", the steps for the **JUMP** segment become:

```ts
{ kind: "clip", video: L1_clip1 },        // Benny walks up, looks at river
{ kind: "word", word: "JUMP", askLine: "I need to..." },
{ kind: "clip", video: L1_clip2 },        // Benny jumps the river
// ... next pair when you film it ...
{ kind: "clip", video: L1_clip3 },        // Benny sees mud
{ kind: "word", word: "BOOTS", askLine: "My feet need big..." },
{ kind: "clip", video: L1_clip4 },        // Benny stomps through in boots
// ... and so on, then the closing clip ...
```

That's the entire level. Authoring a new level is: film clips, drop them in, list them in order. No engineering.

For this turn, the level array will have the JUMP pair (real clips) followed by four more word prompts (BOOTS, KEY, HOP, BONE) with no clips between them yet — the screen stays on the frozen river last-frame for those prompts until you film more. The AURA grading still runs on every word read.

## The runner — one component, one state machine

`src/components/aura/game/rpg/NabuVideoAdventure.tsx` (new file). One `<video>` element. One state machine that walks the steps array. That's it.

```
loop:
  step = steps[i]
  if step.kind === "clip":  play video, wait for onEnded
  if step.kind === "word":  freeze last frame, speak askLine, show word card,
                            mic listens, submit audio to analyze-aura,
                            advance when accepted (or after 3-strike auto-pass)
  i++
end: call onComplete
```

The video element never unmounts — we just swap `src` and call `play()`. Eliminates black flashes between clips.

## The AURA backend wiring (the non-negotiable part)

Every word read goes through the **same** `analyze-aura` edge function that K-12 uses. The mic captures with `MediaRecorder`, the audio blob is uploaded to the existing `aura-audio` storage bucket, and `analyze-aura` is invoked with `expected_word` + `context: { mode: "prek_video", level_id, step_index }`.

All 4 ML models (phoneme transfer, risk scoring, next-best-action, Bloom's) pick it up automatically because they all consume `aura_recordings` — the same table the rest of the platform writes to. No parallel pipeline. No second source of truth. Parents see the same phoneme heatmap. Teachers see the same risk alerts. This is the unique data spine no competitor has for under-fives.

To keep the kid from waiting 1-3 seconds for the ML round-trip: **optimistic advance**. The instant Web Speech says "yep, that sounded like JUMP," clipB starts playing. `analyze-aura` runs in the background and writes the truthful result to `aura_recordings`. If it later disagrees with Web Speech, we don't undo clipB — we just record the truth. The kid never gets penalized for ML latency; the data is still honest.

COPPA guard: if the student's `aura_recording_consent` is false, we skip the `MediaRecorder` capture and fall back to Web-Speech-only matching for that session. Same guard the rest of the platform uses.

## What I'm building this turn

1. **Transcode the two HEVC `.MOV` uploads to H.264 `.mp4`** (Chrome on Android + many Windows browsers can't play HEVC) — `ffmpeg -an -c:v libx264 -pix_fmt yuv420p -preset slow -crf 22 -movflags +faststart`. Drop audio (TTS narrates).
2. **Upload to CDN** via `lovable-assets create`, write three `.asset.json` pointers (two videos + one last-frame poster).
3. **New file `src/data/preKAdventuresVideo.ts`** — defines `Step` + the W101_L1 level as a steps array.
4. **New file `src/components/aura/game/rpg/NabuVideoAdventure.tsx`** — the steps runner described above, with the AURA pipeline + COPPA guard + optimistic advance.
5. **One-line edit to `NabuEpisodeWrapper.tsx`** — route Pre-K worlds to `NabuVideoAdventure` instead of `NabuAdventure`.

HUD on top of the video:
- back arrow (top-left), level goal pill (top-center), skip (top-right, only during a word step)
- speech bubble for the askLine, only while the cloze stem narrates
- word card + mic + "Hear it" button + 3-strike "Tap to continue" fallback, only during a word step
- progress dots along the bottom

Sparkle ✨ + chime on a correct read. Everything else from the old Pre-K runner is gone.

## Files left untouched (easy revert)

`NabuAdventure.tsx`, `NabuScene.tsx`, `preKAdventures.ts`, the old `river-stream-bg` assets. Nothing else in the app changes — not the world map, not the level select, not the campaign progress, not the Nabu the Owl intro shell, not a single K-12 path.

## Risk callouts (short version)

1. **iOS Low Power Mode** can block muted autoplay. Mitigation: a one-time "Tap to begin" gesture on the very first clip satisfies the user-gesture requirement for the rest of the session.
2. **`MediaRecorder` missing on old iPad Safari** — fall back to Web-Speech-only on those devices (same fallback `AuraPractice` uses today). Game still plays; data quality on those devices is lower.
3. **Clip seams.** Benny needs to be in the same screen position at the cut from clip 1's last frame to clip 2's first frame. I'll eyeball it post-transcode and flag if there's a visible jump.
4. **Bundle weight.** ~6 MB per clip pair. CDN-cached. Fine on wifi/CDN; cellular first-load may want a "Loading the story…" splash later (not this turn).

## Confirmed answers from your last message

- **All 5 word prompts stay in this level** — we'll fill in the missing video clips as you film them, no code change required, just add to the steps array.
- **Every word goes through `analyze-aura` + the 4 ML models** — same pipeline as every other mode. Pre-K is now a first-class citizen of the AURA data spine.
- **Authoring a new level is "film clips, drop them in the steps array, ship"** — non-engineers can produce content. That's the unlock that makes this a real curriculum.

That's it. One video element, one steps array, one state machine, full AURA backend. Ready when you are.
