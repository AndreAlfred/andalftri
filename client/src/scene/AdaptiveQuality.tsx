import { PerformanceMonitor } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { useQualityStore } from "@/hooks/useQuality";
import {
  dprForFactor,
  factorForTier,
  profileFor,
  type QualityTier,
} from "@/lib/qualityTier";

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
  // Read once, at mount: the monitor's `factor` prop is its INITIAL value, so
  // re-rendering with a different one would not move it anyway. Capturing the
  // store's opening tier keeps the seed and the mounted DPR in agreement.
  const [startFactor] = useState(() => factorForTier(useQualityStore.getState().tier));

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
      // `factor` is the running 0..1 health estimate; `step` bounds how fast it
      // can move so a single hitch (a GC pause, a tab regaining focus) cannot
      // drop the whole site a rung. `flipflops` gives up on climbing back after
      // repeated failures, which is what stops the visible pumping that naive
      // adaptive-DPR does.
      //
      // 2026-07-30: this was a hard-coded 1 — "start optimistic and let the
      // machine argue". It now starts wherever the conservative opening bid put
      // us, so the machine argues in BOTH directions. Seeding at 1 while the
      // renderer mounts at a lower rung would tell the monitor it was already at
      // the top, and the climb-back-up path would never fire.
      factor={startFactor}
      step={0.15}
      flipflops={3}
      onChange={({ factor }) => {
        useQualityStore.getState().setFactor(factor);
        applyDpr(dprForFactor(factor, profileFor("high").dpr));
      }}
      onFallback={() => applyTier("low")}
    />
  );
}
