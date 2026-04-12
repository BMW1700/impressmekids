

## Reduce Minigame Frequency in RPG Battles

The minigames are triggered by HP thresholds — every time the enemy's HP drops past a threshold percentage, a minigame fires. The current thresholds are very aggressive:

| Enemy Max HP | Current Thresholds | Count |
|---|---|---|
| 500+ | 90, 80, 65, 50, 35, 25, 10 | **7** |
| 300+ | 85, 70, 55, 50, 40, 25, 10 | **7** |
| 200+ | 80, 60, 50, 40, 25 | **5** |
| 120+ | 75, 50, 25 | **3** |
| <120 | 50, 25 | **2** |

Additionally, random enemy attacks (Quick Block) fire every 3-4 words with a 40-50% chance.

### Changes

**1. Reduce HP thresholds (fewer minigames per battle)**

Cut roughly in half:

| Enemy Max HP | New Thresholds | Count |
|---|---|---|
| 500+ | 75, 50, 25, 10 | **4** |
| 300+ | 65, 50, 30, 10 | **4** |
| 200+ | 65, 50, 25 | **3** |
| 120+ | 50, 25 | **2** |
| <120 | 50 | **1** |

**2. Reduce random enemy attack frequency**

- Bosses: change from every 3 words (50% chance) → every 5 words (35% chance)
- Regular enemies: change from every 4 words (40% chance) → every 6 words (30% chance)

### Technical Details

Single file edit: `src/components/aura/game/rpg/RPGBattleArena.tsx`
- Lines 269-275: Update `getHPThresholds` return values
- Lines 706-707: Update `attackInterval` and `attackChance` values

