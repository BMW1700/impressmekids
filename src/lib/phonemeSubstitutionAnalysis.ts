/**
 * Phoneme Substitution Analysis
 * Compares detected words (from Whisper) against expected words to find
 * REAL phoneme-level substitutions (e.g., "wabbit" → "rabbit" = /ɹ/→/w/)
 * 
 * This is the core of Option 1: Enhanced Mismatch Detection
 * Game-changing because it tracks ACTUAL pronunciation errors from audio!
 */

import { getIPAPronunciation } from './cmuDictWrapper';

export interface PhonemeSubstitution {
  /** Expected phoneme (what should be said) */
  expected: string;
  /** Detected phoneme (what was actually said) */
  detected: string;
  /** The expected word */
  expectedWord: string;
  /** The detected word (from Whisper) */
  detectedWord: string;
  /** Word index in the passage */
  wordIndex: number;
  /** Position in the word (initial, medial, final) */
  position: 'initial' | 'medial' | 'final';
  /** Confidence of this substitution detection */
  confidence: number;
}

export interface WordSubstitutionResult {
  /** Whether words are different */
  isMismatch: boolean;
  /** The expected word */
  expectedWord: string;
  /** The detected word */
  detectedWord: string;
  /** Phoneme-level substitutions found */
  substitutions: PhonemeSubstitution[];
  /** Phonemes that were omitted */
  omissions: string[];
  /** Phonemes that were added */
  additions: string[];
  /** Edit distance between the words */
  editDistance: number;
}

export interface AggregatedPhonemeAccuracy {
  /** Per-phoneme accuracy: { phoneme: score 0-100 } */
  phonemeScores: Record<string, number>;
  /** Substitution counts: { "ɹ→w": count } */
  substitutionCounts: Record<string, number>;
  /** Most problematic phonemes (accuracy < 70%) */
  problematicPhonemes: string[];
  /** Most common substitution patterns */
  topSubstitutions: Array<{ from: string; to: string; count: number }>;
  /** Overall phoneme accuracy percentage */
  overallAccuracy: number;
}

/**
 * Compare two words at the phoneme level to find substitutions
 * This is the core algorithm for detecting pronunciation errors
 */
export function compareWordsForPhonemes(
  detectedWord: string,
  expectedWord: string,
  wordIndex: number,
  confidence: number = 0.85
): WordSubstitutionResult {
  const normalizedDetected = detectedWord.toLowerCase().replace(/[^a-z]/g, '');
  const normalizedExpected = expectedWord.toLowerCase().replace(/[^a-z]/g, '');
  
  // If words are identical, no substitutions
  if (normalizedDetected === normalizedExpected) {
    return {
      isMismatch: false,
      expectedWord,
      detectedWord,
      substitutions: [],
      omissions: [],
      additions: [],
      editDistance: 0,
    };
  }
  
  // Get phonemes for both words
  const expectedPhonemes = getIPAPronunciation(normalizedExpected)[0] || [];
  const detectedPhonemes = getIPAPronunciation(normalizedDetected)[0] || [];
  
  if (expectedPhonemes.length === 0 || detectedPhonemes.length === 0) {
    return {
      isMismatch: true,
      expectedWord,
      detectedWord,
      substitutions: [],
      omissions: expectedPhonemes,
      additions: detectedPhonemes,
      editDistance: Math.max(expectedPhonemes.length, detectedPhonemes.length),
    };
  }
  
  // Use Levenshtein-style alignment to find substitutions
  const alignment = alignPhonemeSequences(expectedPhonemes, detectedPhonemes);
  
  const substitutions: PhonemeSubstitution[] = [];
  const omissions: string[] = [];
  const additions: string[] = [];
  
  alignment.forEach((pair, idx) => {
    const position = getPosition(idx, alignment.length);
    
    if (pair.expected && pair.detected) {
      if (pair.expected !== pair.detected) {
        // This is a substitution!
        substitutions.push({
          expected: pair.expected,
          detected: pair.detected,
          expectedWord,
          detectedWord,
          wordIndex,
          position,
          confidence,
        });
      }
    } else if (pair.expected && !pair.detected) {
      // Omission
      omissions.push(pair.expected);
    } else if (!pair.expected && pair.detected) {
      // Addition
      additions.push(pair.detected);
    }
  });
  
  return {
    isMismatch: true,
    expectedWord,
    detectedWord,
    substitutions,
    omissions,
    additions,
    editDistance: substitutions.length + omissions.length + additions.length,
  };
}

