

# Fix RPG Spell Selection Bug

## Problem
Two issues prevent manually selected spells from persisting:

1. **Line 1476**: Elara's 5-word barrage hardcodes `'lightning'` — should use the current `attackType` (which was set when the player picked a spell via the MAGIC menu)
2. **Lines 1524-1527**: For non-Elara characters, the attack type auto-cycles based on streak count (`types[floor(streak/3)]`), overwriting any manually selected spell

## Fix (1 file: `RPGBattleArena.tsx`)

### Change 1 — Line 1476
Replace `'lightning'` with `attackType` so the barrage uses whatever spell the player selected:
```ts
setActiveSpell(isElaraBarrage ? attackType : attackType);
// Simplifies to just: setActiveSpell(attackType);
```

### Change 2 — Lines 1524-1527
Add a `hasManualSpell` ref that gets set to `true` in `handleCastSpell`. Then only auto-cycle attack types if no manual spell has been selected:
```ts
if (selectedCharacter !== 'elara' && !hasManualSpellRef.current) {
  const types = ['slash', 'fire', 'ice', 'lightning'];
  setAttackType(types[Math.min(Math.floor(newStreak / 3), types.length - 1)]);
}
```

### Change 3 — In `handleCastSpell` (line ~1097)
Set the ref when player manually picks a spell:
```ts
hasManualSpellRef.current = true;
```

### Change 4 — Add ref declaration near other refs
```ts
const hasManualSpellRef = useRef(false);
```

Reset it when a new battle starts so auto-cycling works again for fresh fights.

## Scope
- **1 file** changed: `src/components/aura/game/rpg/RPGBattleArena.tsx`
- No UI/layout changes — purely logic fix
- RPG immersion fully preserved

