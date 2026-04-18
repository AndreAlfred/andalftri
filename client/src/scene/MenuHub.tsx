import { useCallback, useRef } from "react";
import * as THREE from "three";
import { PAGES, type PageConfig } from "@/data/sceneConfig";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { MenuButton } from "./MenuButton";
import { LogoModel } from "./LogoModel";

export function MenuHub() {
  const groupRef = useRef<THREE.Group>(null);

  useMouseParallax(groupRef, {
    intensity: 0.4,
    smoothing: 0.06,
  });

  const handleButtonClick = useCallback((page: PageConfig) => {
    console.log(`[MenuHub] Selected page: ${page.id} (${page.route})`);
  }, []);

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
