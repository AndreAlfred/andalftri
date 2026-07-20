import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import * as THREE from "three";

interface LemniscateOptions {
  yAmplitude?: number;
  xAmplitude?: number;
  speed?: number;
  phaseOffset?: number;
}

export function useLemniscate(
  ref: RefObject<THREE.Object3D | null>,
  options: LemniscateOptions = {},
) {
  const {
    yAmplitude = 15,
    xAmplitude = 4,
    speed = 0.3,
    phaseOffset = 0,
  } = options;

  const yAmp = THREE.MathUtils.degToRad(yAmplitude);
  const xAmp = THREE.MathUtils.degToRad(xAmplitude);

  // 2026-07-19 (Andrew): scroll no longer couples into this rotation. The old
  // phaseNudge/speedBoost injection jerked the drift phase on every wheel tick
  // — and the sin(2t) pitch term doubled each jump — which read as the
  // artifact "wiggling" under scroll. Scroll feedback is now only the vertical
  // camera tilt (CameraController); the lemniscate stays a calm ambient drift
  // on its own clock.
  useFrame(({ clock }) => {
    if (!ref.current) return;

    const t = clock.getElapsedTime() * speed + phaseOffset;
    ref.current.rotation.y = yAmp * Math.sin(t);
    ref.current.rotation.x = xAmp * Math.sin(t * 2);
  });
}
