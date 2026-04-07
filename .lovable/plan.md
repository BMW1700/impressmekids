

# Brutally Honest Audit: Store-to-Battle Wiring

## What Works
- `usePlayerInventory` is imported and called in `RPGBattleArena.tsx` — confirmed
- `getActiveUpgrades()` is called and feeds into damage (`attack_boost`), HP (`health_boost`), MP (`mp_boost`), gold (`gold_boost`), and XP (`xp_boost`) calculations — confirmed
- `battleInventory` reads real potion quantities from the database with a starter-kit fallback — confirmed
- `usePotion.mutate()` is called when items are consumed in battle — confirmed
- All 4 new bosses (Warden, Commander, Phantom, Overseer) have full battle data and correct world mapping — confirmed

## What's Still Broken

### 1. Purchased Powers Never Appear in the Spell Menu (CRITICAL)
The store sells 20+ purchasable powers (EMP Blast, Drone Strike, Arcane Blast, etc.) but the spell menu in `RPGSpellMenu.tsx` only ever shows the **hardcoded character spells** (e.g., `valorSpells`, `agentXSpells`). There is zero code that checks the player's inventory for purchased powers and adds them to the available spell list.

A student buys "Drone Strike" for 600 gold → opens the Tech/Magic menu in battle → it's not there. That's a trust-destroying bug.

### 2. Purchased Skins Don't Render (MINOR)
`RPGCharacter.tsx` has no prop or logic for skin variants. `getEquippedSkin()` exists in the hook but is never called by the battle arena or character renderer. Students equip a skin in the store → character looks the same in battle.

### 3. Starter Kit Overlap Issue (MINOR)
The starter kit logic gives every player `Math.max(dbQuantity, 2)` health potions. If a student has 1 health potion in the DB, they still see 2 in battle. This means potions appear to regenerate. Not game-breaking, but inconsistent.

## The Fix

### Phase 1: Wire purchased powers into the spell menu
- In `RPGBattleArena.tsx`, query `playerInventory` for items with `category === 'power'`
- Convert them to `Spell` objects (using `STORE_ITEMS` data for damage, mpCost, effect)
- Merge them with the character's default spells before passing to `RPGCommandMenu`
- In `RPGSpellMenu.tsx`, accept and render these additional spells (they already conform to the `Spell` interface)

### Phase 2: Wire equipped skins into character rendering
- In `RPGBattleArena.tsx`, call `playerInventory.getEquippedSkin(characterId)` 
- Pass the result as a `skinVariant` prop to `RPGCharacter`
- In `RPGCharacter.tsx`, accept `skinVariant` prop and apply color/style overrides based on the variant

### Phase 3: Fix starter kit logic
- Change from `Math.max(db, 2)` to additive: `db + starterBonus` only if player has never purchased potions, OR just give the starter kit once and track it

### Files to modify
- `src/components/aura/game/rpg/RPGBattleArena.tsx` — build purchased powers into spell list, pass skin variant
- `src/components/aura/game/rpg/RPGSpellMenu.tsx` — accept dynamic spell lists (may already work if spells array is passed correctly)
- `src/components/aura/game/rpg/RPGCharacter.tsx` — accept and apply `skinVariant` prop
- `src/components/aura/game/rpg/RPGCommandMenu.tsx` — pass merged spell list through

