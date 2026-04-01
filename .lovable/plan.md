

# Auto-Switch to Read After Spell Selection

## Problem
When a player selects a spell from the Magic menu, the spell is queued but the command menu stays on Magic. The player must manually click "Read" to start reading words. It should auto-switch to Read after picking a spell.

## Fix
**File: `src/components/aura/game/rpg/RPGCommandMenu.tsx`**

In `handleSpellSelect` (line 82-85), after closing the spell menu and calling `onCastSpell`, also call `onSelectCommand('read')` and update `selectedIndex` to 0 (the Read button index). This visually highlights Read and triggers the read flow automatically.

```ts
const handleSpellSelect = (spell: Spell) => {
  setShowSpellMenu(false);
  onCastSpell?.(spell);
  setSelectedIndex(0); // Highlight "Read" button
  onSelectCommand('read'); // Switch to read mode
};
```

One file, 2 lines added. No other changes needed.

