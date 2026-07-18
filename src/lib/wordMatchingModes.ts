/**
 * AURA Word Matching Modes
 * Dual-mode word matching for engagement (lenient) vs assessment accuracy (strict)
 * 
 * SUPERCHARGED V2: Added window-based matching, phoneme fallback, and multi-alternative support
 * SUPERCHARGED V3: Added homophones dictionary and transcript cleanup integration
 */

import { arePhonemesSimilar, phonemeDistance } from '@/lib/phonemeDistance';
import { getIPAPronunciation } from '@/lib/cmuDictWrapper';
import { isHomophone, getWordVariants } from '@/lib/homophones';
import { isPhonicsConfusion } from '@/lib/phonicsConfusionMap';
import { cleanupTranscript, extractWords } from '@/lib/transcriptCleanup';
import {
  CHALLENGE_LEVELS,
  DEFAULT_CHALLENGE_LEVEL,
  type ChallengeThresholds,
} from '@/lib/challengeMeter';

/**
 * Default thresholds = level 3 (Standard). Every matcher accepts an optional
 * `thresholds` argument so the Challenge Meter can tune strictness per student
 * at runtime WITHOUT touching the recognizer. Omitting the argument keeps the
 * historical behavior byte-for-byte.
 */
const DEFAULT_THRESHOLDS: ChallengeThresholds = CHALLENGE_LEVELS[DEFAULT_CHALLENGE_LEVEL];

// Fuzzy string matching using Levenshtein distance
export const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

