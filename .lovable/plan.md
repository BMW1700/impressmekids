

# What's STILL Broken in Agent Mode — Full Diagnosis

## The Problems (from your screenshots)

### 1. Classic Goblin sprite renders instead of agent enemy sprite
The enemy ID mapping in `RPGCharacter.tsx` line 68 maps `'street_thug' → 'goblin'`, so it renders a **GoblinGuard** component. There are no agent-specific enemy SVG components — they don't exist yet. Every agent enemy just aliases to a classic fantasy sprite.

### 2. "Enchanted Forest" world badge shows in agent mode
`RPGBattleBackground.tsx` line 28-37 has a hardcoded `worldNames` map that only contains classic world names. World 1 = "Enchanted Forest" regardless of theme. No agent world names ("The Underground") exist here.

### 3. Dialogue says "Stand firm, Elara!" in agent mode
`RPGBattleArena.tsx` line 1233 always uses `heroDialogue` and `wizardDialogue` from `rpgBattleData.ts`, which contain classic fantasy lines like "Stand firm, Elara!" and "My magic is ready, Sir Valor!" — zero agent-themed dialogue exists.

### 4. Background theme doesn't trigger for agent enemies
`RPGBattleBackground` receives `enemyType={currentEnemyType}` from the arena (line 2100), but `currentEnemyType` is the generic campaign type (`'minion'`, `'guard'`) — NOT the specific agent ID (`'street_thug'`, `'hired_gun'`). So the agent background cases (lines 118-129) never match. It falls through to `'forest'` (green).

### 5. No unique agent enemy sprites exist
The `AgentX`, `Cipher`, `Shadow` hero components exist, but there are zero agent enemy components — no `StreetThug.tsx`, `HiredGun.tsx`, `CyberHacker.tsx`, etc. Agent enemies just render as goblins, trolls, and wraiths.

---

## Fix Plan

### A. Fix background theme selection for agent mode
**File: `RPGBattleBackground.tsx`**
- Import `getStoredTheme` from `gameTheme.ts`
- Add theme-aware world name map for agent worlds (1→"The Underground", 2→"Neon District", 3→"The Embassy", 4→"Syndicate HQ")
- In the theme selection logic, when `getStoredTheme() === 'agent'`, map `worldNumber` directly to the agent background theme instead of relying on `enemyType`:
  - World 0 → `'underground'`, World 1 → `'underground'`, World 2 → `'neon_district'`, World 3 → `'embassy'`, World 4 → `'syndicate_hq'`

### B. Create agent hero dialogue
**File: `src/lib/agentBattleData.ts`** (add at bottom)
- Add `agentHeroDialogue` and `agentCompanionDialogue` objects with spy/tech-themed lines:
  - Hero: "Stay sharp, team. This won't be easy." / "Intel says this area is hostile."
  - Companion: "Systems online. Ready for combat." / "I've got your six, agent."

### C. Wire agent dialogue into battle arena
**File: `RPGBattleArena.tsx`**
- Import agent dialogue objects
- In `getCurrentDialogue()`, check theme and use agent dialogue when `getStoredTheme() === 'agent'`

### D. Create agent enemy sprite components (5 new files)
Create visually distinct SVG sprite components for agent enemies that look like humans/robots, not fantasy creatures:

1. **`src/components/aura/game/characters/StreetThug.tsx`** — hooded figure with pipe, urban colors (gray/brown)
2. **`src/components/aura/game/characters/HiredGun.tsx`** — armored mercenary with visor, tactical gear (dark gray/green)
3. **`src/components/aura/game/characters/CyberHacker.tsx`** — figure with glowing visor and holographic displays (cyan/teal)
4. **`src/components/aura/game/characters/TheBroker.tsx`** — suited figure with briefcase, gold accents (amber/dark)
5. **`src/components/aura/game/characters/TheDirector.tsx`** — imposing figure in long coat, red lighting (red/black)

Each component follows the same pattern as existing sprites: accepts `state` (idle/attacking/hit/defeated), `healthPercent`, `currentHp`, `maxHp`, `size` props with idle breathing animation, attack animation, hit flash, and defeat fade.

### E. Wire agent enemy sprites into RPGCharacter.tsx
- Import the 5 new components
- Add new `SpriteType` values: `'street_thug_agent'`, `'hired_gun_agent'`, `'cyber_hacker_agent'`, `'the_broker_agent'`, `'the_director_agent'`
- Update the `idMap` to use these new types instead of classic fallbacks
- Add render branches in `renderPremiumSprite()` for each

### F. (Deferred) Agent-specific mini-games
You mentioned wanting different mini-games for older students — this will be the next phase after the visual/audio fixes above are confirmed working.

---

## Files Modified
1. `src/components/aura/game/rpg/RPGBattleBackground.tsx` — agent world names + theme-by-world logic
2. `src/lib/agentBattleData.ts` — agent dialogue objects
3. `src/components/aura/game/rpg/RPGBattleArena.tsx` — wire agent dialogue
4. `src/components/aura/game/rpg/RPGCharacter.tsx` — wire new agent enemy sprites
5. `src/components/aura/game/characters/StreetThug.tsx` — NEW
6. `src/components/aura/game/characters/HiredGun.tsx` — NEW
7. `src/components/aura/game/characters/CyberHacker.tsx` — NEW
8. `src/components/aura/game/characters/TheBroker.tsx` — NEW
9. `src/components/aura/game/characters/TheDirector.tsx` — NEW

