import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function runProbe(factorySource: string, hintsSource = "undefined") {
  const script = `
    import { getDeviceCapability } from "./client/src/lib/deviceCapability.ts";
    const result = getDeviceCapability(${factorySource}, ${hintsSource});
    process.stdout.write(JSON.stringify(result));
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("a working WebGL2 context selects the adaptive 3D experience", () => {
  const capability = runProbe(`() => ({ renderer: "webgl2" })`);

  assert.equal(capability.isWeak, false);
  assert.equal(capability.strength, "capable");
  assert.equal(capability.type, "WEBGL2");
});

test("missing WebGL2 support selects the static fallback", () => {
  const capability = runProbe("() => null");

  assert.equal(capability.isWeak, true);
  assert.equal(capability.strength, "weak");
  assert.equal(capability.type, "WEBGL_UNSUPPORTED");
});

test("a browser that throws while probing support fails closed", () => {
  const capability = runProbe(`() => { throw new Error("context creation denied"); }`);

  assert.equal(capability.isWeak, true);
  assert.equal(capability.type, "WEBGL_UNSUPPORTED");
});

test("known severely limited hardware selects the static fallback without a network probe", () => {
  const lowMemory = runProbe("() => ({})", "{ cores: 8, memoryGb: 2 }");
  const lowCore = runProbe("() => ({})", "{ cores: 2, memoryGb: 8 }");

  assert.equal(lowMemory.isWeak, true);
  assert.equal(lowMemory.type, "LIMITED_HARDWARE");
  assert.equal(lowCore.isWeak, true);
  assert.equal(lowCore.type, "LIMITED_HARDWARE");
});