export const normalizeWord = (word: string): string => {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Re-export cleanup utilities for convenience
export { cleanupTranscript, extractWords } from '@/lib/transcriptCleanup';
export { isHomophone, getWordVariants } from '@/lib/homophones';

/**
 * SUPERCHARGED: Window-based word matching
 * Instead of sequential matching, finds best match within a window
 * Returns the index of the matched word, or -1 if no match found
 */
export const findWordInWindow = (
  spoken: string,
  expectedWords: string[],
  startIdx: number,
  windowSize: number = 5,
  useLenient: boolean = true,
  thresholds: ChallengeThresholds = DEFAULT_THRESHOLDS
): { matchedIndex: number; matchScore: number } => {
  const normalizedSpoken = normalizeWord(spoken);
  if (!normalizedSpoken) return { matchedIndex: -1, matchScore: 0 };

  let bestMatch = -1;
  let bestScore = 0;

  const endIdx = Math.min(startIdx + windowSize, expectedWords.length);

  for (let i = startIdx; i < endIdx; i++) {
    const expected = expectedWords[i];
    const normalizedExpected = normalizeWord(expected);

    if (normalizedSpoken === normalizedExpected) {
      return { matchedIndex: i, matchScore: 100 };
    }

    const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
    const maxLen = Math.max(normalizedSpoken.length, normalizedExpected.length);
    const score = Math.round(((maxLen - distance) / maxLen) * 100);

    const meetsThreshold = useLenient
      ? isWordMatchLenient(spoken, expected, thresholds)
      : isWordMatchStrict(spoken, expected, thresholds);

    if (meetsThreshold && score > bestScore) {
      bestScore = score;
      bestMatch = i;
    }
  }

  return { matchedIndex: bestMatch, matchScore: bestScore };
};

/**
 * SUPERCHARGED: Check word match using ALL alternatives from Web Speech API
 * Returns true if ANY alternative matches the expected word
 */
export const matchWithAlternatives = (
  alternatives: string[],
  expected: string,
  useLenient: boolean = true,
  thresholds: ChallengeThresholds = DEFAULT_THRESHOLDS
): { isMatch: boolean; bestAlternative: string; matchScore: number } => {
  let bestScore = 0;
  let bestAlternative = alternatives[0] || '';

  for (const alt of alternatives) {
    const words = alt.split(/\s+/).filter(w => w.length > 0);
    for (const word of words) {
      const normalizedWord = normalizeWord(word);
      const normalizedExpected = normalizeWord(expected);

      if (normalizedWord === normalizedExpected) {
        return { isMatch: true, bestAlternative: word, matchScore: 100 };
      }

      const distance = levenshteinDistance(normalizedWord, normalizedExpected);
      const maxLen = Math.max(normalizedWord.length, normalizedExpected.length);
      const score = Math.round(((maxLen - distance) / maxLen) * 100);

      if (score > bestScore) {
        bestScore = score;
        bestAlternative = word;
      }
    }
  }

  const meetsThreshold = useLenient
    ? isWordMatchLenient(bestAlternative, expected, thresholds)
    : isWordMatchStrict(bestAlternative, expected, thresholds);

  return { isMatch: meetsThreshold, bestAlternative, matchScore: bestScore };
};

/**
 * SUPERCHARGED: Phoneme-based word matching fallback
 * Uses phonetic comparison when text matching fails
 * Returns true if phoneme similarity is >= 70%
 */
export const matchWithPhonemes = (
  spoken: string,
  expected: string,
  threshold?: number,
  thresholds: ChallengeThresholds = DEFAULT_THRESHOLDS
): { isMatch: boolean; similarity: number } => {
  try {
    const effectiveThreshold = threshold ?? thresholds.minPhonemeAccuracy;
    const expectedPhonemes = getIPAPronunciation(expected)[0] || [];
    const spokenPhonemes = getIPAPronunciation(spoken)[0] || [];

    if (expectedPhonemes.length === 0 || spokenPhonemes.length === 0) {
      return { isMatch: false, similarity: 0 };
    }

    const maxLen = Math.max(expectedPhonemes.length, spokenPhonemes.length);
    const minLen = Math.min(expectedPhonemes.length, spokenPhonemes.length);

    let matchCount = 0;
    for (let i = 0; i < minLen; i++) {
      if (expectedPhonemes[i] === spokenPhonemes[i]) {
        matchCount++;
      } else if (
        arePhonemesSimilar(expectedPhonemes[i], spokenPhonemes[i], thresholds.phonemeSimilarityThreshold)
      ) {
        matchCount += 0.7;
      }
    }

    const similarity = matchCount / maxLen;
    return {
      isMatch: similarity >= effectiveThreshold,
      similarity,
    };
  } catch (e) {
    return { isMatch: false, similarity: 0 };
  }
};

/**
 * SUPERCHARGED: Full re-scan of transcript for override logic
 * Searches ENTIRE transcript for each word, not just sequential position
 */
export const findWordInFullTranscript = (
  expectedWord: string,
  fullTranscript: string,
  useLenient: boolean = true,
  thresholds: ChallengeThresholds = DEFAULT_THRESHOLDS
): boolean => {
  const normalizedExpected = normalizeWord(expectedWord);
  const transcriptWords = fullTranscript.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  for (const spokenWord of transcriptWords) {
    const normalizedSpoken = normalizeWord(spokenWord);

    if (normalizedSpoken === normalizedExpected) return true;

    const isMatch = useLenient
      ? isWordMatchLenient(spokenWord, expectedWord, thresholds)
      : isWordMatchStrict(spokenWord, expectedWord, thresholds);

    if (isMatch) return true;
  }

  return false;
};

/**
 * LENIENT word matching - for daily practice (engagement mode)
 * Prioritizes student confidence over strict accuracy
 * 
 * SUPERCHARGED V3: Homophones checked FIRST before fuzzy matching
 */
export const isWordMatchLenient = (
  spoken: string,
  expected: string,
  thresholds: ChallengeThresholds = DEFAULT_THRESHOLDS
): boolean => {
  const normalizedSpoken = normalizeWord(spoken);
  const normalizedExpected = normalizeWord(expected);

  if (normalizedSpoken === normalizedExpected) return true;
  if (!normalizedSpoken || !normalizedExpected) return false;

  // Homophones + phonics confusion accepted at levels 1-3
  if (isHomophone(normalizedSpoken, normalizedExpected)) return true;
  if (isPhonicsConfusion(normalizedSpoken, normalizedExpected)) return true;

  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  const len = normalizedExpected.length;
  // tolerance is a ratio of allowed edits per char. Always allow at least 1 edit
  // so single-letter substitutions don't fail short words at low levels.
  const maxAllowed = Math.max(1, Math.floor(len * thresholds.levenshteinTolerance));
  return distance <= maxAllowed;
};

/**
 * STRICT word matching - for benchmark assessments (accuracy mode).
 * Homophones accepted only for the "true homophones" list; no child variants.
 */
const TRUE_HOMOPHONES = new Set([
  'to','two','too','for','four','their','there',"they're",
  'your',"you're",'its',"it's",'know','no','new','knew',
  'right','write','here','hear','see','sea','be','bee',
  'by','buy','bye','one','won','eight','ate','sun','son',
  'some','sum','pair','pear','peace','piece','tail','tale',
  'mail','male','sail','sale','made','maid','plain','plane',
  'role','roll','hole','whole','dear','deer','bare','bear',
  'hair','hare','fair','fare','stair','stare','knight','night',
  'wait','weight','week','weak','meat','meet','feat','feet',
  'road','rode','rain','reign','rein','break','brake',
]);

export const isWordMatchStrict = (
  spoken: string,
  expected: string,
  thresholds: ChallengeThresholds = DEFAULT_THRESHOLDS
): boolean => {
  const normalizedSpoken = normalizeWord(spoken);
  const normalizedExpected = normalizeWord(expected);

  if (normalizedSpoken === normalizedExpected) return true;
  if (!normalizedSpoken || !normalizedExpected) return false;

  if (isHomophone(normalizedSpoken, normalizedExpected)) {
    if (TRUE_HOMOPHONES.has(normalizedExpected) || TRUE_HOMOPHONES.has(normalizedSpoken)) {
      return true;
    }
  }

  // Phonics confusion accepted at level 4 but NOT at level 5 (assessment-grade)
  if (thresholds.minPhonemeAccuracy < 0.9 && isPhonicsConfusion(normalizedSpoken, normalizedExpected)) {
    return true;
  }

  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  const len = normalizedExpected.length;
  // Strict path: no free short-word edit — allow at most floor(len * tol).
  const maxAllowed = Math.floor(len * thresholds.levenshteinTolerance);
  return distance <= maxAllowed;
};

/**
 * BATTLE MODE word matching - stricter than lenient, no child variants.
 */
export const isWordMatchBattle = (
  spoken: string,
  expected: string,
  thresholds: ChallengeThresholds = DEFAULT_THRESHOLDS
): boolean => {
  const normalizedSpoken = normalizeWord(spoken);
  const normalizedExpected = normalizeWord(expected);

  if (normalizedSpoken === normalizedExpected) return true;
  if (!normalizedSpoken || !normalizedExpected) return false;

  if (isHomophone(normalizedSpoken, normalizedExpected)) {
    if (TRUE_HOMOPHONES.has(normalizedExpected) || TRUE_HOMOPHONES.has(normalizedSpoken)) {
      return true;
    }
    return false;
  }

  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  const len = normalizedExpected.length;
  const maxAllowed = Math.max(1, Math.floor(len * Math.min(0.25, thresholds.levenshteinTolerance)));
  return distance <= maxAllowed;
};

/**
 * Word match with detailed result including confidence info
 */
export interface WordMatchResult {
  isCorrect: boolean;
  confidence: 'high' | 'medium' | 'low';
  matchScore: number; // 0-100 percentage match
  needsVerification: boolean;
}

/**
 * Detailed word match analysis for teacher verification workflow
 */
export const analyzeWordMatch = (
  spoken: string,
  expected: string,
  speechConfidence: number = 1,
  isStrictMode: boolean = false,
  thresholds: ChallengeThresholds = DEFAULT_THRESHOLDS
): WordMatchResult => {
  const normalizedSpoken = normalizeWord(spoken);
  const normalizedExpected = normalizeWord(expected);
  
  // Calculate match score (0-100)
  let matchScore = 100;
  if (normalizedSpoken && normalizedExpected) {
    const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
    const maxLen = Math.max(normalizedSpoken.length, normalizedExpected.length);
    matchScore = Math.round(((maxLen - distance) / maxLen) * 100);
  } else if (!normalizedSpoken) {
    matchScore = 0;
  }
  
  // Determine if word is correct based on mode
  const isCorrect = isStrictMode
    ? isWordMatchStrict(spoken, expected, thresholds)
    : isWordMatchLenient(spoken, expected, thresholds);

  let confidence: 'high' | 'medium' | 'low';
  const combinedScore = (matchScore / 100 + speechConfidence) / 2;

  if (combinedScore >= 0.9) confidence = 'high';
  else if (combinedScore >= 0.7) confidence = 'medium';
  else confidence = 'low';

  const lenientResult = isWordMatchLenient(spoken, expected, thresholds);
  const strictResult = isWordMatchStrict(spoken, expected, thresholds);
  const modesDisagree = lenientResult !== strictResult;
  
  const needsVerification = 
    speechConfidence < 0.7 || 
    (matchScore >= 60 && matchScore < 85) ||
    modesDisagree;
  
  return {
    isCorrect,
    confidence,
    matchScore,
    needsVerification,
  };
};

/**
 * Calculate session-level AI confidence score
 */
export const calculateSessionConfidence = (
  wordConfidences: Array<{ confidence: 'high' | 'medium' | 'low'; speechConfidence: number }>
): { score: number; level: 'high' | 'medium' | 'low'; flaggedWordCount: number } => {
  if (wordConfidences.length === 0) {
    return { score: 0, level: 'low', flaggedWordCount: 0 };
  }
  
  const avgSpeechConfidence = wordConfidences.reduce((sum, w) => sum + w.speechConfidence, 0) / wordConfidences.length;
  const highConfidenceCount = wordConfidences.filter(w => w.confidence === 'high').length;
  const flaggedWordCount = wordConfidences.filter(w => w.confidence === 'low' || w.speechConfidence < 0.7).length;
  
  const score = Math.round(avgSpeechConfidence * 100);
  
  let level: 'high' | 'medium' | 'low';
  if (score >= 90 && highConfidenceCount >= wordConfidences.length * 0.8) {
    level = 'high';
  } else if (score >= 70) {
    level = 'medium';
  } else {
    level = 'low';
  }
  
  return { score, level, flaggedWordCount };
};
