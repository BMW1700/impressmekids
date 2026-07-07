// Pre-K (Ages 3-5) word banks for the One-Word Reader.
// No stories, no comprehension — just one big word per screen.
// World 101: Sight Words.    World 102: Action Verbs (animation-mapped).    World 103: Two-Word Phrases.

export type PreKLevelContent =
  | { kind: "single"; words: string[]; emojiHints?: Record<string, string> }
  | { kind: "phrase"; phrases: string[] };

export const PREK_WORLD_FIRST_WORDS = 101;
export const PREK_WORLD_ACTION_TIME = 102;
export const PREK_WORLD_PHRASES = 103;

const EMOJI_HINTS: Record<string, string> = {
  // sight words with picturable meaning
  i: "👤", a: "🅰️", the: "📘", is: "✅", my: "🤲", you: "👉", me: "👇",
  see: "👀", go: "🏁", up: "⬆️", down: "⬇️", in: "📥", on: "🔝",
  big: "🟦", little: "🔹", yes: "👍", no: "🙅", and: "➕", to: "➡️",
  // verbs (also mapped to animations)
  jump: "🦘", spin: "🌀", flip: "🔄", shrink: "🔻", grow: "🌱", hop: "🐰",
  dance: "💃", wiggle: "🪱", clap: "👏", run: "🏃", eat: "🍎", drink: "🥤",
  sleep: "😴", sing: "🎵", fly: "🦋", wave: "👋", hug: "🤗", kiss: "💋",
  paint: "🎨", cook: "🍳", wash: "🫧", brush: "🪥", build: "🔨", plant: "🌱",
};

// World 101: First Words (sight words)
const WORLD_101: Record<number, string[]> = {
  1: ["I", "a", "the"],
  2: ["my", "you", "me"],
  3: ["see", "go", "up", "down"],
  4: ["in", "on", "yes", "no"],
  5: ["big", "little", "and", "to", "is"], // boss
};

// World 102: Action Time (every word has a verb animation)
const WORLD_102: Record<number, string[]> = {
  1: ["jump", "hop", "run"],
  2: ["spin", "flip", "twirl"],
  3: ["clap", "wave", "dance"],
  4: ["eat", "drink", "sleep"],
  5: ["grow", "shrink", "fly", "sing", "wiggle"], // boss
};

// World 103: Word + Picture (two-word phrases with verb-phrase mappings).
// A few friendly object phrases are added to early levels — preschool-relatable
// words (teddy, dog, cookie, ball) per the Yubi story shell.
const WORLD_103: Record<number, string[]> = {
  1: ["help me", "help you", "my teddy"],
  2: ["my dog", "your dog", "big dog"],
  3: ["in the box", "on the box", "my ball"],
  4: ["drink water", "eat apple", "hot cookie"],
  5: ["wash hands", "plant seed", "throw ball"], // boss
};

export function getPreKContent(worldId: number, levelId: number): PreKLevelContent {
  if (worldId === PREK_WORLD_FIRST_WORDS) {
    return { kind: "single", words: WORLD_101[levelId] ?? WORLD_101[1], emojiHints: EMOJI_HINTS };
  }
  if (worldId === PREK_WORLD_ACTION_TIME) {
    return { kind: "single", words: WORLD_102[levelId] ?? WORLD_102[1], emojiHints: EMOJI_HINTS };
  }
  if (worldId === PREK_WORLD_PHRASES) {
    return { kind: "phrase", phrases: WORLD_103[levelId] ?? WORLD_103[1] };
  }
  return { kind: "single", words: [], emojiHints: EMOJI_HINTS };
}

export function isPreKWorldId(worldId: number): boolean {
  return (
    worldId === PREK_WORLD_FIRST_WORDS ||
    worldId === PREK_WORLD_ACTION_TIME ||
    worldId === PREK_WORLD_PHRASES
  );
}
