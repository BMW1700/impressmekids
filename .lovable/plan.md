## Plan

I will implement the new Benny level using the six uploaded videos in the exact order you gave, and I will change the runner so transitions never crossfade two different videos on top of each other.

## Clip order

1. `My_Movie_37_2-2.MOV` — intro, non-interactive, fades into current first obstacle video
2. `Initial_Scene_-_2026-06-10_202606101735-2.MOV` — Benny reaches the log and asks how to move it
3. `Initial_Scene_-_2026-06-10_202606101735_2-2.MOV` — action clip after the user says `PUSH`
4. `Initial_Scene_-_2026-06-11_202606102216-2.MOV` — Benny reaches the sleeping bear and asks what to do
5. `Initial_Scene_-_2026-06-11_202606102216_2-2.MOV` — action clip after the user says `SNEAK`
6. `Untitled_Scene_06-10_22_46_21_202606101850-2.MOV` — grandma house ending, non-interactive, then level-complete award screen

## What I will change

- Upload the six MOV files as Lovable CDN assets, not raw repo files.
- Add asset pointers under `src/assets/`.
- Update `src/data/preKAdventuresVideo.ts` so World 101 Level 1 becomes:

```text
intro clip
push prompt clip
word: PUSH
push action clip
sneak prompt clip
word: SNEAK
sneak action clip
grandma ending clip
completion popup
```

- Keep only `PUSH` and `SNEAK` as interactive word cards for this version.
- Replace the current overlapping video crossfade behavior in `NabuVideoAdventure.tsx` with a no-bleed transition system:
  - never render outgoing and incoming videos at the same time
  - fade an opaque transition veil up first
  - swap the video source only while the veil is fully covering the stage
  - fade the veil back out after the new video is ready
  - keep the word prompt frozen on the actual final frame of the prompt clip
- Preserve the existing microphone / word-recognition flow and level completion logic.

## Technical guardrail for the bleed bug

The current runner uses overlapping `AnimatePresence` video layers, which can show the outgoing clip’s final frame while the incoming clip fades in. I will remove that overlap for clip-to-clip changes and use a single active video layer plus an opaque fade veil, so a character/frame from one scene cannot visually bleed into the next scene.

## Verification

- Confirm all six uploaded clips are referenced in the correct order.
- Confirm the runner no longer overlaps two video elements during transitions.
- Run a targeted code check/search to ensure the old overlapping video transition pattern is gone.