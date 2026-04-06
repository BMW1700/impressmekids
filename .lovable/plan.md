

# Fix: Agent Mode Shows Classic Spells

## Root Cause

`PlayableCharacter` type is `'valor' | 'elara' | 'ella'` — classic IDs only. `AgentCharacterSelect` maps agent heroes to classic IDs:
- Agent X → `onSelect('valor')`
- Cipher → `onSelect('elara')`  
- Shadow → `onSelect('ella')`

So when `RPGCommandMenu.getCharacterSpells()` checks `selectedCharacter`, it sees `'elara'` (not `'cipher'`) and returns `elaraSpells` (Lightning Bolt, Ice Shard, Fireball) instead of `cipherSpells` (Data Burst, System Hack, Firewall).

The agent spell arrays (`agentXSpells`, `cipherSpells`, `shadowSpells`) exist and are correctly defined. They just never get selected because the character IDs are wrong.

## Fix

### 1. Expand `PlayableCharacter` type
**File: `RPGCharacterSelect.tsx`** line 10

Change from:
```ts
export type PlayableCharacter = 'valor' | 'elara' | 'ella';
```
To:
```ts
export type PlayableCharacter = 'valor' | 'elara' | 'ella' | 'agent_x' | 'cipher' | 'shadow';
```

### 2. Update `AgentCharacterSelect` to pass agent IDs
**File: `AgentCharacterSelect.tsx`**

- Line 43: `onSelect('valor')` → `onSelect('agent_x')`
- Line 84: `onSelect('valor')` → `onSelect('agent_x')`
- Line 101: `onSelect('elara')` → `onSelect('cipher')`
- Line 142: `onSelect('elara')` → `onSelect('cipher')`
- Line 159: `onSelect('ella')` → `onSelect('shadow')`
- Line 200: `onSelect('ella')` → `onSelect('shadow')`

### 3. Update `RPGBattleArena.tsx` companion logic
Line 490 hardcodes `allCharacters` as `['valor', 'elara', 'ella']`. In agent mode this must be `['agent_x', 'cipher', 'shadow']`.

### 4. Update `RPGBattleArena.tsx` Elara-specific logic
Multiple places check `selectedCharacter === 'elara'` for the charge/barrage mechanic. Cipher should use the same mechanic, so add `|| selectedCharacter === 'cipher'` to those checks (lines ~1700, 1810, 2665, 2698, 2765-2766).

## Files Modified
1. `src/components/aura/game/rpg/RPGCharacterSelect.tsx` — expand type
2. `src/components/aura/game/rpg/AgentCharacterSelect.tsx` — use agent IDs
3. `src/components/aura/game/rpg/RPGBattleArena.tsx` — companion array + cipher charge checks

