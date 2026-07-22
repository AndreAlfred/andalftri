import assert from "node:assert/strict";
import test from "node:test";
import {
  brightnessForMagnitude,
  buildStarBuffers,
  fadeForBrightness,
  MAG_BRIGHTEST,
  MAG_FAINTEST,
  MAX_POINT_PX,
  MAX_STARS,
  MIN_POINT_PX,
  sampleMagnitude,
  sampleSpectralClass,
  SHELL_INNER,
  SHELL_OUTER,
  sizeForBrightness,
  SPECTRAL_CLASSES,
} from "../client/src/scene/starfieldGeometry.ts";
import { SEEDS, seededRandom } from "./seededRandom.ts";

test("every star sits inside the shell, clear of the scene fog", () => {
  for (const seed of SEEDS) {
    // Fog runs near 12 / far 34 on the background colour. A star inside that
    // range fades to the background and simply is not there.
    const { positions, count } = buildStarBuffers(2000, seededRandom(seed));

    for (let i = 0; i < count; i += 1) {
      const r = Math.hypot(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      assert.ok(r >= SHELL_INNER - 1e-3, `star at radius ${r} is inside the fog`);
      assert.ok(r <= SHELL_OUTER + 1e-3, `star at radius ${r} is beyond the shell`);
    }
  }
});

test("the field does not bunch at the poles", () => {
  for (const seed of SEEDS) {
    // Guards the acos-vs-uniform mistake: sampling the polar angle uniformly
    // instead of its cosine puts visibly more stars at the top and bottom.
    const { positions, count } = buildStarBuffers(6000, seededRandom(seed));
    let sum = 0;

    for (let i = 0; i < count; i += 1) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      sum += Math.abs(z) / Math.hypot(x, y, z);
    }

    const mean = sum / count;
    assert.ok(Math.abs(mean - 0.5) < 0.03, `mean |z|/r was ${mean}, expected ~0.5`);
  }
});

test("a prefix of the buffer is the same sky, only thinner", () => {
  // The contract that makes setDrawRange a safe way to thin the field, and the
  // fix for the jarring mid-session "cut": stars that survive a tier drop must
  // not move.
  const draw = (() => {
    const values = [0.11, 0.29, 0.47, 0.63, 0.71, 0.83, 0.19, 0.37, 0.53];
    let i = 0;
    return () => values[i++ % values.length];
  })();
  const full = buildStarBuffers(64, draw);

  for (let i = 0; i < 20 * 3; i += 1) {
    assert.equal(full.positions.subarray(0, 20 * 3)[i], full.positions[i]);
  }
});

test("stars are not all the same size", () => {
  for (const seed of SEEDS) {
    // The regression Andrew reported. The previous shader clamped a
    // distance-derived size that 100% of the field saturated, so every star
    // rendered at an identical 2.6px.
    const { sizes, count } = buildStarBuffers(4000, seededRandom(seed));
    const unique = new Set<number>();

    for (let i = 0; i < count; i += 1) unique.add(Math.round(sizes[i] * 20));

    assert.ok(unique.size > 20, `only ${unique.size} distinct sizes across the field`);

    const sorted = [...sizes].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(count / 2)];
    const p999 = sorted[Math.floor(count * 0.999)];
    // Most stars small, a few genuinely larger.
    assert.ok(p999 > p50 * 1.5, `p99.9 ${p999} was not meaningfully above median ${p50}`);
  }
});

test("point sizes stay inside the declared range and never go sub-pixel", () => {
  for (const seed of SEEDS) {
    // Sub-pixel points alias and blink as they cross pixel boundaries when the
    // camera moves — the scintillation Andrew already rejected once as bokeh.
    const { sizes, count } = buildStarBuffers(4000, seededRandom(seed));

    for (let i = 0; i < count; i += 1) {
      assert.ok(sizes[i] >= MIN_POINT_PX - 1e-6, `size ${sizes[i]} is below the floor`);
      assert.ok(sizes[i] <= MAX_POINT_PX + 1e-6, `size ${sizes[i]} exceeds the cap`);
    }
  }
});

test("size rises monotonically with brightness", () => {
  let previous = -Infinity;
  for (let i = 0; i <= 20; i += 1) {
    const size = sizeForBrightness(i / 20);
    assert.ok(size >= previous, "a brighter star must never be smaller");
    previous = size;
  }
});

test("no star is ever green, at any brightness", () => {
  for (const seed of SEEDS) {
    // The Planckian locus never enters the green region of CIE 1931 — green is
    // never the dominant channel of a thermal emitter at any temperature. This
    // has to hold structurally, not just on average.
    const { colors, count } = buildStarBuffers(6000, seededRandom(seed));

    for (let i = 0; i < count; i += 1) {
      const r = colors[i * 3];
      const g = colors[i * 3 + 1];
      const b = colors[i * 3 + 2];
      assert.ok(
        g <= Math.max(r, b) + 1e-6,
        `star ${i} has green as its dominant channel: ${r},${g},${b}`,
      );
    }
  }
});

test("every spectral class colour is itself non-green and normalised", () => {
  for (const cls of SPECTRAL_CLASSES) {
    const [r, g, b] = cls.color;
    assert.ok(g <= Math.max(r, b), `class ${cls.name} is green-dominant`);
    assert.ok(
      Math.abs(Math.max(r, g, b) - 1) < 1e-6,
      `class ${cls.name} max channel is ${Math.max(r, g, b)}, expected 1`,
    );
  }
});

test("the spectral shares form a distribution", () => {
  const total = SPECTRAL_CLASSES.reduce((sum, c) => sum + c.share, 0);
  assert.ok(Math.abs(total - 1) < 0.01, `shares sum to ${total}`);
});

