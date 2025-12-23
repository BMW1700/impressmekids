/**
 * PATENT #3: Reinforcement Learning for Phoneme Sequencing
 * with Articulatory Constraints
 * 
 * Q-learning agent that learns optimal phoneme practice sequences
 * based on student performance and articulatory interference
 */

import { phonemeDistance, phonemeFeatures } from '../phonemeDistance';

export interface PhonemeState {
  masteredPhonemes: string[];      // Phonemes with >85% accuracy
  strugglingPhonemes: string[];    // Phonemes with <70% accuracy
  recentAttempts: string[];        // Last 5 phonemes practiced (for fatigue)
  studentGrade?: number;           // Optional grade level
}

export interface QValue {
  state: string;                   // Serialized state
  action: string;                  // Phoneme to practice
  value: number;                   // Expected reward (-1 to 1)
  visits: number;                  // Number of times this state-action was explored
}

export interface PhonemeAction {
  phoneme: string;
  expectedReward: number;          // Q-value
  reasoning: string;
  articulatoryLoad: number;        // 0-1, muscle fatigue consideration
}

/**
 * Q-Learning Agent for Phoneme Sequencing
 */
export class PhonemeQAgent {
  private qTable: Map<string, Map<string, QValue>> = new Map();
  private learningRate = 0.1;      // α: How quickly we update Q-values
  private discountFactor = 0.95;   // γ: How much we value future rewards
  private explorationRate = 0.2;   // ε: Exploration vs exploitation
  
  // Articulatory constraints
  private fatigueDecay = 0.85;     // How much fatigue reduces performance
  private similarityThreshold = 0.3; // Distance threshold for interference
  
  /**
   * Initialize Q-table with pre-computed values based on phoneme distance
   */
  initializeQTable() {
    // Removed console.log for production performance
    
    const allPhonemes = Object.keys(phonemeFeatures);
    let pairCount = 0;
    
    // Pre-compute Q-values based on articulatory distance
    for (const mastered of allPhonemes) {
      for (const target of allPhonemes) {
        if (mastered === target) continue;
        
        const distance = phonemeDistance(mastered, target);
        if (distance >= 0.9) continue;  // Skip unknown phonemes
        
        // Initial Q-value based on transfer potential
        // Closer phonemes = higher initial Q-value
        const initialQ = 1 - distance;  // Range: 0 to 1
        
        const stateKey = this.serializeState({
          masteredPhonemes: [mastered],
          strugglingPhonemes: [],
          recentAttempts: []
        });
        
        this.setQValue(stateKey, target, initialQ);
        pairCount++;
      }
    }
    
    // Q-table initialized with ${pairCount} state-action pairs
  }
  
  /**
   * Select best phoneme to practice given current state
   */
  selectAction(state: PhonemeState): PhonemeAction {
    const stateKey = this.serializeState(state);
    
    // Get all possible actions (phonemes not mastered or struggling)
    const allPhonemes = Object.keys(phonemeFeatures);
    const possibleActions = allPhonemes.filter(
      p => !state.masteredPhonemes.includes(p) && !state.strugglingPhonemes.includes(p)
    );
    
    if (possibleActions.length === 0) {
      // No more phonemes to learn
      return {
        phoneme: '',
        expectedReward: 0,
        reasoning: 'All phonemes mastered or being worked on',
        articulatoryLoad: 0
      };
    }
    
    // Exploration vs exploitation
    const explore = Math.random() < this.explorationRate;
    
    if (explore) {
      // Random exploration
      const randomPhoneme = possibleActions[Math.floor(Math.random() * possibleActions.length)];
      const load = this.calculateArticulatoryLoad(randomPhoneme, state.recentAttempts);
      
      return {
        phoneme: randomPhoneme,
        expectedReward: this.getQValue(stateKey, randomPhoneme),
        reasoning: 'Exploring new phoneme for learning',
        articulatoryLoad: load
      };
    }
    
    // Exploitation: Select action with highest Q-value
    // Adjusted for articulatory fatigue
    let bestAction: PhonemeAction | null = null;
    let bestAdjustedReward = -Infinity;
    
    for (const action of possibleActions) {
      const qValue = this.getQValue(stateKey, action);
      const articulatoryLoad = this.calculateArticulatoryLoad(action, state.recentAttempts);
      
      // Penalize recently practiced similar phonemes (muscle fatigue)
      const fatiguePenalty = articulatoryLoad * (1 - this.fatigueDecay);
      const adjustedReward = qValue - fatiguePenalty;
      
      if (adjustedReward > bestAdjustedReward) {
        bestAdjustedReward = adjustedReward;
        bestAction = {
          phoneme: action,
          expectedReward: qValue,
          reasoning: this.generateReasoning(action, state, qValue, articulatoryLoad),
          articulatoryLoad
        };
      }
    }
    
    return bestAction || {
      phoneme: possibleActions[0],
      expectedReward: 0,
      reasoning: 'Default action',
      articulatoryLoad: 0
    };
  }
  
