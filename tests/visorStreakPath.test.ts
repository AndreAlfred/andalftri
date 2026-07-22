import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStreakPath,
  cubicAt,
  OFF_SCREEN_MARGIN,
  STREAK_EDGES,
} from "../client/src/hud/visorStreakPath.ts";

const W = 1440;
const H = 900;

/** Cycles a fixed sequence, so a case can pin every random draw in the builder. */
function sequence(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

test("a streak never exits through the edge it entered", () => {
  // The rotation trick (+1 plus 0..2) is easy to get subtly wrong, and the
  // failure mode — a streak bouncing back out the way it came — reads as a
  // glitch rather than as light passing across the visor.
  for (let i = 0; i < 400; i += 1) {
    const path = buildStreakPath(W, H);
    assert.notEqual(path.entryEdge, path.exitEdge);
  }
});

test("every edge is reachable as both an entry and an exit", () => {
  const entries = new Set<string>();
  const exits = new Set<string>();
  for (let i = 0; i < 600; i += 1) {
    const path = buildStreakPath(W, H);
    entries.add(path.entryEdge);
    exits.add(path.exitEdge);
  }
  assert.equal(entries.size, STREAK_EDGES.length, "some edge never spawns a streak");
  assert.equal(exits.size, STREAK_EDGES.length, "some edge is never exited through");
});

test("endpoints sit just outside the viewport so nothing pops into existence", () => {
  for (let i = 0; i < 200; i += 1) {
    const { p0, p3 } = buildStreakPath(W, H);
    for (const [x, y] of [p0, p3]) {
      const outside =
        x <= 0 || x >= W || y <= 0 || y >= H;
      assert.ok(outside, `endpoint ${x},${y} started inside the viewport`);
    }
  }
});

test("the off-screen margin is applied on the axis the edge is perpendicular to", () => {
  // random() draws in order: entryIndex, entryAlong, exitRotation, exitAlong,
  // swing, angle. 0 selects "left" (index 0) and rotation 0 -> exit "right".
  const path = buildStreakPath(W, H, sequence([0]));

  assert.equal(path.entryEdge, "left");
  assert.equal(path.exitEdge, "right");
  assert.equal(path.p0[0], -OFF_SCREEN_MARGIN);
  assert.equal(path.p3[0], W + OFF_SCREEN_MARGIN);
});

test("the top and bottom edges use the height, not the width", () => {
  // Guards the specific slip this module was extracted after: a bottom-edge
  // endpoint built as `h + h + margin` instead of `h + margin`, which threw the
  // streak a full viewport below the screen where it was never visible.
  const nearlyOne = 0.999999;
  const path = buildStreakPath(W, H, sequence([nearlyOne]));

  assert.equal(path.entryEdge, "bottom");
  assert.equal(path.p0[1], H + OFF_SCREEN_MARGIN);
});

test("cubicAt returns the endpoints exactly at t=0 and t=1", () => {
  const path = buildStreakPath(W, H);

  assert.deepEqual(cubicAt(path, 0), path.p0);
  assert.deepEqual(cubicAt(path, 1), path.p3);
});

test("cubicAt traces a continuous path with no jumps", () => {
  // The renderer walks the curve in 48 segments; a discontinuity would draw as
  // a broken streak rather than a stroke.
  const path = buildStreakPath(W, H);
  const steps = 96;
  let previous = cubicAt(path, 0);
  // A cubic bounded by control points within ~1.5 viewports cannot legitimately
  // move more than a fraction of that per 1/96th step.
  const limit = Math.max(W, H) * 0.5;

  for (let i = 1; i <= steps; i += 1) {
    const point = cubicAt(path, i / steps);
    const dx = point[0] - previous[0];
    const dy = point[1] - previous[1];
    assert.ok(Math.hypot(dx, dy) < limit, `jump of ${Math.hypot(dx, dy)}px at t=${i / steps}`);
    previous = point;
  }
});

test("the curve actually bends instead of running straight", () => {
  // "Filigree" is the whole brief. A path whose midpoint sits on the straight
  // line between its endpoints would satisfy every other test here and still be
  // the wrong picture, so measure the deviation directly.
  let bent = 0;
  const samples = 200;

  for (let i = 0; i < samples; i += 1) {
    const path = buildStreakPath(W, H);
    const mid = cubicAt(path, 0.5);
    const chordX = path.p3[0] - path.p0[0];
    const chordY = path.p3[1] - path.p0[1];
    const chordLength = Math.hypot(chordX, chordY) || 1;
    // Perpendicular distance from the chord to the curve's midpoint.
    const deviation =
      Math.abs(chordX * (path.p0[1] - mid[1]) - (path.p0[0] - mid[0]) * chordY) / chordLength;
    if (deviation > Math.min(W, H) * 0.05) bent += 1;
  }

  assert.ok(bent > samples * 0.8, `only ${bent}/${samples} streaks curved appreciably`);
});
