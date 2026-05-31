## Plan

### 1. Fix Elara/Cypher 5-word burst registration for real
The current fast-mode path still behaves like five tiny single-word reads. Worse, the queued follow-up words can fire while the next target is still in its 260ms transition lock, so the queued word silently gets ignored. That explains the screenshot where the fifth word is recognized but remains stuck at 4/5.

I will change `RPGWordReader` so fast mode does not depend on chained `setTimeout` callbacks for a clean 5-word breath.

Implementation:
- Add a dedicated fast-burst matcher for `mode="fast"`.
- Prefer the main transcript first, not alternatives first, so the code knows the spoken word order.
- Starting from the current target, walk the spoken transcript in order and collect every consecutive correct target word.
- Apply the collected run as one burst:
  - mark all matched words completed,
  - call `onResult(true, spokenWord, wordIndex, responseTimeMs)` for each word,
  - update the visible word queue/results immediately,
  - advance to the next unread word or complete the batch.
- Remove/stop relying on the fragile 60ms follow-up timers for fast mode.
- Keep normal characters unchanged.
- Keep miss behavior strict: if word 3 is wrong, words 4–5 do not auto-register.
- Keep retry behavior single-word only.

Expected result:
- If the reader says all 5 words correctly in one breath, all 5 register without stopping and without repeating word 5.
- If only 4 words are correct, it stops cleanly on word 5.
- If the browser final transcript arrives after interims, it will not double-count words.

### 2. Fix stale batch-complete data
`RPGWordReader` currently builds batch-complete results from React state, which can lag behind rapid fast-mode updates.

Implementation:
- Add a ref-backed latest results map.
- Update that ref synchronously whenever a word is marked correct/missed/retried.
- Use the ref, not stale state, when calling `onBatchComplete`.

Expected result:
- The last word in a 5-word burst is included reliably.
- Batch completion does not depend on React state timing.

### 3. Make the victory arena stop looking like a placeholder
The current post-boss arena is basically a huge empty gradient, skyline bars, and two placeholder rectangle fighters. I will replace the presentation layer with a polished reward arena while keeping the same bonus battle mechanics.

Implementation:
- Rebuild `RPGVictoryArena` layout so the fighters are centered in an actual arena scene instead of floating at the bottom of a mostly empty screen.
- Add a real stage: floor plane, crowd silhouettes, spotlights, banners, world-completion header, compact HP bars, and responsive safe-area spacing.
- Replace the placeholder rectangle fighters by either:
  - using existing RPG character styling/components where practical, or
  - upgrading `RPGArenaFighter` into a much more polished stylized fighter with limbs, stance, shadows, hit/block/special states, and better scale.
- Keep controls large and iPad-friendly.
- Keep the existing reward flow: fight, victory/defeat, claim/continue.

Expected result:
- The post-boss arena looks like an intentional reward mode, not unfinished test UI.
- It works on desktop and iPad-sized screens without giant empty space.

### 4. Verify the exact failure cases
After implementation I will verify:
- `lightning_storm` remains non-launchable.
- Elara/Cypher can register a clean 5-word transcript as 5/5 in one burst.
- The fifth word no longer requires repetition.
- Normal mode reading and retries still behave the same.
- Victory Arena renders with a filled, polished composition and no placeholder fighters.