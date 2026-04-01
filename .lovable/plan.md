

# Brutally Honest Assessment: What's Still Broken

No console errors, but there are **critical wiring gaps** in `RPGCharacter.tsx` — the component that actually renders characters during battle. The agent sprites, backgrounds, and silhouettes you added exist, but **they never get used in combat** because `RPGCharacter.tsx` was never updated.

## The Problems

### 1. Agent heroes render as classic sprites in battle
`getSpriteType()` (line 86-89) only checks for `wizard`, `ella`, and defaults to `knight`. When you pick Agent X, Cipher, or Shadow, they all render as the classic knight sprite.

### 2. Agent enemies render as goblins
The enemy `idMap` (lines 49-63) has no entries for `street_thug`, `hired_gun`, `cyber_hacker`, `drone_sentry`, `rogue_agent`, `bodyguard`, `operative`, `enforcer`, `the_broker`, `the_architect`, `the_double_agent`, or `the_director`. They all fall through to the default `'goblin'` sprite.

### 3. Type assertions strip agent types
Lines 400 and 497 cast `spriteType` to only classic types — even if we fixed the mapping, the agent types would get cast away before reaching `RPGCharacterSprite`.

### 4. No premium sprite rendering for agents
The `renderPremiumSprite()` function doesn't import or handle `AgentX`, `Cipher`, or `Shadow` components. Agent heroes won't get the nice SVG sprites even though they exist.

## Fix Plan

**Single file: `src/components/aura/game/rpg/RPGCharacter.tsx`**

### A. Add imports for agent character components
Import `AgentX`, `Cipher`, `Shadow` from the characters directory.

### B. Extend `SpriteType` to include agent types
Add `'agent_x' | 'cipher' | 'shadow_agent'` plus agent enemy sprite aliases to the union type.

### C. Update `getSpriteType()` for agent heroes
Map hero IDs: when theme is agent and `hero.id === 'valor'` → `'agent_x'`, `'elara'` → `'cipher'`, `'ella'` → `'shadow_agent'`.

### D. Update `getSpriteType()` for agent enemies
Add agent enemy IDs to the `idMap` — they can reuse existing sprite types as visual stand-ins (e.g., `street_thug` → `goblin`, `the_broker` → `grog_king`) until dedicated agent enemy sprites are created, OR map them to the closest fitting existing sprites.

### E. Add agent hero premium sprite rendering
Add branches in `renderPremiumSprite()` for `agent_x`, `cipher`, `shadow_agent` that render the corresponding SVG components with proper animation states.

### F. Fix type assertions on lines 400 and 497
Include agent types in the type union so they pass through correctly.

## Result
After this fix, picking Agent X in agent mode will show the Agent X SVG in battle, agent enemies will render with appropriate sprites, and the full visual loop will be complete.

