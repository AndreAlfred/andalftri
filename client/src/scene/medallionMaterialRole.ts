import type * as THREE from "three";
import { STUDIO_LIGHTING } from "./lightingConfig.ts";

export type MedallionMaterialRole = "body" | "chrome" | "screen" | "default";

export function getMedallionMaterialRole(meshName: string): MedallionMaterialRole {
  if (meshName === "shield_body" || meshName === "medallion_core") {
    return "body";
  }
  if (meshName === "medallion_at" || /^section_0\d_bezel$/.test(meshName)) {
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

export function applyMedallionSurfaceTuning(
  meshName: string,
  material: THREE.Material,
): void {
  if (meshName !== "medallion_core") return;
  const std = material as THREE.MeshStandardMaterial;
  if ("normalScale" in std && std.normalScale) {
    std.normalScale.set(CORE_NORMAL_SCALE, CORE_NORMAL_SCALE);
  }
  if ("roughness" in std) {
    std.roughness = CORE_ROUGHNESS_BOOST;
  }
}
