/**
 * Contextual Difficulty Scaling Algorithm
 * Dynamically adjusts exercise difficulty based on student performance
 */

export interface PerformanceMetrics {
  recentGrades: number[];           // Last 5-10 practice grades
  completionRate: number;           // % of exercises completed
  averageTime: number;              // Avg time to complete (seconds)
  consistency: number;              // Standard deviation of grades
  weeklyImprovement: number;        // Week-over-week grade delta
}

export interface DifficultyLevel {
  level: number;                    // 1-5
  label: string;                    // Human-readable
  description: string;              // What this level means
  requirements: string[];           // Skills needed
  color: string;                    // UI color theme
}

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    level: 1,
    label: 'Beginner',
    description: 'Building foundational pronunciation skills',
    requirements: ['Basic phoneme recognition', 'Simple word practice'],
    color: 'green',
  },
  {
    level: 2,
    label: 'Elementary',
    description: 'Developing consistent articulation',
    requirements: ['Clear pronunciation', 'Short phrases', 'Basic fluency'],
    color: 'blue',
  },
  {
    level: 3,
    label: 'Intermediate',
    description: 'Mastering complex sounds and patterns',
    requirements: ['Multi-syllable words', 'Tongue twisters', 'Moderate pace'],
    color: 'purple',
  },
  {
    level: 4,
    label: 'Advanced',
    description: 'Refining prosody and advanced articulation',
    requirements: ['Fast-paced speech', 'Complex phonemes', 'Natural intonation'],
    color: 'orange',
  },
  {
    level: 5,
    label: 'Expert',
    description: 'Near-native pronunciation mastery',
    requirements: ['Rapid articulation', 'Minimal errors', 'Nuanced expression'],
    color: 'red',
  },
];

/**
 * Calculate optimal difficulty level based on performance
 */
export const calculateDifficultyLevel = (metrics: PerformanceMetrics, currentLevel: number): {
  newLevel: number;
  reasoning: string;
  confidence: number;
} => {
  const { recentGrades, completionRate, consistency, weeklyImprovement } = metrics;

  if (recentGrades.length === 0) {
    return {
      newLevel: 1,
      reasoning: 'Starting at beginner level',
      confidence: 1.0,
    };
  }

  const avgGrade = recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length;
  const recentTrend = recentGrades.length >= 3
    ? recentGrades[0] - recentGrades[recentGrades.length - 1]
    : 0;

  let recommendedLevel = currentLevel;
  let reasoning = '';
  let confidence = 0.5;

  // RULE 1: High performance + high completion = increase difficulty
  if (avgGrade >= 85 && completionRate >= 80 && consistency < 10) {
    recommendedLevel = Math.min(5, currentLevel + 1);
    reasoning = `Excellent performance (${Math.round(avgGrade)}/100). Ready for harder challenges!`;
    confidence = 0.9;
  }
  // RULE 2: Very low performance = decrease difficulty
  else if (avgGrade < 60 && consistency > 15) {
    recommendedLevel = Math.max(1, currentLevel - 1);
    reasoning = `Performance struggling (${Math.round(avgGrade)}/100). Lowering difficulty to build confidence.`;
    confidence = 0.85;
  }
  // RULE 3: Improving trend = stay or increase slightly
  else if (recentTrend > 10 && avgGrade >= 75) {
    recommendedLevel = Math.min(5, currentLevel + 1);
    reasoning = `Strong improvement trend (+${Math.round(recentTrend)} points). Advancing difficulty.`;
    confidence = 0.75;
  }
  // RULE 4: Declining trend = maintain or decrease
  else if (recentTrend < -10 && avgGrade < 70) {
    recommendedLevel = Math.max(1, currentLevel - 1);
    reasoning = `Performance declining (${Math.round(recentTrend)} points). Consolidating skills.`;
    confidence = 0.8;
  }
  // RULE 5: Consistent moderate performance = maintain
  else if (avgGrade >= 70 && avgGrade < 85 && consistency < 12) {
    recommendedLevel = currentLevel;
    reasoning = `Consistent performance (${Math.round(avgGrade)}/100). Maintaining current difficulty.`;
    confidence = 0.7;
  }
  // RULE 6: Low completion rate = decrease (student disengaged)
  else if (completionRate < 50) {
    recommendedLevel = Math.max(1, currentLevel - 1);
    reasoning = `Low completion rate (${Math.round(completionRate)}%). Reducing difficulty to re-engage.`;
    confidence = 0.65;
  }
  // DEFAULT: Maintain current level
  else {
    recommendedLevel = currentLevel;
    reasoning = `Performance stable (${Math.round(avgGrade)}/100). Continuing at current level.`;
    confidence = 0.6;
  }

  // Apply weekly improvement bonus
  if (weeklyImprovement > 15 && recommendedLevel === currentLevel) {
    recommendedLevel = Math.min(5, recommendedLevel + 1);
    reasoning += ` Bonus: Strong weekly growth (+${Math.round(weeklyImprovement)}%).`;
    confidence = Math.min(1.0, confidence + 0.1);
  }

  return {
    newLevel: recommendedLevel,
    reasoning,
    confidence,
  };
};

/**
 * Get difficulty parameters for AI generation
 */
export const getDifficultyParameters = (level: number): {
  complexity: string;
  vocabulary: string;
  length: string;
  pacing: string;
} => {
  const params = {
    1: {
      complexity: 'very simple, single-syllable words',
      vocabulary: 'basic, common words (cat, dog, run)',
      length: 'short (3-5 words per exercise)',
      pacing: 'slow and deliberate',
    },
    2: {
      complexity: 'simple phrases with 1-2 syllable words',
      vocabulary: 'everyday vocabulary',
      length: 'medium (5-8 words per exercise)',
      pacing: 'moderate, clear articulation',
    },
    3: {
      complexity: 'multi-syllable words and compound phrases',
      vocabulary: 'grade-level appropriate with some challenging words',
      length: 'medium-long (8-12 words per exercise)',
      pacing: 'natural conversational speed',
    },
    4: {
      complexity: 'complex sentences with advanced phoneme clusters',
      vocabulary: 'academic and sophisticated vocabulary',
      length: 'long (12-15 words per exercise)',
      pacing: 'faster, natural speech patterns',
    },
    5: {
      complexity: 'intricate tongue twisters and rapid-fire sequences',
      vocabulary: 'advanced, nuanced, and idiomatic',
      length: 'very long (15+ words per exercise)',
      pacing: 'rapid articulation with prosodic variation',
    },
  };

  return params[level as keyof typeof params] || params[3];
};

/**
 * Calculate performance trend from recent records
 */
export const calculatePerformanceTrend = (recentGrades: number[]): number => {
  if (recentGrades.length < 2) return 0;

  // Simple linear regression slope
  const n = recentGrades.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = recentGrades.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * recentGrades[i], 0);
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  return slope; // Positive = improving, Negative = declining
};