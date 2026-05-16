/**
 * Castle Swarm Defense — Wave Director
 *
 * Pure module. Given a wave number and elapsed time inside the wave,
 * tells the arena when to spawn enemies, how many, and how fast.
 *
 * Phase 1: one enemy type (goblin). Difficulty curves via:
 *   - count: enemies per wave
 *   - cadence: ms between spawns
 *   - speed:  pixels-per-second per enemy
 *   - hp:     hit points per enemy
 *
 * After wave 5, ENDLESS mode kicks in and difficulty scales smoothly.
 */

export interface WavePlan {
  wave: number;
  totalEnemies: number;
  cadenceMs: number;
  enemyHp: number;
  enemySpeedPxPerSec: number;
  isEndless: boolean;
}

export const TUTORIAL_WAVES = 5;

export function planWave(wave: number): WavePlan {
  if (wave <= TUTORIAL_WAVES) {
    const ramp = [
      { totalEnemies: 4, cadenceMs: 2200, enemyHp: 1, enemySpeedPxPerSec: 35 },
      { totalEnemies: 6, cadenceMs: 1900, enemyHp: 1, enemySpeedPxPerSec: 40 },
      { totalEnemies: 8, cadenceMs: 1600, enemyHp: 2, enemySpeedPxPerSec: 45 },
      { totalEnemies: 10, cadenceMs: 1400, enemyHp: 2, enemySpeedPxPerSec: 50 },
      { totalEnemies: 12, cadenceMs: 1200, enemyHp: 3, enemySpeedPxPerSec: 55 },
    ];
    const p = ramp[wave - 1];
    return { wave, isEndless: false, ...p };
  }

  // Endless scaling: smooth growth, capped so it never becomes literally impossible.
  const overflow = wave - TUTORIAL_WAVES;
  return {
    wave,
    isEndless: true,
    totalEnemies: Math.min(14 + overflow * 2, 60),
    cadenceMs: Math.max(450, 1100 - overflow * 40),
    enemyHp: Math.min(3 + Math.floor(overflow / 2), 10),
    enemySpeedPxPerSec: Math.min(55 + overflow * 3, 110),
  };
}

/** Coins awarded for surviving a wave. Bigger payout in endless. */
export function coinsForWave(wave: number): number {
  if (wave <= TUTORIAL_WAVES) return 25 + wave * 5;
  return 50 + (wave - TUTORIAL_WAVES) * 10;
}
