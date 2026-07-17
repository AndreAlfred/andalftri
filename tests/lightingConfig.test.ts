import assert from "node:assert/strict";
import test from "node:test";
import {
  getLightingPreviewSettings,
  STUDIO_LIGHTING,
} from "../client/src/scene/lightingConfig.ts";

test("Studio ACES is the default after visual approval", () => {
  assert.deepEqual(getLightingPreviewSettings(""), {
    mode: "studio",
    toneMapping: "aces",
    screensDormant: false,
  });
  assert.equal(getLightingPreviewSettings("?lighting=legacy").mode, "legacy");
  assert.equal(getLightingPreviewSettings("?lighting=studio").mode, "studio");
  assert.equal(getLightingPreviewSettings("?lighting=unknown").mode, "studio");
  assert.equal(
    getLightingPreviewSettings("?lighting=studio&screens=dormant").screensDormant,
    true,
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
