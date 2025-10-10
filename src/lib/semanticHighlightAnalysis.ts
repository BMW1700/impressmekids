/**
 * PATENT #2: Adaptive Semantic Clustering with ML Embeddings
 * Novel method for analyzing highlight patterns using:
 * - Semantic embeddings (vs keyword matching)
 * - Student-specific cluster boundaries (vs fixed thresholds)
 * - Adaptive scaffolding hints (vs generic feedback)
 */

import { 
  semanticEmbeddingEngine, 
  semanticClusterer,
  type SemanticVector,
  type SemanticClusterML 
} from './ml/semanticEmbeddings';
import { adaptiveClusterBoundaryManager } from './ml/adaptiveClusterBoundaries';
import { scaffoldingHintGenerator, type ScaffoldingPlan } from './ml/scaffoldingHints';

export interface SemanticCluster {
  theme: string;
  highlights: Array<{
    text: string;
    annotation: string;
  }>;
  centrality: number; // How central is this theme (0-1)
  coherenceScore?: number;  // ML-based coherence (0-1)
}

export interface HighlightPattern {
  type: 'sequential' | 'strategic' | 'scattered';
  score: number; // Quality score (0-100)
  description: string;
}

/**
 * Groups highlights by semantic themes using ML embeddings
 * Falls back to keyword extraction if ML model not ready
 * 
 * PATENTABLE: Uses student-specific clustering parameters
 */
export async function analyzeSemanticClusters(
  highlights: Array<{ highlighted_text: string; annotation: string }>,
  passageText: string,
  studentId?: string  // For adaptive boundaries
): Promise<SemanticCluster[]> {
  // Try ML-based clustering if model is ready
  if (semanticEmbeddingEngine.isReady() && studentId) {
    try {
      return await analyzeSemanticClustersML(highlights, passageText, studentId);
    } catch (error) {
      console.warn('ML clustering failed, falling back to keyword-based:', error);
    }
  }
  
  // Fallback: keyword-based clustering
  return analyzeSemanticClustersKeyword(highlights, passageText);
}

/**
 * ML-based semantic clustering (NEW - PATENTABLE)
 */
async function analyzeSemanticClustersML(
  highlights: Array<{ highlighted_text: string; annotation: string }>,
  passageText: string,
  studentId: string
): Promise<SemanticCluster[]> {
  if (highlights.length === 0) return [];
  
  // Generate embeddings for each highlight
  const vectors: SemanticVector[] = [];
  
  for (const highlight of highlights) {
    const text = highlight.annotation || highlight.highlighted_text;
    const embedding = await semanticEmbeddingEngine.generateEmbedding(text);
    
    vectors.push({
      text,
      embedding,
    });
  }
  
  // Get student-specific optimal K
  const adaptiveK = await adaptiveClusterBoundaryManager.getRecommendedK(
    studentId,
    highlights.length
  );
  
  // Perform clustering with adaptive boundaries
  const mlClusters = await semanticClusterer.cluster(vectors, adaptiveK);
  
  // Convert to legacy format for compatibility
  const legacyClusters: SemanticCluster[] = mlClusters.map(cluster => ({
    theme: cluster.theme,
    highlights: cluster.members.map(m => ({
      text: m.text,
      annotation: m.text
    })),
    centrality: cluster.members.length / highlights.length,
    coherenceScore: cluster.coherenceScore
  }));
  
  // Update student profile with clustering results
  await adaptiveClusterBoundaryManager.updateProfile(
    studentId,
    mlClusters
  );
  
  console.log(`🧠 ML clustering: ${mlClusters.length} clusters (adaptive K=${adaptiveK})`);
  
  return legacyClusters.sort((a, b) => b.centrality - a.centrality);
}

/**
 * Keyword-based semantic clustering (FALLBACK - original implementation)
 */
function analyzeSemanticClustersKeyword(
  highlights: Array<{ highlighted_text: string; annotation: string }>,
  passageText: string
): SemanticCluster[] {
  // Extract key themes from annotations
  const themes: Map<string, SemanticCluster> = new Map();
  
  highlights.forEach((h) => {
    const annotation = h.annotation?.toLowerCase() || '';
    const text = h.highlighted_text.toLowerCase();
    
    // Simple theme extraction (can be enhanced with NLP)
    const themeKeywords = [
      'main idea', 'theme', 'conclusion', 'argument',
      'evidence', 'example', 'detail', 'support',
      'cause', 'effect', 'compare', 'contrast',
      'definition', 'vocabulary', 'important',
    ];
    
    let matchedTheme = 'general';
    for (const keyword of themeKeywords) {
      if (annotation.includes(keyword) || text.includes(keyword)) {
        matchedTheme = keyword;
        break;
      }
    }
    
    if (!themes.has(matchedTheme)) {
      themes.set(matchedTheme, {
        theme: matchedTheme,
        highlights: [],
        centrality: 0,
      });
    }
    
    themes.get(matchedTheme)!.highlights.push({
      text: h.highlighted_text,
      annotation: h.annotation || '',
    });
  });
  
  // Calculate centrality based on cluster size
  const totalHighlights = highlights.length;
  const clusters = Array.from(themes.values());
  
  clusters.forEach((cluster) => {
    cluster.centrality = cluster.highlights.length / totalHighlights;
  });
  
  return clusters.sort((a, b) => b.centrality - a.centrality);
}

