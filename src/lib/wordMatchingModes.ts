/**
 * AURA Word Matching Modes
 * Dual-mode word matching for engagement (lenient) vs assessment accuracy (strict)
 */

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
 * LENIENT word matching - for daily practice (engagement mode)
 * Prioritizes student confidence over strict accuracy
 */
export const isWordMatchLenient = (spoken: string, expected: string): boolean => {
  const normalizedSpoken = normalizeWord(spoken);
  const normalizedExpected = normalizeWord(expected);
  
  // Exact match - definitely correct
  if (normalizedSpoken === normalizedExpected) return true;
  
  // Empty check - if no speech detected, benefit of doubt
  if (!normalizedSpoken) return true;
  if (!normalizedExpected) return false;
  
  // SHORT WORDS (1-3 chars): Always correct (too easy to mishear)
  if (normalizedExpected.length <= 3) {
    return true;
  }
  
  // Check if spoken starts with expected or vice versa (partial matches are fine)
  if (normalizedSpoken.startsWith(normalizedExpected) || normalizedExpected.startsWith(normalizedSpoken)) {
    return true;
  }
  
  // Check if spoken contains expected or vice versa
  if (normalizedSpoken.includes(normalizedExpected) || normalizedExpected.includes(normalizedSpoken)) {
    return true;
  }
  
  const distance = levenshteinDistance(normalizedSpoken, normalizedExpected);
  
  // MEDIUM WORDS (4-6 chars): 70% tolerance (very lenient)
  if (normalizedExpected.length <= 6) {
    return distance <= Math.ceil(normalizedExpected.length * 0.7);
  }
  
  // LONG WORDS (7+ chars): 65% tolerance (very lenient)
  return distance <= Math.ceil(normalizedExpected.length * 0.65);
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
