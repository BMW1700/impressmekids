## Deep-audit findings

### What actually happens today

I traced the Pre-K completion path end-to-end (`YubiVideoAdventure` → `handlePreKComplete` in `AuraPractice` → `completeBattle` in `useCampaignProgress` → `campaign_progress.world_progress` in the DB → back to `RPGWorldMap`) and pulled the DB rows.

DB state for a Benny player is fine:
```
grade_mode='k5'
world_progress = {
  "4":  ["This and That"],
  "5":  ["Benny Meets his Family", "Benny goes to school", "Benny Goes Home"],
  "6":  [5 stories completed],
  "7":  [4], "8": [3], "101": [1], "102": [1], ...
}
books_rescued = 60
```
So completions ARE being saved. The bug is on the display / consumption side.

### The three real bugs

**Bug 1 — Pre-K world grid reads the wrong world list, so progress lookup misses every DB world.**

- `RPGWorldMap` (prek theme) renders `publishedPrekWorlds` fetched from `prek_worlds` — world_numbers 4, 5, 6, 7, 8, 11, 101, 102.
- `AuraPractice.tsx` (lines 110–115) computes `activeWorlds` for prek theme as `campaignWorlds.filter(w => w.mode === 'prek')`, which is only the three hardcoded worlds **101, 102, 103**.
- `worldProgress[]` (lines 684–708) is built by mapping over `activeWorlds`, so it only ever contains entries for 101/102/103.
- In `RPGWorldMap.getWorldProgress(worldId)`, worlds 4/5/6/7/8/11 fall through to the default `{levelsCompleted: 0, starsEarned: 0}` — which is exactly what the screenshots show.

**Bug 2 — Per-level "completed" and stars on the level-select grid are computed from the same broken list.**

The `CampaignLevel[]` for DB Pre-K worlds is synthesized inside `RPGWorldMap` with `storyIndex: -1`, `isCompleted: false`, `starsEarned: 0`. Even where `world_progress["4"] = ["This and That"]` exists, the level cards can't cross-reference it because the level's `story.title` is never wired to the DB level's title. So Level 1 of "Benny Teaches Personal Pronouns" shows unstarred even though the child finished it.

**Bug 3 — Village / UB Village never unlocks for many Pre-K completions.**

`awardVillageProgress(user.id, 1)` runs inside `handlePreKComplete`. But `handlePreKComplete` only runs when `YubiVideoAdventure` fires `onComplete`. Any completion path that doesn't reach `phase === "ending"` (retry-then-advance branch, `onRetrySuccess` skipping the video ending, or the fallback `onResult(false)` we added last turn) never fires `onComplete`, so no token is granted and the DB `world_progress` entry is never written either. This is why some Pre-K levels the child clearly played show zero progress AND the village never opens.

Secondary: `isBossRushUnlocked` and `isWorldUnlocked` compare `worldId` numerically. In prek theme the DB world_number 8 ("Benny's Wardrobe") collides with classic world 8, so the unlock check is meaningless in prek theme.

---

## The fix

### 1. Make `AuraPractice` build `worldProgress` from the DB-published Pre-K worlds, not `activeWorlds`

- Load `prek_worlds` + `prek_levels` published rows once (reuse `usePublishedPrekLevels` or hoist the query already in `RPGWorldMap`) and expose the list to `AuraPractice`.
- In prek theme, build `worldProgress[]` by iterating over the union of `activeWorlds` **and** the DB Pre-K worlds. For each DB world `w`:
  - `worldStoriesInDB = campaignProgress.world_progress[w.world_number]`
  - `levelsCompleted = min(worldStoriesInDB.length, publishedLevelCount)`
  - `totalLevels = publishedLevelCount`
  - `starsEarned = worldStoriesInDB.reduce(...)` — see (2).

### 2. Persist per-level stars, not just story titles

`world_progress` today is `Record<world_number, string[] of story titles>`. That can't hold star counts. Extend the completion payload so per-level results survive:

- Add a lightweight sibling table `prek_level_completions` (or reuse `campaign_battle_sessions` — it already stores `story_title`, `world_number`, `xp_earned`; add `stars smallint`, `level_number int`, `grade_mode text`).
- On Pre-K completion, insert one row per attempt with `stars` derived from `preKStats.stars`, and upsert best-stars per `(user, grade_mode, world_number, level_number)`.
- `RPGLevelSelect` and `RPGWorldMap` read best-stars per level from this table via a new `usePreKLevelStars(userId, gradeMode)` hook and merge into the synthesized `CampaignLevel[]` so cards show real stars/checkmarks.

Migration outline (single migration, with grants + RLS as per the project rules):
```
create table public.prek_level_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grade_mode text not null default 'k5',
  world_number int not null,
  level_number int not null,
  best_stars smallint not null default 0,
  best_score int not null default 0,
  words_read int not null default 0,
  correct_words int not null default 0,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, grade_mode, world_number, level_number)
);
grant select, insert, update on public.prek_level_completions to authenticated;
grant all on public.prek_level_completions to service_role;
alter table public.prek_level_completions enable row level security;
create policy "own rows" on public.prek_level_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

### 3. Make sure every Pre-K completion path actually persists

- `handlePreKComplete` in `AuraPractice` must be the single source of truth. Move `awardVillageProgress`, `completeBattle`, and the new `prek_level_completions` upsert into one `try/finally` so a village token is granted iff the DB write succeeded.
- In `YubiVideoAdventure`, ensure the retry-then-correct branch (from last turn's fix) still funnels into `phase === "ending"` (or fire `onComplete` explicitly with `wordsAsked/scoreCredit`) so the final callback always runs. Add a hard-failsafe: on `onBack` after the last word was correct, fire `onComplete` if it hasn't fired yet.
- Add `console.debug` telemetry keyed `[PreK/complete]` around the three writes so the next regression is visible in the console.

### 4. Fix world-unlock collisions in prek theme

- In `RPGWorldMap.isWorldUnlocked`, when `mapTheme === 'prek'` keep the existing "Pre-K always unlocked" behavior but stop the `isBossRushUnlocked` check from firing (Boss Rush is classic-only).
- Namespace `worldProgress` lookups by `(mode, worldId)` internally to prevent future collisions.

### 5. Backfill existing players

One-shot SQL from existing `campaign_progress.world_progress` on prek players: for every `(user_id, world_number, story_title)` present, insert a `prek_level_completions` row with `best_stars = 2` (safe midpoint) and `words_read/correct_words = 0`. This restores star counts for kids who already played (like the Benny account with 60 books rescued) so their village state and world tiles look correct immediately.

### 6. Verification

After the change, verify against the current Benny row:
- World 4 should read `1/3 Complete`, ~2 stars.
- World 6 should read `5/6 Complete`, ~10 stars.
- Village should show tokens = `sum(best_stars > 0)` and unlock zones per the existing thresholds.
Run one Pre-K level end-to-end, confirm a `prek_level_completions` row appears and the world tile updates without reload.

## Files touched

- `src/pages/student/AuraPractice.tsx` — union world list, single-source completion handler.
- `src/components/aura/game/rpg/RPGWorldMap.tsx` — consume per-level stars, remove theme collisions.
- `src/components/aura/game/rpg/RPGLevelSelect.tsx` — show real stars/completion per level.
- `src/components/aura/game/rpg/YubiVideoAdventure.tsx` — guarantee `onComplete` fires on every successful finish path.
- New: `src/hooks/usePreKLevelStars.ts`.
- Migration: `prek_level_completions` table + grants + RLS + backfill.
- `src/hooks/useVillage.ts` — no logic change, but called from the new unified handler.
