import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import test, { before } from "node:test";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const distDir = fileURLToPath(new URL("../dist", import.meta.url));

before(() => {
  const result = spawnSync("pnpm", ["exec", "vite", "build"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.equal(
    result.status,
    0,
    `production build failed:\n${result.stdout}\n${result.stderr}`,
  );
});

test("the initial document does not preload the lazy 3D or GPU-probe runtimes", () => {
  const html = readFileSync(`${distDir}/index.html`, "utf8");
  const preloads = [...html.matchAll(/<link rel="modulepreload"[^>]+href="([^"]+)"/g)].map(
    ([, href]) => href,
  );

  for (const forbidden of ["vendor-three", "vendor-scene", "vendor-device"]) {
    assert.ok(
      preloads.every((href) => !href.includes(forbidden)),
      `${forbidden} leaked into the initial module preload graph: ${preloads.join(", ")}`,
    );
  }

  const entry = html.match(/<script type="module"[^>]+src="([^"]+)"/)?.[1];
  assert.ok(entry, "production HTML did not link an entry module");
  const initialModules = [entry, ...preloads];
  const initialGzipBytes = initialModules.reduce(
    (sum, href) => sum + gzipSync(readFileSync(`${distDir}${href}`)).byteLength,
    0,
  );
  assert.ok(
    initialGzipBytes < 100_000,
    `initial JS graph is ${initialGzipBytes} gzip bytes; the 3D runtime likely leaked back in`,
  );
});

test("the production stylesheet requests only fonts that ship with the site", () => {
  const html = readFileSync(`${distDir}/index.html`, "utf8");
  const stylesheetHref = html.match(/<link rel="stylesheet"[^>]+href="([^"]+)"/)?.[1];
  assert.ok(stylesheetHref, "production HTML did not link a stylesheet");

  const css = readFileSync(`${distDir}${stylesheetHref}`, "utf8");
  assert.ok(!/https?:\/\//.test(css), "production CSS still requests a third-party resource");

  const localFontUrls = [...css.matchAll(/url\((?:"|')?(\/fonts\/[^)"']+)/g)].map(
    ([, url]) => url,
  );
  assert.ok(localFontUrls.length > 0, "production CSS did not reference any local fonts");

  for (const fontUrl of localFontUrls) {
    assert.doesNotThrow(
      () => readFileSync(`${distDir}${fontUrl}`),
      `production CSS references a font that was not built: ${fontUrl}`,
    );
  }
});
