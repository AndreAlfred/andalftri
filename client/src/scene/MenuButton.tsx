import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { PageConfig } from "@/data/sceneConfig";
import { useLemniscate } from "@/hooks/useLemniscate";
import { useProximityTilt } from "@/hooks/useProximityTilt";

interface MenuButtonProps {
  page: PageConfig;
  index: number;
  onClick: (page: PageConfig) => void;
  modelPath?: string;
}

export function MenuButton({
  page,
  index,
  onClick,
  modelPath,
}: MenuButtonProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseScale = useMemo(
    () => 0.9 + ((index % 3) * 0.08 + Math.floor(index / 3) * 0.04),
    [index],
  );

  void modelPath;

  useLemniscate(groupRef, {
    yAmplitude: 12,
    xAmplitude: 3,
    speed: 0.25,
    phaseOffset: index * (Math.PI / 3),
  });

  useProximityTilt(tiltRef, {
    maxTilt: 13,
    range: 0.6,
    smoothing: 0.09,
  });

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const targetScale = hovered ? baseScale * 1.1 : baseScale;
    const pulse = hovered ? 1 + Math.sin(clock.getElapsedTime() * 5 + index) * 0.03 : 1;
    const nextScale = targetScale * pulse;

    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, nextScale, 0.14);
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, nextScale, 0.14);
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, nextScale, 0.14);
  });

  return (
    <group ref={groupRef} position={page.buttonOffset}>
      <group ref={tiltRef}>
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          onClick={() => onClick(page)}
          onPointerEnter={() => {
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerLeave={() => {
            setHovered(false);
            document.body.style.cursor = "default";
          }}
        >
          <capsuleGeometry args={[0.34, 0.92, 10, 18]} />
          <meshPhysicalMaterial
            color={hovered ? "#eef4ff" : "#d1d4df"}
            metalness={0.98}
            roughness={hovered ? 0.04 : 0.08}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={1.9}
            emissive={hovered ? "#405d7f" : "#000000"}
            emissiveIntensity={hovered ? 0.5 : 0}
          />
        </mesh>
        <Text
          position={[0, -0.88, 0]}
          fontSize={0.18}
          color={hovered ? "#ffffff" : "#d7dee9"}
          anchorX="center"
          anchorY="top"
          maxWidth={2.5}
          textAlign="center"
        >
          {page.label}
        </Text>
      </group>
    </group>
  );
}
