export type LightingMode = "legacy" | "studio";
export type StudioToneMapping = "agx" | "aces";

export interface EmblemTuning {
  /** null = leave the baked roughness untouched. */
  roughnessFloor: number | null;
  envIntensity: number;
}

export interface LightingPreviewSettings {
  mode: LightingMode;
  toneMapping: StudioToneMapping;
  screensDormant: boolean;
  keyLightPosition: [number, number, number];
  emblem: EmblemTuning;
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
    emblem: parseEmblemParam(params.get("emblem")),
  };
}

// `?emblem=baked` restores the pre-2026-07-19 emblem (mirror-sharp, bezel
// reflection strength) as a true before/after; `?emblem=0.42` sets just the
// roughness floor; `?emblem=0.42,2.2` sets floor and env intensity.
export function parseEmblemParam(raw: string | null): EmblemTuning {
  const fallback: EmblemTuning = {
    roughnessFloor: STUDIO_LIGHTING.emblemRoughnessFloor,
    envIntensity: STUDIO_LIGHTING.materialEnvIntensity.emblem,
  };

  if (raw === "baked") {
    return {
      roughnessFloor: null,
      envIntensity: STUDIO_LIGHTING.materialEnvIntensity.chrome,
    };
  }

  if (!raw) return fallback;

  const [rawFloor, rawEnv] = raw.split(",");
  const floor = Number(rawFloor);
  const env = rawEnv === undefined ? fallback.envIntensity : Number(rawEnv);

  if (!Number.isFinite(floor) || !Number.isFinite(env)) return fallback;

  return {
    // Roughness is a 0..1 material property; clamping keeps a fat-fingered
    // value from producing an invisible or fully-diffuse emblem.
    roughnessFloor: Math.min(1, Math.max(0, floor)),
    envIntensity: Math.max(0, env),
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
      // 2026-07-19: back to the approved baseline. The 2026-07-18 nudge to
      // [0.4, 3.8, 7.9] was aimed at the emblem's "dark glint" and Andrew
      // reported no visible change — expected in hindsight, since the `@` is a
      // near-mirror metal driven by env reflections, not by this light (see
      // medallionMaterialRole.ts). Restoring the baseline removes that
      // confound so the emblem roughness/env change is the only variable
      // under test. `?keylight=x,y,z` still free-tunes it.
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
    // 2026-07-19: the `@` reflects harder than the bezels so the softened
    // (rougher) lobe still reads as bright metal rather than grey. Paired with
    // EMBLEM_ROUGHNESS_FLOOR in medallionMaterialRole.ts.
    emblem: 1.9,
    screen: 0.85,
    default: 0.7,
  },
  // Lives here (not in medallionMaterialRole.ts) so the `?emblem=` parser
  // below can default from it without a circular import — that module already
  // imports this one.
  emblemRoughnessFloor: 0.34,
};
