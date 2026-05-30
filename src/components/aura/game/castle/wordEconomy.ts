/**
 * Castle Swarm — Word Economy (v2, Truth Pass)
 *
 * Pure function — no React, no DOM, no side effects.
 *
 * v2 changes:
 *  - Phoneme hit now uses CMU-dict-backed phonemeMatcher, not a spelling regex.
 *  - Crit is now *rare* (rarity-tier rule), not the default for any digraph.
 *  - Resolve banner fires exactly once per streak (at the 3rd sight word),
 *    not on every subsequent word.
 *  - Damage scales with wave so per-word DPS keeps pace with enemy HP curve.
 *  - Per-wave phoneme rotation can fold in a daily seed to defeat memorization.
 */

import { SIGHT_WORDS } from "@/data/sightWords";
import { wordContainsPhoneme } from "./phonemeMatcher";

const SIGHT_SET = new Set<string>(
  Object.values(SIGHT_WORDS).flat().map(w => w.toLowerCase())
);

export const PHONEME_TARGETS: { key: string; label: string; match: RegExp }[] = [
  { key: "sh",  label: "/sh/",  match: /sh/ },
  { key: "ch",  label: "/ch/",  match: /ch/ },
  { key: "th",  label: "/th/",  match: /th/ },
  { key: "ai",  label: "/ai/",  match: /ai/ },
  { key: "ee",  label: "/ee/",  match: /ee/ },
  { key: "oa",  label: "/oa/",  match: /oa/ },
  { key: "ou",  label: "/ou/",  match: /ou/ },
  { key: "ing", label: "-ing",  match: /ing$/ },
  { key: "er",  label: "/er/",  match: /er/ },
  { key: "ar",  label: "/ar/",  match: /ar/ },
  { key: "ow",  label: "/ow/",  match: /ow/ },
  { key: "oo",  label: "/oo/",  match: /oo/ },
];

export type PhonemeTarget = (typeof PHONEME_TARGETS)[number];

/**
 * Pick a phoneme target for a given wave. Optional `seed` (e.g. daily seed
 * hashed to a number) prevents memorization across runs.
 */
export function pickPhonemeForWave(waveNumber: number, seed = 0): PhonemeTarget {
  const idx = Math.abs(waveNumber * 7 + seed) % PHONEME_TARGETS.length;
  return PHONEME_TARGETS[idx];
}

// CVCe pattern: consonant-vowel-consonant-e (e.g. "cake", "bike", "hope").
const CVCE = /^[^aeiou][aeiou][^aeiou]e$/i;

export interface WordScore {
  dmg: number;
  crit: boolean;
  pierces: boolean;
  summonsKnight: boolean;
  shieldCharge: number;
  heal: number;
  phonemeHit: boolean;
  superFill: number;
  flavor: string;
  /** True only the moment the sight-word streak ticks to the threshold (3). */
  resolveTriggered: boolean;
}

export interface ScoreCtx {
  phonemeOfWave: PhonemeTarget;
  sightStreak: number;
  /** Current wave (>=1). Damage scales with this. */
  waveNumber?: number;
}

const isSight = (w: string) => SIGHT_SET.has(w);

export function scoreWord(rawWord: string, ctx: ScoreCtx): WordScore {
  const word = (rawWord || "").toLowerCase().replace(/[^a-z']/g, "");
  const len = word.length;
  const wave = Math.max(1, ctx.waveNumber ?? 1);

  let dmg = 1;
  let crit = false;
  let pierces = false;
  let summonsKnight = false;
  let shieldCharge = 0;
  let heal = 0;
  let phonemeHit = false;
  let superFill = 4;
  let flavor = `+${word}`;
  let resolveTriggered = false;

  // Base damage by length
  if (len <= 4) { dmg = 1; superFill = 3; }
  else if (len <= 6) { dmg = 2; }
  else { dmg = 3; superFill = 6; }

  // Long word → summon a knight
  if (len >= 7) {
    summonsKnight = true;
    flavor = "⚔ Knight!";
  }

  // Phoneme of the wave (CMU-dict-backed). This is the hunt.
  if (wordContainsPhoneme(word, ctx.phonemeOfWave.key)) {
    phonemeHit = true;
    dmg = Math.round(dmg * 1.5);
    superFill += 4;
    flavor = `✨ ${ctx.phonemeOfWave.label}!`;
  }

  // Rarity-tier crit: only phoneme hit, CVCe, or 7+ letter words crit.
  // This drops crit rate from ~60% to ~20% and makes it feel earned.
  if (phonemeHit || CVCE.test(word) || len >= 7) {
    crit = true;
    pierces = true;
    dmg = Math.max(dmg, 3);
    if (!phonemeHit) flavor = "💥 Crit!";
  }

  // Sight-word streak charges Resolve. Banner fires *only* at the threshold.
  if (isSight(word)) {
    const newStreak = ctx.sightStreak + 1;
    if (newStreak === 3) {
      shieldCharge = 25;
      resolveTriggered = true;
      flavor = "🛡 Resolve!";
    } else {
      shieldCharge = 6; // small per-word charge, no banner
    }
  }

  // Rare vocabulary heal — long + not a sight word
  if (len >= 8 && !isSight(word)) {
    heal = 1;
  }

  // Wave damage scaling so per-word damage keeps pace with HP curve.
  const scale = 1 + Math.floor(wave / 4) * 0.5;
  dmg = Math.max(1, Math.round(dmg * scale));

  return {
    dmg, crit, pierces, summonsKnight, shieldCharge,
    heal, phonemeHit, superFill, flavor, resolveTriggered,
  };
}
