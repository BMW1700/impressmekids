// Resolves a PreKAudioClip's start/end on the nominal wall-clock timeline
// produced by buildSceneGraph(). The editor canvas and warnings both use this.

import type { PreKAudioClip } from "@/hooks/usePreKAudioMix";
import type { Scene, SceneGraph } from "./preKSceneGraph";
import { audioBoundsForClip } from "./preKAudioBounds";

export interface ResolvedClip {
  startSec: number;
  endSec: number;
  /** Anchor scene at the clip's start, if any (always set unless fill-level). */
  anchorScene?: Scene;
  /** Anchor scene at the clip's end, if any (span-videos only). */
  endAnchorScene?: Scene;
}

interface SceneSpan { scene: Scene; start: number; end: number }

function buildSpans(graph: SceneGraph): SceneSpan[] {
  const out: SceneSpan[] = [];
  let cur = 0;
  for (const s of graph.scenes) {
    // Word-card scenes are zero-width on the editor timeline so audio teleports
    // straight from end-of-first-video to start-of-second-video.
    const dur = s.timelineDurationSeconds;
    out.push({ scene: s, start: cur, end: cur + dur });
    cur += dur;
  }
  return out;
}

export function getSceneSpans(graph: SceneGraph): SceneSpan[] {
  return buildSpans(graph);
}

function find(spans: SceneSpan[], key: string): SceneSpan | undefined {
  return spans.find((s) => s.scene.key === key);
}

export function resolveClip(clip: PreKAudioClip, graph: SceneGraph): ResolvedClip {
  const totalDur = graph.nominalDurationTotal;
  const spans = buildSpans(graph);

  if (clip.duration_mode === "fill-level") {
    return { startSec: 0, endSec: totalDur };
  }

  const anchor = find(spans, clip.anchor_scene_key) ?? spans[0];
  const startBase = clip.anchor_edge === "start" ? anchor.start : anchor.end;
  const baselineStartSec = Math.max(0, Math.min(totalDur, startBase + clip.anchor_offset_seconds));

  if (clip.duration_mode === "fill-scene") {
    return { startSec: anchor.start, endSec: anchor.end, anchorScene: anchor.scene, endAnchorScene: anchor.scene };
  }

  if (clip.duration_mode === "span-videos") {
    const endAnchor = clip.end_anchor_scene_key ? find(spans, clip.end_anchor_scene_key) ?? anchor : anchor;
    const endBase = (clip.end_anchor_edge ?? "end") === "start" ? endAnchor.start : endAnchor.end;
    const endSec = Math.max(baselineStartSec + 0.1, Math.min(totalDur, endBase + (clip.end_anchor_offset_seconds ?? 0)));
    return { startSec: baselineStartSec, endSec, anchorScene: anchor.scene, endAnchorScene: endAnchor.scene };
  }

  // fixed — endSec extends past any card boundary naturally because cards are
  // zero-width on the editor timeline. The canvas renders the visual block as
  // multiple segments split around the notch so the waveform appears to
  // teleport across.
  const rate = Math.max(0.05, clip.playback_rate || 1);
  const bounds = audioBoundsForClip(clip);
  const manualStartTimelineSeconds = Math.max(0, Number(clip.manual_crop_start_seconds || 0)) / rate;
  // A fixed clip is a source file placed on a timeline. Cropping its beginning
  // moves only the visible left edge; the surviving source audio keeps its
  // original absolute timeline position. The persisted anchor remains the
  // uncropped baseline so dragging the handle back can restore the source.
  const startSec = Math.min(totalDur, baselineStartSec + manualStartTimelineSeconds);
  const baselineAudioSeconds = Math.max(0.1, bounds.baseEnd - bounds.baseStart);
  const endSec = Math.min(
    totalDur,
    baselineStartSec + (baselineAudioSeconds - Math.max(0, Number(clip.manual_crop_end_seconds || 0))) / rate,
  );
  return { startSec, endSec: Math.max(startSec + 0.1 / rate, endSec), anchorScene: anchor.scene };
}

export interface SceneHit { scene: Scene; sceneStart: number; sceneEnd: number }

export function findSceneAt(graph: SceneGraph, sec: number): SceneHit {
  const spans = buildSpans(graph);
  for (const sp of spans) if (sec < sp.end) return { scene: sp.scene, sceneStart: sp.start, sceneEnd: sp.end };
  const last = spans[spans.length - 1];
  return { scene: last.scene, sceneStart: last.start, sceneEnd: last.end };
}

/** Snap a wall-clock second to an anchor: prefer the scene containing it; use start edge with offset. */
export function snapToAnchor(graph: SceneGraph, sec: number): { scene_key: string; edge: "start" | "end"; offset: number } {
  const hit = findSceneAt(graph, sec);
  return { scene_key: hit.scene.key, edge: "start", offset: Math.round((sec - hit.sceneStart) * 10) / 10 };
}

/** Same, but restricted to video scenes (used for span-videos end-anchor). */
export function snapToVideoAnchor(graph: SceneGraph, sec: number): { scene_key: string; edge: "start" | "end"; offset: number } {
  const spans = buildSpans(graph).filter((sp) => sp.scene.kind !== "word-card");
  for (const sp of spans) {
    if (sec < sp.end) return { scene_key: sp.scene.key, edge: "start", offset: Math.round((sec - sp.start) * 10) / 10 };
  }
  const last = spans[spans.length - 1];
  return { scene_key: last.scene.key, edge: "end", offset: Math.round((sec - last.end) * 10) / 10 };
}
