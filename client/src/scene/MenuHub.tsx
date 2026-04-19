import { useRef } from "react";
import * as THREE from "three";
import { PAGES, type PageConfig } from "@/data/sceneConfig";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { MenuButton } from "./MenuButton";
import { LogoModel } from "./LogoModel";

interface MenuHubProps {
  onPageSelect: (page: PageConfig) => void;
}

export function MenuHub({ onPageSelect }: MenuHubProps) {
  const groupRef = useRef<THREE.Group>(null);

  useMouseParallax(groupRef, {
    intensity: 0.4,
    smoothing: 0.06,
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
