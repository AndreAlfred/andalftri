// Pure boot-sequence logic, kept free of React so it can be exercised by
// dependency-free Node tests (see tests/bootLifecycle.test.ts).

/**
 * Cursor hold after the visor line finishes typing, before the boot chip
 * starts to fade out. ~2.5s per the design overhaul spec.
 */
export const HELMET_BOOT_HOLD_MS = 2500;

/**
 * Hold used for `prefers-reduced-motion` sessions, which skip the typewriter
 * and show the full line immediately. Short relative to HELMET_BOOT_HOLD_MS
 * since there is no typing animation to let the line "land" after.
 */
export const HELMET_BOOT_REDUCED_MOTION_HOLD_MS = 900;

/**
 * Fade-out duration for the boot chip. Matches the `duration-700` Tailwind
 * class applied to the chip in HelmetFrame.
 */
export const HELMET_BOOT_FADE_MS = 700;

export interface BootTimelineOptions {
  /** Skip the typewriter and reveal the full line immediately. */
  reducedMotion?: boolean;
}

export interface BootTimeline {
  /** Time to type the full line, 0 under reduced motion. */
  typeDurationMs: number;
  /** Cursor-hold window after typing completes, before fade starts. */
  holdMs: number;
  /** Elapsed time at which the chip begins fading out (typeDuration + hold). */
  fadeStartMs: number;
  /** Duration of the fade-out itself. */
  fadeMs: number;
  /** Elapsed time at which the chip has fully faded out. */
  totalMs: number;
}

/**
 * Computes the boot chip's timeline from the visor line length and the
 * per-character typing interval. Shared by HelmetFrame (to schedule its
 * timers) and its tests (to assert the arithmetic without mounting React).
 */
export function computeBootTimeline(
  lineLength: number,
  charMs: number,
  options: BootTimelineOptions = {},
): BootTimeline {
  const typeDurationMs = options.reducedMotion ? 0 : lineLength * charMs;
  const holdMs = options.reducedMotion ? HELMET_BOOT_REDUCED_MOTION_HOLD_MS : HELMET_BOOT_HOLD_MS;
  const fadeStartMs = typeDurationMs + holdMs;
  const fadeMs = HELMET_BOOT_FADE_MS;
  const totalMs = fadeStartMs + fadeMs;

  return { typeDurationMs, holdMs, fadeStartMs, fadeMs, totalMs };
}

/**
 * Returns a guard function that allows exactly one call through, regardless
 * of how many times it is invoked afterward. Used as defense in depth against
 * an `onReady` callback firing more than once, independent of whether the
 * caller passes a stable function identity (RC-5).
 */
export function createFireOnceGuard(): () => boolean {
  let hasFired = false;

  return () => {
    if (hasFired) return false;
    hasFired = true;
    return true;
  };
}
