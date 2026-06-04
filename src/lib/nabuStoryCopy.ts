// Pre-K "Benny" copy + demo overrides for worlds 101/102/103.
// Benny the Dog is the single narrator/hero across all three worlds so the
// child hears one consistent character. Matty (bear) and Sally (horse)
// appear in the data as supporting characters but Benny leads narration.
// Cosmetic layer ONLY — no game/mic/animation behavior changes.

export interface NabuLevelCopy {
  title: string;
  prompt: string;
  ctaLabel?: string;
  hint: string;
  successMessage: string;
}

/** Friendly hero name per world (currently Benny everywhere). */
export function getNabuCreatureName(_worldId: number): string {
  return "Benny";
}

/** Soft progress meter label per world — no HP/health framing. */
export function getNabuMeterLabel(worldId: number): string {
  if (worldId === 101) return "Adventure";
  if (worldId === 102) return "Bounce";
  if (worldId === 103) return "Sky Trip";
  return "Adventure";
}

/** Friendly chip label per Pre-K world for level cards. */
export function getNabuHelpChip(_worldId: number): string {
  return "Benny 🐶";
}

const isNabuWorld = (worldId: number) =>
  worldId === 101 || worldId === 102 || worldId === 103;

export const isNabuPreKWorld = isNabuWorld;

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
    4: "Brave Benny",
    5: "Big Sky Adventure",
  },
};

export function getNabuLevelTitle(
  worldId: number,
  levelId: number
): string | null {
  if (!isNabuWorld(worldId)) return null;
  return LEVEL_MISSION_TITLES[worldId]?.[levelId] ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// Demo override: lets a Patrick-style 3-level walkthrough show the "sun" word
// in World 101 Level 3 WITHOUT mutating the published curriculum sequence.
// Activated by either ?nabu_demo=1 in the URL or localStorage flag.
// Default is OFF so all classrooms continue with the existing word banks.
// ────────────────────────────────────────────────────────────────────────────
const isDemoModeOn = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("nabu_demo") === "1") return true;
    return window.localStorage.getItem("nabu_prek_demo") === "1";
  } catch {
    return false;
  }
};

export function getNabuDemoWords(worldId: number, levelId: number): string[] | null {
  if (!isDemoModeOn()) return null;
  if (worldId === 101 && levelId === 3) return ["sun"];
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Per-level copy. Falls back to a friendly default per world.
// ────────────────────────────────────────────────────────────────────────────
const WORLD_DEFAULT: Record<number, NabuLevelCopy> = {
  101: {
    title: "Adventure with Benny",
    prompt: "Read the word to help Benny!",
    hint: "✨ Your voice helps Benny!",
    successMessage: "You helped Benny!",
  },
  102: {
    title: "Sky Adventure with Benny",
    prompt: "Read the word to help Benny bounce!",
    hint: "✨ Your voice helps Benny!",
    successMessage: "You helped Benny bounce!",
  },
  103: {
    title: "Big Sky Adventure",
    prompt: "Read the word to help Benny!",
    hint: "✨ Your voice helps Benny!",
    successMessage: "You helped Benny!",
  },
};

const LEVEL_OVERRIDES: Record<string, NabuLevelCopy> = {};

export function getNabuLevelCopy(
  worldId: number,
  levelId: number
): NabuLevelCopy | null {
  if (!isNabuWorld(worldId)) return null;
  const key = `${worldId}:${levelId}`;
  return LEVEL_OVERRIDES[key] ?? WORLD_DEFAULT[worldId] ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// Episode shell copy (legacy, kept for K-12 wrapper compatibility — Pre-K
// flow now bypasses these overlays and uses NabuAdventure's own narration).
// ────────────────────────────────────────────────────────────────────────────
export interface NabuEpisodeIntro {
  line: string;
  cta: string;
}

export interface NabuEpisodeOutro {
  line: string;
  title: string;
}

const WORLD_FALLBACK_INTRO: Record<number, NabuEpisodeIntro> = {
  101: { line: "Let's help Benny!", cta: "Help Benny" },
  102: { line: "Let's help Benny!", cta: "Help Benny" },
  103: { line: "Let's help Benny!", cta: "Help Benny" },
};

const WORLD_FALLBACK_OUTRO: Record<number, NabuEpisodeOutro> = {
  101: { title: "Great job!", line: "You helped Benny!" },
  102: { title: "Great job!", line: "You helped Benny!" },
  103: { title: "Great job!", line: "You helped Benny!" },
};

export function getEpisodeOpening(worldId: number, levelId: number): NabuEpisodeIntro | null {
  if (!isNabuWorld(worldId)) return null;
  void levelId;
  return WORLD_FALLBACK_INTRO[worldId] ?? null;
}

export function getEpisodeCelebration(worldId: number, levelId: number): NabuEpisodeOutro | null {
  if (!isNabuWorld(worldId)) return null;
  void levelId;
  return WORLD_FALLBACK_OUTRO[worldId] ?? null;
}
