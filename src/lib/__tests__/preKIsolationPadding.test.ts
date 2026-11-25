import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { paddingNeeded, MIN_ISOLATION_SECONDS } from "../preKSharedSource.ts";

describe("voice isolation minimum length", () => {
  it("pads a 2.99s clip up past ElevenLabs' 4.6s minimum", () => {
    const pad = paddingNeeded(2.99);
    assert.ok(2.99 + pad >= 4.6);
    assert.equal(Number((2.99 + pad).toFixed(2)), MIN_ISOLATION_SECONDS);
  });
  it("leaves clips already 5s or longer alone", () => {
    assert.equal(paddingNeeded(5), 0);
    assert.equal(paddingNeeded(12.4), 0);
  });
});