  /**
   * Update Q-value based on actual performance
   * Called after student completes practice
   */
  updateQValue(
    state: PhonemeState,
    action: string,
    reward: number,  // -1 (failure) to 1 (mastery)
    nextState: PhonemeState
  ) {
    const stateKey = this.serializeState(state);
    const nextStateKey = this.serializeState(nextState);
    
    // Current Q-value
    const currentQ = this.getQValue(stateKey, action);
    
    // Max Q-value of next state
    const nextActions = Object.keys(phonemeFeatures).filter(
      p => !nextState.masteredPhonemes.includes(p) && !nextState.strugglingPhonemes.includes(p)
    );
    
    const maxNextQ = nextActions.length > 0
      ? Math.max(...nextActions.map(a => this.getQValue(nextStateKey, a)))
      : 0;
    
    // Q-learning update rule
    // Q(s,a) ← Q(s,a) + α[r + γ·max(Q(s',a')) - Q(s,a)]
    const tdTarget = reward + this.discountFactor * maxNextQ;
    const tdError = tdTarget - currentQ;
    const newQ = currentQ + this.learningRate * tdError;
    
    this.setQValue(stateKey, action, newQ);
  }
  
  /**
   * Calculate articulatory load (muscle fatigue) for a phoneme
   * based on recent attempts
   */
  private calculateArticulatoryLoad(phoneme: string, recentAttempts: string[]): number {
    if (recentAttempts.length === 0) return 0;
    
    // Check similarity to recent attempts
    let loadSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < recentAttempts.length; i++) {
      const recent = recentAttempts[i];
      const distance = phonemeDistance(phoneme, recent);
      
      if (distance < this.similarityThreshold) {
        // Similar phoneme practiced recently = muscle interference
        const recency = (recentAttempts.length - i) / recentAttempts.length;  // More recent = higher weight
        const similarity = 1 - distance;
        
        loadSum += similarity * recency;
        weightSum += recency;
      }
    }
    
    return weightSum > 0 ? loadSum / weightSum : 0;
  }
  
  /**
   * Generate human-readable reasoning for action selection
   */
  private generateReasoning(
    action: string,
    state: PhonemeState,
    qValue: number,
    articulatoryLoad: number
  ): string {
    const parts: string[] = [];
    
    // Q-value interpretation
    if (qValue > 0.7) {
      parts.push(`High transfer potential (Q=${qValue.toFixed(2)}) from mastered phonemes.`);
    } else if (qValue > 0.4) {
      parts.push(`Moderate readiness (Q=${qValue.toFixed(2)}) with some foundation.`);
    } else {
      parts.push(`Challenging phoneme (Q=${qValue.toFixed(2)}) - requires focused practice.`);
    }
    
    // Articulatory load
    if (articulatoryLoad > 0.6) {
      parts.push(`⚠️ High muscle interference - similar sounds practiced recently.`);
    } else if (articulatoryLoad < 0.2) {
      parts.push(`✅ Fresh muscles - good time to practice this sound.`);
    }
    
    // Find closest mastered phoneme
    const distances = state.masteredPhonemes.map(m => ({
      phoneme: m,
      distance: phonemeDistance(action, m)
    })).sort((a, b) => a.distance - b.distance);
    
    if (distances[0] && distances[0].distance < 0.4) {
      parts.push(`Similar to mastered /${distances[0].phoneme}/.`);
    }
    
    return parts.join(' ');
  }
  
  /**
   * Serialize state to string key for Q-table lookup
   */
  private serializeState(state: PhonemeState): string {
    return JSON.stringify({
      m: state.masteredPhonemes.sort(),
      s: state.strugglingPhonemes.sort(),
      r: state.recentAttempts.slice(-3),  // Only last 3 for efficiency
      g: state.studentGrade || 0
    });
  }
  
  /**
   * Get Q-value for state-action pair
   */
  private getQValue(stateKey: string, action: string): number {
    if (!this.qTable.has(stateKey)) {
      return 0;  // Default Q-value
    }
    
    const actions = this.qTable.get(stateKey)!;
    const qValue = actions.get(action);
    
    return qValue?.value || 0;
  }
  
  /**
   * Set Q-value for state-action pair
   */
  private setQValue(stateKey: string, action: string, value: number) {
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, new Map());
    }
    
    const actions = this.qTable.get(stateKey)!;
    const existing = actions.get(action);
    
    actions.set(action, {
      state: stateKey,
      action,
      value,
      visits: (existing?.visits || 0) + 1
    });
  }
  
  /**
   * Export Q-table for storage/analysis
   */
  exportQTable(): QValue[] {
    const entries: QValue[] = [];
    
    for (const [stateKey, actions] of this.qTable.entries()) {
      for (const [action, qValue] of actions.entries()) {
        entries.push(qValue);
      }
    }
    
    return entries;
  }
  
  /**
   * Import Q-table from storage
   */
  importQTable(entries: QValue[]) {
    this.qTable.clear();
    
    for (const entry of entries) {
      this.setQValue(entry.state, entry.action, entry.value);
    }
  }
  
  /**
   * Get Q-table statistics
   */
  getStats() {
    let totalEntries = 0;
    let totalVisits = 0;
    let avgQValue = 0;
    
    for (const [_, actions] of this.qTable.entries()) {
      for (const [__, qValue] of actions.entries()) {
        totalEntries++;
        totalVisits += qValue.visits;
        avgQValue += qValue.value;
      }
    }
    
    return {
      totalStates: this.qTable.size,
      totalEntries,
      avgVisits: totalVisits / totalEntries || 0,
      avgQValue: avgQValue / totalEntries || 0
    };
  }
}

// Global Q-agent instance (lazy initialization - do NOT call initializeQTable at import)
export const phonemeQAgent = new PhonemeQAgent();

// Lazy initializer - call this explicitly when ML features are needed
let qTableInitialized = false;
export const ensureQTableInitialized = () => {
  if (!qTableInitialized) {
    qTableInitialized = true;
    phonemeQAgent.initializeQTable();
  }
};
