

## Revised Plan: 4 New RPG Features

### 1. Parent vs Kid PvP Mode (Asymmetric Gameplay)

**Concept:** Parent controls the enemy side with powers and mini-attacks. Kid reads words to fight back as the hero.

**Parent's turn:**
- Parent picks from enemy ability cards (fireball, ice blast, word barrage, etc.)
- Some abilities require the parent to read a word too (deals bonus damage)
- Parent can trigger mini-attack games against the kid (same pool: Word Barrage, Fireball Defense, etc.)

**Kid's turn:**
- Kid reads story words to deal damage (standard reading flow)
- Kid can trigger their own attack mini-games (Word Cannon, Speed Blitz, etc.)
- Successful reading builds combo multiplier

**Implementation:**
- New file: `RPGPvPBattle.tsx` — full battle screen with turn indicator, role labels
- New file: `RPGParentControls.tsx` — enemy ability card picker for the parent's turn
- Add `'pvp'` to `BattleMode` type in `RPGBattleModeSelector.tsx`
- Wire into `RPGBattleArena.tsx` routing
- Track stats for both players separately

---

### 2. Co-op 2-Player Mode

**Concept:** Two heroes (100HP each) vs enemy. Players alternate turns reading words.

- Turn indicator shows "Player 1" / "Player 2" with distinct colors
- Both heroes visible on screen with separate HP bars
- If one hero falls, the other fights alone (not instant game over)
- Enemy attacks target the active player
- Mini-games trigger for whichever player is active

**Implementation:**
- New file: `RPGCoopBattle.tsx`
- New file: `RPGCoopHUD.tsx` — dual hero HP display
- Add `'coop'` to `BattleMode` type
- Wire into battle arena routing

---

### 3. Word Ninja Minigame (Fruit Ninja Style)

**Concept:** Words fly across screen. Player speaks a word to "unlock" it, then slices it with mouse/trackpad drag.

- Words launch from bottom in arcs (like fruit in Fruit Ninja)
- Each word starts locked (grey/dark) — speech recognition unlocks it (glows green)
- Player drags cursor/finger across unlocked word to slice it
- Sliced words split in half with particle burst animation
- Unsliced words fall off screen after ~4 seconds = damage to player
- Combo counter for consecutive slices
- "Bomb" words mixed in — slicing a bomb = instant damage (must avoid)

**Implementation:**
- New file: `RPGWordNinja.tsx`
- Add `'word_ninja'` to `MiniGameType` in `rpgBattleData.ts`
- Wire into minigame rotation in `RPGBattleArena.tsx`
- Uses existing speech recognition pipeline + lenient matching
- Mouse/touch drag detection via pointer events

---

### 4. Victory Arena (2D Brawler Reward)

**Concept:** After completing a world, player enters a 2D arena fight as a pure reward. No reading — just button-mashing combat for dopamine.

- Retro fighting game aesthetic — side-view arena with crowd silhouettes
- Simple controls: punch, kick, dodge, special move (4 buttons)
- Animated sprite combat with hit effects, knockback
- Enemy AI fights back with patterns the player learns to dodge
- No blood — hit effects are stars, flashes, comic-style "POW!" text
- Win = bonus gold + XP + "Champion of [World Name]" title
- Crowd cheers, confetti, victory fanfare

**Implementation:**
- New file: `RPGVictoryArena.tsx` — the 2D fighting arena
- New file: `RPGArenaFighter.tsx` — fighter sprite + animation states
- New file: `RPGArenaAI.tsx` — simple enemy AI patterns
- Triggers after world-completion victories in battle flow
- Awards bonus rewards tracked in existing economy system

---

### Files Summary

| New Files | Purpose |
|---|---|
| `RPGPvPBattle.tsx` | Parent vs Kid asymmetric battle |
| `RPGParentControls.tsx` | Enemy ability card picker for parent |
| `RPGCoopBattle.tsx` | 2-player cooperative battle |
| `RPGCoopHUD.tsx` | Dual hero HP display |
| `RPGWordNinja.tsx` | Fruit Ninja word-slicing minigame |
| `RPGVictoryArena.tsx` | 2D arena brawler reward |
| `RPGArenaFighter.tsx` | Fighter sprites and animations |
| `RPGArenaAI.tsx` | Simple enemy AI for arena |

| Modified Files | Change |
|---|---|
| `RPGBattleModeSelector.tsx` | Add PvP + Co-op mode cards |
| `RPGBattleArena.tsx` | Route to PvP/Co-op, add Word Ninja to rotation |
| `src/lib/rpgBattleData.ts` | Add `'word_ninja'` to MiniGameType, add `'pvp' \| 'coop'` to BattleMode |

