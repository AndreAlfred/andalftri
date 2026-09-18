import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { INFLUENCES } from "../client/src/data/influences.ts";
import { ALBUMS } from "../client/src/data/music.ts";
import { PROJECTS } from "../client/src/data/projects.ts";

const publicDir = fileURLToPath(new URL("../client/public", import.meta.url));

interface ImagePair {
  label: string;
  original: string;
  optimized?: string;
}

function assetPath(url: string) {
  return `${publicDir}${new URL(url, "https://portfolio.invalid").pathname}`;
}

function collectRenderedImages(): ImagePair[] {
  const images: ImagePair[] = [];

  for (const project of PROJECTS) {
    project.media.screenshots?.forEach((original, index) => {
      images.push({
        label: `${project.id} screenshot ${index + 1}`,
        original,
        optimized: project.media.optimizedScreenshots?.[index],
      });
    });
  }

  for (const influence of INFLUENCES) {
    for (const item of influence.items) {
      if (item.artworkSrc) {
        images.push({
          label: `${item.name} artwork`,
          original: item.artworkSrc,
          optimized: item.artworkOptimizedSrc,
        });
      }
      item.images?.forEach((image) => {
        images.push({
          label: `${item.name}: ${image.caption}`,
          original: image.src,
          optimized: image.optimizedSrc,
        });
      });
    }
  }

  for (const album of ALBUMS) {
    images.push({
      label: `${album.title} album art`,
      original: album.artworkSrc,
      optimized: album.optimizedArtworkSrc,
    });
  }

  return images;
}

test("every rendered local raster has a versioned AVIF alternative", () => {
  const images = collectRenderedImages();
  assert.equal(images.length, 18, "unexpected rendered image inventory");

  for (const image of images) {
    assert.match(image.optimized ?? "", /-v1\.avif$/, `${image.label} has no versioned AVIF`);
    assert.doesNotThrow(
      () => statSync(assetPath(image.optimized!)),
      `${image.label} optimized file is missing`,
    );
  }
});

test("optimized images enforce a useful transfer budget", () => {
  const images = collectRenderedImages();
  let originalBytes = 0;
  let optimizedBytes = 0;

  for (const image of images) {
    assert.ok(image.optimized, `${image.label} has no optimized source`);
    const originalSize = statSync(assetPath(image.original)).size;
    const optimizedSize = statSync(assetPath(image.optimized)).size;
    originalBytes += originalSize;
    optimizedBytes += optimizedSize;

    assert.ok(optimizedSize < originalSize, `${image.label} AVIF is not smaller`);
    assert.ok(optimizedSize <= 300_000, `${image.label} AVIF exceeds 300 KB`);
  }

  assert.ok(
    optimizedBytes <= originalBytes * 0.4,
    `optimized media is ${optimizedBytes} bytes versus ${originalBytes} original bytes`,
  );
});
