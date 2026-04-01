

# 4x Enemy HP — Complete Per-Enemy Audit & Update

## The Real Problem
There are **TWO separate stat systems** and the previous plan was modifying the WRONG one:
- **`rpgBattleData.ts`** — The ACTUAL stats used by RPG Mode (`enemy.maxHp`)
- **`battleMechanics.ts`** — Only used by the old non-RPG `BattleArena`

RPG battles read HP from `rpgBattleData.ts`. That's the file that needs 4x HP.

## Every Enemy — Current vs New (4x HP)

### World 0 (Tutorial) / World 1 (Enchanted Forest)
| # | Enemy | ID | Current HP | New HP | Attack | Defense | wDmgMult |
|---|-------|----|-----------|--------|--------|---------|----------|
| 1 | Goblin Scout | `goblinMinion` | 80 | 320 | 12 | 4 | 0.85 |
| 2 | Goblin Guard | `goblinGuard` | 120 | 480 | 15 | 8 | 0.70 |
| 3 | Goblin Warlord | `goblinElite` | 180 | 720 | 22 | 12 | 0.50 |
| 4 | Zix the Goblin Shaman | `goblinShaman` | 160 | 640 | 26 | 10 | 0.55 |

### World 1 Boss + Recurring
| # | Enemy | ID | Current HP | New HP | Attack | Defense | wDmgMult |
|---|-------|----|-----------|--------|--------|---------|----------|
| 5 | Drake the Dragon | `drakeTheDragon` | 280 | 1,120 | 35 | 18 | 0.45 |
| 6 | Fire Imp (summoned) | `miniBeast` | 30 | 30 | 8 | 2 | 1.0 |

### World 2 — The Frozen Depths
| # | Enemy | ID | Current HP | New HP | Attack | Defense | wDmgMult |
|---|-------|----|-----------|--------|--------|---------|----------|
| 7 | Whisper the Shadow Wraith | `shadowWraith` | 180 | 720 | 32 | 12 | 0.60 |
| 8 | Frostfang the Ice Golem | `iceGolem` | 220 | 880 | 28 | 20 | 0.55 |

### World 3 — The Ancient Ruins
| # | Enemy | ID | Current HP | New HP | Attack | Defense | wDmgMult |
|---|-------|----|-----------|--------|--------|---------|----------|
| 9 | Granite the Stone Guardian | `stoneGuardian` | 350 | 1,400 | 25 | 30 | 0.35 |

### World 4 — The Throne Room
| # | Enemy | ID | Current HP | New HP | Attack | Defense | wDmgMult |
|---|-------|----|-----------|--------|--------|---------|----------|
| 10 | Grog the Goblin King | `grogTheGoblinKing` | 300 | 1,200 | 30 | 15 | 0.40 |
| 11 | Galair the Wicked Sorcerer | `galairTheWickedSorcerer` | 500 | 2,000 | 40 | 20 | 0.30 |

### World 5 — The Whispering Caverns
| # | Enemy | ID | Current HP | New HP | Attack | Defense | wDmgMult |
|---|-------|----|-----------|--------|--------|---------|----------|
| 12 | Grumbold the Cave Troll | `caveTroll` | 200 | 800 | 30 | 25 | 0.50 |
| 13 | Prism the Crystal Spider | `crystalSpider` | 100 | 400 | 18 | 8 | 0.80 |
| 14 | Echo the Wraith of Whispers | `echoWraith` | 280 | 1,120 | 28 | 15 | 0.40 |

### World 6 — The Floating Isles
| # | Enemy | ID | Current HP | New HP | Attack | Defense | wDmgMult |
|---|-------|----|-----------|--------|--------|---------|----------|
| 15 | Tempest the Storm Harpy | `stormHarpy` | 120 | 480 | 22 | 10 | 0.70 |
| 16 | Cumulus the Cloud Giant | `cloudGiant` | 320 | 1,280 | 25 | 20 | 0.35 |
| 17 | Zephyr the Wind Lord | `zephyr` | 350 | 1,400 | 32 | 18 | 0.38 |

### World 7 — The Sunken Library
| # | Enemy | ID | Current HP | New HP | Attack | Defense | wDmgMult |
|---|-------|----|-----------|--------|--------|---------|----------|
| 18 | Inkling the Ink Kraken | `inkKraken` | 180 | 720 | 24 | 14 | 0.55 |
| 19 | Coral the Reef Guardian | `reefGuardian` | 160 | 640 | 20 | 28 | 0.45 |
| 20 | Leviathan the Ancient | `leviathan` | 450 | 1,800 | 38 | 22 | 0.28 |

### World 8 — The Void Between
| # | Enemy | ID | Current HP | New HP | Attack | Defense | wDmgMult |
|---|-------|----|-----------|--------|--------|---------|----------|
| 21 | Nihil the Void Phantom | `voidPhantom` | 140 | 560 | 26 | 8 | 0.60 |
| 22 | Paradox the Reality Shifter | `realityShifter` | 220 | 880 | 28 | 16 | 0.42 |
| 23 | The Word Eater | `wordEater` | 600 | 2,400 | 45 | 25 | 0.22 |

**Total: 23 unique enemies** (Fire Imp stays at 30 HP — it's a summoned minion, not a real fight).

## What Changes

**File 1: `src/lib/rpgBattleData.ts`** — Change `maxHp` on all 22 enemies (not Fire Imp). One property change per enemy, nothing else touched.

**File 2: `src/lib/battleMechanics.ts`** — Also 4x the `baseHpByWorld` values so the old BattleArena stays in sync. Current values doubled from original to: 200/400/700/1000/500/600/750/1200 → new: 800/1600/2800/4000/2000/2400/3000/4800.

**File 3: `src/components/aura/game/rpg/RPGBattleArena.tsx`** — Clean up the dead-code mastery condition on line 1633.

## What Does NOT Change
- Attack, defense, wordDamageMultiplier — all stay the same
- Mini-games, signature attacks, dialogue — untouched
- Player HP (100) — unchanged
- All other files — no changes needed

