/**
 * Path geometry for the visor streaks (2026-07-21).
 *
 * Split out of VisorStreaks.tsx so the curve and spawn rules are a pure,
 * dependency-free contract with Node tests, matching how the rest of the
 * project treats scene maths. The component keeps the canvas and the loop.
 */

export type Point = [number, number];

export const STREAK_EDGES = ["left", "right", "top", "bottom"] as const;
export type StreakEdge = (typeof STREAK_EDGES)[number];

/** How far outside the viewport a streak is born and dies, in px. */
export const OFF_SCREEN_MARGIN = 40;

export interface StreakPath {
  /** Cubic control points in viewport pixels. */
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
  entryEdge: StreakEdge;
  exitEdge: StreakEdge;
}

export interface Streak extends StreakPath {
  color: string;
  width: number;
  /** 0..1 head progress along the curve. */
  progress: number;
  speed: number;
  /** Trailing fraction of the curve still lit behind the head. */
  tail: number;
}

/** Deterministic given `random`, so the tests can drive the edge cases. */
function pointOnEdge(edge: StreakEdge, along: number, w: number, h: number): Point {
  const m = OFF_SCREEN_MARGIN;
  switch (edge) {
    case "left":
      return [-m, h * along];
    case "right":
      return [w + m, h * along];
    case "top":
      return [w * along, -m];
    case "bottom":
      return [w * along, h + m];
  }
}

export function cubicAt(path: StreakPath, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * path.p0[0] + b * path.p1[0] + c * path.p2[0] + d * path.p3[0],
    a * path.p0[1] + b * path.p1[1] + c * path.p2[1] + d * path.p3[1],
  ];
}

/**
 * Streaks enter and leave through different viewport edges, and the control
 * points are thrown well off-axis so the path arcs and doubles back rather than
 * running straight — that curvature is the "filigree" in Andrew's brief.
 *
 * `random` is injected so the spawn rules are testable; production passes
 * Math.random.
 */
export function buildStreakPath(
  w: number,
  h: number,
  random: () => number = Math.random,
): StreakPath {
  const entryIndex = Math.floor(random() * STREAK_EDGES.length);
  const entryEdge = STREAK_EDGES[entryIndex] ?? STREAK_EDGES[0];
  const entryAlong = 0.15 + random() * 0.7;

  // Rotate by 1..3 so the exit index can never land back on the entry index.
  // A streak that leaves the way it came reads as a bounce, not a passage.
  const exitIndex =
    (entryIndex + 1 + Math.floor(random() * (STREAK_EDGES.length - 1))) % STREAK_EDGES.length;
  const exitEdge = STREAK_EDGES[exitIndex] ?? STREAK_EDGES[1];
  const exitAlong = 0.15 + random() * 0.7;

  const p0 = pointOnEdge(entryEdge, entryAlong, w, h);
  const p3 = pointOnEdge(exitEdge, exitAlong, w, h);

  const swing = Math.min(w, h) * (0.35 + random() * 0.5);
  const angle = random() * Math.PI * 2;

  return {
    p0,
    p1: [p0[0] + Math.cos(angle) * swing, p0[1] + Math.sin(angle) * swing],
    // The second handle is thrown on a different bearing from the first, which
    // is what puts an S-bend in the curve instead of a single lazy arc.
    p2: [
      p3[0] + Math.cos(angle + Math.PI * 0.6) * swing,
      p3[1] + Math.sin(angle + Math.PI * 0.6) * swing,
    ],
    p3,
    entryEdge,
    exitEdge,
  };
}
