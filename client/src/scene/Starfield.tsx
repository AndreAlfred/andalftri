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
 * the pulse is gone, point size is CLAMPED so a near star can never bloom into
 * a soft disc, and the edge falloff is tight so a point reads as a hard dot
 * with one antialiased pixel instead of a soft gradient blob.
 *
 * COST: one draw call, one buffer, and now genuinely zero per-frame work of any
 * kind — there is no longer even a uniform to update.
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

    // Perspective sizing still sells the parallax during the fly-to
    // transitions, but it is CLAMPED. Unclamped, a star at the inner shell
    // radius was drawn several times larger than one at the outer radius, and a
    // big soft point is the definition of a bokeh circle. A star should read as
    // a point of light at any distance — brightness carries the depth cue here,
    // not diameter.
    float projected = aSize * uPixelRatio * (260.0 / max(-mvPosition.z, 0.001));
    gl_PointSize = clamp(projected, 1.0 * uPixelRatio, 2.6 * uPixelRatio);
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

  const uniforms = useMemo(
    () => ({
      uPixelRatio: { value: typeof window === "undefined" ? 1 : window.devicePixelRatio },
    }),
    [],
  );

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
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
