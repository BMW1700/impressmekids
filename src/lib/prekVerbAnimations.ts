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

const PREK_VERBS: Record<string, CompoundVerbDescriptor> = {
  // ─── World 102 verbs ────────────────────────────────────────────
  jump: {
    kind: "compound",
    duration: 1.6,
    label: { text: "BOING!", color: "#f59e0b" },
    transform: tx({ y: [0, -70, 0, -25, 0], scaleY: [1, 1, 0.7, 1, 1] }, 1.4),
    props: [
      prop("💨", { x: -25, y: 50 }, { x: -55, y: 60 }, { duration: 0.8, delay: 1.0, endScale: 1.3 }),
      prop("💨", { x: 25, y: 50 }, { x: 55, y: 60 }, { duration: 0.8, delay: 1.0, endScale: 1.3 }),
    ],
  },
  hop: {
    kind: "compound",
    duration: 1.6,
    transform: tx({ y: [0, -30, 0, -25, 0, -20, 0] }, 1.4),
    props: [
      prop("🐰", { x: 70, y: 0 }, { x: 70, y: 0 }, { duration: 1.4, endScale: 1.2 }),
    ],
  },
  run: {
    kind: "compound",
    duration: 1.5,
    transform: tx({ x: [0, -8, -4, -8, -4, 0], rotate: [0, -5, -8, -5, 0] }, 1.3),
    props: [
      prop("💨", { x: 20, y: 10 }, { x: -90, y: 10 }, { duration: 0.8, delay: 0.0 }),
      prop("💨", { x: 20, y: 0 }, { x: -90, y: 0 }, { duration: 0.8, delay: 0.3, endScale: 0.8 }),
      prop("💨", { x: 20, y: 20 }, { x: -90, y: 20 }, { duration: 0.8, delay: 0.6, endScale: 0.7 }),
    ],
  },
  spin: {
    kind: "compound",
    duration: 1.4,
    transform: tx({ rotate: [0, 720] }, 1.2),
    props: [
      prop("🌀", { x: 0, y: 0 }, { x: 0, y: 0 }, { duration: 1.3, startScale: 0.4, endScale: 1.6 }),
    ],
  },
  flip: {
    kind: "compound",
    duration: 1.5,
    transform: tx({ rotateX: [0, 360], y: [0, -30, 0] }, 1.3),
    props: [
      prop("⭐", { x: -40, y: -20 }, { x: 40, y: -20 }, { duration: 1.0, rotate: 360, endScale: 1.2 }),
    ],
  },
  twirl: {
    kind: "compound",
    duration: 1.6,
    transform: tx({ rotate: [0, 540], scaleX: [1, 0.95, 1, 0.95, 1] }, 1.4),
    props: [
      prop("✨", { x: -30, y: -10 }, { x: 30, y: -10 }, { duration: 1.4, rotate: 360, endScale: 1.3 }),
      prop("✨", { x: 30, y: 10 }, { x: -30, y: 10 }, { duration: 1.4, delay: 0.2, rotate: -360, endScale: 1.3 }),
    ],
  },
  clap: {
    kind: "compound",
    duration: 1.5,
    label: { text: "CLAP!", color: "#ec4899" },
    transform: tx({ scaleX: [1, 0.85, 1.05, 0.9, 1] }, 1.3),
    props: [
      prop("👏", { x: -70, y: 10 }, { x: -10, y: 10 }, { duration: 0.5, delay: 0.0, endScale: 1.4 }),
      prop("👏", { x: 70, y: 10 }, { x: 10, y: 10 }, { duration: 0.5, delay: 0.0, endScale: 1.4 }),
      prop("👏", { x: -70, y: 10 }, { x: -10, y: 10 }, { duration: 0.5, delay: 0.7, endScale: 1.4 }),
      prop("👏", { x: 70, y: 10 }, { x: 10, y: 10 }, { duration: 0.5, delay: 0.7, endScale: 1.4 }),
    ],
  },
  wave: {
    kind: "compound",
    duration: 1.6,
    label: { text: "HI!", color: "#3b82f6" },
    transform: tx({ rotate: [0, -8, 8, -8, 8, 0] }, 1.4),
    props: [
      prop("👋", { x: 50, y: -30 }, { x: 50, y: -30 }, { duration: 1.5, rotate: 360, endScale: 1.4 }),
    ],
  },
  dance: {
    kind: "compound",
    duration: 1.8,
    transform: tx({ rotate: [0, -12, 12, -12, 12, 0], y: [0, -8, 0, -8, 0, -8, 0] }, 1.6),
    props: [
      prop("🎵", { x: -40, y: -10 }, { x: -50, y: -60 }, { duration: 1.4, delay: 0.0, rotate: -30 }),
      prop("🎶", { x: 40, y: -10 }, { x: 50, y: -60 }, { duration: 1.4, delay: 0.3, rotate: 30 }),
      prop("💃", { x: 0, y: 30 }, { x: 0, y: -10 }, { duration: 1.4, delay: 0.5, endScale: 1.4 }),
    ],
  },
  eat: {
    kind: "compound",
    duration: 1.5,
    transform: tx({ scale: [1, 1.05, 0.95, 1.05, 1] }, 1.3),
    props: [
      prop("🍎", { x: 60, y: 30 }, { x: 0, y: 0 }, { duration: 0.7, delay: 0.0, endScale: 0.5 }),
      prop("😋", { x: 0, y: -30 }, { x: 0, y: -55 }, { duration: 0.8, delay: 0.7, endScale: 1.4 }),
      prop("✨", { x: -10, y: 10 }, { x: -25, y: 30 }, { duration: 0.6, delay: 0.8 }),
    ],
  },
  drink: {
    kind: "compound",
    duration: 1.5,
    transform: tx({ rotate: [0, -12, -12, 0] }, 1.3),
    props: [
      prop("🥤", { x: 60, y: 30 }, { x: 5, y: -10 }, { duration: 0.8, delay: 0.0, rotate: -45, endScale: 1.0 }),
      prop("💧", { x: 5, y: 0 }, { x: 5, y: 30 }, { duration: 0.6, delay: 0.9 }),
    ],
  },
  sleep: {
    kind: "compound",
    duration: 1.8,
    label: { text: "ZZZ", color: "#6366f1" },
    transform: tx({ rotate: [0, 18, 18, 18, 0], scale: [1, 0.98, 0.98, 0.98, 1] }, 1.6),
    props: [
      prop("💤", { x: 20, y: -10 }, { x: 35, y: -60 }, { duration: 1.0, delay: 0.0, startScale: 0.4, endScale: 1.0 }),
      prop("💤", { x: 20, y: -10 }, { x: 45, y: -75 }, { duration: 1.0, delay: 0.5, startScale: 0.4, endScale: 1.2 }),
      prop("💤", { x: 20, y: -10 }, { x: 55, y: -90 }, { duration: 1.0, delay: 1.0, startScale: 0.4, endScale: 1.4 }),
    ],
  },
  sing: {
    kind: "compound",
    duration: 1.8,
    transform: tx({ scaleY: [1, 1.1, 0.95, 1.1, 0.95, 1], y: [0, -5, 0, -5, 0] }, 1.6),
    props: [
      prop("🎵", { x: 0, y: 0 }, { x: -50, y: -70 }, { duration: 1.4, delay: 0.0, rotate: -45 }),
      prop("🎶", { x: 0, y: 0 }, { x: 50, y: -70 }, { duration: 1.4, delay: 0.3, rotate: 45 }),
      prop("🎼", { x: 0, y: 0 }, { x: 0, y: -90 }, { duration: 1.4, delay: 0.6 }),
    ],
  },
  fly: {
    kind: "compound",
    duration: 1.8,
    transform: tx({ x: [0, 30, -30, 30, 0], y: [0, -30, -40, -30, 0], rotate: [0, -8, 8, -8, 0] }, 1.6),
    props: [
      prop("🪶", { x: 10, y: 10 }, { x: -50, y: 40 }, { duration: 1.2, delay: 0.4, rotate: 90 }),
    ],
  },
  grow: {
    kind: "compound",
    duration: 1.7,
    transform: tx({ scale: [1, 1.15, 1.3, 1.5, 1.6] }, 1.5),
    props: [
      prop("🌱", { x: 0, y: 60 }, { x: 0, y: 60 }, { duration: 0.5, delay: 0.0, startScale: 0.3, endScale: 0.8 }),
      prop("🌿", { x: 0, y: 50 }, { x: 0, y: 50 }, { duration: 0.5, delay: 0.5, startScale: 0.5, endScale: 1.1 }),
      prop("🌳", { x: 0, y: 40 }, { x: 0, y: 40 }, { duration: 0.6, delay: 1.0, startScale: 0.7, endScale: 1.5 }),
    ],
  },
  shrink: {
    kind: "compound",
    duration: 1.4,
    transform: tx({ scale: [1, 0.7, 0.4] }, 1.3),
    props: [
      prop("🔻", { x: 0, y: -50 }, { x: 0, y: -20 }, { duration: 1.0, endScale: 1.3 }),
    ],
  },
  wiggle: {
    kind: "compound",
    duration: 1.5,
    transform: tx({ rotate: [0, -15, 15, -15, 15, -10, 10, 0] }, 1.3),
    props: [
      prop("🪱", { x: 60, y: 20 }, { x: 60, y: 20 }, { duration: 1.4, rotate: 30, endScale: 1.3 }),
    ],
  },

  // ─── World 103 phrases ──────────────────────────────────────────
  "help me": {
    kind: "compound",
    duration: 1.6,
    transform: tx({ rotate: [0, -10, -10, 0] }, 1.4),
    props: [
      prop("🤝", { x: -60, y: 10 }, { x: 0, y: 10 }, { duration: 1.0, endScale: 1.4 }),
      prop("💞", { x: 0, y: -30 }, { x: 0, y: -55 }, { duration: 0.8, delay: 1.0, endScale: 1.3 }),
    ],
  },
  "help you": {
    kind: "compound",
    duration: 1.6,
    transform: tx({ rotate: [0, 10, 10, 0] }, 1.4),
    props: [
      prop("🤝", { x: 60, y: 10 }, { x: 0, y: 10 }, { duration: 1.0, endScale: 1.4 }),
      prop("👉", { x: 30, y: 0 }, { x: 60, y: 0 }, { duration: 0.8, delay: 1.0, endScale: 1.3 }),
    ],
  },
  "my dog": {
    kind: "compound",
    duration: 1.5,
    transform: tx({ y: [0, -5, 0, -5, 0] }, 1.3),
    props: [
      prop("🐶", { x: 60, y: 30 }, { x: 30, y: 30 }, { duration: 1.0, endScale: 1.4 }),
      prop("❤️", { x: 15, y: -20 }, { x: 15, y: -50 }, { duration: 0.8, delay: 1.0, endScale: 1.2 }),
    ],
  },
  "your dog": {
    kind: "compound",
    duration: 1.5,
    transform: tx({ y: [0, -3, 0] }, 1.3),
    props: [
      prop("👉", { x: 0, y: 0 }, { x: 50, y: 20 }, { duration: 0.8, endScale: 1.3 }),
      prop("🐶", { x: 80, y: 30 }, { x: 60, y: 30 }, { duration: 1.0, delay: 0.6, endScale: 1.4 }),
    ],
  },
  "in the box": {
    kind: "compound",
    duration: 1.6,
    transform: tx({ y: [0, -20, 30], scale: [1, 1, 0.7] }, 1.4),
    props: [
      prop("📦", { x: 0, y: 30 }, { x: 0, y: 30 }, { duration: 1.5, startScale: 1.3, endScale: 1.6 }),
    ],
  },
  "on the box": {
    kind: "compound",
    duration: 1.6,
    transform: tx({ y: [0, -40, -30], scale: [1, 1, 1] }, 1.4),
    props: [
      prop("📦", { x: 0, y: 50 }, { x: 0, y: 50 }, { duration: 1.5, startScale: 1.0, endScale: 1.4 }),
    ],
  },
  "drink water": {
    kind: "compound",
    duration: 1.6,
    transform: tx({ rotate: [0, -15, -15, 0] }, 1.4),
    props: [
      prop("💧", { x: 50, y: -30 }, { x: 5, y: -10 }, { duration: 0.7, endScale: 0.9 }),
      prop("🥤", { x: 60, y: 30 }, { x: 5, y: 0 }, { duration: 0.9, delay: 0.5, rotate: -45, endScale: 1.0 }),
    ],
  },
  "eat apple": {
    kind: "compound",
    duration: 1.7,
    transform: tx({ scale: [1, 1.05, 0.95, 1.1, 1] }, 1.5),
    props: [
      prop("🍎", { x: 60, y: 30 }, { x: 0, y: 0 }, { duration: 0.7, delay: 0.0, endScale: 0.4 }),
      prop("😋", { x: 0, y: -30 }, { x: 0, y: -55 }, { duration: 0.8, delay: 0.7, endScale: 1.4 }),
      prop("🍏", { x: 0, y: 0 }, { x: -10, y: 60 }, { duration: 0.8, delay: 1.0, endScale: 0.7, rotate: 180 }),
    ],
  },
  "wash hands": {
    kind: "compound",
    duration: 1.8,
    transform: tx({ rotate: [0, 360] }, 1.6),
    props: [
      prop("🫧", { x: -40, y: 10 }, { x: 40, y: -10 }, { duration: 1.3, delay: 0.0, endScale: 1.4 }),
      prop("🫧", { x: 40, y: 10 }, { x: -40, y: -10 }, { duration: 1.3, delay: 0.3, endScale: 1.3 }),
      prop("💧", { x: 0, y: -40 }, { x: 0, y: 30 }, { duration: 1.0, delay: 0.5 }),
      prop("✨", { x: 30, y: 30 }, { x: 50, y: 0 }, { duration: 0.8, delay: 1.0, endScale: 1.3 }),
    ],
  },
  "plant seed": {
    kind: "compound",
    duration: 1.8,
    transform: tx({ y: [0, -5, 0] }, 1.5),
    props: [
      prop("🌱", { x: 0, y: -50 }, { x: 0, y: 50 }, { duration: 0.7, delay: 0.0, startScale: 0.4, endScale: 0.8 }),
      prop("🌿", { x: 0, y: 50 }, { x: 0, y: 30 }, { duration: 0.6, delay: 0.9, startScale: 0.5, endScale: 1.2 }),
      prop("✨", { x: -20, y: 30 }, { x: -30, y: 10 }, { duration: 0.7, delay: 1.1, endScale: 1.2 }),
    ],
  },
  "throw ball": {
    kind: "compound",
    duration: 1.5,
    transform: tx({ rotate: [0, -15, 5, 0], x: [0, 10, 0, 0] }, 1.3),
    props: [
      prop("⚾", { x: 0, y: 0 }, { x: -130, y: -30 }, { duration: 1.2, rotate: 720, endScale: 0.8 }),
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
