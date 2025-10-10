/**
 * ML-ENHANCED: Bloom's Taxonomy Annotation Classifier
 * Integrates with Patent #2 (Semantic Clustering) for cognitive depth analysis
 */

import { semanticEmbeddingEngine } from './semanticEmbeddings';

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
 * ML-ENHANCED: Uses semantic similarity for better classification
 */
export async function classifyAnnotationLevelML(annotation: string): Promise<number> {
  const text = annotation.toLowerCase().trim();
  
  if (text.length < 5) return 1;
  
  // Use semantic embeddings to find most similar Bloom level
  if (semanticEmbeddingEngine.isReady()) {
    try {
      // Create reference texts for each Bloom level
      const bloomReferences = [
        "This defines what the concept is",
        "This explains how the idea works",
        "This applies the concept to a new situation",
        "This analyzes why this is important",
        "This evaluates the quality of the argument",
        "This creates a new interpretation"
      ];
      
      const annotationEmbedding = await semanticEmbeddingEngine.generateEmbedding(text);
      const referenceEmbeddings = await semanticEmbeddingEngine.generateEmbeddings(bloomReferences);
      
      let maxSimilarity = -1;
      let bestLevel = 2;
      
      referenceEmbeddings.forEach((refEmbed, idx) => {
        const similarity = semanticEmbeddingEngine.cosineSimilarity(annotationEmbedding, refEmbed);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestLevel = idx + 1;
        }
      });
      
      return bestLevel;
    } catch (error) {
      console.error('ML classification failed, using rule-based:', error);
    }
  }
  
  // Fallback: Rule-based classification
  for (let level = 6; level >= 1; level--) {
    const indicators = BLOOM_INDICATORS[level as keyof typeof BLOOM_INDICATORS];
    for (const indicator of indicators) {
      if (text.includes(indicator)) {
        return level;
      }
    }
  }
  
  return 2;
}

/**
 * Calculates cognitive distribution across all annotations
 * ENHANCED: Uses ML classification when available
 */
export async function calculateCognitiveDistribution(
  annotations: string[]
): Promise<CognitiveDistribution> {
  if (annotations.length === 0) {
    return {
      levels: [],
      avgLevel: 1,
      sophisticationScore: 0,
    };
  }
  
  // Classify each annotation using ML
  const levels = await Promise.all(
    annotations.map(a => classifyAnnotationLevelML(a))
  );
  
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
  
  const level1and2 = levels[0].percentage + levels[1].percentage;
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
