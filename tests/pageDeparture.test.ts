import assert from "node:assert/strict";
import test from "node:test";
import { pageDepartureReducer } from "../client/src/lib/pageDeparture.ts";

test("a selected page cannot fly until the hub exits and preparation finishes", () => {
  const selected = pageDepartureReducer(null, {
    type: "select",
    pageId: "pgh",
  });
  assert.deepEqual(selected, { pageId: "pgh", stage: "exiting" });
  assert.deepEqual(
    pageDepartureReducer(selected, { type: "page-prepared", pageId: "pgh" }),
    selected,
    "media readiness cannot skip the hub exit",
  );

  const exited = pageDepartureReducer(selected, {
    type: "hub-exited",
    pageId: "pgh",
  });
  assert.deepEqual(exited, { pageId: "pgh", stage: "preparing" });

  const staged = pageDepartureReducer(exited, {
    type: "page-prepared",
    pageId: "pgh",
  });
  assert.deepEqual(staged, { pageId: "pgh", stage: "staging" });

  const ready = pageDepartureReducer(staged, {
    type: "panel-staged",
    pageId: "pgh",
  });
  assert.deepEqual(ready, { pageId: "pgh", stage: "ready" });
});

test("stale preparation cannot launch a newer selection", () => {
  const next = pageDepartureReducer(
    { pageId: "pgh", stage: "preparing" },
    { type: "select", pageId: "see-canto" },
  );
  assert.deepEqual(
    pageDepartureReducer(next, { type: "page-prepared", pageId: "pgh" }),
    { pageId: "see-canto", stage: "exiting" },
  );
  assert.equal(pageDepartureReducer(next, { type: "cancel" }), null);
});
