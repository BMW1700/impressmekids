# Keep the mic on across 5-word batches

## Goal
Once the student turns the mic on, it stays on through every 5-word batch until the student explicitly turns it off (or the turn/battle ends). No more re-clicking the mic when the next 5 words appear.

## Root cause (confirmed by audit)
In `src/components/aura/game/rpg/RPGWordReader.tsx`, all three batch-complete branches call `stopRecognitionSession()` and set `recognitionState` to `'idle'` right after firing `onBatchComplete`. `RPGBattleArena.tsx` then advances `batchStartIndex` and feeds the next `currentWordBatch` into the reader — but the live `SpeechRecognition` instance was already torn down, so the student must click the mic again.

The reader is NOT remounted between batches (no changing `key`), and the existing `wordsKey` effect already resets visual state without touching recognition. So if we simply stop killing the mic at batch end, the next batch will be heard immediately.

## Changes (1 file)

**`src/components/aura/game/rpg/RPGWordReader.tsx`** — In each of the three batch-complete branches (~lines 271–279, ~381–389, ~504–516):
- Keep: `onBatchComplete?.(results)`, reset `currentIndex` / `currentIndexRef` to 0, clear `wordResults`, `completedWords`, feedback, and `processedResultsRef`.
- Remove: the `stopRecognitionSession()` call and the `setRecognitionState('idle')` call.
- Result: the live recognition instance keeps running into the next batch.

Add one small guard:
- A `batchCompletedRef` (boolean) that flips true when `onBatchComplete` fires and resets to false on `wordsKey` change. Prevents a late duplicate final transcript from firing `onBatchComplete` twice while the new batch is rendering.

## What stays untouched (safety)
- `RPGBattleArena.tsx` — no changes.
- Mic toggle button — still stops on user click.
- `disabled === true` force-stop effect (~line 906) — still stops mic for enemy turns, mini-games, battle end.
- `speechSessionIdRef` / `isCurrentSession()` guards, `isRecognitionStartingRef` debounce — untouched.
- `speechRecognitionManager.ts`, `micDiagnostics.ts`, all mini-games — untouched.

## Validation
1. Click mic, read 5 words → next 5 appear → confirm mic stays in `listening` state without another click; reading continues.
2. Click mic while listening → mic stops (and stays off until clicked again).
3. Trigger enemy turn / mini-game → existing `disabled` path still stops the mic.
4. Player turn returns → current behavior preserved (no surprise auto-resume across turns; that's a separate request if wanted).

## Risk
Low. Most likely failure mode is a stale transcript from batch N bleeding into batch N+1 — mitigated by the existing session-id guard plus the new `batchCompletedRef`. Easily reversible.
