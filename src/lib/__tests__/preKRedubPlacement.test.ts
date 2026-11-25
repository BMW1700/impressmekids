import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveClip } from "../preKClipResolve.ts";
import { redubPreflightIssues } from "../preKSharedSource.ts";
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
    assert.equal(resolveClip(redub("opening", 5), graph).startSec, 0);
    assert.equal(resolveClip(redub("word_1_first", 3.5), graph).startSec, 5);
    assert.equal(resolveClip(redub("word_1_second", 8.6), graph).startSec, 8.5);
  });
  it("a pre-cut redub is as long as its cropped video", () => {
    const r = resolveClip(redub("word_1_first", 3.5), graph);
    assert.ok(Math.abs(r.endSec - r.startSec - 3.5) < 0.01);
  });
});

describe("Full auto crop check", () => {
  const base = { sourceStoragePath: "same.mp4", label: "", sourceRawDurationSeconds: 31 };
  it("blocks overlapping crops on a shared video", () => {
    assert.ok(redubPreflightIssues([
      { ...base, sceneKey: "a", sourceTrimStartSeconds: 5.3, sourceTrimEndSeconds: 8.9 },
      { ...base, sceneKey: "b", sourceTrimStartSeconds: 6.2, sourceTrimEndSeconds: 14.8 },
    ]).length > 0);
  });
  it("blocks a shared-video crop with no end point", () => {
    assert.ok(redubPreflightIssues([
      { ...base, sceneKey: "a", sourceTrimStartSeconds: 0, sourceTrimEndSeconds: 5 },
      { ...base, sceneKey: "b", sourceTrimStartSeconds: 20 },
    ]).length > 0);
  });
  it("allows clean side-by-side crops", () => {
    assert.deepEqual(redubPreflightIssues([
      { ...base, sceneKey: "a", sourceTrimStartSeconds: 0, sourceTrimEndSeconds: 5 },
      { ...base, sceneKey: "b", sourceTrimStartSeconds: 5, sourceTrimEndSeconds: 9 },
    ]), []);
  });
});
