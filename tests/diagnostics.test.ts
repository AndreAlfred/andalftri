import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSchedule,
  CONDITIONS,
  MEASURE_MS,
  median,
  medianIsSaturated,
  percentile,
  ROUNDS,
  SETTLE_MS,
  SIGNIFICANT_RECOVERY_PCT,
  summarize,
  totalDurationMs,
  verdict,
  type ConditionId,
} from "../client/src/lib/diagnostics.ts";

test("every condition is measured the same number of times", () => {
  // An unbalanced schedule would let a condition with fewer samples look
  // artificially stable or artificially noisy.
  const schedule = buildSchedule();
  const counts = new Map<ConditionId, number>();
  for (const id of schedule) counts.set(id, (counts.get(id) ?? 0) + 1);

  assert.equal(counts.size, CONDITIONS.length);
  for (const [id, count] of counts) {
    assert.equal(count, ROUNDS, `${id} appeared ${count} times, expected ${ROUNDS}`);
  }
});

test("the schedule interleaves rather than running each condition to completion", () => {
  // This is the whole methodology: a phone at second 5 and second 40 are
  // different machines because of thermal throttling, so consecutive slots of
  // the same condition would confound the ablation with the drift.
  const schedule = buildSchedule();
  for (let i = 1; i < schedule.length; i += 1) {
    assert.notEqual(
      schedule[i],
      schedule[i - 1],
      `condition ${schedule[i]} ran back-to-back at slot ${i}`,
    );
  }
});

test("rotation changes each condition's neighbours between rounds", () => {
  // A heavy condition leaves the GPU hotter for whatever follows it. A fixed
  // order would bake that bias into the same victim every round.
  const schedule = buildSchedule();
  const n = CONDITIONS.length;
  const followersOfFirst = new Set<ConditionId>();
  for (let round = 0; round < ROUNDS; round += 1) {
    const index = schedule.indexOf(CONDITIONS[0].id, round * n);
    if (index >= 0 && index + 1 < schedule.length) {
      followersOfFirst.add(schedule[index + 1]);
    }
  }
  assert.ok(followersOfFirst.size > 1, "the same condition always followed the first one");
});

test("the sweep stays short enough that a phone will actually finish it", () => {
  const ms = totalDurationMs(buildSchedule());
  assert.equal(ms, CONDITIONS.length * ROUNDS * (SETTLE_MS + MEASURE_MS));
  assert.ok(ms < 60_000, `sweep takes ${ms}ms — too long to hold a phone still`);
});

test("median is robust to the spikes a mean would absorb", () => {
  assert.equal(median([16, 17, 16, 17]), 16.5);
  // One 400ms GC pause must not move the reported typical frame.
  assert.equal(median([16, 16, 16, 400, 16]), 16);
  assert.equal(median([]), 0);
});

test("percentile reports the tail, not the typical frame", () => {
  const values = Array.from({ length: 100 }, (_, i) => (i < 95 ? 16 : 120));
  assert.equal(percentile(values, 95), 16);
  assert.equal(percentile(values, 99), 120);
  assert.equal(percentile([], 95), 0);
  // Single sample: every percentile is that sample, not an index error.
  assert.equal(percentile([42], 95), 42);
});

test("summarize ranks by recovered frame time and identifies the dominant cost", () => {
  const samples = new Map<ConditionId, number[]>([
    ["baseline", [40, 40, 40]],
    ["screens-off", [38, 38, 38]], // 5% — noise
    ["aurora-off", [20, 20, 20]], // 50% — the culprit
    ["stars-off", [39, 39, 39]],
  ]);

  const results = summarize(samples, CONDITIONS);
  const ranked = results.filter((r) => r.samples > 0);

  // Unmeasured conditions must not outrank a real winner. They have medianMs 0,
  // which naively computes as a 100% saving.
  assert.equal(results[0].id, "aurora-off", "an unmeasured condition outranked the winner");
  assert.equal(ranked[0].id, "aurora-off");
  assert.equal(Math.round(ranked[0].recoveredPct), 50);
  assert.equal(Math.round(ranked[0].fps), 50);
  assert.ok(verdict(results).includes("Helmet aurora off"));
});

