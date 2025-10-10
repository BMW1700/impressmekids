/**
 * Articulatory Muscle Memory and Interference Model
 * Part of Patent #3: RL for Phoneme Sequencing with Articulatory Constraints
 * 
 * Models how practicing similar phonemes causes muscle fatigue and interference
 */

import { phonemeFeatures, phonemeDistance } from '../phonemeDistance';

export interface ArticulatoryMuscleGroup {
  name: string;
  phonemes: string[];              // Phonemes using this muscle group
  fatigueLevel: number;            // 0-1, current fatigue
  recoveryRate: number;            // How fast it recovers (per minute)
}

export interface InterferenceEffect {
  sourcePhonem: string;
  targetPhoneme: string;
  interferenceScore: number;       // 0-1, higher = more interference
  explanation: string;
}

/**
 * Articulatory muscle groups involved in speech
 */
const MUSCLE_GROUPS: ArticulatoryMuscleGroup[] = [
  {
    name: 'Lips (bilabial)',
    phonemes: ['p', 'b', 'm', 'w'],
    fatigueLevel: 0,
    recoveryRate: 0.1  // Recovers 10% per minute
  },
  {
    name: 'Tongue tip (alveolar)',
    phonemes: ['t', 'd', 'n', 's', 'z', 'l'],
    fatigueLevel: 0,
    recoveryRate: 0.08
  },
  {
    name: 'Tongue back (velar)',
    phonemes: ['k', 'g', 'ŋ'],
    fatigueLevel: 0,
    recoveryRate: 0.12
  },
  {
    name: 'Tongue blade (palatal/postalveolar)',
    phonemes: ['ʃ', 'ʒ', 'tʃ', 'dʒ', 'j'],
    fatigueLevel: 0,
    recoveryRate: 0.09
  },
  {
    name: 'Teeth/lips (labiodental)',
    phonemes: ['f', 'v'],
    fatigueLevel: 0,
    recoveryRate: 0.11
  },
  {
    name: 'Tongue tip/teeth (dental)',
    phonemes: ['θ', 'ð'],
    fatigueLevel: 0,
    recoveryRate: 0.07  // These are harder, recover slower
  },
  {
    name: 'Glottis (glottal)',
    phonemes: ['h'],
    fatigueLevel: 0,
    recoveryRate: 0.15  // Easy sound, recovers fast
  },
  {
    name: 'Approximants',
    phonemes: ['ɹ', 'w', 'j'],
    fatigueLevel: 0,
    recoveryRate: 0.10
  }
];

/**
 * Track muscle fatigue over practice session
 */
export class ArticulatoryFatigueTracker {
  private muscleGroups: Map<string, ArticulatoryMuscleGroup>;
  private practiceHistory: Array<{ phoneme: string; timestamp: number }> = [];
  
  constructor() {
    this.muscleGroups = new Map();
    for (const group of MUSCLE_GROUPS) {
      this.muscleGroups.set(group.name, { ...group });
    }
  }
  
  /**
   * Record a phoneme practice attempt
   * Updates fatigue levels for involved muscle groups
   */
  recordPractice(phoneme: string, duration: number = 1) {
    const timestamp = Date.now();
    this.practiceHistory.push({ phoneme, timestamp });
    
    // Update fatigue for all muscle groups involved
    for (const [groupName, group] of this.muscleGroups.entries()) {
      if (group.phonemes.includes(phoneme)) {
        // Increase fatigue proportional to practice duration
        const fatigueIncrease = 0.15 * duration;
        group.fatigueLevel = Math.min(1, group.fatigueLevel + fatigueIncrease);
        
        console.log(`💪 ${groupName}: fatigue ${(group.fatigueLevel * 100).toFixed(0)}%`);
      }
    }
    
    // Simulate natural recovery for all groups
    this.applyNaturalRecovery();
  }
  
  /**
   * Apply natural fatigue recovery over time
   */
  private applyNaturalRecovery() {
    const now = Date.now();
    const lastPractice = this.practiceHistory[this.practiceHistory.length - 1];
    
    if (!lastPractice) return;
    
    const minutesSinceLastPractice = (now - lastPractice.timestamp) / 60000;
    
    for (const [_, group] of this.muscleGroups.entries()) {
      const recovery = group.recoveryRate * minutesSinceLastPractice;
      group.fatigueLevel = Math.max(0, group.fatigueLevel - recovery);
    }
  }
  
  /**
   * Get current fatigue score for a phoneme
   * Returns 0-1, where 1 = maximum fatigue
   */
  getFatigueScore(phoneme: string): number {
    let maxFatigue = 0;
    
    for (const group of this.muscleGroups.values()) {
      if (group.phonemes.includes(phoneme)) {
        maxFatigue = Math.max(maxFatigue, group.fatigueLevel);
      }
    }
    
    return maxFatigue;
  }
  
