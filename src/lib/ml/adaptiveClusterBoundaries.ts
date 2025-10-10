/**
 * PATENT #2 (continued): Student-Specific Adaptive Cluster Boundaries
 * 
 * Key innovation: Instead of fixed similarity thresholds for clustering,
 * learns optimal boundaries for each student based on their reading history.
 * 
 * Students with strong comprehension get tighter boundaries (more refined clusters).
 * Struggling students get looser boundaries (more forgiving clustering).
 */

import type { SemanticVector, SemanticClusterML } from './semanticEmbeddings';
import { supabase } from '@/integrations/supabase/client';

export interface StudentClusterProfile {
  studentId: string;
  optimalK: number;              // Optimal cluster count for this student
  similarityThreshold: number;   // Minimum similarity for same cluster (0-1)
  coherenceBaseline: number;     // Historical average cluster coherence
  preferredGranularity: 'fine' | 'medium' | 'coarse';  // Clustering style
  lastUpdated: Date;
}

export interface AdaptiveBoundary {
  minSimilarity: number;         // Minimum similarity to merge into cluster
  maxClusterSize: number;        // Maximum highlights per cluster
  minClusterSize: number;        // Minimum highlights to form cluster
  mergePenalty: number;          // Cost of merging dissimilar highlights
}

/**
 * Adaptive Cluster Boundary Manager
 * Learns student-specific clustering parameters
 */
export class AdaptiveClusterBoundaryManager {
  private profiles: Map<string, StudentClusterProfile> = new Map();
  
