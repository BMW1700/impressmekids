
# Plan: Restore Lost LexiQuest Features After Victory Fix Revert

## Overview
After reverting to fix the victory popup, several important features were lost. This plan restores **all** of them while explicitly **NOT touching** the victory popup or adding quizzes.

---

## CRITICAL EXCLUSIONS (DO NOT TOUCH)
- ❌ **BookRescueCelebration.tsx** - DO NOT MODIFY
- ❌ **VictoryOverlay component** - DO NOT MODIFY  
- ❌ **ComprehensionQuiz** - DO NOT ADD
- ❌ **Any post-battle quiz logic** - DO NOT ADD

---

## Feature 1: Fix Yellow Word Retry System

### Current Bug
When a student gets a word wrong, clicks "Try Again", and then reads it correctly:
- **CURRENT**: Word turns GREEN (incorrect behavior)
- **EXPECTED**: Word turns YELLOW (retried success - learning, not earning)

When a student skips a word OR fails a retry:
- **CURRENT**: Word turns GREEN/unclear
- **EXPECTED**: Word turns RED (missed/skipped)

### Root Cause
The `handleRetrySuccess` function in `RPGWordReader.tsx` correctly sets `result: 'retried'`, but there's a race condition with the `canRetryRef` update. Additionally, when a retry fails, the word isn't being marked as `'missed'` properly.

### Solution
1. **Fix ref synchronization**: Add `flushSync` to ensure `canRetryRef.current` is updated before recognition restarts
2. **Fix retry failure handling**: Ensure failed retry attempts mark word as `'missed'` (RED)
3. **Add HP recovery on retry success**: When student gets word right on retry, heal player HP by `enemy.attack * 0.125` (12.5%)

### Files Modified
| File | Changes |
|------|---------|
| `src/components/aura/game/rpg/RPGWordReader.tsx` | Add `onRetrySuccess` callback prop, fix ref sync, ensure proper result state |
| `src/components/aura/game/rpg/RPGBattleArena.tsx` | Handle `onRetrySuccess` callback with HP healing logic |

### Technical Flow
```text
Student misses word → Word marked 'missed' (RED)
        ↓
WordFeedbackOverlay appears
        ↓
┌─────────────────────────────────────┐
│ Click "Try Again"                   │
│ - canRetry = false (immediate sync) │
│ - Recognition restarts              │
│        ↓                            │
│ ┌─────────────────────┐             │
│ │ Read word CORRECT   │             │
│ │ - Mark as 'retried' │ → YELLOW    │
│ │ - NO damage/coins   │             │
│ │ - Heal 12.5% HP     │             │
│ └─────────────────────┘             │
│        OR                           │
│ ┌─────────────────────┐             │
│ │ Read word WRONG     │             │
│ │ - Keep as 'missed'  │ → RED       │
│ │ - Show overlay again│             │
│ │ - No retry option   │             │
│ └─────────────────────┘             │
└─────────────────────────────────────┘
        ↓
Click "Skip & Continue" → Word stays 'missed' (RED)
```

---

## Feature 2: Boss Silhouettes for Worlds 5-8

### Current Bug
The world map shows Drake (World 1 dragon) as a placeholder for worlds 5, 6, 7, and 8 instead of unique boss silhouettes.

### Solution
Add 4 new SVG silhouette components for the missing bosses:

| World | Boss Name | Silhouette Style |
|-------|-----------|------------------|
| 5 | Echo Wraith | Ghostly spectral form with ethereal wisps |
| 6 | Zephyr | Wind lord with flowing robes and wind effects |
| 7 | Leviathan | Sea serpent/dragon emerging from waves |
| 8 | Word Eater | Void creature with glowing eyes and dark tendrils |

### Files Modified
| File | Changes |
|------|---------|
| `src/components/aura/game/characters/BossSilhouettes.tsx` | Add 4 new exports: `EchoWraithSilhouette`, `ZephyrSilhouette`, `LeviathanSilhouette`, `WordEaterSilhouette` |
| `src/components/aura/game/rpg/RPGWorldMap.tsx` | Update import + switch statement in `BossSilhouette` to include cases 5-8 |

### SVG Design Pattern (follows existing pattern)
Each silhouette will have:
1. Animated outer glow when unlocked (using world-appropriate color)
2. Main body shape via SVG path with gradient fill
3. Glowing eyes/orb animation when unlocked
4. Gray/muted version when locked

