/**
 * 🚀 PATENT #3 COMPONENT: RL-Based Adaptive Difficulty Scaling
 * Combines Q-Learning Agent + Cross-Modal Transfer Network for intelligent difficulty progression
 */

import { PhonemeQAgent, type PhonemeState } from './reinforcementLearning/qTable';
import { CrossModalTransferNetwork, type ReadingFeatures, type SpeakingFeatures } from './ml/crossModalTransferNetwork';
import { DIFFICULTY_LEVELS } from './difficultyScaling';

export interface AdaptiveDifficultyResult {
  newLevel: number;
  reasoning: string;
  confidence: number;
  rlOptimalSequence: string[];
  predictedReadingScore: number;
  predictedSpeakingScore: number;
  articulatoryFatigueRisk: number;
  recommendedRestMinutes: number;
}

export interface StudentStateForDifficulty {
  studentId: string;
  currentLevel: number;
  recentGrades: number[];
  completionRate: number;
  consistency: number;
  weeklyImprovement: number;
  masteredPhonemes: string[];
  strugglingPhonemes: string[];
  recentPracticeMinutes: number;
  readingFeatures?: ReadingFeatures;
  speakingFeatures?: SpeakingFeatures;
}

/**
 * V2 Adaptive Difficulty Scaling Engine
 */
export class AdaptiveDifficultyEngine {
  private qAgent: PhonemeQAgent;
  private crossModalNet: CrossModalTransferNetwork;

  constructor() {
    this.qAgent = new PhonemeQAgent();
    this.crossModalNet = new CrossModalTransferNetwork();
  }

