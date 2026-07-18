import assert from "node:assert/strict";
import test from "node:test";
import {
  computeBootTimeline,
  createFireOnceGuard,
  HELMET_BOOT_FADE_MS,
  HELMET_BOOT_HOLD_MS,
  HELMET_BOOT_REDUCED_MOTION_HOLD_MS,
} from "../client/src/hud/bootLifecycle.ts";
import { HELMET_BOOT_CHAR_MS, HELMET_BOOT_LINE } from "../client/src/hud/helmetBoot.ts";

test("the fire-once guard lets exactly one call through", () => {
  const attempt = createFireOnceGuard();

  const results = [attempt(), attempt(), attempt()];

  assert.deepEqual(results, [true, false, false]);
});

test("independent guards do not share fired state", () => {
  const attemptA = createFireOnceGuard();
  const attemptB = createFireOnceGuard();

  assert.equal(attemptA(), true);
  assert.equal(attemptB(), true);
  assert.equal(attemptA(), false);
  assert.equal(attemptB(), false);
});

test("the boot timeline types at the given char interval and orders its windows", () => {
  const lineLength = HELMET_BOOT_LINE.length;
  const charMs = HELMET_BOOT_CHAR_MS;
  const timeline = computeBootTimeline(lineLength, charMs);

  assert.equal(timeline.typeDurationMs, lineLength * charMs);
  assert.equal(timeline.holdMs, HELMET_BOOT_HOLD_MS);
  assert.equal(timeline.fadeMs, HELMET_BOOT_FADE_MS);
  assert.ok(timeline.holdMs > 0);
  assert.ok(timeline.fadeMs > 0);
  assert.equal(timeline.fadeStartMs, timeline.typeDurationMs + timeline.holdMs);
  assert.equal(timeline.totalMs, timeline.fadeStartMs + timeline.fadeMs);
  assert.ok(timeline.fadeStartMs > timeline.typeDurationMs);
  assert.ok(timeline.totalMs > timeline.fadeStartMs);
});

test("reduced motion skips the typewriter and uses a shorter hold", () => {
  const timeline = computeBootTimeline(43, 42, { reducedMotion: true });

  assert.equal(timeline.typeDurationMs, 0);
  assert.equal(timeline.holdMs, HELMET_BOOT_REDUCED_MOTION_HOLD_MS);
  assert.ok(timeline.holdMs < HELMET_BOOT_HOLD_MS);
  assert.equal(timeline.fadeStartMs, timeline.holdMs);
  assert.ok(timeline.totalMs > timeline.fadeStartMs);
});
