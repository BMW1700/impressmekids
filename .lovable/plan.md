Two surgical fixes in the Pre-K Benny screen. No other files touched.

## 1. White/checkered box behind Benny

Cause: the source PNGs have a white square background baked in (visible in the screenshots). The SVG `<image>` elements faithfully render that white square.

Fix in `src/components/aura/game/rpg/NabuScene.tsx` → `BennyStack`:
- Add `style={{ mixBlendMode: "multiply", isolation: "isolate" }}` to each stacked `<image>`. White becomes invisible against the sky/grass; Benny's colored pixels stay intact.
- Keep existing `opacity` crossfade and `pointer-events: none`.
- Wrapping `<motion.g>` already has no background / padding / border — no further parent changes needed.

If `mix-blend-mode` shows any halo on a particular mood, fall back to the same property on the `<motion.g>` instead of each image — tested visually after the change.

## 2. Mood triggers — only 5 events, otherwise idle

Edit `src/components/aura/game/rpg/NabuAdventure.tsx`:

- Remove the `surprised`-on-new-word flash entirely (delete the `flashMood("surprised", 1000)` block and the chained `armIdleTimers()` setTimeout inside the `phase === "reading"` effect).
- Remove the `sleepy` idle timer.
- Change `thinking` to fire after **8 seconds** of inactivity and **stay** (no auto-revert) until the next answer. Implementation: in `armIdleTimers`, keep only one `setTimeout(() => setBennyMood("thinking"), 8000)`. Clear it inside `handleResult` (already cleared via `clearIdleTimers()`).
- Keep these exactly:
  - correct → `celebrate` 2000 ms → idle
  - wrong → `sad` 1500 ms → idle
  - 8 s no answer → `thinking` (sticky until answer)
  - level complete (`phase === "ending"`) → `cheering` 3000 ms → idle
  - perfect score (`newCorrect === total && total >= 5`) → `excited` 3000 ms → idle
- Remove the 3-streak `happy` branch — collapse to plain `celebrate` for every correct that isn't the perfect-score case.
- Re-arm the 8 s `thinking` timer at the start of each `reading` phase and whenever an answer clears it.

Resulting `Mood` union still includes unused values; leave the type alone to avoid touching `BennyDog`/`NabuScene` types.

## Files touched
- `src/components/aura/game/rpg/NabuScene.tsx` — add `mixBlendMode: "multiply"` to stacked images.
- `src/components/aura/game/rpg/NabuAdventure.tsx` — slim mood state machine to the 5 events above.

## Out of scope
- No changes to `BennyDog.tsx`, asset pointers, scene layout, or game logic.
- No re-upload of PNGs (mix-blend handles the white background without new assets).
