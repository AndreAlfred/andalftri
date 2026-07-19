import { Environment as DreiEnvironment, Lightformer } from "@react-three/drei";
import { memo } from "react";
import { STUDIO_LIGHTING } from "./lightingConfig";

interface ArtifactLightingProps {
  // Defaults to the config constant; overridable for the `?keylight=` A/B
  // preview (2026-07-18 medallion-`@` glare check).
  keyLightPosition?: [number, number, number];
}

export const ArtifactLighting = memo(function ArtifactLighting({
  keyLightPosition = STUDIO_LIGHTING.direct.key.position,
}: ArtifactLightingProps) {
  const { direct, environment } = STUDIO_LIGHTING;

  return (
    <>
      <ambientLight color={direct.fill.color} intensity={direct.fill.intensity} />
      <directionalLight
        color={direct.key.color}
        intensity={direct.key.intensity}
        position={keyLightPosition}
      />
      <DreiEnvironment
        background={false}
        resolution={environment.resolution}
        frames={environment.frames}
      >
        {environment.cards.map((card) => (
          <Lightformer
            key={card.id}
            color={card.color}
            intensity={card.intensity}
            position={card.position}
            scale={[card.scale[0], card.scale[1], 1]}
            target={[0, 0, 0]}
          />
        ))}
      </DreiEnvironment>
    </>
  );
});
