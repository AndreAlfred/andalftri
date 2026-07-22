/**
 * Runtime quality tiers + the preview flags that let Andrew see them.
 *
 * 2026-07-21 (see docs/plans/2026-07-21-latency-and-environment-proposal.md).
 * Andrew's direction: adapt SILENTLY. There is deliberately no visitor-facing
 * quality control — the site watches its own frame budget and steps down. The
 * flags below exist so Andrew can inspect a tier he does not happen to own the
 * hardware for; they are preview instruments, not features.
 *
 *   ?lite=1        force the StaticFallback (the weak-device site) on ANY device.
 *                  The missing inverse of the existing ?force-3d=1.
 *   ?quality=low   pin the tier instead of letting the monitor pick.
 *          |medium
 *          |high
 *   ?perf=1        corner readout: fps / dpr / draw calls / tier.
 *
 * Pure module, no DOM or three.js imports, so tests/qualityTier.test.ts can
 * exercise it under plain Node.
 */

export type QualityTier = "low" | "medium" | "high";

export const QUALITY_TIERS: QualityTier[] = ["low", "medium", "high"];

export interface QualityProfile {
  /** Device-pixel-ratio ceiling. The renderer never exceeds this. */
  dpr: number;
  /** Stars in the 3D field. */
  starCount: number;
  /** Concurrent GPU spark comets. */
  sparkCount: number;
  /** Screen-space visor streaks alive at once. 0 disables the layer. */
  streakCount: number;
  /** Hz at which the CRT grain redraws. */
  grainHz: number;
}

/**
 * DPR ladder. Quantized deliberately: every distinct DPR forces the renderer to
 * reallocate its drawing buffer, so a continuously-varying DPR would trade a
 * steady cost for a stuttering one. Four rungs is enough resolution to recover
 * a contended frame budget without the resize itself becoming the problem.
 */
export const DPR_LADDER = [0.75, 1, 1.25, 1.5] as const;

export const QUALITY_PROFILES: Record<QualityTier, QualityProfile> = {
  // The degradation order Andrew approved: streaks first, then sparks, then
  // DPR, then stars. The artifact itself is never touched by this table — no
  // tier here decimates, swaps, or softens the medallion.
  //
  // 2026-07-21 review: counts raised across the board (Andrew asked for more
  // magic), and critically NO tier is allowed to reach zero any more. The
  // original table zeroed sparks and streaks at `low`, which meant a machine
  // that dipped once lost the atmosphere permanently and silently. Thinning is
  // the goal; switching a layer off is a different, worse thing.
  low: { dpr: 0.75, starCount: 1400, sparkCount: 20, streakCount: 1, grainHz: 12 },
  medium: { dpr: 1, starCount: 2600, sparkCount: 44, streakCount: 2, grainHz: 20 },
  high: { dpr: 1.5, starCount: 3600, sparkCount: 72, streakCount: 3, grainHz: 30 },
};

export interface PreviewFlags {
  /** Force the static/weak-device site regardless of detected capability. */
  forceLite: boolean;
  /** Force the full 3D scene on a device detected as weak (pre-existing flag). */
  forceFullScene: boolean;
  /** Pin the tier; null = let the performance monitor drive. */
  pinnedTier: QualityTier | null;
  /** Show the fps / dpr / draw-call readout. */
  showPerfReadout: boolean;
}

function parseTier(raw: string | null): QualityTier | null {
  if (!raw) return null;
  const value = raw.toLowerCase();
  // "med" is the spelling people reach for; accept it rather than silently
  // falling back to the monitor and looking like the flag did nothing.
  if (value === "med") return "medium";
  return (QUALITY_TIERS as string[]).includes(value) ? (value as QualityTier) : null;
}

export function getPreviewFlags(search: string): PreviewFlags {
  const params = new URLSearchParams(search);
  const view = params.get("view");

  return {
    forceLite: params.get("lite") === "1" || view === "lite",
    forceFullScene: params.get("force-3d") === "1",
    pinnedTier: parseTier(params.get("quality")),
    showPerfReadout: params.get("perf") === "1",
  };
}

/**
 * Map the performance monitor's 0..1 health factor onto the DPR ladder.
 *
 * Rounding to the ladder (rather than interpolating) is what keeps the
 * framebuffer from being reallocated on every small fluctuation — the caller
 * compares against the current value and only applies real changes.
 */
export function dprForFactor(factor: number, ceiling = 1.5): number {
  const clamped = Math.min(1, Math.max(0, factor));
  const usable = DPR_LADDER.filter((step) => step <= ceiling);
  const ladder = usable.length > 0 ? usable : [DPR_LADDER[0]];
  const index = Math.round(clamped * (ladder.length - 1));
  return ladder[index];
}

/** Which tier a given DPR corresponds to, for the readout and the scene props. */
export function tierForDpr(dpr: number): QualityTier {
  if (dpr <= 0.8) return "low";
  if (dpr <= 1.05) return "medium";
  return "high";
}

export function profileFor(tier: QualityTier): QualityProfile {
  return QUALITY_PROFILES[tier];
}