---

## Feature 3: Boss Rush Mode (9-Boss Gauntlet)

### Current Bug
The Boss Rush mode entry point is missing from the world map. This mode lets students fight all 9 bosses in sequence after completing World 8.

### Solution
Create new components and hook for Boss Rush mode:

### New Files Created
| File | Purpose |
|------|---------|
| `src/components/aura/game/rpg/RPGBossRush.tsx` | Main Boss Rush component managing 9-boss queue |
| `src/hooks/useBossRush.ts` | Hook for managing boss rush state and database updates |

### Files Modified
| File | Changes |
|------|---------|
| `src/components/aura/game/rpg/RPGWorldMap.tsx` | Add "⚔️ BOSS RUSH" button visible after World 8 completion |

### Boss Rush Features
1. **9-Boss Queue**: Tutorial Boss → Drake → Ice Golem → Stone Guardian → Grog → Echo Wraith → Zephyr → Leviathan → Word Eater
2. **Persistent Timer**: Shows total elapsed time
3. **Progress Tracker**: "Boss 3/9" indicator
4. **Database Tracking**: Records attempts to `boss_rush_attempts` table
5. **Special Rewards**: Unique achievement on completion

### Boss Rush Entry Point
- "⚔️ BOSS RUSH" button at bottom of world map
- Only visible when: `worldProgress[8].levelsCompleted >= 5` (World 8 complete)
- Glowing pulse animation to attract attention
- Click launches `RPGBossRush` component in fullscreen mode

### Database Integration (table already exists)
```text
boss_rush_attempts:
├── id (uuid, auto)
├── student_id (uuid, FK)
├── started_at (timestamp)
├── ended_at (timestamp, nullable)
├── status ('in_progress' | 'completed' | 'failed')
├── current_boss_index (int, 0-8)
├── bosses_defeated (int)
├── total_damage_dealt (int)
├── total_words_read (int)
├── total_xp_earned (int)
├── total_gold_earned (int)
├── longest_streak (int)
└── time_taken_seconds (int, nullable)
```

---

## Implementation Order

1. **Yellow Word Retry Fix** (Priority 1 - Core gameplay)
   - Fix ref synchronization in `handleTryAgain`
   - Ensure failed retries stay RED
   - Add HP recovery callback

2. **Boss Silhouettes** (Priority 2 - Visual polish)
   - Add 4 new SVG components
   - Update world map switch statement

3. **Boss Rush Mode** (Priority 3 - Endgame content)
   - Create `RPGBossRush.tsx` component
   - Create `useBossRush.ts` hook
   - Add entry button to world map

---

## Testing Checklist

### Yellow Retry System
- [ ] Miss a word → Word turns RED
- [ ] Click "Try Again" → Student reads correctly → Word turns YELLOW
- [ ] Click "Try Again" → Student reads wrong again → Word stays RED, overlay reappears with no retry option
- [ ] Click "Skip & Continue" → Word stays RED
- [ ] Retry success heals player HP by ~12.5% of enemy attack

### Boss Silhouettes
- [ ] World 5 shows Echo Wraith silhouette (ghostly, gray when locked, glowing when unlocked)
- [ ] World 6 shows Zephyr silhouette (wind lord, sky-blue glow)
- [ ] World 7 shows Leviathan silhouette (sea serpent, teal glow)
- [ ] World 8 shows Word Eater silhouette (void creature, purple glow)

### Boss Rush Mode
- [ ] Button hidden until World 8 complete
- [ ] Button visible and glowing after World 8 complete
- [ ] Clicking starts 9-boss gauntlet with timer
- [ ] Progress shows "Boss X/9"
- [ ] Defeating all 9 bosses triggers special victory
- [ ] Attempt saved to database with all stats

---

## Summary of Changes

| Category | New Files | Modified Files |
|----------|-----------|----------------|
| Yellow Retry | 0 | 2 (RPGWordReader.tsx, RPGBattleArena.tsx) |
| Boss Silhouettes | 0 | 2 (BossSilhouettes.tsx, RPGWorldMap.tsx) |
| Boss Rush | 2 | 1 (RPGWorldMap.tsx) |
| **Total** | **2 new** | **4 modified** |

**Estimated Lines**: ~900-1100 added/modified
