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
