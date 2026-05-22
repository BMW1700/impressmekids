/**
 * Castle Swarm — Word Economy
 *
 * Every correctly read word resolves to a typed combat effect based on its
 * literacy properties. This is the heart of what makes the mode addictive +
 * pedagogically valuable: kids learn to *hunt* for word patterns because
 * the patterns themselves cause distinct, satisfying game effects.
 *
 * Pure function — no React, no DOM, no side effects.
 */

import { SIGHT_WORDS } from "@/data/sightWords";

// Flat sight-word set for O(1) lookup.
const SIGHT_SET = new Set<string>(
  Object.values(SIGHT_WORDS).flat().map(w => w.toLowerCase())
);

// Common digraphs / phonics patterns. Used both for crit detection and to
// pick a per-wave "phoneme of the wave" target.
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

/** Pick a phoneme target for a given wave (deterministic per wave number). */
export function pickPhonemeForWave(waveNumber: number): PhonemeTarget {
  return PHONEME_TARGETS[waveNumber % PHONEME_TARGETS.length];
}

// CVCe pattern: consonant-vowel-consonant-e (e.g. "cake", "bike", "hope").
const CVCE = /^[^aeiou][aeiou][^aeiou]e$/i;

// Common digraphs anywhere in word (cheap proxy for "decodable phonics hit").
const DIGRAPH = /sh|ch|th|wh|ph|ck|qu|ng/;

export interface WordScore {
  dmg: number;           // damage to front enemy
  crit: boolean;         // visual + audio crit, also pierces armor
  pierces: boolean;      // ignores armor (armored_orc etc.)
  summonsKnight: boolean;
  shieldCharge: number;  // 0–100 contribution to Resolve shield meter
  heal: number;          // HP returned to player castle
  phonemeHit: boolean;   // matched the phoneme of the wave (golden hit)
  superFill: number;     // points to add to super meter (0–100 scale)
  flavor: string;        // short feedback text for HUD
}

export interface ScoreCtx {
  phonemeOfWave: PhonemeTarget;
  /**
   * Rolling streak of sight words the player has read in a row (the caller
   * maintains this counter and resets it whenever a non-sight word is read).
   */
  sightStreak: number;
}

const isSight = (w: string) => SIGHT_SET.has(w);

export function scoreWord(rawWord: string, ctx: ScoreCtx): WordScore {
  const word = (rawWord || "").toLowerCase().replace(/[^a-z']/g, "");
  const len = word.length;

  let dmg = 1;
  let crit = false;
  let pierces = false;
  let summonsKnight = false;
  let shieldCharge = 0;
  let heal = 0;
  let phonemeHit = false;
  let superFill = 4;
  let flavor = `+${word}`;

  // Short words = fast jab
  if (len <= 4) {
    dmg = 1;
    superFill = 3;
  } else if (len <= 6) {
    dmg = 2;
  } else {
    dmg = 3;
    superFill = 6;
  }

  // Long word — summon a knight (existing rule preserved)
  if (len >= 7) {
    summonsKnight = true;
    flavor = "⚔ Knight!";
  }

  // Sight-word streak charges the Resolve shield. Every sight word adds a
  // little; hitting 3 in a row gives a big chunk + a banner.
  if (isSight(word)) {
    shieldCharge = 6;
    if (ctx.sightStreak + 1 >= 3) {
      shieldCharge = 25;
      flavor = "🛡 Resolve!";
    }
  }

  // Decodable phonics pattern → crit + armor pierce
  if (CVCE.test(word) || DIGRAPH.test(word)) {
    crit = true;
    pierces = true;
    dmg = Math.max(dmg, 3);
    flavor = "💥 Crit!";
  }

  // Phoneme of the wave bonus — overrides flavor because this is the hunt.
  if (ctx.phonemeOfWave.match.test(word)) {
    phonemeHit = true;
    dmg = Math.round(dmg * 1.5);
    superFill += 4;
    flavor = `✨ ${ctx.phonemeOfWave.label}!`;
  }

  // Rare vocabulary heal — long + not a sight word
  if (len >= 8 && !isSight(word)) {
    heal = 1;
  }

  return { dmg, crit, pierces, summonsKnight, shieldCharge, heal, phonemeHit, superFill, flavor };
}
