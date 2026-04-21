import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useCameraStore } from "@/hooks/useCamera";
import { useScrollInteractionStore } from "@/hooks/useScrollInteraction";

const positionTarget = new THREE.Vector3();
const lookAtTarget = new THREE.Vector3();
const basePositionTarget = new THREE.Vector3();
const baseLookAtTarget = new THREE.Vector3();

export function CameraController() {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const {
      targetPosition,
      targetLookAt,
      currentPage,
      isTransitioning,
      finishTransition,
    } = useCameraStore.getState();
    const { cameraTilt } = useScrollInteractionStore.getState();

    basePositionTarget.set(...targetPosition);
    baseLookAtTarget.set(...targetLookAt);
    positionTarget.copy(basePositionTarget);
    lookAtTarget.copy(baseLookAtTarget);

    if (!currentPage) {
      positionTarget.y += cameraTilt * 1.4;
      lookAtTarget.y += cameraTilt * 4.2;
    }

    camera.position.lerp(positionTarget, 0.065);
    currentLookAt.current.lerp(lookAtTarget, 0.075);
    camera.lookAt(currentLookAt.current);

    if (!isTransitioning) return;

    const positionDistance = camera.position.distanceTo(basePositionTarget);
    const lookAtDistance = currentLookAt.current.distanceTo(baseLookAtTarget);

    if (positionDistance < 0.05 && lookAtDistance < 0.05) {
      camera.position.copy(positionTarget);
      currentLookAt.current.copy(lookAtTarget);
      camera.lookAt(currentLookAt.current);
      finishTransition();
    }
  });

  return null;
}
