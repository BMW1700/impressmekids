/**
 * Hasbrouck & Tindal (2017) Oral Reading Fluency Norms
 * DIBELS-compatible benchmark data for grades K-8
 * 
 * Percentiles: 10th, 25th, 50th, 75th, 90th
 * Periods: Fall, Winter, Spring
 */

export interface FluencyNorm {
  grade: number;
  period: 'Fall' | 'Winter' | 'Spring';
  percentile10: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  percentile90: number;
}

// Hasbrouck & Tindal (2017) WCPM Norms
export const FLUENCY_NORMS: FluencyNorm[] = [
  // Grade 1
  { grade: 1, period: 'Fall', percentile10: 0, percentile25: 0, percentile50: 0, percentile75: 0, percentile90: 0 },
  { grade: 1, period: 'Winter', percentile10: 12, percentile25: 23, percentile50: 53, percentile75: 82, percentile90: 111 },
  { grade: 1, period: 'Spring', percentile10: 28, percentile25: 47, percentile50: 82, percentile75: 106, percentile90: 124 },
  
  // Grade 2
  { grade: 2, period: 'Fall', percentile10: 25, percentile25: 42, percentile50: 61, percentile75: 84, percentile90: 106 },
  { grade: 2, period: 'Winter', percentile10: 42, percentile25: 60, percentile50: 84, percentile75: 109, percentile90: 131 },
  { grade: 2, period: 'Spring', percentile10: 61, percentile25: 80, percentile50: 104, percentile75: 124, percentile90: 142 },
  
  // Grade 3
  { grade: 3, period: 'Fall', percentile10: 62, percentile25: 79, percentile50: 99, percentile75: 117, percentile90: 137 },
  { grade: 3, period: 'Winter', percentile10: 78, percentile25: 93, percentile50: 112, percentile75: 131, percentile90: 150 },
  { grade: 3, period: 'Spring', percentile10: 91, percentile25: 107, percentile50: 123, percentile75: 142, percentile90: 162 },
  
  // Grade 4
  { grade: 4, period: 'Fall', percentile10: 72, percentile25: 89, percentile50: 112, percentile75: 133, percentile90: 152 },
  { grade: 4, period: 'Winter', percentile10: 88, percentile25: 106, percentile50: 127, percentile75: 146, percentile90: 167 },
  { grade: 4, period: 'Spring', percentile10: 98, percentile25: 115, percentile50: 139, percentile75: 157, percentile90: 177 },
  
  // Grade 5
  { grade: 5, period: 'Fall', percentile10: 93, percentile25: 110, percentile50: 127, percentile75: 146, percentile90: 166 },
  { grade: 5, period: 'Winter', percentile10: 105, percentile25: 119, percentile50: 140, percentile75: 161, percentile90: 177 },
  { grade: 5, period: 'Spring', percentile10: 109, percentile25: 128, percentile50: 150, percentile75: 169, percentile90: 191 },
  
  // Grade 6
  { grade: 6, period: 'Fall', percentile10: 98, percentile25: 116, percentile50: 140, percentile75: 164, percentile90: 182 },
  { grade: 6, period: 'Winter', percentile10: 111, percentile25: 125, percentile50: 153, percentile75: 177, percentile90: 195 },
  { grade: 6, period: 'Spring', percentile10: 117, percentile25: 133, percentile50: 162, percentile75: 185, percentile90: 204 },
  
  // Grade 7
  { grade: 7, period: 'Fall', percentile10: 102, percentile25: 123, percentile50: 150, percentile75: 177, percentile90: 199 },
  { grade: 7, period: 'Winter', percentile10: 109, percentile25: 131, percentile50: 158, percentile75: 182, percentile90: 202 },
  { grade: 7, period: 'Spring', percentile10: 117, percentile25: 140, percentile50: 165, percentile75: 189, percentile90: 209 },
  
  // Grade 8
  { grade: 8, period: 'Fall', percentile10: 106, percentile25: 128, percentile50: 156, percentile75: 179, percentile90: 199 },
  { grade: 8, period: 'Winter', percentile10: 115, percentile25: 136, percentile50: 167, percentile75: 191, percentile90: 210 },
  { grade: 8, period: 'Spring', percentile10: 120, percentile25: 146, percentile50: 177, percentile75: 199, percentile90: 219 },
];

export type BenchmarkStatus = 'well_below' | 'below' | 'at' | 'above';
export type FluencyLevel = 'independent' | 'instructional' | 'frustration';
export type ScreeningPeriod = 'Fall' | 'Winter' | 'Spring';

/**
 * Get the fluency norm for a specific grade and period
 */
export function getFluencyNorm(grade: number, period: ScreeningPeriod): FluencyNorm | null {
  // Clamp grade to valid range
  const clampedGrade = Math.max(1, Math.min(8, grade));
  return FLUENCY_NORMS.find(n => n.grade === clampedGrade && n.period === period) || null;
}

/**
 * Calculate benchmark status based on WCPM and grade-level norms
 * Uses Hasbrouck & Tindal cut points:
 * - Well Below: < 10th percentile
 * - Below: 10th-25th percentile
 * - At: 25th-50th percentile  
 * - Above: > 50th percentile
 */
export function calculateBenchmarkStatus(
  wcpm: number,
  grade: number,
  period: ScreeningPeriod
): BenchmarkStatus {
  const norm = getFluencyNorm(grade, period);
  
  if (!norm) {
    // Default logic for kindergarten or unsupported grades
    if (wcpm < 20) return 'well_below';
    if (wcpm < 40) return 'below';
    if (wcpm < 60) return 'at';
    return 'above';
  }
  
  if (wcpm < norm.percentile10) return 'well_below';
  if (wcpm < norm.percentile25) return 'below';
  if (wcpm < norm.percentile50) return 'at';
  return 'above';
}

