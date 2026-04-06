
Fix the grade-mode separation comprehensively, not just in one panel.

1. Scope every affected read to the active mode
- Update `ReadingProgressPanel` to accept `gradeMode` and filter both `student_reading_stats` and `reading_sessions` by it.
- Pass `gradeMode` from `AuraPractice` and `AuraReadingSection` into `RPGWorldMap`, then into `ReadingProgressPanel`.
- Update `FullReadingStatsModal` to accept `gradeMode` and filter:
  - `campaign_progress`
  - `student_reading_stats`
  - `reading_sessions`
  - weekly-progress hook input
- Include `gradeMode` in all related React Query keys so caches stay separate.

2. Fix the Bookshelf data leak
- `ReadingBookshelf` is currently unfiltered and is almost certainly why both modes show the same books/stats.
- Add a `gradeMode` prop and filter `student_reading_progress` by `grade_mode`.
- Pass `currentGradeMode` from both `AuraPractice` and `AuraReadingSection` into `ReadingBookshelf`.
- This ensures:
  - K–5 shows only grades K/1/2/3/4/5 progress
  - 6–12 shows only grades 6/7/8/9/10/11/12 progress

3. Fix Story Library completion / bookshelf indicators
- In `StoryLibrary`, the student progress lookup currently reads all `student_reading_progress` rows for the user.
- Filter that query by `grade_mode` too, so “completed”, “in bookshelf”, and related UI state are mode-specific.
- Also pass the active `gradeMode` into `useCampaignProgress` there so campaign summaries match the selected mode.

4. Fix weekly/history analytics inside the modal
- `useWeeklyProgress` currently aggregates `reading_sessions` without mode filtering.
- Extend it to accept optional `gradeMode` and filter `reading_sessions` by that mode.
- Update all callers that are mode-specific to pass it, especially the RPG/reading stats modal.
- Keep non-mode-specific callers unchanged by making the prop optional.

5. Verify write-side separation where needed
- Ensure `student_reading_progress` writes in `GuidedReadingFlow` include the story’s computed grade mode on both insert and update matching.
- If existing-progress lookup only matches `student_id + story_id`, change it to also include `grade_mode`, so the same story title/record cannot merge across modes.
- Ensure any bookshelf add/remove actions in `StoryCard` also read/write/delete using the active `gradeMode`, otherwise saved-book state can still bleed between modes.

6. Fix remaining user-facing “mixed data” sources
- `useSmartNotifications` currently reads unfiltered `student_reading_stats`, `reading_sessions`, and `student_reading_progress`; make it accept optional `gradeMode` and filter when used on mode-specific reading pages.
- Review mode-specific game stats surfaces like `GameAnalytics` / `GameDashboard` and ensure any `student_reading_stats` reads shown in mode context use the active mode.

7. Protect against cache contamination
- Any query that now depends on mode must include `gradeMode` in its query key.
- This is important because even correct SQL filters can still show stale mixed results if React Query reuses a shared cache key.

8. Expected outcome after the fix
- Grades K–5 mode will only show data from books/stories with grade levels K, 1, 2, 3, 4, 5.
- Grades 6–12 mode will only show data from books/stories with grade levels 6, 7, 8, 9, 10, 11, 12.
- Bookshelf counts, reading stats, RPG sidebar stats, modal history, campaign summaries, and completion badges will all be independent per mode.

Technical details
- Key files to update:
  - `src/components/aura/game/rpg/ReadingProgressPanel.tsx`
  - `src/components/aura/game/rpg/RPGWorldMap.tsx`
  - `src/components/aura/game/rpg/FullReadingStatsModal.tsx`
  - `src/components/aura/ReadingBookshelf.tsx`
  - `src/components/aura/StoryLibrary.tsx`
  - `src/components/aura/StoryCard.tsx`
  - `src/components/aura/GuidedReadingFlow.tsx`
  - `src/hooks/useWeeklyProgress.ts`
  - `src/hooks/useSmartNotifications.ts`
  - `src/pages/student/AuraPractice.tsx`
  - `src/components/student/sections/AuraReadingSection.tsx`
- Data model already supports this: `student_reading_progress` and `student_reading_stats` both have `grade_mode`.
- The real issue is incomplete propagation of `gradeMode` through read/write paths, not the database schema itself.
