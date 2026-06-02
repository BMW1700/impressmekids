// Pre-K signature verb animations.
// The CHARACTER itself performs every action — no floating emoji props.
// Meaning is conveyed through body motion (jump, tilt, shrink, lean, hop, spin)
// plus a bold text label that names the action/word being practiced.
//
// Visual conventions for Pre-K clarity:
//   • "ME / MY / I"   → character pulses in place, bounces toward viewer (scale up)
//   • "YOU / YOUR"    → character LEANS or moves to the RIGHT (toward where "you" stands)
//   • "IN"            → character shrinks DOWN + fades (going inside)
//   • "ON"            → character hops UP and stays elevated (on top)
//   • "HELP"          → character leans in / reaches with a tilt
// Labels are large colored text — they ARE the literacy reinforcement.

import type {
  CompoundVerbDescriptor,
  TransformVerbDescriptor,
} from "./verbAnimations";
import type { TargetAndTransition } from "framer-motion";

const tx = (animate: TargetAndTransition, duration = 1.4): TransformVerbDescriptor => ({
  kind: "transform",
  animate: { ...animate, transition: { duration, ease: "easeInOut" } },
});

const PREK_VERBS: Record<string, CompoundVerbDescriptor> = {
  // ─── World 102 verbs ────────────────────────────────────────────
  jump: {
    kind: "compound",
    duration: 1.8,
    label: { text: "JUMP!", color: "#f59e0b" },
    // crouch → explode up → land → small rebound
    transform: tx(
      { y: [0, 15, -90, 0, -25, 0], scaleY: [1, 0.7, 1.05, 0.8, 1, 1], scaleX: [1, 1.2, 0.95, 1.15, 1, 1] },
      1.7
    ),
    props: [],
  },
  hop: {
    kind: "compound",
    duration: 1.7,
    label: { text: "HOP!", color: "#10b981" },
    // little bunny-hops across the spot
    transform: tx(
      { y: [0, -30, 0, -25, 0, -20, 0], x: [0, 10, 10, 20, 20, 30, 30], scaleY: [1, 0.85, 1, 0.85, 1, 0.9, 1] },
      1.6
    ),
    props: [],
  },
  run: {
    kind: "compound",
    duration: 2.4,
    label: { text: "RUN!", color: "#ef4444" },
    // Run across the whole scene toward the blue knight on the right, with a leg-pump bob.
    transform: tx(
      {
        x: [0, 110, 220, 330, 440, 550, 650, 730],
        y: [0, -7, 0, -7, 0, -7, 0, -4],
      },
      2.3
    ),
    props: [],
  },
  spin: {
    kind: "compound",
    duration: 1.5,
    label: { text: "SPIN!", color: "#8b5cf6" },
    transform: tx({ rotate: [0, 360, 720], scale: [1, 1.05, 1] }, 1.4),
    props: [],
  },
  flip: {
    kind: "compound",
    duration: 1.6,
    label: { text: "FLIP!", color: "#06b6d4" },
    // pops up and rotates head-over-heels
    transform: tx({ rotateX: [0, 180, 360], y: [0, -50, -50, -25, 0], scale: [1, 1.05, 1] }, 1.5),
    props: [],
  },
  twirl: {
    kind: "compound",
    duration: 1.7,
    label: { text: "TWIRL!", color: "#ec4899" },
    transform: tx({ rotate: [0, 540, 720], scaleX: [1, 0.92, 1, 0.92, 1] }, 1.6),
    props: [],
  },
  clap: {
    kind: "compound",
    duration: 1.8,
    label: { text: "CLAP!", color: "#f59e0b" },
    // Subtle body bob — arms do the actual clapping inside the sprite.
    transform: tx({ y: [0, -3, 0, -3, 0, -3, 0], scale: [1, 1.02, 1, 1.02, 1, 1.02, 1] }, 1.7),
    props: [],
  },
  wave: {
    kind: "compound",
    duration: 1.8,
    label: { text: "HI!", color: "#3b82f6" },
    // Body stays still; one arm waves overhead inside the sprite.
    transform: tx({ y: [0, -3, 0, -3, 0] }, 1.7),
    props: [],
  },
  dance: {
    kind: "compound",
    duration: 2.4,
    label: { text: "DANCE!", color: "#ec4899" },
    transform: tx(
      { rotate: [0, -12, 12, -12, 12, -12, 12, 0], y: [0, -8, 0, -8, 0, -8, 0, 0] },
      2.3
    ),
    props: [],
  },
  eat: {
    kind: "compound",
    duration: 2.6,
    label: { text: "EAT!", color: "#f59e0b" },
    // Small chew bob — apple prop inside the sprite shows three bites.
    transform: tx({ scaleY: [1, 1.06, 0.96, 1.06, 0.96, 1.06, 1], y: [0, -2, 0, -2, 0, -2, 0] }, 2.5),
    props: [],
  },
  drink: {
    kind: "compound",
    duration: 3.2,
    label: { text: "GULP!", color: "#0ea5e9" },
    // Hold head back during the 3s drink — glass prop empties inside the sprite.
    transform: tx({ rotate: [0, 12, 18, 18, 18, 10, 0], y: [0, -3, -4, -4, -4, -2, 0] }, 3.1),
    props: [],
  },
  sleep: {
    kind: "compound",
    duration: 2.4,
    label: { text: "ZZZ", color: "#6366f1" },
    // Settle into the bed — bed/blanket/Z's are inside the sprite.
    transform: tx({ y: [0, 6, 14, 18, 18, 18], scale: [1, 0.98, 0.93, 0.9, 0.9, 0.9] }, 2.3),
    props: [],
  },
  sing: {
    kind: "compound",
    duration: 1.9,
    label: { text: "LA LA!", color: "#a855f7" },
    // mouth-open scale pulse on each note + happy bob
    transform: tx(
      { scaleY: [1, 1.15, 0.95, 1.15, 0.95, 1.15, 1], y: [0, -8, 0, -8, 0, -8, 0] },
      1.8
    ),
    props: [],
  },
  fly: {
    kind: "compound",
    duration: 1.9,
    label: { text: "FLY!", color: "#06b6d4" },
    // floats up, drifts side-to-side, glides back down
    transform: tx(
      { y: [0, -40, -60, -55, -40, -20, 0], x: [0, 20, -10, 25, -15, 10, 0], rotate: [0, -6, 6, -6, 6, 0] },
      1.8
    ),
    props: [],
  },
  grow: {
    kind: "compound",
    duration: 1.9,
    label: { text: "GROW!", color: "#22c55e" },
    // starts tiny, steadily grows huge
    transform: tx({ scale: [0.5, 0.7, 1, 1.3, 1.6, 1.8], y: [20, 15, 5, -5, -15, -20] }, 1.8),
    props: [],
  },
  shrink: {
    kind: "compound",
    duration: 1.6,
    label: { text: "SMALL!", color: "#64748b" },
    // starts big, shrinks down small
    transform: tx({ scale: [1.4, 1.1, 0.8, 0.5, 0.3], y: [-10, -5, 0, 10, 20] }, 1.5),
    props: [],
  },
  wiggle: {
    kind: "compound",
    duration: 1.5,
    label: { text: "WIGGLE!", color: "#a855f7" },
    transform: tx(
      { rotate: [0, -18, 18, -18, 18, -12, 12, 0], x: [0, -8, 8, -8, 8, -4, 4, 0], scaleX: [1, 0.95, 1.05, 0.95, 1.05, 1, 1, 1] },
      1.4
    ),
    props: [],
  },

  // ─── World 103 phrases — CONTRASTIVE CLARITY ──────────────────────
  // "ME / MY" → character moves/bounces TOWARD itself (pulses in place, leans LEFT/back-to-self)
  // "YOU / YOUR" → character leans/moves RIGHT (toward where "you" would stand, off-screen)

  "help me": {
    kind: "compound",
    duration: 2.0,
    label: { text: "ME!", color: "#ef4444" },
    // character pulls IN toward itself, pulses bigger ("me, me, look at me!") — no rotation
    transform: tx(
      { scale: [1, 1.15, 1.25, 1.15, 1.25, 1.1, 1], x: [0, -8, -4, -8, -4, -2, 0] },
      1.9
    ),
    props: [],
  },
  "help you": {
    kind: "compound",
    duration: 2.0,
    label: { text: "YOU!", color: "#3b82f6" },
    // character leans/reaches RIGHT (toward "you") — no rotation
    transform: tx(
      { x: [0, 15, 30, 20, 30, 15, 0], scaleX: [1, 1.05, 1.1, 1.05, 1.1, 1, 1] },
      1.9
    ),
    props: [],
  },
  "my dog": {
    kind: "compound",
    duration: 2.0,
    label: { text: "MINE!", color: "#ef4444" },
    // Gentle self-focused pulse — no rotation so the dog beside the
    // character stays visually stable.
    transform: tx(
      { scale: [1, 1.08, 1.04, 1.08, 1.04, 1.06, 1] },
      1.9
    ),
    props: [],
  },
  "your dog": {
    kind: "compound",
    duration: 2.0,
    label: { text: "YOURS!", color: "#3b82f6" },
    // Completely static — neither character should move or rotate; the
    // visual meaning comes from the yellow helper holding the leash.
    transform: tx({ scale: 1 }, 1.9),
    props: [],
  },

  "in the box": {
    kind: "compound",
    duration: 2.0,
    label: { text: "IN", color: "#8b5cf6" },
    // character SHRINKS DOWN and FADES — going inside something
    transform: tx(
      { y: [0, 5, 25, 45, 60], scale: [1, 0.85, 0.55, 0.3, 0.15], opacity: [1, 0.95, 0.7, 0.4, 0.1] },
      1.9
    ),
    props: [],
  },
  "on the box": {
    kind: "compound",
    duration: 2.0,
    label: { text: "ON TOP", color: "#22c55e" },
    // character HOPS UP and STAYS ELEVATED (on top of something)
    transform: tx(
      { y: [0, -30, -55, -50, -50, -50, -50], scaleY: [1, 0.9, 1, 1, 1, 1, 1] },
      1.9
    ),
    props: [],
  },
  "drink water": {
    kind: "compound",
    duration: 1.8,
    label: { text: "DRINK!", color: "#0ea5e9" },
    // big head-tilt back + hold (drinking from a cup), then return
    transform: tx({ rotate: [0, -35, -35, -35, -10, 0], y: [0, -5, -5, -5, -2, 0] }, 1.7),
    props: [],
  },
  "eat apple": {
    kind: "compound",
    duration: 1.8,
    label: { text: "EAT!", color: "#ef4444" },
    // chew-chew rhythm + bigger each bite
    transform: tx(
      { scaleY: [1, 1.15, 0.9, 1.2, 0.9, 1.25, 1], scaleX: [1, 0.95, 1.1, 0.95, 1.1, 0.95, 1], y: [0, -3, 0, -3, 0, -3, 0] },
      1.7
    ),
    props: [],
  },
  "wash hands": {
    kind: "compound",
    duration: 2.0,
    label: { text: "WASH!", color: "#0ea5e9" },
    // scrubbing side-to-side wiggle with little bounces (like rubbing hands together)
    transform: tx(
      { rotate: [0, -12, 12, -12, 12, -8, 8, 0], x: [0, -6, 6, -6, 6, -4, 4, 0], y: [0, -3, 0, -3, 0, -3, 0, 0] },
      1.9
    ),
    props: [],
  },
  "plant seed": {
    kind: "compound",
    duration: 2.0,
    label: { text: "PLANT!", color: "#22c55e" },
    // bend down (squat to plant), then GROW UP big
    transform: tx(
      { y: [0, 25, 25, 5, -10, -20], scale: [1, 0.85, 0.85, 1, 1.2, 1.4], scaleY: [1, 0.7, 0.7, 0.95, 1.1, 1.2] },
      1.9
    ),
    props: [],
  },
  "throw ball": {
    kind: "compound",
    duration: 1.7,
    label: { text: "THROW!", color: "#f59e0b" },
    // wind-up backward (rotate +), then big forward snap (rotate −) + lunge forward
    transform: tx(
      { rotate: [0, 20, 25, -20, -10, 0], x: [0, 10, 15, -25, -10, 0], scaleX: [1, 0.95, 0.95, 1.1, 1.05, 1] },
      1.6
    ),
    props: [],
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
