import { Clone, Text, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { PageConfig } from "@/data/sceneConfig";
import { useLemniscate } from "@/hooks/useLemniscate";
import { useProximityTilt } from "@/hooks/useProximityTilt";

interface MenuButtonProps {
  page: PageConfig;
  index: number;
  onClick: (page: PageConfig) => void;
  modelPath?: string;
  opacity?: number;
  disabled?: boolean;
}

function LoadedButtonAsset({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <group scale={0.9}>
      <Clone object={scene} />
    </group>
  );
}

export function MenuButton({
  page,
  index,
  onClick,
  modelPath,
  opacity = 1,
  disabled = false,
}: MenuButtonProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tiltRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const baseScale = useMemo(
    () => 0.9 + ((index % 3) * 0.08 + Math.floor(index / 3) * 0.04),
    [index],
  );

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
    if (!visualRef.current) return;

    const targetScale = hovered && !disabled ? baseScale * 1.1 : baseScale;
    const pulse = hovered && !disabled
      ? 1 + Math.sin(clock.getElapsedTime() * 5 + index) * 0.03
      : 1;
    const nextScale = targetScale * pulse;

    visualRef.current.scale.x = THREE.MathUtils.lerp(
      visualRef.current.scale.x,
      nextScale,
      0.14,
    );
    visualRef.current.scale.y = THREE.MathUtils.lerp(
      visualRef.current.scale.y,
      nextScale,
      0.14,
    );
    visualRef.current.scale.z = THREE.MathUtils.lerp(
      visualRef.current.scale.z,
      nextScale,
      0.14,
    );
  });

  useEffect(() => {
    if (!disabled) return;
    setHovered(false);
    document.body.style.cursor = "default";
  }, [disabled]);

  const handlePointerEnter = () => {
    if (disabled) return;
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerLeave = () => {
    setHovered(false);
    document.body.style.cursor = "default";
  };

  return (
    <group ref={groupRef} position={page.buttonOffset}>
      <group ref={tiltRef}>
        <group
          ref={visualRef}
          onClick={() => {
            if (disabled) return;
            onClick(page);
          }}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          {modelPath ? (
            <LoadedButtonAsset modelPath={modelPath} />
          ) : (
            <mesh castShadow receiveShadow>
              <capsuleGeometry args={[0.34, 0.92, 10, 18]} />
              <meshPhysicalMaterial
                color={hovered && !disabled ? "#eef4ff" : "#d1d4df"}
                metalness={0.98}
                roughness={hovered && !disabled ? 0.04 : 0.08}
                clearcoat={1}
                clearcoatRoughness={0.04}
                envMapIntensity={1.9}
                emissive={hovered && !disabled ? "#405d7f" : "#000000"}
                emissiveIntensity={hovered && !disabled ? 0.5 : 0}
                transparent
                opacity={opacity}
              />
            </mesh>
          )}
        </group>
        <Text
          position={[0, -0.88, 0]}
          fontSize={0.18}
          color={hovered && !disabled ? "#ffffff" : "#d7dee9"}
          anchorX="center"
          anchorY="top"
          maxWidth={2.5}
          textAlign="center"
          fillOpacity={opacity}
        >
          {page.label}
        </Text>
      </group>
    </group>
  );
}
