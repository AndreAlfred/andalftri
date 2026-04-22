import { Center, Clone, Text, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useLemniscate } from "@/hooks/useLemniscate";

interface LogoModelProps {
  modelPath?: string;
  opacity?: number;
}

function LoadedLogoAsset({ modelPath }: { modelPath: string }) {
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
    <Center>
      <group scale={2.35}>
        <Clone object={scene} />
      </group>
    </Center>
  );
}

export function LogoModel({ modelPath, opacity = 1 }: LogoModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useLemniscate(groupRef, {
    yAmplitude: 15,
    xAmplitude: 4,
    speed: 0.3,
  });

  return (
    <group ref={groupRef}>
      {modelPath ? (
        <LoadedLogoAsset modelPath={modelPath} />
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
}
