// Pre-K signature verb animations.
// Each Pre-K word/phrase gets a unique, instantly-recognizable mini-scene built from
// multiple emoji props + a matching character body transform + an optional action label.
// Shared verbAnimations.ts stays lean for grades 6–12 battle mode; this layer only runs
// inside RPGOneWordReader (Pre-K worlds 102 / 103).

import type {
  CompoundVerbDescriptor,
  EmojiPropDescriptor,
  TransformVerbDescriptor,
} from "./verbAnimations";
import type { TargetAndTransition } from "framer-motion";

const tx = (animate: TargetAndTransition, duration = 1.2): TransformVerbDescriptor => ({
  kind: "transform",
  animate: { ...animate, transition: { duration, ease: "easeInOut" } },
});

const prop = (
  emoji: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
  opts: Partial<EmojiPropDescriptor> = {}
): EmojiPropDescriptor => ({
  kind: "emoji",
  emoji,
  from,
  to,
  duration: 1.4,
  startScale: 0.6,
  endScale: 1,
  ...opts,
});

// Visual conventions for Pre-K clarity:
//   🧒  = "me / I / my"   (always placed AT or NEAR the character anchor)
//   🧑  = "you / your"     (always placed AWAY, off to the right)
//   👉  = directional arrow showing WHICH person is being talked about
//   Bold colored label calls out the key word ("ME!", "YOU!", "IN", "ON")

