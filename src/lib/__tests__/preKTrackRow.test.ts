import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findHiddenClipRows } from "../preKTrackRow.ts";

describe("hidden voice/music clips", () => {
  it("finds redub clips whose Benny (Redub) row was deleted", () => {
    const tracks = [{ track_index: 89 }, { track_index: 93 }];
    const clips = Array.from({ length: 8 }, () => ({ track_index: 90, source_kind: "redub" }))
      .concat(Array.from({ length: 8 }, () => ({ track_index: 89, source_kind: "music" })));
    assert.deepEqual(findHiddenClipRows(tracks, clips), [{ trackIndex: 90, clipCount: 8, label: "Benny (Redub)" }]);
  });
  it("reports nothing when every clip has a visible row", () => {
    const tracks = [{ track_index: 89 }, { track_index: 90 }];
    const clips = [{ track_index: 90, source_kind: "redub" }, { track_index: 89, source_kind: "music" }];
    assert.deepEqual(findHiddenClipRows(tracks, clips), []);
  });
  it("names a deleted music row", () => {
    assert.equal(findHiddenClipRows([], [{ track_index: 89, source_kind: "music" }])[0].label, "Benny (Music)");
  });
});
