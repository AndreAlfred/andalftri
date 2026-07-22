/**
 * Pure generator for the starfield buffers.
 *
 * Rebuilt 2026-07-22 on real stellar physics after Andrew's review ("all the
 * stars are the same size... some are grey and read as green... the blue ones
 * are too blue"). No three.js import, so the distribution and palette stay a
 * dependency-free contract with Node tests.
 *
 * ── WHY THERE ARE NO GREEN STARS ────────────────────────────────────────────
 * Stars are thermal (blackbody) emitters, and the Planckian locus never enters
 * the green region of CIE 1931 — its maximum y is ~0.42, at the ORANGE end,
 * against y = 0.60 for the sRGB green primary. Green is never the dominant
 * channel of a blackbody at any temperature. Real star hues occupy two narrow
 * islands, ~225-228 degrees (blue, faintly violet) and ~28-40 degrees (amber).
 * The whole arc between them — yellow, chartreuse, green, cyan, teal — is
 * astrophysically impossible, and the transition between the islands happens
 * through DESATURATION TO WHITE, never through intermediate hues.
 *
 * So the fix for "reads as green" is structural: sample a spectral class, take
 * that class's measured colour, and lerp toward WHITE. Nothing here can produce
 * a hue that does not exist in the sky.
 *
 * ── WHY THE FIELD IS SO CLOSE TO WHITE ──────────────────────────────────────
 * Two reasons, one physical and one Andrew's.
 *
 * Physical: colour vision is photopic. Under dark adaptation only rods are
 * active and rod vision is monochromatic, so only the brightest handful of
 * stars show any colour at all to a real observer. Faint stars ARE grey.
 * Saturation is therefore driven by magnitude, not assigned at random.
 *
 * Andrew's: he rejected a blue at 27.5% HSV saturation as "too blue". The
 * research recommended a ceiling of 33-39% (the true catalogue chroma), which
 * is *more* saturated than the thing he rejected — so that ceiling is inverted
 * here into a whiteness floor. MAX_CHROMA caps the brightest star in the field
 * at ~16% saturation. This also serves CLAUDE.md's subtraction rule: the warm
 * artifact is primary, and a field at catalogue chroma would compete with it.
 *
 * ── WHY "GREY" STARS ARE GONE ───────────────────────────────────────────────
 * The previous generator floored luminance at 0.3 while still applying a cool
 * tint, so a faint cool star rendered as roughly (0.22, 0.25, 0.30) — a dark
 * blue-grey dot, which is what Andrew saw, and which reads greenish by
 * simultaneous contrast next to warm amber neighbours. Now saturation scales
 * WITH brightness, so a faint star is a faint WHITE star, never a muddy tinted
 * one.
 */

export const MAX_STARS = 4000;

/** Outside the scene fog (near 12, far 34), which would otherwise erase them. */
export const SHELL_INNER = 22;
export const SHELL_OUTER = 78;

/**
 * Naked-eye spectral distribution, computed from the Yale Bright Star
 * Catalogue (V <= 6.5, N = 8101 classified).
 *
 * This is emphatically NOT the distribution of all stars — the real universe is
 * ~76% M dwarfs, and a field sampled from it would be almost entirely dim red
 * and would look nothing like the sky. Malmquist bias means intrinsically
 * luminous hot stars are hugely over-represented among the stars you can
 * actually see (class O by a factor of ~20,000). The visible sky is ~42%
 * blue-white and ~31% amber. Sampling from the true population instead of the
 * visible one is the single most common way a procedural starfield goes wrong.
 *
 * Colours are the measured per-class sRGB values derived from Kurucz/Pickles
 * model spectra (vendian.org), which include the Balmer jump and line
 * blanketing that a pure Planck curve misses.
 *
 * These are used as DIRECTIONS to lerp from white toward, never as endpoints.
 */
export interface SpectralClass {
  name: string;
  /** Share of the naked-eye visible population. */
  share: number;
  /** Measured sRGB, 0..1. Max channel is 1 for every class. */
  color: [number, number, number];
}

export const SPECTRAL_CLASSES: SpectralClass[] = [
  { name: "O", share: 0.0062, color: [0.608, 0.690, 1.0] }, // #9bb0ff
  { name: "B", share: 0.196, color: [0.667, 0.749, 1.0] }, // #aabfff
  { name: "A", share: 0.217, color: [0.792, 0.843, 1.0] }, // #cad7ff
  { name: "F", share: 0.143, color: [0.973, 0.969, 1.0] }, // #f8f7ff
  { name: "G", share: 0.133, color: [1.0, 0.957, 0.918] }, // #fff4ea
  { name: "K", share: 0.246, color: [1.0, 0.824, 0.631] }, // #ffd2a1
  { name: "M", share: 0.06, color: [1.0, 0.8, 0.435] }, // #ffcc6f
];

/**
 * Saturation ceiling for the very brightest star in the field, as the lerp
 * fraction toward the class colour. Because every class colour has a max
 * channel of 1, final HSV saturation works out to almost exactly
 * `mix * classSaturation` — so 0.4 on class O (S = 39%) lands at S ~= 16%.
 */
export const MAX_CHROMA = 0.4;

/**
 * Apparent-magnitude range sampled.
 *
 * The naked-eye limit is ~6.5, which corresponds to about 5,000 stars over the
 * whole sky. This field renders ~2,300, so cutting off at 5.6 — roughly where
 * the real sky's brightest 2,500 stars end — is the honest limit for the count
 * being drawn. Keeping the 6.5 tail while drawing half as many stars would just
 * pack the population into the faintest, most uniform bin.
 */
export const MAG_BRIGHTEST = -1;
export const MAG_FAINTEST = 5.6;

