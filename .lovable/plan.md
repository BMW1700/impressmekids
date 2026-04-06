
The issue is not that the app “forgot” the active mode in this panel. The issue is that the leveling logic itself is still wrong.

What is actually broken
- `src/components/aura/game/rpg/ReadingProgressPanel.tsx`
  - It correctly filters reading data by `gradeMode`.
  - But then it converts WPM into a single global ladder:
    - `Pre-K`, `K`, `1st` ... `8th+`
  - That means Agent mode can still show `Pre-K Grade` if the student’s WPM is low.
- `src/components/aura/game/rpg/FullReadingStatsModal.tsx`
  - Same problem: it derives “Current Reading Level” from the same global WPM ladder instead of a mode-specific ladder.
  - It also renders `ImprovementTracker` without passing `gradeMode`, so the chart inside that modal can still mix modes.

What I would change
1. Replace global leveling with mode-aware leveling
- Create one shared utility for RPG reading journey labels/progress.
- Behavior:
  - `k5` mode can only map to K–5 labels
  - `6to12` mode can only map to 6–12 labels
- Even if WPM is low in Agent mode, the displayed label must still stay inside the 6–12 range.

2. Use that shared utility everywhere the journey level is displayed
- Update `ReadingProgressPanel.tsx`
- Update `FullReadingStatsModal.tsx`
- Remove the duplicated inline WPM→grade functions from both files

3. Fix the modal’s nested progress components
- Pass `gradeMode` into `ImprovementTracker`
- Update `ImprovementTracker` props to accept `gradeMode`
- Forward that into `useWeeklyProgress(studentId, ..., gradeMode)`

4. Keep the visual progression aligned to each mode
- Classic:
  - show K/1/2/3/4/5 progression only
- Agent:
  - show 6/7/8/9/10/11/12 progression only
- Adjust star/bar counts so they reflect the active mode’s range instead of the old shared 10-step ladder

Technical details
- Root files:
  - `src/components/aura/game/rpg/ReadingProgressPanel.tsx`
  - `src/components/aura/game/rpg/FullReadingStatsModal.tsx`
  - `src/components/shared/ImprovementTracker.tsx`
- New shared utility should live somewhere like:
  - `src/lib/readingJourneyLevel.ts`
- Suggested utility shape:
  - input: `{ wpm, gradeMode }`
  - output: `{ label, displayLabel, stepIndex, totalSteps, nextGoal, benchmarkGrade }`
- `benchmarkGrade` can remain a numeric grade used for fluency benchmark calculations, but the user-facing label must be constrained by mode.

Expected result after implementation
- Classic mode will never show 6–12 leveling labels
- Agent mode will never show Pre-K/K/1st/2nd/3rd/4th/5th labels
- “My Reading Journey” and the full stats modal will both stay visually and logically locked to the active mode
- The modal’s progress chart will stop re-mixing data through the unscoped `ImprovementTracker`
