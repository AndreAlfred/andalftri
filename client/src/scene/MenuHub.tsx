import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PAGES, type PageConfig } from "@/data/sceneConfig";
import { useCameraStore } from "@/hooks/useCamera";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import {
  useScrollInteraction,
  useScrollInteractionStore,
} from "@/hooks/useScrollInteraction";
import { MenuButton } from "./MenuButton";
import { LogoModel } from "./LogoModel";

interface MenuHubProps {
  onPageSelect: (page: PageConfig) => void;
}

export function MenuHub({ onPageSelect }: MenuHubProps) {
  const groupRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const idleRotationRef = useRef(0);
  const hubVisibilityRef = useRef(1);
  const currentPage = useCameraStore((state) => state.currentPage);
  const isTransitioning = useCameraStore((state) => state.isTransitioning);
  const assetSwapDemoEnabled =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("asset-demo") === "1";
  const canInteract = !currentPage && !isTransitioning;

  useMouseParallax(groupRef, {
    intensity: 0.4,
    smoothing: 0.06,
  });

  useScrollInteraction({
    enabled: canInteract,
    pages: PAGES,
    onCommit: onPageSelect,
  });

  useFrame(() => {
    if (!groupRef.current || !visualRef.current) return;

    const { phaseNudge } = useScrollInteractionStore.getState();
    idleRotationRef.current = THREE.MathUtils.lerp(
      idleRotationRef.current,
      phaseNudge * 0.08,
      0.08,
    );
    groupRef.current.rotation.z = idleRotationRef.current;

    const targetVisibility = currentPage ? 0.12 : 1;
    hubVisibilityRef.current = THREE.MathUtils.lerp(
      hubVisibilityRef.current,
      targetVisibility,
      currentPage ? 0.12 : 0.08,
    );

    const scale = THREE.MathUtils.lerp(0.82, 1, hubVisibilityRef.current);
    visualRef.current.scale.setScalar(scale);

    visualRef.current.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const materials = Array.isArray(child.material)
        ? child.material
        : child.material
          ? [child.material]
          : [];

      materials.forEach((material) => {
        material.transparent = true;
        material.opacity = hubVisibilityRef.current;
      });
    });
  });

  return (
    <group ref={groupRef}>
      <group ref={visualRef}>
        <LogoModel
          modelPath={assetSwapDemoEnabled ? "/models/task-21-sample-box.glb" : undefined}
          opacity={hubVisibilityRef.current}
        />
        {PAGES.map((page, index) => (
          <MenuButton
            key={page.id}
            page={page}
            index={index}
            onClick={onPageSelect}
            disabled={!canInteract}
            opacity={hubVisibilityRef.current}
            modelPath={assetSwapDemoEnabled && index === 0 ? "/models/task-21-sample-box.glb" : undefined}
          />
        ))}
      </group>
    </group>
  );
}