/**
 * Generate adaptive scaffolding hints for student
 * PATENTABLE: Personalized feedback based on ZPD
 */
export async function generateScaffoldingHints(
  clusters: SemanticCluster[],
  studentId: string,
  passageThemes: string[] = [],
  highlightCount: number = 0
): Promise<ScaffoldingPlan | null> {
  if (!studentId) return null;
  
  try {
    // Load student profile
    const profile = await adaptiveClusterBoundaryManager.loadStudentProfile(studentId);
    
    // Convert legacy clusters to ML format for analysis
    const clusterAnalysis = {
      clusters: clusters.map((c, i) => ({
        id: i,
        centroid: [],
        members: c.highlights.map(h => ({
          text: h.text,
          embedding: []
        })),
        theme: c.theme,
        coherenceScore: c.coherenceScore || 0.65
      })),
      overallCoherence: clusters.reduce((sum, c) => sum + (c.coherenceScore || 0.65), 0) / (clusters.length || 1),
      fragmentationScore: clusters.filter(c => c.highlights.length === 1).length / (clusters.length || 1),
      conceptCoverage: Math.min(100, (clusters.length / Math.max(passageThemes.length, 4)) * 100)
    };
    
    // Generate scaffolding plan
    const plan = scaffoldingHintGenerator.generateScaffoldingPlan(
      clusterAnalysis,
      profile,
      passageThemes,
      highlightCount
    );
    
    console.log(`💡 Generated ${plan.hints.length} scaffolding hints (ZPD-adapted)`);
    
    return plan;
  } catch (error) {
    console.error('Error generating scaffolding hints:', error);
    return null;
  }
}

/**
 * Calculates concept coverage score - balance between main ideas and details
 */
export function calculateConceptCoverage(clusters: SemanticCluster[]): number {
  const mainIdeaClusters = clusters.filter(c => 
    c.theme.includes('main') || c.theme.includes('theme') || c.theme.includes('argument')
  );
  
  const detailClusters = clusters.filter(c => 
    c.theme.includes('detail') || c.theme.includes('evidence') || c.theme.includes('example')
  );
  
  const mainIdeasCount = mainIdeaClusters.reduce((sum, c) => sum + c.highlights.length, 0);
  const detailsCount = detailClusters.reduce((sum, c) => sum + c.highlights.length, 0);
  
  // Ideal ratio: 30-40% main ideas, 60-70% details
  const ratio = mainIdeasCount / (mainIdeasCount + detailsCount || 1);
  const idealRatio = 0.35;
  const deviation = Math.abs(ratio - idealRatio);
  
  // Score based on how close to ideal (max deviation = 0.35)
  return Math.max(0, Math.min(100, (1 - deviation / 0.35) * 100));
}

/**
 * Detects reading strategy: sequential (reading in order) vs strategic (jumping to key parts)
 */
export function detectHighlightStrategy(
  highlights: Array<{ start_offset: number; end_offset: number }>,
  passageLength: number
): HighlightPattern {
  if (highlights.length === 0) {
    return {
      type: 'scattered',
      score: 0,
      description: 'No highlights detected',
    };
  }
  
  // Sort by position
  const sorted = [...highlights].sort((a, b) => a.start_offset - b.start_offset);
  
  // Calculate average gap between highlights
  let totalGap = 0;
  let maxGap = 0;
  
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].start_offset - sorted[i - 1].end_offset;
    totalGap += gap;
    maxGap = Math.max(maxGap, gap);
  }
  
  const avgGap = totalGap / (sorted.length - 1 || 1);
  const gapConsistency = 1 - (maxGap / passageLength);
  
  // Check coverage distribution
  const coverage = highlights.reduce((sum, h) => sum + (h.end_offset - h.start_offset), 0) / passageLength;
  
  // Determine strategy type
  if (avgGap < passageLength * 0.1 && gapConsistency > 0.7) {
    // Small, consistent gaps = sequential reading
    return {
      type: 'sequential',
      score: Math.min(100, coverage * 150),
      description: 'Reading sequentially with consistent highlighting',
    };
  } else if (maxGap > passageLength * 0.3 && coverage < 0.4) {
    // Large gaps, strategic targeting = strategic reading
    return {
      type: 'strategic',
      score: 85,
      description: 'Strategic reader targeting key concepts',
    };
  } else {
    return {
      type: 'scattered',
      score: 60,
      description: 'Scattered highlighting pattern',
    };
  }
}

/**
 * Calculates semantic density - highlights per conceptual unit (not just per word)
 */
export function calculateSemanticDensity(
  highlights: Array<{ highlighted_text: string }>,
  passageText: string
): number {
  // Count conceptual units (sentences, paragraphs)
  const sentences = passageText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = passageText.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // Average highlight length
  const avgHighlightLength = highlights.reduce(
    (sum, h) => sum + h.highlighted_text.length, 0
  ) / (highlights.length || 1);
  
  // Density score
  const highlightDensity = highlights.length / sentences.length;
  const optimalDensity = 0.4; // ~40% of sentences highlighted is ideal
  
  const densityScore = Math.max(0, 100 - Math.abs(highlightDensity - optimalDensity) * 200);
  
  return Math.round(densityScore);
}
