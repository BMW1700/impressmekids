I know what the issue is.

The word reader keeps one continuous Web Speech recognition session alive while the parent swaps from one 5-word batch to the next. At the batch boundary, late/interim/final recognition events from the previous word/session can still arrive after `currentIndex` has already reset to `0`, so they get graded against the first word of the new batch. That triggers `echo_retry` immediately and then marks the first new word wrong before the student gets a fair chance to speak.

Plan to fix it:

1. Harden `RPGWordReader.tsx` with a per-word guard
   - Add a current target token/ref containing: word generation, word index, expected word, and `armedAt` timestamp.
   - Increment the token whenever the active word or batch changes.
   - Ignore speech events that arrive before the new word is armed, belong to an old token, or contain an empty/stale transcript.

2. Reset speech recognition safely at batch boundaries
   - When the 5th word completes, abort the current recognition session instead of leaving it continuously active with pending browser results.
   - Automatically restart recognition after the next batch has rendered, so the mic still feels continuous and the user does not need to toggle it manually.
   - Use `abort()` for boundary resets to discard pending stale final transcripts; keep normal stop behavior for intentional pause/disabled states.

3. Remove premature wrong-marking during transitions
   - Block `startEchoRetry` and `handleIncorrectFinal` while a batch/word transition is in progress.
   - Clear echo timers, processed final result tracking, feedback, retry state, and pending incorrect state when the batch changes.
   - Prevent fast-mode interim processing from grading during the short transition arm window.

4. Keep battle batch advancement aligned
   - Ensure only the intended final word result advances `batchStartIndex` once.
   - Avoid duplicate late `wordIndex === 4` callbacks from advancing the parent batch twice.

5. Validate with targeted checks
   - Confirm the first word of a new 5-word batch waits for fresh speech.
   - Confirm Elara/Cipher fast mode still recognizes correct interim matches quickly after the arm window.
   - Confirm a real wrong answer still enters echo retry normally, but not automatically on batch transition.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>