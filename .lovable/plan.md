

# Brutally Honest Audit: Week-by-Week Student Progress

## What Already Exists (and works well)

1. **`useWeeklyProgress` hook** — fully built, fetches reading_sessions + aura_records grouped by week, calculates WCPM trends, accuracy changes, phoneme strengths/weaknesses, mode breakdowns, and substitution patterns. Supports grade_mode filtering. This is genuinely solid infrastructure.

2. **`ImprovementTracker` component** — renders week-by-week charts (WPM, accuracy, fluency lines) plus a weekly breakdown table with sessions count, WPM, accuracy, and words read per week. Has both "simple" (area chart) and "detailed" (multi-line chart + table) variants.

3. **Where it's used:**
   - Student dashboard (`AuraReadingSection.tsx`) — simple variant, grade_mode scoped
   - Parent weekly report (`ParentWeeklyReport.tsx`) — both simple and detailed variants
   - Student's Full Stats Modal (`FullReadingStatsModal.tsx`) — detailed variant
   - **NOT in the teacher's Student Profile page** — this is the gap

## What's Missing

### 1. Teacher Student Profile Has No Reading Data (CRITICAL)

`StudentProfile.tsx` (the teacher's view of an individual student) has 7 tabs: Overview, Readings, ML Insights, Phonemes, Progress, Timeline, Notes.

- **Readings tab** — shows a flat list of individual sessions (date, WCPM, accuracy) but no aggregated trends or week-by-week comparison
- **Progress tab** — shows ONLY a "Clarity Score Over Time" chart from `aura_records` (speaking exercises). Zero reading session data. No WCPM trend, no accuracy trend, no fluency trend, no weekly breakdown table.

A teacher clicking "Progress" for a student sees speaking clarity only — not reading improvement. That's backwards for a reading product.

### 2. No Classroom-Wide Weekly Breakdown

`AuraAnalytics.tsx` shows aggregate stats (total sessions, avg accuracy, avg WPM, words read) but these are **all-time averages**, not week-by-week. A teacher cannot see "Week 1 avg WCPM was 85, Week 4 avg WCPM is 102, class improved 20%."

### 3. Retention Metrics Don't Exist

There is no tracking of:
- Session frequency per student per week (are they reading more or less over time?)
- Time-on-task per week (are sessions getting longer?)
- Return rate (did the student come back this week after last week?)
- Engagement decay detection (student was active weeks 1-3, dropped off week 4)

## The Fix

### Task 1: Add Week-by-Week Reading Progress to Teacher's Student Profile
- Replace the Progress tab's "Clarity Score Over Time" with the existing `ImprovementTracker` component (detailed variant)
- Add the student's `gradeMode` to scope correctly
- Keep the clarity chart as a secondary section below
- This is a ~15-line change — the component already exists

### Task 2: Add Classroom-Wide Weekly Progress Table to AuraAnalytics
- Create a new `ClassroomWeeklyBreakdown` component on the existing "Progress" tab
- Query `reading_sessions` for all classroom students, group by week
- Show: Week | Active Students | Avg WCPM | WCPM Change | Avg Accuracy | Total Words Read | Total Sessions
- Highlight weeks with improvement in green, regression in red
- Add a line chart showing class-avg WCPM trending over 4-8 weeks

### Task 3: Add Retention/Engagement Metrics
- Add per-student engagement indicators to the existing StudentAuraMetrics overview:
  - "Sessions This Week" vs "Sessions Last Week" (trend arrow)
  - "Avg Session Duration" trend
  - "Weeks Active (out of last 4)" badge
- Add an "Engagement" column to the classroom overview table
- Flag students who were active 2+ weeks ago but not this week as "At Risk of Disengaging"

### Files to modify
- `src/pages/teacher/StudentProfile.tsx` — import and add `ImprovementTracker` to Progress tab
- `src/pages/teacher/AuraAnalytics.tsx` — add classroom weekly breakdown to Progress tab
- `src/components/aura/StudentAuraMetrics.tsx` — add engagement/retention indicators per student
- New file: `src/components/aura/ClassroomWeeklyBreakdown.tsx` — classroom-level weekly trend table + chart

### What stays the same
- `useWeeklyProgress` hook — already handles all the per-student weekly aggregation
- `ImprovementTracker` component — already built, just needs to be imported in one more place
- All existing analytics tabs, charts, and components remain untouched

