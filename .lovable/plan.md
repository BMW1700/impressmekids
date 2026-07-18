# Brutally honest audit — what actually shipped last turn vs. what you're seeing

You're not a monkey's uncle. You're right — the last turn built the plumbing but did **not** connect it to anything you can see or feel. Here's the raw truth from the code:

## What exists ✅
- `src/lib/challengeMeter.ts` — Level 1–5 threshold table (real).
- `src/lib/wordMatchingModes.ts` and `phonemeInference.ts` — now accept dynamic thresholds (real).
- `src/hooks/useChallengeSettings.ts` — reads/writes `challenge_settings`, realtime subscribed (real).
- `src/contexts/ChallengeContext.tsx` — provider + threshold-aware matchers (real).
- `src/pages/parent/ChallengeSettings.tsx` — parent slider page (real).
- `src/components/teacher/StudentChallengeOverride.tsx` — teacher override card (real).
- Route `/parent/challenge-settings` is registered in `App.tsx`.

## What is broken / invisible ❌ (this is why you see nothing)
1. **No nav link anywhere** points to `/parent/challenge-settings`. Parents can't reach it unless they type the URL.
2. **`<ChallengeProvider>` is never mounted.** Zero readers are wrapped in it. Every speech match still uses the old hardcoded thresholds. Moving the slider changes the DB row and nothing else.
3. **`StudentChallengeOverride` isn't placed in any teacher page.** Teachers can't see or use it.
4. **Pre-K mode is completely disconnected from stats.** `updateStudentReadingStats` is only called from `GuidedReadingFlow`, `BattleReader`, and `RPGBattleArena`. No Pre-K component logs sessions, words, WCPM, or accuracy. Pre-K speech does not touch `reading_sessions`, does not feed Overview/Phonemes/Sessions tabs, does not affect streaks, and does not respect the Challenge Meter at all.

So: the backend rows exist, but the runtime, the UI surfaces, and Pre-K are all still wired the old way.

## Plan to fix it — end-to-end, visibly

### 1. Wire the Challenge Meter into every reader
- Mount `<ChallengeProvider studentId={activeStudentId}>` inside `RouteAwareProviders` in `App.tsx` (reads student id from AuthContext / student session) so every downstream reader inherits live thresholds.
- Refactor these readers to consume `useChallengeMatchers()` instead of importing raw matchers directly:
  - `src/components/aura/GuidedReadingFlow.tsx`
  - `src/components/aura/WordByWordReader.tsx`
  - `src/components/aura/game/BattleReader.tsx`
  - `src/components/aura/game/rpg/RPGBattleArena.tsx`
  - Pre-K speech loop (see step 3).
- Add a lightweight "Level X" badge in each reader's HUD so you can *visibly* verify the level in play.

### 2. Expose the UI so it's reachable
- Add a "Challenge Meter" tile on the Parent dashboard linking to `/parent/challenge-settings`.
- Add a "Challenge Level" section inside the teacher's Student Detail view that mounts `<StudentChallengeOverride studentId={id} />`.
- Add a small "Level X • Tap to change" chip on the student's Game Mode header (opens the same slider, gated by role) — this is the change you'll see instantly on load.

### 3. Wire Pre-K into the same backend as RPG (main ask)
- Add a `usePreKSessionLogger` hook that mirrors what `BattleReader` / `RPGBattleArena` do: batches word-level attempts, flushes at scene end / video end / word-card completion.
- On every Pre-K word attempt call `matchers.analyze(...)` from `useChallengeMatchers()` so Pre-K obeys the same strictness dial.
- On flush, call `updateStudentReadingStats({...})` and insert a row in `reading_sessions` with `source: 'prek'` (new discriminator) plus `words_read`, `correct`, `duration_ms`, `wcpm`, `accuracy`, `challenge_level`.
- Extend `useGameReadingSummary`, `useReadingSessions`, `useWeeklyProgress`, and the "Sessions" tab in your screenshot to include `source in ('rpg','prek','castle_swarm')` so Pre-K reads show up next to "Rpg Battle" with a "Pre-K" label.
- Add `challenge_level` and `source` columns to `reading_sessions` via migration (with GRANTs). Backfill existing rows with `source = 'rpg'`.

### 4. Verification (so you can *see* it working)
- Move slider on `/parent/challenge-settings` → HUD "Level X" badge in the reader updates in <1s (realtime channel already in place).
- Play one Pre-K scene → new row appears in the Sessions tab labeled "Pre-K" with WCPM/accuracy, and Overview totals go up.
- Run `runChallengeMeterSelfCheck()` from console; expect `failed: []`.

## Technical notes
- Migration: `ALTER TABLE public.reading_sessions ADD COLUMN source text NOT NULL DEFAULT 'rpg', ADD COLUMN challenge_level smallint;` + re-`GRANT` per project rules.
- `ChallengeProvider` must resolve `studentId` from the active student context (student self, or teacher/parent viewing) — fall back to the default level-3 matchers when none, which preserves current behavior.
- Pre-K logger must respect `pause_on_word_card` timing so WCPM isn't inflated by video runtime.
- No changes to Castle Swarm scoring in this pass unless you want it — say the word and I'll include it.

Approve and I'll build it in this order: (1) migration + Pre-K logger, (2) provider mount + reader refactors, (3) nav links + HUD badge, (4) Sessions tab source filter.
