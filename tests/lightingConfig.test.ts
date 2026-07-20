import assert from "node:assert/strict";
import test from "node:test";
import {
  getLightingPreviewSettings,
  LEGACY_KEY_LIGHT_POSITION,
  STUDIO_LIGHTING,
} from "../client/src/scene/lightingConfig.ts";

test("Studio ACES is the default after visual approval", () => {
  assert.deepEqual(getLightingPreviewSettings(""), {
    mode: "studio",
    toneMapping: "aces",
    screensDormant: false,
    keyLightPosition: STUDIO_LIGHTING.direct.key.position,
    emblem: {
      roughnessFloor: STUDIO_LIGHTING.emblemRoughnessFloor,
      envIntensity: STUDIO_LIGHTING.materialEnvIntensity.emblem,
    },
  });
  assert.equal(getLightingPreviewSettings("?lighting=legacy").mode, "legacy");
  assert.equal(getLightingPreviewSettings("?lighting=studio").mode, "studio");
  assert.equal(getLightingPreviewSettings("?lighting=unknown").mode, "studio");
  assert.equal(
    getLightingPreviewSettings("?lighting=studio&screens=dormant").screensDormant,
    true,
  );
});

test("the keylight param supports legacy A/B and free x,y,z tuning", () => {
  // 2026-07-19: back on the approved baseline. Two attempts at fixing the
  // emblem glint by moving this light produced no visible change, because the
  // emblem is reflection-driven, not key-driven (medallionMaterialRole.ts).
  assert.deepEqual(STUDIO_LIGHTING.direct.key.position, LEGACY_KEY_LIGHT_POSITION);
  assert.deepEqual(
    getLightingPreviewSettings("?keylight=legacy").keyLightPosition,
    LEGACY_KEY_LIGHT_POSITION,
  );
  assert.deepEqual(
    getLightingPreviewSettings("?keylight=1.5,-2,7.25").keyLightPosition,
    [1.5, -2, 7.25],
  );
  // Malformed values fall back to the shipped default.
  assert.deepEqual(
    getLightingPreviewSettings("?keylight=oops").keyLightPosition,
    STUDIO_LIGHTING.direct.key.position,
  );
  assert.deepEqual(
    getLightingPreviewSettings("?keylight=1,2").keyLightPosition,
    STUDIO_LIGHTING.direct.key.position,
  );
});

test("the emblem param gives a one-reload before/after", () => {
  // `baked` must reproduce the pre-2026-07-19 emblem exactly: untouched
  // roughness (the mirror) at the bezels' reflection strength.
  assert.deepEqual(getLightingPreviewSettings("?emblem=baked").emblem, {
    roughnessFloor: null,
    envIntensity: STUDIO_LIGHTING.materialEnvIntensity.chrome,
  });
  assert.deepEqual(getLightingPreviewSettings("?emblem=0.42").emblem, {
    roughnessFloor: 0.42,
    envIntensity: STUDIO_LIGHTING.materialEnvIntensity.emblem,
  });
  assert.deepEqual(getLightingPreviewSettings("?emblem=0.42,2.2").emblem, {
    roughnessFloor: 0.42,
    envIntensity: 2.2,
  });
  // Roughness is a 0..1 property; a fat-fingered value clamps rather than
  // producing an invisible emblem.
  assert.equal(getLightingPreviewSettings("?emblem=5").emblem.roughnessFloor, 1);
  assert.equal(getLightingPreviewSettings("?emblem=-5").emblem.roughnessFloor, 0);
  assert.deepEqual(
    getLightingPreviewSettings("?emblem=nonsense").emblem.roughnessFloor,
    STUDIO_LIGHTING.emblemRoughnessFloor,
  );
});

test("AgX remains available as a matched-exposure comparison", () => {
  assert.equal(getLightingPreviewSettings("?tone=agx").toneMapping, "agx");
  assert.equal(getLightingPreviewSettings("?tone=aces").toneMapping, "aces");
  assert.equal(getLightingPreviewSettings("?tone=unknown").toneMapping, "aces");
  assert.equal(STUDIO_LIGHTING.renderer.exposure, 0.92);
});

test("the studio rig is static, neutral-keyed, and reflection-led", () => {
  assert.equal(STUDIO_LIGHTING.environment.resolution, 256);
  assert.equal(STUDIO_LIGHTING.environment.frames, 1);
  assert.deepEqual(Object.keys(STUDIO_LIGHTING.direct).sort(), ["fill", "key"]);
  assert.equal(STUDIO_LIGHTING.direct.key.color, "#ffffff");
  assert.equal(STUDIO_LIGHTING.direct.fill.color, "#eef2f6");

  const coolCards = STUDIO_LIGHTING.environment.cards.filter(
    (card) => card.role === "cool-edge",
  );
  const mainCard = STUDIO_LIGHTING.environment.cards.find(
    (card) => card.id === "front-softbox",
  );

  assert.equal(coolCards.length, 1);
  assert.ok(mainCard);
  assert.equal(coolCards[0].color, "#94d9ee");
  assert.ok(coolCards[0].intensity <= mainCard.intensity * 0.2);
  assert.ok(coolCards[0].intensity < mainCard.intensity);
});

test("chrome reflects most and the mineral body reflects least", () => {
  const { body, chrome, screen } = STUDIO_LIGHTING.materialEnvIntensity;
  assert.ok(chrome > screen);
  assert.ok(screen > body);
});
