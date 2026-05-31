# Fast-Mode Multi-Word Chaining — Final-Result Path

## What's actually broken

Last fix only patched the **interim** result branch (line ~965). But when a kid reads "cat dog sun moon star" in one breath without pausing, Web Speech often skips interim entirely and delivers the whole utterance as a single **final** result.

The final path goes through `processResult` (lines 772–853). It:
1. Splits the transcript into words.
2. Finds the **first** word that matches the current target.
3. Fires `handleCorrect` for that one word.
4. Returns.

The other 4 spoken words are thrown away. That's why Elara/Cypher still feel slow — chaining only works if interim fires word-by-word, which it often doesn't.

## File
`src/components/aura/game/rpg/RPGWordReader.tsx` — only `processResult` (lines 772–853). No other changes.

## Change (surgical, fast-mode only)

In `processResult`, after the existing first-word match succeeds **and** `mode === 'fast'` **and** it routed to `handleCorrect` (not retry), continue walking the remaining transcript words against the *advancing* virtual target — same pattern as the interim branch:

1. Find the index `s` of the matched spoken word in `wordsSpoken`.
2. Set `virtualIdx = wordIndex + 1`, `virtualTarget = getTargetWord(virtualIdx)`.
3. Loop `wordsSpoken[s+1..]`:
   - If `isWordMatchLenient(word, virtualTarget)` → queue with `setTimeout(..., firedFollowups * 170ms)`.
   - Each queued callback re-validates session, `currentIndexRef.current === queuedIdx`, live target still equals queued target, and re-runs `isWordMatchLenient` — any mismatch → no-op.
   - Increment `virtualIdx`, refresh `virtualTarget`.
4. Stop at first non-match (don't skip words — kid must read in order).
5. Normal characters: behavior unchanged (gated by `mode === 'fast'`).

## Why this is safe

- Synchronous first-word path is byte-identical to today.
- Queued follow-ups use the exact same `handleCorrect` and the same ref guards used by the interim chaining branch.
- Re-validation at fire time means a pause, batch swap, or retry state aborts queued matches cleanly.
- Retry attempts (`isRetryAttemptRef`/`!canRetryRef`) skip chaining entirely — they only get one word per attempt, same as today.
- Alternatives path (lines 801–810): if the match came from an alternative rather than the main transcript, skip chaining (we don't have a reliable spoken-word index in the alternatives stream). This keeps the change conservative; main transcript matches are the common case.
- Echo retry, incorrect-word handling, and final-result dedup (`processedFinalsRef`) are untouched.

## Verification

- `tsc --noEmit` clean.
- Elara: speak "cat dog sun moon star" in one breath without pausing → all 5 register within ~700ms.
- Elara: speak one word at a time → identical to today.
- Elara: speak "cat dog WRONG moon star" → cat + dog register, then reader stays armed on word 3.
- Normal character (Wizard, etc.): zero change — final path still matches one word at a time.
- Retry attempt: still single word, no chaining.
