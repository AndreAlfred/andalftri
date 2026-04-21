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
  const idleRotationRef = useRef(0);
  const currentPage = useCameraStore((state) => state.currentPage);
  const isTransitioning = useCameraStore((state) => state.isTransitioning);

  useMouseParallax(groupRef, {
    intensity: 0.4,
    smoothing: 0.06,
  });

  useScrollInteraction({
    enabled: !currentPage && !isTransitioning,
    pages: PAGES,
    onCommit: onPageSelect,
  });

  useFrame(() => {
    if (!groupRef.current) return;

    const { phaseNudge } = useScrollInteractionStore.getState();
    idleRotationRef.current = THREE.MathUtils.lerp(
      idleRotationRef.current,
      phaseNudge * 0.08,
      0.08,
    );
    groupRef.current.rotation.z = idleRotationRef.current;
  });

  return (
    <group ref={groupRef}>
      <LogoModel />
      {PAGES.map((page, index) => (
        <MenuButton
          key={page.id}
          page={page}
          index={index}
          onClick={onPageSelect}
        />
      ))}
    </group>
  );
}
