import { useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildStarBuffers, MAX_STARS, SHELL_OUTER } from "./starfieldGeometry";

/**
 * The deep field (2026-07-21, Andrew's "magic space").
 *
 * Andrew's palette call: "a few dots with slight shifts in light hue from plain
 * white, ranging from cooler to warmer." That restraint is doing real work —
 * `CLAUDE.md`'s hierarchy puts the warm mineral artifact first and reserves
 * saturated cyan for the helmet layer, so a colourful starfield would compete
 * with the medallion for the eye. Near-white with a faint temperature drift
 * reads as depth without ever becoming a subject.
 *
 * STARS ARE OPAQUE (Andrew, 2026-07-21 review). The first version twinkled by
 * animating alpha, and the nearer, larger points read as camera bokeh rather
 * than as stars — correctly, because that IS what defocused highlights do.
 * Real stars scintillate through atmosphere, and there is no atmosphere out
 * here, so the honest answer was also the cheap one: no alpha animation at all.
 * Three things changed together, since the bokeh read came from all of them —
 * the pulse is gone, point size is bounded so a near star can never bloom into
 * a soft disc, and the edge falloff is tight so a point reads as a hard dot
 * with one antialiased pixel instead of a soft gradient blob.
 *
 * 2026-07-22: the size BOUND turned out to be a clamp that 100% of the field
 * saturated, so every star rendered at an identical 2.6px — Andrew's "all the
 * stars are the same size". Sizing now comes from apparent magnitude with no
 * distance term at all; see `starfieldGeometry.ts`, which also carries the
 * colour physics (why there are no green stars, and why the field is nearly
 * white).
 *
 * COST: one draw call, one buffer, and genuinely zero per-frame work — the only
 * uniform changes when the renderer's pixel ratio does.
 */

interface StarfieldProps {
  count: number;
}

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;

  uniform float uPixelRatio;

  varying vec3 vColor;

  void main() {
    vColor = aColor;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // NO DISTANCE TERM. Stars are unresolved point sources: apparent size comes
    // from the point spread function, not from how far away they are. The
    // previous 260.0 / -mvPosition.z was the physics of a sphere, and because
    // it produced 2.7-50px it then had to be clamped -- which drove 100% of the
    // field to the clamp, so every star rendered at exactly the same size. That
    // is the bug Andrew reported. aSize now carries magnitude directly, and the
    // whole range it spans survives to the screen.
    gl_PointSize = aSize * uPixelRatio;
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;

  void main() {
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = length(d);
    // Opaque to the edge, then one antialiasing step. The previous smoothstep
    // ran the alpha down across the whole radius, which is exactly the soft
    // gradient that read as defocus. A star is a hard dot.
    float alpha = 1.0 - smoothstep(0.34, 0.5, r);
    if (alpha <= 0.0) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

function buildGeometry() {
  const { positions, colors, sizes } = buildStarBuffers(MAX_STARS);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  // The shell is fixed and centred; skip the per-frame bounding-sphere work and
  // the frustum test that would cull the field the moment the camera turns.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SHELL_OUTER);
  return geometry;
}

export const Starfield = memo(function Starfield({ count }: StarfieldProps) {
  // Built once, at full size, for the life of the scene. Nothing about the
  // quality tier is allowed to reach this call.
  const geometry = useMemo(() => buildGeometry(), []);
  const pointsRef = useRef<THREE.Points>(null);

  useEffect(() => {
    geometry.setDrawRange(0, Math.min(Math.max(count, 0), MAX_STARS));
  }, [geometry, count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  // The RENDERER's pixel ratio, not the window's. AdaptiveQuality drives the
  // renderer live down the DPR ladder, so `window.devicePixelRatio` (read once,
  // and 2.0 on any Retina Mac) could be well above the buffer actually in use —
  // stars rendered up to 167% larger than specified with nothing to correct it.
  const pixelRatio = useThree((state) => state.gl.getPixelRatio());

  const uniforms = useMemo(() => ({ uPixelRatio: { value: pixelRatio } }), [pixelRatio]);

  useEffect(() => {
    uniforms.uPixelRatio.value = pixelRatio;
  }, [uniforms, pixelRatio]);

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      frustumCulled={false}
      // Consistency with the sparks rather than correctness: the shell is at
      // radius 22-78 and the medallion at 4.4, so the field is always behind.
      renderOrder={-1}
    >
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
});
