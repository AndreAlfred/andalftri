import assert from "node:assert/strict";
import test from "node:test";
import { parseScreenTextParam } from "../client/src/scene/screenWake.ts";

test("screentext overrides parse per section", () => {
  assert.deepEqual(parseScreenTextParam("3:-0.55"), { 3: -0.55 });
  assert.deepEqual(parseScreenTextParam("3:-0.5,5:0.1"), { 3: -0.5, 5: 0.1 });
  assert.deepEqual(parseScreenTextParam(null), {});
  assert.deepEqual(parseScreenTextParam(""), {});
});

test("a typo in a preview URL is skipped, never thrown", () => {
  // Out-of-range sections, non-numeric bias, and malformed pairs all drop out
  // instead of blanking the medallion mid-review.
  assert.deepEqual(parseScreenTextParam("9:-0.5"), {});
  assert.deepEqual(parseScreenTextParam("0:-0.5"), {});
  assert.deepEqual(parseScreenTextParam("3:high"), {});
  assert.deepEqual(parseScreenTextParam("garbage"), {});
  assert.deepEqual(parseScreenTextParam("3:-0.4,oops"), { 3: -0.4 });
});

test("bias is clamped to the canvas-sane range", () => {
  assert.deepEqual(parseScreenTextParam("3:-9"), { 3: -1 });
  assert.deepEqual(parseScreenTextParam("3:9"), { 3: 1 });
});
