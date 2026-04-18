import { useRef } from "react";
import * as THREE from "three";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { LogoModel } from "./LogoModel";

export function MenuHub() {
  const groupRef = useRef<THREE.Group>(null);

  useMouseParallax(groupRef, {
    intensity: 0.4,
    smoothing: 0.06,
  });

  return (
    <group ref={groupRef}>
      <LogoModel />
    </group>
  );
}
