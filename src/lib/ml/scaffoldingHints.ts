/**
 * PATENT #2 (continued): Adaptive Scaffolding Hint Generation
 * 
 * Generates personalized hints based on:
 * - Student's cluster quality
 * - Missing conceptual areas (compared to passage structure)
 * - Student's performance history
 * 
 * Key innovation: Hints adapt to student's ZPD (Zone of Proximal Development)
 */

import type { SemanticClusterML, ClusterAnalysis } from './semanticEmbeddings';
import type { StudentClusterProfile } from './adaptiveClusterBoundaries';

export interface ScaffoldingHint {
  type: 'cluster_gap' | 'weak_connection' | 'missing_theme' | 'over_highlighting' | 'encouragement';
  severity: 'low' | 'medium' | 'high';
  message: string;
  actionable: string;  // Specific action student can take
  zpd_level: 'within_reach' | 'challenging' | 'too_advanced';
}

export interface ScaffoldingPlan {
  hints: ScaffoldingHint[];
  overallStrength: number;  // 0-100
  nextSteps: string[];
  celebration: string | null;  // Positive reinforcement
}

/**
 * Scaffolding Hint Generator
 * Provides adaptive, actionable feedback
 */
export class ScaffoldingHintGenerator {
  /**
   * Generate scaffolding plan for student's clustering results
   */
  generateScaffoldingPlan(
    clusterAnalysis: ClusterAnalysis,
    studentProfile: StudentClusterProfile,
    passageThemes: string[],  // Expected themes from passage
    highlightCount: number
  ): ScaffoldingPlan {
    const hints: ScaffoldingHint[] = [];
    
    // 1. Check cluster coherence
    hints.push(...this.analyzeCoherence(
      clusterAnalysis.clusters,
      studentProfile
    ));
    
    // 2. Check conceptual coverage
    hints.push(...this.checkConceptCoverage(
      clusterAnalysis.clusters,
      passageThemes,
      studentProfile
    ));
    
    // 3. Check highlighting behavior
    hints.push(...this.analyzeHighlightingBehavior(
      highlightCount,
      clusterAnalysis.fragmentationScore,
      studentProfile
    ));
    
    // 4. Check for improvement opportunities
    hints.push(...this.identifyGrowthOpportunities(
      clusterAnalysis,
      studentProfile
    ));
    
    // Sort by severity and ZPD appropriateness
    hints.sort((a, b) => {
      // Prioritize within_reach hints for ZPD
      if (a.zpd_level === 'within_reach' && b.zpd_level !== 'within_reach') return -1;
      if (b.zpd_level === 'within_reach' && a.zpd_level !== 'within_reach') return 1;
      
      // Then by severity
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
    
    // Calculate overall strength
    const overallStrength = this.calculateOverallStrength(clusterAnalysis, studentProfile);
    
    // Generate next steps (top 3 actionable items)
    const nextSteps = hints
      .filter(h => h.zpd_level === 'within_reach')
      .slice(0, 3)
      .map(h => h.actionable);
    
    // Add celebration if performance is strong
    const celebration = this.generateCelebration(overallStrength, clusterAnalysis, studentProfile);
    
    return {
      hints: hints.slice(0, 5),  // Top 5 hints
      overallStrength,
      nextSteps,
      celebration
    };
  }
  
  /**
   * Analyze cluster coherence and generate hints
   */
  private analyzeCoherence(
    clusters: SemanticClusterML[],
    profile: StudentClusterProfile
  ): ScaffoldingHint[] {
    const hints: ScaffoldingHint[] = [];
    
    // Find weak clusters
    const weakClusters = clusters.filter(c => c.coherenceScore < profile.coherenceBaseline - 0.1);
    
    if (weakClusters.length > 0) {
      const severity = weakClusters.length > clusters.length * 0.5 ? 'high' : 'medium';
      
      hints.push({
        type: 'weak_connection',
        severity,
        message: `${weakClusters.length} of your highlight groups seem loosely connected.`,
        actionable: `Review the "${weakClusters[0].theme}" group. Do these highlights share a common theme?`,
        zpd_level: profile.preferredGranularity === 'coarse' ? 'within_reach' : 'challenging'
      });
    }
    
    // Check for too many tiny clusters (fragmentation)
    const tinyClusters = clusters.filter(c => c.members.length === 1);
    
    if (tinyClusters.length > 3) {
      hints.push({
        type: 'cluster_gap',
        severity: 'medium',
        message: `You have ${tinyClusters.length} isolated highlights that don't connect to themes.`,
        actionable: 'Try to find connections between isolated highlights, or remove less important ones.',
        zpd_level: 'within_reach'
      });
    }
    
    return hints;
  }
  
  /**
   * Check if student covered expected passage themes
   */
  private checkConceptCoverage(
    clusters: SemanticClusterML[],
    expectedThemes: string[],
    profile: StudentClusterProfile
  ): ScaffoldingHint[] {
    const hints: ScaffoldingHint[] = [];
    
    if (expectedThemes.length === 0) return hints;
    
    // Simple keyword matching for theme detection
    const studentThemes = clusters.map(c => c.theme.toLowerCase());
    
    const missingThemes = expectedThemes.filter(theme => 
      !studentThemes.some(st => st.includes(theme.toLowerCase()))
    );
    
    if (missingThemes.length > 0 && missingThemes.length < expectedThemes.length) {
      hints.push({
        type: 'missing_theme',
        severity: 'high',
        message: `You might have missed important concepts like "${missingThemes[0]}".`,
        actionable: `Re-read the passage looking for information about "${missingThemes[0]}". Try highlighting key sentences.`,
        zpd_level: 'within_reach'
      });
    }
    
    return hints;
  }
  
  /**
   * Analyze highlighting behavior patterns
   */
  private analyzeHighlightingBehavior(
    highlightCount: number,
    fragmentationScore: number,
    profile: StudentClusterProfile
  ): ScaffoldingHint[] {
    const hints: ScaffoldingHint[] = [];
    
    // Too few highlights
    if (highlightCount < 4) {
      hints.push({
        type: 'cluster_gap',
        severity: 'high',
        message: 'You highlighted very few passages.',
        actionable: 'Try highlighting main ideas, supporting details, and unfamiliar vocabulary.',
        zpd_level: 'within_reach'
      });
    }
    
    // Too many highlights
    if (highlightCount > 15) {
      hints.push({
        type: 'over_highlighting',
        severity: 'medium',
        message: 'You highlighted a lot! Let\'s focus on the most important parts.',
        actionable: 'Next time, be more selective. Ask: "Is this essential to understanding the passage?"',
        zpd_level: profile.preferredGranularity === 'fine' ? 'within_reach' : 'challenging'
      });
    }
    
    // High fragmentation
    if (fragmentationScore > 0.7 && highlightCount > 5) {
      hints.push({
        type: 'weak_connection',
        severity: 'medium',
        message: 'Your highlights seem scattered across different ideas.',
        actionable: 'Try to connect related highlights. Look for cause-effect or comparison relationships.',
        zpd_level: 'challenging'
      });
    }
    
    return hints;
  }
  
  /**
   * Identify growth opportunities based on student level
   */
  private identifyGrowthOpportunities(
    clusterAnalysis: ClusterAnalysis,
    profile: StudentClusterProfile
  ): ScaffoldingHint[] {
    const hints: ScaffoldingHint[] = [];
    
    // Advanced students: encourage deeper analysis
    if (profile.preferredGranularity === 'fine' && clusterAnalysis.overallCoherence > 0.75) {
      hints.push({
        type: 'encouragement',
        severity: 'low',
        message: 'Your highlighting shows strong comprehension!',
        actionable: 'Challenge: Can you find implicit connections between your highlight groups?',
        zpd_level: 'within_reach'
      });
    }
    
    // Struggling students: celebrate small wins
    if (profile.preferredGranularity === 'coarse' && clusterAnalysis.clusters.length >= 2) {
      hints.push({
        type: 'encouragement',
        severity: 'low',
        message: `Great! You identified ${clusterAnalysis.clusters.length} different themes.`,
        actionable: 'Keep practicing! Try to add more details to each theme group.',
        zpd_level: 'within_reach'
      });
    }
    
    return hints;
  }
  
  /**
   * Calculate overall reading strength
   */
  private calculateOverallStrength(
    clusterAnalysis: ClusterAnalysis,
    profile: StudentClusterProfile
  ): number {
    const coherenceScore = clusterAnalysis.overallCoherence * 100;
    const coverageScore = clusterAnalysis.conceptCoverage;
    const fragmentationPenalty = clusterAnalysis.fragmentationScore * 20;
    
    // Adjust expectations based on student level
    let adjusted = (coherenceScore * 0.5 + coverageScore * 0.5) - fragmentationPenalty;
    
    if (profile.preferredGranularity === 'coarse') {
      // More forgiving for struggling students
      adjusted = Math.min(100, adjusted * 1.2);
    }
    
    return Math.max(0, Math.min(100, Math.round(adjusted)));
  }
  
  /**
   * Generate celebration message for strong performance
   */
  private generateCelebration(
    strength: number,
    clusterAnalysis: ClusterAnalysis,
    profile: StudentClusterProfile
  ): string | null {
    if (strength < 70) return null;
    
    const celebrations = [
      `Excellent clustering! You identified ${clusterAnalysis.clusters.length} distinct themes with ${Math.round(clusterAnalysis.overallCoherence * 100)}% coherence.`,
      `Strong work! Your highlights show deep understanding of the passage structure.`,
      `Impressive! You're organizing information like an advanced reader.`,
      `Great job! Your theme groups are well-connected and comprehensive.`
    ];
    
    // Add growth-specific celebration
    if (profile.preferredGranularity === 'coarse' && strength > 70) {
      celebrations.push(`🎉 Major progress! You're developing strong comprehension strategies.`);
    }
    
    return celebrations[Math.floor(Math.random() * celebrations.length)];
  }
}

// Global instance
export const scaffoldingHintGenerator = new ScaffoldingHintGenerator();
