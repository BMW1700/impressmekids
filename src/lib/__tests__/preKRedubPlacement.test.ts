import { describe, it, expect } from "vitest";
import { resolveClip } from "@/lib/preKClipResolve";
import { redubPreflightIssues } from "@/hooks/useBennyRedub";
import type { SceneGraph } from "@/lib/preKSceneGraph";
import type { PreKAudioClip } from "@/hooks/usePreKAudioMix";

// Opening 5s, word_1 first 3.5s, card (0 width), word_1 second 8.6s
const graph = {
  scenes: [
    { key: "opening", timelineDurationSeconds: 5 },
    { key: "word_1_first", timelineDurationSeconds: 3.5 },
    { key: "word_1_card", timelineDurationSeconds: 0 },
    { key: "word_1_second", timelineDurationSeconds: 8.6 },
  ],
  nominalDurationTotal: 17.1,
} as unknown as SceneGraph;

// What the redub server saves for a clip cut to its own window.
const redub = (scene: string, len: number) => ({
  anchor_scene_key: scene, anchor_edge: "start", anchor_offset_seconds: 0,
  duration_mode: "fixed", duration_seconds: len, trim_start_seconds: 0, trim_end_seconds: null,
  manual_crop_start_seconds: 0, manual_crop_end_seconds: 0, playback_rate: 1,
}) as unknown as PreKAudioClip;

describe("redub clip placement", () => {
  it("each redub starts exactly at its own video's start", () => {
    expect(resolveClip(redub("opening", 5), graph).startSec).toBe(0);
    expect(resolveClip(redub("word_1_first", 3.5), graph).startSec).toBe(5);
    expect(resolveClip(redub("word_1_second", 8.6), graph).startSec).toBe(8.5);
  });
  it("a pre-cut redub is as long as its cropped video", () => {
    const r = resolveClip(redub("word_1_first", 3.5), graph);
    expect(r.endSec - r.startSec).toBeCloseTo(3.5);
  });
});

describe("Full auto crop check", () => {
  const base = { sourceStoragePath: "same.mp4", label: "", sourceRawDurationSeconds: 31 };
  it("blocks overlapping crops on a shared video", () => {
    expect(redubPreflightIssues([
      { ...base, sceneKey: "a", sourceTrimStartSeconds: 5.3, sourceTrimEndSeconds: 8.9 },
      { ...base, sceneKey: "b", sourceTrimStartSeconds: 6.2, sourceTrimEndSeconds: 14.8 },
    ]).length).toBeGreaterThan(0);
  });
  it("blocks a shared-video crop with no end point", () => {
    expect(redubPreflightIssues([
      { ...base, sceneKey: "a", sourceTrimStartSeconds: 0, sourceTrimEndSeconds: 5 },
      { ...base, sceneKey: "b", sourceTrimStartSeconds: 20 },
    ]).length).toBeGreaterThan(0);
  });
  it("allows clean side-by-side crops", () => {
    expect(redubPreflightIssues([
      { ...base, sceneKey: "a", sourceTrimStartSeconds: 0, sourceTrimEndSeconds: 5 },
      { ...base, sceneKey: "b", sourceTrimStartSeconds: 5, sourceTrimEndSeconds: 9 },
    ])).toEqual([]);
  });
});
