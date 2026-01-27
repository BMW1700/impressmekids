
# Plan: Fix Victory & Defeat Triggers for All Cases

## Problem Summary

1. **Missing Defeat Condition**: When all words are read and accuracy is below 80%, there's no code to trigger the "Try Again" (defeat) screen
2. **Potential Race Condition**: Mini-games that deal fatal damage may not reliably trigger victory due to competing state updates
3. **Duplicate Logic**: Victory checks exist in multiple places (useEffect, returnToReading, etc.) causing potential conflicts

---

## Solution Overview

### Fix 1: Add Defeat Trigger for Low Accuracy

In the existing useEffect (lines 1547-1566), add an `else` branch to trigger defeat when all words are read but accuracy is below 80%.

**Current Code:**
```javascript
if (allWordsRead && currentAccuracy >= 0.8) {
  console.log('[RPGBattle] ✅ All words read with 80%+ accuracy - VICTORY!');
  setPhase('victory');
}
```

**New Code:**
```javascript
if (allWordsRead) {
  if (currentAccuracy >= 0.8) {
    console.log('[RPGBattle] ✅ All words read with 80%+ accuracy - VICTORY!');
    setPhase('victory');
  } else {
    console.log('[RPGBattle] ❌ All words read but accuracy below 80% - DEFEAT!', { accuracy: currentAccuracy });
    setPhase('defeat');
  }
}
```

**File**: `src/components/aura/game/rpg/RPGBattleArena.tsx`
**Lines**: ~1561-1565

---

### Fix 2: Add Failsafe Victory Check After Mini-Game HP Updates

The issue is that when a mini-game deals damage that kills the enemy (HP -> 0), the mini-game completion handler calls `returnToReading()`, but this can race with the useEffect that monitors `enemyHp`.

**Solution**: Add a direct victory check inside each mini-game completion handler BEFORE calling `returnToReading()`, OR update `returnToReading()` to properly handle all mini-game phases.

**Option A (Chosen - Simplest)**: The `returnToReading()` function already has victory checks at lines 254-266. However, it reads `enemyHp` from the closure, which may be stale. We need to use a ref to get the latest value.

**Changes:**
1. Add `enemyHpRef = useRef(enemyHp)` that syncs with `enemyHp` state
2. Update `returnToReading()` to check `enemyHpRef.current <= 0` instead of `enemyHp <= 0`
3. This ensures that when mini-games call `setEnemyHp(0)` then `returnToReading()`, the victory triggers correctly

**File**: `src/components/aura/game/rpg/RPGBattleArena.tsx`

Add after line 172:
```javascript
// Ref to track latest enemyHp for use in callbacks (prevents stale closure)
const enemyHpRef = useRef(enemyHp);
```

Add after line 173:
```javascript
// Keep ref in sync
useEffect(() => {
  enemyHpRef.current = enemyHp;
}, [enemyHp]);
```

Update `returnToReading()` (lines 248-279) to use `enemyHpRef.current`:
```javascript
const returnToReading = useCallback(() => {
  console.log('[RPGBattle] Returning to reading state, enemyHpRef:', enemyHpRef.current, 'isFinalEnemy:', isFinalEnemy);
  speechManager.forceStop();
  
  // Check if we should trigger victory instead - use REF for latest value!
  if (enemyHpRef.current <= 0 && isFinalEnemy) {
    console.log('[RPGBattle] Enemy defeated during mini-game - triggering victory');
    setPhase('victory');
    return;
  }
  
  if (enemyHpRef.current <= 0 && !isFinalEnemy) {
    console.log('[RPGBattle] Enemy defeated - transitioning to next enemy');
    setDefeatedEnemy(enemy);
    setPhase('enemy_transition');
    return;
  }
  
  // Clear any pending state immediately
  setCurrentWordResult(null);
  setEnemyAbilityMessage(null);
  
  setTimeout(() => {
    setPhase('reading');
    setCurrentCommand('read');
    setIsPlayerTurn(true);
  }, 100);
}, [isFinalEnemy, enemy]);
```

**Note**: Remove `enemyHp` from the dependency array since we're using the ref.

---

### Fix 3: Ensure Mini-Game HP Updates Sync to Ref

For each inline mini-game handler that sets enemyHp (like the ones at lines 1761-1834), we need to also update the ref synchronously so that `returnToReading()` sees the correct value.

**Pattern for each inline handler:**
```javascript
onComplete={(completed, failed) => {
  setCorrectWords(prev => prev + completed);
  setTotalDamage(prev => prev + completed * 12);
  const newHp = Math.max(0, enemyHpRef.current - completed * 12);
  enemyHpRef.current = newHp; // Sync ref FIRST
  setEnemyHp(newHp); // Then update state
  setBatchStartIndex(prev => prev + barrageWords.length);
  returnToReading();
}}
```

This applies to handlers for:
- `word_echo` (line 1761)
- `wind_chase` (line 1774)
- `ink_splash` (line 1787)
- `crystal_prison` (line 1800)
- `lightning_storm` (line 1813)
- `void_pull` (line 1826)
- `dodge_words` replacement (line 1695)

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Line ~172 | Add `enemyHpRef = useRef(enemyHp)` |
| Line ~173 | Add useEffect to sync ref |
| Lines 248-279 (`returnToReading`) | Use `enemyHpRef.current` instead of `enemyHp` |
| Lines 1561-1565 | Add `else` branch for defeat when accuracy < 80% |
| Inline mini-game handlers (7 locations) | Update to sync `enemyHpRef.current` before calling `returnToReading()` |

---

## Technical Details

### Why Use a Ref?

React's `useCallback` captures the `enemyHp` value at the time the callback is created. When a mini-game calls `setEnemyHp(0)` and then immediately calls `returnToReading()`, the callback still sees the OLD value of `enemyHp` because React hasn't re-rendered yet.

By using a ref that we update synchronously (before calling `returnToReading`), we ensure the callback always sees the latest HP value.

### Victory Conditions (Final)

| Condition | Outcome |
|-----------|---------|
| `enemyHp <= 0` (any source) | **VICTORY** (or enemy transition if not final) |
| All words read + accuracy >= 80% | **VICTORY** (reading victory) |
| All words read + accuracy < 80% | **DEFEAT** (try again) |
| `playerHp <= 0` | **DEFEAT** |

---

## Files Modified

1. `src/components/aura/game/rpg/RPGBattleArena.tsx`
   - Add enemyHpRef and sync useEffect (~4 lines)
   - Update returnToReading to use ref (~2 line changes)
   - Add defeat condition for low accuracy (~4 lines)
   - Update 7 inline mini-game handlers (~14 line changes)

**Total**: ~24 lines modified/added