/**
 * Get the percentile range for a given WCPM
 */
export function getPercentileRange(
  wcpm: number,
  grade: number,
  period: ScreeningPeriod
): string {
  const norm = getFluencyNorm(grade, period);
  
  if (!norm) return 'N/A';
  
  if (wcpm >= norm.percentile90) return '90th+';
  if (wcpm >= norm.percentile75) return '75th-90th';
  if (wcpm >= norm.percentile50) return '50th-75th';
  if (wcpm >= norm.percentile25) return '25th-50th';
  if (wcpm >= norm.percentile10) return '10th-25th';
  return '<10th';
}

/**
 * Calculate fluency level based on accuracy
 * Based on research-based cut points:
 * - Independent: 97%+ accuracy
 * - Instructional: 90-96% accuracy
 * - Frustration: <90% accuracy
 */
export function calculateFluencyLevel(accuracyPercentage: number): FluencyLevel {
  if (accuracyPercentage >= 97) return 'independent';
  if (accuracyPercentage >= 90) return 'instructional';
  return 'frustration';
}

/**
 * Get display label for benchmark status
 */
export function getBenchmarkStatusLabel(status: BenchmarkStatus): string {
  const labels: Record<BenchmarkStatus, string> = {
    well_below: 'Well Below Benchmark',
    below: 'Below Benchmark',
    at: 'At Benchmark',
    above: 'Above Benchmark',
  };
  return labels[status];
}

/**
 * Get color class for benchmark status (Tailwind classes)
 */
export function getBenchmarkStatusColor(status: BenchmarkStatus): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<BenchmarkStatus, { bg: string; text: string; border: string }> = {
    well_below: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    below: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    at: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    above: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  };
  return colors[status];
}

/**
 * Get fluency level display label
 */
export function getFluencyLevelLabel(level: FluencyLevel): string {
  const labels: Record<FluencyLevel, string> = {
    independent: 'Independent',
    instructional: 'Instructional',
    frustration: 'Frustration',
  };
  return labels[level];
}

/**
 * Get color for fluency level
 */
export function getFluencyLevelColor(level: FluencyLevel): {
  bg: string;
  text: string;
} {
  const colors: Record<FluencyLevel, { bg: string; text: string }> = {
    independent: { bg: 'bg-green-100', text: 'text-green-700' },
    instructional: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    frustration: { bg: 'bg-red-100', text: 'text-red-700' },
  };
  return colors[level];
}

/**
 * Calculate expected growth (words per week) based on grade
 * Based on research: ~1-2 words per week growth is typical
 */
export function getExpectedWeeklyGrowth(grade: number): number {
  if (grade <= 2) return 2.0;
  if (grade <= 4) return 1.5;
  return 1.0;
}

/**
 * Calculate goal WCPM based on current performance and weeks remaining
 */
export function calculateGoalWCPM(
  currentWCPM: number,
  grade: number,
  weeksRemaining: number
): number {
  const weeklyGrowth = getExpectedWeeklyGrowth(grade);
  return Math.round(currentWCPM + (weeklyGrowth * weeksRemaining));
}

/**
 * Determine if student is on track to meet goal
 */
export function isOnTrackToGoal(
  currentWCPM: number,
  goalWCPM: number,
  weeksElapsed: number,
  totalWeeks: number
): boolean {
  if (totalWeeks === 0 || weeksElapsed === 0) return true;
  
  const expectedProgress = (goalWCPM - currentWCPM) * (weeksElapsed / totalWeeks);
  const actualProgress = currentWCPM;
  
  return actualProgress >= expectedProgress * 0.9; // Within 90% of expected
}

/**
 * Get current screening period based on date
 */
export function getCurrentScreeningPeriod(date: Date = new Date()): ScreeningPeriod {
  const month = date.getMonth(); // 0-11
  
  if (month >= 7 && month <= 10) return 'Fall'; // Aug-Nov
  if (month >= 11 || month <= 1) return 'Winter'; // Dec-Feb
  return 'Spring'; // Mar-Jul
}

/**
 * Get school year string (e.g., "2024-2025")
 */
export function getCurrentSchoolYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // If before August, we're in the previous school year
  if (month < 7) {
    return `${year - 1}-${year}`;
  }
  return `${year}-${year + 1}`;
}

/**
 * Calculate risk tier for RTI/MTSS
 * Tier 1: At or Above benchmark (core instruction)
 * Tier 2: Below benchmark (strategic intervention)
 * Tier 3: Well Below benchmark (intensive intervention)
 */
export function getRTITier(status: BenchmarkStatus): 1 | 2 | 3 {
  switch (status) {
    case 'above':
    case 'at':
      return 1;
    case 'below':
      return 2;
    case 'well_below':
      return 3;
  }
}

/**
 * Get RTI tier description
 */
export function getRTITierDescription(tier: 1 | 2 | 3): string {
  const descriptions: Record<number, string> = {
    1: 'Core Instruction',
    2: 'Strategic Intervention',
    3: 'Intensive Intervention',
  };
  return descriptions[tier];
}

/**
 * Format WCPM for display with trend indicator
 */
export function formatWCPMWithTrend(
  currentWCPM: number,
  previousWCPM: number | null
): { value: string; trend: 'up' | 'down' | 'same' | null; change: number | null } {
  if (previousWCPM === null) {
    return { value: `${currentWCPM}`, trend: null, change: null };
  }
  
  const change = currentWCPM - previousWCPM;
  let trend: 'up' | 'down' | 'same';
  
  if (change > 2) trend = 'up';
  else if (change < -2) trend = 'down';
  else trend = 'same';
  
  return {
    value: `${currentWCPM}`,
    trend,
    change,
  };
}