/**
 * Align two phoneme sequences using dynamic programming (Needleman-Wunsch style)
 */
function alignPhonemeSequences(
  expected: string[],
  detected: string[]
): Array<{ expected: string | null; detected: string | null }> {
  const n = expected.length;
  const m = detected.length;
  
  // Create DP matrix
  const dp: number[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  
  // Fill DP matrix
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const matchCost = expected[i - 1] === detected[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + matchCost, // Match or substitution
        dp[i - 1][j] + 1,             // Deletion (omission)
        dp[i][j - 1] + 1              // Insertion (addition)
      );
    }
  }
  
  // Backtrack to find alignment
  const alignment: Array<{ expected: string | null; detected: string | null }> = [];
  let i = n;
  let j = m;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (expected[i - 1] === detected[j - 1] ? 0 : 1)) {
      // Match or substitution
      alignment.unshift({ expected: expected[i - 1], detected: detected[j - 1] });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      // Deletion (expected phoneme omitted)
      alignment.unshift({ expected: expected[i - 1], detected: null });
      i--;
    } else {
      // Insertion (extra phoneme added)
      alignment.unshift({ expected: null, detected: detected[j - 1] });
      j--;
    }
  }
  
  return alignment;
}

/**
 * Determine position in word (initial, medial, final)
 */
function getPosition(index: number, total: number): 'initial' | 'medial' | 'final' {
  if (index === 0) return 'initial';
  if (index === total - 1) return 'final';
  return 'medial';
}

/**
 * Aggregate phoneme accuracy from multiple word comparisons
 * This builds the data for the PhonemeHeatmap!
 */
export function aggregatePhonemeAccuracy(
  wordResults: WordSubstitutionResult[],
  allExpectedWords: string[]
): AggregatedPhonemeAccuracy {
  const phonemeStats: Record<string, { correct: number; total: number }> = {};
  const substitutionCounts: Record<string, number> = {};
  
  // First, count expected phonemes from ALL words (not just mismatched)
  allExpectedWords.forEach(word => {
    const phonemes = getIPAPronunciation(word.toLowerCase().replace(/[^a-z]/g, ''))[0] || [];
    phonemes.forEach(phoneme => {
      if (!phonemeStats[phoneme]) {
        phonemeStats[phoneme] = { correct: 0, total: 0 };
      }
      phonemeStats[phoneme].total++;
    });
  });
  
  // Mark correct phonemes for words that matched perfectly
  const mismatchedIndices = new Set(wordResults.filter(r => r.isMismatch).map((_, idx) => idx));
  allExpectedWords.forEach((word, idx) => {
    if (!mismatchedIndices.has(idx)) {
      // Word was pronounced correctly - all its phonemes are correct
      const phonemes = getIPAPronunciation(word.toLowerCase().replace(/[^a-z]/g, ''))[0] || [];
      phonemes.forEach(phoneme => {
        if (phonemeStats[phoneme]) {
          phonemeStats[phoneme].correct++;
        }
      });
    }
  });
  
  // Process substitutions from mismatched words
  wordResults.forEach(result => {
    if (!result.isMismatch) return;
    
    // Get expected phonemes for this word
    const expectedPhonemes = getIPAPronunciation(result.expectedWord.toLowerCase().replace(/[^a-z]/g, ''))[0] || [];
    const substitutedPhonemes = new Set(result.substitutions.map(s => s.expected));
    const omittedPhonemes = new Set(result.omissions);
    
    // Phonemes that weren't substituted or omitted are correct
    expectedPhonemes.forEach(phoneme => {
      if (!substitutedPhonemes.has(phoneme) && !omittedPhonemes.has(phoneme)) {
        if (phonemeStats[phoneme]) {
          phonemeStats[phoneme].correct++;
        }
      }
    });
    
    // Count substitutions
    result.substitutions.forEach(sub => {
      const key = `${sub.expected}→${sub.detected}`;
      substitutionCounts[key] = (substitutionCounts[key] || 0) + 1;
    });
  });
  
  // Calculate per-phoneme accuracy scores
  const phonemeScores: Record<string, number> = {};
  Object.entries(phonemeStats).forEach(([phoneme, stats]) => {
    if (stats.total > 0) {
      phonemeScores[phoneme] = Math.round((stats.correct / stats.total) * 100);
    }
  });
  
  // Find problematic phonemes (accuracy < 70% with 2+ occurrences)
  const problematicPhonemes = Object.entries(phonemeStats)
    .filter(([_, stats]) => stats.total >= 2 && (stats.correct / stats.total) < 0.7)
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
    .map(([phoneme]) => phoneme);
  
  // Get top substitution patterns
  const topSubstitutions = Object.entries(substitutionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => {
      const [from, to] = key.split('→');
      return { from, to, count };
    });
  
  // Calculate overall accuracy
  const totalCorrect = Object.values(phonemeStats).reduce((sum, s) => sum + s.correct, 0);
  const totalPhonemes = Object.values(phonemeStats).reduce((sum, s) => sum + s.total, 0);
  const overallAccuracy = totalPhonemes > 0 ? Math.round((totalCorrect / totalPhonemes) * 100) : 0;
  
  return {
    phonemeScores,
    substitutionCounts,
    problematicPhonemes,
    topSubstitutions,
    overallAccuracy,
  };
}

