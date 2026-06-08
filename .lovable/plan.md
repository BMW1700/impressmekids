## Plan

1. **Fix the actual asset shown in the screenshot**
   - The screenshot is showing Benny’s **walking/running sprite**, not idle.
   - Repair `benny-walk-sprite` first, because the keyed-out black source removed parts of his eyes, nose, brows, and facial details.

2. **Ground the walking animation**
   - Render the walking sheet as clipped SVG instead of `foreignObject` CSS backgrounds so Safari and Chrome anchor Benny the same way.
   - Offset the walking sheet by the visible bottom pad so Benny’s paws touch the ground line while he runs.

3. **Preserve all sizing and animation contracts**
   - Keep the existing frame counts and cell sizes so the current React/CSS animation code does not break:
     - idle: 30 frames, 420×450-style aspect
     - walk: 24 square frames
   - Replace only the CDN asset pointers after regenerating the corrected PNGs.

4. **Stop showing transparent facial holes**
   - Rebuild the keyed-out facial holes as opaque dark eye/nose/brow pixels.
   - Keep exterior transparency intact and decontaminate antialias edge RGB so the sprite works over bright/yellow/white backgrounds.

5. **Verify visually before calling it fixed**
   - Generate QA composites of every walking frame over the yellow map background with a ground line.
   - Confirm the face no longer has transparent eye/nose holes and paws sit on the ground baseline.
   - Then update the asset JSON pointer used by `BennyDog.tsx` and `NabuScene.tsx`.
   - Confirm the Runway watermark pixels are fully removed from the walking sprite.