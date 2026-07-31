import {
  getPreviewFlags,
  startingTierFor,
  textureEdgeCapFor,
  type DeviceHints,
  type QualityTier,
} from "@/lib/qualityTier";

/**
 * The DOM half of the conservative-start decision (2026-07-30).
 *
 * `qualityTier.ts` owns the policy and is a pure module so the Node tests can
 * sweep it; this file only reads the browser. Everything here is synchronous by
 * requirement, not by preference — the whole point is to have an answer before
 * the first frame, so an async probe (detect-gpu's benchmark fetch, a WebGL
 * timer query) would arrive after the window it exists to cover.
 */
export function readDeviceHints(): DeviceHints {
  if (typeof window === "undefined") {
    return { coarsePointer: false, maxTouchPoints: 0, minScreenEdge: 0, cores: 0, memoryGb: 0 };
  }

  const coarsePointer =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;

  // `screen` rather than `innerWidth`: a phone's inner width shrinks with the
  // URL bar and changes on scroll, which would make this decision depend on
  // when it happened to be asked. The screen's short edge is orientation-stable.
  const width = window.screen?.width ?? 0;
  const height = window.screen?.height ?? 0;
  const minScreenEdge = width > 0 && height > 0 ? Math.min(width, height) : 0;

  // deviceMemory is Chromium-only; Safari reports neither it nor, on some
  // configurations, hardwareConcurrency. `startingTierFor` treats 0 as
  // "unknown", never as "weak".
  const nav = window.navigator as Navigator & { deviceMemory?: number };

  return {
    coarsePointer,
    maxTouchPoints: nav.maxTouchPoints ?? 0,
    minScreenEdge,
    cores: nav.hardwareConcurrency ?? 0,
    memoryGb: nav.deviceMemory ?? 0,
  };
}

/**
 * The tier the scene opens at.
 *
 * `?quality=` wins over the device hints. It is a preview instrument — its job
 * is to let Andrew inspect a tier he does not own the hardware for — so it has
 * to be in force from the FIRST paint rather than converged upon. Resolving it
 * here rather than in `AdaptiveQuality`'s effect also removes a real ordering
 * bug: that effect cannot run until the Canvas mounts, so a pinned tier used to
 * leave the CSS layers at the device-derived tier for the whole of loading.
 */
/**
 * The texture residency cap to apply, honouring `?texcap=` over the device.
 * Separate from `readStartingTier` because memory and framerate are different
 * budgets — see `textureEdgeCapFor`.
 */
export function readTextureEdgeCap(): number {
  if (typeof window === "undefined") return Infinity;
  const pinned = getPreviewFlags(window.location.search).pinnedTextureCap;
  if (pinned !== null) return pinned;
  return textureEdgeCapFor(readDeviceHints());
}

export function readStartingTier(): QualityTier {
  if (typeof window !== "undefined") {
    const pinned = getPreviewFlags(window.location.search).pinnedTier;
    if (pinned) return pinned;
  }
  return startingTierFor(readDeviceHints());
}

/**
 * Publish the live tier to the document so CSS can respond to it.
 *
 * The helmet aurora layers are screen-space CSS outside the Canvas, so no
 * WebGL-side quality knob has ever reached them — a device already down at
 * `low` was still compositing four animated full-viewport blur+mask layers. An
 * attribute on <html> is the whole mechanism; `index.css` does the rest through
 * custom properties, which keeps the values where an art-direction change can be
 * made without touching TypeScript.
 */
export function publishQualityTier(tier: QualityTier): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.quality = tier;
}
