import { PerformanceMonitor } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useQualityStore } from "@/hooks/useQuality";
import { dprForFactor, profileFor, type QualityTier } from "@/lib/qualityTier";

interface AdaptiveQualityProps {
  /** ?quality=low|medium|high pins the tier and disables the monitor. */
  pinnedTier: QualityTier | null;
}

/**
 * Silent runtime adaptation (2026-07-21).
 *
 * The problem this solves is NOT weak hardware — detect-gpu already routes weak
 * devices to StaticFallback. It is the case Andrew described: a capable machine
 * that is *contended right now*. A GPU tier is measured once at load and never
 * revisited; a contended machine looks capable to it and then stutters anyway.
 * drei's PerformanceMonitor watches the actual frame budget instead, so the
 * site responds to the machine's current state rather than its spec sheet.
 *
 * DPR is the lever because it is quadratic — dropping 1.5 -> 1.0 removes ~55%
 * of the fragments for a change most visitors read as "slightly softer", if
 * they notice at all. It is applied through `setDpr` rather than the `<Canvas>`
 * prop so React never remounts the renderer over a quality change.
 */
export function AdaptiveQuality({ pinnedTier }: AdaptiveQualityProps) {
  const setDpr = useThree((state) => state.setDpr);
  const applyTier = useQualityStore((state) => state.setTier);
  const applyDpr = useQualityStore((state) => state.setDpr);
  const dpr = useQualityStore((state) => state.dpr);

  useEffect(() => {
    if (!pinnedTier) return;
    applyTier(pinnedTier, { pinned: true });
  }, [applyTier, pinnedTier]);

  // One place applies DPR to the renderer, whether it came from the monitor or
  // from ?quality=. Reallocating the drawing buffer is expensive, so the store
  // quantizes to the ladder and drops no-op writes before we ever get here.
  useEffect(() => {
    setDpr(dpr);
  }, [dpr, setDpr]);

  if (pinnedTier) return null;

  return (
    <PerformanceMonitor
      // Start optimistic and let the machine argue. `factor` is the running
      // 0..1 health estimate; `step` bounds how fast it can move so a single
      // hitch (a GC pause, a tab regaining focus) cannot drop the whole site a
      // rung. `flipflops` gives up on climbing back after repeated failures,
      // which is what stops the visible pumping that naive adaptive-DPR does.
      factor={1}
      step={0.15}
      flipflops={3}
      onChange={({ factor }) => applyDpr(dprForFactor(factor, profileFor("high").dpr))}
      onFallback={() => applyTier("low")}
    />
  );
}
