## Goal
Make Benny look clean on any background and keep his feet behavior believable:
- No visible background/matte/halo/watermark around Benny.
- No running legs while he is airborne or climbing upward.
- Walking legs only play when Benny is actually traveling along the ground.
- Feet stay planted on the scene baseline during grounded transitions.

## Implementation Plan

1. **Rebuild the walking sprite correctly**
   - Reprocess the uploaded Benny walk video with the same successful transparent-sprite approach used for the other realistic character.
   - Remove the black/white matte fringe and the visible lower-right “runway” watermark/text from every frame.
   - Re-anchor each frame so Benny’s lowest visible foot pixel sits on the bottom baseline of the sprite cell.
   - Keep the output as a transparent PNG sprite sheet for Safari/iPad compatibility.

2. **QA the asset before wiring it in**
   - Generate quick test composites over:
     - white/light background
     - yellow scene background
     - dark background
   - Check that there is no box, halo, gray outline, leftover watermark, or floating-foot padding.

3. **Update Benny’s animation state logic**
   - Ground movement: use the walking-leg sprite only for horizontal/grounded travel.
   - Airborne movement: use Benny’s idle/tail-wag/blink sprite while the whole character follows the jump arc.
   - Climb/upward movement: use the still/idle sprite instead of running legs.
   - This matches your instruction: if he is up in the air, he can move as a still animated Benny, but his feet should not run.

4. **Fix the baseline/feet placement**
   - Add a single baseline anchor for the walk sprite in both render paths:
     - standalone `BennyDog`
     - `NabuScene`’s SVG/foreignObject render
   - Ensure walk frames do not rise above the ground because of transparent padding inside the sprite cell.

5. **Replace the asset pointer only after the new sprite passes QA**
   - Upload the corrected transparent sprite through Lovable Assets.
   - Replace `src/assets/benny-walk-sprite.png.asset.json` with the new pointer.
   - Do not touch unrelated game logic.

## Technical Details
- The main code changes will be in:
  - `src/components/BennyDog.tsx`
  - `src/components/aura/game/rpg/NabuScene.tsx`
  - `src/assets/benny-walk-sprite.png.asset.json`
- I’ll change jump/hop/climb scene calls so `action="jump"` / `action="climb"` no longer display cycling running legs.
- The walking sprite animation will restart cleanly when entering a grounded transition, but will not play during the solved pause.