  /**
   * Load student's cluster profile from database
   */
  async loadStudentProfile(studentId: string): Promise<StudentClusterProfile> {
    // Check cache
    if (this.profiles.has(studentId)) {
      return this.profiles.get(studentId)!;
    }
    
    try {
      // Fetch student's reading history
      const { data: auraRecords, error } = await supabase
        .from('aura_records')
        .select('semantic_clusters, comprehension_score, highlight_count')
        .eq('profile_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Analyze historical clustering patterns
      const profile = this.analyzeClusteringHistory(studentId, auraRecords || []);
      
      this.profiles.set(studentId, profile);
      return profile;
    } catch (error) {
      console.error('Error loading student profile:', error);
      // Return default profile
      return this.getDefaultProfile(studentId);
    }
  }
  
  /**
   * Analyze student's past clusters to determine optimal boundaries
   */
  private analyzeClusteringHistory(
    studentId: string,
    records: any[]
  ): StudentClusterProfile {
    if (records.length === 0) {
      return this.getDefaultProfile(studentId);
    }
    
    // Calculate average cluster count
    const clusterCounts = records
      .map(r => r.semantic_clusters?.length || 0)
      .filter(c => c > 0);
    
    const avgK = clusterCounts.length > 0
      ? clusterCounts.reduce((sum, k) => sum + k, 0) / clusterCounts.length
      : 4;
    
    // Calculate average comprehension
    const comprehensionScores = records
      .map(r => r.comprehension_score || 0)
      .filter(s => s > 0);
    
    const avgComprehension = comprehensionScores.length > 0
      ? comprehensionScores.reduce((sum, s) => sum + s, 0) / comprehensionScores.length
      : 50;
    
    // Calculate average highlight count
    const highlightCounts = records
      .map(r => r.highlight_count || 0)
      .filter(c => c > 0);
    
    const avgHighlights = highlightCounts.length > 0
      ? highlightCounts.reduce((sum, c) => sum + c, 0) / highlightCounts.length
      : 8;
    
    // Determine optimal parameters based on performance
    let optimalK: number;
    let similarityThreshold: number;
    let preferredGranularity: 'fine' | 'medium' | 'coarse';
    
    if (avgComprehension > 75) {
      // High comprehension = tighter, more refined clusters
      optimalK = Math.ceil(avgK * 1.2);  // More clusters
      similarityThreshold = 0.75;        // Higher threshold
      preferredGranularity = 'fine';
    } else if (avgComprehension > 50) {
      // Medium comprehension = balanced clustering
      optimalK = Math.ceil(avgK);
      similarityThreshold = 0.6;
      preferredGranularity = 'medium';
    } else {
      // Low comprehension = looser, more forgiving clusters
      optimalK = Math.max(2, Math.floor(avgK * 0.8));  // Fewer clusters
      similarityThreshold = 0.45;                       // Lower threshold
      preferredGranularity = 'coarse';
    }
    
    // Adjust based on highlight behavior
    if (avgHighlights < 5) {
      // Few highlights = need looser clustering
      optimalK = Math.max(2, optimalK - 1);
    } else if (avgHighlights > 15) {
      // Many highlights = can support more clusters
      optimalK = Math.min(10, optimalK + 1);
    }
    
    return {
      studentId,
      optimalK: Math.max(2, Math.min(10, Math.round(optimalK))),
      similarityThreshold,
      coherenceBaseline: 0.65,  // Will be calculated from actual data
      preferredGranularity,
      lastUpdated: new Date()
    };
  }
  
  /**
   * Get default profile for new students
   */
  private getDefaultProfile(studentId: string): StudentClusterProfile {
    return {
      studentId,
      optimalK: 4,
      similarityThreshold: 0.6,
      coherenceBaseline: 0.65,
      preferredGranularity: 'medium',
      lastUpdated: new Date()
    };
  }
  
  /**
   * Calculate adaptive boundaries for clustering
   * PATENTABLE: Personalized thresholds instead of fixed values
   */
  async getAdaptiveBoundaries(studentId: string): Promise<AdaptiveBoundary> {
    const profile = await this.loadStudentProfile(studentId);
    
    // Calculate boundaries based on student profile
    let minSimilarity: number;
    let maxClusterSize: number;
    let minClusterSize: number;
    let mergePenalty: number;
    
    switch (profile.preferredGranularity) {
      case 'fine':
        // Advanced reader: strict boundaries, small clusters
        minSimilarity = 0.75;
        maxClusterSize = 3;
        minClusterSize = 1;
        mergePenalty = 0.3;  // High penalty for loose merges
        break;
      
      case 'coarse':
        // Struggling reader: loose boundaries, larger clusters
        minSimilarity = 0.45;
        maxClusterSize = 8;
        minClusterSize = 2;
        mergePenalty = 0.1;  // Low penalty, encourage merging
        break;
      
      default:  // medium
        minSimilarity = 0.60;
        maxClusterSize = 5;
        minClusterSize = 2;
        mergePenalty = 0.2;
    }
    
    return {
      minSimilarity,
      maxClusterSize,
      minClusterSize,
      mergePenalty
    };
  }
  
  /**
   * Update student profile after new clustering
   * Learns from each reading session
   */
  async updateProfile(
    studentId: string,
    clusters: SemanticClusterML[],
    comprehensionScore?: number
  ): Promise<void> {
    const profile = await this.loadStudentProfile(studentId);
    
    // Calculate actual coherence from this session
    const avgCoherence = clusters.length > 0
      ? clusters.reduce((sum, c) => sum + c.coherenceScore, 0) / clusters.length
      : 0;
    
    // Update baseline with exponential moving average
    const alpha = 0.3;  // Learning rate
    profile.coherenceBaseline = 
      alpha * avgCoherence + (1 - alpha) * profile.coherenceBaseline;
    
    // Adjust optimal K based on actual cluster count
    if (clusters.length > 0) {
      const actualK = clusters.length;
      profile.optimalK = Math.round(
        alpha * actualK + (1 - alpha) * profile.optimalK
      );
    }
    
    // Adjust granularity if comprehension improved/worsened significantly
    if (comprehensionScore !== undefined) {
      if (comprehensionScore > 80 && profile.preferredGranularity !== 'fine') {
        profile.preferredGranularity = 'fine';
        profile.optimalK = Math.min(10, profile.optimalK + 1);
      } else if (comprehensionScore < 50 && profile.preferredGranularity !== 'coarse') {
        profile.preferredGranularity = 'coarse';
        profile.optimalK = Math.max(2, profile.optimalK - 1);
      }
    }
    
    profile.lastUpdated = new Date();
    
    // Update cache
    this.profiles.set(studentId, profile);
    
    console.log(`📊 Updated cluster profile for student ${studentId}:`, {
      optimalK: profile.optimalK,
      granularity: profile.preferredGranularity,
      coherence: profile.coherenceBaseline.toFixed(2)
    });
  }
  
  /**
   * Get recommended cluster count for student
   */
  async getRecommendedK(studentId: string, highlightCount: number): Promise<number> {
    const profile = await this.loadStudentProfile(studentId);
    
    // Adjust for highlight count
    if (highlightCount < 4) {
      return Math.min(profile.optimalK, 2);
    }
    if (highlightCount > 12) {
      return Math.min(profile.optimalK + 1, 10);
    }
    
    return profile.optimalK;
  }
  
  /**
   * Clear cached profile (e.g., when student data changes significantly)
   */
  clearCache(studentId?: string) {
    if (studentId) {
      this.profiles.delete(studentId);
    } else {
      this.profiles.clear();
    }
  }
}

// Global instance
export const adaptiveClusterBoundaryManager = new AdaptiveClusterBoundaryManager();
