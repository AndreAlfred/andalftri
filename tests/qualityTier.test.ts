import assert from "node:assert/strict";
import test from "node:test";
import {
  DPR_LADDER,
  dprForFactor,
  getPreviewFlags,
  profileFor,
  QUALITY_TIERS,
  tierForDpr,
} from "../client/src/lib/qualityTier.ts";

test("?lite=1 and ?view=lite both force the static fallback", () => {
  assert.equal(getPreviewFlags("?lite=1").forceLite, true);
  assert.equal(getPreviewFlags("?view=lite").forceLite, true);
  assert.equal(getPreviewFlags("").forceLite, false);
  assert.equal(getPreviewFlags("?lite=0").forceLite, false);
});

test("the pre-existing ?force-3d=1 flag still parses alongside the new ones", () => {
  const flags = getPreviewFlags("?force-3d=1&perf=1");

  assert.equal(flags.forceFullScene, true);
  assert.equal(flags.showPerfReadout, true);
  assert.equal(flags.forceLite, false);
});

test("?quality= pins a tier, and unknown values fall back to the monitor", () => {
  assert.equal(getPreviewFlags("?quality=low").pinnedTier, "low");
  assert.equal(getPreviewFlags("?quality=HIGH").pinnedTier, "high");
  // "med" is the spelling people reach for; it must not silently no-op.
  assert.equal(getPreviewFlags("?quality=med").pinnedTier, "medium");
  assert.equal(getPreviewFlags("?quality=potato").pinnedTier, null);
  assert.equal(getPreviewFlags("").pinnedTier, null);
});

test("dprForFactor only ever returns a rung of the ladder", () => {
  // Reallocating the drawing buffer is the cost being avoided, so an
  // interpolated DPR would defeat the whole point of adapting.
  for (let i = 0; i <= 20; i += 1) {
    assert.ok(
      (DPR_LADDER as readonly number[]).includes(dprForFactor(i / 20)),
      `factor ${i / 20} produced an off-ladder dpr`,
    );
  }
});

test("dprForFactor is monotonic and spans the ladder", () => {
  assert.equal(dprForFactor(0), DPR_LADDER[0]);
  assert.equal(dprForFactor(1), DPR_LADDER[DPR_LADDER.length - 1]);

  let previous = -Infinity;
  for (let i = 0; i <= 20; i += 1) {
    const dpr = dprForFactor(i / 20);
    assert.ok(dpr >= previous, "dpr must not decrease as the health factor rises");
    previous = dpr;
  }
});

test("dprForFactor clamps out-of-range factors instead of indexing off the ladder", () => {
  assert.equal(dprForFactor(-3), DPR_LADDER[0]);
  assert.equal(dprForFactor(42), DPR_LADDER[DPR_LADDER.length - 1]);
});

test("a lower ceiling caps the ladder rather than emptying it", () => {
  assert.equal(dprForFactor(1, 1), 1);
  assert.equal(dprForFactor(1, 1.3), 1.3);
  // A ceiling below every rung still has to yield a usable dpr rather than
  // indexing into an empty array.
  assert.equal(dprForFactor(1, 0.1), DPR_LADDER[0]);
});

test("every dpr rung maps back to a real tier", () => {
  for (const dpr of DPR_LADDER) {
    assert.ok(QUALITY_TIERS.includes(tierForDpr(dpr)));
  }
  // 2026-07-22: the ladder floor moved 0.75 -> 1.0. Sub-1.0 DPR was a
  // legibility cliff for the medallion's screen text.
  assert.equal(tierForDpr(1), "low");
  assert.equal(tierForDpr(1.15), "medium");
  assert.equal(tierForDpr(1.5), "high");
});

test("the degradation order thins the atmosphere before anything else", () => {
  const low = profileFor("low");
  const medium = profileFor("medium");
  const high = profileFor("high");

  // Andrew's approved order: streaks -> sparks -> dpr -> stars, artifact never.
  for (const key of ["dpr", "starCount", "sparkCount", "streakCount", "grainHz"] as const) {
    assert.ok(low[key] <= medium[key], `${key} must not rise as quality drops`);
    assert.ok(medium[key] <= high[key], `${key} must not rise as quality drops`);
  }

  // Streaks and sparks must thin FASTER than the field, which is composition
  // rather than decoration and survives intact at every tier.
  assert.ok(low.streakCount / high.streakCount <= low.starCount / high.starCount);
  assert.ok(low.sparkCount / high.sparkCount <= low.starCount / high.starCount);
});

test("no tier switches a layer off entirely", () => {
  // Regression guard, 2026-07-21: `low` originally zeroed sparks and streaks,
  // so a machine that dipped once lost the magic permanently and silently.
  // Andrew reported exactly that symptom ("haven't seen any magic since").
  for (const tier of QUALITY_TIERS) {
    const profile = profileFor(tier);
    for (const key of ["starCount", "sparkCount", "streakCount", "grainHz", "dpr"] as const) {
      assert.ok(profile[key] > 0, `${tier}.${key} must stay above zero`);
    }
  }
});

test("tierForDpr agrees with each profile's own dpr", () => {
  // Guards the round trip the quality store relies on: a profile's dpr must
  // classify back to the tier it came from, or a tier change would immediately
  // re-derive a different tier and oscillate.
  for (const tier of QUALITY_TIERS) {
    assert.equal(tierForDpr(profileFor(tier).dpr), tier);
  }
});