/**
 * Counts grow ~3.2x per magnitude: N(<m) proportional to 10^(0.50 m).
 *
 * 0.50 rather than the idealised 0.60 of a uniform infinite 3D distribution,
 * because the Milky Way is a flattened, dusty disk. Using 0.60 produces
 * noticeably too many faint stars.
 */
export const MAG_SLOPE = 0.5;

/** Rendered point diameter in CSS px, before the device pixel ratio. */
export const MIN_POINT_PX = 1.25;
export const MAX_POINT_PX = 4.2;

export interface StarBuffers {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  count: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Inverse CDF of N(<m) ∝ 10^(slope·m) over [MAG_BRIGHTEST, MAG_FAINTEST]. */
export function sampleMagnitude(u: number): number {
  const lo = Math.pow(10, MAG_SLOPE * MAG_BRIGHTEST);
  const hi = Math.pow(10, MAG_SLOPE * MAG_FAINTEST);
  return Math.log10(lo + u * (hi - lo)) / MAG_SLOPE;
}

/** Pick a spectral class from the naked-eye distribution. */
export function sampleSpectralClass(u: number): SpectralClass {
  let acc = 0;
  for (const cls of SPECTRAL_CLASSES) {
    acc += cls.share;
    if (u <= acc) return cls;
  }
  return SPECTRAL_CLASSES[SPECTRAL_CLASSES.length - 1];
}

/**
 * Normalised 0..1 perceptual brightness for an apparent magnitude.
 *
 * True flux spans ~1000x across this magnitude range, which no display can show
 * at once, so the flux is compressed by a 0.4 exponent — the same approach
 * Stellarium takes before its tone-reproduction step. The remaining dynamic
 * range is split between intensity and point size, which is what the eye's own
 * optics do anyway.
 */
export function brightnessForMagnitude(mag: number): number {
  const compress = (m: number) =>
    Math.pow(Math.pow(10, -0.4 * (m - MAG_BRIGHTEST)), 0.4);
  // Rescaled so the faintest sampled star is exactly 0 and the brightest is 1.
  // Without this the compression leaves a floor (the faintest star still came
  // out at 0.088 of peak), and since the magnitude distribution piles ~85% of
  // the population into the faintest bins, that floor became the size almost
  // every star got — the flat field again, one layer further down.
  const floor = compress(MAG_FAINTEST);
  return (compress(mag) - floor) / (1 - floor);
}

/**
 * Point diameter in CSS px for a brightness in 0..1.
 *
 * Deliberately NOT a function of distance. Stars are unresolved point sources;
 * their apparent disc is entirely the point spread function of the eye or
 * sensor, so a brighter star looks larger only because more of its PSF wings
 * clear the detection threshold. Dividing by distance — which the previous
 * implementation did — is the physics of a sphere, not of a star, and it was
 * also what made every star clamp to an identical size.
 *
 * The floor matters as much as the range: sub-pixel points alias badly and
 * blink as they cross pixel boundaries when the camera moves. Below the floor,
 * fade rather than shrink (see `fadeForBrightness`).
 */
export function sizeForBrightness(brightness: number): number {
  // The exponent is BELOW 1 on purpose. `brightness` is already flux^0.4
  // compressed, and the magnitude distribution is steep — ~85% of the field
  // lands in the faintest bins — so a linear or super-linear map crushes almost
  // every star onto the floor. Measured with an exponent of 1.6: p1 = 1.29px,
  // p50 = 1.31px, p95 = 1.44px. Technically dozens of distinct sizes, visually
  // the same flat field Andrew complained about.
  //
  // Stellarium's radius grows roughly LINEARLY IN MAGNITUDE, i.e.
  // logarithmically in flux, which is what this exponent reproduces: it expands
  // the crowded faint end into a visible range while leaving the brightest few
  // genuinely large.
  return lerp(MIN_POINT_PX, MAX_POINT_PX, Math.pow(brightness, 0.55));
}

/**
 * Sub-floor stars fade instead of shrinking. Stellarium uses luminance ∝ r³
 * below its 1.2px floor for exactly this reason; without it the faintest stars
 * scintillate as they cross pixel boundaries, which is the artifact Andrew
 * already rejected once as bokeh.
 */
export function fadeForBrightness(brightness: number): number {
  return lerp(0.16, 1, Math.pow(brightness, 0.85));
}

export function buildStarBuffers(
  count = MAX_STARS,
  random: () => number = Math.random,
): StarBuffers {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    // Uniform on the sphere: the polar angle has to come from an evenly
    // distributed cosine, not an evenly distributed angle, or the field
    // visibly bunches at the poles.
    const u = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const planar = Math.sqrt(Math.max(0, 1 - u * u));
    const radius = SHELL_INNER + random() * (SHELL_OUTER - SHELL_INNER);

    positions[i * 3] = planar * Math.cos(theta) * radius;
    positions[i * 3 + 1] = planar * Math.sin(theta) * radius;
    positions[i * 3 + 2] = u * radius;

    const mag = sampleMagnitude(random());
    const brightness = brightnessForMagnitude(mag);
    const cls = sampleSpectralClass(random());

    // Saturation rides brightness: the faintest stars are white because that is
    // what rod vision actually delivers, and because a faint tinted dot is the
    // muddy grey Andrew objected to.
    const chroma = MAX_CHROMA * Math.pow(brightness, 1.3);
    const intensity = fadeForBrightness(brightness);

    colors[i * 3] = lerp(1, cls.color[0], chroma) * intensity;
    colors[i * 3 + 1] = lerp(1, cls.color[1], chroma) * intensity;
    colors[i * 3 + 2] = lerp(1, cls.color[2], chroma) * intensity;

    sizes[i] = sizeForBrightness(brightness);
  }

  return { positions, colors, sizes, count };
}
