import { useEffect, useRef, useState } from "react";
import { createFireOnceGuard } from "@/hud/bootLifecycle";
import { VisorChrome } from "@/hud/VisorChrome";
import {
  getSceneLoadPhase,
  isSceneLoadComplete,
  type SceneLoadState,
} from "@/lib/sceneLoadState";

interface LoadingScreenProps {
  loadState: SceneLoadState;
  onReady?: () => void;
}

export function LoadingScreen({ loadState, onReady }: LoadingScreenProps) {
  const { item } = loadState;
  const phase = getSceneLoadPhase(loadState);
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [hasSettled, setHasSettled] = useState(false);
  // Defense in depth alongside App's useCallback (RC-5): LoadingScreen stays
  // mounted after fade (it returns null but keeps its hooks), so this guard
  // ensures onReady cannot fire twice even if the ready effect re-runs later
  // or a future caller passes an unstable onReady identity.
  const attemptReady = useRef(createFireOnceGuard());

  useEffect(() => {
    const settleTimer = window.setTimeout(() => {
      setHasSettled(true);
    }, 180);

    return () => window.clearTimeout(settleTimer);
  }, []);

  useEffect(() => {
    if (!hasSettled) return;
    if (!isSceneLoadComplete(loadState)) return;

    const readyTimer = window.setTimeout(() => {
      setIsLeaving(true);
      if (attemptReady.current()) {
        onReady?.();
      }
    }, 420);
    const removalTimer = window.setTimeout(() => setIsVisible(false), 1120);

    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(removalTimer);
    };
  }, [hasSettled, loadState, onReady]);

  if (!isVisible) {
    return null;
  }

  const statusLabel = phase === "preparing"
    ? "Preparing scene bundle"
    : phase === "streaming"
    ? item
      ? `Streaming ${item.split("/").pop() ?? "scene asset"}`
      : "Streaming chrome, type, and sky"
    : "World online";

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-[#070b10] px-6 transition-opacity duration-700 ${
        isLeaving ? "opacity-0" : "opacity-100"
      }`}
      aria-live="polite"
    >
      <VisorChrome noiseOpacity={0.55} />

      <div className="relative w-full max-w-xl px-4 text-white">
        <div className="relative">
          <p className="panel-meta text-[0.72rem] uppercase text-cyan-200/78">Helmet link</p>

          <div className="mt-6 flex items-center justify-between gap-6">
            <div>
              <div className="panel-title text-6xl leading-none text-white drop-shadow-[0_0_28px_rgba(137,241,255,0.18)] sm:text-7xl">
                <span className="inline-block">@</span>
              </div>
              <p className="panel-body mt-4 max-w-sm text-sm text-white/70 sm:text-base">
                Establishing visor sync, warming the tube screens, and clearing the wireframe dark.
              </p>
            </div>


          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.24em] text-white/46">
              <span className="panel-meta">Scene transfer</span>
              <span className="panel-meta text-cyan-200/74">{phase === "complete" ? "Ready" : "In progress"}</span>
            </div>
            <div
              className="relative h-px overflow-hidden bg-white/25"
              role="progressbar"
              aria-label="Scene transfer"
              aria-valuenow={phase === "complete" ? 100 : undefined}
              aria-valuemin={phase === "complete" ? 0 : undefined}
              aria-valuemax={phase === "complete" ? 100 : undefined}
            >
              <div
                className={`absolute inset-y-0 left-0 bg-cyan-200 transition-[width] duration-500 ease-out ${phase === "complete" ? "w-full" : "w-1/4"}`}
              />
              {phase !== "complete" ? <div className="loader-sweep absolute inset-y-0 w-1/3 bg-cyan-200" /> : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-white/52">
            <p className="panel-body">{statusLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
