/**
 * PATENTABLE: Adaptive Highlight Quality Scoring (AHQS)
 * Context-aware, student-specific grading algorithm
 */

export interface PassageComplexity {
  fleschKincaid: number; // Grade level
  avgSentenceLength: number;
  avgWordLength: number;
  complexityScore: number; // 0-100
}

export interface AdaptiveScore {
  rawScore: number;
  adjustedScore: number;
  growthFactor: number;
  explanation: string;
}

/**
 * Calculates passage complexity using Flesch-Kincaid and other metrics
 */
export function calculatePassageComplexity(passageText: string): PassageComplexity {
  const sentences = passageText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = passageText.split(/\s+/).filter(w => w.trim().length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  const avgSentenceLength = words.length / (sentences.length || 1);
  const avgWordLength = passageText.length / (words.length || 1);
  const avgSyllablesPerWord = syllables / (words.length || 1);
  
  // Flesch-Kincaid Grade Level formula
  const fleschKincaid = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
  
  // Complexity score (0-100)
  const complexityScore = Math.min(100, Math.max(0, 
    (fleschKincaid * 8) + (avgSentenceLength * 2) + (avgWordLength * 5)
  ));
  
  return {
    fleschKincaid: Math.round(fleschKincaid * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    complexityScore: Math.round(complexityScore),
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

/**
 * Calculates optimal coverage - not too much, not too little
 */
export function scoreOptimalCoverage(
  highlightCount: number,
  passageWordCount: number,
  totalHighlightedWords: number
): number {
  const coverageRatio = totalHighlightedWords / passageWordCount;
  const highlightDensity = highlightCount / (passageWordCount / 100); // Highlights per 100 words
  
  // Optimal: 20-40% of passage highlighted, 3-8 highlights per 100 words
  const optimalCoverage = 0.30;
  const optimalDensity = 5;
  
  const coverageDeviation = Math.abs(coverageRatio - optimalCoverage);
  const densityDeviation = Math.abs(highlightDensity - optimalDensity);
  
  // Goldilocks scoring: penalize too much or too little
  const coverageScore = Math.max(0, 100 - (coverageDeviation * 200));
  const densityScore = Math.max(0, 100 - (densityDeviation * 15));
  
  return Math.round((coverageScore * 0.6) + (densityScore * 0.4));
}

/**
 * Analyzes annotation-to-highlight ratio and quality
 */
export function analyzeAnnotationQuality(
  highlights: Array<{ 
    highlighted_text: string; 
    annotation: string;
  }>
): number {
  if (highlights.length === 0) return 0;
  
  let score = 0;
  
  highlights.forEach(h => {
    const highlightLength = h.highlighted_text.split(/\s+/).length;
    const annotationLength = (h.annotation || '').split(/\s+/).length;
    
    // Score based on annotation depth
    if (annotationLength === 0) {
      score += 0; // No annotation = no points
    } else if (annotationLength < 3) {
      score += 30; // Too brief
    } else if (annotationLength <= 15) {
      score += 100; // Good depth
    } else {
      score += 70; // Might be copying, not summarizing
    }
    
    // Bonus for short highlight + deep annotation (indicates critical thinking)
    if (highlightLength < 10 && annotationLength > 5) {
      score += 20; // Selective highlighting + deep thought
    }
    
    // Penalty for long highlight + short annotation (copy-paste behavior)
    if (highlightLength > 20 && annotationLength < 5) {
      score -= 20;
    }
  });
  
  return Math.min(100, Math.max(0, Math.round(score / highlights.length)));
}

/**
 * Analyzes color strategy - consistent system vs random
 */
export function analyzeColorStrategy(
  highlights: Array<{ color: string; annotation: string }>
): number {
  if (highlights.length < 3) return 50; // Too few to determine strategy
  
  const colorUsage: Record<string, number> = {};
  
  highlights.forEach(h => {
    colorUsage[h.color] = (colorUsage[h.color] || 0) + 1;
  });
  
  const uniqueColors = Object.keys(colorUsage).length;
  
  // Check if colors are used strategically
  // Good: 2-4 colors, each used multiple times
  // Bad: All same color OR every highlight different color
  
  if (uniqueColors === 1) {
    return 60; // No organization
  } else if (uniqueColors >= 2 && uniqueColors <= 4) {
    // Check if colors are used consistently (multiple times each)
    const avgUsage = highlights.length / uniqueColors;
    if (avgUsage >= 2) {
      return 100; // Excellent color system
    }
    return 80; // Good variety
  } else {
    return 40; // Too many colors = likely random
  }
}

/**
 * Main adaptive scoring function with growth tracking
 */
export function calculateAdaptiveScore(
  currentWork: {
    highlightCount: number;
    avgAnnotationLength: number;
    totalHighlightedWords: number;
    highlights: Array<{ highlighted_text: string; annotation: string; color: string }>;
  },
  passageComplexity: PassageComplexity,
  studentBaseline?: number // Previous average score
): AdaptiveScore {
  const passageWordCount = currentWork.totalHighlightedWords * 3; // Estimate
  
  // Calculate component scores
  const coverageScore = scoreOptimalCoverage(
    currentWork.highlightCount,
    passageWordCount,
    currentWork.totalHighlightedWords
  );
  
  const annotationScore = analyzeAnnotationQuality(currentWork.highlights);
  const colorScore = analyzeColorStrategy(currentWork.highlights);
  
  // Raw score (before adjustments)
  const rawScore = Math.round(
    (coverageScore * 0.3) +
    (annotationScore * 0.5) +
    (colorScore * 0.2)
  );
  
  // Adjust for passage complexity
  const complexityAdjustment = passageComplexity.complexityScore / 100;
  const bonusPoints = Math.round(rawScore * complexityAdjustment * 0.1); // Up to 10% bonus for hard passages
  
  // Calculate growth factor if baseline exists
  let growthFactor = 0;
  if (studentBaseline) {
    growthFactor = ((rawScore - studentBaseline) / studentBaseline) * 100;
  }
  
  const adjustedScore = Math.min(100, rawScore + bonusPoints);
  
  const explanation = generateScoringExplanation({
    rawScore,
    adjustedScore,
    coverageScore,
    annotationScore,
    colorScore,
    complexityAdjustment,
    growthFactor,
  });
  
  return {
    rawScore,
    adjustedScore,
    growthFactor,
    explanation,
  };
}

function generateScoringExplanation(data: {
  rawScore: number;
  adjustedScore: number;
  coverageScore: number;
  annotationScore: number;
  colorScore: number;
  complexityAdjustment: number;
  growthFactor: number;
}): string {
  const parts: string[] = [];
  
  parts.push(`Base score: ${data.rawScore}/100`);
  
  if (data.complexityAdjustment > 0.7) {
    parts.push(`Bonus for challenging passage: +${data.adjustedScore - data.rawScore} points`);
  }
  
  if (data.coverageScore < 60) {
    parts.push(`Coverage: Adjust highlight quantity (current: ${data.coverageScore}/100)`);
  }
  
  if (data.annotationScore < 60) {
    parts.push(`Annotations: Add more depth and analysis (current: ${data.annotationScore}/100)`);
  }
  
  if (data.colorScore < 60) {
    parts.push(`Colors: Develop a consistent color-coding strategy (current: ${data.colorScore}/100)`);
  }
  
  if (data.growthFactor > 10) {
    parts.push(`📈 Great progress! ${Math.round(data.growthFactor)}% improvement from your average`);
  } else if (data.growthFactor < -10) {
    parts.push(`📉 Below your usual work. Review your strategy.`);
  }
  
  return parts.join(' | ');
}
