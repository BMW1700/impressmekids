// Pre-K scene graph: turns a DB level + its words into the ordered scene list
// the audio editor and runtime mixer both consume. Scene keys are stable
// strings the database stores as anchors (e.g. "opening", "word-2-card").
//
// Word-card scenes have variable runtime duration (child speaks). The
// `nominalDurationSeconds` value on those scenes is for editor layout and the
// wall-clock preview only — never a runtime cap.

import type { PreKDbLevelRow, PreKDbWordRow } from "./preKLevelFromDb";

export type SceneKind = "opening" | "word-first" | "word-card" | "word-second" | "closing";

export interface Scene {
  key: string;
  kind: SceneKind;
  /** 1-based index for word-* scenes. Undefined for opening / closing. */
  wordIndex?: number;
  /** Source word row id for word-* scenes (helps the editor label columns). */
  wordRowId?: string;
  /** Display text — e.g. "Opening", "Word 2 — first clip", "Word 2 — card (JUMP)". */
  label: string;
  /** Fixed for videos, nominal for cards. Used for legacy wall-clock previews. */
  nominalDurationSeconds: number;
  /**
   * Effective duration the editor timeline uses for layout & playhead math.
   * Word-card scenes are zero-width "skip notches": audio teleports from the
   * end of the previous video directly to the start of the next video, never
   * sounding during the open-ended "child speaks" pause.
   */
  timelineDurationSeconds: number;
}

export interface VideoTimelineEntry {
  sceneKey: string;
  startSec: number;
  endSec: number;
}

export interface SceneGraph {
  scenes: Scene[];
  /** Video-only concatenated timeline used for span-videos drag math. */
  videoTimeline: VideoTimelineEntry[];
  /** Total of all video durations (no cards). */
  videoDurationTotal: number;
  /** Total of all scenes including nominal card time. */
  nominalDurationTotal: number;
}

const DEFAULT_VIDEO_SECONDS = 5;
const DEFAULT_CARD_SECONDS = 3;

export const SCENE_KEYS = {
  opening: "opening",
  closing: "closing",
  wordFirst: (i: number) => `word-${i}-first`,
  wordCard: (i: number) => `word-${i}-card`,
  wordSecond: (i: number) => `word-${i}-second`,
} as const;

export function buildSceneGraph(
  level: Pick<PreKDbLevelRow, "id"> & {
    opening_video_duration_seconds?: number | null;
    closing_video_duration_seconds?: number | null;
  },
  words: Array<
    Pick<PreKDbWordRow, "id" | "sort_order" | "word"> & {
      word_hold_seconds?: number | null;
      first_video_duration_seconds?: number | null;
      second_video_duration_seconds?: number | null;
    }
  >,
): SceneGraph {
  const scenes: Scene[] = [];
  const videoTimeline: VideoTimelineEntry[] = [];
  let videoCursor = 0;

  const openingDur = Number(level.opening_video_duration_seconds) || DEFAULT_VIDEO_SECONDS;
  scenes.push({
    key: SCENE_KEYS.opening,
    kind: "opening",
    label: "Opening",
    nominalDurationSeconds: openingDur,
  });
  videoTimeline.push({ sceneKey: SCENE_KEYS.opening, startSec: videoCursor, endSec: videoCursor + openingDur });
  videoCursor += openingDur;

  const sorted = [...words].sort((a, b) => a.sort_order - b.sort_order);
  sorted.forEach((w, idx) => {
    const i = idx + 1;
    const firstDur = Number(w.first_video_duration_seconds) || DEFAULT_VIDEO_SECONDS;
    const cardDur = Number(w.word_hold_seconds) || DEFAULT_CARD_SECONDS;
    const secondDur = Number(w.second_video_duration_seconds) || DEFAULT_VIDEO_SECONDS;

    const wordLabel = (w.word || "").toUpperCase();

    scenes.push({
      key: SCENE_KEYS.wordFirst(i),
      kind: "word-first",
      wordIndex: i,
      wordRowId: w.id,
      label: `Word ${i} — first clip${wordLabel ? ` (${wordLabel})` : ""}`,
      nominalDurationSeconds: firstDur,
    });
    videoTimeline.push({ sceneKey: SCENE_KEYS.wordFirst(i), startSec: videoCursor, endSec: videoCursor + firstDur });
    videoCursor += firstDur;

    scenes.push({
      key: SCENE_KEYS.wordCard(i),
      kind: "word-card",
      wordIndex: i,
      wordRowId: w.id,
      label: `Word ${i} — card${wordLabel ? ` (${wordLabel})` : ""}`,
      nominalDurationSeconds: cardDur,
    });

    scenes.push({
      key: SCENE_KEYS.wordSecond(i),
      kind: "word-second",
      wordIndex: i,
      wordRowId: w.id,
      label: `Word ${i} — second clip${wordLabel ? ` (${wordLabel})` : ""}`,
      nominalDurationSeconds: secondDur,
    });
    videoTimeline.push({ sceneKey: SCENE_KEYS.wordSecond(i), startSec: videoCursor, endSec: videoCursor + secondDur });
    videoCursor += secondDur;
  });

  const closingDur = Number(level.closing_video_duration_seconds) || DEFAULT_VIDEO_SECONDS;
  scenes.push({
    key: SCENE_KEYS.closing,
    kind: "closing",
    label: "Closing",
    nominalDurationSeconds: closingDur,
  });
  videoTimeline.push({ sceneKey: SCENE_KEYS.closing, startSec: videoCursor, endSec: videoCursor + closingDur });
  videoCursor += closingDur;

  const nominalDurationTotal = scenes.reduce((s, sc) => s + sc.nominalDurationSeconds, 0);

  return {
    scenes,
    videoTimeline,
    videoDurationTotal: videoCursor,
    nominalDurationTotal,
  };
}

/** Map a runtime step index (in NabuVideoAdventure's flat steps array) to a scene key. */
export function sceneKeyForStep(stepIndex: number, words: number): string {
  // steps shape: [opening, (first, card, second) x N, closing]
  if (stepIndex === 0) return SCENE_KEYS.opening;
  const blockSize = 3;
  const lastIndex = 1 + words * blockSize;
  if (stepIndex >= lastIndex) return SCENE_KEYS.closing;
  const within = stepIndex - 1;
  const wordIdx = Math.floor(within / blockSize) + 1;
  const slot = within % blockSize;
  if (slot === 0) return SCENE_KEYS.wordFirst(wordIdx);
  if (slot === 1) return SCENE_KEYS.wordCard(wordIdx);
  return SCENE_KEYS.wordSecond(wordIdx);
}

export function isVideoScene(scene: Scene): boolean {
  return scene.kind !== "word-card";
}
