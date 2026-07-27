## What I verified (and what I did not)

Verified:
- `bunx tsgo --noEmit` is clean — both crashes are **runtime-only**, not type/build errors.
- RPG: `RPGCharacterSelect` is rendered *inside* `RPGBattleArena.tsx:2806`. So "nothing after Choose Your Hero" means the throw happens when the arena falls through to its main battle JSX after `handleCharacterSelect` (`RPGBattleArena.tsx:884-901`). All `rpgGameFeel` imports resolve, and `getCharacterData` always returns a non-null fallback — so the usual suspects are ruled out.
- Pre-K: World 6 ("Learn About Different Foods With Benny") is a **CMS/database-only** world, not in the hardcoded `campaignWorlds`. The "4/1 Levels" card is real: `AuraPractice.tsx:809-841` computes `levelsCompleted` from historical star/completion rows while `totalLevels` comes from `meta.level_count` (currently-published levels only). They are never reconciled.
- On entering that level, `YubiEpisodeWrapper.tsx:48-81` tries the DB level, then `hasVideoLevel()` from the hardcoded video data (World 6 isn't there), then falls through to legacy `YubiAdventure` — which has no data for a CMS-only world. That fall-through path is the most likely source of the black screen.

**Not verified:** the exact throwing line in the RPG battle mount. I could not sign in from the sandbox, so I refuse to name a root cause I haven't seen. Step 1 below exists to get it.

## The plan

### Step 1 — Make the crash tell us what it is (diagnostic, ships anyway)
- In `ErrorBoundary`, surface the underlying `error.message` + component stack in preview/dev builds (collapsed "Technical details" block, hidden in production). Right now the fallback throws away the only useful information.
- Add a `console.error` with the full error object at the boundary so it lands in the console logs I can read next turn.

### Step 2 — Fix the RPG battle-mount crash
With the message in hand, fix the actual throw. Based on what's still unexamined, the prime candidates are the hero sprite branches in `RPGCharacter.tsx` (~287-830, skin-variant/alpha-webm lookups), `RPGCoachMarks`, `RPGGearLocker`/`RPGDailyHubPanel` mounting hooks (`useSeasonPass`, `useActiveSeason`, `useDailyQuests`) before their data resolves. Whatever it is, the fix is applied at the source, plus:
- Defensive guards on every `.find()`/row-shape access in the post-selection render path so a single bad row can never blank the whole battle.
- A local error boundary around the battle arena so a future presentation-layer throw degrades to a retryable panel instead of nuking the app.

### Step 3 — Fix Pre-K CMS worlds rendering black
- `PreKEpisodeRouter`: when the DB level build returns `null` **and** there is no hardcoded video level, stop falling through to legacy `YubiAdventure`. Render an explicit "This adventure isn't ready yet" card with a Back button instead of nothing.
- Log which required video URL was missing so the CMS side is diagnosable.
- Make the world card refuse to open a world with zero playable published levels (locked state) rather than routing into a dead end.

### Step 4 — Fix the "4/1 Levels" count
- Clamp `levelsCompleted` to `totalLevels` in `AuraPractice.tsx:809-841` so completions against unpublished/deleted levels can never exceed the published count. Presentation-only clamp; no data is deleted.

### Step 5 — Re-verify
- Walk the real signed-in flow: world map → level → hero select → first battle, and Pre-K World 6, capturing console output. I only report these fixed after I see clean runs, not after the code compiles.

## Then, the game-feel plan
Once both crashes are closed, I ship the previously approved pass unchanged: in-battle combat coach-marks (Ultimate meter, streak decay bar, block window), a one-time "BLOCKED!" teaching moment, and the scripted unloseable first battle.

## Guardrails
- Steps 2-4 stay in the presentation/routing layer. No damage math, quest credit, speech pipeline, or database schema changes.
- The `4/1` clamp is display-only — no progress rows are modified or deleted.
