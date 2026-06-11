// Pre-K Video Adventures — cinematic gameplay loop.
//
// A level is a flat ordered list of STEPS:
//   - { kind: "clip", src }       — play a video, advance when it ends.
//   - { kind: "word", word, ... } — freeze on the previous clip's last frame,
//                                   show word card, listen on the mic,
//                                   advance when matched (or auto-pass).
//
// The runner enforces a no-bleed transition: an opaque veil covers the stage
// before the video src swaps, so a frame from the outgoing scene can never
// appear inside the incoming scene.

import L1_INTRO from "@/assets/L1-intro.mov.asset.json";
import L1_PUSH_PROMPT from "@/assets/L1-push-prompt.mov.asset.json";
import L1_PUSH_PROMPT_LAST from "@/assets/L1-push-prompt-last.jpg.asset.json";
import L1_PUSH_ACTION from "@/assets/L1-push-action.mov.asset.json";
import L1_SNEAK_PROMPT from "@/assets/L1-sneak-prompt.mov.asset.json";
import L1_SNEAK_PROMPT_LAST from "@/assets/L1-sneak-prompt-last.jpg.asset.json";
import L1_SNEAK_ACTION from "@/assets/L1-sneak-action.mov.asset.json";
import L1_GRANDMA_ENDING from "@/assets/L1-grandma-ending.mov.asset.json";

export type VideoStep =
  | { kind: "clip"; src: string; poster?: string }
  | {
      kind: "word";
      word: string;
      /** Cloze stem displayed while listening; audio lives inside the prompt clip. */
      askLine: string;
      /** Optional follow-up line. */
      successLine?: string;
      /** Frozen frame to hold while the word card is shown. */
      holdPoster?: string;
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
//   intro → push prompt → PUSH word → push action →
//   sneak prompt → SNEAK word → sneak action → grandma ending
// ============================================================================

const W101_L1: VideoLevel = {
  id: "w101-l1",
  goal: "Help Benny visit Grandma!",
  endingLine: "We made it to Grandma's!",
  steps: [
    // Intro
    { kind: "clip", src: L1_INTRO.url },

    // Obstacle 1: PUSH the log
    { kind: "clip", src: L1_PUSH_PROMPT.url, poster: L1_PUSH_PROMPT_LAST.url },
    {
      kind: "word",
      word: "PUSH",
      askLine: "How do I move this?",
      successLine: "Heave-ho! There it goes!",
      holdPoster: L1_PUSH_PROMPT_LAST.url,
    },
    { kind: "clip", src: L1_PUSH_ACTION.url },

    // Obstacle 2: SNEAK past the bear
    { kind: "clip", src: L1_SNEAK_PROMPT.url, poster: L1_SNEAK_PROMPT_LAST.url },
    {
      kind: "word",
      word: "SNEAK",
      askLine: "Shhh… what should I do?",
      successLine: "Tip-toe, tip-toe… past the bear!",
      holdPoster: L1_SNEAK_PROMPT_LAST.url,
    },
    { kind: "clip", src: L1_SNEAK_ACTION.url },

    // Grandma ending
    { kind: "clip", src: L1_GRANDMA_ENDING.url },
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
