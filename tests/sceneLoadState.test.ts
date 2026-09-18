import assert from "node:assert/strict";
import test from "node:test";
import {
  isSceneLoadComplete,
  shouldShowSceneLoader,
  type SceneLoadState,
} from "../client/src/lib/sceneLoadState.ts";

const BASE: SceneLoadState = {
  reported: false,
  active: false,
  progress: 0,
  item: "",
  loaded: 0,
  total: 0,
};

test("the loader stays visible before the scene reports its first asset", () => {
  assert.equal(isSceneLoadComplete(BASE), false);
  assert.equal(shouldShowSceneLoader(BASE), true);
  assert.equal(
    shouldShowSceneLoader({ ...BASE, reported: true }),
    true,
    "a zero-asset report is not proof that the lazy Canvas is ready",
  );
});

test("the loader stays visible while an asset is active", () => {
  const state = { ...BASE, reported: true, active: true, total: 1 };
  assert.equal(isSceneLoadComplete(state), false);
  assert.equal(shouldShowSceneLoader(state), true);
});

test("the loader can fade only after at least one asset finishes", () => {
  const state = { ...BASE, reported: true, progress: 100, loaded: 1, total: 1 };
  assert.equal(isSceneLoadComplete(state), true);
  assert.equal(shouldShowSceneLoader(state), false);
});
