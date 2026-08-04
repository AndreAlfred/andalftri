import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  PROJECTS,
  SHOWCASE_DEFAULT_ASPECT,
  screenshotAspectOf,
} from "../client/src/data/projects.ts";

// The showcase stage sizes itself from a DECLARED aspect ratio, in two places
// (the frame in ProjectPanel, the width cap in ContentPanel). A declaration
// that drifts from the file it describes is invisible to tsc and to every
// other test here: the panel renders, the image loads, and it is simply the
// wrong shape — cropped or letterboxed depending on which way it drifted.
// So read the real pixel dimensions out of the file headers and check.

const publicDir = fileURLToPath(new URL("../client/public", import.meta.url));

/** Minimal PNG IHDR / JPEG SOFn dimension reader — no image dependency. */
function readImageSize(bytes: Buffer): { width: number; height: number } {
  const isPng =
    bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47;
  if (isPng) {
    // IHDR is always the first chunk: 8-byte signature + 8-byte chunk header.
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }

  assert.equal(bytes.readUInt16BE(0), 0xffd8, "not a PNG or JPEG");
  let offset = 2;
  while (offset < bytes.length) {
    assert.equal(bytes[offset], 0xff, `bad JPEG marker at ${offset}`);
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    // SOF0-SOF15, excluding the non-frame markers DHT (c4), JPG (c8), DAC (cc).
    const isFrame =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isFrame) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  throw new Error("no JPEG frame header found");
}

test("every declared screenshot aspect matches the file on disk", () => {
  const withShots = PROJECTS.filter((p) => p.media.screenshots?.length);
  assert.ok(withShots.length > 0, "no screenshot-backed projects to check");

  for (const project of withShots) {
    const relative = project.media.screenshots![0];
    const bytes = readFileSync(`${publicDir}${relative}`);
    const { width, height } = readImageSize(bytes);
    const actual = width / height;
    const declared = screenshotAspectOf(project);

    // 2% covers a browser-chrome crop or an odd pixel; it does not cover a
    // landscape default silently applied to a portrait capture (0.52 vs 1.6).
    assert.ok(
      Math.abs(actual - declared) / actual < 0.02,
      `${project.id}: ${relative} is ${width}x${height} (${actual.toFixed(3)}) ` +
        `but the panel will size it at ${declared}`,
    );
  }
});

test("a project that declares nothing gets the landscape default", () => {
  assert.equal(screenshotAspectOf(null), SHOWCASE_DEFAULT_ASPECT);
  assert.equal(
    screenshotAspectOf({
      id: "x",
      title: "x",
      description: "",
      media: { screenshots: ["/images/x.png"] },
      techStack: [],
      status: "concept",
    }),
    SHOWCASE_DEFAULT_ASPECT,
  );
});
