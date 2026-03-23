

# Atomic Stats + Offline Resilience (Ecosystem-Preserving)

## What stays the same
All 16+ files that READ from `student_reading_stats` are untouched. The table schema is unchanged. Every mode (AURA word-by-word, RPG, Campaign/Battle) continues writing to the same table. Streaks, XP, words read, achievements, missions, leaderboards — all still fed from the same source.

## What changes

### 1. New database RPC function: `upsert_reading_stats`
- Atomically increments `total_words_read`, `total_sessions`, `xp_points`
- Calculates streak internally (same-day keep, next-day increment, gap reset)
- Updates `longest_streak_days` via `GREATEST()`
- `SECURITY DEFINER` so it works through RLS
- Same exact math as current JS code, just race-condition-proof

### 2. Rewrite `src/lib/updateStudentReadingStats.ts`
- Replace 60 lines of read-then-write with single `supabase.rpc('upsert_reading_stats', {...})`
- Add try/catch: on failure, cache to `localStorage` key `pending_reading_stats`
- On module load + `window.addEventListener('online')`: flush pending entries
- Same function signature — all callers (GuidedReadingFlow, etc.) unchanged

### 3. Replace RPGBattleArena's inline stats code
- Remove the 70-line `updateStudentReadingStats` callback (lines 1634-1700)
- Import and call the shared utility instead
- This actually makes RPG **more** integrated with the ecosystem (same code path as all other modes)

## Ecosystem flow after change

```text
SingleWordReader ──→ GuidedReadingFlow ──→ shared utility ──→ RPC ──→ student_reading_stats
WordByWordReader ──→ (internal stats)  ──→ shared utility ──→ RPC ──→ student_reading_stats  
RPGBattleArena   ──→ shared utility    ──→ RPC ──→ student_reading_stats
                                                         ↑
                                              (same table, same columns)
                                                         ↓
                              GamificationHeader, Leaderboard, Achievements,
                              Missions, ReadingProgressPanel, SmartNotifications,
                              KidFriendlyProgress, FullReadingStatsModal — ALL read from here
```

## Files modified
| File | Change |
|------|--------|
| New migration | `upsert_reading_stats` RPC function |
| `src/lib/updateStudentReadingStats.ts` | RPC call + offline retry |
| `src/components/aura/game/rpg/RPGBattleArena.tsx` | Replace inline stats with shared utility import |

## What will NOT break
- No mic/speech code touched
- No UI components changed
- No table schema changes
- No reading flow logic changes
- Achievement checks still read from same table
- Leaderboards still read from same table
- Everything in the ecosystem still works exactly as before

