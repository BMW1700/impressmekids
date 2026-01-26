
# Plan: Fix Yellow Word Retry System

## Problem Summary
When a student gets a word wrong, clicks "Try Again", and reads it correctly:
- **CURRENT**: Word turns GREEN (wrong)
- **EXPECTED**: Word turns YELLOW (retried success)

The root cause is a race condition where `canRetryRef.current` is not updated synchronously before recognition restarts.

## The Fix

### File: `src/components/aura/game/rpg/RPGWordReader.tsx`

**Change 1: Synchronously update `canRetryRef` in `handleTryAgain`**

In the `handleTryAgain` function (around line 357-369), add a synchronous update to `canRetryRef.current`:

```typescript
const handleTryAgain = useCallback(() => {
  if (!pendingIncorrectWord) return;
  
  setShowFeedbackOverlay(false);
  setFeedback(null);
  setSpokenText("");
  setCanRetry(false); // Only one retry allowed per word
  canRetryRef.current = false; // <-- ADD THIS LINE: Synchronous update!
  isProcessingRef.current = false;
  
  // Stay on the same word index
  setRecognitionState('listening');
  startRecognitionRef.current?.();
}, [pendingIncorrectWord]);
```

This ensures that when `processResult` runs after recognition restarts, `canRetryRef.current` is already `false`, so the check on line 564 (`if (!canRetryRef.current)`) correctly routes to `handleRetrySuccess` instead of `handleCorrect`.

**Why this works**: React state updates are asynchronous and batched, but refs are synchronous. By updating the ref directly, we guarantee the value is correct when checked in `processResult`.

---

## Verification of Other Features

### Boss Rush Mode: ✅ Already Working
- `RPGBossRush.tsx` exists with full 9-boss queue
- `useBossRush.ts` hook manages state and database
- "⚔️ BOSS RUSH" button appears in world map after World 8 completion
- No changes needed

### Boss Silhouettes (Worlds 5-8): ✅ Already Working
- All 4 new silhouettes (EchoWraith, Zephyr, Leviathan, WordEater) exist in `BossSilhouettes.tsx`
- `RPGWorldMap.tsx` imports and uses them correctly in the switch statement
- No changes needed

### Accuracy Calculation: ✅ Correctly Implemented
- `handleBattleEnd` calculates: `accuracy = correctWords / wordsRead * 100` (capped at 100%)
- When a word is missed, `wordsRead` increments but `correctWords` does not, correctly reducing accuracy
- When a retry succeeds (yellow), neither `wordsRead` nor `correctWords` increments (retries don't count toward accuracy in either direction)
- This is the intended behavior per the memory notes

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/aura/game/rpg/RPGWordReader.tsx` | Add `canRetryRef.current = false;` in `handleTryAgain` function |

**Lines changed**: 1 line added

---

## Testing Checklist

After the fix:
- [ ] Miss a word → Word turns RED → Feedback overlay appears
- [ ] Click "Try Again" → Read word correctly → Word turns YELLOW (not green!)
- [ ] Yellow word does NOT deal damage or give coins
- [ ] Yellow word triggers HP healing (12.5% of enemy attack)
- [ ] Click "Skip & Continue" → Word stays RED → Enemy attacks
- [ ] Accuracy decreases when words are missed (not when retried)
