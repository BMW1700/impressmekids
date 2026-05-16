/**
 * Mode-aware reading journey leveling utility.
 *
 * Classic (k5)  → labels constrained to K, 1st, 2nd, 3rd, 4th, 5th
 * Agent  (6to12) → labels constrained to 6th, 7th, 8th, 9th, 10th, 11th, 12th
 *
 * WPM thresholds are based on DIBELS / Hasbrouck-Tindal end-of-year
 * 50th-percentile oral reading fluency norms.
 */

export interface ReadingJourneyLevel {
  /** Short display label, e.g. "3rd" */
  label: string;
  /** Full display label, e.g. "3rd Grade" */
  displayLabel: string;
  /** Zero-based index within the mode's ladder */
  stepIndex: number;
  /** Total steps in the mode's ladder */
  totalSteps: number;
  /** WPM target for the next step (0 if at max) */
  nextGoal: number;
  /** Numeric grade used for benchmark calculations */
  benchmarkGrade: number;
}

// ── K-5 ladder ──────────────────────────────────────────────
const K5_LADDER: { label: string; minWpm: number; benchmarkGrade: number }[] = [
  { label: 'Pre-K', minWpm: 0,   benchmarkGrade: -1 },
  { label: 'K',   minWpm: 20,  benchmarkGrade: 0 },
  { label: '1st', minWpm: 53,  benchmarkGrade: 1 },
  { label: '2nd', minWpm: 82,  benchmarkGrade: 2 },
  { label: '3rd', minWpm: 104, benchmarkGrade: 3 },
  { label: '4th', minWpm: 123, benchmarkGrade: 4 },
  { label: '5th', minWpm: 139, benchmarkGrade: 5 },
];

// ── 6-12 ladder ─────────────────────────────────────────────
const SIX_TO_12_LADDER: { label: string; minWpm: number; benchmarkGrade: number }[] = [
  { label: '6th',  minWpm: 0,   benchmarkGrade: 6 },
  { label: '7th',  minWpm: 150, benchmarkGrade: 7 },
  { label: '8th',  minWpm: 162, benchmarkGrade: 8 },
  { label: '9th',  minWpm: 177, benchmarkGrade: 9 },
  { label: '10th', minWpm: 195, benchmarkGrade: 10 },
  { label: '11th', minWpm: 210, benchmarkGrade: 11 },
  { label: '12th', minWpm: 225, benchmarkGrade: 12 },
];

export function getReadingJourneyLevel(
  wpm: number,
  gradeMode: string | undefined,
): ReadingJourneyLevel {
  const ladder = gradeMode === '6to12' ? SIX_TO_12_LADDER : K5_LADDER;

  // Walk the ladder from highest to lowest to find the matching step.
  let matchIndex = 0;
  for (let i = ladder.length - 1; i >= 0; i--) {
    if (wpm >= ladder[i].minWpm) {
      matchIndex = i;
      break;
    }
  }

  const step = ladder[matchIndex];
  const nextStep = ladder[matchIndex + 1];

  return {
    label: step.label,
    displayLabel: `${step.label} Grade`,
    stepIndex: matchIndex,
    totalSteps: ladder.length,
    nextGoal: nextStep ? nextStep.minWpm : 0,
    benchmarkGrade: step.benchmarkGrade,
  };
}
