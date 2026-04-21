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

  const isWeak = result.tier <= 1 || result.type === "WEBGL_UNSUPPORTED" || result.type === "FALLBACK";

  return {
    strength: isWeak ? "weak" : "capable",
    tier: result.tier,
    type: result.type,
    isWeak,
    summary: buildSummary(result),
    result,
  };
}
