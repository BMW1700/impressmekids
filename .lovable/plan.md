## Brutally honest audit

The retry flow is still fragile for two separate reasons:

1. **The reader can restart the mic before the browser has fully ended the old speech session.** The current `Retry` handler flips state and calls `startRecognitionRef.current?.()` immediately after `stopRecognitionSession()` was called on the miss. In Web Speech, `stop()` finishes asynchronously. Because `isRecognitionRunningRef` can still be true for a moment, the retry start call can be ignored, leaving the UI saying it is listening while no useful recognition result is processed.

2. **Pre-K/Benny video mode never receives retry-success continuation.** `RPGWordReader` has an `onRetrySuccess` callback, but `YubiVideoAdventure` only passes `onResult` and `onMiss`. So when a child misses, taps Retry, then says the word correctly, the reader marks it retried internally but the story parent does not advance or save that retry success as a resolved second attempt.

3. **Scoring/data currently treats retry success inconsistently.** Battle mode counts the first miss immediately, then retry success heals a little but does not count as a correct first-try reward. That is directionally right, but the data model does not explicitly distinguish `missed_then_retried_correct` from a final skip in parent-level telemetry, especially in Pre-K video mode.

## Plan

1. **Harden `RPGWordReader` retry restart**
   - Replace the immediate retry start with a deterministic restart sequence:
     - fully abort/clear the stale recognition instance,
     - re-arm the same target word,
     - reset processing/final-result guards,
     - set `shouldBeListeningRef.current = true`,
     - start recognition after the stale session has had a short tick to end.
   - Make failed retry show the same overlay with **Skip only**, not another retry.
   - Keep successful retry advancing to the next word/batch.

2. **Add explicit retry outcome callbacks**
   - Extend the reader callback path so parent components can know:
     - first attempt miss happened,
     - retry succeeded,
     - skip/final miss happened.
   - Keep existing `onResult`, `onMiss`, and `onRetrySuccess` compatible so other modes don’t break.

3. **Fix Benny/Pre-K video continuation**
   - Pass `onRetrySuccess` into `YubiVideoAdventure`.
   - On retry success, advance the story exactly like a resolved correct word, but submit telemetry with:
     - `matched: true`,
     - `attempts: 2`,
     - `retried: true`,
     - `first_attempt_missed: true`,
     - reduced score credit compared with first-try correct.
   - On skip, submit as a final miss/auto-pass with worse score impact.

4. **Make scoring honest**
   - First-try correct: full credit.
   - Retry correct: partial credit / reduced score impact, no first-try combat rewards.
   - Skip/final miss: lowest credit and remains a missed word.
   - Preserve memory-bank/backend context that the word was missed first and later retried correctly.

5. **Validate with a local mocked speech-recognition harness**
   - Add a focused test/simulation path or use a temporary Playwright script to simulate:
     - wrong final transcript → Retry → correct final transcript → advances,
     - wrong final transcript → Retry → wrong final transcript → overlay returns with Skip only,
     - Skip advances and records lower-credit miss.
   - Verify both `RPGWordReader` and `YubiVideoAdventure` callback behavior.