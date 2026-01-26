
<context>
User requirement (explicit):
- First attempt correct => word shows GREEN.
- First attempt incorrect => word shows RED.
- If incorrect then “Try Again” and correct => word MUST show YELLOW (never green).
- If incorrect then “Try Again” and still incorrect => stays RED.
- Accuracy must be correct (a word that was missed first should count as missed for accuracy even if later corrected on retry).

Current observed problem:
- Words are turning GREEN after a retry-success instead of staying YELLOW.
- Accuracy can be inflated because a “miss then retry-success” currently may never get counted as a miss in the battle stats.
</context>

<what-i-found (verified in code)>
1) A concrete reason retried words can become green (especially for Elara / fast mode):
- In `RPGWordReader.tsx`, the Web Speech `onresult` handler has a “FAST MODE” path that processes interim transcripts.
- That fast path directly calls `handleCorrect(word, wordIdx)` when it sees a match.
- This bypasses the retry logic in `processResult()` that correctly routes retry-success to `handleRetrySuccess()` and sets `result: 'retried'`.
- Result: during a retry attempt, an interim match can incorrectly mark the word as `correct` (green), overwriting the `retried` (yellow) state.

2) A concrete reason accuracy can be wrong (too high):
- In `RPGWordReader`, the initial miss (`handleIncorrectFinal`) does NOT call `onResult(false, ...)` immediately. It waits until the user presses “Continue”.
- If the user presses “Try Again” and succeeds, `handleRetrySuccess` advances without ever calling `onResult(false, ...)`.
- In `RPGBattleArena`, `wordsRead` and `correctWords` only update inside `handleWordResult` (wired to `onResult`).
- So a “miss then retry-success” may never increment `wordsRead`, meaning the miss isn’t counted at all, inflating accuracy.

3) UI coloring logic for retried is already present and correct:
- The dot/word-chip rendering in `RPGWordReader.tsx` already supports `result === 'retried'` => yellow.
- So the core issue is not display; it’s that the state is being set to `correct` (green) in the first place.

</what-i-found>

<goals>
A) Make it impossible for a retry-success to ever be recorded as `correct`.
B) Ensure accuracy counts a “miss on first attempt” as a miss, even if the retry later succeeds.
C) Prevent double-counting a miss (once at “miss shown”, and again on “Continue”).
</goals>

<implementation-plan>
<step 1 — Fix retry-success becoming green (root cause: fast interim path bypass)>
Files:
- `src/components/aura/game/rpg/RPGWordReader.tsx`

Changes:
1. Update the FAST MODE interim-match branch inside `recognition.onresult`:
   - Replace the direct `handleCorrect(word, wordIdx)` call with logic that respects retry state:
     Option A (preferred): call `processResult()` using the interim transcript as input (so retry routing stays centralized).
     Option B: replicate the same conditional used in `processResult`:
       - if `isRetryAttemptRef.current || !canRetryRef.current` => call `handleRetrySuccess(...)`
       - else => call `handleCorrect(...)`

2. Add a processing guard to `handleRetrySuccess` similar to `handleCorrect`:
   - At the start of `handleRetrySuccess`, do:
     - `if (isProcessingRef.current) return;`
     - `isProcessingRef.current = true;`
   Reason: when we start treating interim matches as “real” actions, we must prevent duplicate executions from rapid interim updates.

Expected outcome:
- During retry attempts, even interim matches will route to `handleRetrySuccess` and set `wordResults[wordIndex].result = 'retried'`.
- The state can no longer be overwritten to green by the fast path.

Verification steps (in-app, concrete):
- Run with Elara (mode = fast).
- Intentionally miss a word, click Try Again, then say the correct word.
- Confirm console shows `[RPGWordReader] SET RETRIED (YELLOW)` and the word chip remains yellow after moving to the next word.

</step 1>

<step 2 — Fix accuracy counting for “miss then retry-success”>
Files:
- `src/components/aura/game/rpg/RPGWordReader.tsx`
- `src/components/aura/game/rpg/RPGBattleArena.tsx`

