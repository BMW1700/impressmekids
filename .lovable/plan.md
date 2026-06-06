I found the likely cause: the new CSS sprite-sheet animation is moving `background-position` to `-2900%`, which is not the same as moving exactly 29 cells on a 30-frame strip. In CSS percentage math, this can overshoot massively, so the background image spends most of the animation outside the visible box. That matches exactly what you’re seeing: characters flash in briefly, disappear, then flash again.

Plan to fix this cleanly:

1. Correct the sprite frame stepping math
   - Change Benny and Valor from percentage-based `background-position: -2900%` to exact pixel-based movement.
   - Use CSS variables like `--sprite-end-x: -8120px` for 29 frames at the rendered size.
   - Animate `background-position-x` from `0px` to `var(--sprite-end-x)` with `steps(29, end)`.

2. Stop hidden Valor states from animating underneath
   - Current Valor renders idle, attack, and hit layers all at once; even invisible layers are still animating.
   - Replace that with one visible active sprite layer so Safari does not waste cycles decoding/compositing hidden sheets.
   - Keep attack/hit replay behavior by changing a key when the mood changes.

3. Add safe image fallback behavior
   - Add poster/still fallback for Valor while sprite assets load or if a sprite URL fails.
   - Add the same safety for Benny inside the SVG scene so he never disappears completely.

4. Keep Benny grounded and stationary
   - Preserve the no-floating idle behavior.
   - Keep the 2-second hold at the final frame after the idle cycle.
   - Make sure the fallback still sits on the same ground baseline.

5. Verify with the preview after implementation
   - Check console/network for missing asset or runtime errors.
   - Check the Nabu/Benny scene and RPG character scene visually.
   - If the preview requires private access and blocks direct testing, I’ll still validate through code inspection and asset request checks, then tell you exactly what could/couldn’t be preview-tested.

This is a targeted emergency repair, not a redesign: fix disappearing/flashing first, preserve the better art only if it is stable.