

# Plan: Expand Agent RPG to 14 Worlds with Grade-Aligned Stories

## Summary
Restructure agent campaign from 8 to 14 worlds, with stories dynamically assigned by decoded grade level. Keep existing 8 worlds identical (theme, enemies, backgrounds) but reassign stories. Add 6 new worlds with new themes, enemies, sprites, and backgrounds.

## World-to-Grade Mapping

| World | Name | Grade | Stories | Boss |
|-------|------|-------|---------|------|
| 0 | Training Facility | Tutorial | 1 | — |
| 1 | The Underground | 6 | First 6 | The Broker |
| 2 | Neon District | 6 | Next 6 | The Architect |
| 3 | The Embassy | 7 | First 6 | The Double Agent |
| 4 | Syndicate HQ | 7 | Next 6 | The Director |
| 5 | The Black Site | 8 | First 6 | The Warden |
| 6 | Skyfall Station | 8 | Next 5 | The Commander |
| 7 | The Deep Web | 9 | First 7 | The Phantom |
| 8 | Operation Endgame | 9 | Next 8 | The Overseer |
| 9 | **The Vault** | 10 | First 8 | **The Vault Keeper** |
| 10 | **Shadow Protocol** | 10 | Next 8 | **The Shadow Broker** |
| 11 | **Arctic Outpost** | 11 | First 7 | **The Frostbite** |
| 12 | **The Labyrinth** | 11 | Next 6 | **The Minotaur** |
| 13 | **Project Zero** | 12 | First 9 | **The Catalyst** |
| 14 | **Omega Directive** | 12 | Next 12 | **The Omega** |

## Implementation Steps

### Step 1: Sort agent stories by grade at export
**File: `src/data/agentStories.ts`**
- Sort the exported `agentStories` array by `grade_level` so that all grade-6 stories come first, then grade-7, etc.
- This makes sequential `storyIndex` values align with grade groupings

### Step 2: Rewrite agent campaign worlds
**File: `src/lib/agentCampaignData.ts`**
- Keep tutorial (world 0) as-is
- Keep worlds 1-8 with same name, description, gradient, bgColor, lore, enemyTypes, but update `storyCount`, `levels` array with correct `storyIndex` values and level counts
- Add worlds 9-14 with new themes:
  - **The Vault** (9): Military bunker / gold vault aesthetic, `from-yellow-700 via-amber-800 to-stone-900`
  - **Shadow Protocol** (10): Dark ops / stealth, `from-slate-800 via-gray-900 to-black`
  - **Arctic Outpost** (11): Frozen tundra / ice station, `from-blue-300 via-cyan-500 to-blue-800`
  - **The Labyrinth** (12): Underground maze / catacombs, `from-stone-600 via-amber-700 to-stone-800`
  - **Project Zero** (13): Secret lab / biotech, `from-green-400 via-emerald-600 to-teal-800`
  - **Omega Directive** (14): Final confrontation / high-tech fortress, `from-red-400 via-orange-500 to-yellow-600`
- Add new `AgentEnemyType` entries for new enemies
- Update `agentToClassicEnemyMap` for new enemy types

### Step 3: Add new enemy types to battle engine
**File: `src/lib/battleMechanics.ts`**
- Add new enemy types to `EnemyType` union: `vault_sentinel`, `vault_drone`, `the_vault_keeper`, `shadow_operative`, `shadow_drone`, `the_shadow_broker`, `frost_trooper`, `ice_drone`, `the_frostbite`, `maze_runner`, `tunnel_rat`, `the_minotaur`, `lab_guard`, `bio_drone`, `the_catalyst`, `omega_soldier`, `omega_elite`, `the_omega`
- Add tier mappings and base HP for worlds 9-14

### Step 4: Create 18 new enemy sprite components
**Directory: `src/components/aura/game/characters/`**
- 3 enemies per new world × 6 worlds = 18 new SVG sprite components
- Each with idle, attacking, hurt, defeated animation states
- Agent/tactical aesthetic (soldiers, drones, armored figures)

### Step 5: Update battle backgrounds
**File: `src/components/aura/game/rpg/RPGBattleBackground.tsx`**
- Add 6 new `BackgroundTheme` values: `vault`, `shadow_protocol`, `arctic_outpost`, `labyrinth`, `project_zero`, `omega_directive`
- Add world-to-theme mappings for worlds 9-14
- Add visual configs (sky gradients, ground colors, particles, special elements)
- Update `agentWorldNames` and `agentWorldToDbId` maps

### Step 6: Register sprites in RPGCharacter
**File: `src/components/aura/game/rpg/RPGCharacter.tsx`**
- Import all 18 new sprite components
- Add sprite type mappings
- Add render cases for each new enemy

### Step 7: Update boss silhouettes
**File: `src/components/aura/game/characters/BossSilhouettes.tsx`**
- Add silhouettes for 6 new bosses
- Export from `index.ts`

### Step 8: Update level select
**File: `src/components/aura/game/rpg/RPGLevelSelect.tsx`**
- Ensure world selector supports 15 worlds (0-14)

## Technical Details

### Story Index Calculation
The `agentStories` export will be sorted by grade. At build time, the indices will be:
- Grade 6 stories: indices 0-11 (12 stories, 6 per world)
- Grade 7 stories: indices 12-22 (11 stories, 6+5 per world... but user wants 6+6=12)

**Critical**: The user's requested story counts total: 6+6+6+6+6+5+7+8+8+8+7+6+9+12 = **100 stories** across 14 worlds. The current audit shows 12+11+11+33+43+13+46 = 169 stories. There are enough stories, but I need to verify exact counts per grade match what's requested:
- Grade 6: needs 12 (have 12) ✅
- Grade 7: needs 12 (have 11) — **1 short, need to add 1 story**
- Grade 8: needs 11 (have 11) ✅
- Grade 9: needs 15 (have 33) ✅
- Grade 10: needs 16 (have 43) ✅
- Grade 11: needs 13 (have 13) ✅
- Grade 12: needs 21 (have 46) ✅

### Files to create (18 new enemy sprites)
- `VaultSentinel.tsx`, `VaultDrone.tsx`, `TheVaultKeeper.tsx`
- `ShadowOperative.tsx`, `ShadowDrone.tsx`, `TheShadowBroker.tsx`
- `FrostTrooper.tsx`, `IceDrone.tsx`, `TheFrostbite.tsx`
- `MazeRunner.tsx`, `TunnelRat.tsx`, `TheMinotaur.tsx`
- `LabGuard.tsx`, `BioDrone.tsx`, `TheCatalyst.tsx`
- `OmegaSoldier.tsx`, `OmegaElite.tsx`, `TheOmega.tsx`

### Files to modify
- `src/data/agentStories.ts` — sort by grade + add 1 grade-7 story
- `src/lib/agentCampaignData.ts` — 14 worlds with correct indices
- `src/lib/battleMechanics.ts` — new enemy types + stats
- `src/components/aura/game/rpg/RPGBattleBackground.tsx` — 6 new themes
- `src/components/aura/game/rpg/RPGCharacter.tsx` — register 18 sprites
- `src/components/aura/game/rpg/RPGLevelSelect.tsx` — support 15 worlds
- `src/components/aura/game/characters/index.ts` — export new sprites
- `src/components/aura/game/characters/BossSilhouettes.tsx` — 6 new boss silhouettes

