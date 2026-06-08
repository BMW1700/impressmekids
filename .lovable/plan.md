## Plan: make Benny walk professionally only after the word is spoken

I agree with the direction: the current “paw overlay” is not acceptable because it looks pasted on and does not make Benny feel like a real character. I will remove that approach and rig the visible lower body instead.

## What I will change

1. **Remove the fake glowing paw overlays**
   - Delete the current extra paw/foot blobs from `BennyDog.tsx` and `NabuScene.tsx`.
   - Benny should not have translucent pasted-on feet while idle or moving.

2. **Rig Benny’s legs like the previous head/body idea, but only for legs**
   - Keep the real Benny image/sprite as the body.
   - Add two separate animated leg groups anchored at the hip/foot area.
   - Each leg will swing opposite the other: front leg forward while back leg moves back, then swap.
   - Feet will stay grounded during the contact frames so it reads as walking, not floating.

3. **Only animate legs during actual movement**
   - No walking legs during `problem`, `ask`, or `reading`.
   - When the child says/reads the word correctly, the game enters `solved`, then `transition`.
   - Benny’s legs will start moving only for that post-word movement window.
   - After he stops, the legs return to idle/neutral.

4. **Match the movement type**
   - Normal travel scenes: walking cycle.
   - Jump/hop scenes: crouch, airborne tuck, landing stretch.
   - Ladder/climb scenes: alternating climb legs instead of walking in place.

5. **Make it look integrated, not pasted on**
   - Position legs behind/in front of the existing body so they appear attached.
   - Use Benny-matching colors and soft shading.
   - Keep the baseline stable so he does not hover above the grass.
   - Remove idle foot motion so the screenshot state looks clean.

## Technical details

- Update `BennyMood`/action handling to treat movement as explicit actions: `idle`, `walk`, `jump`, `climb`, `celebrate`, `sad`.
- Replace `.benny-action-paw*` CSS with `.benny-rig-leg*` CSS/keyframes.
- In `NabuSprite`, set action based on phase:
  - `problem | ask | reading` → `idle`
  - `solved | transition` → scene action (`walk`, `jump`, or `climb`)
- Update the ladder scene to pass `climb` during transition instead of static idle.
- Keep static celebrate out of movement phases.

## Result

When the child successfully speaks the word, Benny will actually move his legs during the walk/jump/climb animation. Before the word is spoken, he will stay clean and idle with no fake moving feet.