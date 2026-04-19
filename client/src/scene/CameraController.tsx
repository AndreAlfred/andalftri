import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useCameraStore } from "@/hooks/useCamera";

const positionTarget = new THREE.Vector3();
const lookAtTarget = new THREE.Vector3();

export function CameraController() {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const { targetPosition, targetLookAt, isTransitioning, finishTransition } =
      useCameraStore.getState();

    positionTarget.set(...targetPosition);
    lookAtTarget.set(...targetLookAt);

    camera.position.lerp(positionTarget, 0.065);
    currentLookAt.current.lerp(lookAtTarget, 0.075);
    camera.lookAt(currentLookAt.current);

    if (!isTransitioning) return;

    const positionDistance = camera.position.distanceTo(positionTarget);
    const lookAtDistance = currentLookAt.current.distanceTo(lookAtTarget);

    if (positionDistance < 0.05 && lookAtDistance < 0.05) {
      camera.position.copy(positionTarget);
      currentLookAt.current.copy(lookAtTarget);
      camera.lookAt(currentLookAt.current);
      finishTransition();
    }
  });

  return null;
}
