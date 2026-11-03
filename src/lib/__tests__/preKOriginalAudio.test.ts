import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterClipsForOriginalAudio, shouldMuteSourceForScene, parseOriginalAudioMap, originalAudioGainAt, makeOriginalAudioEntry,
} from "../preKOriginalAudio";

const mix = makeOriginalAudioEntry("mix");
const only = makeOriginalAudioEntry("original_only");

test("scene with original audio on is unmuted even when level mutes source", () => {
  assert.equal(shouldMuteSourceForScene(true, "word-1-first", { "word-1-first": mix }), false);
});

test("other scenes stay muted after a redub", () => {
  assert.equal(shouldMuteSourceForScene(true, "word-2-first", { "word-1-first": mix }), true);
});

test("original only drops the redub voice but keeps music on that scene", () => {
  const clips = [
    { id: "r", track_index: 90, anchor_scene_key: "a" },
    { id: "m", track_index: 89, anchor_scene_key: "a" },
    { id: "r2", track_index: 90, anchor_scene_key: "b" },
  ];
  const kept = filterClipsForOriginalAudio(clips, { a: only }).map((c) => c.id);
  assert.deepEqual(kept, ["m", "r2"]);
});

test("mix mode keeps the redub voice", () => {
  const clips = [{ id: "r", track_index: 90, anchor_scene_key: "a" }];
  assert.equal(filterClipsForOriginalAudio(clips, { a: mix }).length, 1);
});

test("old saved string values still parse; junk ignored", () => {
  const m = parseOriginalAudioMap({ a: "mix", b: "nope", c: 3 });
  assert.deepEqual(Object.keys(m), ["a"]);
  assert.equal(m.a.mode, "mix");
  assert.equal(m.a.trimStartSec, 0);
});

test("new object values parse with trims", () => {
  const m = parseOriginalAudioMap({ a: { mode: "original_only", trimStartSec: 1.5, trimEndSec: 0.5, fadeInSec: 0.4, fadeOutSec: 0 } });
  assert.equal(m.a.trimStartSec, 1.5);
  assert.equal(m.a.trimEndSec, 0.5);
});

const trimmed = { a: { mode: "mix" as const, trimStartSec: 2, trimEndSec: 1, fadeInSec: 0.4, fadeOutSec: 0.4 } };

// Scene plays video seconds 5–15; 2s cut from start, 1s from end.
test("original is silent before the start cut and after the end cut", () => {
  assert.equal(originalAudioGainAt("a", 6.9, 5, 15, trimmed), 0);
  assert.equal(originalAudioGainAt("a", 14.5, 5, 15, trimmed), 0);
});

test("original fades in and out around the cuts", () => {
  assert.ok(Math.abs(originalAudioGainAt("a", 7.2, 5, 15, trimmed) - 0.5) < 1e-9);
  assert.equal(originalAudioGainAt("a", 10, 5, 15, trimmed), 1);
  assert.ok(Math.abs(originalAudioGainAt("a", 13.8, 5, 15, trimmed) - 0.5) < 1e-9);
});

test("scenes without an override keep full volume", () => {
  assert.equal(originalAudioGainAt("b", 0, 5, 15, trimmed), 1);
});
