/**
 * Next Best Action AI
 * Combines existing ML models to recommend specific interventions for students
 * No API calls - uses phonemeTransferModel, riskScoring, crossModalLiteracyPredictor
 */

import { predictPhonemeGains, explainPhonemeFeatures } from './phonemeTransferModel';
import { calculateRiskScore, generateRiskFactors, extractFeatures } from './riskScoring';
import { predictSpeakingFromReading } from './crossModalLiteracyPredictor';

export interface NextBestAction {
  actionType: 'phoneme_practice' | 'reading_exercise' | 'speaking_drill' | 'comprehensive_review';
  title: string;
  description: string;
  reasoning: string;
  targetPhoneme?: string;
  expectedOutcome: string;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: string;
}

interface StudentPerformanceData {
  auraRecords: any[];
  skillVector: any;
  studentProfile: any;
  recentAssignments: any[];
}

/**
 * Generate the single most impactful action for a student right now
 */
export const generateNextBestAction = (data: StudentPerformanceData): NextBestAction | null => {
  const { auraRecords, skillVector, studentProfile, recentAssignments } = data;

  if (!auraRecords || auraRecords.length === 0) {
    return {
      actionType: 'speaking_drill',
      title: 'Start First Speaking Practice',
      description: 'Record a 1-minute reading to establish baseline metrics',
      reasoning: 'No speaking data yet - need to establish baseline performance',
      expectedOutcome: 'Baseline clarity, pace, and confidence metrics',
      difficulty: 'easy',
      priority: 'high',
      estimatedDuration: '2-3 minutes'
    };
  }

  // Extract phoneme performance
  const phonemeScores = skillVector?.phoneme_scores || {};
  const masteredPhonemes = Object.entries(phonemeScores)
    .filter(([_, score]) => (score as number) >= 85)
    .map(([phoneme]) => phoneme);

  const strugglingPhonemes = Object.entries(phonemeScores)
    .filter(([_, score]) => (score as number) < 70)
    .map(([phoneme]) => phoneme);

  // Calculate risk score
  const features = extractFeatures(auraRecords, skillVector, studentProfile);
  const riskScore = calculateRiskScore(features);
  const riskFactors = generateRiskFactors(features, riskScore);

  // Run transfer learning predictions
  let transferPredictions: any[] = [];
  if (masteredPhonemes.length > 0) {
    transferPredictions = predictPhonemeGains(
      masteredPhonemes,
      strugglingPhonemes,
      studentProfile?.grade
    );
  }

  // Cross-modal literacy prediction
  const avgHighlightCount = recentAssignments.reduce((sum: number, a: any) => 
    sum + (a.highlight_count || 0), 0) / Math.max(recentAssignments.length, 1);
  
  const literacyPrediction = predictSpeakingFromReading(
    features.avgPhonemeAccuracy * 100,
    70, // mock annotation quality
    features.avgPhonemeAccuracy * 100,
    avgHighlightCount,
    50 // mock annotation length
  );

  // Decision logic: What does the student need most?

  // HIGH PRIORITY: Risk factors indicating immediate intervention
  if (riskScore > 75 && riskFactors.factors.length > 0) {
    const primaryRisk = riskFactors.factors[0];
    const primaryRec = riskFactors.recommendations[0];

    return {
      actionType: 'comprehensive_review',
      title: '🚨 Immediate Attention Needed',
      description: primaryRec,
      reasoning: `Risk score: ${riskScore}/100. ${primaryRisk}`,
      expectedOutcome: 'Stabilize foundational skills',
      difficulty: 'medium',
      priority: 'high',
      estimatedDuration: '10-15 minutes'
    };
  }

  // MEDIUM PRIORITY: Transfer learning opportunity
  if (transferPredictions.length > 0 && transferPredictions[0].readinessLevel === 'high') {
    const topPrediction = transferPredictions[0];
    const featureExplanation = explainPhonemeFeatures(topPrediction.phoneme);

    return {
      actionType: 'phoneme_practice',
      title: `Practice /${topPrediction.phoneme}/ Sound`,
      description: `Focus on ${featureExplanation} sounds`,
      reasoning: topPrediction.reasoning,
      targetPhoneme: topPrediction.phoneme,
      expectedOutcome: `+${topPrediction.transferProbability}% success rate predicted. Likely +10-15 clarity points.`,
      difficulty: topPrediction.transferProbability > 80 ? 'easy' : 'medium',
      priority: 'medium',
      estimatedDuration: '5-7 minutes'
    };
  }

  // CROSS-MODAL GAP: Speaking vs Reading mismatch
  const gapAnalysis = literacyPrediction.gapAnalysis;
  if (gapAnalysis.potentialWeaknesses.length > 0) {
    return {
      actionType: 'speaking_drill',
      title: 'Strengthen Speaking-Reading Connection',
      description: gapAnalysis.targetedExercises[0] || 'Practice reading aloud with expression',
      reasoning: `Reading shows ${features.avgPhonemeAccuracy * 100}% accuracy but speaking may lag behind`,
      expectedOutcome: 'Align speaking fluency with reading comprehension',
      difficulty: 'medium',
      priority: 'medium',
      estimatedDuration: '8-10 minutes'
    };
  }

  // DEFAULT: Continue building on strengths
  if (masteredPhonemes.length > 0) {
    return {
      actionType: 'reading_exercise',
      title: 'Build on Your Strengths',
      description: `You've mastered ${masteredPhonemes.length} sounds! Practice complex passages to maintain momentum.`,
      reasoning: 'Strong foundation established, ready for more challenging material',
      expectedOutcome: 'Maintain high performance and build confidence',
      difficulty: 'medium',
      priority: 'low',
      estimatedDuration: '5-10 minutes'
    };
  }

  // FALLBACK: Generic practice
  return {
    actionType: 'speaking_drill',
    title: 'Continue Regular Practice',
    description: 'Record a 3-minute reading to track progress',
    reasoning: 'Maintain consistent practice schedule',
    expectedOutcome: 'Steady improvement across all metrics',
    difficulty: 'easy',
    priority: 'low',
    estimatedDuration: '5 minutes'
  };
};

/**
 * Get action emoji for display
 */
export const getActionEmoji = (actionType: NextBestAction['actionType']): string => {
  switch (actionType) {
    case 'phoneme_practice': return '🎯';
    case 'reading_exercise': return '📚';
    case 'speaking_drill': return '🎤';
    case 'comprehensive_review': return '🚨';
    default: return '💡';
  }
};
