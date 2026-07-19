// Pure math for the `@` return bubble (2026-07-18 spec §4): the bubble sits on
// the viewport edge in the direction the camera CAME FROM — i.e. pointing back
// toward the hub artifact — with a free-floating caret aimed the same way.
//
// World-to-screen convention: every page camera looks straight down -Z at its
// `cameraLookAt`, with no roll, so world +X maps to screen right and world +Y
// maps to screen UP (screen y therefore flips sign). The hub sits at the
// MENU_HUB_CAMERA lookAt (origin).

export type ViewportEdge = "top" | "bottom" | "left" | "right";

export interface ReturnAnchor {
  edge: ViewportEdge;
  /** 0-100: percentage along the edge's free axis (left→right or top→bottom). */
  alongPercent: number;
  /** Degrees for the caret: 0 = screen-up, positive clockwise. */
  angleDeg: number;
}

/** Keeps the bubble away from corners, where ornaments/context chrome live. */
export const ALONG_CLAMP: [number, number] = [15, 80];

export function computeReturnAnchor(
  pageLookAt: readonly [number, number, number],
  hubLookAt: readonly [number, number, number] = [0, 0, 0],
): ReturnAnchor {
  // Screen-space direction from the page's view center toward the hub.
  const dx = hubLookAt[0] - pageLookAt[0];
  const dy = -(hubLookAt[1] - pageLookAt[1]); // world up → screen down flip
  const magnitude = Math.max(Math.abs(dx), Math.abs(dy));

  // Degenerate case (already at the hub): park the bubble bottom-center.
  if (magnitude < 1e-6) {
    return { edge: "bottom", alongPercent: 50, angleDeg: 180 };
  }

  // Project onto the unit square: the dominant axis picks the edge, the other
  // axis (in [-1, 1]) becomes the position along that edge.
  const sx = dx / magnitude;
  const sy = dy / magnitude;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const edge: ViewportEdge = horizontal
    ? dx > 0
      ? "right"
      : "left"
    : dy > 0
      ? "bottom"
      : "top";
  const cross = horizontal ? sy : sx;
  const alongPercent = clamp(50 + cross * 50, ALONG_CLAMP[0], ALONG_CLAMP[1]);

  // atan2(x, -y) gives 0° at screen-up, clockwise-positive — CSS rotate() order.
  const angleDeg = (Math.atan2(dx, -dy) * 180) / Math.PI;

  return { edge, alongPercent, angleDeg };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
