// Pre-K Video Adventures — the new cinematic gameplay loop.
//
// A level is a flat ordered list of STEPS:
//   - { kind: "clip", video } — play a video, advance when it ends.
//   - { kind: "word", word, askLine, successLine } — freeze on the last
//     frame of the previous clip, narrate the cloze stem ("I need to..."),
//     show the word card, listen on the mic, advance when the kid says the
//     word (or after a 3-strike auto-pass).
//
// Authoring a new level: film clips, drop them in, list them in order.
// No engineering required.

import L1_O1_A from "@/assets/L1-O1-A.mp4.asset.json";
import L1_O1_B from "@/assets/L1-O1-B.mp4.asset.json";
import L1_O1_A_LAST from "@/assets/L1-O1-A-last.jpg.asset.json";
import L1_O2_A from "@/assets/L1-O2-A.mp4.asset.json";
import L1_O2_B from "@/assets/L1-O2-B.mp4.asset.json";
import L1_O2_A_LAST from "@/assets/L1-O2-A-last.jpg.asset.json";
import L1_O3_A from "@/assets/L1-O3-A.mp4.asset.json";
import L1_O3_B from "@/assets/L1-O3-B.mp4.asset.json";
import L1_O3_A_LAST from "@/assets/L1-O3-A-last.jpg.asset.json";

export type VideoStep =
  | { kind: "clip"; src: string; poster?: string }
  | {
      kind: "word";
      word: string;
      /** Cloze stem narrated on the frozen frame — ends with "..." so TTS pauses. */
      askLine: string;
      /** Spoken after the kid reads the word, during the next clip. */
      successLine?: string;
    };

export interface VideoLevel {
  /** Unique level id used for AURA telemetry context. */
  id: string;
  /** Big mission goal — shown in header pill. */
  goal: string;
  /** Final celebration line spoken at the end. */
  endingLine: string;
  steps: VideoStep[];
}

// ============================================================================
// W101_L1 — "Help Benny visit Grandma!"
// Obstacles 1 (JUMP), 2 (BOOTS), 3 (KEY) have full A+B clips.
// Obstacles 4 (HOP) and 5 (BONE) hold on the previous frame until filmed.
// ============================================================================

const W101_L1: VideoLevel = {
  id: "w101-l1",
  goal: "Help Benny visit Grandma!",
  endingLine: "We made it to Grandma's!",
  steps: [
    // — Obstacle 1: JUMP the river —
    { kind: "clip", src: L1_O1_A.url, poster: L1_O1_A_LAST.url },
    {
      kind: "word",
      word: "JUMP",
      askLine: "I need to...",
      successLine: "Whoosh! Over we go!",
    },
    { kind: "clip", src: L1_O1_B.url },

    // — Obstacle 2: BOOTS for the muddy field —
    { kind: "clip", src: L1_O2_A.url, poster: L1_O2_A_LAST.url },
    {
      kind: "word",
      word: "BOOTS",
      askLine: "My feet need big...",
      successLine: "Big boots! Splish splash!",
    },
    { kind: "clip", src: L1_O2_B.url },

    // — Obstacle 3: KEY to open the gate —
    { kind: "clip", src: L1_O3_A.url, poster: L1_O3_A_LAST.url },
    {
      kind: "word",
      word: "KEY",
      askLine: "To open the gate I need a...",
      successLine: "Click! The gate is open!",
    },
    { kind: "clip", src: L1_O3_B.url },

    // — Obstacle 4 & 5: audio + word card only until clips are filmed —
    {
      kind: "word",
      word: "HOP",
      askLine: "Help me jump and...",
      successLine: "Hop hop! Path is clear!",
    },
    {
      kind: "word",
      word: "BONE",
      askLine: "Give the puppy a...",
      successLine: "Yum! The puppy runs to play!",
    },
  ],
};

const LEVELS: Record<string, VideoLevel> = {
  "101:1": W101_L1,
};

export function getVideoLevel(worldId: number, levelId: number | string): VideoLevel | null {
  return LEVELS[`${worldId}:${levelId}`] ?? null;
}

/** True only for levels we've fully migrated to the cinematic video runner. */
export function hasVideoLevel(worldId: number, levelId: number | string): boolean {
  return getVideoLevel(worldId, levelId) !== null;
}
