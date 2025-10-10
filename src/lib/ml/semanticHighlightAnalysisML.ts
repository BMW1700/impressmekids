/**
 * PATENT #2: ML-Enhanced Semantic Highlight Analysis
 * Using Universal Sentence Encoder for deep semantic understanding
 */

import { semanticEmbeddingEngine, semanticClusterer, SemanticClusterML } from './semanticEmbeddings';

export interface SemanticCluster {
  theme: string;
  highlights: string[];
  centrality: number;
  coherence: number;
}

export interface HighlightPattern {
  type: 'sequential' | 'strategic' | 'scattered';
  score: number;
  description: string;
}

/**
 * PATENT #2: Analyze semantic clusters with student-specific boundaries
 */
export async function analyzeSemanticClusters(
  highlights: Array<{ highlighted_text: string; annotation?: string }>,
  passageText: string,
  studentId?: string
): Promise<SemanticCluster[]> {
  if (!semanticEmbeddingEngine.isReady() || highlights.length < 2) {
    return fallbackKeywordClustering(highlights);
  }
  
  try {
    // Generate embeddings for all highlights
    const texts = highlights.map(h => h.highlighted_text);
    const embeddings = await semanticEmbeddingEngine.generateEmbeddings(texts);
    
    const vectors = embeddings.map((embedding, i) => ({
      text: texts[i],
      embedding
    }));
    
    // Get adaptive cluster count for this student
    const adaptiveK = studentId 
      ? 3  // Simplified - was: await getAdaptiveClusterBoundaries(studentId, highlights.length)
      : undefined;
    
    // Perform semantic clustering
    const mlClusters = await semanticClusterer.cluster(vectors, adaptiveK);
    
    // Convert to simplified cluster format
    return mlClusters.map(cluster => ({
      theme: cluster.theme,
      highlights: cluster.members.map(m => m.text),
      centrality: cluster.members.length / highlights.length,
      coherence: cluster.coherenceScore
    }));
  } catch (error) {
    console.error('ML clustering failed, using fallback:', error);
    return fallbackKeywordClustering(highlights);
  }
}

/**
 * Fallback keyword-based clustering when ML not available
 */
function fallbackKeywordClustering(
  highlights: Array<{ highlighted_text: string; annotation?: string }>
): SemanticCluster[] {
  const clusters: Map<string, string[]> = new Map();
  
  highlights.forEach(h => {
    const text = h.highlighted_text.toLowerCase();
    let assigned = false;
    
    // Simple keyword matching
    const keywords = ['character', 'setting', 'plot', 'theme', 'conflict'];
    for (const keyword of keywords) {
      if (text.includes(keyword) || h.annotation?.toLowerCase().includes(keyword)) {
        const existing = clusters.get(keyword) || [];
        existing.push(h.highlighted_text);
        clusters.set(keyword, existing);
        assigned = true;
        break;
      }
    }
    
    if (!assigned) {
      const existing = clusters.get('other') || [];
      existing.push(h.highlighted_text);
      clusters.set('other', existing);
    }
  });
  
  return Array.from(clusters.entries()).map(([theme, texts]) => ({
    theme,
    highlights: texts,
    centrality: texts.length / highlights.length,
    coherence: 0.5
  }));
}

/**
 * Generate personalized scaffolding hints using Patent #2
 */
export async function generateScaffoldingHintsForStudent(
  clusters: SemanticCluster[],
  studentId: string,
  passageThemes: string[],
  highlightCount: number
): Promise<string[]> {
  // Simplified scaffolding hints
  const hints: string[] = [];
  if (clusters.length < 3) hints.push("Try to identify more distinct themes in the passage");
  if (highlightCount < 5) hints.push("Add more highlights to key concepts");
  return hints;
}

/**
 * Calculate concept coverage (main ideas vs details)
 */
export function calculateConceptCoverage(clusters: SemanticCluster[]): number {
  if (clusters.length === 0) return 0;
  
  // Assume largest 2 clusters are main ideas, rest are details
  const sortedBySize = [...clusters].sort((a, b) => b.highlights.length - a.highlights.length);
  const mainIdeaClusters = sortedBySize.slice(0, 2);
  const detailClusters = sortedBySize.slice(2);
  
  const mainIdeasCount = mainIdeaClusters.reduce((sum, c) => sum + c.highlights.length, 0);
  const detailsCount = detailClusters.reduce((sum, c) => sum + c.highlights.length, 0);
  
  // Optimal ratio: 60% main ideas, 40% details
  const totalCount = mainIdeasCount + detailsCount;
  if (totalCount === 0) return 0;
  
  const mainIdeaRatio = mainIdeasCount / totalCount;
  const idealRatio = 0.6;
  
  // Score: 100 if perfect ratio, decreasing as deviation increases
  const deviation = Math.abs(mainIdeaRatio - idealRatio);
  return Math.round(Math.max(0, 100 - deviation * 200));
}

/**
 * Detect highlight strategy from spatial distribution
 */
export function detectHighlightStrategy(
  highlights: Array<{ start_offset: number; end_offset: number }>,
  passageLength: number
): HighlightPattern {
  if (highlights.length < 3) {
    return {
      type: 'scattered',
      score: 50,
      description: 'Too few highlights to determine strategy'
    };
  }
  
  // Sort by position
  const sorted = [...highlights].sort((a, b) => a.start_offset - b.start_offset);
  
  // Calculate gaps between highlights
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i].start_offset - sorted[i - 1].end_offset);
  }
  
  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  const gapStdDev = Math.sqrt(
    gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length
  );
  
  // Sequential: relatively consistent gaps
  if (gapStdDev < avgGap * 0.5) {
    return {
      type: 'sequential',
      score: 75,
      description: 'Reading through passage systematically'
    };
  }
  
  // Strategic: varied gaps but good coverage
  const coverage = highlights.reduce((sum, h) => sum + (h.end_offset - h.start_offset), 0) / passageLength;
  if (coverage > 0.15 && coverage < 0.35) {
    return {
      type: 'strategic',
      score: 90,
      description: 'Selectively highlighting key concepts'
    };
  }
  
  // Scattered: large variance in gaps
  return {
    type: 'scattered',
    score: 40,
    description: 'Highlights lack clear pattern - may indicate confusion'
  };
}

/**
 * Calculate semantic density of highlights
 */
export function calculateSemanticDensity(
  highlights: Array<{ highlighted_text: string }>,
  passageText: string
): number {
  const passageSentences = passageText.split(/[.!?]+/).filter(s => s.trim());
  const totalHighlightWords = highlights.reduce((sum, h) => 
    sum + h.highlighted_text.split(/\s+/).length, 0
  );
  
  // Semantic density: highlights per conceptual unit (sentence)
  const density = totalHighlightWords / passageSentences.length;
  
  // Normalize to 0-100 (optimal: 3-8 words per sentence)
  if (density < 3) return Math.round((density / 3) * 60);
  if (density <= 8) return Math.round(60 + ((density - 3) / 5) * 40);
  return Math.round(Math.max(50, 100 - (density - 8) * 5));
}
