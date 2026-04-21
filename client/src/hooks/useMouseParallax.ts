import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useGyroscope } from "@/hooks/useGyroscope";

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
  const requestedGyroPermission = useRef(false);
  const { tilt, isSupported, needsPermission, permissionState, requestPermission } =
    useGyroscope();

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    const tryRequestGyroPermission = () => {
      if (!isSupported || !needsPermission || requestedGyroPermission.current) {
        return;
      }

      requestedGyroPermission.current = true;
      void requestPermission();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("pointerdown", tryRequestGyroPermission, {
      passive: true,
    });
    window.addEventListener("touchstart", tryRequestGyroPermission, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("pointerdown", tryRequestGyroPermission);
      window.removeEventListener("touchstart", tryRequestGyroPermission);
    };
  }, [isSupported, needsPermission, requestPermission]);

  useEffect(() => {
    if (permissionState === "denied") {
      requestedGyroPermission.current = true;
    }
  }, [permissionState]);

  useFrame(() => {
    if (!ref.current) return;

    const input = tilt ?? mouse.current;

    target.current.set(input.x * intensity, input.y * intensity * 0.5, 0);

    ref.current.position.lerp(target.current, smoothing);
  });
}
