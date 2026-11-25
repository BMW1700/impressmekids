import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cropChangedSinceRedub, paddingNeeded } from "../preKSharedSource.ts";

const cur = (trimIn: number, trimOut: number | null, raw = 31) => ({ trimIn, trimOut, raw });

describe("redub matches the clip's current crop", () => {
  it("whole file, crop untouched: not flagged", () => {
    assert.equal(cropChangedSinceRedub({ start: 0, end: null }, cur(0, null)), false);
  });
  it("whole file saved with explicit end equal to video length: not flagged", () => {
    assert.equal(cropChangedSinceRedub({ start: 0, end: 31 }, cur(0, null)), false);
  });
  it("start crop moved after redub: flagged", () => {
    assert.equal(cropChangedSinceRedub({ start: 5.4, end: 8.9 }, cur(6.0, 8.9)), true);
  });
  it("end crop moved after redub: flagged", () => {
    assert.equal(cropChangedSinceRedub({ start: 5.4, end: 8.9 }, cur(5.4, 10.2)), true);
  });
  it("both edges unchanged in a shared video: not flagged", () => {
    assert.equal(cropChangedSinceRedub({ start: 14.8, end: 18.3 }, cur(14.8, 18.3)), false);
  });
  it("tiny rounding difference (0.02s): not flagged", () => {
    assert.equal(cropChangedSinceRedub({ start: 5.4, end: 8.9 }, cur(5.42, 8.88)), false);
  });
  it("end point removed after redub: flagged", () => {
    assert.equal(cropChangedSinceRedub({ start: 5.4, end: 8.9 }, cur(5.4, null)), true);
  });
  it("audio made before crops were remembered: never flagged", () => {
    assert.equal(cropChangedSinceRedub({ start: null, end: null }, cur(6.0, 9.0)), false);
  });
  it("a 3.5s clip is padded to 5s for isolation", () => {
    assert.equal(Number((3.5 + paddingNeeded(3.5)).toFixed(2)), 5);
  });
});
