## Goal

Fix Benny’s movement without adding extra fake legs or bounce.

Brutally honest: yes, the right fix is not more blob legs. The current issue is that the original sprite legs are still visible, then extra legs are being drawn on top, so he reads as having four legs. I will switch to the same kind of layered cutout approach used for the head: hide the original leg area and place two separated leg layers exactly over the original leg positions.

## Plan

1. **Remove the current added-leg rig**
   - Delete the visible overlay leg blobs from `BennyDog.tsx` and `NabuScene.tsx`.
   - Remove the walking body bounce so Benny does not do the annoying repeated hop.

2. **Mask out the original front legs**
   - Add a lower-body cover/mask layer over the original sprite legs.
   - Match Benny’s belly/fur coloring so the original legs disappear instead of showing behind the animated copies.
   - Keep the paws/body baseline clean so he does not look chopped up.

3. **Create two copied leg layers from the sprite area**
   - Render duplicated sprite layers clipped to the original left/right leg rectangles.
   - Position them exactly where the original legs were before masking.
   - Set transform origins at the top hip area so they swing while staying attached.

   ```text
   body sprite
     + lower-body mask hides original legs
     + left leg cutout, same original position
     + right leg cutout, same original position
   ```

4. **Animate only during actual movement**
   - `problem`, `ask`, `reading`, `solved`: legs stay still, no walk cycle.
   - `transition`: two cutout legs swing opposite each other in a simple walking cycle.
   - No extra bounce unless the scene is explicitly a jump scene.

5. **Fallback if the cutout is not visually clean**
   - If the clipped leg copies look worse than a still character, I will remove the animated leg layers entirely.
   - Benny will move as one polished intact sprite with no fake legs and no bounce.
   - This avoids wasting more time on a bad-looking half-solution.

## Files to change

- `src/components/aura/game/rpg/NabuScene.tsx`
- `src/components/BennyDog.tsx`

## Acceptance check

- Benny does not show four legs at rest or during movement.
- Original legs are hidden before animated copies are shown.
- The copied legs sit in the original leg positions.
- During walking, only the two copied legs swing back and forth.
- No annoying repeated body bounce during normal walking.