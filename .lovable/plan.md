

# Brutally Honest Assessment: Is Agent Mode Launch-Ready?

## The Big Problem: The Store Is a Dead End

**The store UI looks great. Purchasing works. But nothing you buy actually does anything in battle.**

Line 292 of `RPGBattleArena.tsx` tells the whole story:
```
const [inventory, setInventory] = useState({ health_potion: 2, magic_potion: 1 });
```

Every battle starts with the same hardcoded 2 health potions and 1 magic potion — regardless of what the student has purchased from the store. The `usePlayerInventory` hook (which reads the real database) is **never imported or used** in the battle arena.

This means:
- **Purchased powers** (EMP Blast, Drone Strike, etc.) — never appear in the spell menu
- **Purchased potions** — never show up in battle inventory
- **Purchased upgrades** (attack boost, health boost, etc.) — `getActiveUpgrades()` is never called; damage/HP calculations ignore them
- **Purchased skins** — the equip system works in the store UI, but `RPGCharacter.tsx` doesn't read equipped skins to change character appearance

**Students spend gold → buy items → items vanish into the void.** This will destroy trust immediately. A high schooler who grinds 1000 gold for "Drone Strike" and never sees it in combat will quit.

## Would Schools Pilot This?

**Honest answer: The reading mechanics are genuinely strong.** AURA's speech recognition, WCPM tracking, prosody scoring, and the "fluency controls combat damage" loop are real pedagogical innovation. The 25 minigames provide excellent variety. The story content is age-appropriate and academically framed. Teachers would see value in the core reading engine.

**But the broken store economy is a consumer-readiness problem, not a pedagogy problem.** Schools evaluating this will have students report "I bought stuff and nothing happened." That's a bug that makes the whole product feel unfinished.

## What Needs to Happen Before Launch

### Critical (blocks launch)
1. **Wire the store to battle** — Import `usePlayerInventory` into `RPGBattleArena`, replace the hardcoded inventory with real database inventory, feed `getActiveUpgrades()` into damage/HP calculations, and populate the spell menu with purchased powers
2. **Make skins actually render** — Pass equipped skin variants from `usePlayerInventory` into `RPGCharacter` so purchased skins visually change the character

### Important (should fix)
3. **Add potion consumption feedback** — When a potion is used in battle, call `usePotion.mutate()` to actually deduct it from the database, not just local state

## What You Do NOT Need
- More enemy characters — 12 unique sprites is plenty
- More minigames — 25 is more than enough variety
- More stories — 53 stories across 9 worlds is solid
- More character powers — 10 agent powers in the store is a good roster, they just need to actually work

## Summary

The reading engine is school-ready. The game economy is broken. Fix the store-to-battle connection (one file change in `RPGBattleArena.tsx` + minor `RPGCharacter.tsx` update) and you have a launchable product.

### Files to modify
- `src/components/aura/game/rpg/RPGBattleArena.tsx` — import `usePlayerInventory`, replace hardcoded inventory, apply upgrades to damage/HP, populate spell menu with purchased powers
- `src/components/aura/game/rpg/RPGCharacter.tsx` — accept and apply equipped skin variants
- `src/components/aura/game/rpg/RPGSpellMenu.tsx` — show purchased powers alongside default spells

