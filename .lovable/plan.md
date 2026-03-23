

# Fix Streaks Not Counting Across All Reading Modes

## The Problem

The `student_reading_stats` table (which tracks daily streak, total words read, XP, etc.) is only updated by **two** components:

1. **WordByWordReader** (Full Passage mode) — has `updateStudentStats()` ✅
2. **RPGBattleArena** (RPG mode) — has `updateStudentReadingStats()` ✅

These two modes are **missing** the stats update:

3. **SingleWordReader** (Word-by-Word mode) — calls `onComplete()` with session data but **never writes to `student_reading_stats`** ❌
4. **BattleReader** (Battle/Goblin mode) — calls `completeBattle()` but **never writes to `student_reading_stats`** ❌

Additionally, there's a secondary streak bug: in **WordByWordReader**, when a word is marked definitively incorrect (after the 3-second grace period), `setCorrectStreak(0)` is never called — only `onWordResult` fires with `streak: 0`, but the local streak state keeps climbing.

## The Fix

### 1. WordByWordReader — Reset streak on incorrect words
In the two `setTimeout` callbacks (lines ~862 and ~897) where `pending-incorrect` converts to `incorrect`, add:
```
setCorrectStreak(0);
correctStreakRef.current = 0;
```

### 2. GuidedReadingFlow — Add `student_reading_stats` update for SingleWordReader
The `handleReadingComplete` function in `GuidedReadingFlow.tsx` saves to `student_reading_progress` but never updates `student_reading_stats`. Add the same streak/stats update logic that `WordByWordReader.updateStudentStats` uses — fetch existing stats, compute daily streak, upsert totals.

### 3. BattleReader — Add `student_reading_stats` update for Battle mode
The `handleReadingComplete` in `BattleReader.tsx` saves battle results via `completeBattle()` but never syncs to `student_reading_stats`. Add the same upsert logic so battle sessions count toward total words read, daily streak, and XP.

### Files to Change

| File | Change |
|------|--------|
| `src/components/aura/WordByWordReader.tsx` | Add `setCorrectStreak(0)` + `correctStreakRef.current = 0` in both pending-incorrect timeout callbacks (~lines 864 and 900) |
| `src/components/aura/GuidedReadingFlow.tsx` | Add `updateStudentReadingStats()` helper function and call it from `handleReadingComplete` for both SingleWordReader and WordByWord modes |
| `src/components/aura/game/BattleReader.tsx` | Add `updateStudentReadingStats()` helper and call it from `handleReadingComplete` after battle completion |

### Shared Stats Update Logic (for GuidedReadingFlow + BattleReader)

Both files need the same pattern already used in `WordByWordReader` and `RPGBattleArena`:

1. Fetch existing `student_reading_stats` for the student
2. Calculate daily streak: same day = keep, next day = increment, gap = reset to 1
3. Upsert with updated `total_words_read`, `total_sessions`, `current_streak_days`, `longest_streak_days`, `xp_points`, `last_activity_date`

