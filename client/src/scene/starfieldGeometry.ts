/**
 * Pure generator for the starfield buffers (2026-07-21).
 *
 * Split out of Starfield.tsx so the distribution and the palette are a
 * dependency-free contract with Node tests, matching how the rest of the
 * project treats scene maths. No three.js import — the component wraps these
 * arrays in a BufferGeometry.
 *
 * The buffer is generated ONCE at MAX_STARS and the quality tier varies the
 * draw range. That is not an optimisation, it is the fix for a bug Andrew hit:
 * regenerating on a count change swapped the entire sky in one frame when the
 * adaptive tier stepped down. Because every star is drawn independently here, a
 * prefix of the buffer is already a uniform random subset — which is precisely
 * what makes `setDrawRange` a safe way to thin the field.
 */

export const MAX_STARS = 4000;

/** Outside the scene fog (near 12, far 34), which would otherwise erase them. */
export const SHELL_INNER = 22;
export const SHELL_OUTER = 78;

/** Near-white, drifting cool <-> warm. Andrew's palette call, 2026-07-21. */
export const STAR_COOL: RGB = [0.725, 0.831, 1];
export const STAR_WARM: RGB = [1, 0.863, 0.706];

export type RGB = [number, number, number];

export interface StarBuffers {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  count: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
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

    // Temperature drift, biased hard toward white by the exponent so a tinted
    // star reads as occasional character rather than as a colour scheme.
    const temperature = random() * 2 - 1;
    const target = temperature < 0 ? STAR_COOL : STAR_WARM;
    const mix = Math.abs(temperature) ** 1.6;
    // A handful of bright stars against many faint ones. Uniform brightness
    // reads as noise; a steep falloff reads as a sky.
    const luminance = 0.3 + random() ** 2.2 * 0.7;

    colors[i * 3] = lerp(1, target[0], mix) * luminance;
    colors[i * 3 + 1] = lerp(1, target[1], mix) * luminance;
    colors[i * 3 + 2] = lerp(1, target[2], mix) * luminance;

    sizes[i] = 0.8 + random() ** 3 * 3.4;
  }

  return { positions, colors, sizes, count };
}