const PREK_VERBS: Record<string, CompoundVerbDescriptor> = {
  // ─── World 102 verbs ────────────────────────────────────────────
  jump: {
    kind: "compound",
    duration: 1.8,
    label: { text: "JUMP!", color: "#f59e0b" },
    transform: tx({ y: [0, -80, 0, -30, 0], scaleY: [1, 1, 0.7, 1, 1] }, 1.6),
    props: [
      prop("⬆️", { x: 0, y: -10 }, { x: 0, y: -90 }, { duration: 0.6, delay: 0.0, endScale: 1.4 }),
      prop("💨", { x: -25, y: 50 }, { x: -55, y: 60 }, { duration: 0.8, delay: 1.0, endScale: 1.3 }),
      prop("💨", { x: 25, y: 50 }, { x: 55, y: 60 }, { duration: 0.8, delay: 1.0, endScale: 1.3 }),
    ],
  },
  hop: {
    kind: "compound",
    duration: 1.7,
    label: { text: "HOP!", color: "#10b981" },
    transform: tx({ y: [0, -35, 0, -30, 0, -25, 0], x: [0, 5, 10, 15, 20, 25, 30] }, 1.5),
    props: [
      prop("🐰", { x: -50, y: 20 }, { x: 50, y: 20 }, { duration: 1.5, endScale: 1.3 }),
    ],
  },
  run: {
    kind: "compound",
    duration: 1.6,
    label: { text: "RUN!", color: "#ef4444" },
    transform: tx({ x: [0, -8, -4, -8, -4, 0], rotate: [0, -5, -8, -5, 0] }, 1.4),
    props: [
      prop("🏃", { x: 0, y: 0 }, { x: -100, y: 0 }, { duration: 1.4, endScale: 1.4 }),
      prop("💨", { x: 20, y: 10 }, { x: -90, y: 10 }, { duration: 0.8, delay: 0.2 }),
      prop("💨", { x: 20, y: -5 }, { x: -90, y: -5 }, { duration: 0.8, delay: 0.5, endScale: 0.8 }),
    ],
  },
  spin: {
    kind: "compound",
    duration: 1.5,
    label: { text: "SPIN!", color: "#8b5cf6" },
    transform: tx({ rotate: [0, 720] }, 1.3),
    props: [
      prop("🌀", { x: 0, y: 0 }, { x: 0, y: 0 }, { duration: 1.4, startScale: 0.4, endScale: 1.8 }),
    ],
  },
  flip: {
    kind: "compound",
    duration: 1.6,
    label: { text: "FLIP!", color: "#06b6d4" },
    transform: tx({ rotateX: [0, 360], y: [0, -40, 0] }, 1.4),
    props: [
      prop("🤸", { x: -60, y: 0 }, { x: 60, y: 0 }, { duration: 1.4, rotate: 360, endScale: 1.4 }),
    ],
  },
  twirl: {
    kind: "compound",
    duration: 1.7,
    label: { text: "TWIRL!", color: "#ec4899" },
    transform: tx({ rotate: [0, 540], scaleX: [1, 0.95, 1, 0.95, 1] }, 1.5),
    props: [
      prop("💃", { x: 0, y: 0 }, { x: 0, y: 0 }, { duration: 1.5, rotate: 360, endScale: 1.5 }),
      prop("✨", { x: -30, y: -10 }, { x: 30, y: -10 }, { duration: 1.4, delay: 0.2, endScale: 1.2 }),
    ],
  },
  clap: {
    kind: "compound",
    duration: 1.5,
    label: { text: "CLAP!", color: "#f59e0b" },
    transform: tx({ scaleX: [1, 0.85, 1.05, 0.9, 1] }, 1.3),
    props: [
      prop("👏", { x: -70, y: 10 }, { x: -10, y: 10 }, { duration: 0.4, delay: 0.0, endScale: 1.4 }),
      prop("👏", { x: 70, y: 10 }, { x: 10, y: 10 }, { duration: 0.4, delay: 0.0, endScale: 1.4 }),
      prop("👏", { x: -70, y: 10 }, { x: -10, y: 10 }, { duration: 0.4, delay: 0.6, endScale: 1.4 }),
      prop("👏", { x: 70, y: 10 }, { x: 10, y: 10 }, { duration: 0.4, delay: 0.6, endScale: 1.4 }),
      prop("👏", { x: -70, y: 10 }, { x: -10, y: 10 }, { duration: 0.4, delay: 1.1, endScale: 1.4 }),
      prop("👏", { x: 70, y: 10 }, { x: 10, y: 10 }, { duration: 0.4, delay: 1.1, endScale: 1.4 }),
    ],
  },
  wave: {
    kind: "compound",
    duration: 1.6,
    label: { text: "HI!", color: "#3b82f6" },
    transform: tx({ rotate: [0, -8, 8, -8, 8, 0] }, 1.4),
    props: [
      prop("👋", { x: 50, y: -30 }, { x: 50, y: -30 }, { duration: 1.5, rotate: 30, endScale: 1.6 }),
    ],
  },
  dance: {
    kind: "compound",
    duration: 1.8,
    label: { text: "DANCE!", color: "#ec4899" },
    transform: tx({ rotate: [0, -12, 12, -12, 12, 0], y: [0, -8, 0, -8, 0, -8, 0] }, 1.6),
    props: [
      prop("💃", { x: -50, y: 10 }, { x: -50, y: 10 }, { duration: 1.6, endScale: 1.4 }),
      prop("🕺", { x: 50, y: 10 }, { x: 50, y: 10 }, { duration: 1.6, endScale: 1.4 }),
      prop("🎵", { x: 0, y: -10 }, { x: -40, y: -60 }, { duration: 1.4, delay: 0.3, rotate: -30 }),
      prop("🎶", { x: 0, y: -10 }, { x: 40, y: -60 }, { duration: 1.4, delay: 0.5, rotate: 30 }),
    ],
  },
  eat: {
    kind: "compound",
    duration: 1.6,
    label: { text: "YUM!", color: "#f59e0b" },
    transform: tx({ scale: [1, 1.05, 0.95, 1.05, 1] }, 1.4),
    props: [
      prop("🍎", { x: 60, y: 0 }, { x: 0, y: -10 }, { duration: 0.7, delay: 0.0, endScale: 0.6 }),
      prop("👄", { x: 0, y: -10 }, { x: 0, y: -10 }, { duration: 0.5, delay: 0.7, endScale: 1.2 }),
      prop("😋", { x: 0, y: -30 }, { x: 0, y: -55 }, { duration: 0.8, delay: 0.9, endScale: 1.4 }),
    ],
  },
  drink: {
    kind: "compound",
    duration: 1.6,
    label: { text: "GULP!", color: "#0ea5e9" },
    transform: tx({ rotate: [0, -12, -12, 0] }, 1.4),
    props: [
      prop("🥤", { x: 60, y: 30 }, { x: 5, y: -10 }, { duration: 0.8, delay: 0.0, rotate: -45, endScale: 1.1 }),
      prop("💧", { x: 5, y: -10 }, { x: 5, y: 20 }, { duration: 0.5, delay: 0.9 }),
      prop("💧", { x: 10, y: -10 }, { x: 10, y: 25 }, { duration: 0.5, delay: 1.1 }),
    ],
  },
  sleep: {
    kind: "compound",
    duration: 1.9,
    label: { text: "ZZZ", color: "#6366f1" },
    transform: tx({ rotate: [0, 18, 18, 18, 0], scale: [1, 0.98, 0.98, 0.98, 1] }, 1.7),
    props: [
      prop("🛏️", { x: 0, y: 50 }, { x: 0, y: 50 }, { duration: 1.8, startScale: 1.2, endScale: 1.4 }),
      prop("💤", { x: 20, y: -10 }, { x: 35, y: -60 }, { duration: 1.0, delay: 0.3, startScale: 0.4, endScale: 1.0 }),
      prop("💤", { x: 20, y: -10 }, { x: 45, y: -75 }, { duration: 1.0, delay: 0.8, startScale: 0.4, endScale: 1.2 }),
      prop("💤", { x: 20, y: -10 }, { x: 55, y: -90 }, { duration: 1.0, delay: 1.3, startScale: 0.4, endScale: 1.4 }),
    ],
  },
  sing: {
    kind: "compound",
    duration: 1.9,
    label: { text: "LA LA!", color: "#a855f7" },
    transform: tx({ scaleY: [1, 1.1, 0.95, 1.1, 0.95, 1], y: [0, -5, 0, -5, 0] }, 1.7),
    props: [
      prop("🎤", { x: 30, y: -10 }, { x: 5, y: -15 }, { duration: 0.6, delay: 0.0, endScale: 1.2 }),
      prop("🎵", { x: 0, y: 0 }, { x: -50, y: -70 }, { duration: 1.3, delay: 0.4, rotate: -45 }),
      prop("🎶", { x: 0, y: 0 }, { x: 50, y: -70 }, { duration: 1.3, delay: 0.7, rotate: 45 }),
    ],
  },
  fly: {
    kind: "compound",
    duration: 1.9,
    label: { text: "FLY!", color: "#06b6d4" },
    transform: tx({ x: [0, 30, -30, 30, 0], y: [0, -40, -60, -40, -20], rotate: [0, -8, 8, -8, 0] }, 1.7),
    props: [
      prop("🪽", { x: -40, y: 0 }, { x: -40, y: 0 }, { duration: 1.7, endScale: 1.4 }),
      prop("🪽", { x: 40, y: 0 }, { x: 40, y: 0 }, { duration: 1.7, endScale: 1.4 }),
      prop("☁️", { x: 60, y: -40 }, { x: -80, y: -40 }, { duration: 1.6, delay: 0.2 }),
    ],
  },
  grow: {
    kind: "compound",
    duration: 1.9,
    label: { text: "GROW!", color: "#22c55e" },
    transform: tx({ scale: [1, 1.15, 1.3, 1.5, 1.7] }, 1.7),
    props: [
      prop("⬆️", { x: -50, y: -20 }, { x: -50, y: -60 }, { duration: 1.6, endScale: 1.4 }),
      prop("⬆️", { x: 50, y: -20 }, { x: 50, y: -60 }, { duration: 1.6, endScale: 1.4 }),
      prop("🌱", { x: 0, y: 60 }, { x: 0, y: 60 }, { duration: 0.5, delay: 0.0, startScale: 0.3, endScale: 0.8 }),
      prop("🌳", { x: 0, y: 40 }, { x: 0, y: 40 }, { duration: 0.6, delay: 1.0, startScale: 0.7, endScale: 1.6 }),
    ],
  },
  shrink: {
    kind: "compound",
    duration: 1.5,
    label: { text: "SMALL!", color: "#64748b" },
    transform: tx({ scale: [1, 0.7, 0.3] }, 1.4),
    props: [
      prop("⬇️", { x: -50, y: 0 }, { x: -50, y: 30 }, { duration: 1.3, endScale: 1.4 }),
      prop("⬇️", { x: 50, y: 0 }, { x: 50, y: 30 }, { duration: 1.3, endScale: 1.4 }),
    ],
  },
  wiggle: {
    kind: "compound",
    duration: 1.5,
    label: { text: "WIGGLE!", color: "#a855f7" },
    transform: tx({ rotate: [0, -15, 15, -15, 15, -10, 10, 0], x: [0, -5, 5, -5, 5, 0] }, 1.3),
    props: [
      prop("🪱", { x: -60, y: 20 }, { x: -60, y: 20 }, { duration: 1.4, rotate: 30, endScale: 1.4 }),
      prop("🪱", { x: 60, y: 20 }, { x: 60, y: 20 }, { duration: 1.4, rotate: -30, endScale: 1.4 }),
    ],
  },

  // ─── World 103 phrases — CONTRASTIVE CLARITY ──────────────────────
  // "ME / MY" → action centers ON the character (anchor). Self-marker 🧒 stays close.
  // "YOU / YOUR" → action targets the OTHER person 🧑 placed off to the right.

  "help me": {
    kind: "compound",
    duration: 2.0,
    label: { text: "ME!", color: "#ef4444" },
    transform: tx({ rotate: [0, -8, 0, -8, 0] }, 1.8),
    props: [
      // self-marker right at the character
      prop("🧒", { x: 0, y: 0 }, { x: 0, y: 0 }, { duration: 1.9, endScale: 1.6 }),
      // helping hand reaches IN toward me
      prop("🤝", { x: 90, y: 10 }, { x: 20, y: 10 }, { duration: 1.0, delay: 0.2, endScale: 1.4 }),
      // arrow points AT me
      prop("👉", { x: 80, y: -30 }, { x: 25, y: -10 }, { duration: 0.9, delay: 1.0, endScale: 1.5 }),
    ],
  },
  "help you": {
    kind: "compound",
    duration: 2.0,
    label: { text: "YOU!", color: "#3b82f6" },
    transform: tx({ rotate: [0, 8, 0, 8, 0] }, 1.8),
    props: [
      // OTHER person placed far to the right
      prop("🧑", { x: 90, y: 0 }, { x: 90, y: 0 }, { duration: 1.9, endScale: 1.6 }),
      // helping hand reaches OUT from me toward them
      prop("🤝", { x: 10, y: 10 }, { x: 70, y: 10 }, { duration: 1.0, delay: 0.2, endScale: 1.4 }),
      // arrow points AT them
      prop("👉", { x: 0, y: -30 }, { x: 70, y: -10 }, { duration: 0.9, delay: 1.0, endScale: 1.5 }),
    ],
  },
  "my dog": {
    kind: "compound",
    duration: 2.0,
    label: { text: "MINE!", color: "#ef4444" },
    transform: tx({ y: [0, -5, 0, -5, 0] }, 1.8),
    props: [
      // self-marker close
      prop("🧒", { x: -30, y: 0 }, { x: -30, y: 0 }, { duration: 1.9, endScale: 1.4 }),
      // dog comes TO me
      prop("🐶", { x: 100, y: 20 }, { x: 20, y: 20 }, { duration: 1.0, delay: 0.2, endScale: 1.4 }),
      // hearts connect me + dog
      prop("❤️", { x: -5, y: -20 }, { x: -5, y: -55 }, { duration: 0.8, delay: 1.1, endScale: 1.4 }),
      prop("❤️", { x: 10, y: -10 }, { x: 10, y: -45 }, { duration: 0.8, delay: 1.3, endScale: 1.2 }),
    ],
  },
  "your dog": {
    kind: "compound",
    duration: 2.0,
    label: { text: "YOURS!", color: "#3b82f6" },
    transform: tx({ rotate: [0, 5, 0] }, 1.8),
    props: [
      // me on the left
      prop("🧒", { x: -50, y: 0 }, { x: -50, y: 0 }, { duration: 1.9, endScale: 1.3 }),
      // arrow from me pointing OUT to the other side
      prop("👉", { x: -25, y: 0 }, { x: 40, y: 0 }, { duration: 0.9, delay: 0.2, endScale: 1.5 }),
      // OTHER person on the right
      prop("🧑", { x: 90, y: 0 }, { x: 90, y: 0 }, { duration: 1.9, endScale: 1.3 }),
      // their dog right next to them
      prop("🐶", { x: 70, y: 30 }, { x: 70, y: 30 }, { duration: 1.0, delay: 0.9, endScale: 1.3 }),
    ],
  },
  "in the box": {
    kind: "compound",
    duration: 2.0,
    label: { text: "IN", color: "#8b5cf6" },
    // character ducks down and disappears INTO the box
    transform: tx({ y: [0, 10, 40, 50], scale: [1, 1, 0.5, 0.3], opacity: [1, 1, 0.4, 0.1] }, 1.8),
    props: [
      // big open box
      prop("📦", { x: 0, y: 30 }, { x: 0, y: 30 }, { duration: 1.9, startScale: 1.6, endScale: 1.9 }),
      // arrow pointing DOWN into the box
      prop("⬇️", { x: 0, y: -50 }, { x: 0, y: 10 }, { duration: 0.9, delay: 0.4, endScale: 1.6 }),
    ],
  },
  "on the box": {
    kind: "compound",
    duration: 2.0,
    label: { text: "ON TOP", color: "#22c55e" },
    // character hops UP and rests on top of the box
    transform: tx({ y: [0, -50, -45, -40, -40] }, 1.8),
    props: [
      // box below
      prop("📦", { x: 0, y: 50 }, { x: 0, y: 50 }, { duration: 1.9, startScale: 1.4, endScale: 1.6 }),
      // arrow pointing UP / on top
      prop("⬆️", { x: 0, y: 10 }, { x: 0, y: -60 }, { duration: 0.9, delay: 0.4, endScale: 1.6 }),
      // sparkle on top of head to mark "standing on"
      prop("✨", { x: 0, y: -70 }, { x: 0, y: -70 }, { duration: 1.0, delay: 1.0, endScale: 1.4 }),
    ],
  },
  "drink water": {
    kind: "compound",
    duration: 1.8,
    label: { text: "DRINK!", color: "#0ea5e9" },
    transform: tx({ rotate: [0, -15, -15, 0] }, 1.6),
    props: [
      prop("🥤", { x: 60, y: 30 }, { x: 5, y: -5 }, { duration: 0.8, delay: 0.0, rotate: -45, endScale: 1.1 }),
      prop("💧", { x: 5, y: -10 }, { x: 5, y: 20 }, { duration: 0.5, delay: 0.9 }),
      prop("💧", { x: 10, y: -10 }, { x: 10, y: 25 }, { duration: 0.5, delay: 1.1 }),
      prop("💧", { x: 0, y: -10 }, { x: 0, y: 22 }, { duration: 0.5, delay: 1.3 }),
    ],
  },
  "eat apple": {
    kind: "compound",
    duration: 1.8,
    label: { text: "EAT!", color: "#ef4444" },
    transform: tx({ scale: [1, 1.05, 0.95, 1.1, 1] }, 1.6),
    props: [
      prop("🍎", { x: 60, y: 30 }, { x: 0, y: -5 }, { duration: 0.7, delay: 0.0, endScale: 0.5 }),
      prop("👄", { x: 0, y: -5 }, { x: 0, y: -5 }, { duration: 0.4, delay: 0.7, endScale: 1.2 }),
      prop("😋", { x: 0, y: -30 }, { x: 0, y: -60 }, { duration: 0.8, delay: 0.9, endScale: 1.4 }),
      prop("🍎", { x: 0, y: 0 }, { x: 0, y: 0 }, { duration: 0.4, delay: 1.0, startScale: 0.4, endScale: 0 }),
    ],
  },
  "wash hands": {
    kind: "compound",
    duration: 2.0,
    label: { text: "WASH!", color: "#0ea5e9" },
    transform: tx({ rotate: [0, -5, 5, -5, 5, 0] }, 1.8),
    props: [
      prop("🤲", { x: 0, y: 20 }, { x: 0, y: 20 }, { duration: 1.9, endScale: 1.5 }),
      prop("💧", { x: 0, y: -50 }, { x: 0, y: 10 }, { duration: 0.8, delay: 0.0, endScale: 1.2 }),
      prop("🫧", { x: -30, y: 20 }, { x: 30, y: 0 }, { duration: 1.2, delay: 0.5, endScale: 1.3 }),
      prop("🫧", { x: 30, y: 20 }, { x: -30, y: 0 }, { duration: 1.2, delay: 0.7, endScale: 1.3 }),
      prop("✨", { x: 0, y: 30 }, { x: 0, y: -10 }, { duration: 0.8, delay: 1.3, endScale: 1.3 }),
    ],
  },
  "plant seed": {
    kind: "compound",
    duration: 2.0,
    label: { text: "PLANT!", color: "#22c55e" },
    transform: tx({ y: [0, 10, 0] }, 1.8),
    props: [
      // hand drops the seed
      prop("🤲", { x: 0, y: -30 }, { x: 0, y: -30 }, { duration: 0.6, endScale: 1.3 }),
      prop("🌰", { x: 0, y: -20 }, { x: 0, y: 50 }, { duration: 0.8, delay: 0.2, endScale: 1.1 }),
      // dirt
      prop("🟫", { x: 0, y: 60 }, { x: 0, y: 60 }, { duration: 1.9, startScale: 1.4, endScale: 1.6 }),
      // sprout grows up
      prop("🌱", { x: 0, y: 50 }, { x: 0, y: 30 }, { duration: 0.8, delay: 1.1, startScale: 0.3, endScale: 1.3 }),
    ],
  },
  "throw ball": {
    kind: "compound",
    duration: 1.7,
    label: { text: "THROW!", color: "#f59e0b" },
    transform: tx({ rotate: [0, -20, 10, 0], x: [0, 15, 0, 0] }, 1.5),
    props: [
      // arm motion line
      prop("💪", { x: 30, y: 0 }, { x: 30, y: 0 }, { duration: 0.5, endScale: 1.4 }),
      // ball flies far away in an arc
      prop("⚾", { x: 20, y: 0 }, { x: -140, y: -40 }, { duration: 1.2, delay: 0.3, rotate: 720, endScale: 0.7 }),
      prop("💨", { x: 0, y: 0 }, { x: -100, y: -20 }, { duration: 0.8, delay: 0.5 }),
    ],
  },
};

/** Lowercase, collapse whitespace, strip punctuation. */
function normalize(input: string): string {
  return input.toLowerCase().replace(/[^a-z\s]/g, "").trim().replace(/\s+/g, " ");
}

/** Return a Pre-K signature scene for a word/phrase, or null if none defined. */
export function resolvePreKVerb(input: string): CompoundVerbDescriptor | null {
  if (!input) return null;
  const key = normalize(input);
  if (!key) return null;
  if (PREK_VERBS[key]) return PREK_VERBS[key];
  // Try first word for unknown phrases
  if (key.includes(" ")) {
    const first = key.split(" ")[0];
    if (PREK_VERBS[first]) return PREK_VERBS[first];
  }
  return null;
}
