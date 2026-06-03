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
// Pre-K mission titles for level cards. Short, emotionally readable; replaces
// the technical story.title only when world.mode === 'prek'.
// ────────────────────────────────────────────────────────────────────────────
const LEVEL_MISSION_TITLES: Record<number, Record<number, string>> = {
  101: {
    1: "Find the First Sound",
    2: "Light Up the Houses",
    3: "Wake Up the Village",
    4: "Help the Sleepy Shushie",
    5: "Big Day: Village Morning",
  },
  102: {
    1: "Help Bobo Jump",
    2: "Bobo's Silly Spin",
    3: "Bobo Finds His Clap",
    4: "Bobo Hops Again",
    5: "Big Day: Bobo's Bounce Party",
  },
  103: {
    1: "Echo Needs Help",
    2: "Echo Finds Her Voice",
    3: "Help Echo Say It",
    4: "Echo Feels Brave",
    5: "Big Day: Echo Lights Up",
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
  // World 101 — Wake the village (DEMO MOMENT C)
  "101:3": {
    title: "Wake Up the Village",
    prompt: "The village is sleepy. Read 'sun' to wake it up.",
    ctaLabel: "Wake the Village",
    hint: "✨ Your voice wakes the village!",
    successMessage: "Your voice woke up the village!",
  },

  // World 102 — Bobo (DEMO MOMENT B)
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

  // World 103 — Echo (DEMO MOMENT A)
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

// ────────────────────────────────────────────────────────────────────────────
// Episode shell copy — Nabu the Owl is the persistent lead.
// Every Pre-K level (15 total across worlds 101/102/103) opens with a problem
// Nabu states out loud and closes with a celebration. Cosmetic + audio only.
// ────────────────────────────────────────────────────────────────────────────
export interface NabuEpisodeIntro {
  /** Nabu's spoken/displayed line that sets up the problem. Short. */
  line: string;
  /** Big tap-anywhere CTA on the intro card. */
  cta: string;
}

export interface NabuEpisodeOutro {
  /** Nabu's celebration line. Short. */
  line: string;
  /** A short sticker-style episode title shown above the line. */
  title: string;
}

const EPISODE_INTROS: Record<string, NabuEpisodeIntro> = {
  // World 101 — Nabu Village
  "101:1": { line: "Nabu Village is so sleepy! Will you help me wake it up?", cta: "Help Nabu" },
  "101:2": { line: "The houses are still dark. Let's turn the lights on with our words!", cta: "Light the houses" },
  "101:3": { line: "The sun is hiding! Say the word and we'll wake the village together.", cta: "Wake the village" },
  "101:4": { line: "A little Sleepy Shushie is yawning. Our voice can help him wake up!", cta: "Help the Shushie" },
  "101:5": { line: "It's almost morning in Nabu Village! Let's finish waking everyone up.", cta: "Start the morning" },

  // World 102 — Bobo
  "102:1": { line: "Oh no — Bobo forgot how to JUMP! Can you remind him?", cta: "Help Bobo jump" },
  "102:2": { line: "Bobo wants to spin, but he's wobbly. Let's help him with our voice!", cta: "Help Bobo spin" },
  "102:3": { line: "Bobo's clap is gone! Read with me and let's bring it back.", cta: "Help Bobo clap" },
  "102:4": { line: "Bobo wants to hop home. Our words can show him the way!", cta: "Help Bobo hop" },
  "102:5": { line: "Bobo is throwing a bounce party — but he needs all his moves!", cta: "Start the party" },

  // World 103 — Echo
  "103:1": { line: "Echo is stuck in a sound bubble! Say the words with me to set her free.", cta: "Help Echo" },
  "103:2": { line: "Echo is too shy to speak. Will you help her find her voice?", cta: "Find Echo's voice" },
  "103:3": { line: "Echo wants to say something! Read with me so she can speak too.", cta: "Help Echo say it" },
  "103:4": { line: "Echo is feeling braver. Let's help her say it nice and loud!", cta: "Cheer for Echo" },
  "103:5": { line: "Echo is ready to shine! One more story together?", cta: "Help Echo shine" },
};

const EPISODE_OUTROS: Record<string, NabuEpisodeOutro> = {
  "101:1": { title: "The Village Wakes Up", line: "You woke up Nabu Village! Yay!" },
  "101:2": { title: "Lights On!",            line: "Look — all the houses are glowing!" },
  "101:3": { title: "Here Comes the Sun",    line: "Your voice woke up the sun!" },
  "101:4": { title: "Shushie Smiles",        line: "The little Shushie isn't sleepy anymore!" },
  "101:5": { title: "Good Morning, Village", line: "Nabu Village is wide awake — thanks to you!" },

  "102:1": { title: "Bobo Bounces Back",    line: "Bobo can JUMP again!" },
  "102:2": { title: "Bobo Spins!",          line: "Whee! Bobo is spinning like a top!" },
  "102:3": { title: "Bobo's Clap Returns",  line: "Bobo can clap again — and so can we!" },
  "102:4": { title: "Bobo Hops Home",       line: "You helped Bobo hop all the way home!" },
  "102:5": { title: "Bounce Party!",        line: "Bobo's whole bounce party is dancing!" },

  "103:1": { title: "Echo Is Free",         line: "Pop! Echo's sound bubble is gone!" },
  "103:2": { title: "Echo's Voice",         line: "Echo found her voice! Listen — she sounds happy!" },
  "103:3": { title: "Echo Speaks",          line: "Echo said it out loud! Great job!" },
  "103:4": { title: "Brave Echo",           line: "Echo isn't shy anymore. You helped her!" },
  "103:5": { title: "Echo Lights Up",       line: "Echo is shining bright — because of you!" },
};

const WORLD_FALLBACK_INTRO: Record<number, NabuEpisodeIntro> = {
  101: { line: "Nabu Village needs your voice!", cta: "Help Nabu" },
  102: { line: "Bobo needs your help!", cta: "Help Bobo" },
  103: { line: "Echo needs your help!", cta: "Help Echo" },
};

const WORLD_FALLBACK_OUTRO: Record<number, NabuEpisodeOutro> = {
  101: { title: "We did it!", line: "Your voice helped Nabu Village!" },
  102: { title: "We did it!", line: "You helped Bobo!" },
  103: { title: "We did it!", line: "You helped Echo!" },
};

export function getEpisodeOpening(worldId: number, levelId: number): NabuEpisodeIntro | null {
  if (!isNabuWorld(worldId)) return null;
  return EPISODE_INTROS[`${worldId}:${levelId}`] ?? WORLD_FALLBACK_INTRO[worldId] ?? null;
}

export function getEpisodeCelebration(worldId: number, levelId: number): NabuEpisodeOutro | null {
  if (!isNabuWorld(worldId)) return null;
  return EPISODE_OUTROS[`${worldId}:${levelId}`] ?? WORLD_FALLBACK_OUTRO[worldId] ?? null;
}
