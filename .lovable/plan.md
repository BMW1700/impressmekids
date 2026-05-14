## Plan

1. **Restore real battle feedback in the Pre-K reader**
   - Add enemy HP state, max HP per lesson, and deterministic damage per correct word.
   - On each correct mic result, trigger enemy hit animation, damage number, HP reduction, screen shake/light attack feedback, and progress toward defeat.
   - Keep Pre-K no-fail behavior: misses should not punish the child or end the lesson; correct reads still visibly damage/defeat the enemy.

2. **Fix the cropped / oversized screen**
   - Make `RPGOneWordReader` fit inside the visible game area instead of adding another full-screen layout inside `AuraPractice`.
   - Remove the extra outer spacing conflict, reduce fixed sprite/card heights, and use responsive `min-h-0`, `h-full`, and compact mobile/tablet sizing so the mic controls stay visible at the current 690×636 preview size.
   - Keep the battle frame visually aligned with the existing RPG screens instead of a huge isolated card that pushes content below the viewport.

3. **Make it feel more “perfect” and consistent with RPG battles**
   - Add an enemy HP bar/nameplate and defeat state.
   - Add clearer “attack on read” visual sequence: hero/knight attacks, enemy flashes, damage floats, HP drops.
   - Improve the current word panel so it is readable but not oversized, and make the embedded mic reader compact enough that the active word, mic button, and progress are all visible without clipping.

4. **Clean integration details**
   - Update Pre-K completion stats to report real damage dealt alongside words/stars, while preserving the existing saved completion flow.
   - Avoid backend/schema changes.
   - Reuse existing `RPGWordReader`, `RPGCharacterSprite`, `VerbAnimationLayer`, and pronunciation/mic logic rather than replacing the mic system.

## Files expected to change

- `src/components/aura/game/rpg/RPGOneWordReader.tsx`
- `src/pages/student/AuraPractice.tsx` only if needed to remove the nested layout/spacing that causes clipping

## Acceptance checks

- Correctly read words visibly damage the enemy and reduce HP.
- Enemy defeat/completion still happens after the lesson.
- At 690×636, the screen no longer cuts off the important controls.
- The mic reader remains present and usable.
- Pre-K worlds still use distinct words/enemies/background themes.