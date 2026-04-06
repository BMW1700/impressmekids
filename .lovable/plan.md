

# Remaining Agent Mode Gaps — Brutally Honest

## What's WORKING ✓
- Hero data, enemy data, sprite wiring — all correct end-to-end
- Em-dash word filter — fixed
- Agent-specific spells (Agent X, Cipher Data Burst, Shadow) — wired
- Agent dialogue — mission-themed
- Cipher charge text — shows "COMPILING" / "DATA BURST DEPLOYED"
- Special barrage names — agent-themed ("MALWARE SWARM", etc.)
- Literacy mini-game messages — agent-themed ("FIREWALL BARRIER", "ENCRYPTION", "SIGNAL JAM")
- Health bars — all 6 non-boss enemies have built-in HP bars in their components
- Boss silhouettes, character select, world map — all theme-aware
- Story content — 24 diverse stories, backgrounds from DB

## What's STILL NOT PERFECT

### 1. Enemy Transition Screen shows dragon emoji + "BOSS BATTLE!" for dragon-type enemies
`RPGEnemyTransition.tsx` line 187 checks `nextEnemy.type === 'dragon'` and shows a 🐉 emoji with fire particles. Agent bosses use types `'boss'` and `'final_boss'`, so they won't hit this branch — but if any agent enemy mapped to `'dragon'` type comes through, it would show fantasy content. The generic path (line 235) works fine but is bland. Agent transitions should show something like a 🎯 crosshair icon and "PRIORITY TARGET DETECTED!" or "BOSS INCOMING!" instead of "Next Enemy Approaches!".

### 2. Mini-game announcement text is still fantasy-themed
Line 523: `'goblin_horde': '⚔️ GOBLIN HORDE! Speak words to defeat them! ⚔️'`
Line 524: `'fireball_defense': '🔥 UNLEASHES FIREBALLS! 🔥'`
Line 525: `'beast_swarm': 'summons BEAST SWARM!'`
These trigger during agent battles because agent enemies reference these mini-game IDs in their `miniGames` arrays. The announcements break immersion.

### 3. Mini-game VISUALS are still fantasy
`RPGGoblinHorde` renders goblins. `RPGBeastSwarm` renders beasts. `RPGFireballDefense` renders fireballs. These components have zero agent-mode awareness. When an agent enemy triggers `goblin_horde`, the player fights cartoon goblins mid-spy-mission. This is the single biggest immersion break remaining.

### 4. Word mastery announcement uses ⭐ emoji
Line 1676: `'⭐ WORD MASTERED! ×1.5'` — not thematically wrong but could be agent-flavored like `'🎯 INTEL DECODED! ×1.5'`.

### 5. Victory/defeat screens are theme-agnostic
The transition screen shows generic "DEFEATED!" text with ⭐ sparkles. Could show agent-themed "TARGET NEUTRALIZED!" with 🎯 icons.

---

## Fix Plan

### A. Theme-aware mini-game announcements (quick)
**File: `RPGBattleArena.tsx`** — In the mini-game trigger function (~line 520), check `getStoredTheme() === 'agent'` and replace:
- `'goblin_horde'` → `'🎯 HOSTILE SQUAD! Speak words to eliminate them! 🎯'`
- `'fireball_defense'` → `'🚀 INCOMING MISSILES! 🚀'`
- `'beast_swarm'` → `'deploys DRONE SWARM!'`

### B. Theme-aware enemy transition (quick)
**File: `RPGEnemyTransition.tsx`** — Accept a `theme` prop. When `'agent'`:
- Replace "Next Enemy Approaches!" with "PRIORITY TARGET DETECTED!"
- Replace ⭐ sparkles with 🎯 crosshairs
- For boss types, show "⚠️ HIGH-VALUE TARGET!" with red/orange alert styling instead of dragon fire

### C. Theme-aware mastery/victory text (quick)
**File: `RPGBattleArena.tsx`** — Swap `'⭐ WORD MASTERED!'` → `'🎯 INTEL DECODED!'` when agent theme.

### D. (Future — large effort) Agent-themed mini-game components
Create agent reskins or new components:
- `RPGHostileSquad` (replaces goblin_horde visuals — soldiers instead of goblins)
- `RPGMissileDefense` (replaces fireball_defense — missiles instead of fireballs)
- `RPGDroneSwarm` (replaces beast_swarm — drones instead of beasts)
This is the biggest remaining immersion gap but requires building 3 new game components.

---

## Files Modified (A-C only)
1. `src/components/aura/game/rpg/RPGBattleArena.tsx` — agent mini-game announcements + mastery text
2. `src/components/aura/game/rpg/RPGEnemyTransition.tsx` — agent-themed transitions

## Priority
- A-C: Quick text/theming fixes (~30 lines total)
- D: Large feature (3 new components) — next round

