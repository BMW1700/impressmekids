// Pre-K "Nabu Village: The Lost Sounds" copy + demo overrides.
// Cosmetic layer ONLY — no game/mic/animation behavior changes.
// Worlds 101 (First Words / Wake-up), 102 (Bobo's Bouncy Day),
// 103 (Echo Needs You). Everything outside these three worlds is untouched.

export interface NabuLevelCopy {
  title: string;
  prompt: string;
  ctaLabel?: string;
  hint: string;
  successMessage: string;
}

/** Soft, non-combat name for the Pre-K "troublemaker" per world. */
export function getNabuCreatureName(worldId: number): string {
  if (worldId === 101) return "Sleepy Shushie";
  if (worldId === 102) return "Bobo";
  if (worldId === 103) return "Echo";
  return "";
}

/** Soft progress meter label per world — no HP/health framing. */
export function getNabuMeterLabel(worldId: number): string {
  if (worldId === 101) return "Village Sound";
  if (worldId === 102) return "Sound Magic";
  if (worldId === 103) return "Sleepy Spell";
  return "Sound Magic";
}

/** Friendly chip label per Pre-K world for level cards. */
export function getNabuHelpChip(worldId: number): string {
  if (worldId === 101) return "Sleepy Shushie";
  if (worldId === 102) return "Wiggle Shushie";
  if (worldId === 103) return "Sound Snatcher";
  return "Shushie";
}

const isNabuWorld = (worldId: number) =>
  worldId === 101 || worldId === 102 || worldId === 103;

export const isNabuPreKWorld = isNabuWorld;

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

/**
 * Returns a demo-only override word list for a given Pre-K level, or null to
 * keep the existing curriculum words. Currently only swaps World 101 Level 3
 * to a single "sun" word for the "Wake Up Nabu Village" demo beat.
 */
export function getNabuDemoWords(worldId: number, levelId: number): string[] | null {
  if (!isDemoModeOn()) return null;
  if (worldId === 101 && levelId === 3) return ["sun"];
  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Per-level copy. Falls back to a friendly default per world when a specific
// (worldId, levelId) is not in the table.
// ────────────────────────────────────────────────────────────────────────────
const WORLD_DEFAULT: Record<number, NabuLevelCopy> = {
  101: {
    title: "Wake Up Nabu Village",
    prompt: "Your voice makes Nabu Village shine!",
    hint: "✨ Your voice makes magic!",
    successMessage: "Your voice helped Nabu Village!",
  },
  102: {
    title: "Bobo's Bouncy Day",
    prompt: "Read it to help Bobo!",
    hint: "✨ Your voice makes magic!",
    successMessage: "You brought the sound back!",
  },
  103: {
    title: "Echo Needs You",
    prompt: "Echo is shy. Your voice makes Echo brave!",
    hint: "✨ Your voice makes magic!",
    successMessage: "You helped Echo feel brave!",
  },
};

const LEVEL_OVERRIDES: Record<string, NabuLevelCopy> = {
  // World 101 — Wake the village
  "101:3": {
    title: "Wake Up Nabu Village",
    prompt: "The village is sleepy. Read 'sun' to wake it up.",
    ctaLabel: "Wake the Village",
    hint: "✨ Your voice wakes the village!",
    successMessage: "Your voice woke up the village!",
  },

  // World 102 — Bobo (jump level)
  "102:1": {
    title: "Bobo Lost His Jump",
    prompt: "Bobo forgot how to jump! Read 'jump' to help him bounce.",
    ctaLabel: "Help Bobo Jump",
    hint: "✨ Help Bobo bounce again!",
    successMessage: "Bobo can jump again!",
  },
  "102:3": {
    title: "Bobo Lost His Clap",
    prompt: "Bobo's clap is gone! Read 'clap' to bring it back.",
    ctaLabel: "Help Bobo Clap",
    hint: "✨ Bring Bobo's clap back!",
    successMessage: "Bobo can clap again!",
  },

  // World 103 — Echo
  "103:1": {
    title: "Echo Needs Help",
    prompt: "Echo is stuck in a sound bubble! Read 'help me' to help Echo.",
    ctaLabel: "Help Echo",
    hint: "✨ Help Echo feel brave!",
    successMessage: "You helped Echo feel brave!",
  },
};

export function getNabuLevelCopy(
  worldId: number,
  levelId: number
): NabuLevelCopy | null {
  if (!isNabuWorld(worldId)) return null;
  const key = `${worldId}:${levelId}`;
  return LEVEL_OVERRIDES[key] ?? WORLD_DEFAULT[worldId] ?? null;
}
