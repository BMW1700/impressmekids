

# Split Aura Reading into K-5 / 6-12 Grade Modes — Full Finalized Plan

## Summary

Create two fully independent reading systems mapped to RPG modes, with separate data, scores, and analytics. Users can switch between them with tabs, and all analytics include a grade-mode dropdown.

## Book Grade Mapping

- **Grades K-5 Mode**: Books with `grade_level` 0 (K), 1, 2, 3, 4, or 5 — sourced from `curatedStories`
- **Grades 6-12 Mode**: Books with `grade_level` 6, 7, 8, 9, 10, 11, or 12 — sourced from `agentStories`
- Community stories from DB (`reading_library`) filtered by `grade_level` range

## RPG Mode Mapping

- **Classic Adventure RPG** = Grades K-5 — shares all scores/progress
- **Agent RPG** = Grades 6-12 — shares all scores/progress
- Selecting a grade tab auto-syncs the RPG theme (`classic` ↔ `agent`)

## Phase 1: Database Migration

Add `grade_mode` column (text, default `'k5'`, validated via trigger to `'k5'` or `'6to12'`) to:

| Table | Purpose |
|-------|---------|
| `reading_sessions` | Tag each reading session |
| `campaign_progress` | Separate RPG progress per mode |
| `student_reading_stats` | Separate stats per mode |
| `student_reading_progress` | Separate book completion per mode |
| `campaign_battle_sessions` | Tag battles by mode |

Also:
- `profiles` gets `default_grade_mode` column (text, default `'k5'`)
- Drop existing `UNIQUE(student_id)` on `campaign_progress`, replace with `UNIQUE(student_id, grade_mode)`
- Update `upsert_reading_stats` RPC to accept `p_grade_mode` parameter and upsert per `(student_id, grade_mode)`

## Phase 2: Core Infrastructure

**`src/lib/gameTheme.ts`**
- Add `getGradeMode()`: returns `'k5'` when theme is `classic`, `'6to12'` when `agent`
- Add `getGradeModeFromGrade(grade: number)`: returns `'k5'` for 0-5, `'6to12'` for 6-12
- Add `gradeMode` type export

**`src/lib/updateStudentReadingStats.ts`**
- Accept `gradeMode` parameter, pass `p_grade_mode` to the RPC

**`src/hooks/useCampaignProgress.ts`**
- Accept `gradeMode` parameter
- All queries filter by `grade_mode`
- All writes (`upsert`, `initializeProgress`, `completeBattle`) include `grade_mode`
- Change `onConflict: 'student_id'` to `onConflict: 'student_id,grade_mode'`
- Query key includes `gradeMode`

**`src/hooks/useReadingSessions.ts`**
- Accept optional `gradeMode` filter, apply `.eq('grade_mode', gradeMode)` when set

## Phase 3: UI — Grade Mode Tabs on Reading Pages

**`src/components/aura/StoryLibrary.tsx`**
- Add tab selector at top: "Grades K-5" | "Grades 6-12"
- K-5 tab: show `curatedStories` + community stories with `grade_level` 0-5, grade filter chips `['K','1','2','3','4','5']`
- 6-12 tab: show `agentStories` + community stories with `grade_level` 6-12, grade filter chips `['6','7','8','9','10','11','12']`
- Tab selection syncs `gameTheme` (K-5 → classic, 6-12 → agent)

**`src/pages/student/AuraPractice.tsx`**
- Add K-5 / 6-12 tab bar at the top level
- Default tab from `profiles.default_grade_mode`
- Tab switch sets `gameTheme` and passes `gradeMode` to all child components

**`src/components/student/sections/AuraReadingSection.tsx`**
- Same tab bar for the embedded student dashboard version

## Phase 4: Data Writes — Tag Everything

**`src/components/aura/GuidedReadingFlow.tsx`**
- When saving to `reading_sessions`, include `grade_mode` derived from the story's `grade_level` using `getGradeModeFromGrade()`

**`src/components/aura/game/rpg/RPGBattleArena.tsx`**
- Battle completion writes include `grade_mode` from current theme

**`src/hooks/useCampaignProgress.ts`** (already covered in Phase 2)

## Phase 5: Analytics — Grade Mode Dropdown

**`src/pages/teacher/AuraAnalytics.tsx`**
- Add dropdown selector at top: "Aura Reading – Grades K-5" / "Aura Reading – Grades 6-12"
- All data queries filter by selected `grade_mode`
- Default selection from teacher's `default_grade_mode` preference

**`src/components/aura/ReadingProgressDashboard.tsx`**
- Accept `gradeMode` prop, filter `reading_sessions` query by it

**Other analytics components** (`ClassroomAuraOverview`, `StudentAuraMetrics`, `KidFriendlyProgress`, `AuraProgressChart`, `WeeklyProgress`)
- Accept and pass through `gradeMode` filter

## Phase 6: Default Preference

**Profile settings page**
- Add "Default Reading Mode" selector (K-5 or 6-12)
- Writes to `profiles.default_grade_mode`
- On page load, all tabs and dropdowns auto-select the user's default

## Data Flow

```text
User selects "Grades 6-12" tab
  → gameTheme set to 'agent', gradeMode = '6to12'
  → StoryLibrary shows agentStories (grades 6-12)
  → RPG loads agent worlds/enemies/spells
  → reading_sessions saved with grade_mode='6to12'
  → campaign_progress row for (student_id, '6to12')
  → student_reading_stats row for (student_id, '6to12')
  → Analytics filtered by grade_mode='6to12'

User selects "Grades K-5" tab
  → gameTheme set to 'classic', gradeMode = 'k5'
  → Completely independent data pipeline
```

## Score & Data Separation

- K-5 and 6-12 are **completely independent** — no shared scores, progress, stats, or campaign data
- A student can have progress in both modes simultaneously
- Switching modes shows only that mode's data

## Files Modified

1. **Database migration** — `grade_mode` on 5 tables + update unique constraint + update RPC + profile preference
2. `src/lib/gameTheme.ts` — `getGradeMode()`, `getGradeModeFromGrade()`, type exports
3. `src/lib/updateStudentReadingStats.ts` — pass `grade_mode` to RPC
4. `src/hooks/useCampaignProgress.ts` — filter + write `grade_mode`, update conflict key
5. `src/hooks/useReadingSessions.ts` — filter by `grade_mode`
6. `src/components/aura/StoryLibrary.tsx` — grade mode tabs, switch story sets + grade chips
7. `src/pages/student/AuraPractice.tsx` — K-5/6-12 tab bar, default from profile
8. `src/components/student/sections/AuraReadingSection.tsx` — same tab bar
9. `src/components/aura/GuidedReadingFlow.tsx` — tag writes with `grade_mode`
10. `src/components/aura/game/rpg/RPGBattleArena.tsx` — tag writes with `grade_mode`
11. `src/pages/teacher/AuraAnalytics.tsx` — grade mode dropdown filter
12. `src/components/aura/ReadingProgressDashboard.tsx` — filter by `grade_mode`
13. Analytics sub-components — pass through `gradeMode`
14. Profile settings — default mode selector

## Execution Order

1. Database migration (foundation)
2. Core infrastructure (theme helpers, hooks)
3. UI tabs on reading pages
4. Tag all data writes
5. Analytics filters
6. Default preference

