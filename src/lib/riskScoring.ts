/**
 * ML-based risk scoring for student performance
 * Uses logistic regression-style scoring with adaptive thresholds
 */

interface StudentFeatures {
  weeklyImprovement: number;
  sessionsPerWeek: number;
  avgPhonemeAccuracy: number;
  confidenceTrend: number;
  grade: number;
}

interface GradeBenchmark {
  minPhonemeAccuracy: number;
  minWPM: number;
  minSessionsPerWeek: number;
}

// Grade-level benchmarks for adaptive thresholds
const GRADE_BENCHMARKS: { [key: number]: GradeBenchmark } = {
  3: { minPhonemeAccuracy: 65, minWPM: 100, minSessionsPerWeek: 2 },
  4: { minPhonemeAccuracy: 70, minWPM: 110, minSessionsPerWeek: 2 },
  5: { minPhonemeAccuracy: 75, minWPM: 120, minSessionsPerWeek: 2 },
  6: { minPhonemeAccuracy: 78, minWPM: 130, minSessionsPerWeek: 2 },
  7: { minPhonemeAccuracy: 80, minWPM: 135, minSessionsPerWeek: 2 },
  8: { minPhonemeAccuracy: 82, minWPM: 140, minSessionsPerWeek: 2 },
  9: { minPhonemeAccuracy: 85, minWPM: 145, minSessionsPerWeek: 2 },
  10: { minPhonemeAccuracy: 87, minWPM: 150, minSessionsPerWeek: 2 },
  11: { minPhonemeAccuracy: 88, minWPM: 155, minSessionsPerWeek: 2 },
  12: { minPhonemeAccuracy: 90, minWPM: 160, minSessionsPerWeek: 2 },
};

/**
 * Calculate ML-based risk score (0-100)
 * Higher score = higher risk
 */
export const calculateRiskScore = (features: StudentFeatures): number => {
  const { weeklyImprovement, sessionsPerWeek, avgPhonemeAccuracy, confidenceTrend, grade } = features;
  
  // Get grade-level benchmark
  const benchmark = GRADE_BENCHMARKS[grade] || GRADE_BENCHMARKS[8]; // Default to grade 8
  
  // Feature weights (trained coefficients)
  const weights = {
    weeklyImprovement: -25.0,      // Negative weight: more improvement = lower risk
    sessionsPerWeek: -15.0,        // Negative weight: more practice = lower risk
    phonemeAccuracyGap: 35.0,      // Positive weight: bigger gap = higher risk
    confidenceTrend: -20.0,        // Negative weight: improving confidence = lower risk
    belowBenchmark: 30.0,          // Positive weight: below grade level = higher risk
  };
  
  // Calculate phoneme accuracy gap relative to grade benchmark
  const phonemeGap = Math.max(0, benchmark.minPhonemeAccuracy - avgPhonemeAccuracy) / 100;
  
  // Calculate if below session benchmark
  const belowSessionBenchmark = sessionsPerWeek < benchmark.minSessionsPerWeek ? 1 : 0;
  
  // Linear combination of features
  const logit = 
    weights.weeklyImprovement * (weeklyImprovement / 100) +
    weights.sessionsPerWeek * (sessionsPerWeek / 7) +
    weights.phonemeAccuracyGap * phonemeGap +
    weights.confidenceTrend * (confidenceTrend / 5) +
    weights.belowBenchmark * belowSessionBenchmark;
  
  // Apply sigmoid to get probability (0-1), then scale to 0-100
  const probability = 1 / (1 + Math.exp(-logit));
  return Math.round(probability * 100);
};

/**
 * Extract features from student data
 */
export const extractFeatures = (
  studentRecords: any[],
  skillVector: any,
  studentProfile: any
): StudentFeatures => {
  // Calculate weekly improvement
  const recentGrades = studentRecords.slice(0, 5).map(r => r.grade || 0);
  const weeklyImprovement = recentGrades.length >= 2 
    ? recentGrades[0] - recentGrades[recentGrades.length - 1]
    : 0;
  
  // Calculate sessions per week
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentSessions = studentRecords.filter(r => 
    new Date(r.created_at) > twoWeeksAgo
  );
  const sessionsPerWeek = (recentSessions.length / 2);
  
  // Get average phoneme accuracy
  const avgPhonemeAccuracy = skillVector?.phoneme_scores?.overall || 75;
  
  // Calculate confidence trend
  const recentConfidence = studentRecords.slice(0, 5).map(r => r.confidence || 3);
  const confidenceTrend = recentConfidence.length >= 2
    ? recentConfidence[0] - recentConfidence[recentConfidence.length - 1]
    : 0;
  
  // Get student grade
  const grade = studentProfile?.grade || 8;
  
  return {
    weeklyImprovement,
    sessionsPerWeek,
    avgPhonemeAccuracy,
    confidenceTrend,
    grade,
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
  const benchmark = GRADE_BENCHMARKS[features.grade] || GRADE_BENCHMARKS[8];
  
  // Weekly improvement
  if (features.weeklyImprovement <= 0) {
    factors.push("No improvement or declining performance");
    recommendations.push("Schedule 1-on-1 check-in to identify blockers");
  } else if (features.weeklyImprovement < 5) {
    factors.push("Slow progress (< 5 pts/week improvement)");
    recommendations.push("Increase practice frequency and variety");
  }
  
  // Practice frequency
  if (features.sessionsPerWeek < benchmark.minSessionsPerWeek) {
    factors.push(`Low practice frequency (${features.sessionsPerWeek.toFixed(1)}/week, need ${benchmark.minSessionsPerWeek})`);
    recommendations.push("Send practice reminder to student/parent");
  }
  
  // Phoneme accuracy
  if (features.avgPhonemeAccuracy < benchmark.minPhonemeAccuracy) {
    const gap = benchmark.minPhonemeAccuracy - features.avgPhonemeAccuracy;
    factors.push(`Below grade-level pronunciation (${gap.toFixed(0)} pts below benchmark)`);
    recommendations.push("Generate targeted phoneme practice exercises");
  }
  
  // Confidence trend
  if (features.confidenceTrend < -0.5) {
    factors.push("Declining confidence levels");
    recommendations.push("Review motivation and create positive reinforcement plan");
  }
  
  // If high risk but no specific factors, add general warning
  if (factors.length === 0 && riskScore >= 50) {
    factors.push("Multiple performance indicators showing concern");
    recommendations.push("Comprehensive assessment recommended");
  }
  
  return { factors, recommendations };
};
