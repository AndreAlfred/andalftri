import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { useQualityStore } from "@/hooks/useQuality";

const READOUT_ID = "perf-readout-body";
const SAMPLE_SECONDS = 0.25;

/**
 * `?perf=1` instrumentation (2026-07-21).
 *
 * Exists so the tuning that follows is measured rather than felt — the project's
 * "measure, don't eyeball" rule applied to the perf work itself. Without it,
 * every claim about the adaptive tier is a guess about someone else's machine.
 *
 * The probe lives inside the Canvas (it needs the frame loop and the renderer's
 * own counters) but the readout is DOM, so it writes `textContent` directly
 * rather than calling setState. A 60Hz React re-render to display a frame
 * counter would be an observer that changes what it observes.
 */
export function PerfProbe() {
  const gl = useThree((state) => state.gl);
  const frames = useRef(0);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    frames.current += 1;
    elapsed.current += delta;
    if (elapsed.current < SAMPLE_SECONDS) return;

    const node = document.getElementById(READOUT_ID);
    if (node) {
      const fps = frames.current / elapsed.current;
      const { tier, dpr, pinned } = useQualityStore.getState();
      const { calls, triangles } = gl.info.render;
      node.textContent = [
        `${fps.toFixed(0).padStart(3, " ")} fps`,
        `dpr ${dpr.toFixed(2)}`,
        `${tier}${pinned ? " (pinned)" : ""}`,
        `${calls} calls`,
        `${(triangles / 1000).toFixed(0)}k tris`,
      ].join("  //  ");
    }

    frames.current = 0;
    elapsed.current = 0;
  });

  return null;
}

export function PerfOverlay() {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-50">
      <div className="hud-frame hud-frame-sm px-4 py-3">
        <p className="helmet-ornament-label">Perf // ?perf=1</p>
        <p
          id={READOUT_ID}
          className="helmet-ornament-value whitespace-nowrap"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          sampling
        </p>
      </div>
    </div>
  );
}