  /**
   * Get optimal rest time before practicing a phoneme
   * Returns minutes needed for optimal performance
   */
  getOptimalRestTime(phoneme: string): number {
    const currentFatigue = this.getFatigueScore(phoneme);
    
    if (currentFatigue < 0.3) return 0;  // Ready now
    
    // Find slowest recovery rate for involved muscle groups
    let slowestRecovery = 0.15;  // Default
    
    for (const group of this.muscleGroups.values()) {
      if (group.phonemes.includes(phoneme)) {
        slowestRecovery = Math.min(slowestRecovery, group.recoveryRate);
      }
    }
    
    // Calculate time to reach 20% fatigue
    const targetFatigue = 0.2;
    const minutesNeeded = (currentFatigue - targetFatigue) / slowestRecovery;
    
    return Math.max(0, minutesNeeded);
  }
  
  /**
   * Recommend next phoneme considering fatigue
   */
  recommendNextPhoneme(candidates: string[]): { phoneme: string; reasoning: string } {
    const scores = candidates.map(phoneme => ({
      phoneme,
      fatigue: this.getFatigueScore(phoneme),
      restTime: this.getOptimalRestTime(phoneme)
    }));
    
    // Sort by lowest fatigue
    scores.sort((a, b) => a.fatigue - b.fatigue);
    
    const best = scores[0];
    
    let reasoning = '';
    if (best.fatigue < 0.2) {
      reasoning = `Fresh muscles - optimal time to practice /${best.phoneme}/`;
    } else if (best.fatigue < 0.5) {
      reasoning = `Moderate fatigue for /${best.phoneme}/ - can practice but watch for quality`;
    } else {
      reasoning = `High muscle fatigue for /${best.phoneme}/ - recommend ${Math.ceil(best.restTime)} min rest`;
    }
    
    return { phoneme: best.phoneme, reasoning };
  }
  
  /**
   * Get muscle group status report
   */
  getStatusReport(): string[] {
    const report: string[] = [];
    
    for (const [groupName, group] of this.muscleGroups.entries()) {
      const fatiguePercent = Math.round(group.fatigueLevel * 100);
      const status = group.fatigueLevel < 0.3 ? '✅ Ready' : 
                    group.fatigueLevel < 0.6 ? '⚠️ Tired' : 
                    '🔴 Fatigued';
      
      report.push(`${groupName}: ${status} (${fatiguePercent}%)`);
    }
    
    return report;
  }
  
  /**
   * Reset fatigue (e.g., new practice session)
   */
  reset() {
    for (const group of this.muscleGroups.values()) {
      group.fatigueLevel = 0;
    }
    this.practiceHistory = [];
  }
}

/**
 * Calculate articulatory interference between phonemes
 * High interference = practicing one phoneme makes the other harder
 */
export function calculateInterference(
  phoneme1: string,
  phoneme2: string
): InterferenceEffect {
  const distance = phonemeDistance(phoneme1, phoneme2);
  
  // Interference is highest when phonemes are SIMILAR but NOT IDENTICAL
  // Distance 0.2-0.4 = high interference (confusable sounds)
  // Distance < 0.2 = very similar, actually helps
  // Distance > 0.5 = different enough, no interference
  
  let interferenceScore = 0;
  let explanation = '';
  
  if (distance < 0.2) {
    interferenceScore = 0.2;
    explanation = `Very similar sounds - practicing one reinforces the other`;
  } else if (distance < 0.4) {
    interferenceScore = 0.8;  // HIGH INTERFERENCE ZONE
    explanation = `⚠️ Confusable sounds - muscle memory may interfere`;
  } else if (distance < 0.6) {
    interferenceScore = 0.4;
    explanation = `Moderately different - some muscle group overlap`;
  } else {
    interferenceScore = 0.1;
    explanation = `Different articulatory patterns - minimal interference`;
  }
  
  return {
    sourcePhonem: phoneme1,
    targetPhoneme: phoneme2,
    interferenceScore,
    explanation
  };
}

/**
 * Find optimal phoneme sequence that minimizes interference
 * Used by RL agent to schedule practice
 */
export function findOptimalSequence(
  phonemes: string[],
  maxLength = 5
): string[] {
  if (phonemes.length <= maxLength) return phonemes;
  
  // Greedy algorithm: Start with random phoneme, then pick least interfering ones
  const sequence: string[] = [];
  const remaining = [...phonemes];
  
  // Start with first phoneme
  sequence.push(remaining.shift()!);
  
  while (sequence.length < maxLength && remaining.length > 0) {
    // Find phoneme with least interference to last in sequence
    const lastPhoneme = sequence[sequence.length - 1];
    
    const scores = remaining.map(p => ({
      phoneme: p,
      interference: calculateInterference(lastPhoneme, p).interferenceScore
    }));
    
    scores.sort((a, b) => a.interference - b.interference);
    
    const next = scores[0].phoneme;
    sequence.push(next);
    remaining.splice(remaining.indexOf(next), 1);
  }
  
  return sequence;
}

// Global fatigue tracker instance
export const articulatoryFatigueTracker = new ArticulatoryFatigueTracker();
