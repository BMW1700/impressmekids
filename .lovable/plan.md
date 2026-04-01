

# Agent Mode — Spy-Themed RPG Campaign for High Schoolers

## Overview
Add a parallel "Agent Mode" theme to the RPG campaign targeting 9-12th graders. Same battle engine, same reading mechanics, same backend — just different characters, enemies, worlds, stories, and visual identity. Users pick their mode during onboarding AND can switch from the RPG entry screen.

## Architecture Approach
Introduce a `gameTheme` concept (`'classic' | 'agent'`) that flows through the existing component tree. All campaign data, character definitions, and story content get a parallel "agent" version. The battle engine (`RPGBattleArena`) stays 100% untouched — it receives enemy stats + story data the same way regardless of theme.

```text
┌─────────────────────────────────────┐
│         Theme Selection             │
│   Onboarding + RPG Entry Toggle     │
│     stores: localStorage +          │
│     user_profiles.game_theme        │
└──────────────┬──────────────────────┘
               │ gameTheme = 'classic' | 'agent'
               ▼
┌──────────────────────────────────────┐
│   Theme-aware Data Layer             │
│   campaignData.ts (classic worlds)   │
│   agentCampaignData.ts (spy worlds)  │
│   curatedStories.ts (K-8 stories)    │
│   agentStories.ts (9-12 stories)     │
│   rpgBattleData.ts (classic enemies) │
│   agentBattleData.ts (spy enemies)   │
└──────────────┬───────────────────────┘
               │ same RPGEnemy / CuratedStory interfaces
               ▼
┌──────────────────────────────────────┐
│   RPGBattleArena (UNCHANGED)         │
│   Same engine, same mini-games       │
│   Same damage formulas               │
└──────────────────────────────────────┘
```

---

## Step-by-Step Plan

### Step 1: Theme Context & Storage
- Create `src/lib/gameTheme.ts` — exports a `GameTheme` type, a React context, and helper to get/set theme from localStorage
- Add `game_theme` column to `profiles` table (nullable text, default null) via migration so it persists across devices
- When null → show theme selector; when set → auto-route

### Step 2: Theme Selector UI
- Create `src/components/aura/game/rpg/ThemeSelector.tsx` — full-screen selector shown:
  - On first RPG launch (onboarding gate)
  - As a toggle button on the RPG world map header
- **Classic Adventure**: Knight/wizard artwork, fantasy gradient, "Grades K-8"
- **Agent Mode**: Spy silhouette, dark/neon gradient, "Grades 9-12"
- Selecting a theme saves to localStorage + profiles table

### Step 3: Agent Campaign Data (4 Worlds)
Create `src/lib/agentCampaignData.ts` with the same `CampaignWorld` interface:

| World | Name | Theme | Boss | Levels |
|-------|------|-------|------|--------|
| 1 | The Underground | Infiltrate a criminal network | The Broker | 5 |
| 2 | Neon District | Hack through a cyber city | The Architect | 6 |
| 3 | The Embassy | Diplomatic espionage | The Double Agent | 6 |
| 4 | The Syndicate HQ | Final showdown | The Director | 7 |

Enemy types (new): `street_thug`, `hired_gun`, `cyber_hacker`, `drone_sentry`, `rogue_agent`, `bodyguard`, `operative`, `enforcer`, `the_broker`, `the_architect`, `the_double_agent`, `the_director`

### Step 4: Agent Stories (9-12 Reading Level)
Create `src/data/agentStories.ts` — ~24 stories using the same `CuratedStory` interface:
- Higher Lexile/grade-level text (grade 9-12)
- Spy/thriller themes: intelligence briefings, code-breaking, geopolitics, forensics, cybersecurity
- Same word_count ranges as current stories but with advanced vocabulary
- Maps to agent world levels via `storyIndex` just like classic mode

