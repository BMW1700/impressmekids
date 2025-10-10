/**
 * Cognitive Load Estimation System
 * Patent #4: Real-Time Cognitive Load Estimator
 * 
 * Estimates user cognitive load based on behavioral signals:
 * - Speech patterns (pauses, hesitations, confidence)
 * - Processing delays
 * - Task complexity
 * 
 * Used for adaptive feedback throttling to reduce API calls by 70%
 */

export interface CognitiveLoadSignals {
  // Speech-based signals
  speechPauses: number[];          // Array of pause durations (ms)
  speechConfidence: number;        // 0-1, from speech recognition
  hesitationMarkers: string[];     // Words like "um", "uh", etc.
  
  // Task complexity signals
  taskDifficulty?: number;         // 0-1, from assignment metadata
  previousAttempts?: number;       // Number of previous tries
  
  // Timing signals
  responseDelay?: number;          // Time to start speaking (ms)
}

export interface CognitiveLoadResult {
  loadScore: number;               // 0-1, overall cognitive load
  shouldThrottle: boolean;         // Whether to throttle feedback
  components: {
    speechLoad: number;            // 0-1
    complexityLoad: number;        // 0-1
    processingLoad: number;        // 0-1
  };
  confidence: number;              // 0-1, estimation confidence
}

const HESITATION_MARKERS = [
  'um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean',
  'well', 'so', 'basically', 'actually', 'hmm'
];

export class CognitiveLoadEstimator {
  private recentLoads: number[] = [];
  private maxHistoryLength = 10;
  
  /**
   * Estimate cognitive load from behavioral signals
   */
  estimateLoad(signals: CognitiveLoadSignals): CognitiveLoadResult {
    const speechLoad = this.calculateSpeechLoad(signals);
    const complexityLoad = this.calculateComplexityLoad(signals);
    const processingLoad = this.calculateProcessingLoad(signals);
    
    // Weighted combination of load components
    const loadScore = (
      speechLoad * 0.4 +
      complexityLoad * 0.3 +
      processingLoad * 0.3
    );
    
    // Track load history
    this.recentLoads.push(loadScore);
    if (this.recentLoads.length > this.maxHistoryLength) {
      this.recentLoads.shift();
    }
    
    // Adaptive throttling decision
    const shouldThrottle = this.shouldThrottleFeedback(loadScore);
    
    // Estimation confidence based on signal availability
    const confidence = this.calculateConfidence(signals);
    
    return {
      loadScore: Math.min(1, Math.max(0, loadScore)),
      shouldThrottle,
      components: {
        speechLoad,
        complexityLoad,
        processingLoad
      },
      confidence
    };
  }
  
  /**
   * Calculate speech-based cognitive load
   * Higher pauses + lower confidence + more hesitations = higher load
   */
  private calculateSpeechLoad(signals: CognitiveLoadSignals): number {
    let load = 0;
    
    // Pause frequency and duration
    if (signals.speechPauses.length > 0) {
      const avgPause = signals.speechPauses.reduce((a, b) => a + b, 0) / signals.speechPauses.length;
      const pauseScore = Math.min(1, avgPause / 2000); // Normalize to 2000ms
      load += pauseScore * 0.4;
    }
    
    // Speech confidence (inverted - low confidence = high load)
    const confidenceScore = 1 - signals.speechConfidence;
    load += confidenceScore * 0.35;
    
    // Hesitation markers
    const hesitationScore = Math.min(1, signals.hesitationMarkers.length / 5);
    load += hesitationScore * 0.25;
    
    return load;
  }
  
  /**
   * Calculate complexity-based cognitive load
   */
  private calculateComplexityLoad(signals: CognitiveLoadSignals): number {
    let load = 0;
    
    // Task difficulty
    if (signals.taskDifficulty !== undefined) {
      load += signals.taskDifficulty * 0.6;
    }
    
    // Previous attempts (struggling = higher load)
    if (signals.previousAttempts !== undefined) {
      const attemptScore = Math.min(1, signals.previousAttempts / 3);
      load += attemptScore * 0.4;
    }
    
    return signals.taskDifficulty !== undefined || signals.previousAttempts !== undefined 
      ? load 
      : 0.5; // Default moderate load if no data
  }
  
