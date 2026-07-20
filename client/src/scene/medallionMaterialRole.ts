import type * as THREE from "three";
import { STUDIO_LIGHTING } from "./lightingConfig.ts";

export type MedallionMaterialRole =
  | "body"
  | "chrome"
  | "emblem"
  | "screen"
  | "default";

export function getMedallionMaterialRole(meshName: string): MedallionMaterialRole {
  if (meshName === "shield_body" || meshName === "medallion_core") {
    return "body";
  }
  // 2026-07-19: the center `@` split out of "chrome" so it can be tuned
  // without touching the seven bezels (see EMBLEM_* below).
  if (meshName === "medallion_at") {
    return "emblem";
  }
  if (/^section_0\d_bezel$/.test(meshName)) {
    return "chrome";
  }
  if (/^section_0\d_screen$/.test(meshName)) {
    return "screen";
  }
  return "default";
}

export function getMedallionEnvMapIntensity(meshName: string): number {
  return STUDIO_LIGHTING.materialEnvIntensity[getMedallionMaterialRole(meshName)];
}

// 2026-07-19 (Andrew): the environment-lit site over-reveals the core's baked
// normal/roughness detail relative to the approved Cycles preview (three soft
// area lights, ~50% smooth / 50% striated) — on the live site every
// micro-wrinkle caught an env highlight and the disc read as ~90% "copper
// wool". Softening the core's surface response, not its basecolor, closes the
// renderer gap. Tune NORMAL first (relief depth), then ROUGHNESS (sparkle).
const CORE_NORMAL_SCALE = 0.45; // 1 = full baked relief, 0 = flat
const CORE_ROUGHNESS_BOOST = 1.25; // multiplies the baked roughness map

// 2026-07-19 (Andrew, twice): the center `@` shows a "dark glint" that made it
// read dark instead of brilliant white at rest. Two key-light moves changed
// nothing, and the reason is mechanical, not a bad constant: `medallion_at` is
// a near-mirror metal, so what it shows is the ENVIRONMENT, not the
// directional key. That environment is four bright Lightformer cards floating
// in black (lightingConfig.environment.cards), so a mirror-smooth emblem
// samples large pure-black regions between the cards — the glint IS the void.
//
// The lever that works on that mechanism is the reflection LOBE: raising
// roughness selects blurrier env mip levels, so each shading point averages
// the bright cards together with the gaps instead of mirroring one or the
// other. The emblem keeps its own role so this never touches the bezels, and
// the floor form (max, not assignment) can only soften a sharper baked value,
// never sharpen a softer one.
//
// Both knobs are overridable at runtime for a single-session A/B:
//   ?emblem=<roughnessFloor>[,<envIntensity>]   e.g. ?emblem=0.42,2.2
//   ?emblem=baked                               (no tuning at all)
export const EMBLEM_ROUGHNESS_FLOOR = STUDIO_LIGHTING.emblemRoughnessFloor;

export function applyMedallionSurfaceTuning(
  meshName: string,
  material: THREE.Material,
  options: { emblemRoughnessFloor?: number | null } = {},
): void {
  const std = material as THREE.MeshStandardMaterial;

  if (meshName === "medallion_core") {
    if ("normalScale" in std && std.normalScale) {
      std.normalScale.set(CORE_NORMAL_SCALE, CORE_NORMAL_SCALE);
    }
    if ("roughness" in std) {
      std.roughness = CORE_ROUGHNESS_BOOST;
    }
    return;
  }

  if (meshName === "medallion_at") {
    const floor =
      options.emblemRoughnessFloor === undefined
        ? EMBLEM_ROUGHNESS_FLOOR
        : options.emblemRoughnessFloor;
    if (floor !== null && "roughness" in std) {
      std.roughness = Math.max(std.roughness, floor);
    }
  }
}
