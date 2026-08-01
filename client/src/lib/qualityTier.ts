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
 *   ?texcap=1024   pin the texture residency cap (power of two) instead of
 *                  deriving it from the device — puts a desktop on the phone's
 *                  texture path so the resampled artifact can be judged on a
 *                  screen big enough to judge it on.
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
/**
 * 2026-07-22: the floor was 0.75, and that was a legibility cliff. Andrew
 * reported the screen text as "blurrier"; the adaptive ladder shipping in the
 * same commit as the mipmap regression meant a machine that stepped down was
 * *also* literally rendering at three-quarter resolution. This scene has small
 * text on angled surfaces at its centre, so sub-1.0 DPR costs more than it buys.
 * The perf pass reclaimed enough budget that the bottom rung is not needed.
 */
export const DPR_LADDER = [1, 1.15, 1.3, 1.5] as const;

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
  //
  // 2026-07-22: star counts cut ~35% (Andrew wants the field sparser), and the
  // grain rate cut across the board. The grain rate is what pays for restoring
  // the screen mip chain: every redraw re-uploads the canvas AND regenerates
  // eight mip levels, so the lever that matters is how often we upload, not
  // whether we mip. 30Hz -> 20Hz removes a third of both costs and CRT grain at
  // 20Hz is indistinguishable from 30Hz.
  low: { dpr: 1, starCount: 900, sparkCount: 20, streakCount: 1, grainHz: 10 },
  medium: { dpr: 1.15, starCount: 1600, sparkCount: 44, streakCount: 2, grainHz: 15 },
  high: { dpr: 1.5, starCount: 2300, sparkCount: 72, streakCount: 3, grainHz: 20 },
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
  /** Run the on-device ablation sweep; see client/src/lib/diagnostics.ts. */
  runDiagnostics: boolean;
  /**
   * Pin the texture residency cap in px; null = derive it from the device.
   * `?texcap=1024` puts a desktop on the phone's texture path, which is the
   * only way to judge the resampled artifact on a large screen — a phone is the
   * device that gets the reduction but the worst place to evaluate it.
   */
  pinnedTextureCap: number | null;
}

function parseTextureCap(raw: string | null): number | null {
  if (!raw) return null;
  const value = Number(raw);
  // Powers of two only. A non-power-of-two cap would resample to a size three
  // cannot mip cleanly, which is exactly the class of sampling bug that made
  // the screen text unreadable in July (lessons.md entry J).
  if (!Number.isFinite(value) || value < 16 || value > 8192) return null;
  return Number.isInteger(Math.log2(value)) ? value : null;
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
    runDiagnostics: params.get("diag") === "1",
    pinnedTextureCap: parseTextureCap(params.get("texcap")),
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
  // Boundaries track DPR_LADDER and each profile's own dpr — the round trip
  // tierForDpr(profileFor(t).dpr) === t is asserted in the tests, because if it
  // broke, a tier change would immediately re-derive a different tier and the
  // quality would oscillate.
  if (dpr <= 1) return "low";
  if (dpr <= 1.2) return "medium";
  return "high";
}

export function profileFor(tier: QualityTier): QualityProfile {
  return QUALITY_PROFILES[tier];
}

/**
 * Cheap synchronous signals available at mount, before any frame is drawn.
 * Deliberately not a GPU benchmark — see `startingTierFor` for why.
 */
export interface DeviceHints {
  /** matchMedia("(pointer: coarse)") — a finger, not a mouse. */
  coarsePointer: boolean;
  /** navigator.maxTouchPoints. */
  maxTouchPoints: number;
  /** The smaller of screen width/height in CSS px, orientation-independent. */
  minScreenEdge: number;
  /** navigator.hardwareConcurrency, or 0 when unavailable. */
  cores: number;
  /** navigator.deviceMemory in GiB, or 0 when unavailable (Safari never reports it). */
  memoryGb: number;
}