  /**
   * Calculate next difficulty level using RL + Cross-Modal predictions
   */
  async calculateAdaptiveDifficulty(
    state: StudentStateForDifficulty
  ): Promise<AdaptiveDifficultyResult> {
    const {
      currentLevel,
      recentGrades,
      completionRate,
      consistency,
      weeklyImprovement,
      masteredPhonemes,
      strugglingPhonemes,
      recentPracticeMinutes,
      readingFeatures,
      speakingFeatures,
    } = state;

    // Step 1: Get RL optimal phoneme using Q-agent
    const phonemeState: PhonemeState = {
      masteredPhonemes,
      strugglingPhonemes,
      recentAttempts: [], // Would be populated from recent practice
      studentGrade: currentLevel,
    };

    const rlAction = this.qAgent.selectAction(phonemeState);
    const rlOptimalSequence = [rlAction.phoneme];

    // Step 2: Cross-modal prediction (speaking → reading transfer)
    let predictedReadingScore = 70;
    let predictedSpeakingScore = 70;

    if (speakingFeatures && this.crossModalNet.isReady()) {
      try {
        const prediction = await this.crossModalNet.predictReadingFromSpeaking(speakingFeatures);
        predictedReadingScore = typeof prediction === 'number' ? prediction : 70;
      } catch (err) {
        console.warn('Cross-modal prediction failed, using fallback', err);
      }
    }

    if (readingFeatures && this.crossModalNet.isReady()) {
      try {
        const prediction = await this.crossModalNet.predictSpeakingFromReading(readingFeatures);
        predictedSpeakingScore = typeof prediction === 'number' ? prediction : 70;
      } catch (err) {
        console.warn('Cross-modal prediction failed, using fallback', err);
      }
    }

    // Step 3: Compute articulatory fatigue risk (simple model: minutes practiced / max threshold)
    const articulatoryFatigueRisk = Math.min(1.0, recentPracticeMinutes / 120); // Max out at 2 hours
    const interferenceRisk = rlAction.articulatoryLoad;

    // Step 4: Difficulty level decision logic (enhanced with RL + predictions)
    const avgGrade = recentGrades.length > 0
      ? recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length
      : 70;

    let newLevel = currentLevel;
    let reasoning = '';
    let confidence = 0.7;

    // Factor 1: Recent performance
    const performanceScore = avgGrade;

    // Factor 2: Cross-modal prediction gap (if reading is predicted lower, speaking practice helps)
    const crossModalGap = predictedReadingScore - predictedSpeakingScore;

    // Factor 3: RL fatigue consideration
    const shouldRest = articulatoryFatigueRisk > 0.7 || interferenceRisk > 0.6;

    // RULE 1: High fatigue → maintain or decrease
    if (shouldRest) {
      newLevel = Math.max(1, currentLevel - 1);
      reasoning = `Articulatory fatigue detected (${Math.round(articulatoryFatigueRisk * 100)}%). Reducing difficulty to prevent burnout.`;
      confidence = 0.9;
    }
    // RULE 2: Strong cross-modal gap → focus on weaker modality at current level
    else if (Math.abs(crossModalGap) > 15) {
      newLevel = currentLevel; // Stay at current level but focus on gap
      const weakerModality = crossModalGap > 0 ? 'speaking' : 'reading';
      reasoning = `Cross-modal gap detected: ${weakerModality} needs focus (${Math.abs(Math.round(crossModalGap))} points). Maintaining level ${currentLevel}.`;
      confidence = 0.85;
    }
    // RULE 3: Excellent performance + low fatigue → increase
    else if (performanceScore >= 85 && completionRate >= 80 && articulatoryFatigueRisk < 0.4) {
      newLevel = Math.min(5, currentLevel + 1);
      reasoning = `Excellent performance (${Math.round(performanceScore)}/100) with low fatigue (${Math.round(articulatoryFatigueRisk * 100)}%). Ready for level ${newLevel}!`;
      confidence = 0.95;
    }
    // RULE 4: Poor performance or high inconsistency → decrease
    else if (performanceScore < 60 || consistency > 20) {
      newLevel = Math.max(1, currentLevel - 1);
      reasoning = `Performance ${performanceScore < 60 ? 'struggling' : 'inconsistent'}. Lowering to level ${newLevel} for confidence building.`;
      confidence = 0.88;
    }
    // RULE 5: Steady improvement → maintain or slight increase
    else if (weeklyImprovement > 10 && performanceScore >= 70) {
      newLevel = Math.min(5, currentLevel + (weeklyImprovement > 20 ? 1 : 0));
      reasoning = `Steady progress (+${Math.round(weeklyImprovement)}% weekly). ${newLevel > currentLevel ? 'Advancing' : 'Consolidating'} at level ${newLevel}.`;
      confidence = 0.8;
    }
    // DEFAULT: Maintain
    else {
      newLevel = currentLevel;
      reasoning = `Performance stable (${Math.round(performanceScore)}/100). Continuing at level ${currentLevel}.`;
      confidence = 0.7;
    }

    // Calculate recommended rest based on fatigue
    const recommendedRestMinutes = shouldRest
      ? Math.ceil(articulatoryFatigueRisk * 30) // Max 30 min rest
      : 0;

    return {
      newLevel,
      reasoning,
      confidence,
      rlOptimalSequence,
      predictedReadingScore,
      predictedSpeakingScore,
      articulatoryFatigueRisk,
      recommendedRestMinutes,
    };
  }

  /**
   * Get difficulty parameters with RL-enhanced sequencing
   */
  getDifficultyParametersV2(level: number, rlOptimalSequence: string[]): {
    complexity: string;
    vocabulary: string;
    length: string;
    pacing: string;
    phonemeSequence: string[];
    fatigueOptimized: boolean;
  } {
    const baseParams = DIFFICULTY_LEVELS.find(d => d.level === level) || DIFFICULTY_LEVELS[2];

    return {
      complexity: baseParams.requirements[0] || 'moderate',
      vocabulary: baseParams.description,
      length: `${5 + level * 3}-${8 + level * 3} words`,
      pacing: ['slow', 'moderate', 'natural', 'faster', 'rapid'][level - 1] || 'natural',
      phonemeSequence: rlOptimalSequence,
      fatigueOptimized: true,
    };
  }

  /**
   * Train the Q-learning agent with new episode data
   */
  trainQLearningAgent(
    state: PhonemeState,
    action: { phoneme: string },
    reward: number,
    nextState: PhonemeState
  ): void {
    this.qAgent.updateQValue(state, action.phoneme, reward, nextState);
  }
}

/**
 * Singleton instance for app-wide use
 */
export const adaptiveDifficultyEngine = new AdaptiveDifficultyEngine();
