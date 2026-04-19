import { useCallback, useRef } from "react";
import * as THREE from "three";
import { PAGES, type PageConfig } from "@/data/sceneConfig";
import { useCameraStore } from "@/hooks/useCamera";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { MenuButton } from "./MenuButton";
import { LogoModel } from "./LogoModel";

export function MenuHub() {
  const groupRef = useRef<THREE.Group>(null);
  const flyTo = useCameraStore((state) => state.flyTo);

  useMouseParallax(groupRef, {
    intensity: 0.4,
    smoothing: 0.06,
  });

  const handleButtonClick = useCallback(
    (page: PageConfig) => {
      flyTo(page.cameraPosition, page.cameraLookAt, page.id);
    },
    [flyTo],
  );

  return (
    <group ref={groupRef}>
      <LogoModel />
      {PAGES.map((page, index) => (
        <MenuButton
          key={page.id}
          page={page}
          index={index}
          onClick={handleButtonClick}
        />
      ))}
    </group>
  );
}
