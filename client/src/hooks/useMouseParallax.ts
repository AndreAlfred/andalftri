import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";

interface ParallaxOptions {
  intensity?: number;
  smoothing?: number;
}

export function useMouseParallax(
  ref: RefObject<THREE.Group | null>,
  options: ParallaxOptions = {},
) {
  const { intensity = 0.5, smoothing = 0.05 } = options;
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useFrame(() => {
    if (!ref.current) return;

    target.current.set(
      mouse.current.x * intensity,
      mouse.current.y * intensity * 0.5,
      0,
    );

    ref.current.position.lerp(target.current, smoothing);
  });
}
