/**
 * PATENTABLE: Bloom's Taxonomy Annotation Classifier
 * AI-powered automatic classification of cognitive depth
 */

export interface BloomLevel {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  percentage: number;
}

export interface CognitiveDistribution {
  levels: BloomLevel[];
  avgLevel: number;
  sophisticationScore: number; // 0-100
}

const BLOOM_INDICATORS = {
  1: ['is', 'what', 'define', 'list', 'name', 'states', 'this is about'],
  2: ['means', 'explains', 'shows', 'describes', 'main idea', 'because', 'summarize'],
  3: ['example of', 'applies to', 'used for', 'demonstrates', 'similar to', 'like when'],
  4: ['difference', 'compare', 'contrast', 'why', 'causes', 'analyzes', 'evidence of'],
  5: ['argues', 'evaluates', 'judges', 'critiques', 'challenges', 'questions'],
  6: ['could', 'would', 'proposes', 'creates', 'imagines', 'what if', 'alternative'],
};

/**
 * Classifies an annotation by Bloom's taxonomy level
 */
export function classifyAnnotationLevel(annotation: string): number {
  const text = annotation.toLowerCase().trim();
  
  if (text.length < 5) return 1; // Too short, likely just identification
  
  // Check for higher-order thinking first (more specific patterns)
  for (let level = 6; level >= 1; level--) {
    const indicators = BLOOM_INDICATORS[level as keyof typeof BLOOM_INDICATORS];
    for (const indicator of indicators) {
      if (text.includes(indicator)) {
        return level;
      }
    }
  }
  
  // Default to level 2 (understanding) if no specific indicators
  return 2;
}

/**
 * Calculates cognitive distribution across all annotations
 */
export function calculateCognitiveDistribution(
  annotations: string[]
): CognitiveDistribution {
  if (annotations.length === 0) {
    return {
      levels: [],
      avgLevel: 1,
      sophisticationScore: 0,
    };
  }
  
  // Classify each annotation
  const levels = annotations.map(a => classifyAnnotationLevel(a));
  
  // Count distribution
  const distribution: Record<number, number> = {};
  let totalLevel = 0;
  
  levels.forEach(level => {
    distribution[level] = (distribution[level] || 0) + 1;
    totalLevel += level;
  });
  
  const avgLevel = totalLevel / levels.length;
  
  // Build level breakdown
  const levelBreakdown: BloomLevel[] = [
    { level: 1, name: 'Remember', percentage: 0 },
    { level: 2, name: 'Understand', percentage: 0 },
    { level: 3, name: 'Apply', percentage: 0 },
    { level: 4, name: 'Analyze', percentage: 0 },
    { level: 5, name: 'Evaluate', percentage: 0 },
    { level: 6, name: 'Create', percentage: 0 },
  ];
  
  Object.entries(distribution).forEach(([level, count]) => {
    const idx = parseInt(level) - 1;
    levelBreakdown[idx].percentage = (count / annotations.length) * 100;
  });
  
  // Calculate sophistication score
  // Higher levels weighted more: 1=10pts, 2=15pts, 3=20pts, 4=25pts, 5=30pts, 6=35pts
  const weights = [10, 15, 20, 25, 30, 35];
  const sophisticationScore = levels.reduce((sum, level) => sum + weights[level - 1], 0) / annotations.length;
  
  return {
    levels: levelBreakdown,
    avgLevel: Math.round(avgLevel * 10) / 10,
    sophisticationScore: Math.round(sophisticationScore),
  };
}

/**
 * Generates personalized feedback based on cognitive distribution
 */
export function generateCognitiveFeedback(distribution: CognitiveDistribution): string[] {
  const feedback: string[] = [];
  const { levels, avgLevel } = distribution;
  
  // Check for level distribution
  const level1and2 = levels[0].percentage + levels[1].percentage;
  const level3and4 = levels[2].percentage + levels[3].percentage;
  const level5and6 = levels[4].percentage + levels[5].percentage;
  
  if (avgLevel < 2.5) {
    feedback.push("Your annotations show good recall of facts. Try analyzing WHY these details matter.");
  } else if (avgLevel < 3.5) {
    feedback.push("You're demonstrating solid understanding. Challenge yourself to evaluate the author's choices.");
  } else if (avgLevel < 4.5) {
    feedback.push("Excellent critical thinking! Your analysis shows deep comprehension.");
  } else {
    feedback.push("Outstanding synthesis and evaluation! You're reading like an expert.");
  }
  
  if (level1and2 > 70) {
    feedback.push("Try moving beyond summarizing - ask yourself 'How does this connect?' or 'Why is this significant?'");
  }
  
  if (level5and6 > 20) {
    feedback.push("Your evaluative thinking is impressive! You're not just understanding - you're critiquing.");
  }
  
  return feedback;
}