### Step 5: Agent Enemy Stats
Create `src/lib/agentBattleData.ts` — uses the same `RPGEnemy` interface with spy-themed enemies:
- Same HP/attack/defense scaling as classic enemies (4x HP values)
- Same mini-game assignments (the mini-games themselves don't change)
- Different dialogue (spy taunts instead of goblin taunts)
- Same signature abilities mapped to existing mini-game types

### Step 6: Agent Hero Characters (SVG Sprites)
Create 3 new character sprite components in `src/components/aura/game/characters/`:
- `AgentX.tsx` — male agent, dark suit, balanced stats (= Sir Valor)
- `Cipher.tsx` — female hacker, tech gear, glass cannon (= Elara)
- `Shadow.tsx` — stealth specialist, hooded, balanced (= Princess Ella)
- Same animation states (`idle`, `attack`, `hit`, `defeated`) using SVG like existing sprites

### Step 7: Agent Character Select
Create `src/components/aura/game/rpg/AgentCharacterSelect.tsx`:
- Same layout as `RPGCharacterSelect.tsx` but dark/neon aesthetic
- Shows Agent X, Cipher, Shadow with spy-themed descriptions
- Maps to same `PlayableCharacter` type internally

### Step 8: Wire Theme Through Existing Components
Modify these files to read `gameTheme` and swap data sources:

- **`AuraPractice.tsx` + `AuraReadingSection.tsx`**: Import theme context, use `agentCampaignData`/`agentStories` when theme is `'agent'`
- **`RPGWorldMap.tsx`**: Swap world icons, gradients, and boss silhouettes based on theme
- **`RPGLevelSelect.tsx`**: No structural changes — just receives themed data
- **`RPGCharacterSelect.tsx`**: Render `AgentCharacterSelect` when theme is `'agent'`
- **`RPGBattleArena.tsx`**: NO changes — it already receives enemies/stories as props
- **`RPGBattleBackground.tsx`**: Add agent world backgrounds (urban/neon/embassy/syndicate gradients)
- **`RPGCharacterSprite.tsx`**: Add agent character rendering branch

### Step 9: Agent Boss Silhouettes
Create agent boss silhouettes in `BossSilhouettes.tsx`:
- `BrokerSilhouette`, `ArchitectSilhouette`, `DoubleAgentSilhouette`, `DirectorSilhouette`

---

## What Does NOT Change
- `RPGBattleArena.tsx` battle engine — zero modifications
- All mini-games — same components, same mechanics
- Damage formulas, HP scaling, spell system
- Backend tables (reading_sessions, campaign progress, etc.)
- Stripe/subscription gating (worlds 2+ still gated)
- Boss Rush mode structure

## Files Created (New)
1. `src/lib/gameTheme.ts`
2. `src/lib/agentCampaignData.ts`
3. `src/lib/agentBattleData.ts`
4. `src/data/agentStories.ts`
5. `src/components/aura/game/rpg/ThemeSelector.tsx`
6. `src/components/aura/game/rpg/AgentCharacterSelect.tsx`
7. `src/components/aura/game/characters/AgentX.tsx`
8. `src/components/aura/game/characters/Cipher.tsx`
9. `src/components/aura/game/characters/Shadow.tsx`

## Files Modified
1. `src/pages/student/AuraPractice.tsx` — theme-aware data routing
2. `src/components/student/sections/AuraReadingSection.tsx` — same
3. `src/components/aura/game/rpg/RPGWorldMap.tsx` — theme toggle + agent visuals
4. `src/components/aura/game/rpg/RPGCharacterSelect.tsx` — delegate to agent select
5. `src/components/aura/game/rpg/RPGBattleBackground.tsx` — agent world backgrounds
6. `src/components/aura/game/rpg/RPGCharacterSprite.tsx` — agent character rendering
7. `src/components/aura/game/characters/BossSilhouettes.tsx` — agent boss silhouettes
8. `src/components/aura/game/characters/index.ts` — export new characters

## Database Migration
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS game_theme text DEFAULT null;
```

