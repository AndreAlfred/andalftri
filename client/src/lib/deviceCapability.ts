import { getGPUTier, type TierResult, type TierType } from "detect-gpu";

export type DeviceCapabilityStrength = "weak" | "capable";

export interface DeviceCapability {
  strength: DeviceCapabilityStrength;
  tier: number;
  type: TierType;
  isWeak: boolean;
  summary: string;
  result: TierResult;
}

function buildSummary(result: TierResult) {
  const gpuName = result.gpu ?? result.device ?? result.type;
  return `GPU tier ${result.tier} · ${gpuName}`;
}

export async function getDeviceCapability(): Promise<DeviceCapability> {
  const result = await getGPUTier({
    failIfMajorPerformanceCaveat: false,
  });

  // detect-gpu quirks (2026-07-10, see lessons.md entry D):
  // 1. Safari/Apple Silicon reports an obfuscated "Apple GPU" renderer string
  //    that detect-gpu tiers at 1 despite being very capable hardware — every
  //    Apple GPU that can run a modern browser handles this scene fine.
  // 2. type "FALLBACK" means the benchmark fetch failed (CDN blocked/slow).
  //    Unknown is not weak — App.tsx's own catch path already assumes capable
  //    for the equivalent failure; keep the two paths consistent.
  const gpuName = (result.gpu ?? "").toLowerCase();
  const appleGpuQuirk = gpuName.includes("apple");
  const isWeak =
    result.type === "WEBGL_UNSUPPORTED" ||
    (result.tier <= 1 && !appleGpuQuirk && result.type !== "FALLBACK");

  return {
    strength: isWeak ? "weak" : "capable",
    tier: result.tier,
    type: result.type,
    isWeak,
    summary: buildSummary(result),
    result,
  };
}
