/**
 * On-device ablation harness (`?diag=1`), 2026-08-01.
 *
 * Why this exists: two rounds of mechanism-level optimisation have not fixed the
 * reported lag, and CLAUDE.md's working philosophy is explicit that two failed
 * tunings means stop tuning and instrument. Nothing in the sandbox can measure
 * this — lessons.md entry A — and reasoning from architecture has now been wrong
 * twice, so the only remaining move is to make the affected device report.
 *
 * Method: hold one ablation at a time, measure frame times, and ROUND-ROBIN the
 * conditions rather than running each to completion. That ordering is the whole
 * point. A phone's frame rate at second 5 and second 40 are different machines
 * because of thermal throttling, so measuring condition A then condition B then
 * condition C confounds the ablation with the drift — later conditions would
 * look worse purely for being later. Interleaving spreads the drift evenly
 * across every condition, and taking a median over rounds rejects the transient
 * spikes that a mean would absorb.
 *
 * Pure module (no DOM, no three.js) so tests/diagnostics.test.ts can exercise
 * the scheduling and the statistics under plain Node.
 */

export type ConditionId =
  | "baseline"
  | "aurora-off"
  | "stars-off"
  | "sparks-off"
  | "screens-off"
  | "crt-frozen"
  | "bezels-off"
  | "dpr-down";

export interface Condition {
  id: ConditionId;
  /** Shown in the overlay. */
  label: string;
  /** What a win here would mean — printed with the results so the number is interpretable. */
  implies: string;
}

/**
 * `screens-off` and `crt-frozen` are deliberately overlapping, and that overlap
 * is what makes the result attributable:
 *
 *   screens-off  = 145,152 triangles + 7 texture uploads + 7 draw calls
 *   crt-frozen   =                     7 texture uploads
 *   difference   ≈ the geometry cost alone
 *
 * Hiding a mesh is a cruder instrument than swapping it for a low-poly one, but
 * it is an upper bound on what a low-poly version could possibly recover, and it
 * cannot introduce a geometry bug of its own. If hiding the screens outright
 * does not move the frame time, decimating them in Blender cannot either — which
 * is exactly the question worth answering before paying for a re-export.
 */
export const CONDITIONS: Condition[] = [
  { id: "baseline", label: "Baseline", implies: "everything on — the reference" },
  { id: "aurora-off", label: "Helmet aurora off", implies: "CSS blur/backdrop-filter is the cost" },
  { id: "stars-off", label: "Starfield off", implies: "point fill rate is the cost" },
  { id: "sparks-off", label: "Sparks off", implies: "point fill rate is the cost" },
  { id: "screens-off", label: "Screens hidden", implies: "145k tris + uploads + draws" },
  { id: "crt-frozen", label: "CRT redraw frozen", implies: "canvas upload is the cost, not geometry" },
  { id: "bezels-off", label: "Bezels hidden", implies: "65k tris of bezel geometry" },
  { id: "dpr-down", label: "DPR 0.75", implies: "raw fill rate / resolution is the cost" },
];

export const SETTLE_MS = 400;
export const MEASURE_MS = 1200;
export const ROUNDS = 3;

/**
 * Round-robin slot order: every condition once per round, rotated each round so
 * no condition keeps the same neighbours. Rotation matters because a heavy
 * condition leaves the GPU hotter for whatever follows it; fixing the order
 * would bake that bias into the same victim every round.
 */
export function buildSchedule(
  conditions: readonly Condition[] = CONDITIONS,
  rounds: number = ROUNDS,
): ConditionId[] {
  const order: ConditionId[] = [];
  for (let round = 0; round < rounds; round += 1) {
    for (let i = 0; i < conditions.length; i += 1) {
      order.push(conditions[(i + round) % conditions.length].id);
    }
  }
  return order;
}

export function totalDurationMs(schedule: readonly ConditionId[]): number {
  return schedule.length * (SETTLE_MS + MEASURE_MS);
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * 95th-percentile frame time. Reported alongside the median because they answer
 * different questions: the median says how it usually feels, p95 says how bad
 * the hitches are. "Frame drop city" is a complaint about the tail, and a change
 * can improve the median while leaving the tail untouched.
 */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

export interface ConditionResult {
  id: ConditionId;
  label: string;
  implies: string;
  /** Median frame time in ms across every measured slot for this condition. */
  medianMs: number;
  /** 95th-percentile frame time in ms — the hitches. */
  p95Ms: number;
  fps: number;
  samples: number;
  /** Median-ms delta vs baseline. Negative = this ablation made it FASTER. */
  deltaVsBaselineMs: number;
  /** Percent of baseline frame time recovered by this ablation. */
  recoveredPct: number;
}

/**
 * Fold raw per-slot frame times into a ranked table.
 *
 * Reports frame time in MILLISECONDS as the primary number, not fps. fps is a
 * reciprocal, so equal fps differences are not equal amounts of work — going
 * 60→50 and 30→27 are both "10-ish fps" but the second is a third of the cost of
 * the first. Milliseconds add up linearly, which is what lets these ablations be
 * compared against each other at all.
 */
export function summarize(
  samplesByCondition: ReadonlyMap<ConditionId, readonly number[]>,
  conditions: readonly Condition[] = CONDITIONS,
): ConditionResult[] {
  const baselineMs = median(samplesByCondition.get("baseline") ?? []);

  const results = conditions.map((condition) => {
    const samples = samplesByCondition.get(condition.id) ?? [];
    const medianMs = median(samples);
    // An UNMEASURED condition has medianMs 0, which would compute as a 100%
    // saving — a phone that locked or backgrounded the tab mid-sweep would
    // otherwise report a fabricated winner with total confidence. Absence of a
    // measurement is not a measurement of zero.
    const measured = samples.length > 0 && medianMs > 0;
    return {
      id: condition.id,
      label: condition.label,
      implies: condition.implies,
      medianMs,
      p95Ms: percentile(samples, 95),
      fps: measured ? 1000 / medianMs : 0,
      samples: samples.length,
      deltaVsBaselineMs: measured ? medianMs - baselineMs : 0,
      recoveredPct: measured && baselineMs > 0 ? ((baselineMs - medianMs) / baselineMs) * 100 : 0,
    };
  });

  // Biggest saving first, but unmeasured conditions sort last regardless — they
  // have no claim on the ranking. Baseline recovers nothing against itself and
  // settles near the bottom by construction.
  return results.sort((a, b) => {
    const aMeasured = a.samples > 0;
    const bMeasured = b.samples > 0;
    if (aMeasured !== bMeasured) return aMeasured ? -1 : 1;
    return b.recoveredPct - a.recoveredPct;
  });
}

/**
 * A saving is only worth acting on if it clears the run-to-run noise. Without a
 * floor, every ablation "helps" by a percent or two and the table reads as a
 * to-do list instead of a diagnosis.
 */
export const SIGNIFICANT_RECOVERY_PCT = 8;

export function verdict(results: readonly ConditionResult[]): string {
  const baseline = results.find((r) => r.id === "baseline");
  if (!baseline || baseline.samples === 0) {
    return "Sweep did not complete — baseline was never measured, so nothing is comparable.";
  }
  const real = results.filter(
    (r) => r.id !== "baseline" && r.samples > 0 && r.recoveredPct >= SIGNIFICANT_RECOVERY_PCT,
  );
  if (real.length === 0) {
    return "No single layer dominates — the cost is spread, or it is not in any ablated layer.";
  }
  const top = real[0];
  return `${top.label} recovers ${top.recoveredPct.toFixed(0)}% of frame time — ${top.implies}.`;
}
