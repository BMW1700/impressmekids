

# Brutally Honest Audit: What's Broken

## Critical Bug — Worlds 5-8 Bosses Cannot Appear

The 4 new boss **sprites** (TheWarden, TheCommander, ThePhantom, TheOverseer) exist as visual components, but they have **no battle data** — no HP, no attack stats, no dialogue, no abilities, no miniGame pools. They are hollow shells.

`getAgentBossForWorld()` in `agentBattleData.ts` only handles worlds 1-4 and falls back to **The Broker** for everything else. So if a student reaches World 5+, every boss fight is The Broker with World 1 stats. That's a game-breaking bug.

Additionally, `the_overseer` is mapped as `'boss'` instead of `'final_boss'` in `agentToClassicEnemyMap`, so even once fixed, The Overseer won't get final-boss-level treatment.

## What's Actually Working

- All 25 minigames are themed correctly for agent mode
- All 12 standard enemy/boss sprites render correctly in `RPGCharacter.tsx`
- 53 stories exist (more than the 52 needed)
- 9 worlds with proper level configs exist in `agentCampaignData.ts`
- Hero characters (Agent X, Cipher, Shadow) are fully wired

## The Fix — `agentBattleData.ts`

### 1. Create 4 missing boss enemy data objects
Add `theWarden`, `theCommander`, `thePhantom`, and `theOverseer` as full `RPGEnemy` objects in `agentBattleData.ts` with:
- Unique HP/attack/defense stats (scaling up per world difficulty)
- Unique dialogue lines (intro, attack, defeat) matching their character
- Unique special abilities (2-3 each)
- Appropriate miniGame pools
- Correct enemy IDs matching the sprite mapping (`the_warden`, `the_commander`, `the_phantom`, `the_overseer`)

### 2. Fix `getAgentBossForWorld()` 
Add cases for worlds 5-8:
- World 5 → `theWarden`
- World 6 → `theCommander`  
- World 7 → `thePhantom`
- World 8 → `theOverseer`

### 3. Fix `agentToClassicEnemyMap` in `agentCampaignData.ts`
Change `the_overseer: 'boss'` → `the_overseer: 'final_boss'`

### Files to modify
- `src/lib/agentBattleData.ts` — add 4 boss objects + fix world mapping
- `src/lib/agentCampaignData.ts` — fix overseer type mapping

### What stays the same
Everything else — sprites, minigame themes, stories, campaign levels, hero data — is all correct and working.

