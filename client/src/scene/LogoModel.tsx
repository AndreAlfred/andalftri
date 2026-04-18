import { Text } from "@react-three/drei";

interface LogoModelProps {
  modelPath?: string;
}

export function LogoModel({ modelPath }: LogoModelProps) {
  void modelPath;

  return (
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
  );
}
