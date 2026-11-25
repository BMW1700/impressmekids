import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { preKTileStatus, buildPreKSections } from "../preKLevelMap.ts";

describe("Pre-K level map", () => {
  it("a passed level stays green even after a later unfinished attempt", () => {
    assert.equal(preKTileStatus(1, true), "passed");
  });
  it("started but not finished shows try again", () => {
    assert.equal(preKTileStatus(0, true), "retry");
  });
  it("never started is new", () => {
    assert.equal(preKTileStatus(undefined, false), "new");
  });
  it("28 levels fit in one section", () => {
    assert.equal(buildPreKSections(Array.from({ length: 28 })).length, 1);
  });
  it("level 31 starts section 2 numbered 31", () => {
    const s = buildPreKSections(Array.from({ length: 31 }, (_, i) => i));
    assert.equal(s.length, 2);
    assert.equal(s[1].firstNumber, 31);
    assert.deepEqual(s[1].levels, [30]);
  });
});
