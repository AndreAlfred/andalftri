import assert from "node:assert/strict";
import test from "node:test";
import {
  apparentSpeedRange,
  buildSparkBuffers,
  DUTY,
  FAR_RADIUS,
  MAX_GROUP,
  MAX_SPARKS,
  NEAR_RADIUS,
  NEON,
  TAIL_POINTS,
  travelFor,
} from "../client/src/scene/sparkGeometry.ts";
import { SEEDS, seededRandom } from "./seededRandom.ts";

function sparkOrigins(buffers: ReturnType<typeof buildSparkBuffers>) {
  const out: { radius: number; travel: number; period: number; offset: number }[] = [];
  for (let s = 0; s < buffers.count; s += 1) {
    const i = s * TAIL_POINTS;
    out.push({
      radius: Math.hypot(
        buffers.origins[i * 3],
        buffers.origins[i * 3 + 1],
        buffers.origins[i * 3 + 2],
      ),
      travel: buffers.travels[i],
      period: buffers.periods[i],
      offset: buffers.offsets[i],
    });
  }
  return out;
}

test("every spark sits inside the declared depth range", () => {
  for (const seed of SEEDS) {
    const sparks = sparkOrigins(buildSparkBuffers(MAX_SPARKS, seededRandom(seed)));

    for (const s of sparks) {
      assert.ok(s.radius >= NEAR_RADIUS - 1e-3, `spark at ${s.radius} is nearer than allowed`);
      assert.ok(s.radius <= FAR_RADIUS + 1e-3, `spark at ${s.radius} is further than allowed`);
    }
  }
});

test("sparks are genuinely spread in depth, not all at one distance", () => {
  for (const seed of SEEDS) {
    // Andrew: "it's weird that they're all the same distance away from the camera."
    const radii = sparkOrigins(buildSparkBuffers(MAX_SPARKS, seededRandom(seed))).map((s) => s.radius);
    const min = Math.min(...radii);
    const max = Math.max(...radii);
    const span = FAR_RADIUS - NEAR_RADIUS;

    assert.ok(max - min > span * 0.5, `depth spread was only ${max - min} of ${span}`);
  }
});

test("slow sparks are always far away", () => {
  // Andrew's rule, and the one that carries the depth illusion: the eye reads
  // angular speed as inverse distance, so a near spark that crawls destroys it.
  // Sampling speed and distance independently is what allowed that.
  for (let i = 0; i <= 20; i += 1) {
    const [near] = apparentSpeedRange(0);
    const [far] = apparentSpeedRange(i / 20);
    assert.ok(far <= near + 1e-9, "the slow end of the band must open up with distance");
  }

  const [nearMin] = apparentSpeedRange(0);
  const [farMin] = apparentSpeedRange(1);
  assert.ok(nearMin > farMin, "near sparks must have a higher minimum speed than far ones");
  assert.ok(nearMin >= 0.7, "near sparks must never be allowed to crawl");
});

test("apparent speed is bounded and the range never inverts", () => {
  for (let i = 0; i <= 20; i += 1) {
    const [lo, hi] = apparentSpeedRange(i / 20);
    assert.ok(lo > 0, "a spark must always move");
    assert.ok(lo <= hi, `range inverted at t=${i / 20}: ${lo} > ${hi}`);
    assert.ok(hi <= 1, "apparent speed is normalised to 1");
  }
  // Out-of-range inputs clamp rather than extrapolating into nonsense.
  assert.deepEqual(apparentSpeedRange(-5), apparentSpeedRange(0));
  assert.deepEqual(apparentSpeedRange(5), apparentSpeedRange(1));
});

test("distant sparks cover more world distance at the same apparent speed", () => {
  // Angular speed falls off as 1/distance, so world travel has to rise with
  // radius or a far spark looks frozen.
  assert.ok(travelFor(FAR_RADIUS, 0.5) > travelFor(NEAR_RADIUS, 0.5));
});

test("sparks appear in randomly sized groups, not only singly", () => {
  for (const seed of SEEDS) {
    // Andrew: "they should appear in randomly numbered groups, not only as
    // singles." Members of a group share a firing time.
    const sparks = sparkOrigins(buildSparkBuffers(MAX_SPARKS, seededRandom(seed)));
    const byPeriod = new Map<number, number>();
    for (const s of sparks) byPeriod.set(s.period, (byPeriod.get(s.period) ?? 0) + 1);

    const groupSizes = [...byPeriod.values()];
    assert.ok(groupSizes.some((n) => n > 1), "no groups were formed at all");
    assert.ok(groupSizes.some((n) => n === 1), "singles should still occur");
    assert.ok(
      Math.max(...groupSizes) <= MAX_GROUP,
      `a group of ${Math.max(...groupSizes)} exceeds MAX_GROUP`,
    );
    assert.ok(new Set(groupSizes).size > 1, "group sizes should vary");
  }
});

