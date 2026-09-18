import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  DRACO_DECODER_PATH,
  SCENE_LABEL_FONT_URL,
} from "../client/src/lib/assetUrls.ts";

const publicDir = fileURLToPath(new URL("../client/public", import.meta.url));

test("the Draco decoder is versioned and served from this site", () => {
  assert.match(DRACO_DECODER_PATH, /^\/draco-v\d+\/$/);

  for (const filename of [
    "draco_wasm_wrapper.js",
    "draco_decoder.wasm",
    "draco_decoder.js",
  ]) {
    assert.doesNotThrow(
      () => statSync(`${publicDir}${DRACO_DECODER_PATH}${filename}`),
      `missing self-hosted Draco file: ${filename}`,
    );
  }
});

test("the scene label font is served locally", () => {
  assert.match(SCENE_LABEL_FONT_URL, /^\/fonts\//);
  assert.doesNotThrow(
    () => statSync(`${publicDir}${SCENE_LABEL_FONT_URL}`),
    `missing local scene label font: ${SCENE_LABEL_FONT_URL}`,
  );
});
