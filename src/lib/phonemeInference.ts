/**
 * Enhanced Phoneme Inference System
 * Compares transcribed vs expected words using CMU Dictionary
 * Detects specific phoneme substitutions (e.g., /w/ → /ɹ/ for "wabbit" vs "rabbit")
 * $0/month - runs entirely in-browser using CMU Dictionary
 */

import { getIPAPronunciation } from './cmuDictWrapper';
import { phonemeDistance, arePhonemesSimilar, phonemeFeatures } from './phonemeDistance';
import { ipaToFriendlyLabel } from './phonemeDisplayUtils';

export interface PhonemeSubstitution {
  expected: string;
  spoken: string;
  word: string;
  wordIndex: number;
  position: 'initial' | 'medial' | 'final';
  distance: number;
}

export interface PhonemeInferenceResult {
  substitutions: PhonemeSubstitution[];
  problematicPhonemes: string[];
  phonemeAccuracyBySound: Record<string, number>;
  overallPhonemeAccuracy: number;
  interventionPriority: string[];
}

export interface WordPhonemeComparison {
  word: string;
  wordIndex: number;
  expectedPhonemes: string[];
  spokenPhonemes: string[];
  substitutions: PhonemeSubstitution[];
  isMatch: boolean;
}

/**
 * Get position category for a phoneme in a word
 */
const getPhonemePosition = (index: number, totalPhonemes: number): 'initial' | 'medial' | 'final' => {
  if (index === 0) return 'initial';
  if (index === totalPhonemes - 1) return 'final';
  return 'medial';
};

/**
 * Align two phoneme sequences using simple DTW-inspired approach
 * Returns aligned pairs of (expected, spoken) phonemes
 */
const alignPhonemeSequences = (
  expected: string[],
  spoken: string[]
): Array<{ expected: string | null; spoken: string | null; index: number }> => {
  const aligned: Array<{ expected: string | null; spoken: string | null; index: number }> = [];
  
  const maxLen = Math.max(expected.length, spoken.length);
  
  for (let i = 0; i < maxLen; i++) {
    aligned.push({
      expected: expected[i] || null,
      spoken: spoken[i] || null,
      index: i,
    });
  }
  
  return aligned;
};

/**
 * Compare phonemes of a transcribed word vs expected word
 * Uses CMU Dictionary for both lookups
 */
export const compareWordPhonemes = (
  spokenWord: string,
  expectedWord: string,
  wordIndex: number,
  phonemeSimilarityThreshold: number = 0.2
): WordPhonemeComparison => {
  // Get phonemes for both words using CMU Dictionary
  const expectedPhonemes = getIPAPronunciation(expectedWord)[0] || [];
  const spokenPhonemes = getIPAPronunciation(spokenWord)[0] || [];
  
  const substitutions: PhonemeSubstitution[] = [];
  
  // Align phoneme sequences
  const aligned = alignPhonemeSequences(expectedPhonemes, spokenPhonemes);
  
  aligned.forEach(({ expected, spoken, index }) => {
    if (expected && spoken && expected !== spoken) {
      // Check if phonemes are similar (might still be acceptable)
      if (!arePhonemesSimilar(expected, spoken, phonemeSimilarityThreshold)) {
        substitutions.push({
          expected,
          spoken,
          word: expectedWord,
          wordIndex,
          position: getPhonemePosition(index, expectedPhonemes.length),
          distance: phonemeDistance(expected, spoken),
        });
      }
    } else if (expected && !spoken) {
      // Omission
      substitutions.push({
        expected,
        spoken: '∅', // Empty/omission symbol
        word: expectedWord,
        wordIndex,
        position: getPhonemePosition(index, expectedPhonemes.length),
        distance: 1.0,
      });
    } else if (!expected && spoken) {
      // Insertion
      substitutions.push({
        expected: '∅',
        spoken,
        word: expectedWord,
        wordIndex,
        position: 'medial', // Insertions are typically medial
        distance: 1.0,
      });
    }
  });
  
  return {
    word: expectedWord,
    wordIndex,
    expectedPhonemes,
    spokenPhonemes,
    substitutions,
    isMatch: substitutions.length === 0,
  };
};

/**
 * Analyze phoneme patterns across multiple word comparisons
 * Returns detailed phoneme accuracy and problematic sounds
 */