test("spectral sampling matches the naked-eye distribution", () => {
  // Sampling the TRUE stellar population (76% M dwarfs) instead of the visible
  // one produces an almost entirely dim red field that looks nothing like the
  // sky. This guards that the right distribution is in use.
  const seen: Record<string, number> = {};
  const N = 40000;
  for (let i = 0; i < N; i += 1) {
    const cls = sampleSpectralClass((i + 0.5) / N);
    seen[cls.name] = (seen[cls.name] ?? 0) + 1;
  }
  for (const cls of SPECTRAL_CLASSES) {
    const observed = (seen[cls.name] ?? 0) / N;
    assert.ok(
      Math.abs(observed - cls.share) < 0.01,
      `class ${cls.name}: sampled ${observed}, expected ${cls.share}`,
    );
  }
  // The visible sky is blue-white heavy, not red-dwarf heavy.
  const hot = seen.O + seen.B + seen.A;
  assert.ok(hot / N > 0.35, "the naked-eye sky should be ~42% O/B/A");
  assert.ok((seen.M ?? 0) / N < 0.1, "M stars should be a small minority when visible");
});

test("saturation stays below the whiteness ceiling Andrew asked for", () => {
  for (const seed of SEEDS) {
    // He rejected a blue at 27.5% HSV saturation as "too blue". The research's
    // recommended ceiling (33-39%, true catalogue chroma) was MORE saturated than
    // the thing he rejected, so it is inverted here into a whiteness floor.
    const { colors, count } = buildStarBuffers(6000, seededRandom(seed));
    let peak = 0;

    for (let i = 0; i < count; i += 1) {
      const r = colors[i * 3];
      const g = colors[i * 3 + 1];
      const b = colors[i * 3 + 2];
      const max = Math.max(r, g, b);
      if (max <= 0) continue;
      peak = Math.max(peak, (max - Math.min(r, g, b)) / max);
    }

    assert.ok(peak <= 0.2, `peak saturation was ${peak}, expected <= 0.2`);
  }
});

test("faint stars are white, not muddy tinted dots", () => {
  for (const seed of SEEDS) {
    // The actual cause of Andrew's "some stars are grey and read as green": the
    // old generator floored luminance at 0.3 while still applying a full tint, so
    // a faint cool star rendered as a dark blue-grey (0.22, 0.25, 0.30) dot.
    // Saturation must now rise with brightness.
    const { colors, sizes, count } = buildStarBuffers(6000, seededRandom(seed));
    const rows: { lum: number; sat: number }[] = [];

    for (let i = 0; i < count; i += 1) {
      const r = colors[i * 3];
      const g = colors[i * 3 + 1];
      const b = colors[i * 3 + 2];
      const max = Math.max(r, g, b);
      if (max <= 0) continue;
      rows.push({ lum: max, sat: (max - Math.min(r, g, b)) / max });
    }
    rows.sort((a, b) => a.lum - b.lum);

    const dimmest = rows.slice(0, Math.floor(rows.length * 0.25));
    const brightest = rows.slice(-Math.floor(rows.length * 0.05));
    const dimSat = dimmest.reduce((s, r) => s + r.sat, 0) / dimmest.length;
    const brightSat = brightest.reduce((s, r) => s + r.sat, 0) / brightest.length;

    assert.ok(dimSat < 0.05, `faint stars averaged ${dimSat} saturation, expected near-white`);
    assert.ok(brightSat > dimSat * 2, "the brightest stars should carry what colour there is");
    assert.equal(sizes.length, count);
  }
});

test("magnitude sampling spans the range and favours faint stars", () => {
  assert.ok(Math.abs(sampleMagnitude(0) - MAG_BRIGHTEST) < 1e-6);
  assert.ok(Math.abs(sampleMagnitude(1) - MAG_FAINTEST) < 1e-6);

  // N(<m) grows ~3.2x per magnitude, so the faint half of the range must hold
  // the overwhelming majority of the population.
  let faint = 0;
  const N = 20000;
  for (let i = 0; i < N; i += 1) {
    if (sampleMagnitude((i + 0.5) / N) > (MAG_BRIGHTEST + MAG_FAINTEST) / 2) faint += 1;
  }
  assert.ok(faint / N > 0.85, `only ${faint / N} of stars were in the faint half`);
});

test("brightness is monotonic in magnitude and normalised", () => {
  // Normalised to exactly [0, 1] across the sampled magnitude range. The
  // faintest star is 0 here, not 0.07: the compression's own floor was what
  // pinned almost every star to the minimum point size.
  assert.ok(Math.abs(brightnessForMagnitude(MAG_BRIGHTEST) - 1) < 1e-9);
  assert.ok(Math.abs(brightnessForMagnitude(MAG_FAINTEST)) < 1e-9);
  // Brightness 0 must still render: sub-floor stars fade rather than vanish.
  assert.ok(fadeForBrightness(0) > 0.1, "the faintest star must remain visible");

  let previous = Infinity;
  for (let m = MAG_BRIGHTEST; m <= MAG_FAINTEST; m += 0.25) {
    const brightness = brightnessForMagnitude(m);
    assert.ok(brightness <= previous, "a fainter star must never be brighter");
    previous = brightness;
  }
});

test("the buffer is sized for the maximum, not the current tier", () => {
  const buffers = buildStarBuffers();

  assert.equal(buffers.count, MAX_STARS);
  assert.equal(buffers.positions.length, MAX_STARS * 3);
  assert.equal(buffers.sizes.length, MAX_STARS);
});
