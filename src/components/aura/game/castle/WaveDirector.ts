/**
 * Castle Swarm Defense — Wave Director (Phase 3)
 * Stronger HP scaling, armored_orc tier, boss waves every 5.
 */

import { EnemyType } from "./enemyTypes";

export interface WavePlan {
  wave: number;
  totalEnemies: number;
  cadenceMs: number;
  baseSpeedPxPerSec: number;
  hpBonus: number;             // added to enemy type baseHp
  hpMultiplier: number;        // multiplies finalHp (rounded)
  composition: EnemyType[];    // round-robin spawn source
  isEndless: boolean;
  isBossWave: boolean;
}

export const TUTORIAL_WAVES = 5;

/** Mulberry32 — deterministic seeded RNG for daily challenge. */
export function makeSeededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dailySeedString(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

/** Compute the actual HP a spawned enemy should have. */
export function computeEnemyHp(baseHp: number, hpBonus: number, wave: number, hpMultiplier: number): number {
  const raw = (baseHp + hpBonus) * (1 + wave * 0.12) * hpMultiplier;
  return Math.max(1, Math.round(raw));
}

export function planWave(wave: number): WavePlan {
  const isBossWave = wave > 0 && wave % 5 === 0;

  if (wave <= TUTORIAL_WAVES && !isBossWave) {
    const ramp: Omit<WavePlan, "wave" | "isEndless" | "isBossWave" | "hpMultiplier">[] = [
      { totalEnemies: 4, cadenceMs: 2200, baseSpeedPxPerSec: 35, hpBonus: 0, composition: ["goblin"] },
      { totalEnemies: 6, cadenceMs: 1900, baseSpeedPxPerSec: 40, hpBonus: 0, composition: ["goblin", "goblin", "skeleton"] },
      { totalEnemies: 8, cadenceMs: 1600, baseSpeedPxPerSec: 45, hpBonus: 1, composition: ["goblin", "skeleton", "bat"] },
      { totalEnemies: 10, cadenceMs: 1400, baseSpeedPxPerSec: 50, hpBonus: 1, composition: ["goblin", "skeleton", "shaman", "bat"] },
    ];
    return { wave, isEndless: false, isBossWave: false, hpMultiplier: 1, ...ramp[wave - 1] };
  }

  // Boss waves: one massive boss.
  if (isBossWave) {
    // Boss escalates each occurrence
    const tier = Math.floor(wave / 5);
    const composition: EnemyType[] = tier >= 2 ? ["armored_orc"] : ["orc"];
    return {
      wave,
      isEndless: wave > TUTORIAL_WAVES,
      isBossWave: true,
      totalEnemies: 1,
      cadenceMs: 1500,
      baseSpeedPxPerSec: 30 + tier * 4,
      hpBonus: 4 + wave * 2, // big swell
      hpMultiplier: 1.4,
      composition,
    };
  }

  // Endless (post-tutorial, non-boss)
  const overflow = wave - TUTORIAL_WAVES;
  const compositionPool: EnemyType[] = wave >= 10
    ? ["goblin", "skeleton", "shaman", "bat", "armored_orc"]
    : ["goblin", "skeleton", "shaman", "bat"];
  return {
    wave,
    isEndless: true,
    isBossWave: false,
    totalEnemies: Math.min(14 + overflow * 2, 60),
    cadenceMs: Math.max(450, 1100 - overflow * 40),
    baseSpeedPxPerSec: Math.min(55 + overflow * 3, 110),
    hpBonus: Math.min(Math.floor(overflow * 0.8), 20),
    hpMultiplier: 1,
    composition: compositionPool,
  };
}

export function coinsForWave(wave: number): number {
  if (wave <= TUTORIAL_WAVES) return 25 + wave * 5;
  return 50 + (wave - TUTORIAL_WAVES) * 10;
}

export function computeStars(
  thresholds: { needAccuracy: number; needWords: number; mustWin: boolean },
  result: { won: boolean; accuracy: number; wordsRead: number }
): number {
  let stars = 0;
  if (result.won || !thresholds.mustWin) stars += 1;
  if (result.accuracy >= thresholds.needAccuracy) stars += 1;
  if (result.wordsRead >= thresholds.needWords) stars += 1;
  return stars;
}
