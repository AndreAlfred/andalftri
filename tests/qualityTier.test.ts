import assert from "node:assert/strict";
import test from "node:test";
import {
  DPR_LADDER,
  type DeviceHints,
  dprForFactor,
  factorForTier,
  getPreviewFlags,
  profileFor,
  QUALITY_TIERS,
  startingTierFor,
  textureEdgeCapFor,
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

// --- Conservative start (2026-07-30) -----------------------------------------
// The scene used to mount at dpr=1.5 on every device and let the monitor argue
// it down. These cover the opening bid instead: what tier a device is handed
// before a single frame has been measured.

const DESKTOP: DeviceHints = {
  coarsePointer: false,
  maxTouchPoints: 0,
  minScreenEdge: 1440,
  cores: 12,
  memoryGb: 16,
};

test("a phone-sized touch device starts at low, never at the top rung", () => {
  const phone: DeviceHints = {
    coarsePointer: true,
    maxTouchPoints: 5,
    minScreenEdge: 390,
    cores: 6,
    memoryGb: 0, // Safari never reports deviceMemory
  };

  assert.equal(startingTierFor(phone), "low");
});

test("a tablet starts at medium — touch, but not phone-sized", () => {
  const tablet: DeviceHints = {
    coarsePointer: true,
    maxTouchPoints: 5,
    minScreenEdge: 1024,
    cores: 8,
    memoryGb: 0,
  };

  assert.equal(startingTierFor(tablet), "medium");
});

test("a capable desktop still starts at high — the change must not tax the good case", () => {
  assert.equal(startingTierFor(DESKTOP), "high");
});

test("unknown hardware is not treated as weak", () => {
  // Safari reports neither hardwareConcurrency nor deviceMemory in some
  // configurations. Absent signals must not infer weakness — the same rule
  // deviceCapability.ts applies to detect-gpu's FALLBACK type (lessons.md D).
  assert.equal(
    startingTierFor({ ...DESKTOP, cores: 0, memoryGb: 0 }),
    "high",
  );
});

test("a modest desktop steps down one rung, not to the floor", () => {
  assert.equal(startingTierFor({ ...DESKTOP, cores: 2 }), "medium");
  assert.equal(startingTierFor({ ...DESKTOP, memoryGb: 4 }), "medium");
});

test("maxTouchPoints alone is enough — a coarse-pointer media query can be absent", () => {
  const phoneWithoutMediaQuery: DeviceHints = {
    coarsePointer: false,
    maxTouchPoints: 5,
    minScreenEdge: 375,
    cores: 0,
    memoryGb: 0,
  };

  assert.equal(startingTierFor(phoneWithoutMediaQuery), "low");
});

test("a zero screen edge does not collapse a touch device to the floor", () => {
  // SSR / headless can report 0. Unknown size must fall through to the touch
  // branch rather than matching `<= 820` and pinning the floor by accident.
  assert.equal(
    startingTierFor({ coarsePointer: true, maxTouchPoints: 5, minScreenEdge: 0, cores: 0, memoryGb: 0 }),
    "medium",
  );
});

test("factorForTier round-trips through dprForFactor for every tier", () => {
  // If this broke, seeding the monitor would immediately re-derive a different
  // DPR than the one we mounted at, and the scene would visibly step on load.
  for (const tier of QUALITY_TIERS) {
    assert.equal(
      dprForFactor(factorForTier(tier), profileFor("high").dpr),
      profileFor(tier).dpr,
      `factor round-trip failed for ${tier}`,
    );
  }
});

test("the seeded factor leaves headroom to climb back up", () => {
  // A conservative start is only safe if recovery is reachable. Seeding at 1
  // (the old default) while mounting low would make the monitor believe it was
  // already at the top rung and it could only ever step down.
  assert.ok(factorForTier("low") < factorForTier("high"));
  assert.equal(factorForTier("high"), 1);
});

// --- Texture residency cap (2026-07-30) --------------------------------------
// A MEMORY decision, deliberately independent of the adaptive tier: textures
// upload once at load, so a tier change at second 15 cannot un-upload them.

test("a phone caps texture residency; desktop ships what the artist authored", () => {
  const phone: DeviceHints = {
    coarsePointer: true,
    maxTouchPoints: 5,
    minScreenEdge: 390,
    cores: 6,
    memoryGb: 0,
  };

  assert.equal(textureEdgeCapFor(phone), 1024);
  assert.equal(textureEdgeCapFor(DESKTOP), Infinity);
});

test("a tablet is not capped — it starts at medium but keeps full texture detail", () => {
  // The two decisions are allowed to disagree, and here they do. Framerate and
  // memory are different budgets: a tablet has the RAM but not the fill rate.
  const tablet: DeviceHints = {
    coarsePointer: true,
    maxTouchPoints: 5,
    minScreenEdge: 1024,
    cores: 8,
    memoryGb: 0,
  };

  assert.equal(startingTierFor(tablet), "medium");
  assert.equal(textureEdgeCapFor(tablet), Infinity);
});

test("the cap is a real reduction on the authored maps, not a no-op", () => {
  // The medallion ships 3x 2048 and 3x 1024. The cap must bite on the former
  // and leave the latter alone — a ceiling, not a target.
  const cap = textureEdgeCapFor({
    coarsePointer: true,
    maxTouchPoints: 5,
    minScreenEdge: 390,
    cores: 0,
    memoryGb: 0,
  });

  assert.ok(cap < 2048, "must downscale the 2048 shield_body set");
  assert.ok(cap >= 1024, "must not touch the 1024 medallion_core set");
});

test("a desktop cap is non-finite so the resampler can early-out entirely", () => {
  // capSceneTextures returns immediately on a non-finite cap. If this ever
  // became a large finite number instead, desktop would walk every material and
  // rasterize every texture to a canvas for no reason.
  assert.equal(Number.isFinite(textureEdgeCapFor(DESKTOP)), false);
});

test("?texcap= accepts powers of two and rejects everything else", () => {
  assert.equal(getPreviewFlags("?texcap=1024").pinnedTextureCap, 1024);
  assert.equal(getPreviewFlags("?texcap=512").pinnedTextureCap, 512);
  assert.equal(getPreviewFlags("").pinnedTextureCap, null);

  // A non-power-of-two cap would resample to a size three cannot mip cleanly,
  // which is the class of sampling bug that made the screen text unreadable in
  // July (lessons.md entry J). Reject rather than silently round.
  assert.equal(getPreviewFlags("?texcap=1000").pinnedTextureCap, null);
  assert.equal(getPreviewFlags("?texcap=potato").pinnedTextureCap, null);
  assert.equal(getPreviewFlags("?texcap=0").pinnedTextureCap, null);
  assert.equal(getPreviewFlags("?texcap=-1024").pinnedTextureCap, null);
  assert.equal(getPreviewFlags("?texcap=99999").pinnedTextureCap, null);
});

test("the preview flags stay independent of one another", () => {
  const flags = getPreviewFlags("?texcap=512&quality=low&perf=1");

  assert.equal(flags.pinnedTextureCap, 512);
  assert.equal(flags.pinnedTier, "low");
  assert.equal(flags.showPerfReadout, true);
  assert.equal(flags.forceLite, false);
});