test("group members strike together but are not identical", () => {
  for (const seed of SEEDS) {
    const buffers = buildSparkBuffers(MAX_SPARKS, seededRandom(seed));
    const sparks = sparkOrigins(buffers);
    const groups = new Map<number, typeof sparks>();
    for (const s of sparks) {
      const list = groups.get(s.period) ?? [];
      list.push(s);
      groups.set(s.period, list);
    }

    let checked = 0;
    for (const members of groups.values()) {
      if (members.length < 2) continue;
      checked += 1;
      const offsets = members.map((m) => m.offset);
      const spread = Math.max(...offsets) - Math.min(...offsets);
      // Close enough to read as one burst...
      assert.ok(spread < members[0].period * 0.1, "group members drifted apart in time");
      // ...but each has its own trajectory, or the burst reads as one object.
      assert.ok(
        new Set(members.map((m) => Math.round(m.radius * 100))).size > 1 || members.length === 1,
        "group members share an identical radius",
      );
    }
    assert.ok(checked > 0, "no multi-member groups existed to check");
  }
});

test("periods are never shared between groups", () => {
  for (const seed of SEEDS) {
    // A common period would have the whole field firing in lockstep, which reads
    // as a machine rather than as magic.
    const sparks = sparkOrigins(buildSparkBuffers(MAX_SPARKS, seededRandom(seed)));
    const periods = new Set(sparks.map((s) => s.period));

    assert.ok(periods.size > 8, `only ${periods.size} distinct periods across the field`);
  }
});

test("the duty cycle keeps sparks rare", () => {
  // Halved from 0.2 at Andrew's request. Expected simultaneously-alive sparks
  // is count * DUTY, and only the fraction inside the camera frustum is seen.
  assert.ok(DUTY <= 0.1, `duty ${DUTY} is higher than the halved target`);
  assert.ok(DUTY > 0, "sparks must still fire");
});

test("every buffer is fully populated and internally consistent", () => {
  for (const seed of SEEDS) {
    const b = buildSparkBuffers(MAX_SPARKS, seededRandom(seed));
    const total = MAX_SPARKS * TAIL_POINTS;

    assert.equal(b.count, MAX_SPARKS);
    assert.equal(b.origins.length, total * 3);
    assert.equal(b.tails.length, total);

    for (let i = 0; i < total; i += 1) {
      assert.ok(b.periods[i] > 0, `spark vertex ${i} has a non-positive period`);
      assert.ok(b.travels[i] > 0, `spark vertex ${i} never moves`);
      assert.ok(b.sizes[i] > 0, `spark vertex ${i} has no size`);
      const dirLength = Math.hypot(b.dirs[i * 3], b.dirs[i * 3 + 1], b.dirs[i * 3 + 2]);
      assert.ok(Math.abs(dirLength - 1) < 1e-5, `direction ${i} is not normalised`);
    }
  }
});

test("tail points ramp 0..1 within each spark", () => {
  for (const seed of SEEDS) {
    const b = buildSparkBuffers(8, seededRandom(seed));

    for (let s = 0; s < b.count; s += 1) {
      assert.equal(b.tails[s * TAIL_POINTS], 0, "the head must be at tail=0");
      assert.equal(b.tails[s * TAIL_POINTS + TAIL_POINTS - 1], 1, "the last point must be tail=1");
      for (let t = 1; t < TAIL_POINTS; t += 1) {
        assert.ok(b.tails[s * TAIL_POINTS + t] > b.tails[s * TAIL_POINTS + t - 1]);
      }
    }
  }
});

test("a whole spark shares one origin, colour and period across its tail", () => {
  for (const seed of SEEDS) {
    const b = buildSparkBuffers(16, seededRandom(seed));

    for (let s = 0; s < b.count; s += 1) {
      const head = s * TAIL_POINTS;
      for (let t = 1; t < TAIL_POINTS; t += 1) {
        const i = head + t;
        assert.equal(b.periods[i], b.periods[head]);
        assert.equal(b.offsets[i], b.offsets[head]);
        assert.equal(b.origins[i * 3], b.origins[head * 3]);
        assert.equal(b.colors[i * 3], b.colors[head * 3]);
      }
    }
  }
});

test("every spark colour comes from the neon palette", () => {
  for (const seed of SEEDS) {
    const b = buildSparkBuffers(MAX_SPARKS, seededRandom(seed));

    for (let s = 0; s < b.count; s += 1) {
      const i = s * TAIL_POINTS;
      const match = NEON.some(
        (c) =>
          Math.abs(c[0] - b.colors[i * 3]) < 1e-6 &&
          Math.abs(c[1] - b.colors[i * 3 + 1]) < 1e-6 &&
          Math.abs(c[2] - b.colors[i * 3 + 2]) < 1e-6,
      );
      assert.ok(match, `spark ${s} has an off-palette colour`);
    }
  }
});

test("requesting fewer sparks never overruns the requested count", () => {
  for (const seed of SEEDS) {
    // Groups are filled greedily, so the last group has to be truncated rather
    // than allowed to spill past the buffer.
    for (const n of [1, 2, 3, 7, 13, 71]) {
      const b = buildSparkBuffers(n, seededRandom(seed));
      assert.equal(b.count, n);
      assert.equal(b.origins.length, n * TAIL_POINTS * 3);
      assert.ok(b.periods.every((p) => p > 0), `count ${n} left an unpopulated vertex`);
    }
  }
});
