import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findSharedSourceIssues, isPreCutAudioClip } from "../preKSharedSource.ts";

describe("shared source video rules", () => {
  it("flags overlapping windows in the same file (food/drink word-1 case)", () => {
    const issues = findSharedSourceIssues([
      { sceneKey: "word-1-first", fileId: "A", trimIn: 5.35, trimOut: 8.87, raw: 31 },
      { sceneKey: "word-1-second", fileId: "A", trimIn: 6.18, trimOut: 14.82, raw: 31 },
    ]);
    assert.equal(issues.filter((i) => i.code === "shared-source-overlap").length, 1);
  });

  it("does not flag back-to-back windows", () => {
    const issues = findSharedSourceIssues([
      { sceneKey: "a", fileId: "A", trimIn: 0, trimOut: 5, raw: 20 },
      { sceneKey: "b", fileId: "A", trimIn: 5, trimOut: 10, raw: 20 },
    ]);
    assert.equal(issues.length, 0);
  });

  it("does not compare clips in different files", () => {
    const issues = findSharedSourceIssues([
      { sceneKey: "a", fileId: "A", trimIn: 0, trimOut: 5, raw: 20 },
      { sceneKey: "b", fileId: "B", trimIn: 0, trimOut: 5, raw: 20 },
    ]);
    assert.equal(issues.length, 0);
  });

  it("flags a missing end point only when the file is shared", () => {
    assert.equal(findSharedSourceIssues([{ sceneKey: "a", fileId: "A", trimIn: 0, trimOut: null, raw: 20 }]).length, 0);
    const shared = findSharedSourceIssues([
      { sceneKey: "a", fileId: "A", trimIn: 0, trimOut: 5, raw: 31 },
      { sceneKey: "b", fileId: "A", trimIn: 25, trimOut: null, raw: 31 },
    ]);
    assert.deepEqual(shared.map((i) => i.code), ["shared-source-open-end"]);
  });

  it("recognises clips cut to their own window", () => {
    assert.equal(isPreCutAudioClip(3.5, 31), true);
    assert.equal(isPreCutAudioClip(31, 31), false);
    assert.equal(isPreCutAudioClip(null, 31), false);
  });
});
