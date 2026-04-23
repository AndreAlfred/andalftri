import { Center, Clone, Text, useGLTF } from "@react-three/drei";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useLemniscate } from "@/hooks/useLemniscate";

interface LogoModelProps {
  modelPath?: string;
  opacity?: number;
}

const LoadedLogoAsset = memo(function LoadedLogoAsset({
  modelPath,
  opacity,
}: {
  modelPath: string;
  opacity: number;
}) {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      child.castShadow = true;
      child.receiveShadow = true;

      if (Array.isArray(child.material)) {
        child.material = child.material.map((material) => material.clone());
      } else if (child.material) {
        child.material = child.material.clone();
      }
    });

    return clone;
  }, [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const materials = Array.isArray(child.material)
        ? child.material
        : child.material
          ? [child.material]
          : [];

      materials.forEach((material) => {
        material.transparent = true;
        material.opacity = opacity;
      });
    });
  }, [clonedScene, opacity]);

  return (
    <Center>
      <group scale={2.35}>
        <Clone object={clonedScene} />
      </group>
    </Center>
  );
});

export const LogoModel = memo(function LogoModel({
  modelPath,
  opacity = 1,
}: LogoModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useLemniscate(groupRef, {
    yAmplitude: 15,
    xAmplitude: 4,
    speed: 0.3,
  });

  return (
    <group ref={groupRef}>
      {modelPath ? (
        <LoadedLogoAsset modelPath={modelPath} opacity={opacity} />
      ) : (
        <Text
          position={[0, 0, 0]}
          fontSize={3.2}
          maxWidth={4}
          anchorX="center"
          anchorY="middle"
          characters="@"
        >
          @
          <meshPhysicalMaterial
            color="#d7d7dc"
            metalness={0.95}
            roughness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={1.6}
            transparent
            opacity={opacity}
          />
        </Text>
      )}
    </group>
  );
});
