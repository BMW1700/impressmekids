## Brutally honest answer: the numbers are real, but the page is lying by mixing them

I pulled this exact user's data from the database. Every number on that screenshot is a real value from a real row — none of it is fake. **But the page is stitching together three different data sources and labeling them as if they're the same thing**, which is why you're seeing "26 WPM" at the top and "150 WPM" 400px below it on the same screen.

### What's actually in the database for this reader

| Source table | Row count | Avg WPM | Avg WCPM | Avg Accuracy | What it represents |
|---|---|---|---|---|---|
| `reading_sessions` | **457** | **33** | **27** | **87%** | Real reading practice (RPG battles, tug-of-war, screening) |
| `aura_records` (speaking) | **4** | **150** | n/a | n/a | 4 old "speaking" practice clips from Dec 2025 / Feb 2026 |
| `student_reading_stats` | 1 | — | — | — | Aggregate row: 369 sessions logged, 18,569 words read |

### What each card on that screen is *actually* pulling from

- **"4 Total Sessions"** (top card) → `aura_records.length` — counts only the 4 speaking clips, ignores 457 reading sessions
- **"18,569 Words Read"** → `student_reading_stats.total_words_read` — all reading combined
- **"26 Avg WPM"** → last 20 rows of `reading_sessions` (the real reading number)
- **"23 Avg WCPM"** → last 20 rows of `reading_sessions`
- **"95% Accuracy"** → last 20 rows of `reading_sessions`
- **"Instructional" fluency** → derived from that 95%
- **"3 Day Streak"** → `student_reading_stats.current_streak_days`
- **"4 Total Sessions / 73 Avg Grade / 150 Avg WPM / 0.0 Avg Pronunciation"** (bottom "Your Progress Over Time" block) → `aura_records` only — the 4 stale speaking clips from months ago

So **150 WPM is not this kid's reading speed**. It's the average of 4 speaking-prompt clips (32–143 words each, recorded Dec 3 → Feb 23, the most recent one being 32 words in 17 seconds). It's technically real, but it's:
1. From a different activity (open-ended speaking, not reading aloud)
2. n=4, three of them >5 months old
3. Shown next to a "Total Sessions: 4" that contradicts the "Total Sessions: 4" up top contradicting the 369 in `student_reading_stats`

The **26 WPM / 95% accuracy / Instructional** numbers up top are the legitimate, current reading picture for this student. Last 10 sessions span 9–34 WPM, 84–100% accuracy — consistent with a K-5 reader doing short RPG passages of 20–65 words.

### Why this happened

`GameAnalytics.tsx` was built to render two things in parallel:
- The new `useGameReadingSummary` hook (reading_sessions) — added recently
- The old `AuraProgressChart` + summary tiles that pre-date reading_sessions and read from `aura_records`

Nobody removed the old tiles, and "Total Sessions" in the top grid still uses `auraRecords.length` instead of the reading_sessions count. Result: same screen, three different "truths."

### Plan to fix

1. **Single source of truth for reading stats.** Extend `useGameReadingSummary` to also return `totalSessions` (count from `reading_sessions`, not capped at 20) and pull `totalWordsRead` from `student_reading_stats`. Use that hook for every top-grid tile.
2. **Top "Total Sessions" tile** in `GameAnalytics.tsx` → switch from `auraRecords?.length` to the reading_sessions total. Expected value for this user: **457**, not 4.
3. **Kill the misleading bottom block.** In `AuraProgressChart.tsx`, remove the four summary tiles (Total Sessions / Avg Grade / **Avg WPM** / Avg Pronunciation) that compute over `aura_records`. Keep only the line chart, and re-label its title to "Speaking Practice Progress" so it's obvious this chart is about the speaking clips, not reading.
4. **Reading sessions list.** The "Recent Reading Sessions" tab currently lists `aura_records` (the 4 speaking clips). Swap it to list `reading_sessions` so users see their real practice history with WPM / WCPM / accuracy / mode.
5. **Sanity guard.** When `reading_sessions` count < 3, show "Need more practice for an accurate average" instead of a number — prevents future "n=4 → 150 WPM" optics.

No DB or business-logic changes. Pure presentation fix in `GameAnalytics.tsx`, `AuraProgressChart.tsx`, and a small extension to `useGameReadingSummary.ts`.

### TL;DR for you

- The data is **real and legitimate** — nothing is fabricated.
- **26 WPM / 95% accuracy is this reader's true current level.** That's the number to trust.
- **150 WPM is a real artifact** but from 4 old speaking-prompt clips, not reading. It should not be on a reading analytics screen.
- The page is the bug, not the data. The fix is to remove/relabel the speaking-derived tiles and make every "reading" stat read from `reading_sessions`.
