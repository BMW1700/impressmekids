// Verb animation library for AURA Battle Mode.
// Tier 1 = transform applied to enemy sprite wrapper (framer-motion variant).
// Tier 2 = transient emoji prop overlay rendered by VerbAnimationLayer.
//
// Reading still gates damage; verb animation is a reward layer painted on top.

import type { TargetAndTransition, Transition } from "framer-motion";

export type TransformVerbDescriptor = {
  kind: "transform";
  animate: TargetAndTransition;
  transition?: Transition;
};

export type EmojiPropDescriptor = {
  kind: "emoji";
  emoji: string;
  /** Starting offset relative to enemy center, in px. */
  from: { x: number; y: number };
  /** Ending offset relative to enemy center, in px. */
  to: { x: number; y: number };
  /** Optional fade-in delay in seconds. */
  delay?: number;
  /** Total visible duration in seconds. */
  duration?: number;
  /** Final scale at the end of the motion. */
  endScale?: number;
  /** Starting scale. */
  startScale?: number;
  /** Optional rotation in degrees applied across the motion. */
  rotate?: number;
};

export type VerbDescriptor = TransformVerbDescriptor | EmojiPropDescriptor;

const t = (animate: TargetAndTransition, duration = 0.7): TransformVerbDescriptor => ({
  kind: "transform",
  animate: { ...animate, transition: { duration, ease: "easeInOut" } },
});

// Tier 1 — transform verbs (no art needed).
const TRANSFORM_VERBS: Record<string, TransformVerbDescriptor> = {
  flip: t({ rotateY: [0, 360] }, 0.8),
  spin: t({ rotate: [0, 720] }, 0.9),
  jump: t({ y: [0, -50, 0, -20, 0] }, 0.8),
  hop: t({ y: [0, -25, 0, -15, 0] }, 0.6),
  shrink: t({ scale: [1, 0.4, 1] }, 0.8),
  grow: t({ scale: [1, 1.6, 1] }, 0.8),
  fall: t({ y: [0, 60], rotate: [0, 90] }, 0.7),
  bounce: t({ y: [0, -30, 0, -20, 0, -10, 0] }, 0.9),
  shake: t({ x: [0, -15, 15, -10, 10, -5, 0] }, 0.6),
  tilt: t({ rotate: [0, -25, 25, 0] }, 0.6),
  wiggle: t({ rotate: [0, -10, 10, -10, 10, 0] }, 0.6),
  stretch: t({ scaleY: [1, 1.5, 1], scaleX: [1, 0.85, 1] }, 0.7),
  squish: t({ scaleY: [1, 0.5, 1], scaleX: [1, 1.3, 1] }, 0.6),
  float: t({ y: [0, -30, -30, 0] }, 1.2),
  sink: t({ y: [0, 40], opacity: [1, 0.6, 1] }, 0.9),
  zoom: t({ scale: [1, 1.4, 1], x: [0, 30, 0] }, 0.7),
  slide: t({ x: [0, 50, 0] }, 0.7),
  roll: t({ x: [0, 60, 0], rotate: [0, 360] }, 0.9),
  dance: t({ rotate: [0, -10, 10, -10, 10, 0], y: [0, -10, 0, -10, 0, 0] }, 1.0),
  freeze: {
    kind: "transform",
    animate: {
      filter: ["brightness(1)", "brightness(1.4) hue-rotate(180deg)", "brightness(1)"],
      scale: [1, 1, 1],
      transition: { duration: 1.0, ease: "easeInOut" },
    },
  },
  explode: t({ scale: [1, 1.5, 0], opacity: [1, 1, 0] }, 0.7),
};

// Tier 2 — emoji-prop verbs (one absolutely-positioned span).
const EMOJI_VERBS: Record<string, EmojiPropDescriptor> = {
  drink: { kind: "emoji", emoji: "🥤", from: { x: 40, y: 60 }, to: { x: 0, y: 0 }, duration: 1.1, endScale: 0.6 },
  eat: { kind: "emoji", emoji: "🍎", from: { x: 40, y: 60 }, to: { x: 0, y: 0 }, duration: 1.1, endScale: 0.6 },
  sleep: { kind: "emoji", emoji: "💤", from: { x: 0, y: -10 }, to: { x: 20, y: -70 }, duration: 1.4, startScale: 0.5, endScale: 1.2 },
  cry: { kind: "emoji", emoji: "💧", from: { x: -5, y: 0 }, to: { x: -5, y: 50 }, duration: 1.0 },
  laugh: { kind: "emoji", emoji: "😂", from: { x: 0, y: 0 }, to: { x: 0, y: -40 }, duration: 1.1, endScale: 1.4 },
  read: { kind: "emoji", emoji: "📖", from: { x: 0, y: 30 }, to: { x: 0, y: 10 }, duration: 1.2, endScale: 1.1 },
  run: { kind: "emoji", emoji: "💨", from: { x: 30, y: 10 }, to: { x: -50, y: 10 }, duration: 0.8 },
  throw: { kind: "emoji", emoji: "⚾", from: { x: 0, y: 0 }, to: { x: -120, y: -20 }, duration: 0.9, rotate: 720 },
  burn: { kind: "emoji", emoji: "🔥", from: { x: 0, y: 20 }, to: { x: 0, y: -30 }, duration: 1.1, endScale: 1.3 },
  sing: { kind: "emoji", emoji: "🎵", from: { x: 10, y: 0 }, to: { x: 30, y: -60 }, duration: 1.3, rotate: 30 },
  swim: { kind: "emoji", emoji: "🌊", from: { x: -40, y: 20 }, to: { x: 40, y: 20 }, duration: 1.0 },
  fly: { kind: "emoji", emoji: "🪶", from: { x: -30, y: 30 }, to: { x: 40, y: -40 }, duration: 1.2, rotate: 45 },
};

const VERB_MAP: Record<string, VerbDescriptor> = {
  ...TRANSFORM_VERBS,
  ...EMOJI_VERBS,
};

/** Strip punctuation & whitespace, lowercase. */
function clean(word: string): string {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

/** Trivial morphology: flips/flipped/flipping → flip. */
function lemmatize(word: string): string[] {
  const candidates = [word];
  if (word.endsWith("ing") && word.length > 4) {
    const root = word.slice(0, -3);
    candidates.push(root);
    // running → run (drop doubled consonant)
    if (root.length > 2 && root[root.length - 1] === root[root.length - 2]) {
      candidates.push(root.slice(0, -1));
    }
    candidates.push(root + "e"); // dancing → dance
  }
  if (word.endsWith("ed") && word.length > 3) {
    const root = word.slice(0, -2);
    candidates.push(root);
    if (root.length > 2 && root[root.length - 1] === root[root.length - 2]) {
      candidates.push(root.slice(0, -1));
    }
    candidates.push(root + "e"); // danced → dance
  }
  if (word.endsWith("s") && word.length > 2 && !word.endsWith("ss")) {
    candidates.push(word.slice(0, -1));
  }
  return candidates;
}

/** Look up a verb descriptor for a spoken/displayed word. Returns null if no match. */
export function resolveVerbAnimation(word: string): VerbDescriptor | null {
  const c = clean(word);
  if (!c) return null;
  for (const candidate of lemmatize(c)) {
    const hit = VERB_MAP[candidate];
    if (hit) return hit;
  }
  return null;
}

export const VERB_ANIMATION_KEYS = Object.keys(VERB_MAP);
