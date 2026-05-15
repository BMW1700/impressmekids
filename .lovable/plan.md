# Two fixes: Game Mode login focus bug + missing reading metrics

## Bug 1 — Login input loses focus after every keystroke

**Root cause:** In `src/pages/game/GameAuth.tsx`, `LoginModeToggle` and `IdentityInput` are defined as **components inside the `GameAuth` render function** (lines 227–285). Every render creates a brand-new component type, so React unmounts and remounts the `<Input>` on every keystroke — that's why the field blurs after one character.

**Fix:** Inline the JSX directly inside the two `<form>` blocks (Login and Sign Up). No new components, no behavior change — just stable element identity so the input keeps focus while typing. Same fix applies to both the email and Student ID inputs and the Login/Email/Student ID toggle.

## Bug 2 — Game Mode hides Accuracy / WCPM / Fluency level

You're right. Here's what's actually shown in Game Mode today:

| Surface | What it shows | Missing |
|---|---|---|
| **Dashboard top cards** (`GameDashboard.tsx` L270–295) | XP, Day Streak, Words Read | WPM, WCPM, Accuracy, Fluency |
| **Reading Journey sidebar** (`ReadingProgressPanel`, RPG screen) | Reading Level, WPM, Accuracy, Words Mastered, Stories Read | WCPM (uses WPM fallback), Fluency label |
| **Full Stats modal** (already exists) | WCPM/WPM, Accuracy + Frustration/Instructional badge, Words Read, Sessions, Benchmark | Explicit "Fluency" score |
| **Analytics page Overview** (`GameAnalytics.tsx` L161–194) | Total Sessions, Words Read, **Avg WPM**, Day Streak | Accuracy, WCPM, Fluency |
| **Analytics Sessions tab** | Per-session WPM + clarity % | Aggregate accuracy/WCPM/fluency |

So Accuracy + WCPM + Fluency live only in the buried "View Full Stats" modal — never on the dashboard or analytics overview.

### What I'll add

1. **`GameDashboard` quick stats** — expand from 3 cards to **6** (responsive 3×2 grid on mobile, 6 across on desktop):
   - keep XP, Day Streak, Words Read
   - add **Avg WPM**, **Avg Accuracy %**, **Avg WCPM** pulled from the same `reading_sessions` query `ReadingProgressPanel` already uses (last 20 sessions). Source the values from a single new hook `useGameReadingSummary(userId)` so dashboard + analytics share one query.

2. **`GameAnalytics` overview** — replace the 4-card row with a **6-card** row matching the dashboard, plus add a **Fluency** badge card that maps WCPM → benchmark label ("Below / On Track / Above") using the existing `getReadingJourneyLevel` / `fluencyBenchmarks` helpers.

3. **`ReadingProgressPanel`** — relabel the WPM tile to **WCPM** when `wcpm` is present (so it matches the science-of-fluency reporting), and add a small **Fluency: On Track / Below / Above** chip under the Reading Level bar.

No DB or backend changes — every metric already exists in `reading_sessions` and `student_reading_stats`. This is purely surfacing what's already collected.

## Out of scope
- No changes to how metrics are computed.
- No new auth flows, no new pages.
- No RPG/battle UI changes beyond the small chip on the existing sidebar.

Confirm and I'll ship both fixes.
