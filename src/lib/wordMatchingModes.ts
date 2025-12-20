/**
 * AURA Word Matching Modes
 * Dual-mode word matching for engagement (lenient) vs assessment accuracy (strict)
 * 
 * SUPERCHARGED V2: Added window-based matching, phoneme fallback, and multi-alternative support
 */

import { arePhonemesSimilar, phonemeDistance } from '@/lib/phonemeDistance';
import { getIPAPronunciation } from '@/lib/cmuDictWrapper';

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
  useLenient: boolean = true
): { matchedIndex: number; matchScore: number } => {
  const normalizedSpoken = normalizeWord(spoken);
  if (!normalizedSpoken) return { matchedIndex: -1, matchScore: 0 };
  
  let bestMatch = -1;
  let bestScore = 0;
  
  const endIdx = Math.min(startIdx + windowSize, expectedWords.length);
  
  for (let i = startIdx; i < endIdx; i++) {
    const expected = expectedWords[i];
    const normalizedExpected = normalizeWord(expected);
    
    // Exact match - highest priority
    if (normalizedSpoken === normalizedExpected) {
      return { matchedIndex: i, matchScore: 100 };
    }
    
    // Calculate similarity score
    const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
    const maxLen = Math.max(normalizedSpoken.length, normalizedExpected.length);
    const score = Math.round(((maxLen - distance) / maxLen) * 100);
    
    // Check if it meets the threshold
    const meetsThreshold = useLenient 
      ? isWordMatchLenient(spoken, expected)
      : isWordMatchStrict(spoken, expected);
    
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
  useLenient: boolean = true
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
  
  // Check if best match meets threshold
  const meetsThreshold = useLenient 
    ? isWordMatchLenient(bestAlternative, expected)
    : isWordMatchStrict(bestAlternative, expected);
  
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
  threshold: number = 0.70
): { isMatch: boolean; similarity: number } => {
  try {
    // Get phonemes for both words using CMU Dictionary
    const expectedPhonemes = getIPAPronunciation(expected)[0] || [];
    const spokenPhonemes = getIPAPronunciation(spoken)[0] || [];
    
    if (expectedPhonemes.length === 0 || spokenPhonemes.length === 0) {
      // Words not in dictionary - fall back to text matching
      return { isMatch: false, similarity: 0 };
    }
    
    // Calculate phoneme-level similarity
    const maxLen = Math.max(expectedPhonemes.length, spokenPhonemes.length);
    const minLen = Math.min(expectedPhonemes.length, spokenPhonemes.length);
    
    let matchCount = 0;
    for (let i = 0; i < minLen; i++) {
      if (expectedPhonemes[i] === spokenPhonemes[i]) {
        matchCount++;
      } else if (arePhonemesSimilar(expectedPhonemes[i], spokenPhonemes[i], 0.3)) {
        matchCount += 0.7; // Partial credit for similar phonemes
      }
    }
    
    const similarity = matchCount / maxLen;
    return { 
      isMatch: similarity >= threshold, 
      similarity 
    };
  } catch (e) {
    // Fallback if phoneme comparison fails
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
  useLenient: boolean = true
): boolean => {
  const normalizedExpected = normalizeWord(expectedWord);
  const transcriptWords = fullTranscript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  for (const spokenWord of transcriptWords) {
    const normalizedSpoken = normalizeWord(spokenWord);
    
    // Exact match
    if (normalizedSpoken === normalizedExpected) {
      return true;
    }
    
    // Fuzzy match based on mode
    const isMatch = useLenient 
      ? isWordMatchLenient(spokenWord, expectedWord)
      : isWordMatchStrict(spokenWord, expectedWord);
    
    if (isMatch) {
      return true;
    }
  }
  
  return false;
};

/**
 * LENIENT word matching - for daily practice (engagement mode)
 * Prioritizes student confidence over strict accuracy
 */
export const isWordMatchLenient = (spoken: string, expected: string): boolean => {
  const normalizedSpoken = normalizeWord(spoken);
  const normalizedExpected = normalizeWord(expected);
  
  // Exact match - definitely correct
  if (normalizedSpoken === normalizedExpected) return true;
  
  // Empty check - no speech = not correct!
  if (!normalizedSpoken) return false;
  if (!normalizedExpected) return false;
  
  // SHORT WORDS (1-3 chars): Max 1 character difference allowed
  if (normalizedExpected.length <= 3) {
    const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
    return distance <= 1;
  }
  
  // "Starts with" only if spoken is at least 60% of expected length
  if (normalizedExpected.startsWith(normalizedSpoken) && 
      normalizedSpoken.length >= normalizedExpected.length * 0.6) {
    return true;
  }
  
  // REMOVED: "contains" check - was too lenient
  
  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  
  // MEDIUM WORDS (4-6 chars): 40% tolerance (was 70%)
  if (normalizedExpected.length <= 6) {
    return distance <= Math.ceil(normalizedExpected.length * 0.4);
  }
  
  // LONG WORDS (7+ chars): 30% tolerance (was 65%)
  return distance <= Math.ceil(normalizedExpected.length * 0.3);
};

/**
 * STRICT word matching - for benchmark assessments (accuracy mode)
 * DIBELS-quality accuracy for formal assessment
 */
export const isWordMatchStrict = (spoken: string, expected: string): boolean => {
  const normalizedSpoken = normalizeWord(spoken);
  const normalizedExpected = normalizeWord(expected);
  
  // Exact match - definitely correct
  if (normalizedSpoken === normalizedExpected) return true;
  
  // Empty check - if no speech, mark as incorrect in strict mode
  if (!normalizedSpoken) return false;
  if (!normalizedExpected) return false;
  
  // SHORT WORDS (1-3 chars): Max 1 character difference allowed
  if (normalizedExpected.length <= 3) {
    const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
    return distance <= 1;
  }
  
  // ALL OTHER WORDS: 80% match required (much stricter)
  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  const maxAllowedDistance = Math.ceil(normalizedExpected.length * 0.2); // 20% tolerance only
  
  return distance <= maxAllowedDistance;
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
  speechConfidence: number = 1, // Web Speech API confidence (0-1)
  isStrictMode: boolean = false
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
    ? isWordMatchStrict(spoken, expected)
    : isWordMatchLenient(spoken, expected);
  
  // Determine overall confidence
  let confidence: 'high' | 'medium' | 'low';
  const combinedScore = (matchScore / 100 + speechConfidence) / 2;
  
  if (combinedScore >= 0.9) {
    confidence = 'high';
  } else if (combinedScore >= 0.7) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  // Flag for teacher verification if:
  // - Speech API confidence < 0.7
  // - Match score is in the gray zone (60-85%)
  // - Word result differs between strict and lenient modes
  const lenientResult = isWordMatchLenient(spoken, expected);
  const strictResult = isWordMatchStrict(spoken, expected);
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