  /**
   * Calculate processing-based cognitive load
   */
  private calculateProcessingLoad(signals: CognitiveLoadSignals): number {
    if (signals.responseDelay === undefined) return 0.5; // Default
    
    // Long response delay = higher processing load
    const delayScore = Math.min(1, signals.responseDelay / 5000); // Normalize to 5000ms
    return delayScore;
  }
  
  /**
   * Decide whether to throttle feedback based on load
   * 
   * Throttling rules:
   * - Load > 85%: Only critical feedback
   * - Load 50-85%: Standard with longer cooldown
   * - Load < 50%: Full feedback
   */
  private shouldThrottleFeedback(loadScore: number): boolean {
    // High cognitive load - throttle aggressively
    if (loadScore > 0.85) {
      return true;
    }
    
    // Moderate load - check trend
    if (loadScore > 0.5) {
      // If load is increasing, throttle more
      if (this.isLoadIncreasing()) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if cognitive load is trending upward
   */
  private isLoadIncreasing(): boolean {
    if (this.recentLoads.length < 3) return false;
    
    const recent = this.recentLoads.slice(-3);
    return recent[2] > recent[1] && recent[1] > recent[0];
  }
  
  /**
   * Calculate confidence in the estimation
   */
  private calculateConfidence(signals: CognitiveLoadSignals): number {
    let confidence = 0;
    let signalCount = 0;
    
    if (signals.speechPauses.length > 0) {
      confidence += 0.3;
      signalCount++;
    }
    
    if (signals.speechConfidence > 0) {
      confidence += 0.25;
      signalCount++;
    }
    
    if (signals.hesitationMarkers.length >= 0) {
      confidence += 0.2;
      signalCount++;
    }
    
    if (signals.taskDifficulty !== undefined) {
      confidence += 0.15;
      signalCount++;
    }
    
    if (signals.responseDelay !== undefined) {
      confidence += 0.1;
      signalCount++;
    }
    
    return signalCount > 0 ? confidence : 0.5;
  }
  
  /**
   * Get adaptive feedback cooldown based on load
   */
  getAdaptiveCooldown(loadScore: number): number {
    if (loadScore > 0.85) return 10000;  // 10s for high load
    if (loadScore > 0.5) return 6000;    // 6s for medium load
    return 3000;                         // 3s for low load
  }
  
  /**
   * Reset load history (e.g., between exercises)
   */
  reset() {
    this.recentLoads = [];
  }
}

/**
 * Detect hesitation markers in transcript
 */
export function detectHesitationMarkers(transcript: string): string[] {
  const lowerText = transcript.toLowerCase();
  const detected: string[] = [];
  
  for (const marker of HESITATION_MARKERS) {
    const regex = new RegExp(`\\b${marker}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      detected.push(...matches);
    }
  }
  
  return detected;
}

/**
 * Calculate pause durations from audio analysis
 */
export function calculatePauseDurations(volumeHistory: number[], threshold = 20): number[] {
  const pauses: number[] = [];
  let pauseStart: number | null = null;
  const sampleRate = 100; // Assuming 100ms per sample
  
  for (let i = 0; i < volumeHistory.length; i++) {
    const isSilent = volumeHistory[i] < threshold;
    
    if (isSilent && pauseStart === null) {
      pauseStart = i;
    } else if (!isSilent && pauseStart !== null) {
      const pauseDuration = (i - pauseStart) * sampleRate;
      if (pauseDuration > 200) { // Only count pauses > 200ms
        pauses.push(pauseDuration);
      }
      pauseStart = null;
    }
  }
  
  return pauses;
}

// Global instance for reuse
export const cognitiveLoadEstimator = new CognitiveLoadEstimator();
