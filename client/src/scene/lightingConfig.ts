export type LightingMode = "legacy" | "studio";
export type StudioToneMapping = "agx" | "aces";

export interface LightingPreviewSettings {
  mode: LightingMode;
  toneMapping: StudioToneMapping;
  screensDormant: boolean;
  keyLightPosition: [number, number, number];
}

// Pre-2026-07-18 key position. Andrew reported it put a glare on the center
// medallion `@` that read dark instead of brilliant white at the rest pose
// (the drift-darkening during the lemniscate is intentional and kept).
// Compare live via `?keylight=legacy`; free-tune via `?keylight=x,y,z`.
export const LEGACY_KEY_LIGHT_POSITION: [number, number, number] = [0.8, 4.6, 7.5];

export function getLightingPreviewSettings(search: string): LightingPreviewSettings {
  const params = new URLSearchParams(search);
  return {
    mode: params.get("lighting") === "legacy" ? "legacy" : "studio",
    toneMapping: params.get("tone") === "agx" ? "agx" : "aces",
    screensDormant: params.get("screens") === "dormant",
    keyLightPosition: parseKeyLightParam(params.get("keylight")),
  };
}

function parseKeyLightParam(raw: string | null): [number, number, number] {
  if (raw === "legacy") return LEGACY_KEY_LIGHT_POSITION;
  if (raw) {
    const parts = raw.split(",").map(Number);
    if (parts.length === 3 && parts.every(Number.isFinite)) {
      return [parts[0], parts[1], parts[2]];
    }
  }
  return STUDIO_LIGHTING.direct.key.position;
}

export const STUDIO_LIGHTING = {
  background: "#080a0d",
  fog: {
    color: "#080a0d",
    near: 12,
    far: 34,
  },
  grid: {
    cellColor: "#1b2329",
    sectionColor: "#2a353e",
    fadeDistance: 24,
    fadeStrength: 1.5,
  },
  renderer: {
    exposure: 0.92,
  },
  direct: {
    fill: {
      color: "#eef2f6",
      intensity: 0.06,
    },
    key: {
      color: "#ffffff",
      intensity: 1.35,
      // 2026-07-18: nudged from LEGACY_KEY_LIGHT_POSITION [0.8, 4.6, 7.5] —
      // slightly lower and more frontal so the center `@` emblem catches the
      // key square-on at the rest pose instead of a glancing glare. NEEDS
      // Andrew's real-browser verdict; revert to the legacy constant if it
      // reads worse (A/B via `?keylight=legacy`).
      position: [0.4, 3.8, 7.9] as [number, number, number],
    },
  },
  environment: {
    resolution: 256,
    frames: 1,
    cards: [
      {
        id: "front-softbox",
        role: "neutral" as const,
        color: "#f8fafc",
        intensity: 2.4,
        position: [0, 2.4, 6] as [number, number, number],
        scale: [8, 6] as [number, number],
      },
      {
        id: "left-shaper",
        role: "neutral" as const,
        color: "#dfe5ea",
        intensity: 1.05,
        position: [-4.5, 1, 1] as [number, number, number],
        scale: [1.6, 6] as [number, number],
      },
      {
        id: "lower-separator",
        role: "neutral" as const,
        color: "#cbd3da",
        intensity: 0.45,
        position: [0, -5, 0] as [number, number, number],
        scale: [5, 1.5] as [number, number],
      },
      {
        id: "aurora-edge",
        role: "cool-edge" as const,
        color: "#94d9ee",
        intensity: 0.35,
        position: [5, 1, -2] as [number, number, number],
        scale: [0.75, 6.5] as [number, number],
      },
    ],
  },
  materialEnvIntensity: {
    body: 0.55,
    chrome: 1.25,
    screen: 0.85,
    default: 0.7,
  },
};
