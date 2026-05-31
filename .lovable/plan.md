# Fast-Mode Multi-Word Chaining Fix (Elara / Cypher)

## Goal
Restore the 5-words-in-one-breath behavior for fast-mode characters. Today the interim handler matches the first spoken word, then `return`s and marks the result index as consumed — so words 2–5 of the same breath are dropped.

## File
`src/components/aura/game/rpg/RPGWordReader.tsx` — only the fast-mode interim block (current lines 959–981). No other file touched.

## Change (surgical)
Inside `recognition.onresult`, fast-mode interim branch:
1. Split the transcript into `wordsSpoken` (already done).
2. Walk it against a *virtual* advancing target: after each match, bump `virtualIdx` and refresh `virtualTarget = getTargetWord(virtualIdx)`.
3. **First match** fires synchronously via `handleCorrectRef` / `handleRetrySuccessRef` (unchanged behavior).
4. **Subsequent matches** are scheduled with `setTimeout(..., n * 170ms)` — just past the fast-mode 150ms `feedbackDelay`, so each fires after `isProcessingRef` clears.
5. Each queued callback re-validates at fire time: same session, `currentIndexRef.current === queuedIdx`, live target still matches queued target, and re-runs `isWordMatchLenient`. Any mismatch → no-op (safe).
6. Track `(resultIndex, consumedSpokenCount)` on the recognition instance so a growing interim transcript only consumes newly-spoken words, never the same word twice.
7. `processedFinalsRef.add(i)` only after at least one match fired (preserves duplicate suppression).

## Why this is safe
- Synchronous first match is byte-identical to today's behavior — Elara users who only say one word at a time see no change.
- Queued matches go through the exact same handlers and ref guards (`isProcessingRef`, `isWordTransitioningRef`, `canRetryRef`, `isRetryAttemptRef`, session check).
- Re-validation at fire time means if the kid stops mid-chain, hits pause, or a batch transition happens, queued matches abort cleanly.
- `(resultIndex, consumedCount)` cursor prevents double-firing as the same interim result grows across multiple `onresult` events.
- Retry state is honored: queued matches respect `isRetryAttemptRef` / `canRetryRef` just like the synchronous path.

## Verification
- `tsc --noEmit` clean.
- Pick Elara (fast mode) in LexiQuest. Read 5 words in one breath → all 5 register within ~700ms.
- Pick a normal character → no change.
- Read 1 word at a time → identical to today.
- Read 5 words but say word 3 wrong → words 1–2 register, word 3 fails, words 4–5 don't auto-register (target didn't advance), reader stays armed on word 3. Correct.
- Switch batches mid-chain → queued matches abort via session/index re-validation. Correct.
