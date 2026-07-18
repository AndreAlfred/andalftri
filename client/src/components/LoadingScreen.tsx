import { useProgress } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { createFireOnceGuard } from "@/hud/bootLifecycle";
import { VisorChrome } from "@/hud/VisorChrome";

interface LoadingScreenProps {
  onReady?: () => void;
}

export function LoadingScreen({ onReady }: LoadingScreenProps) {
  const { active, progress, item, loaded, total } = useProgress();
  const [isVisible, setIsVisible] = useState(true);
  const [hasSettled, setHasSettled] = useState(false);
  // Defense in depth alongside App's useCallback (RC-5): LoadingScreen stays
  // mounted after fade (it returns null but keeps its hooks), so this guard
  // ensures onReady cannot fire twice even if the ready effect re-runs later
  // or a future caller passes an unstable onReady identity.
  const attemptReady = useRef(createFireOnceGuard());

  const displayProgress = useMemo(() => {
    if (!hasSettled && !active && total === 0) {
      return 12;
    }

    if (!active && loaded === total) {
      return 100;
    }

    return Math.max(8, Math.min(100, Math.round(progress)));
  }, [active, hasSettled, loaded, progress, total]);

  useEffect(() => {
    const settleTimer = window.setTimeout(() => {
      setHasSettled(true);
    }, 180);

    return () => window.clearTimeout(settleTimer);
  }, []);

  useEffect(() => {
    if (!hasSettled) return;
    if (active) return;

    const readyTimer = window.setTimeout(() => {
      setIsVisible(false);
      if (attemptReady.current()) {
        onReady?.();
      }
    }, 420);

    return () => window.clearTimeout(readyTimer);
  }, [active, hasSettled, onReady]);

  if (!isVisible) {
    return null;
  }

  const statusLabel = active
    ? item
      ? `Streaming ${item.split("/").pop() ?? "scene asset"}`
      : "Streaming chrome, type, and sky"
    : "World online";

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-[#070b10] px-6 transition-opacity duration-700 ${
        active ? "opacity-100" : "opacity-0"
      }`}
      aria-live="polite"
    >
      <VisorChrome noiseOpacity={0.55} />

      {/* hud-frame-lg chamfer 1.25rem -> padding must stay >= 1.5rem on
          every side; p-7/sm:p-9 (28px/36px) already clear it, so no padding
          change was needed here, only the shape. clip-path clips descendant
          painting the same way overflow-hidden did, so the two overlay divs
          below stay corner-safe without it. */}
      <div className="hud-frame hud-frame-lg relative w-full max-w-xl p-7 text-white sm:p-9">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(137,241,255,0.15),transparent_34%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/55 to-transparent" />

        <div className="relative">
          <p className="panel-meta text-[0.72rem] uppercase text-cyan-200/78">Helmet link</p>

          <div className="mt-6 flex items-center justify-between gap-6">
            <div>
              <div className="panel-title text-6xl leading-none text-white drop-shadow-[0_0_28px_rgba(137,241,255,0.18)] sm:text-7xl">
                <span className="inline-block animate-pulse">@</span>
              </div>
              <p className="panel-body mt-4 max-w-sm text-sm text-white/70 sm:text-base">
                Establishing visor sync, warming the tube screens, and clearing the wireframe dark.
              </p>
            </div>

            {/* Kept as a circular gauge, not converted to hud-frame: this is
                a rotating percentage dial, not a rectangular chip, so the
                chamfer/bracket language doesn't apply the same way -- flagged
                for Andrew's review rather than assumed. Still uses the
                legacy .helmet-chip fill/blur since it's the only remaining
                consumer (see index.css). */}
            <div className="helmet-chip hidden h-28 w-28 shrink-0 rounded-full sm:grid place-items-center">
              <div className="relative h-20 w-20 rounded-full border border-white/10">
                <div
                  className="absolute inset-2 rounded-full border border-cyan-200/30"
                  style={{ transform: `rotate(${displayProgress * 3.6}deg)` }}
                />
                <div className="panel-meta tabular-nums absolute inset-0 grid place-items-center text-[0.68rem] text-white/64">
                  {displayProgress}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.24em] text-white/46">
              <span className="panel-meta">Scene transfer</span>
              <span className="panel-meta tabular-nums text-cyan-200/74">{displayProgress}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,rgba(137,241,255,0.18),rgba(137,241,255,0.95),rgba(255,255,255,0.9))] shadow-[0_0_22px_rgba(137,241,255,0.45)] transition-[width] duration-300 ease-out"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-white/52">
            <p className="panel-body">{statusLabel}</p>
            <p className="panel-meta text-[0.64rem] uppercase text-white/36">
              {total > 0 ? `${loaded}/${total} assets` : "Preparing scene bundle"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
