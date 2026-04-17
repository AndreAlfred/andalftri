import { Grid } from "@react-three/drei";

export function Environment() {
  return (
    <>
      <color attach="background" args={["#1a1a1a"]} />
      <fog attach="fog" args={["#1a1a1a", 15, 40]} />
      <Grid
        position={[0, -3, 0]}
        args={[100, 100]}
        cellSize={1}
        cellColor="#404040"
        sectionSize={5}
        sectionColor="#808080"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />
    </>
  );
}
