import { describe, it, expect } from "vitest";
import { findSharedSourceIssues, isPreCutAudioClip } from "../preKSharedSource";

describe("shared source video rules", () => {
  it("flags overlapping windows in the same file (food/drink word-1 case)", () => {
    const issues = findSharedSourceIssues([
      { sceneKey: "word-1-first", fileId: "A", trimIn: 5.35, trimOut: 8.87, raw: 31 },
      { sceneKey: "word-1-second", fileId: "A", trimIn: 6.18, trimOut: 14.82, raw: 31 },
    ]);
    expect(issues.filter((i) => i.code === "shared-source-overlap")).toHaveLength(1);
  });

  it("does not flag back-to-back windows", () => {
    const issues = findSharedSourceIssues([
      { sceneKey: "a", fileId: "A", trimIn: 0, trimOut: 5, raw: 20 },
      { sceneKey: "b", fileId: "A", trimIn: 5, trimOut: 10, raw: 20 },
    ]);
    expect(issues).toHaveLength(0);
  });

  it("does not compare clips in different files", () => {
    const issues = findSharedSourceIssues([
      { sceneKey: "a", fileId: "A", trimIn: 0, trimOut: 5, raw: 20 },
      { sceneKey: "b", fileId: "B", trimIn: 0, trimOut: 5, raw: 20 },
    ]);
    expect(issues).toHaveLength(0);
  });

  it("flags a missing end point only when the file is shared", () => {
    expect(findSharedSourceIssues([{ sceneKey: "a", fileId: "A", trimIn: 0, trimOut: null, raw: 20 }])).toHaveLength(0);
    const shared = findSharedSourceIssues([
      { sceneKey: "a", fileId: "A", trimIn: 0, trimOut: 5, raw: 31 },
      { sceneKey: "b", fileId: "A", trimIn: 25, trimOut: null, raw: 31 },
    ]);
    expect(shared.map((i) => i.code)).toEqual(["shared-source-open-end"]);
  });

  it("recognises clips cut to their own window", () => {
    expect(isPreCutAudioClip(3.5, 31)).toBe(true);
    expect(isPreCutAudioClip(31, 31)).toBe(false);
    expect(isPreCutAudioClip(null, 31)).toBe(false);
  });
});
