import assert from "node:assert/strict";
import test from "node:test";
import {
  getMedallionEnvMapIntensity,
  getMedallionMaterialRole,
} from "../client/src/scene/medallionMaterialRole.ts";
import { STUDIO_LIGHTING } from "../client/src/scene/lightingConfig.ts";

test("stable GLB names map to the intended material roles", () => {
  assert.equal(getMedallionMaterialRole("shield_body"), "body");
  assert.equal(getMedallionMaterialRole("medallion_core"), "body");
  // 2026-07-19: the emblem has its own role so it can be tuned without
  // dragging the seven bezels along with it.
  assert.equal(getMedallionMaterialRole("medallion_at"), "emblem");
  assert.equal(getMedallionMaterialRole("section_01_bezel"), "chrome");
  assert.equal(getMedallionMaterialRole("section_07_screen"), "screen");
  assert.equal(getMedallionMaterialRole("unexpected_mesh"), "default");
});

test("mesh names receive the configured reflection strengths", () => {
  assert.equal(
    getMedallionEnvMapIntensity("shield_body"),
    STUDIO_LIGHTING.materialEnvIntensity.body,
  );
  assert.equal(
    getMedallionEnvMapIntensity("section_03_bezel"),
    STUDIO_LIGHTING.materialEnvIntensity.chrome,
  );
  assert.equal(
    getMedallionEnvMapIntensity("section_03_screen"),
    STUDIO_LIGHTING.materialEnvIntensity.screen,
  );
  assert.equal(
    getMedallionEnvMapIntensity("medallion_at"),
    STUDIO_LIGHTING.materialEnvIntensity.emblem,
  );
});

test("the emblem reflects harder than the bezels to survive its softer lobe", () => {
  const { chrome, emblem } = STUDIO_LIGHTING.materialEnvIntensity;
  assert.ok(emblem > chrome);
  // Roughness floor must stay a plausible metal: 0 would restore the mirror
  // that was sampling the void, 1 would flatten the emblem to matte.
  assert.ok(STUDIO_LIGHTING.emblemRoughnessFloor > 0);
  assert.ok(STUDIO_LIGHTING.emblemRoughnessFloor < 1);
});