/**
 * Get common substitution pairs (educational reference)
 * These are phoneme pairs that are commonly confused by students
 */
export const COMMON_SUBSTITUTION_PATTERNS: Record<string, string[]> = {
  'ɹ': ['w', 'l'],        // R-sound → W or L (common in young learners)
  'θ': ['f', 's', 't'],   // TH → F, S, or T ("think" → "fink")
  'ð': ['d', 'v', 'z'],   // TH → D, V, or Z ("the" → "de")
  'l': ['w', 'ɹ'],        // L → W or R
  'ʃ': ['s', 'tʃ'],       // SH → S or CH
  'tʃ': ['ʃ', 'dʒ'],      // CH → SH or J
  'dʒ': ['tʃ', 'ʒ'],      // J → CH or ZH
  'v': ['b', 'f'],        // V → B or F
  'z': ['s'],             // Z → S
  'ŋ': ['n'],             // NG → N ("sing" → "sin")
};

/**
 * Check if a substitution is a "common error" vs unusual
 */
export function isCommonSubstitution(expected: string, detected: string): boolean {
  const commonSubs = COMMON_SUBSTITUTION_PATTERNS[expected];
  return commonSubs ? commonSubs.includes(detected) : false;
}

/**
 * Get intervention priority based on substitution patterns
 * Returns phonemes sorted by how urgently they need practice
 */
export function getInterventionPriority(
  accuracy: AggregatedPhonemeAccuracy
): Array<{ phoneme: string; reason: string; priority: 'high' | 'medium' | 'low' }> {
  const priorities: Array<{ phoneme: string; reason: string; priority: 'high' | 'medium' | 'low' }> = [];
  
  // High priority: Phonemes with common substitution patterns + low accuracy
  accuracy.topSubstitutions.forEach(sub => {
    if (isCommonSubstitution(sub.from, sub.to) && sub.count >= 2) {
      priorities.push({
        phoneme: sub.from,
        reason: `Often says "${sub.to}" instead of "${sub.from}" (${sub.count}x)`,
        priority: 'high',
      });
    }
  });
  
  // Medium priority: Low accuracy phonemes
  accuracy.problematicPhonemes.forEach(phoneme => {
    if (!priorities.find(p => p.phoneme === phoneme)) {
      const score = accuracy.phonemeScores[phoneme] || 0;
      priorities.push({
        phoneme,
        reason: `Only ${score}% accuracy`,
        priority: score < 50 ? 'high' : 'medium',
      });
    }
  });
  
  return priorities.slice(0, 5); // Top 5 priorities
}