test("a sweep where nothing dominates says so instead of naming a winner", () => {
  // The failure mode to avoid: reporting the largest of several noise-level
  // differences as if it were a diagnosis.
  const flat = new Map<ConditionId, number[]>(
    CONDITIONS.map((c) => [c.id, [40, 40, 41]] as [ConditionId, number[]]),
  );

  const results = summarize(flat, CONDITIONS);
  assert.ok(verdict(results).startsWith("No single layer dominates"));
  for (const r of results) {
    assert.ok(Math.abs(r.recoveredPct) < SIGNIFICANT_RECOVERY_PCT);
  }
});

test("an ablation that makes things worse reports a negative recovery, not a win", () => {
  const samples = new Map<ConditionId, number[]>([
    ["baseline", [20, 20, 20]],
    ["dpr-down", [25, 25, 25]],
  ]);

  const results = summarize(samples, CONDITIONS);
  const dpr = results.find((r) => r.id === "dpr-down");
  assert.ok(dpr);
  assert.ok(dpr.recoveredPct < 0, "a slower ablation must not read as a saving");
});

test("missing samples do not produce NaN or a false winner", () => {
  // A sweep abandoned early (backgrounded tab, phone locked) must degrade to
  // zeros rather than poisoning the table with NaN.
  const results = summarize(new Map(), CONDITIONS);
  for (const r of results) {
    assert.ok(Number.isFinite(r.medianMs));
    assert.ok(Number.isFinite(r.recoveredPct));
    assert.ok(Number.isFinite(r.fps));
  }
  // Nothing was measured at all, including baseline — so there is no reference
  // to compare against and the verdict must say that rather than shrug.
  assert.ok(verdict(results).startsWith("Sweep did not complete"));
});

test("screens-off and crt-frozen both exist so geometry can be split from upload", () => {
  // The attribution depends on the pair: screens-off is geometry + upload +
  // draw, crt-frozen is upload alone, and the difference is the geometry cost.
  // If either is ever dropped, the sweep can no longer answer the question that
  // motivated it (does a low-poly Blender re-export help?).
  const ids = CONDITIONS.map((c) => c.id);
  assert.ok(ids.includes("screens-off"));
  assert.ok(ids.includes("crt-frozen"));
  assert.ok(ids.includes("baseline"), "every delta is measured against baseline");
});

test("an abandoned sweep never fabricates a winner", () => {
  // The realistic phone failure: the screen locks partway through, so the later
  // conditions have no samples. Zero frame time must not read as a 100% saving.
  const partial = new Map<ConditionId, number[]>([
    ["baseline", [40, 40, 40]],
    ["aurora-off", [39, 39, 39]],
  ]);

  const results = summarize(partial, CONDITIONS);
  const unmeasured = results.filter((r) => r.samples === 0);

  assert.ok(unmeasured.length > 0, "this fixture is meant to leave conditions unmeasured");
  for (const r of unmeasured) {
    assert.equal(r.recoveredPct, 0, `${r.id} claimed a saving it never measured`);
  }
  // Measured conditions must all sort above unmeasured ones.
  const firstUnmeasured = results.findIndex((r) => r.samples === 0);
  const lastMeasured = results.map((r) => r.samples > 0).lastIndexOf(true);
  assert.ok(lastMeasured < firstUnmeasured, "an unmeasured condition outranked a measured one");
  assert.ok(verdict(results).startsWith("No single layer dominates"));
});

// --- Vsync saturation (2026-08-02) -------------------------------------------
// Andrew's iPhone returned a median of exactly 17.0ms for all eight conditions
// (60Hz vsync) while p95 ranged 17.0–40.0. Ranking on the median reported "no
// single layer dominates" and buried a completely unambiguous tail result.

