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
  assert.equal(getMedallionMaterialRole("medallion_at"), "chrome");
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
});
