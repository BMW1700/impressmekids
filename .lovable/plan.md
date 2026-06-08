## Actual issue

Benny is still reading as unprofessional because the current “legs” are just extra oval shapes placed under the existing image. They are not structurally attached to his body, so they look like pasted-on blobs instead of independently rigged limbs.

Do I know what the issue is? Yes: the rendering needs to become a layered character rig, like the previous head/body approach, not decorative CSS feet.

## Plan

1. **Remove the current fake leg implementation**
   - Delete the oversized `.benny-leg` / `.benny-leg-paw` blob styling from both Benny render paths.
   - Stop clipping the character in a way that makes the lower body look chopped off or detached.

2. **Create a proper attached lower-body rig**
   - Build Benny as layered pieces:
     ```text
     head/body image layer
       fixed hip socket area
         left upper leg + lower paw
         right upper leg + lower paw
       subtle belly/hip cover layer
     ```
   - The hip cover will sit above the leg joints so the legs look inserted into the body, not floating below it.
   - The legs will use Benny-matched colors, shading, and rounded paw shapes, but sized and anchored to his existing seated body proportions.

3. **Anchor legs to the body, not the ground**
   - Each leg’s `transform-origin` will be at the hip socket.
   - The parent leg layer will move with Benny’s body so the legs cannot drift away during scene translation.
   - Foot contact will be simulated with a small two-part rotation, not separate disconnected paw blobs.

4. **Animate only after the word is spoken correctly**
   - `problem`, `ask`, and `reading`: Benny stays idle with no walking leg animation.
   - `solved` and `transition`: legs animate based on the scene action.
   - Walking starts only when the game has accepted the spoken word and Benny is actually moving.

5. **Use action-specific leg motion**
   - **Walk:** left/right legs swing opposite each other from the hips, with paws following the shin.
   - **Jump:** both legs crouch/tuck/extend together so it looks like a jump, not a walk cycle in the air.
   - **Climb:** alternating vertical leg bends while attached to the same hip sockets.

6. **Apply the same rig consistently**
   - Update `src/components/BennyDog.tsx` so standalone Benny uses the same attached leg rig.
   - Update `src/components/aura/game/rpg/NabuScene.tsx` so the adventure scene uses the same attached rig and only activates it during `solved` / `transition`.
   - Keep `NabuAdventure.tsx` phase logic limited to movement states; no extra unrelated changes.

## Acceptance check

- In the screenshot state before movement, Benny should look clean and still.
- After the word is spoken and accepted, the legs should visibly move on their own.
- The legs must remain attached to the body throughout the whole motion.
- No floating feet, no pasted-on blobs, no movement while the child is still reading.