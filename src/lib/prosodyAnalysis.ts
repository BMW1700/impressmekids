/**
 * AURA Real Prosody Analysis System
 * Measures: Phrasing, Expression, Smoothness, Pace
 * Based on NAEP Oral Reading Fluency Scale
 */

export interface ProsodyMetrics {
  phrasing: number;      // 1-4: How well student groups words into meaningful phrases
  expression: number;    // 1-4: Appropriate stress, intonation, and emotion
  smoothness: number;    // 1-4: Lack of pauses, repetitions, sound-outs
  pace: number;          // 1-4: Consistent, conversational speed
  overallScore: number;  // Combined 4-16 scale, converted to 1-100
  level: 'emerging' | 'developing' | 'proficient' | 'advanced';
  feedback: string[];
}

export interface PhraseGroup {
  words: string[];
  startIndex: number;
  endIndex: number;
  pauseAfterMs: number;
  isNaturalBreak: boolean;  // At punctuation or natural phrase boundary
}

/**
 * Natural phrase boundaries based on syntax and punctuation
 */
const isNaturalBreakPoint = (word: string): boolean => {
  // Check for punctuation that typically ends phrases
  return /[.!?,;:]$/.test(word);
};

/**
 * Analyze phrasing from word timings
 * Good readers group 3-5 words between pauses at natural break points
 */
export const analyzePhrasing = (
  wordTimings: Array<{ word: string; startMs: number; endMs: number; index: number }>,
  expectedWords: string[]
): { score: number; phraseGroups: PhraseGroup[] } => {
  if (wordTimings.length < 3) {
    return { score: 1, phraseGroups: [] };
  }
  
  const phraseGroups: PhraseGroup[] = [];
  let currentGroup: { words: string[]; startIndex: number } = { words: [], startIndex: 0 };
  
  // Typical pause threshold for phrase breaks (200ms+)
  const PAUSE_THRESHOLD = 200;
  
  wordTimings.forEach((timing, idx) => {
    const word = timing.word;
    currentGroup.words.push(word);
    
    // Check for pause before next word
    const nextTiming = wordTimings[idx + 1];
    const pauseAfterMs = nextTiming 
      ? nextTiming.startMs - timing.endMs 
      : 0;
    
    // End phrase group on pause or punctuation
    const isNaturalBreak = isNaturalBreakPoint(expectedWords[timing.index] || word);
    const isPauseBreak = pauseAfterMs > PAUSE_THRESHOLD;
    
    if (isNaturalBreak || isPauseBreak || idx === wordTimings.length - 1) {
      phraseGroups.push({
        words: [...currentGroup.words],
        startIndex: currentGroup.startIndex,
        endIndex: timing.index,
        pauseAfterMs,
        isNaturalBreak,
      });
      currentGroup = { words: [], startIndex: timing.index + 1 };
    }
  });
  
  // Score phrasing (1-4)
  // Good: 3-5 words per phrase at natural breaks
  // Poor: 1 word at a time (word-by-word) or ignoring punctuation
  
  const avgPhraseLength = phraseGroups.reduce((sum, g) => sum + g.words.length, 0) / phraseGroups.length;
  const naturalBreakAlignment = phraseGroups.filter(g => g.isNaturalBreak).length / phraseGroups.length;
  
  let score = 1;
  if (avgPhraseLength >= 4 && naturalBreakAlignment > 0.7) {
    score = 4; // Advanced: natural phrasing
  } else if (avgPhraseLength >= 3 && naturalBreakAlignment > 0.5) {
    score = 3; // Proficient: mostly natural
  } else if (avgPhraseLength >= 2) {
    score = 2; // Developing: some phrasing
  }
  
  return { score, phraseGroups };
};

/**
 * Analyze expression from audio features (pitch variation, emphasis)
 */
export const analyzeExpression = (
  pitchData: number[],
  energyData: number[],
  wordTimings: Array<{ word: string; startMs: number; endMs: number }>
): number => {
  if (pitchData.length === 0 || energyData.length === 0) {
    return 2; // Default developing score if no audio data
  }
  
  // Good expression = appropriate pitch variation (not monotone)
  const pitchMean = pitchData.reduce((a, b) => a + b, 0) / pitchData.length;
  const pitchVariance = pitchData.reduce((sum, p) => sum + Math.pow(p - pitchMean, 2), 0) / pitchData.length;
  const pitchStdDev = Math.sqrt(pitchVariance);
  
  // Coefficient of variation for pitch (normalized variation)
  const pitchCV = pitchMean > 0 ? pitchStdDev / pitchMean : 0;
  
  // Good expression also shows energy variation (emphasis)
  const energyMean = energyData.reduce((a, b) => a + b, 0) / energyData.length;
  const energyVariance = energyData.reduce((sum, e) => sum + Math.pow(e - energyMean, 2), 0) / energyData.length;
  const energyCV = energyMean > 0 ? Math.sqrt(energyVariance) / energyMean : 0;
  
  // Score based on variation (monotone = low CV, expressive = moderate CV)
  // Too high = erratic, too low = flat
  let score = 1;
  
  // Optimal pitch CV is 0.1-0.3 for expressive reading
  if (pitchCV >= 0.15 && pitchCV <= 0.35 && energyCV >= 0.1) {
    score = 4; // Expressive with appropriate emphasis
  } else if (pitchCV >= 0.1 && pitchCV <= 0.4) {
    score = 3; // Good variation
  } else if (pitchCV >= 0.05) {
    score = 2; // Some variation but mostly monotone
  }
  
  return score;
};

