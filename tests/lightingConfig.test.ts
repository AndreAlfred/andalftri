import assert from "node:assert/strict";
import test from "node:test";
import {
  getLightingPreviewSettings,
  STUDIO_LIGHTING,
} from "../client/src/scene/lightingConfig.ts";

test("legacy lighting remains the default during preview review", () => {
  assert.deepEqual(getLightingPreviewSettings(""), {
    mode: "legacy",
    toneMapping: "agx",
    screensDormant: false,
  });
  assert.equal(getLightingPreviewSettings("?lighting=studio").mode, "studio");
  assert.equal(getLightingPreviewSettings("?lighting=unknown").mode, "legacy");
  assert.equal(
    getLightingPreviewSettings("?lighting=studio&screens=dormant").screensDormant,
    true,
  );
});

test("ACES can be compared without changing studio exposure", () => {
  assert.equal(
    getLightingPreviewSettings("?lighting=studio&tone=aces").toneMapping,
    "aces",
  );
  assert.equal(getLightingPreviewSettings("?tone=unknown").toneMapping, "agx");
});

test("the studio rig is static, neutral-keyed, and reflection-led", () => {
  assert.equal(STUDIO_LIGHTING.environment.resolution, 256);
  assert.equal(STUDIO_LIGHTING.environment.frames, 1);
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
  assert.ok(coolCards[0].intensity < mainCard.intensity);
});

test("chrome reflects most and the mineral body reflects least", () => {
  const { body, chrome, screen } = STUDIO_LIGHTING.materialEnvIntensity;
  assert.ok(chrome > screen);
  assert.ok(screen > body);
});
