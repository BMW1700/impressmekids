// Pre-K "Sir Bookears" copy + demo overrides for worlds 101/102/103.
// Sir Bookears the Dog is the single narrator/hero across all three worlds so the
// child hears one consistent character. Matty (bear) and Sally (horse)
// appear in the data as supporting characters but Sir Bookears leads narration.
// Cosmetic layer ONLY — no game/mic/animation behavior changes.

export interface YubiLevelCopy {
  title: string;
  prompt: string;
  ctaLabel?: string;
  hint: string;
  successMessage: string;
}

/** Friendly hero name per world (currently Sir Bookears everywhere). */
export function getYubiCreatureName(_worldId: number): string {
  return "Sir Bookears";
}

/** Soft progress meter label per world — no HP/health framing. */
export function getYubiMeterLabel(worldId: number): string {
  if (worldId === 101) return "Adventure";
  if (worldId === 102) return "Bounce";
  if (worldId === 103) return "Sky Trip";
  return "Adventure";
}

/** Friendly chip label per Pre-K world for level cards. */
export function getYubiHelpChip(_worldId: number): string {
  return "Sir Bookears 🐶";
}

const isYubiWorld = (worldId: number) =>
  worldId === 101 || worldId === 102 || worldId === 103;

export const isYubiPreKWorld = isYubiWorld;

// ────────────────────────────────────────────────────────────────────────────
// Pre-K mission titles for level cards. Short, emotionally readable; replaces
// the technical story.title only when world.mode === 'prek'.
// ────────────────────────────────────────────────────────────────────────────
const LEVEL_MISSION_TITLES: Record<number, Record<number, string>> = {
  101: {
    1: "Visit Grandma",
    2: "Wake Up the Village",
    3: "Light Up the Houses",
    4: "Berry Picking",
    5: "Big Day in the Village",
  },
  102: {
    1: "Fly to the Moon",
    2: "Catch a Cloud",
    3: "Through the Storm",
    4: "Hop Home",
    5: "Bounce Party",
  },
  103: {
    1: "Space Picnic",
    2: "Sky Friends",
    3: "Find the Star",
    4: "Brave Sir Bookears",
    5: "Big Sky Adventure",
  },
};

export function getYubiLevelTitle(
  worldId: number,
  levelId: number
): string | null {
  if (!isYubiWorld(worldId)) return null;
  return LEVEL_MISSION_TITLES[worldId]?.[levelId] ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// Demo override: lets a Patrick-style 3-level walkthrough show the "sun" word
// in World 101 Level 3 WITHOUT mutating the published curriculum sequence.
// Activated by either ?yubi_demo=1 in the URL or localStorage flag.
// Default is OFF so all classrooms continue with the existing word banks.
// ────────────────────────────────────────────────────────────────────────────
const isDemoModeOn = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("yubi_demo") === "1") return true;
    return window.localStorage.getItem("yubi_prek_demo") === "1";
  } catch {
    return false;
  }
};

export function getYubiDemoWords(worldId: number, levelId: number): string[] | null {
  if (!isDemoModeOn()) return null;
  if (worldId === 101 && levelId === 3) return ["sun"];
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Per-level copy. Falls back to a friendly default per world.
// ────────────────────────────────────────────────────────────────────────────
const WORLD_DEFAULT: Record<number, YubiLevelCopy> = {
  101: {
    title: "Adventure with Sir Bookears",
    prompt: "Read the word to help Sir Bookears!",
    hint: "✨ Your voice helps Sir Bookears!",
    successMessage: "You helped Sir Bookears!",
  },
  102: {
    title: "Sky Adventure with Sir Bookears",
    prompt: "Read the word to help Sir Bookears bounce!",
    hint: "✨ Your voice helps Sir Bookears!",
    successMessage: "You helped Sir Bookears bounce!",
  },
  103: {
    title: "Big Sky Adventure",
    prompt: "Read the word to help Sir Bookears!",
    hint: "✨ Your voice helps Sir Bookears!",
    successMessage: "You helped Sir Bookears!",
  },
};

const LEVEL_OVERRIDES: Record<string, YubiLevelCopy> = {};

export function getYubiLevelCopy(
  worldId: number,
  levelId: number
): YubiLevelCopy | null {
  if (!isYubiWorld(worldId)) return null;
  const key = `${worldId}:${levelId}`;
  return LEVEL_OVERRIDES[key] ?? WORLD_DEFAULT[worldId] ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// Episode shell copy (legacy, kept for K-12 wrapper compatibility — Pre-K
// flow now bypasses these overlays and uses YubiAdventure's own narration).
// ────────────────────────────────────────────────────────────────────────────
export interface YubiEpisodeIntro {
  line: string;
  cta: string;
}

export interface YubiEpisodeOutro {
  line: string;
  title: string;
}

const WORLD_FALLBACK_INTRO: Record<number, YubiEpisodeIntro> = {
  101: { line: "Let's help Sir Bookears!", cta: "Help Sir Bookears" },
  102: { line: "Let's help Sir Bookears!", cta: "Help Sir Bookears" },
  103: { line: "Let's help Sir Bookears!", cta: "Help Sir Bookears" },
};

const WORLD_FALLBACK_OUTRO: Record<number, YubiEpisodeOutro> = {
  101: { title: "Great job!", line: "You helped Sir Bookears!" },
  102: { title: "Great job!", line: "You helped Sir Bookears!" },
  103: { title: "Great job!", line: "You helped Sir Bookears!" },
};

export function getEpisodeOpening(worldId: number, levelId: number): YubiEpisodeIntro | null {
  if (!isYubiWorld(worldId)) return null;
  void levelId;
  return WORLD_FALLBACK_INTRO[worldId] ?? null;
}

export function getEpisodeCelebration(worldId: number, levelId: number): YubiEpisodeOutro | null {
  if (!isYubiWorld(worldId)) return null;
  void levelId;
  return WORLD_FALLBACK_OUTRO[worldId] ?? null;
}
