

# Plan: Expand Classic RPG to 12 Worlds with Grade-Aligned Stories

## Summary

Restructure the 8 existing Classic RPG worlds into 12 worlds, reassign stories by grade level (K–5, split into pairs per grade), add 4 new worlds (9–12) with new enemy types, sprites, battle backgrounds, and battle data.

## Current State

- **8 worlds** (IDs 1–8) + tutorial (ID 0), using `storyIndex` into `curatedStories[]`
- **110 stories** in `curatedStories`: K=18, 1=19, 2=18, 3=18, 4=19, 5=18
- Story indices by grade: K→0-7,48-57 | 1→8-15,58-67,108 | 2→16-23,68-77 | 3→24-31,78-87 | 4→32-39,88-97,109 | 5→40-47,98-107

## New World Structure

| World | Name | Grade | Stories (count) | Enemies | Status |
|-------|------|-------|-----------------|---------|--------|
| 0 | Tutorial | — | Tutorial text (1) | minion | Keep as-is |
| 1 | The Enchanted Forest | K | First 5 Grade-K stories | minion (existing) | Reassign storyIndex only |
| 2 | The Frozen Depths | K | Next 5 Grade-K stories | minion, guard, ice_golem (existing) | Reassign storyIndex only |
| 3 | The Ancient Ruins | 1 | First 5 Grade-1 stories | guard, elite, stone_guardian (existing) | Reassign storyIndex only |
| 4 | The Throne Room | 1 | Next 5 Grade-1 stories | elite, boss, final_boss (existing) | Reassign storyIndex only |
| 5 | The Whispering Caverns | 2 | First 6 Grade-2 stories | cave_troll, crystal_spider, echo_wraith (existing) | Reassign storyIndex only |
| 6 | The Floating Isles | 2 | Next 6 Grade-2 stories | storm_harpy, cloud_giant, zephyr (existing) | Reassign storyIndex only |
| 7 | The Sunken Library | 3 | First 7 Grade-3 stories | ink_kraken, reef_guardian, leviathan (existing) | Reassign storyIndex only |
| 8 | The Void Between | 3 | Next 7 Grade-3 stories | void_phantom, reality_shifter, word_eater (existing) | Reassign storyIndex only |
| 9 | **The Ember Highlands** | 4 | First 5 Grade-4 stories | **fire_elemental, lava_hound, ember_drake** | **NEW** |
| 10 | **The Crystal Citadel** | 4 | Next 5 Grade-4 stories | **crystal_knight, prism_mage, crystal_queen** | **NEW** |
| 11 | **The Starfall Peaks** | 5 | First 6 Grade-5 stories | **star_sprite, comet_wolf, nova_titan** | **NEW** |
| 12 | **The Eternal Archive** | 5 | Next 5 Grade-5 stories | **tome_golem, page_wraith, the_librarian** | **NEW** |

## What Changes

### 1. New Enemy Types & Sprites (12 new enemies across 4 worlds)

Create 12 new SVG sprite components following the existing pattern (state type + animated SVG):
- **World 9**: `FireElemental`, `LavaHound`, `EmberDrake` (boss)
- **World 10**: `CrystalKnight`, `PrismMage`, `CrystalQueen` (boss)
- **World 11**: `StarSprite`, `CometWolf`, `NovaTitan` (boss)
- **World 12**: `TomeGolem`, `PageWraith`, `TheLibrarian` (final boss)

### 2. Update `campaignData.ts`
- Add 12 new enemy types to `CampaignEnemyType` union
- Reassign all `storyIndex` values in worlds 1–8 to use grade-appropriate story indices
- Add worlds 9–12 with proper level data, lore, gradients, enemy compositions
- Last level in each world = boss battle (`isBossLevel: true`)

### 3. Update `battleMechanics.ts`
- Add 12 new types to `EnemyType` union
- Add tier mappings for new enemies (fire_elemental→guard, lava_hound→minion, ember_drake→boss, etc.)
- Add base HP for worlds 9–12 in `baseHpByWorld`

### 4. Update `RPGBattleBackground.tsx`
- Add enemy type to props union
- Add 4 new background themes: `ember_highlands`, `crystal_citadel`, `starfall_peaks`, `eternal_archive`
- Map new enemy types → background themes
- Add theme gradient styles for each

### 5. Update `RPGCharacter.tsx`
- Import 12 new sprite components
- Add sprite types and mappings
- Add render cases for each new enemy

### 6. Update `RPGBattleArena.tsx`
- Add new enemy types to `EnemyType` union
- Add new battle phases/mini-games if needed (or reuse existing ones)

### 7. Update `RPGLevelSelect.tsx`
- Add emoji icons for 12 new enemy types in `enemyIcons`

### 8. Update `AuraPractice.tsx`
- Add new enemy types to `enemyMap`

### 9. Update character `index.ts` exports
- Export all 12 new sprite components

### 10. Update `BossSilhouettes.tsx`
- Add silhouettes for 4 new bosses (EmberDrake, CrystalQueen, NovaTitan, TheLibrarian)

### Files to create
- `src/components/aura/game/characters/FireElemental.tsx`
- `src/components/aura/game/characters/LavaHound.tsx`
- `src/components/aura/game/characters/EmberDrake.tsx`
- `src/components/aura/game/characters/CrystalKnight.tsx`
- `src/components/aura/game/characters/PrismMage.tsx`
- `src/components/aura/game/characters/CrystalQueen.tsx`
- `src/components/aura/game/characters/StarSprite.tsx`
- `src/components/aura/game/characters/CometWolf.tsx`
- `src/components/aura/game/characters/NovaTitan.tsx`
- `src/components/aura/game/characters/TomeGolem.tsx`
- `src/components/aura/game/characters/PageWraith.tsx`
- `src/components/aura/game/characters/TheLibrarian.tsx`

### Files to modify
- `src/lib/campaignData.ts`
- `src/lib/battleMechanics.ts`
- `src/components/aura/game/rpg/RPGBattleBackground.tsx`
- `src/components/aura/game/rpg/RPGCharacter.tsx`
- `src/components/aura/game/rpg/RPGBattleArena.tsx`
- `src/components/aura/game/rpg/RPGLevelSelect.tsx`
- `src/pages/student/AuraPractice.tsx`
- `src/components/aura/game/characters/index.ts`
- `src/components/aura/game/characters/BossSilhouettes.tsx`

