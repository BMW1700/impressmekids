## Goals

1. **"my dog" / "your dog"** — make the two scenes mirror each other. "my dog" stays with the blue lead (works today). "your dog" should drop the yellow helper entirely and put the dog **in front of the knight** (right side of the screen) so the knight is the one "with" the dog.
2. **"in the box" / "on the box"** — add a simple brown cardboard box. Character actually hops **into** the box (for `in`) or **on top of** the box (for `on`).
3. **"wash hands"** — replace the abstract wiggle with a proper scene: soap bar + water droplets + bubbles between the character's hands.
4. **"plant seed"** — pot appears in front of the character, a seed drops in, then a flower grows out of it.
5. **"throw ball"** — a baseball appears in the character's hand during wind-up, then flies forward when he throws.

## Approach

All scene props live as small dedicated overlay components in `HelpSceneOverlays.tsx` (same pattern as `BasketballProp`, `DuctTapeProp`, `DogWithLeashProp`). `RPGOneWordReader.tsx` chooses which prop to mount based on the current phrase, and `prekVerbAnimations.ts` continues to drive the character body transform so timing stays synced.

### 1. Dog symmetry

In `RPGOneWordReader.tsx`:
- For `"your dog"`: do **not** set `helperVisible`, do **not** set `helperOffsetX`. Remove the helper logic from this branch.
- Render the `DogWithLeashProp` for `dogStage === "your"` inside the **knight's** column (right side) instead of the lead column. Position it just to the left of the knight so it sits in front of him.
- Knight gets a small "look down at the dog" reaction (subtle scale/tilt) keyed off `dogStage === "your"`, mirroring how the blue lead behaves during `"my dog"`.
- `holder="left"` for the knight version so the leash arcs up toward the knight's hand; tune `rightPct` / `leashAngleDeg` so the leash visibly ends at the knight's hand.

### 2. Box scene (`in the box`, `on the box`)

New `BoxProp` in `HelpSceneOverlays.tsx`:
- Simple flat brown cardboard box rendered with two divs (front panel + top flap shadow). Sits on the ground next to the lead.
- Optional `opened` prop — when `"in"` resolves, the top flaps stay open and the character animates down into it; we also fade the character behind the front panel at the end so it reads as "inside".

In `prekVerbAnimations.ts`:
- `"in the box"` — keep the existing shrink + descend transform but time it so the character lands inside the box footprint. Reduce horizontal travel so the character ends centered over the box.
- `"on the box"` — change to a clear two-hop arc that ends elevated on top of the box (`y: [0, -20, -45, -55, -55, -55]`), no shrink.

In `RPGOneWordReader.tsx`:
- New `boxStage: null | "in" | "on"` set/reset alongside the existing `dogStage` pattern.
- Mount `BoxProp` next to the lead character whenever `boxStage` is set, with opened flaps for `"in"` and closed flat top for `"on"`.

### 3. Wash hands

New `WashHandsProp` overlay anchored at the character's hands:
- Small white/pink soap bar in one hand.
- Three bubble circles that scale-in, drift up, and pop in a loop.
- Two blue water droplets falling from above the hands.

Update `"wash hands"` in `prekVerbAnimations.ts` to a gentle side-to-side hand-scrub motion (keep current wiggle but tone it down) timed to the new overlay's ~2s duration. Mount overlay via a `washing` boolean toggled in `RPGOneWordReader` exactly like `dogStage`.

### 4. Plant seed

New `PlantSeedProp` overlay:
- Brown terracotta pot on the ground next to the lead.
- A tiny brown seed that animates from the character's hand down into the pot.
- After the seed lands, a green stem grows up out of the pot and a colored flower head pops open.

Update `"plant seed"` in `prekVerbAnimations.ts` so the character bends down (squat) when the seed drops, then straightens as the flower grows — matched to the overlay's three keyframe phases (drop → grow stem → bloom).

### 5. Throw ball

New `ThrowBallProp` overlay anchored at the character's hand:
- A small white baseball with red stitching appears in the lead's hand on wind-up.
- During the forward snap of the existing throw transform, the ball detaches and flies right toward the knight with rotation, then fades.

`"throw ball"` transform in `prekVerbAnimations.ts` stays as the wind-up + snap; only the new prop is added. Mount overlay via a `throwing` boolean in `RPGOneWordReader` keyed to the phrase trigger.

## Files

```text
src/components/aura/game/rpg/HelpSceneOverlays.tsx   add BoxProp, WashHandsProp, PlantSeedProp, ThrowBallProp
src/components/aura/game/rpg/RPGOneWordReader.tsx    move "your dog" to knight column; add boxStage / washing / planting / throwing state and overlays
src/lib/prekVerbAnimations.ts                        retune in/on/wash/plant transforms to match the new overlays
```

## Out of scope

- No changes to speech recognition, scoring, or progression.
- No changes to the help-me / help-you scenes or other verbs.
