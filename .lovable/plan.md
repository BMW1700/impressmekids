## Problem

Right now every step boundary uses the same opaque black veil. That looks correct between full scenes (action clip → next prompt clip), but it kills the moment between the kid saying the word and the action clip — there should be a quick, clean crossfade there, like the original behavior.

## Fix

In `src/components/aura/game/rpg/NabuVideoAdventure.tsx`, replace the single veil transition with two tiers, chosen by what kind of step boundary we are crossing:

1. **Word → action clip (intra-beat)**
   - Trigger: leaving a `word` step into the next `clip`.
   - Style: quick crossfade between the held poster frame and the new video. No black. ~180 ms in, ~120 ms out, total ~300 ms.
   - Implementation: render the incoming video underneath, fade the outgoing poster/word card out on top. No opaque veil layer involved.

2. **Clip → next clip / Clip → prompt clip (scene change)**
   - Trigger: leaving a `clip` step into another `clip` (e.g. action → next prompt, or grandma ending into completion).
   - Style: the existing no-bleed veil, but as a softer fade (not a hard cut). ~350 ms veil-in, swap src while fully covered, ~350 ms veil-out. Roughly double the intra-beat duration, matching the user's "double the time period" ask.
   - Keeps the guarantee that two different video frames never appear on screen at the same time, which was the original bleed bug.

3. **Clip → word step**
   - Same clip element keeps playing visually; we just freeze on `holdPoster` and fade the word card in over ~200 ms. No veil. (This is already close to correct; just make sure the veil never fires here.)

## Transition selection logic

Add a small helper `transitionKindFor(prevStep, nextStep)` returning one of:
- `"hold"` — clip → word (no veil, just card fade-in)
- `"crossfade"` — word → clip (quick poster-to-video crossfade)
- `"sceneFade"` — clip → clip (longer veil-covered swap, the current behavior)

The runner picks the matching transition when advancing.

## Verification

- Step through the level in the preview: intro → JUMP prompt → word card → JUMP action → … → grandma ending.
- Confirm: word card → action clip is a smooth crossfade with no black frame.
- Confirm: action clip → next prompt clip uses the longer fade and never shows two scenes overlapping (no character bleed).
- Confirm: prompt clip → word card just freezes on the last frame and fades the card in.

No data, asset, or speech-logic changes — transitions only.