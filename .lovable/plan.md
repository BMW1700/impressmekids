## Plan: make Benny move professionally

The screenshot is happening because the Pre-K scene currently switches Benny to the static `benny-celebrate.png` during `solved` and `transition`. That kills the sprite animation, so he becomes a generic still image while he is supposed to be walking/jumping.

## What I will change

1. **Stop using the static celebrate PNG for movement**
   - During `transition`, Benny will no longer render `celebrate`.
   - He will render an actual animated action state: `walk`, `jump`, or `idle`.

2. **Add explicit Benny action states**
   - Extend Benny mood/action handling from:
     - `idle | celebrate | sad`
   - To:
     - `idle | walk | jump | celebrate | sad`

3. **Use the existing 30-frame Benny sprite sheet for leg motion**
   - The app already has `benny-idle-sprite.png`, a 30-frame strip.
   - I will reuse it as the walking/action sprite instead of swapping to the still celebration image.
   - Walk transitions will animate the sprite sheet quickly with `steps()` so the feet/legs visibly move while Benny crosses the scene.

4. **Make jumps read like a real character jump**
   - For `JUMP` / `HOP` scenes, Benny will use the animated sprite while following a clean arc.
   - Add crouch → stretch → airborne → landing squash using the existing motion wrapper.
   - No detached head/body rig, no Frankenstein split, no generic still pose.

5. **Scene-specific routing**
   - `JumpScene`, `HOP`, obstacle hops: render `jump` during transition.
   - Walk-to-target scenes: render `walk` during transition.
   - Problem/ask/reading: render `idle` sprite.
   - Only brief success flashes may use `celebrate`; not the movement phase.

6. **Polish the visible layout in the screenshots**
   - Keep Benny grounded on the same baseline so he does not float.
   - Reduce the oversized static-center look by letting motion/action drive focus.
   - Preserve iPad-safe CSS sprite animation with `prefers-reduced-motion` fallback.

## Files to update

- `src/components/BennyDog.tsx`
  - Add `walk` and `jump` actions.
  - Add separate CSS keyframes for faster walk and jump/action playback.

- `src/components/aura/game/rpg/NabuScene.tsx`
  - Stop defaulting to `celebrate` during transition.
  - Pass the correct action state into `BennySvgImage`.
  - Replace static transition rendering with sprite-backed walk/jump rendering.

- `src/components/aura/game/rpg/NabuAdventure.tsx`
  - Update mood/action typing so the new states are valid.

## Result

Benny will no longer snap into the static generic picture during action. He will visibly animate from the sprite sheet while walking and jumping, with the movement phase looking like a real game character instead of a still PNG sliding around.