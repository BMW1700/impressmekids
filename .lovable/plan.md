## Plan

1. **Fix the actual asset shown in the screenshot**
   - The screenshot is showing Benny’s **idle sprite**, not the walking sprite.
   - Rebuild/clean `benny-idle-sprite` first, because that is what is currently producing the ugly dotted/dirty edge on the yellow/white background.

2. **Apply the same background-compatibility cleanup to every Benny pose**
   - Reprocess the transparent edges for:
     - idle sprite sheet
     - walking sprite sheet
     - idle still PNG fallback
     - celebrate PNG
     - sad PNG
   - Use the same kind of edge cleanup that worked for the other character: hard alpha cleanup, matte/halo removal, and color decontamination on semi-transparent border pixels.

3. **Preserve all sizing and animation contracts**
   - Keep the existing frame counts and cell sizes so the current React/CSS animation code does not break:
     - idle: 30 frames, 420×450-style aspect
     - walk: 24 square frames
   - Replace only the CDN asset pointers after regenerating the corrected PNGs.

4. **Stop showing contaminated transparent pixels**
   - Remove near-transparent dark/white fringe pixels instead of leaving them blended into the character edge.
   - Clean the edge against both bright/yellow/white backgrounds and dark backgrounds, not just black.

5. **Verify visually before calling it fixed**
   - Generate quick QA composites of Benny over:
     - white
     - yellow scene background
     - green
     - dark/space background
   - Confirm there is no dotted outline, box, matte, or halo.
   - Then update the asset JSON pointers used by `BennyDog.tsx` and `NabuScene.tsx`.