/**
 * Analyze smoothness from hesitations, repetitions, and self-corrections
 */
export const analyzeSmoothness = (
  miscueCount: number,
  hesitationCount: number,
  totalWords: number,
  pauseDurations: number[]
): number => {
  if (totalWords === 0) return 1;
  
  // Calculate disruptions per 100 words
  const disruptionsRate = ((miscueCount + hesitationCount) / totalWords) * 100;
  
  // Long pauses (>500ms) within sentences are disruptions
  const longPauses = pauseDurations.filter(p => p > 500).length;
  const longPauseRate = (longPauses / Math.max(pauseDurations.length, 1)) * 100;
  
  // Score based on disruption rate
  let score = 1;
  if (disruptionsRate < 3 && longPauseRate < 10) {
    score = 4; // Very smooth, rare disruptions
  } else if (disruptionsRate < 7 && longPauseRate < 20) {
    score = 3; // Mostly smooth
  } else if (disruptionsRate < 15) {
    score = 2; // Some choppiness
  }
  
  return score;
};

/**
 * Analyze pace consistency
 */
export const analyzePace = (
  wpm: number,
  wordTimings: Array<{ word: string; startMs: number; endMs: number }>,
  gradeLevel?: number
): number => {
  // Target WPM by grade level (approximate)
  const targetWPM: Record<number, { min: number; max: number }> = {
    1: { min: 50, max: 90 },
    2: { min: 70, max: 110 },
    3: { min: 85, max: 130 },
    4: { min: 100, max: 150 },
    5: { min: 115, max: 160 },
  };
  
  const grade = gradeLevel || 3;
  const target = targetWPM[grade] || { min: 85, max: 130 };
  
  // Calculate pace consistency (standard deviation of word durations)
  if (wordTimings.length < 3) {
    return wpm >= target.min ? 3 : 2;
  }
  
  const durations = wordTimings.map(t => t.endMs - t.startMs);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const durationVariance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
  const durationCV = avgDuration > 0 ? Math.sqrt(durationVariance) / avgDuration : 0;
  
  // Score based on WPM appropriateness and consistency
  let score = 1;
  
  const inTargetRange = wpm >= target.min && wpm <= target.max;
  const isConsistent = durationCV < 0.5; // Low variation in word durations
  
  if (inTargetRange && isConsistent) {
    score = 4; // Conversational pace, well-paced
  } else if (inTargetRange || (wpm >= target.min * 0.8 && isConsistent)) {
    score = 3; // Mostly appropriate pace
  } else if (wpm >= target.min * 0.6) {
    score = 2; // Slow but progressing
  }
  
  return score;
};

/**
 * Calculate overall prosody score
 */
export const calculateProsodyScore = (
  wordTimings: Array<{ word: string; startMs: number; endMs: number; index: number }>,
  expectedWords: string[],
  wpm: number,
  miscueCount: number,
  hesitationCount: number,
  pitchData: number[] = [],
  energyData: number[] = [],
  gradeLevel?: number
): ProsodyMetrics => {
  const { score: phrasingScore, phraseGroups } = analyzePhrasing(wordTimings, expectedWords);
  const expressionScore = analyzeExpression(pitchData, energyData, wordTimings);
  
  const pauseDurations = phraseGroups.map(g => g.pauseAfterMs);
  const smoothnessScore = analyzeSmoothness(miscueCount, hesitationCount, wordTimings.length, pauseDurations);
  const paceScore = analyzePace(wpm, wordTimings, gradeLevel);
  
  // Total score on 4-16 scale
  const totalScore = phrasingScore + expressionScore + smoothnessScore + paceScore;
  
  // Convert to 0-100 scale
  const overallScore = Math.round(((totalScore - 4) / 12) * 100);
  
  // Determine level
  let level: 'emerging' | 'developing' | 'proficient' | 'advanced';
  if (totalScore >= 14) {
    level = 'advanced';
  } else if (totalScore >= 11) {
    level = 'proficient';
  } else if (totalScore >= 8) {
    level = 'developing';
  } else {
    level = 'emerging';
  }
  
  // Generate feedback
  const feedback: string[] = [];
  
  if (phrasingScore < 3) {
    feedback.push('Try reading in phrases instead of word-by-word. Look for comma and period pauses.');
  }
  if (expressionScore < 3) {
    feedback.push('Add expression! Try changing your voice for different characters or emotions.');
  }
  if (smoothnessScore < 3) {
    feedback.push('Practice the passage again to read more smoothly with fewer stops.');
  }
  if (paceScore < 3) {
    feedback.push('Work on reading at a comfortable, steady pace - not too fast or slow.');
  }
  
  if (level === 'advanced' || level === 'proficient') {
    feedback.push('Great fluency! Your reading sounds natural and expressive.');
  }
  
  return {
    phrasing: phrasingScore,
    expression: expressionScore,
    smoothness: smoothnessScore,
    pace: paceScore,
    overallScore,
    level,
    feedback,
  };
};
