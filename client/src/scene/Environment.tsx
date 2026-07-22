import { memo } from "react";
import { ArtifactLighting } from "./ArtifactLighting";
import { Sparks } from "./Sparks";
import { Starfield } from "./Starfield";
import { STUDIO_LIGHTING, type LightingMode } from "./lightingConfig";

interface EnvironmentProps {
  lightingMode?: LightingMode;
  keyLightPosition?: [number, number, number];
  starCount: number;
  sparkCount: number;
  reducedMotion?: boolean;
}

export const Environment = memo(function Environment({
  lightingMode = "legacy",
  keyLightPosition,
  starCount,
  sparkCount,
  reducedMotion = false,
}: EnvironmentProps) {
  const studio = lightingMode === "studio";
  const background = studio ? STUDIO_LIGHTING.background : "#1a1a1a";
  const fog = studio
    ? STUDIO_LIGHTING.fog
    : { color: "#1a1a1a", near: 15, far: 40 };

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[fog.color, fog.near, fog.far]} />
      {/* The infinite floor grid was removed 2026-07-21 (Andrew: "grid goes").
          A studio floor and deep space are different fictions, and the grid was
          the last thing anchoring the artifact to a room rather than a void.
          `STUDIO_LIGHTING.grid` is kept in the config as history for now. */}
      {/* The field has no animation at all now (stars are opaque and static),
          so reduced motion has nothing to suppress here. */}
      <Starfield count={starCount} />
      <Sparks count={sparkCount} reducedMotion={reducedMotion} />
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
