import { create } from "zustand";
import {
  profileFor,
  tierForDpr,
  type QualityProfile,
  type QualityTier,
} from "@/lib/qualityTier";

/**
 * The live quality tier. Written by AdaptiveQuality (inside the Canvas), read
 * by the scene layers and the `?perf=1` readout.
 *
 * Andrew's 2026-07-21 direction was to adapt SILENTLY — no visitor-facing
 * control — so nothing in the HUD subscribes to this. It exists so the
 * atmosphere layers can thin themselves out before anything touches the
 * artifact, which is the degradation order he approved:
 *
 *   streaks -> sparks -> DPR -> stars -> (medallion, never)
 */
interface QualityState {
  tier: QualityTier;
  dpr: number;
  profile: QualityProfile;
  /** True when ?quality= pinned the tier and the monitor is not driving. */
  pinned: boolean;
  setTier: (tier: QualityTier, options?: { pinned?: boolean }) => void;
  setDpr: (dpr: number) => void;
}

const INITIAL_TIER: QualityTier = "high";

export const useQualityStore = create<QualityState>((set) => ({
  tier: INITIAL_TIER,
  dpr: profileFor(INITIAL_TIER).dpr,
  profile: profileFor(INITIAL_TIER),
  pinned: false,
  setTier: (tier, options) =>
    set({
      tier,
      profile: profileFor(tier),
      dpr: profileFor(tier).dpr,
      pinned: options?.pinned ?? false,
    }),
  setDpr: (dpr) =>
    set((state) => {
      if (state.dpr === dpr) return state;
      const tier = tierForDpr(dpr);
      // The DPR ladder is finer than the tier ladder, so a DPR step does not
      // always cross a tier boundary. Keep the profile in sync only when it
      // actually changes — otherwise every rung would churn the star buffer.
      return tier === state.tier
        ? { ...state, dpr }
        : { ...state, dpr, tier, profile: profileFor(tier) };
    }),
}));
