import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import * as THREE from "three";
import { useScrollInteractionStore } from "@/hooks/useScrollInteraction";

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

  useFrame(({ clock }) => {
    if (!ref.current) return;

    const { phaseNudge, speedBoost } = useScrollInteractionStore.getState();
    const t = clock.getElapsedTime() * (speed + speedBoost) + phaseOffset + phaseNudge;
    ref.current.rotation.y = yAmp * Math.sin(t);
    ref.current.rotation.x = xAmp * Math.sin(t * 2);
  });
}
