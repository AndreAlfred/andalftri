import { Environment as DreiEnvironment, Lightformer } from "@react-three/drei";
import { memo } from "react";
import { STUDIO_LIGHTING } from "./lightingConfig";

export const ArtifactLighting = memo(function ArtifactLighting() {
  const { direct, environment } = STUDIO_LIGHTING;

  return (
    <>
      <ambientLight color={direct.fill.color} intensity={direct.fill.intensity} />
      <directionalLight
        color={direct.key.color}
        intensity={direct.key.intensity}
        position={direct.key.position}
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
