

# Brutally Honest: What's STILL Broken

**The core problem**: `RPGBattleArena.tsx` — the actual battle engine — has zero awareness of Agent Mode. It never imports or uses agent hero/enemy data. Every agent battle still uses classic `heroKnight`, `allyWizard`, and `princessElla`.

## Issue 1: Agent heroes never load in battle
`RPGBattleArena.tsx` line 227-232 always returns classic heroes (`heroKnight`/`allyWizard`/`princessElla`). The `getAgentHero()` function in `agentBattleData.ts` exists but is never called. So even though Agent X shows on the character select screen, the battle uses Sir Valor's stats and name.

## Issue 2: Agent enemies never load in battle
Same problem — `getAgentEnemy()` and `getAgentBossForWorld()` exist but are never called. Every agent battle spawns classic goblins and dragons.

## Issue 3: Wrong ID mapping in `getSpriteType()`
The sprite mapper checks `hero.id === 'valor'` but the actual hero IDs are `'knight'`, `'wizard'`, `'ella'` (even the agent hero objects use these same IDs). So the agent sprite rendering branch never triggers — agents always render as classic knight/wizard/princess sprites.

## Issue 4: Agent stories never load
Need to verify if `AuraReadingSection.tsx` actually passes agent stories to the battle arena, or if the wiring stops before reaching combat.

---

## Fix Plan

### A. `RPGBattleArena.tsx` — Make battle theme-aware
- Import `getStoredTheme` and `getAgentHero` from agent data
- Update `getCharacterData()` to return agent hero objects when theme is `'agent'`
- This gives battles the right names ("Agent X" not "Sir Valor"), stats, abilities, and colors

### B. `RPGCharacter.tsx` — Fix `getSpriteType()` ID mapping
- Change `hero.id === 'valor'` → `hero.id === 'knight'`
- Change `hero.id === 'wizard' || hero.id === 'cipher'` → `hero.id === 'wizard'`  
- Change `hero.id === 'ella' || hero.id === 'shadow'` → `hero.id === 'ella'`
- These are the actual IDs the hero objects use, so the agent theme check + correct ID = correct sprite

### C. Verify story/enemy wiring in `AuraReadingSection.tsx`
- Confirm agent stories and agent enemies are actually passed through to `RPGBattleArena` props
- If not, wire them through

### Files Modified
1. `src/components/aura/game/rpg/RPGBattleArena.tsx` — theme-aware hero data loading
2. `src/components/aura/game/rpg/RPGCharacter.tsx` — fix 3 lines in `getSpriteType()`
3. Possibly `src/components/student/sections/AuraReadingSection.tsx` — verify enemy/story passthrough

