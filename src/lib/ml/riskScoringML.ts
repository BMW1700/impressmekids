/**
 * ML-ENHANCED: Student Risk Scoring with Adaptive Thresholds
 * Integrates with Patents #1-4 for comprehensive risk assessment
 */

export interface StudentFeatures {
  weeklyImprovement: number;
  sessionsPerWeek: number;
  avgPhonemeAccuracy: number;
  confidenceTrend: number;
  grade: number;
  consistencyScore: number;
}

interface GradeBenchmark {
  minSessionsPerWeek: number;
  minAccuracy: number;
  minImprovement: number;
}

const GRADE_BENCHMARKS: Record<number, GradeBenchmark> = {
  1: { minSessionsPerWeek: 2, minAccuracy: 60, minImprovement: -5 },
  2: { minSessionsPerWeek: 2, minAccuracy: 65, minImprovement: -3 },
  3: { minSessionsPerWeek: 2.5, minAccuracy: 70, minImprovement: 0 },
  4: { minSessionsPerWeek: 2.5, minAccuracy: 72, minImprovement: 0 },
  5: { minSessionsPerWeek: 3, minAccuracy: 75, minImprovement: 0 },
  6: { minSessionsPerWeek: 3, minAccuracy: 77, minImprovement: 0 },
};

/**
 * ML-ENHANCED: Risk scoring with adaptive grade-level thresholds
 */
export const calculateRiskScore = (features: StudentFeatures): number => {
  const benchmark = GRADE_BENCHMARKS[features.grade] || GRADE_BENCHMARKS[3];
  
  // Feature-based risk factors (0-1 scale, higher = more risk)
  const sessionRisk = features.sessionsPerWeek < benchmark.minSessionsPerWeek
    ? 1 - (features.sessionsPerWeek / benchmark.minSessionsPerWeek)
    : 0;
  
  const accuracyRisk = features.avgPhonemeAccuracy < benchmark.minAccuracy
    ? 1 - (features.avgPhonemeAccuracy / benchmark.minAccuracy)
    : 0;
  
  const improvementRisk = features.weeklyImprovement < benchmark.minImprovement
    ? Math.abs(features.weeklyImprovement / 20) // Normalize to 0-1
    : 0;
  
  const confidenceRisk = features.confidenceTrend < 0
    ? Math.abs(features.confidenceTrend) / 100
    : 0;
  
  const consistencyRisk = 1 - features.consistencyScore;
  
  // Weighted risk calculation
  const weightedRisk = (
    sessionRisk * 0.30 +
    accuracyRisk * 0.25 +
    improvementRisk * 0.20 +
    confidenceRisk * 0.15 +
    consistencyRisk * 0.10
  );
  
  // Convert to 0-100 score using sigmoid-like curve
  const riskScore = 100 * (1 / (1 + Math.exp(-5 * (weightedRisk - 0.5))));
  
  return Math.round(riskScore);
};

/**
 * Extract features from student records
 */
export const extractFeatures = (
  studentRecords: any[],
  skillVector: any,
  studentProfile: any
): StudentFeatures => {
  const recentRecords = studentRecords.slice(0, 10);
  
  // Calculate weekly improvement
  const oldAvg = studentRecords.slice(5, 10).reduce((sum, r) => sum + (r.overall_score || 70), 0) / 5;
  const newAvg = recentRecords.slice(0, 5).reduce((sum, r) => sum + (r.overall_score || 70), 0) / 5;
  const weeklyImprovement = newAvg - oldAvg;
  
  // Sessions per week
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSessions = studentRecords.filter(r => 
    new Date(r.created_at).getTime() > oneWeekAgo
  );
  const sessionsPerWeek = recentSessions.length;
  
  // Average phoneme accuracy
  const phonemeScores = skillVector?.phoneme_scores || {};
  const scores = Object.values(phonemeScores) as number[];
  const avgPhonemeAccuracy = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 70;
  
  // Confidence trend
  const confidenceScores = recentRecords.map(r => r.confidence_score || 0.7);
  const oldConfidence = confidenceScores.slice(5).reduce((sum, c) => sum + c, 0) / 5;
  const newConfidence = confidenceScores.slice(0, 5).reduce((sum, c) => sum + c, 0) / 5;
  const confidenceTrend = (newConfidence - oldConfidence) * 100;
  
  // Consistency score (how regular is practice?)
  const timestamps = recentRecords.map(r => new Date(r.created_at).getTime());
  const gaps = [];
  for (let i = 1; i < timestamps.length; i++) {
    gaps.push(timestamps[i - 1] - timestamps[i]);
  }
  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / Math.max(gaps.length, 1);
  const stdDev = Math.sqrt(
    gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / Math.max(gaps.length, 1)
  );
  const consistencyScore = Math.max(0, 1 - (stdDev / avgGap)); // Lower variance = higher consistency
  
  return {
    weeklyImprovement,
    sessionsPerWeek,
    avgPhonemeAccuracy,
    confidenceTrend,
    grade: studentProfile?.grade || 3,
    consistencyScore
  };
};

/**
 * Generate specific risk factors and recommendations
 */
export const generateRiskFactors = (
  features: StudentFeatures,
  riskScore: number
): { factors: string[]; recommendations: string[] } => {
  const factors: string[] = [];
  const recommendations: string[] = [];
  
  if (riskScore < 30) {
    return {
      factors: ['Student performing well'],
      recommendations: ['Continue current practice routine']
    };
  }
  
  const benchmark = GRADE_BENCHMARKS[features.grade] || GRADE_BENCHMARKS[3];
  
  if (features.sessionsPerWeek < benchmark.minSessionsPerWeek) {
    factors.push(`Only ${features.sessionsPerWeek} practice sessions this week (target: ${benchmark.minSessionsPerWeek})`);
    recommendations.push('Schedule regular practice times to build consistency');
  }
  
  if (features.avgPhonemeAccuracy < benchmark.minAccuracy) {
    factors.push(`Phoneme accuracy at ${features.avgPhonemeAccuracy.toFixed(0)}% (target: ${benchmark.minAccuracy}%)`);
    recommendations.push('Focus on foundational phoneme practice with immediate feedback');
  }
  
  if (features.weeklyImprovement < benchmark.minImprovement) {
    factors.push(`Scores declining by ${Math.abs(features.weeklyImprovement).toFixed(1)} points per week`);
    recommendations.push('Review recent challenging areas with teacher support');
  }
  
  if (features.confidenceTrend < -5) {
    factors.push('Confidence dropping in recent sessions');
    recommendations.push('Start with easier exercises to rebuild confidence');
  }
  
  if (features.consistencyScore < 0.5) {
    factors.push('Irregular practice schedule detected');
    recommendations.push('Create a consistent daily/weekly practice routine');
  }
  
  if (factors.length === 0) {
    factors.push('Multiple moderate risk indicators');
    recommendations.push('Teacher check-in recommended to assess specific needs');
  }
  
  return { factors, recommendations };
};
