export type LightingMode = "legacy" | "studio";
export type StudioToneMapping = "agx" | "aces";

export interface LightingPreviewSettings {
  mode: LightingMode;
  toneMapping: StudioToneMapping;
  screensDormant: boolean;
}

export function getLightingPreviewSettings(search: string): LightingPreviewSettings {
  const params = new URLSearchParams(search);
  return {
    mode: params.get("lighting") === "studio" ? "studio" : "legacy",
    toneMapping: params.get("tone") === "aces" ? "aces" : "agx",
    screensDormant: params.get("screens") === "dormant",
  };
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
      position: [0.8, 4.6, 7.5] as [number, number, number],
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
