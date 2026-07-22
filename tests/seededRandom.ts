/**
 * mulberry32 — a small, fast, well-distributed seeded PRNG.
 *
 * The procedural generators take an injectable `random` specifically so their
 * tests do not depend on `Math.random`. A generator test driven by real
 * randomness is flaky by construction: it passes or fails by luck, and a flaky
 * test is worse than no test because it trains you to re-run rather than read.
 *
 * Tests sweep several seeds instead, which keeps the coverage of many samples
 * while staying reproducible — a failure names the seed that produced it.
 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeds swept by the generator tests. */
export const SEEDS = [1, 7, 42, 1337, 90210, 20260722];
