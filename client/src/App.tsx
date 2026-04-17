import { Canvas } from "@react-three/fiber";
import { Environment } from "@/scene/Environment";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a" }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <Environment />
      </Canvas>
    </div>
  );
}
