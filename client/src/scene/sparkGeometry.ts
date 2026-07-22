/**
 * Pure generator for the near-field spark buffers.
 *
 * Split out 2026-07-22 so the depth/speed/size rules Andrew specified are a
 * dependency-free contract with Node tests. No three.js import.
 *
 * Andrew's review of the first version:
 *   - "the giant floating sparks read as weird coloured blobs and not sparks"
 *   - "it's weird that they're all the same distance away from the camera"
 *   - "create some variety both in position speed and size, but don't make any
 *      of them much bigger than they are currently"
 *   - "any of them that are moving very slow need to be very far in the
 *      background to maintain the illusion of distance"
 *   - "they should appear in randomly numbered groups, not only as singles"
 *   - "about half as frequent"
 *
 * The blobs were the same unclamped perspective sizing that flattened the
 * starfield, running in the other direction: a spark 3 units from the camera
 * with a base size of 5.8 projected to `5.8 * 260/3` ≈ 500px. Sizing is now
 * bounded in screen space, and the cap is expressed as a fraction of the
 * viewport so "no bigger than a screen on the medallion" holds at any window
 * size.
 */

export const TAIL_POINTS = 8;

/** Buffer is always built at this size; the tier varies the draw range. */
export const MAX_SPARKS = 72;

/**
 * Depth range, in world units from the origin.
 *
 * Widened from 6-16. Andrew wants visible variety in distance, and the previous
 * range was too narrow to read as depth at all.
 */
export const NEAR_RADIUS = 7;
export const FAR_RADIUS = 38;

/**
 * Fraction of its period a spark is alive. Halved from 0.2 at Andrew's request.
 */
export const DUTY = 0.1;

/** Groups: a burst is 1..MAX_GROUP sparks sharing a firing time. */
export const MAX_GROUP = 5;

/**
 * Half-depth of a burst, in world units. Members are scattered +/- this around
 * the group centre so a group has genuine thickness rather than sitting on a
 * shell. The group centre is inset by this amount (see buildSparkBuffers) so no
 * member ever needs clamping back into range.
 */
export const DEPTH_JITTER = 2.5;

/**
 * Fluorescent, deliberately saturated — these are the only saturated things in
 * the void, which is what makes them read as events rather than as decoration.
 */
export const NEON: [number, number, number][] = [
  [0.243, 0.941, 1.0], // cyan
  [1.0, 0.353, 0.878], // magenta
  [0.486, 1.0, 0.604], // green
  [1.0, 0.788, 0.29], // amber
  [0.69, 0.482, 1.0], // violet
];