/** The real measurement, verbatim, as [medianMs, p95Ms]. */
const IPHONE_18_7: Record<string, [number, number]> = {
  baseline: [17, 40],
  "aurora-off": [17, 20],
  "stars-off": [17, 33],
  "sparks-off": [17, 36],
  "screens-off": [17, 17],
  "crt-frozen": [17, 17],
  "bezels-off": [17, 38],
  "dpr-down": [17, 40],
};

/** Synthesize a sample set with the given median and p95. */
function samplesFor([medianMs, p95Ms]: [number, number]): number[] {
  // 90/10 rather than 95/5: percentile(95) of 100 samples reads index 94, so a
  // 95/5 split would put the last low value exactly there and the fixture would
  // never express its own p95.
  return Array.from({ length: 100 }, (_, i) => (i < 90 ? medianMs : p95Ms));
}

function iphoneSamples() {
  return new Map<ConditionId, number[]>(
    Object.entries(IPHONE_18_7).map(([id, pair]) => [id as ConditionId, samplesFor(pair)]),
  );
}

test("a vsync-pinned median is detected as saturated rather than believed", () => {
  const results = summarize(iphoneSamples(), CONDITIONS);
  assert.equal(medianIsSaturated(results), true);
});

test("a genuinely varying median is NOT treated as saturated", () => {
  // Guard against the detector firing on real data and silently switching the
  // ranking metric when the median was informative all along.
  const varied = new Map<ConditionId, number[]>([
    ["baseline", samplesFor([40, 60])],
    ["aurora-off", samplesFor([21, 30])],
    ["screens-off", samplesFor([38, 55])],
    ["stars-off", samplesFor([39, 58])],
  ]);
  assert.equal(medianIsSaturated(summarize(varied, CONDITIONS)), false);
});

test("on the real iPhone data the upload conditions win, not the geometry ones", () => {
  // The question this whole harness was built to answer: is a low-poly Blender
  // re-export worth paying for? screens-off and crt-frozen scoring identically
  // is the proof that it is not — one removes 145k triangles and the other does
  // not, and they recover the same tail.
  const results = summarize(iphoneSamples(), CONDITIONS);
  const byId = new Map(results.map((r) => [r.id, r]));

  const screens = byId.get("screens-off");
  const crt = byId.get("crt-frozen");
  const bezels = byId.get("bezels-off");
  const dpr = byId.get("dpr-down");
  assert.ok(screens && crt && bezels && dpr);

  assert.equal(screens.recoveredTailPct, crt.recoveredTailPct);
  assert.ok(screens.recoveredTailPct >= 50, "hiding the screens must show a large tail win");
  // Geometry-only and fill-rate-only ablations must NOT clear the bar, or the
  // conclusion "it isn't the mesh" would not follow.
  assert.ok(bezels.recoveredTailPct < SIGNIFICANT_RECOVERY_PCT);
  assert.ok(dpr.recoveredTailPct < SIGNIFICANT_RECOVERY_PCT);

  assert.equal(results[0].id === "screens-off" || results[0].id === "crt-frozen", true);
});

test("the verdict names the metric when it falls back to the tail", () => {
  // "recovers 58%" without saying 58% OF WHAT would read as a claim about the
  // typical frame, which is exactly what did not improve.
  const v = verdict(summarize(iphoneSamples(), CONDITIONS));
  assert.ok(v.includes("capped"), `verdict did not flag the cap: ${v}`);
  assert.ok(v.includes("Screens hidden") || v.includes("CRT redraw frozen"), v);
  assert.ok(v.includes("hitch"), `verdict did not name the tail metric: ${v}`);
  assert.ok(!v.startsWith("No single layer dominates"), "the tail result was real and must be reported");
});

test("saturation detection needs enough conditions to be a real observation", () => {
  // Two conditions that happen to match is a coincidence, not a saturated ruler.
  const twoOnly = new Map<ConditionId, number[]>([
    ["baseline", samplesFor([17, 40])],
    ["aurora-off", samplesFor([17, 20])],
  ]);
  assert.equal(medianIsSaturated(summarize(twoOnly, CONDITIONS)), false);
});