Changes:
1. Add a new callback prop to `RPGWordReader`:
   - `onMiss?: (spokenWord: string, wordIndex: number) => void`
   Purpose: report “first attempt was incorrect” immediately for stats/accuracy, without triggering enemy combat.

2. Call `onMiss(...)` inside `handleIncorrectFinal` right when the overlay is shown (i.e., when the miss is finalized and the user is deciding):
   - This ensures the miss counts toward accuracy even if the user later succeeds on retry.

3. Prevent double counting when the user presses “Continue”:
   - In `RPGBattleArena`, introduce a `countedWordIndicesRef` (Set<number> of global indices) or similar structure.
   - When `onMiss` fires:
     - Compute `globalIndex = batchStartIndex + wordIndex`
     - If not already counted:
       - increment `wordsRead`
       - (optional) reset `streak` to 0 for accuracy consistency (see Step 2.4)
       - mark globalIndex counted
   - When `handleWordResult(false, ...)` fires from “Continue”:
     - Only perform the combat (enemy counter-attack), but do NOT increment `wordsRead` again if that word was already counted by `onMiss`.

4. Streak behavior decision (minimal-change default):
   - Default plan: reset streak on first miss (when `onMiss` fires), because the first attempt was wrong.
   - This matches “accuracy rigor” and avoids a streak staying alive through misses.
   - If you want streak to only break when the enemy actually attacks (on Continue), we can keep streak logic in `handleWordResult(false)` only. (I can implement either; see Clarification question below.)

Expected outcome:
- A miss is counted for accuracy immediately when the miss occurs.
- A retry-success remains neutral (does not add correctWords).
- “Continue” triggers enemy combat but doesn’t inflate wordsRead a second time.

Verification steps (in-app, concrete):
- Start a battle, miss a word, then hit Try Again and succeed.
- Watch accuracy: it should reflect the miss (wordsRead increased, correctWords not increased) even though you advanced.
- Then test miss + Continue: wordsRead should not jump by 2 for the same word.

</step 2>

<step 3 — Safety: ensure “green only on first attempt” is enforced>
Files:
- `src/components/aura/game/rpg/RPGWordReader.tsx`

Changes:
- Add a “never upgrade retried to correct” rule when writing to `wordResults`:
  - In `handleCorrect`, before setting `result: 'correct'`, check if an existing entry is already `missed` for that word index and `isRetryAttemptRef.current` is true; in that case call `handleRetrySuccess` instead (extra belt-and-suspenders).
This is redundant with Step 1, but it protects against future regressions.

Verification:
- Repeat Elara fast-mode test; ensure no path leads to `result: 'correct'` during retry.

</step 3>
</implementation-plan>

<clarifications-needed (only the ones that change behavior)>
1) When a word is missed first try but then corrected on retry, should the streak reset immediately on the miss (recommended), or only if the user presses “Continue” (enemy attacks)?
- Option A: Reset immediately on miss (more “rigorous” and consistent with accuracy).
- Option B: Only reset on Continue (keeps streak until they “accept” the miss).

If you don’t answer, I will implement Option A because it matches your “accuracy must be counted right” requirement and typical “first attempt matters” logic.

</clarifications-needed>

<files-to-change>
- `src/components/aura/game/rpg/RPGWordReader.tsx`
- `src/components/aura/game/rpg/RPGBattleArena.tsx`
</files-to-change>

<risk-and-mitigation>
- Risk: Double counting wordsRead if both onMiss and onResult(false) increment.
  Mitigation: countedWordIndicesRef Set gating increments.
- Risk: fast mode interim results causing multiple triggers.
  Mitigation: add isProcessingRef guard to handleRetrySuccess, and ensure we mark processedResultsRef appropriately.
</risk-and-mitigation>

<success-criteria>
- Retry-success always yields YELLOW word state and never green, including in Elara (fast) mode.
- “Miss then retry-success” decreases accuracy appropriately (miss counted once).
- “Miss then Continue” decreases accuracy appropriately and triggers enemy counter-attack.
</success-criteria>
