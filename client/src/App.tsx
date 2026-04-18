import { Environment as DreiEnvironment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@/scene/Environment";
import { MenuHub } from "@/scene/MenuHub";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a" }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <Environment />
        <DreiEnvironment preset="city" />
        <MenuHub />
      </Canvas>
    </div>
  );
}
