

# Add Q-Learning Update to RPG Battle Completion

## Will this break anything?
**No.** The call is fire-and-forget (wrapped in try/catch), uses existing infrastructure (`useMLIntegration` hook already imported), and runs after all critical saves (reading_sessions, aura_records) are complete. If it fails, it logs an error and the battle still completes normally.

## What changes

### 1. Destructure `triggerQLearningUpdate` from the existing hook (line 109)
Change:
```ts
const { saveToAuraRecords } = useMLIntegration();
```
To:
```ts
const { saveToAuraRecords, triggerQLearningUpdate } = useMLIntegration();
```

### 2. Add the Q-learning call after `aura_records` save (after line 1718)
After the `saveToAuraRecords` call and its log line, add:

```ts
// Trigger Q-learning update so the adaptive loop closes in real-time
const phonemePerformance = Object.entries(phonemeAccumulatorRef.current).flatMap(
  ([phoneme, { correct, total }]) => {
    const results = [];
    for (let i = 0; i < total; i++) {
      results.push({ phoneme, correct: i < correct, word: '' });
    }
    return results;
  }
);

if (phonemePerformance.length > 0) {
  const masteredPhonemes = Object.entries(phonemeAccumulatorRef.current)
    .filter(([_, { correct, total }]) => total > 0 && (correct / total) >= 0.85)
    .map(([p]) => p);
  const strugglingPhonemes = Object.entries(phonemeAccumulatorRef.current)
    .filter(([_, { correct, total }]) => total > 0 && (correct / total) < 0.70)
    .map(([p]) => p);

  await triggerQLearningUpdate(
    studentId,
    phonemePerformance,
    masteredPhonemes,
    strugglingPhonemes,
    worldNumber || 1
  );
  console.log('[RPGBattle] Q-learning updated with', phonemePerformance.length, 'phoneme observations');
}
```

### 3. Add `triggerQLearningUpdate` to the useCallback dependency array (line 1735)
Add it alongside `saveToAuraRecords`.

## Why this is safe
- The entire block is inside the existing `try/catch` (lines 1681-1724)
- `triggerQLearningUpdate` in `useMLIntegration.ts` has its own internal try/catch — double-safe
- It runs AFTER `reading_sessions` and `aura_records` saves, so even if it fails, all critical data is already persisted
- No UI state depends on its return value

## What this closes
Right now: Battle → Phoneme Scores → aura_records (saved) → Q-table (NOT updated until next batch train).
After: Battle → Phoneme Scores → aura_records (saved) → Q-table (updated immediately) → Next story recommendation uses fresh data.

