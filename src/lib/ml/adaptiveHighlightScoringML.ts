/**
 * ML-ENHANCED: Adaptive Highlight Quality Scoring (AHQS)
 * Integrates with Patent #2 (Semantic Clustering) for context-aware grading
 */

import { semanticEmbeddingEngine, semanticClusterer } from './semanticEmbeddings';

export interface PassageComplexity {
  fleschKincaidGrade: number;
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
 * Calculate passage complexity using readability metrics
 */
export function calculatePassageComplexity(passageText: string): PassageComplexity {
  const sentences = passageText.split(/[.!?]+/).filter(s => s.trim());
  const words = passageText.split(/\s+/).filter(w => w.trim());
  const syllables = words.reduce((sum, word) => sum + estimateSyllables(word), 0);
  
  const avgSentenceLength = words.length / Math.max(sentences.length, 1);
  const avgSyllablesPerWord = syllables / Math.max(words.length, 1);
  const avgWordLength = passageText.replace(/\s/g, '').length / Math.max(words.length, 1);
  
  // Flesch-Kincaid Grade Level
  const fleschKincaidGrade = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
  
  // Normalize to 0-100 complexity score
  const complexityScore = Math.min(100, Math.max(0, (fleschKincaidGrade / 18) * 100));
  
  return {
    fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    complexityScore: Math.round(complexityScore)
  };
}

function estimateSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  const vowels = word.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 1;
  
  if (word.endsWith('e')) count--;
  if (word.endsWith('le') && word.length > 2) count++;
  
  return Math.max(1, count);
}

/**
 * ML-ENHANCED: Score highlight coverage with semantic clustering
 */
export async function scoreOptimalCoverageML(
  highlights: Array<{ highlighted_text: string; annotation: string }>,
  passageWordCount: number,
  totalHighlightedWords: number
): Promise<number> {
  const highlightRatio = totalHighlightedWords / passageWordCount;
  
  // Optimal ratio: 15-30% of passage
  let coverageScore = 0;
  if (highlightRatio < 0.15) {
    coverageScore = (highlightRatio / 0.15) * 70; // Penalize under-highlighting
  } else if (highlightRatio <= 0.30) {
    coverageScore = 70 + ((highlightRatio - 0.15) / 0.15) * 30;
  } else {
    coverageScore = 100 - Math.min(40, (highlightRatio - 0.30) * 100);
  }
  
  // PATENT #2 INTEGRATION: Semantic diversity bonus
  if (semanticEmbeddingEngine.isReady() && highlights.length >= 3) {
    try {
      const texts = highlights.map(h => h.highlighted_text);
      const vectors = (await semanticEmbeddingEngine.generateEmbeddings(texts)).map((embedding, i) => ({
        text: texts[i],
        embedding
      }));
      
      const clusters = await semanticClusterer.cluster(vectors);
      const diversityBonus = Math.min(15, clusters.length * 3); // +3 points per semantic cluster
      coverageScore = Math.min(100, coverageScore + diversityBonus);
    } catch (error) {
      console.error('Semantic diversity calculation failed:', error);
    }
  }
  
  return Math.round(coverageScore);
}

/**
 * Analyze annotation quality relative to highlight length
 */
export function analyzeAnnotationQuality(
  highlights: Array<{ highlighted_text: string; annotation: string }>
): number {
  if (highlights.length === 0) return 0;
  
  const scores = highlights.map(h => {
    const annotation = h.annotation || '';
    const highlightLength = h.highlighted_text.split(/\s+/).length;
    const annotationLength = annotation.split(/\s+/).length;
    
    if (annotationLength === 0) return 0;
    if (annotationLength < 3) return 30;
    
    // Optimal: annotation is 30-150% of highlight length
    const ratio = annotationLength / highlightLength;
    if (ratio < 0.3) return 40 + (ratio / 0.3) * 20;
    if (ratio <= 1.5) return 60 + ((ratio - 0.3) / 1.2) * 40;
    return Math.max(60, 100 - (ratio - 1.5) * 20);
  });
  
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

/**
 * Analyze strategic color usage
 */
export function analyzeColorStrategy(
  highlights: Array<{ color: string; annotation: string }>
): number {
  if (highlights.length === 0) return 0;
  
  const colorGroups = new Map<string, number>();
  highlights.forEach(h => {
    colorGroups.set(h.color, (colorGroups.get(h.color) || 0) + 1);
  });
  
  const uniqueColors = colorGroups.size;
  const highlightCount = highlights.length;
  
  // Optimal: 2-4 colors for organization
  if (uniqueColors === 1) return 50; // All one color
  if (uniqueColors <= 4) return 85 + (4 - uniqueColors) * 5;
  return Math.max(60, 90 - (uniqueColors - 4) * 5); // Too many colors
}

/**
 * ML-ENHANCED: Calculate adaptive score with complexity adjustment
 */
export async function calculateAdaptiveScore(
  currentWork: {
    highlights: Array<{ highlighted_text: string; annotation: string; color: string }>;
    passageText: string;
  },
  passageComplexity: PassageComplexity,
  studentBaseline?: number
): Promise<AdaptiveScore> {
  const { highlights, passageText } = currentWork;
  
  const passageWordCount = passageText.split(/\s+/).length;
  const totalHighlightedWords = highlights.reduce((sum, h) => 
    sum + h.highlighted_text.split(/\s+/).length, 0
  );
  
  // Calculate component scores
  const coverageScore = await scoreOptimalCoverageML(highlights, passageWordCount, totalHighlightedWords);
  const annotationScore = analyzeAnnotationQuality(highlights);
  const colorScore = analyzeColorStrategy(highlights);
  
  // Weighted average
  const rawScore = (
    coverageScore * 0.40 +
    annotationScore * 0.45 +
    colorScore * 0.15
  );
  
  // Adjust for passage complexity (harder passages = more leniency)
  const complexityMultiplier = 1 + (passageComplexity.complexityScore / 200);
  const adjustedScore = Math.min(100, rawScore * complexityMultiplier);
  
  // Calculate growth factor
  const growthFactor = studentBaseline 
    ? Math.round(((adjustedScore - studentBaseline) / studentBaseline) * 100)
    : 0;
  
  const explanation = generateScoreExplanation(
    coverageScore,
    annotationScore,
    colorScore,
    passageComplexity,
    growthFactor
  );
  
  return {
    rawScore: Math.round(rawScore),
    adjustedScore: Math.round(adjustedScore),
    growthFactor,
    explanation
  };
}

function generateScoreExplanation(
  coverage: number,
  annotation: number,
  color: number,
  complexity: PassageComplexity,
  growth: number
): string {
  const parts: string[] = [];
  
  if (coverage >= 85) parts.push("Excellent coverage");
  else if (coverage >= 70) parts.push("Good coverage");
  else parts.push("Could highlight more key points");
  
  if (annotation >= 85) parts.push("thoughtful annotations");
  else if (annotation >= 70) parts.push("solid annotations");
  else parts.push("brief annotations");
  
  if (color >= 80) parts.push("strategic color use");
  
  const difficultyNote = complexity.complexityScore > 70 
    ? " (challenging passage bonus applied)"
    : complexity.complexityScore < 40
    ? " (easier passage)"
    : "";
  
  const growthNote = growth > 10
    ? ` +${growth}% improvement!`
    : growth < -10
    ? ` ${growth}% decline`
    : "";
  
  return parts.join(", ") + difficultyNote + growthNote;
}
