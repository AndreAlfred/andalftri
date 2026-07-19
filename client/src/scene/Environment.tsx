import { Grid } from "@react-three/drei";
import { memo } from "react";
import { ArtifactLighting } from "./ArtifactLighting";
import { STUDIO_LIGHTING, type LightingMode } from "./lightingConfig";

interface EnvironmentProps {
  lightingMode?: LightingMode;
  keyLightPosition?: [number, number, number];
}

export const Environment = memo(function Environment({
  lightingMode = "legacy",
  keyLightPosition,
}: EnvironmentProps) {
  const studio = lightingMode === "studio";
  const background = studio ? STUDIO_LIGHTING.background : "#1a1a1a";
  const fog = studio
    ? STUDIO_LIGHTING.fog
    : { color: "#1a1a1a", near: 15, far: 40 };
  const grid = studio
    ? STUDIO_LIGHTING.grid
    : {
        cellColor: "#404040",
        sectionColor: "#808080",
        fadeDistance: 30,
        fadeStrength: 1,
      };

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[fog.color, fog.near, fog.far]} />
      <Grid
        position={[0, -3, 0]}
        args={[100, 100]}
        cellSize={1}
        cellColor={grid.cellColor}
        sectionSize={5}
        sectionColor={grid.sectionColor}
        fadeDistance={grid.fadeDistance}
        fadeStrength={grid.fadeStrength}
        infiniteGrid
      />
      {studio ? (
        <ArtifactLighting keyLightPosition={keyLightPosition} />
      ) : (
        <>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          <pointLight position={[-5, 5, -5]} intensity={0.3} />
        </>
      )}
    </>
  );
});