/**
 * Which tier the scene should START at, decided synchronously at mount.
 *
 * 2026-07-30. The problem this solves is the one the adaptive ladder
 * structurally cannot: `AdaptiveQuality` only corrects AFTER drei's
 * PerformanceMonitor has samples, and it is deliberately slow to move
 * (`step`, `flipflops`). So every device used to mount at `dpr={1.5}` — the top
 * rung — and render its opening seconds at maximum cost. On a phone those
 * seconds coincide with GLB decode, Draco decompression and texture upload, and
 * the damage is thermal: phones throttle on accumulated heat, so a spike at t=0
 * lowers the ceiling for the whole session. A measure-then-correct loop has a
 * blind window equal to its own latency, and the only thing that can cover that
 * window is a signal available before the first frame.
 *
 * Being wrong is asymmetric, which is why this starts low and climbs: guessing
 * too low costs a few seconds of slightly softer rendering that the monitor then
 * corrects upward, while guessing too high costs thermal headroom that is not
 * recoverable within the session. That asymmetry — not accuracy — is the whole
 * argument for a conservative start.
 *
 * Note this deliberately does NOT try to identify the device. detect-gpu already
 * owns "is this thing capable at all", and `deviceCapability.ts` special-cases
 * the obfuscated Apple renderer string (lessons.md entry D) precisely because
 * identification is unreliable. This asks a narrower, answerable question: is
 * there any reason to think the top rung is a bad opening bid?
 */
export function startingTierFor(hints: DeviceHints): QualityTier {
  const touch = hints.coarsePointer || hints.maxTouchPoints > 0;

  // A phone-sized touch device is the case the whole change exists for. The
  // 820px edge sits above every phone in portrait and below an iPad's 768pt
  // short edge only in portrait — tablets land in `medium` below, which is the
  // intended outcome rather than a missed case.
  if (touch && hints.minScreenEdge > 0 && hints.minScreenEdge <= 820) return "low";

  // Any touch-primary device that is not phone-sized: tablets, touch laptops.
  if (touch) return "medium";

  // Desktop with explicitly modest hardware. Both signals are absent on Safari,
  // in which case we do NOT infer weakness — unknown is not weak, the same rule
  // deviceCapability.ts applies to detect-gpu's FALLBACK type.
  if (hints.cores > 0 && hints.cores <= 4) return "medium";
  if (hints.memoryGb > 0 && hints.memoryGb <= 4) return "medium";

  return "high";
}

/**
 * Largest texture edge (px) this device should keep resident, or `Infinity` for
 * "ship what the artist authored".
 *
 * 2026-07-30. This is a MEMORY decision, not a framerate one, which is why it
 * reads device hints directly instead of the adaptive tier: textures are
 * uploaded once at load, so a tier that changes at second 15 cannot un-upload
 * them. It is also why it is separate from `startingTierFor` despite using the
 * same inputs — the two answer different questions and must be allowed to
 * disagree.
 *
 * The problem: `EXT_texture_webp` compresses the medallion's maps on the WIRE
 * only. On upload they decode to uncompressed RGBA, so the authored set
 * (3 × 2048² + 3 × 1024²) costs `w × h × 4 × 1.33` ≈ 84 MB resident once mip
 * chains are built. On iOS Safari that is a material fraction of the WebGL
 * budget and the failure mode is context loss — a black canvas — not a dropped
 * frame. Halving the 2048² set to 1024² takes the total to roughly 25 MB.
 *
 * 1024 is the cap rather than something smaller because of viewing distance,
 * which cuts the other way from the usual assumption: a phone is held closer
 * than a monitor, so the angular detail budget is not as forgiving as "it's a
 * small screen" suggests. 1024 across the artifact's dominant surface is still
 * well above what is resolvable at arm's length; 512 would not obviously be.
 */
export function textureEdgeCapFor(hints: DeviceHints): number {
  const touch = hints.coarsePointer || hints.maxTouchPoints > 0;
  if (touch && hints.minScreenEdge > 0 && hints.minScreenEdge <= 820) return 1024;
  return Infinity;
}

/**
 * The PerformanceMonitor `factor` that corresponds to a starting tier.
 *
 * `dprForFactor` maps 0..1 onto the ladder, so seeding the monitor with the
 * factor its own mapping would produce for our chosen tier keeps the two in
 * agreement. Seeding it at 1 (the old default) while mounting at a lower DPR
 * would make the monitor believe it was already at the top and it would only
 * ever step down — the climb-back-up path would be dead on arrival.
 */
export function factorForTier(tier: QualityTier): number {
  const target = profileFor(tier).dpr;
  const index = DPR_LADDER.indexOf(target as (typeof DPR_LADDER)[number]);
  if (index < 0) return 1;
  return index / (DPR_LADDER.length - 1);
}
