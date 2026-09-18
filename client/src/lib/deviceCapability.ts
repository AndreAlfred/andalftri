export type DeviceCapabilityStrength = "weak" | "capable";
export type DeviceCapabilityType =
  | "WEBGL2"
  | "LIMITED_HARDWARE"
  | "WEBGL_UNSUPPORTED";

export interface HardwareHints {
  cores: number;
  memoryGb: number;
}

export interface DeviceCapabilityResult {
  tier: number;
  type: DeviceCapabilityType;
}

export interface DeviceCapability {
  strength: DeviceCapabilityStrength;
  tier: number;
  type: DeviceCapabilityType;
  isWeak: boolean;
  summary: string;
  result: DeviceCapabilityResult;
}

export type WebGL2ContextFactory = () => unknown;

function readHardwareHints(): HardwareHints {
  if (typeof navigator === "undefined") return { cores: 0, memoryGb: 0 };
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    cores: nav.hardwareConcurrency ?? 0,
    memoryGb: nav.deviceMemory ?? 0,
  };
}

function createWebGL2Context(): WebGL2RenderingContext | null {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", {
    failIfMajorPerformanceCaveat: false,
  });

  context?.getExtension("WEBGL_lose_context")?.loseContext();
  return context;
}

/**
 * Decide only whether the renderer can start, synchronously.
 *
 * The former detect-gpu lookup blocked the entire app on a third-party UNPKG
 * request, then treated network failure as "capable" anyway. It also could not
 * reliably distinguish Apple hardware. Startup quality is already chosen from
 * synchronous device hints and adapted from measured frame time. The gate now
 * uses only signals available before first paint: required WebGL2 support and
 * known severe CPU/memory limits. Unknown hardware remains capable rather than
 * being punished for hiding a hint.
 */
export function getDeviceCapability(
  createContext: WebGL2ContextFactory = createWebGL2Context,
  hardware: HardwareHints = readHardwareHints(),
): DeviceCapability {
  let hasWebGL2 = false;

  try {
    hasWebGL2 = Boolean(createContext());
  } catch {
    hasWebGL2 = false;
  }

  const isSeverelyLimited =
    (hardware.cores > 0 && hardware.cores <= 2) ||
    (hardware.memoryGb > 0 && hardware.memoryGb <= 2);
  const type: DeviceCapabilityType = !hasWebGL2
    ? "WEBGL_UNSUPPORTED"
    : isSeverelyLimited
      ? "LIMITED_HARDWARE"
      : "WEBGL2";
  const tier = !hasWebGL2 ? 0 : isSeverelyLimited ? 1 : 2;
  const isWeak = !hasWebGL2 || isSeverelyLimited;

  return {
    strength: isWeak ? "weak" : "capable",
    tier,
    type,
    isWeak,
    summary: !hasWebGL2
      ? "WebGL2 unavailable"
      : isSeverelyLimited
        ? "Limited hardware · static mode"
        : "WebGL2 renderer available",
    result: { tier, type },
  };
}
