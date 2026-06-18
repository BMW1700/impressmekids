// Maps a wall-clock second `t` on the editor timeline to a concrete frame in
// one of the level's source videos. Used by the editor's timeline preview
// player so the visible frame stays in sync with the audio mixer playhead.
//
// Card scenes have no video — the helper returns the freeze-frame poster of
// the preceding video, mirroring what the runtime shows during word cards.

import type { SceneGraph } from "@/lib/preKSceneGraph";

export interface FrameLookup {
  sceneKey: string;
  isCard: boolean;
  /** Signed URL of the active video. Null on cards when no poster is known. */
  src: string | null;
  /** Seconds into `src` to seek to. 0 for cards. */
  localTime: number;
  /** Poster URL to display when on a card (freeze frame of preceding video). */
  posterUrl: string | null;
}

export function resolveTimelineFrame(
  t: number,
  graph: SceneGraph,
  videoUrls: Record<string, string>,
  posterUrls: Record<string, string>,
): FrameLookup {
  let cursor = 0;
  let lastVideoKey: string | null = null;
  for (let i = 0; i < graph.scenes.length; i++) {
    const s = graph.scenes[i];
    const end = cursor + s.nominalDurationSeconds;
    if (s.kind !== "word-card") lastVideoKey = s.key;
    if (t < end || i === graph.scenes.length - 1) {
      if (s.kind === "word-card") {
        return {
          sceneKey: s.key,
          isCard: true,
          src: null,
          localTime: 0,
          posterUrl: (lastVideoKey && posterUrls[lastVideoKey]) || null,
        };
      }
      return {
        sceneKey: s.key,
        isCard: false,
        src: videoUrls[s.key] ?? null,
        localTime: Math.max(0, t - cursor),
        posterUrl: null,
      };
    }
    cursor = end;
  }
  return { sceneKey: graph.scenes[0]?.key ?? "", isCard: false, src: null, localTime: 0, posterUrl: null };
}
