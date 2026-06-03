## Goal
Split the three Pre-K worlds (101 Nabu Village, 102 Bobo, 103 Echo) out of **Classic Adventure** and surface them as their own **Pre-K** mode card on the "Choose Your Adventure" screen, next to Classic and Agent.

Pre-K gameplay, animations, copy, sprites, characters, success states, mic, stars, and the underlying `RPGOneWordReader` stay 100% unchanged. K–12 Classic combat and Agent Mode are not touched.

## Changes

### 1. `src/lib/gameTheme.ts`
- Extend `GameTheme` to `'classic' | 'agent' | 'prek'`.
- `getStoredTheme()` accepts/persists `'prek'`.
- `getGradeMode('prek')` returns `'k5'` so Pre-K continues to read/write under the existing K-5 namespace (no DB or progress changes).

### 2. `src/pages/game/GameDashboard.tsx`
- Switch the "Choose Your Adventure" grid from 2 cols to 3 (`grid-cols-1 sm:grid-cols-3`).
- Add a third **Pre-K** card (pink/rose gradient, sparkle icon, "Ages 3–5" pill, copy: *"Big friendly words with Bobo, Echo, and Nabu Village. Made for our youngest readers."*, button: "✨ Start Pre-K").
- Widen `handleModeSelect` to `'classic' | 'agent' | 'prek'`; same routing (`/game/play?tab=rpg`).

### 3. `src/pages/student/AuraPractice.tsx`
Change `activeWorlds` selection (line 105) to:
- `'agent'` → `agentCampaignWorlds`
- `'prek'` → `campaignWorlds.filter(w => w.mode === 'prek')`
- default (`'classic'`) → `campaignWorlds.filter(w => w.mode !== 'prek')`

`activeStories` stays as today.

### 4. `src/components/student/sections/AuraReadingSection.tsx`
Apply the same three-branch filter to its local `activeWorlds` (line 86) so the embedded student-dashboard reading section matches.

### 5. `src/components/aura/game/rpg/RPGWorldMap.tsx`
- Line 441: same three-branch filter when mapping world cards.
- Line 461: replace `campaignWorlds.length` with `displayedWorlds.length` (compute once at top of map).
- Cosmetic only: when theme is `'prek'`, the "Switch" pill (line 296) reads "✨ Pre-K — Switch"; header titles (lines 366/370) read "✨ Pre-K Adventure" / "Help your Nabu friends find their voice!".

### 6. `src/components/aura/game/rpg/ThemeSelector.tsx`
Add a third **Pre-K** card mirroring the dashboard card so users can switch into/out of Pre-K from the in-game theme picker. Same layout, pink/rose styling, "Ages 3–5" pill.

## Out of Scope / Untouched
- `RPGOneWordReader`, `nabuStoryCopy`, `RPGCharacterSprite` moods, village backdrop, success messages, Pre-K word banks, verb animations.
- K–12 Classic combat: knight/wizard/Ella, RPG battle, minigames, Castle Swarm.
- Agent Mode: characters, enemies, story routing, vocabulary/intel labels.
- Mic/speech, Hear buttons, star thresholds, level unlocks, map navigation, character select.
- Database, RLS, `grade_mode` column (Pre-K continues under `k5`).

## Risks & Mitigations
- Many files branch on `theme === 'agent'` vs not. Because Pre-K is "not agent", those branches keep classic-style copy/labels — which is fine since the Pre-K card itself uses the existing Pre-K world UI (`mode === 'prek'` routes directly into the one-word reader and never reaches K–12 combat).
- `getGradeMode('prek') = 'k5'` preserves all existing K-5 reading-stats/campaign-progress queries.
- Classic users with progress on 101/102/103 keep that progress (keyed by world id); it just appears under the Pre-K card now.

## Confirmation
- K–12 Classic combat: untouched
- Agent Mode: untouched
- Mic / Hear / stars / unlocks / navigation: untouched
- Pre-K animations, copy, success messages, backdrops: untouched
