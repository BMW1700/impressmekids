/**
 * Castle Swarm — Phoneme Matcher
 *
 * Checks whether a word *actually pronounces* a target phoneme, using the
 * CMU Pronouncing Dictionary (via getIPAPronunciation). This avoids the
 * spelling-regex bugs (e.g. "ch" matching "school", "th" matching "though"
 * the same as "thought").
 *
 * Falls back to a spelling regex only when CMU has no entry.
 */

import { getIPAPronunciation } from "@/lib/cmuDictWrapper";

// Map of phoneme target keys (used by wordEconomy / PHONEME_TARGETS) → the
// IPA tokens that count as a real hit. A single token matches any occurrence;
// a pair matches if both adjacent in that order.
const KEY_TO_IPA: Record<string, { tokens: string[][]; spellFallback: RegExp }> = {
  sh:  { tokens: [["ʃ"]],          spellFallback: /sh/ },
  ch:  { tokens: [["tʃ"]],         spellFallback: /ch/ },
  th:  { tokens: [["θ"], ["ð"]],   spellFallback: /th/ },
  ai:  { tokens: [["eɪ"]],         spellFallback: /ai/ },
  ee:  { tokens: [["i"]],          spellFallback: /ee/ },
  oa:  { tokens: [["oʊ"]],         spellFallback: /oa/ },
  ou:  { tokens: [["aʊ"]],         spellFallback: /ou/ },
  ing: { tokens: [["ɪ", "ŋ"]],     spellFallback: /ing$/ },
  er:  { tokens: [["ɝ"], ["ɚ"]],   spellFallback: /er/ },
  ar:  { tokens: [["ɑɹ"]],         spellFallback: /ar/ },
  ow:  { tokens: [["aʊ"], ["oʊ"]], spellFallback: /ow/ },
  oo:  { tokens: [["u"], ["ʊ"]],   spellFallback: /oo/ },
};

function hasSequence(phonemes: string[], seq: string[]): boolean {
  if (seq.length === 1) return phonemes.includes(seq[0]);
  for (let i = 0; i <= phonemes.length - seq.length; i++) {
    let ok = true;
    for (let j = 0; j < seq.length; j++) {
      if (phonemes[i + j] !== seq[j]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

export function wordContainsPhoneme(rawWord: string, phonemeKey: string): boolean {
  const word = (rawWord || "").toLowerCase().replace(/[^a-z']/g, "");
  if (!word) return false;
  const def = KEY_TO_IPA[phonemeKey];
  if (!def) return false;

  try {
    const variants = getIPAPronunciation(word); // string[][]
    if (variants && variants.length) {
      for (const variant of variants) {
        for (const seq of def.tokens) {
          if (hasSequence(variant, seq)) return true;
        }
      }
      // CMU returned a real pronunciation but no match → trust it.
      return false;
    }
  } catch {
    // fall through to spelling fallback
  }

  return def.spellFallback.test(word);
}
