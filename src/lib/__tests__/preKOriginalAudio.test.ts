import { test } from "node:test";
import assert from "node:assert/strict";
import { filterClipsForOriginalAudio, shouldMuteSourceForScene, parseOriginalAudioMap } from "../preKOriginalAudio";

test("scene with original audio on is unmuted even when level mutes source", () => {
  assert.equal(shouldMuteSourceForScene(true, "word-1-first", { "word-1-first": "mix" }), false);
});

test("other scenes stay muted after a redub", () => {
  assert.equal(shouldMuteSourceForScene(true, "word-2-first", { "word-1-first": "mix" }), true);
});

test("original only drops the redub voice but keeps music on that scene", () => {
  const clips = [
    { id: "r", track_index: 90, anchor_scene_key: "a" },
    { id: "m", track_index: 89, anchor_scene_key: "a" },
    { id: "r2", track_index: 90, anchor_scene_key: "b" },
  ];
  const kept = filterClipsForOriginalAudio(clips, { a: "original_only" }).map((c) => c.id);
  assert.deepEqual(kept, ["m", "r2"]);
});

test("mix mode keeps the redub voice", () => {
  const clips = [{ id: "r", track_index: 90, anchor_scene_key: "a" }];
  assert.equal(filterClipsForOriginalAudio(clips, { a: "mix" }).length, 1);
});

test("parser ignores junk values", () => {
  assert.deepEqual(parseOriginalAudioMap({ a: "mix", b: "nope", c: 3 }), { a: "mix" });
});
