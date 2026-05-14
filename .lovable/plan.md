## Plan

Fix the RPG reader so the mic handoff between 5-word batches is reliable without forcing the student to toggle the mic.

## What I found

- The mic is kept alive after word 5, but the speech callback still uses the old batch/state timing while the parent swaps in the next 5 words.
- During that tiny transition window, the first spoken word of the new batch can be treated as stale, ignored, or compared while the reader is still marked as processing.
- There is also an older missed-word path that still sets the reader back to `idle` at batch end, which can force manual mic toggling after certain retry/continue flows.

## Implementation

1. Update `RPGWordReader.tsx` to add a short “batch transition” guard:
   - When a batch completes, keep the mic on but temporarily ignore late final transcripts from the previous batch.
   - Clear that guard immediately when the new `wordsKey` arrives.
   - Do not let the first valid transcript for the new batch be dropped because `isProcessingRef` is still true.

2. Refactor the repeated batch-complete logic into one helper inside `RPGWordReader.tsx`:
   - Deduplicate `onBatchComplete`.
   - Reset `currentIndex`, feedback, spoken text, retry state, and processing flags consistently.
   - Preserve `recognitionState = 'listening'` when the mic should remain active.

3. Fix the `Continue after miss` end-of-batch path:
   - It currently sets recognition back to `idle` after batch completion.
   - Change it to use the same seamless transition helper so the next batch doesn’t require mic off/on.

4. Add lightweight diagnostic logs around batch transition only:
   - Log ignored stale transcripts and accepted first-word transcripts.
   - Keep logs narrow so we can confirm the first word is now routed to the new batch.

## Validation

- Start reading, complete 5 words, continue directly into the next 5 without touching the mic.
- Confirm the first word of the new batch is matched against word 1 of the new batch, not the previous batch.
- Confirm manual pause/resume still works.
- Confirm enemy turn / disabled state still stops the mic as before.