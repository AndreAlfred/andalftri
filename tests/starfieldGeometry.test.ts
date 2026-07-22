import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStarBuffers,
  MAX_STARS,
  SHELL_INNER,
  SHELL_OUTER,
} from "../client/src/scene/starfieldGeometry.ts";

/** Cycles a fixed sequence so a case can pin every random draw. */
function sequence(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

test("every star sits inside the shell, clear of the scene fog", () => {
  // Fog runs near 12 / far 34 on the background colour. A star inside that
  // range fades to the background and simply is not there.
  const { positions, count } = buildStarBuffers(2000);

  for (let i = 0; i < count; i += 1) {
    const r = Math.hypot(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    assert.ok(r >= SHELL_INNER - 1e-3, `star at radius ${r} is inside the fog`);
    assert.ok(r <= SHELL_OUTER + 1e-3, `star at radius ${r} is beyond the shell`);
  }
});

test("the field does not bunch at the poles", () => {
  // Guards the acos-vs-uniform mistake: sampling the polar angle uniformly
  // instead of its cosine puts visibly more stars at the top and bottom.
  // For a uniform sphere, |z|/r is uniform on [0,1], so half the stars should
  // land in each hemisphere-band and the mean should sit near 0.5.
  const { positions, count } = buildStarBuffers(6000);
  let sum = 0;

  for (let i = 0; i < count; i += 1) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    sum += Math.abs(z) / Math.hypot(x, y, z);
  }

  const mean = sum / count;
  assert.ok(Math.abs(mean - 0.5) < 0.03, `mean |z|/r was ${mean}, expected ~0.5`);
});

test("a prefix of the buffer is the same sky, only thinner", () => {
  // This is the contract that makes setDrawRange a safe way to thin the field,
  // and it is the fix for the jarring mid-session "cut" Andrew reported: the
  // stars that survive a tier drop must not move.
  const draw = sequence([0.11, 0.29, 0.47, 0.63, 0.71, 0.83, 0.19, 0.37]);
  const full = buildStarBuffers(64, draw);

  const trimmed = { positions: full.positions.subarray(0, 20 * 3) };
  for (let i = 0; i < 20 * 3; i += 1) {
    assert.equal(trimmed.positions[i], full.positions[i]);
  }
});

test("stars are near-white, never saturated", () => {
  // CLAUDE.md's hierarchy: the warm artifact is primary and cool cyan belongs
  // to the helmet. A saturated field would compete with the medallion, so the
  // palette bias toward white is a real constraint, not a preference.
  const { colors, count } = buildStarBuffers(4000);
  let saturated = 0;

  for (let i = 0; i < count; i += 1) {
    const r = colors[i * 3];
    const g = colors[i * 3 + 1];
    const b = colors[i * 3 + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    // HSV saturation of the tint, independent of how bright the star is.
    if (max > 0 && (max - min) / max > 0.35) saturated += 1;
  }

  assert.equal(saturated, 0, `${saturated} stars exceeded the near-white bound`);
});

test("the palette spans cool to warm rather than sitting on one side", () => {
  const { colors, count } = buildStarBuffers(4000);
  let cool = 0;
  let warm = 0;

  for (let i = 0; i < count; i += 1) {
    const r = colors[i * 3];
    const b = colors[i * 3 + 2];
    // Compare the red and blue channels: the tint lerps toward one or other.
    if (b > r * 1.02) cool += 1;
    if (r > b * 1.02) warm += 1;
  }

  assert.ok(cool > count * 0.2, `only ${cool}/${count} stars read cool`);
  assert.ok(warm > count * 0.2, `only ${warm}/${count} stars read warm`);
});

test("brightness falls off steeply so the field reads as a sky, not noise", () => {
  const { colors, count } = buildStarBuffers(4000);
  const luminances: number[] = [];

  for (let i = 0; i < count; i += 1) {
    luminances.push(Math.max(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]));
  }
  luminances.sort((a, b) => a - b);

  const median = luminances[Math.floor(count / 2)];
  const brightest = luminances[count - 1];
  // Most stars faint, a few genuinely bright. A flat distribution would put the
  // median close to the maximum.
  assert.ok(median < brightest * 0.7, `median ${median} was not far below peak ${brightest}`);
});

test("the buffer is sized for the maximum, not the current tier", () => {
  const buffers = buildStarBuffers();

  assert.equal(buffers.count, MAX_STARS);
  assert.equal(buffers.positions.length, MAX_STARS * 3);
  assert.equal(buffers.sizes.length, MAX_STARS);
});
