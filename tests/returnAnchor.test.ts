import assert from "node:assert/strict";
import test from "node:test";
import { ALONG_CLAMP, computeReturnAnchor } from "../client/src/hud/returnAnchor.ts";
import { MENU_HUB_CAMERA, PAGES } from "../client/src/data/sceneConfig.ts";

test("hub direction picks the expected edge for every configured page", () => {
  const expectations: Record<string, string> = {
    "heaven-and-nature": "right", // page sits at -X, hub is to screen right
    "see-canto": "left",
    music: "right", // hub is up-right of [-10, -8]
    contact: "left", // hub is up-left of [12, -6]
    "reading-list": "bottom", // hub is below [3, 15]
    inspirations: "top", // hub is above [-5, -15]
  };

  for (const page of PAGES) {
    const anchor = computeReturnAnchor(page.cameraLookAt, MENU_HUB_CAMERA.lookAt);
    assert.equal(
      anchor.edge,
      expectations[page.id],
      `${page.id}: expected edge ${expectations[page.id]}, got ${anchor.edge}`,
    );
  }
});

test("the caret angle points back toward the hub in screen space", () => {
  // Heaven & Nature: hub is dead right → caret due right (90°).
  const right = computeReturnAnchor([-15, 0, 0]);
  assert.equal(Math.round(right.angleDeg), 90);

  // See Canto: hub is dead left → -90°.
  const left = computeReturnAnchor([15, 0, 0]);
  assert.equal(Math.round(left.angleDeg), -90);

  // Inspirations [-5, -15]: hub is up and slightly right → small positive angle.
  const top = computeReturnAnchor([-5, -15, 0]);
  assert.ok(top.angleDeg > 0 && top.angleDeg < 45, `got ${top.angleDeg}`);

  // Reading list [3, 15]: hub is down and slightly left → near ±180°.
  const bottom = computeReturnAnchor([3, 15, 0]);
  assert.ok(Math.abs(bottom.angleDeg) > 135, `got ${bottom.angleDeg}`);
});

test("alongPercent stays inside the corner-safe clamp for every page", () => {
  for (const page of PAGES) {
    const anchor = computeReturnAnchor(page.cameraLookAt, MENU_HUB_CAMERA.lookAt);
    assert.ok(
      anchor.alongPercent >= ALONG_CLAMP[0] && anchor.alongPercent <= ALONG_CLAMP[1],
      `${page.id}: alongPercent ${anchor.alongPercent} escaped the clamp`,
    );
  }
});

test("sitting exactly at the hub degrades to a bottom-center anchor", () => {
  const anchor = computeReturnAnchor([0, 0, 0]);
  assert.equal(anchor.edge, "bottom");
  assert.equal(anchor.alongPercent, 50);
});