export interface SparkBuffers {
  origins: Float32Array;
  dirs: Float32Array;
  colors: Float32Array;
  tails: Float32Array;
  periods: Float32Array;
  offsets: Float32Array;
  sizes: Float32Array;
  travels: Float32Array;
  count: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Apparent (angular) speed band allowed at a given normalised distance.
 *
 * This is Andrew's "anything moving very slowly must be very far away" rule,
 * expressed as a constraint rather than left to chance. A near spark is only
 * ever allowed to be fast; the slow end of the band opens up as distance
 * increases. Sampling speed and distance independently — which the first
 * version did — inevitably produced near sparks crawling across the frame,
 * which destroys the depth illusion because the eye reads angular speed as
 * inverse distance.
 *
 * `t` is 0 at NEAR_RADIUS and 1 at FAR_RADIUS.
 */
export function apparentSpeedRange(t: number): [number, number] {
  const clamped = Math.min(1, Math.max(0, t));
  // At t=0 the band is [0.72, 1]; at t=1 it is [0.18, 1].
  return [lerp(0.72, 0.18, clamped), 1];
}

/**
 * World-space travel distance for a spark.
 *
 * Angular speed is what the eye judges, and it falls off as 1/distance, so a
 * distant spark must cover MORE world units to appear to move at the same rate.
 * Multiplying by the radius is what keeps a far spark from looking frozen while
 * still letting it be genuinely slower on screen than a near one.
 */
export function travelFor(radius: number, apparentSpeed: number): number {
  return apparentSpeed * radius * 0.55;
}

export function buildSparkBuffers(
  count = MAX_SPARKS,
  random: () => number = Math.random,
): SparkBuffers {
  const total = count * TAIL_POINTS;
  const origins = new Float32Array(total * 3);
  const dirs = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const tails = new Float32Array(total);
  const periods = new Float32Array(total);
  const offsets = new Float32Array(total);
  const sizes = new Float32Array(total);
  const travels = new Float32Array(total);

  let s = 0;
  while (s < count) {
    // GROUPS. Andrew asked for "randomly numbered groups, not only singles".
    // A group shares a period and a firing offset, so its members strike
    // together, but each keeps its own direction, distance, size and speed —
    // otherwise a burst reads as one object rather than several.
    const groupSize = Math.min(1 + Math.floor(random() * MAX_GROUP), count - s);

    // Periods are spread widely and never shared BETWEEN groups. A common
    // period would have the whole field firing in lockstep, which reads as a
    // machine rather than as magic.
    const period = 9 + random() * 26;
    const groupOffset = random() * period;
    // Members are scattered around a shared centre so a burst occupies one
    // region of sky rather than the whole shell.
    const cu = random() * 2 - 1;
    const cTheta = random() * Math.PI * 2;
    // The group centre is drawn from a range INSET by the depth jitter, so a
    // member's radius never needs clamping. Clamping was a real bug: a group
    // whose centre landed near either shell edge had every member clamp to the
    // same value, collapsing the burst into a flat plane at exactly NEAR_RADIUS
    // or FAR_RADIUS. Caught by a seeded test; invisible under Math.random.
    const groupRadius =
      NEAR_RADIUS +
      DEPTH_JITTER +
      random() * (FAR_RADIUS - NEAR_RADIUS - 2 * DEPTH_JITTER);
    const spread = 0.18;

    for (let g = 0; g < groupSize; g += 1, s += 1) {
      // Jitter the member's direction off the group centre.
      const du = Math.min(1, Math.max(-1, cu + (random() * 2 - 1) * spread));
      const dTheta = cTheta + (random() * 2 - 1) * spread * Math.PI;
      const planar = Math.sqrt(Math.max(0, 1 - du * du));
      // Members vary in depth within the burst, so a group has thickness.
      // Additive, not multiplicative, and bounded by construction rather than
      // by a clamp — see the DEPTH_JITTER inset on groupRadius above.
      const radius = groupRadius + (random() * 2 - 1) * DEPTH_JITTER;

      const ox = planar * Math.cos(dTheta) * radius;
      const oy = planar * Math.sin(dTheta) * radius;
      const oz = du * radius;

      let dx = random() * 2 - 1;
      let dy = random() * 2 - 1;
      let dz = random() * 2 - 1;
      const len = Math.hypot(dx, dy, dz) || 1;
      dx /= len;
      dy /= len;
      dz /= len;

      const depthT = (radius - NEAR_RADIUS) / (FAR_RADIUS - NEAR_RADIUS);
      const [speedMin, speedMax] = apparentSpeedRange(depthT);
      const apparentSpeed = speedMin + random() * (speedMax - speedMin);

      const colour = NEON[Math.floor(random() * NEON.length)];
      // Base size varies per spark, and the shader scales it by distance and
      // then hard-caps it in screen space. Andrew: nothing much bigger than the
      // current sparks.
      const size = 1.5 + random() * 2.2;
      // Members of a burst are offset slightly in time so they streak rather
      // than flashing as one shape.
      const offset = groupOffset + (random() * 2 - 1) * period * 0.02;

      for (let t = 0; t < TAIL_POINTS; t += 1) {
        const i = s * TAIL_POINTS + t;
        origins[i * 3] = ox;
        origins[i * 3 + 1] = oy;
        origins[i * 3 + 2] = oz;
        dirs[i * 3] = dx;
        dirs[i * 3 + 1] = dy;
        dirs[i * 3 + 2] = dz;
        colors[i * 3] = colour[0];
        colors[i * 3 + 1] = colour[1];
        colors[i * 3 + 2] = colour[2];
        tails[i] = t / (TAIL_POINTS - 1);
        periods[i] = period;
        offsets[i] = offset;
        sizes[i] = size;
        travels[i] = travelFor(radius, apparentSpeed);
      }
    }
  }

  return { origins, dirs, colors, tails, periods, offsets, sizes, travels, count };
}
