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
// First obstacle (JUMP) has real video. The other four prompts will get
// their clips dropped in as they're filmed; until then the screen holds on
// the last frame of the previous clip while the kid reads the word.
// ============================================================================

const W101_L1: VideoLevel = {
  id: "w101-l1",
  goal: "Help Benny visit Grandma!",
  endingLine: "We made it to Grandma's!",
  steps: [
    { kind: "clip", src: L1_O1_A.url, poster: L1_O1_A_LAST.url },
    {
      kind: "word",
      word: "JUMP",
      askLine: "I need to...",
      successLine: "Whoosh! Over we go!",
    },
    { kind: "clip", src: L1_O1_B.url },

    // — Following obstacles: audio + word card only until clips are filmed —
    {
      kind: "word",
      word: "BOOTS",
      askLine: "My feet need big...",
      successLine: "Big boots! Splish splash!",
    },
    {
      kind: "word",
      word: "KEY",
      askLine: "To open the gate I need a...",
      successLine: "Click! The gate is open!",
    },
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
