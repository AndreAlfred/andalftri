import { useFrame, useThree } from "@react-three/fiber";
import type { RefObject } from "react";
import * as THREE from "three";

interface ProximityTiltOptions {
  maxTilt?: number;
  range?: number;
  smoothing?: number;
}

const worldPosition = new THREE.Vector3();
const screenPosition = new THREE.Vector3();
const nextRotation = new THREE.Euler();

export function useProximityTilt(
  ref: RefObject<THREE.Object3D | null>,
  options: ProximityTiltOptions = {},
) {
  const { maxTilt = 15, range = 0.55, smoothing = 0.08 } = options;
  const { camera, pointer } = useThree();
  const maxRad = THREE.MathUtils.degToRad(maxTilt);

  useFrame(() => {
    if (!ref.current) return;

    ref.current.getWorldPosition(worldPosition);
    screenPosition.copy(worldPosition).project(camera);

    const dx = pointer.x - screenPosition.x;
    const dy = pointer.y - screenPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const influence = THREE.MathUtils.clamp(1 - distance / range, 0, 1);

    nextRotation.x = THREE.MathUtils.clamp(dy * maxRad * influence, -maxRad, maxRad);
    nextRotation.y = THREE.MathUtils.clamp(dx * maxRad * influence, -maxRad, maxRad);
    nextRotation.z = 0;

    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      nextRotation.x,
      smoothing,
    );
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      nextRotation.y,
      smoothing,
    );
    ref.current.rotation.z = THREE.MathUtils.lerp(
      ref.current.rotation.z,
      nextRotation.z,
      smoothing,
    );
  });
}
