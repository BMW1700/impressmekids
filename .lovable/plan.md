
Goal: make streak counters accurate in Word-by-Word and both game flows, without changing microphone behavior.

1) Audit Findings (root causes)
- SingleWordReader streak bug:
  - `startContinuousListening` creates one recognition session and `onresult` keeps the original `handleCorrect`.
  - `handleCorrect` uses `correctStreak + 1` from that old closure, so streak can stay at 1 even after multiple correct words.
  - File: `src/components/aura/SingleWordReader.tsx` (streak calc in `handleCorrect`, recognition setup in `startContinuousListening`).
- RPG battle streak bug:
  - `handleWordResult` in `RPGBattleArena` computes `newStreak = streak + 1` from callback-closure state, not guaranteed latest state during rapid speech events.
  - This can flatten/lag streak progression (e.g., staying at x1).
  - File: `src/components/aura/game/rpg/RPGBattleArena.tsx`.
- RPG reader callback staleness:
  - `RPGWordReader` keeps one recognition instance; callbacks can hold stale `onResult`/`streak` unless refs are used.
  - File: `src/components/aura/game/rpg/RPGWordReader.tsx`.
- Data accuracy regression from prior patch:
  - `GuidedReadingFlow` now always calls shared stats updater, while full-passage `WordByWordReader` already updates stats itself.
  - `BattleReader` also calls shared updater, while its embedded `WordByWordReader` already updates stats.
  - This causes double-counting of sessions/XP/words in those paths.
  - Files: `src/components/aura/GuidedReadingFlow.tsx`, `src/components/aura/game/BattleReader.tsx`, `src/components/aura/WordByWordReader.tsx`.

2) Implementation Plan
- A. Fix SingleWordReader real-time streak logic
  - Add `correctStreakRef` (and attempt-related refs as needed) as source of truth for speech callbacks.
  - Update `handleCorrect` to compute from ref/functional update, then sync both state + ref.
  - Ensure incorrect/skip paths reset both state + ref.
  - Route recognition `onresult` through handler refs (`handleCorrectRef`/`handleIncorrectRef`) so live mic always uses latest logic.
- B. Fix RPG battle streak progression deterministically
  - Add refs for volatile combat counters (`streak`, `longestStreak`, `wordsRead`, `correctWords`).
  - In `handleWordResult` and `handleMiss`, calculate next values from refs (not closure snapshots), then sync state.
  - Keep damage/accuracy calculations based on computed next counters so HUD, damage, and streak are consistent.
- C. Harden RPGWordReader against stale parent callbacks
  - Add `onResultRef`/`onMissRef`/`streakRef` and use refs in recognition-result processing.
  - This ensures long-lived recognition sessions always call latest parent logic.
- D. Remove streak/stat distortion from duplicate writes
  - `GuidedReadingFlow`: only run shared `updateStudentReadingStats` for SingleWord mode.
  - `BattleReader`: remove extra shared stats call (or gate it) because `WordByWordReader` already persists stats.
  - Keep full-passage behavior unchanged where it already works.
- E. Regression pass for all three problematic sections
  - Word-by-Word mode (SingleWordReader): 5 consecutive correct words should show streak 1→5.
  - RPG mode: consecutive correct words should move panel streak x1→x2→x3 and “Best” update live.
  - Battle mode: streak/words/HUD should increment once per real word event.
  - Confirm backend stats increase once per completed session (no doubles).

3) Technical Details (what will and won’t change)
- Will change:
  - `src/components/aura/SingleWordReader.tsx`
  - `src/components/aura/game/rpg/RPGBattleArena.tsx`
  - `src/components/aura/game/rpg/RPGWordReader.tsx`
  - `src/components/aura/GuidedReadingFlow.tsx` (gating shared stats update)
  - `src/components/aura/game/BattleReader.tsx` (remove/gate duplicate update)
- Will not change:
  - Mic interaction model (no continuous-mic behavior redesign).
  - Database schema/migrations (not needed for this fix).

4) Success Criteria
- Streak counters in UI match actual consecutive correctness in:
  - Word-by-Word mode,
  - RPG mode,
  - Battle mode.
- No more “stuck at 1” behavior after multiple consecutive correct words.
- Stats persistence no longer double-counts in full-passage/battle wrappers.
