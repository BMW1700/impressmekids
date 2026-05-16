/**
 * Castle Swarm Defense — Wave Director (Phase 2)
 * Adds enemy composition, seeded RNG for daily challenge, and campaign-level plans.
 */

import { EnemyType } from "./enemyTypes";

export interface WavePlan {
  wave: number;
  totalEnemies: number;
  cadenceMs: number;
  baseSpeedPxPerSec: number;
  hpBonus: number;             // added to enemy type baseHp
  composition: EnemyType[];    // round-robin spawn source
  isEndless: boolean;
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

/** Today's daily challenge seed string (UTC). */
export function dailySeedString(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

/** Endless / tutorial standard plan (no campaign override). */
export function planWave(wave: number): WavePlan {
  if (wave <= TUTORIAL_WAVES) {
    const ramp: Omit<WavePlan, "wave" | "isEndless">[] = [
      { totalEnemies: 4, cadenceMs: 2200, baseSpeedPxPerSec: 35, hpBonus: 0, composition: ["goblin"] },
      { totalEnemies: 6, cadenceMs: 1900, baseSpeedPxPerSec: 40, hpBonus: 0, composition: ["goblin", "goblin", "skeleton"] },
      { totalEnemies: 8, cadenceMs: 1600, baseSpeedPxPerSec: 45, hpBonus: 0, composition: ["goblin", "skeleton", "bat"] },
      { totalEnemies: 10, cadenceMs: 1400, baseSpeedPxPerSec: 50, hpBonus: 1, composition: ["goblin", "skeleton", "shaman", "bat"] },
      { totalEnemies: 12, cadenceMs: 1200, baseSpeedPxPerSec: 55, hpBonus: 1, composition: ["goblin", "skeleton", "shaman", "orc"] },
    ];
    return { wave, isEndless: false, ...ramp[wave - 1] };
  }
  // Endless: scale up. Boss waves every 5 inject orcs.
  const overflow = wave - TUTORIAL_WAVES;
  const isBossWave = wave % 5 === 0;
  const composition: EnemyType[] = isBossWave
    ? ["goblin", "skeleton", "shaman", "orc", "orc", "bat"]
    : ["goblin", "skeleton", "shaman", "bat"];
  return {
    wave,
    isEndless: true,
    totalEnemies: Math.min(14 + overflow * 2, 60),
    cadenceMs: Math.max(450, 1100 - overflow * 40),
    baseSpeedPxPerSec: Math.min(55 + overflow * 3, 110),
    hpBonus: Math.min(1 + Math.floor(overflow / 2), 8),
    composition,
  };
}

/** Coins awarded for surviving a wave. */
export function coinsForWave(wave: number): number {
  if (wave <= TUTORIAL_WAVES) return 25 + wave * 5;
  return 50 + (wave - TUTORIAL_WAVES) * 10;
}

/** 3-star thresholds: (survived all, accuracy >= 80%, words >= target). */
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
