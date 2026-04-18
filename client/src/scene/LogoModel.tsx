import { Text } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { useLemniscate } from "@/hooks/useLemniscate";

interface LogoModelProps {
  modelPath?: string;
}

export function LogoModel({ modelPath }: LogoModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  void modelPath;
  useLemniscate(groupRef, {
    yAmplitude: 15,
    xAmplitude: 4,
    speed: 0.3,
  });

  return (
    <group ref={groupRef}>
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
        />
      </Text>
    </group>
  );
}
