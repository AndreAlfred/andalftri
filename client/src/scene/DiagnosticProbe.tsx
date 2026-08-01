import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { useDiagnosticsStore } from "@/hooks/useDiagnostics";
import {
  buildSchedule,
  MEASURE_MS,
  SETTLE_MS,
  type ConditionId,
} from "@/lib/diagnostics";
import { setScreenWakeFrozen } from "./screenWake";

/**
 * Drives the `?diag=1` ablation sweep from inside the Canvas (2026-08-01).
 *
 * Sampling happens in `useFrame` rather than from a `requestAnimationFrame`
 * loop of its own, so the timestamps come from the same loop the scene actually
 * renders on. A separate rAF would be scheduled independently of R3F's render
 * and would measure the browser's frame cadence rather than this scene's.
 */

const SCREEN_RE = /^section_0\d_screen$/;
const BEZEL_RE = /^section_0\d_bezel$/;

/** Ablations that act on the scene graph, keyed by what they hide. */
function applySceneAblation(scene: THREE.Object3D, condition: ConditionId) {
  scene.traverse((object) => {
    // Restore first: a slot must start from the same state regardless of what
    // the previous slot hid, or the ablations would accumulate down the round.
    if (object.userData.diagHidden) {
      object.visible = true;
      object.userData.diagHidden = false;
    }
  });

  const hide = (predicate: (object: THREE.Object3D) => boolean) => {
    scene.traverse((object) => {
      if (!predicate(object) || !object.visible) return;
      object.visible = false;
      object.userData.diagHidden = true;
    });
  };

  switch (condition) {
    case "stars-off":
      hide((o) => o.name === "diag-starfield");
      break;
    case "sparks-off":
      hide((o) => o.name === "diag-sparks");
      break;
    case "screens-off":
      hide((o) => SCREEN_RE.test(o.name));
      break;
    case "bezels-off":
      hide((o) => BEZEL_RE.test(o.name));
      break;
    default:
      break;
  }
}

export function DiagnosticProbe() {
  const scene = useThree((state) => state.scene);
  const setDpr = useThree((state) => state.setDpr);
  const gl = useThree((state) => state.gl);

  const schedule = useRef(buildSchedule());
  const slot = useRef(0);
  const elapsed = useRef(0);
  const baseDpr = useRef(gl.getPixelRatio());
  const done = useRef(false);

  // Whatever the sweep was holding must not outlive it — a half-applied
  // ablation would silently become the site's normal state.
  useEffect(() => {
    return () => {
      setScreenWakeFrozen(false);
      document.documentElement.removeAttribute("data-diag");
      scene.traverse((object) => {
        if (object.userData.diagHidden) {
          object.visible = true;
          object.userData.diagHidden = false;
        }
      });
      setDpr(baseDpr.current);
    };
  }, [scene, setDpr]);

  useFrame((_, delta) => {
    if (done.current) return;

    const dtMs = delta * 1000;
    const current = schedule.current[slot.current];
    const store = useDiagnosticsStore.getState();

    // Entering a new slot: apply its ablation, then discard the settle window.
    // The first frames after a change include the cost of the change itself
    // (a DPR step reallocates the drawing buffer, hiding a mesh dirties the
    // render list) and measuring those would attribute the transition to the
    // condition.
    if (elapsed.current === 0) {
      applySceneAblation(scene, current);
      setScreenWakeFrozen(current === "crt-frozen");
      if (current === "aurora-off") {
        document.documentElement.dataset.diag = "aurora-off";
      } else {
        document.documentElement.removeAttribute("data-diag");
      }
      setDpr(current === "dpr-down" ? 0.75 : baseDpr.current);
      store.setActive(current);
    }

    elapsed.current += dtMs;

    if (elapsed.current > SETTLE_MS) {
      store.record(current, dtMs);
    }

    if (elapsed.current >= SETTLE_MS + MEASURE_MS) {
      elapsed.current = 0;
      slot.current += 1;
      store.setProgress(slot.current / schedule.current.length);

      if (slot.current >= schedule.current.length) {
        done.current = true;
        setScreenWakeFrozen(false);
        document.documentElement.removeAttribute("data-diag");
        setDpr(baseDpr.current);
        applySceneAblation(scene, "baseline");
        store.finish();
      }
    }
  });

  return null;
}
