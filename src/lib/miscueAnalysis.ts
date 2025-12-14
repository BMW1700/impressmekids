/**
 * AURA Miscue Analysis System
 * Categorizes reading errors: substitutions, omissions, insertions, self-corrections
 * Used for WCPM calculation and intervention recommendations
 */

export type MiscueType = 'substitution' | 'omission' | 'insertion' | 'self_correction' | 'repetition';

export interface Miscue {
  type: MiscueType;
  wordIndex: number;
  expectedWord: string;
  spokenWord: string;
  timestamp: number;
  impact: 'meaning_changing' | 'minor' | 'no_impact';
  selfCorrected: boolean;
}

export interface MiscueAnalysis {
  totalMiscues: number;
  miscuesByType: Record<MiscueType, number>;
  wcpm: number;  // Words Correct Per Minute (WPM minus miscues)
  accuracyRate: number;  // (words correct / total words) * 100
  selfCorrectionRate: number;  // (self-corrections / total miscues) * 100
  meaningChangingErrors: number;
  miscues: Miscue[];
  fluencyLevel: 'frustration' | 'instructional' | 'independent';
}

/**
 * Calculate Levenshtein distance for word comparison
 */
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
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

/**
 * Normalize word for comparison
 */
const normalizeWord = (word: string): string => {
  return word.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Determine if a substitution changes meaning
 */
const isMeaningChanging = (expected: string, spoken: string): boolean => {
  const normExpected = normalizeWord(expected);
  const normSpoken = normalizeWord(spoken);
  
  // Same base word (e.g., "running" vs "run") - minor impact
  if (normExpected.includes(normSpoken) || normSpoken.includes(normExpected)) {
    return false;
  }
  
  // Completely different words - meaning changing
  const distance = levenshteinDistance(normExpected, normSpoken);
  const maxLen = Math.max(normExpected.length, normSpoken.length);
  
  return distance / maxLen > 0.5;
};

/**
 * Classify miscue type based on spoken vs expected words
 */
export const classifyMiscue = (
  expected: string,
  spoken: string,
  previousSpoken?: string,
  nextSpoken?: string
): { type: MiscueType; selfCorrected: boolean } => {
  const normExpected = normalizeWord(expected);
  const normSpoken = normalizeWord(spoken);
  
  // Check for self-correction (said wrong, then correct)
  if (nextSpoken && normalizeWord(nextSpoken) === normExpected) {
    return { type: 'self_correction', selfCorrected: true };
  }
  
  // Check for repetition (same word repeated)
  if (previousSpoken && normalizeWord(previousSpoken) === normSpoken) {
    return { type: 'repetition', selfCorrected: false };
  }
  
  // No word spoken (omission)
  if (!normSpoken || normSpoken.length === 0) {
    return { type: 'omission', selfCorrected: false };
  }
  
  // Extra word inserted (not in expected sequence)
  // This is detected at a higher level by comparing sequences
  
  // Default: substitution
  return { type: 'substitution', selfCorrected: false };
};

/**
 * Analyze miscues from word readings
 */
export const analyzeMiscues = (
  wordReadings: Array<{
    word: string;
    index: number;
    startMs: number;
    correct: boolean;
    hesitation?: boolean;
  }>,
  expectedWords: string[],
  durationSeconds: number
): MiscueAnalysis => {
  const miscues: Miscue[] = [];
  let correctCount = 0;
  let selfCorrectionCount = 0;
  
  const miscuesByType: Record<MiscueType, number> = {
    substitution: 0,
    omission: 0,
    insertion: 0,
    self_correction: 0,
    repetition: 0,
  };
  
  // Track which expected words were read
  const readIndices = new Set(wordReadings.map(wr => wr.index));
  
  // Check for omissions (expected words not read)
  expectedWords.forEach((expected, index) => {
    if (!readIndices.has(index)) {
      miscues.push({
        type: 'omission',
        wordIndex: index,
        expectedWord: expected,
        spokenWord: '',
        timestamp: 0,
        impact: 'meaning_changing',
        selfCorrected: false,
      });
      miscuesByType.omission++;
    }
  });
  
  // Analyze each word reading
  wordReadings.forEach((reading, idx) => {
    const expected = expectedWords[reading.index] || '';
    const previousSpoken = idx > 0 ? wordReadings[idx - 1]?.word : undefined;
    const nextSpoken = idx < wordReadings.length - 1 ? wordReadings[idx + 1]?.word : undefined;
    
    if (reading.correct) {
      correctCount++;
    } else {
      const { type, selfCorrected } = classifyMiscue(
        expected,
        reading.word,
        previousSpoken,
        nextSpoken
      );
      
      const impact = isMeaningChanging(expected, reading.word) 
        ? 'meaning_changing' 
        : 'minor';
      
      miscues.push({
        type,
        wordIndex: reading.index,
        expectedWord: expected,
        spokenWord: reading.word,
        timestamp: reading.startMs,
        impact,
        selfCorrected,
      });
      
      miscuesByType[type]++;
      
      if (selfCorrected) {
        selfCorrectionCount++;
        correctCount++; // Self-corrections count as correct for WCPM
      }
    }
  });
  
  // Calculate metrics
  const totalWords = wordReadings.length;
  const totalMiscues = miscues.length;
  const wcpm = durationSeconds > 0 
    ? Math.round((correctCount / durationSeconds) * 60) 
    : 0;
  const accuracyRate = totalWords > 0 
    ? Math.round((correctCount / totalWords) * 100) 
    : 0;
  const selfCorrectionRate = totalMiscues > 0 
    ? Math.round((selfCorrectionCount / totalMiscues) * 100) 
    : 0;
  const meaningChangingErrors = miscues.filter(m => m.impact === 'meaning_changing').length;
  
  // Determine fluency level based on accuracy
  let fluencyLevel: 'frustration' | 'instructional' | 'independent';
  if (accuracyRate >= 97) {
    fluencyLevel = 'independent';
  } else if (accuracyRate >= 90) {
    fluencyLevel = 'instructional';
  } else {
    fluencyLevel = 'frustration';
  }
  
  return {
    totalMiscues,
    miscuesByType,
    wcpm,
    accuracyRate,
    selfCorrectionRate,
    meaningChangingErrors,
    miscues,
    fluencyLevel,
  };
};

/**
 * Get intervention recommendations based on miscue patterns
 */
export const getMiscueInterventions = (analysis: MiscueAnalysis): string[] => {
  const interventions: string[] = [];
  
  if (analysis.miscuesByType.substitution > 3) {
    interventions.push('Focus on word recognition strategies - use context clues');
  }
  
  if (analysis.miscuesByType.omission > 2) {
    interventions.push('Practice tracking with finger or pointer while reading');
  }
  
  if (analysis.miscuesByType.repetition > 2) {
    interventions.push('Build confidence with repeated readings of familiar texts');
  }
  
  if (analysis.selfCorrectionRate > 30) {
    interventions.push('Great self-monitoring! Continue using fix-up strategies');
  } else if (analysis.selfCorrectionRate < 10 && analysis.totalMiscues > 3) {
    interventions.push('Practice monitoring comprehension - pause and reread when confused');
  }
  
  if (analysis.meaningChangingErrors > 2) {
    interventions.push('Focus on meaning - ask "Does this make sense?"');
  }
  
  if (analysis.fluencyLevel === 'frustration') {
    interventions.push('Consider easier reading material to build confidence');
  }
  
  return interventions;
};
