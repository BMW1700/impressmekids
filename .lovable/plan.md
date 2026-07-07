## 1. Force dark styling on the Pre-K / RPG World Map cards

In `src/components/aura/game/rpg/RPGWorldMap.tsx` the whole map assumes a dark background, but each `Card` uses shadcn's `bg-card` token. In light mode that token resolves to near-white, so the pink gradient overlay produces the washed-out pastel cards seen in the screenshot; in dark mode `bg-card` is the deep slate that looks correct.

Fix: add the Tailwind `dark` class to the map's root wrapper `<div>` (line 334) so every shadcn primitive underneath — Card, DropdownMenu, etc. — resolves its semantic tokens against the dark palette regardless of the user's app theme. This keeps light mode intact everywhere else on the platform and matches the design goal of "keep them as they are in dark mode".

No other component styling changes — the existing gradient overlays, borders, and text tokens are already tuned for the dark surface.

## 2. Fix the Retry button on the word-feedback overlay

In `src/components/aura/game/rpg/RPGWordReader.tsx`:

- `handleTryAgain` (line 657) currently sets `setRecognitionState('listening')` and calls `startRecognitionRef.current?.()`, but it does NOT reset `isWordTransitioningRef.current` or re-arm the speech target token. Because `handleIncorrectFinal` called `stopRecognitionSession()` (which flips `shouldBeListeningRef` false) and the target-arm `useEffect` only re-runs when `currentIndex`/`cleanWord`/`wordsKey` change — and none of those change on a retry — the newly-started mic can start listening but the next matching transcript is rejected by the "target not armed" guard at line 882-891, so "nothing happens" when the child says the word again.

  Fix inside `handleTryAgain`:
  1. Explicitly re-arm the speech target token for the current word: bump `speechTargetTokenRef.current.id`, set `generation = wordGenerationRef.current`, `index = currentIndexRef.current`, `word = getTargetWord(currentIndexRef.current)`, and `armedAt = Date.now() + WORD_TRANSITION_ARM_MS_NORMAL` (or the fast constant when `mode === 'fast'`).
  2. Set `isWordTransitioningRef.current = false` (after a matching short timeout, mirroring the pattern at lines 287-298) so `processResult` no longer bails out.
  3. Clear `processedFinalsRef.current` and `batchCompletedRef.current` guards so a fresh final transcript is accepted.
  4. Set `shouldBeListeningRef.current = true` before calling `startRecognitionRef.current?.()` (belt-and-suspenders; `startRecognitionSession` already does this, but the ref may have been read stale by an in-flight `scheduleRestart`).

- After the fix, a successful retry already routes through `handleRetrySuccess` (line 954-962) which advances to the next word (YELLOW result, no coins) — matching the requested "move the game forward" behavior.

## 3. Show only "Skip" on a failed retry

Currently `WordFeedbackOverlay` receives `canRetry={canRetry}`. On the second miss `processResult` falls into `handleIncorrectFinal` again, which reopens the overlay — but `canRetry` state was set to `false` by `handleTryAgain`, so the Retry button is already hidden. However the "Continue" button still labels as **Skip** — good — and the Hear button remains. That already matches the requested UI:

- First miss: Hear · Retry · Skip
- Second miss (after Retry): Hear · Skip

Verify the overlay renders correctly for the second-miss case (the `canRetry && onTryAgain` gate at `WordFeedbackOverlay.tsx` line ~232 already hides Retry). No overlay code changes needed beyond confirming this branch is exercised once the retry flow above is fixed.

## Verification

- Reload the Pre-K world map in light mode; confirm the four Benny world cards render with the dark slate background and legible white text, matching the dark-mode look.
- In a Pre-K level, intentionally mis-say a word → overlay appears with Hear/Retry/Skip → click Retry → say the word correctly → game advances (yellow result). Then repeat, and on the second attempt say it wrong → overlay reappears with only Hear/Skip.

### Technical details

- Files touched: `src/components/aura/game/rpg/RPGWorldMap.tsx`, `src/components/aura/game/rpg/RPGWordReader.tsx`.
- No DB, RLS, or edge-function changes.
- No changes to `WordFeedbackOverlay.tsx` — it already conditionally hides Retry when `canRetry` is false.