export const analyzePhonemePatterns = (
  wordComparisons: WordPhonemeComparison[]
): PhonemeInferenceResult => {
  const phonemeStats: Record<string, { correct: number; total: number; substitutions: string[] }> = {};
  const allSubstitutions: PhonemeSubstitution[] = [];
  
  // Aggregate all substitutions and track per-phoneme accuracy
  wordComparisons.forEach(comparison => {
    // Track correct phonemes
    comparison.expectedPhonemes.forEach(phoneme => {
      if (!phonemeStats[phoneme]) {
        phonemeStats[phoneme] = { correct: 0, total: 0, substitutions: [] };
      }
      phonemeStats[phoneme].total++;
    });
    
    // Track substitutions
    comparison.substitutions.forEach(sub => {
      if (sub.expected !== '∅') {
        if (!phonemeStats[sub.expected]) {
          phonemeStats[sub.expected] = { correct: 0, total: 0, substitutions: [] };
        }
        phonemeStats[sub.expected].substitutions.push(sub.spoken);
      }
      allSubstitutions.push(sub);
    });
    
    // Mark correct phonemes (those without substitutions)
    const substitutedExpected = new Set(comparison.substitutions.map(s => s.expected));
    comparison.expectedPhonemes.forEach(phoneme => {
      if (!substitutedExpected.has(phoneme)) {
        phonemeStats[phoneme].correct++;
      }
    });
  });
  
  // Calculate per-phoneme accuracy
  const phonemeAccuracyBySound: Record<string, number> = {};
  Object.entries(phonemeStats).forEach(([phoneme, stats]) => {
    phonemeAccuracyBySound[phoneme] = stats.total > 0 
      ? Math.round((stats.correct / stats.total) * 100) 
      : 100;
  });
  
  // Identify problematic phonemes (< 70% accuracy with 2+ occurrences)
  const problematicPhonemes = Object.entries(phonemeStats)
    .filter(([_, stats]) => stats.total >= 2 && (stats.correct / stats.total) < 0.7)
    .map(([phoneme]) => phoneme);
  
  // Calculate overall phoneme accuracy
  const totalPhonemes = Object.values(phonemeStats).reduce((sum, s) => sum + s.total, 0);
  const totalCorrect = Object.values(phonemeStats).reduce((sum, s) => sum + s.correct, 0);
  const overallPhonemeAccuracy = totalPhonemes > 0 
    ? Math.round((totalCorrect / totalPhonemes) * 100) 
    : 100;
  
  // Prioritize interventions by frequency and severity
  const interventionPriority = Object.entries(phonemeStats)
    .filter(([_, stats]) => stats.total >= 2)
    .sort((a, b) => {
      const aAccuracy = a[1].correct / a[1].total;
      const bAccuracy = b[1].correct / b[1].total;
      // Lower accuracy = higher priority
      return aAccuracy - bAccuracy;
    })
    .slice(0, 5) // Top 5 phonemes to work on
    .map(([phoneme]) => phoneme);
  
  return {
    substitutions: allSubstitutions,
    problematicPhonemes,
    phonemeAccuracyBySound,
    overallPhonemeAccuracy,
    interventionPriority,
  };
};

/**
/**
 * Get human-readable name for a phoneme
 */
export const getPhonemeDisplayName = (phoneme: string): string => {
  return ipaToFriendlyLabel(phoneme) || `/${phoneme}/`;
};

/**
 * Get common substitution patterns for a phoneme
 */
export const getCommonSubstitutions = (phoneme: string): string[] => {
  const commonSubs: Record<string, string[]> = {
    'ɹ': ['w', 'l'], // R often becomes W or L
    'θ': ['f', 's'], // TH often becomes F or S
    'ð': ['d', 'v'], // Voiced TH often becomes D or V
    'l': ['w', 'ɹ'], // L can become W or R
    's': ['θ', 'ʃ'], // S can become TH or SH
    'z': ['s', 'ð'], // Z can become S or TH
    'ʃ': ['s', 'tʃ'], // SH can become S or CH
    'tʃ': ['ʃ', 't'], // CH can become SH or T
    'dʒ': ['d', 'ʒ'], // J can become D or ZH
    'k': ['t', 'ɡ'], // K can become T or G
    'ɡ': ['d', 'k'], // G can become D or K
  };
  
  return commonSubs[phoneme] || [];
};
