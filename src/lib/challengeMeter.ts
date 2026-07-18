/**
 * Challenge Meter — 1-5 speech strictness dial.
 *
 * Parents own the setting; teachers can override. The level maps to the
 * `arePhonemesSimilar` distance threshold and Levenshtein tolerance used
 * across `wordMatchingModes.ts` and `phonemeInference.ts`.
 *
 * Level 1 = most forgiving (early PreK / ELL). Level 5 = strictest (Grade 2+).
 * Level 3 is the platform default and matches historical behavior.
 */

export type ChallengeLevel = 1 | 2 | 3 | 4 | 5;

export interface ChallengeThresholds {
  /** Distance below which two phonemes count as a match (arePhonemesSimilar). */
  phonemeSimilarityThreshold: number;
  /** Max Levenshtein ratio (0-1) for word-level acceptance. */
  levenshteinTolerance: number;
  /** Fraction of correct phonemes required for word acceptance. */
  minPhonemeAccuracy: number;
  /** Human label surfaced in parent + teacher UI. */
  label: string;
  /** Short description surfaced under the slider. */
  description: string;
}

export const CHALLENGE_LEVELS: Record<ChallengeLevel, ChallengeThresholds> = {
  1: {
    phonemeSimilarityThreshold: 0.55,
    levenshteinTolerance: 0.55,
    minPhonemeAccuracy: 0.4,
    label: 'Very Easy',
    description:
      'Best for beginners, ELL students, or ages 2–4. Accepts approximate pronunciations so students stay motivated.',
  },
  2: {
    phonemeSimilarityThreshold: 0.45,
    levenshteinTolerance: 0.45,
    minPhonemeAccuracy: 0.55,
    label: 'Easy',
    description: 'Good for late PreK / early Kindergarten. Forgives common substitutions.',
  },
  3: {
    phonemeSimilarityThreshold: 0.3,
    levenshteinTolerance: 0.35,
    minPhonemeAccuracy: 0.7,
    label: 'Standard (default)',
    description:
      'The default balance. Matches Kindergarten expectations — clear articulation required, small errors forgiven.',
  },
  4: {
    phonemeSimilarityThreshold: 0.2,
    levenshteinTolerance: 0.25,
    minPhonemeAccuracy: 0.8,
    label: 'Strict',
    description: 'Good for Grade 1–2 fluency practice. Substitutions like /f/ for /th/ are flagged.',
  },
  5: {
    phonemeSimilarityThreshold: 0.1,
    levenshteinTolerance: 0.15,
    minPhonemeAccuracy: 0.9,
    label: 'Very Strict',
    description:
      'Assessment-grade precision. Every phoneme counts. Use for benchmark screenings only.',
  },
};

export const DEFAULT_CHALLENGE_LEVEL: ChallengeLevel = 3;

export function getChallengeThresholds(level: ChallengeLevel | null | undefined): ChallengeThresholds {
  const clamped = (level ?? DEFAULT_CHALLENGE_LEVEL) as ChallengeLevel;
  return CHALLENGE_LEVELS[clamped] ?? CHALLENGE_LEVELS[DEFAULT_CHALLENGE_LEVEL];
}
