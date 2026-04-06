

# Brutally Honest Assessment: Agent Mode vs Classic Mode

## What's WORKING ✓
- **Hero data, enemy data, sprite wiring** — all correctly mapped end-to-end
- **Em-dash word filter** — fixed, no more blank spaces in reader
- **Agent-specific spells** — Agent X (Tactical), Cipher (Data Burst), Shadow (Stealth) all wired
- **Agent dialogue** — mission-themed lines replace fantasy dialogue
- **Story content** — 24 diverse, high-quality stories covering AI ethics, game theory, rhetoric, etc.
- **Boss silhouettes, character select, world map** — all theme-aware
- **Mini-games fire correctly** — HP-threshold system triggers from enemy `miniGames` arrays, which agent enemies define

## What's STILL NOT PERFECT

### 1. Enemy health bars — STILL missing on 4 of 9 agent enemies
`RPGCharacter.tsx` line 651 hides the fallback HP bar when `usePremiumSprites=true`. Boss sprites (`TheBroker`, `TheDirector`, `TheArchitect`) pass `showHealthBar={true}` — but **StreetThug, HiredGun, CyberHacker, DroneSentry, RogueAgent, Bodyguard do NOT** get `showHealthBar={true}` in their render calls (lines 370-467). Each component likely accepts the prop but it's not being passed. This means regular agent enemies have **invisible health bars** in battle.

### 2. Mini-game names are still fantasy-themed
Agent enemies reference mini-games like `'goblin_horde'`, `'beast_swarm'`, `'fireball_defense'`. The actual mini-game components (`RPGGoblinHorde`, `RPGBeastSwarm`, `RPGFireballDefense`) render fantasy visuals (goblins, beasts, fireballs). While functionally identical, seeing goblins charge at you during a Syndicate mission breaks immersion. These need either:
- Agent-themed reskins, OR
- New agent-specific mini-games (safe breaker, code decrypt, etc.)

### 3. Agent enemy `specialBarrage` doesn't have agent-specific branches
`triggerSpecialBarrage()` (line 1150-1188) checks for `dragon`, `ice_golem`, `shadow_wraith`, `stone_guardian` — all classic enemy types. Agent enemies (`minion`, `guard`, `elite`) fall through to the default `"WORD PRISON"` (asteroid barrage). No agent-flavored attack names like "MALWARE UPLOAD" or "DRONE STRIKE" exist.

### 4. Cipher's "Data Burst" plasma numbers don't have a custom visual effect
The spell exists in `RPGSpellMenu.tsx` and triggers `effect: 'fire'`, which plays a generic fire animation via `RPGSpellEffects`. There's no actual "plasma numbers shooting at the enemy" visual — it just looks like a fireball. A custom spell effect component would sell the hacker fantasy.

### 5. Elara-specific charge mechanic is hardcoded to `selectedCharacter === 'elara'`
Lines 1682-1714: The 5-word charge → 3x plasma barrage is only for `'elara'`. Since Cipher maps to `'elara'` internally, this DOES work for Cipher. But the announcement says "⚡ CHARGING" and "⚡ PLASMA BARRAGE!" — not agent-themed text like "COMPILING DATA BURST" or "DATA BURST DEPLOYED." The mechanic works; the flavor text doesn't match.

### 6. Item healing uses `heroKnight.maxHp` instead of `playerCharacter.maxHp`
Line 1446: `setPlayerHp(prev => Math.min(heroKnight.maxHp, prev + item.value))` — always caps healing at classic knight's max HP, not the actual selected character's HP. Minor bug but worth fixing.

### 7. Enemy ability messages use fantasy phrasing
`checkLiteracyMiniGame()` (lines 1086-1130) shows messages like "raises a LAST STAND BARRIER!", "activates WORD SHIELD!", "casts WORD FOG!" — these are fantasy-flavored. In agent mode they should say things like "deploys FIREWALL!", "activates ENCRYPTION!", "jams COMMS!".

### 8. No agent-themed world transition text
When transitioning between enemies (`RPGEnemyTransition`), the component likely uses generic or fantasy text. Not verified but worth checking.

---

## Fix Plan

### A. Pass `showHealthBar={true}` to ALL agent enemy sprites
**File: `RPGCharacter.tsx`** — Add `showHealthBar={true}` to the 6 non-boss agent enemy render calls (StreetThug, HiredGun, CyberHacker, DroneSentry, RogueAgent, Bodyguard). Single-line additions.

### B. Agent-themed special barrage names
**File: `RPGBattleArena.tsx`** — In `triggerSpecialBarrage()`, add agent enemy type branches:
- When theme is agent and enemy is `minion`: "deploys PIPE BARRAGE!"
- `guard`: "fires SUPPRESSION VOLLEY!"  
- `elite`: "uploads MALWARE SWARM!"
- `boss`/`final_boss`: "activates SCORCHED EARTH PROTOCOL!"

### C. Agent-themed Cipher charge text
**File: `RPGBattleArena.tsx`** — In the Elara/Cipher charge logic, check theme and show "COMPILING 3/5" and "💻 DATA BURST DEPLOYED! ×3" instead of "⚡ CHARGING" and "⚡ PLASMA BARRAGE!".

### D. Agent-themed literacy mini-game messages
**File: `RPGBattleArena.tsx`** — In `checkLiteracyMiniGame()`, check theme and use agent-flavored messages: "FIREWALL BARRIER" instead of "LAST STAND BARRIER", "ENCRYPTION" instead of "WORD SHIELD", "SIGNAL JAM" instead of "WORD FOG".

### E. Fix item healing cap
**File: `RPGBattleArena.tsx`** line 1446 — Change `heroKnight.maxHp` to `playerCharacter.maxHp`.

### F. (Future) Agent-specific mini-games
Create agent-themed mini-game components (Safe Breaker, Code Decrypt, Drone Intercept) as replacements for fantasy-themed ones. This is a larger effort best done in a dedicated round.

### G. (Future) Custom Cipher "Data Burst" visual effect
Create a `RPGDataBurstEffect` component that shows plasma numbers (0, 1, 4, 7) shooting at the enemy instead of a generic fire animation.

---

## Files Modified
1. `src/components/aura/game/rpg/RPGCharacter.tsx` — showHealthBar on 6 enemy renders
2. `src/components/aura/game/rpg/RPGBattleArena.tsx` — agent barrage names, Cipher charge text, literacy messages, item heal fix

## Priority
A-E are quick fixes (under 100 lines total). F-G are larger features for the next round.

