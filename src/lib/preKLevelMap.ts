// Pure rules for the Pre-K level map (sections of up to 30 numbered levels).

export type PreKTileStatus = "passed" | "retry" | "new";

export const PREK_SECTION_SIZE = 30;
export const PREK_SECTION_NAMES = [
  "Early Learning Foundations",
  "Exploring Our World",
  "Growing Our Knowledge",
  "Getting Ready for Kindergarten",
];

export interface PreKMapLevel {
  worldNumber: number;
  levelNumber: number;
  title: string;
  goal: string;
}

/** Passed beats everything; a started-but-unfinished level asks to try again. */
export function preKTileStatus(bestStars: number | undefined, attempted: boolean): PreKTileStatus {
  if ((bestStars ?? 0) > 0) return "passed";
  if (attempted) return "retry";
  return "new";
}

/** Split levels (already in curriculum order) into sections of 30, numbered continuously. */
export function buildPreKSections<T>(levels: T[]) {
  const sections: { index: number; name: string; firstNumber: number; levels: T[] }[] = [];
  for (let i = 0; i < levels.length; i += PREK_SECTION_SIZE) {
    const idx = sections.length;
    sections.push({
      index: idx,
      name: PREK_SECTION_NAMES[idx] ?? `Section ${idx + 1}`,
      firstNumber: i + 1,
      levels: levels.slice(i, i + PREK_SECTION_SIZE),
    });
  }
  return sections;
}
