import { useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  buildSparkBuffers,
  DUTY,
  FAR_RADIUS,
  MAX_SPARKS,
  TAIL_POINTS,
} from "./sparkGeometry";

/**
 * Near-field neon sparks — the rare, coloured half of Andrew's "magic space".
 *
 * The generator (`sparkGeometry.ts`) owns the depth, speed, size and grouping
 * rules and their reasoning. This file owns the GPU side: the life cycle, the
 * screen-space size cap, and the look of the head.
 *
 * COST: one draw call, zero per-frame CPU. There is no spawner — each spark's
 * whole life cycle is a `fract()` of `uTime` against its own period, so the
 * "random appearance" is the shader reading pre-baked constants. Nothing writes
 * to the buffer after construction, which is also what stops a quality-tier
 * change from resetting every spark's phase (see the starfield's `MAX_STARS`
 * note — same lesson, same fix: never tie a procedural seed to a quality knob).
 */

/**
 * Hard ceiling on a spark's rendered diameter, as a fraction of viewport
 * height.
 *
 * Andrew: "none of them should be as large as even the 'contact' screen." A
 * medallion section subtends roughly 15% of viewport height, so 3.5% leaves a
 * wide margin and still allows a near spark to read as genuinely closer. This
 * is expressed against the viewport rather than in pixels so the rule holds on
 * any window size — the previous version had no ceiling at all and a near spark
 * could project to ~500px.
 */
const MAX_SIZE_VIEWPORT_FRACTION = 0.035;

interface SparksProps {
  count: number;
  reducedMotion?: boolean;
}

const VERTEX = /* glsl */ `
  attribute vec3 aOrigin;
  attribute vec3 aDir;
  attribute vec3 aColor;
  attribute float aTail;
  attribute float aPeriod;
  attribute float aOffset;
  attribute float aSize;
  attribute float aTravel;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uDuty;
  uniform float uMaxSize;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;

    float cycle = fract((uTime + aOffset) / aPeriod);
    float alive = step(cycle, uDuty);
    float life = cycle / uDuty;

    // The tail lags the head along the same path, so the trail bends with the
    // trajectory instead of being a straight smear behind a moving dot.
    float lag = aTail * 0.22;
    float travelled = max(life - lag, 0.0) * aTravel;
    vec3 pos = aOrigin + aDir * travelled;

    // Strike fast, decay slow — the asymmetry is what makes it read as a spark
    // rather than a pulsing dot.
    float envelope = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.35, 1.0, life));
    float tailFade = pow(1.0 - aTail, 1.6);
    vAlpha = alive * envelope * tailFade * step(0.0, life - lag);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Perspective sizing is kept here — unlike the stars, these ARE nearby
    // objects with a real size, so a closer one genuinely should look bigger.
    // But it is capped: uncapped, this term is what turned near sparks into the
    // coloured blobs Andrew reported.
    float projected = aSize * uPixelRatio * (150.0 / max(-mvPosition.z, 0.001));
    gl_PointSize = min(projected, uMaxSize) * tailFade;
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.001) discard;
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = length(d);
    if (r > 0.5) discard;

    // WHITE-HOT CORE, COLOURED HALO. Andrew: "the glowing head looks a little
    // strange on some of the colours." It did, and the reason is that the head
    // was tinted at full saturation and then additively blended, so a saturated
    // hue clipped one or two channels and went muddy while the others blew out.
    // Real incandescence desaturates toward white as it gets hotter, so pushing
    // the core to white is both the physical answer and the one that reads
    // consistently across every hue in the palette.
    float core = 1.0 - smoothstep(0.0, 0.22, r);
    float halo = 1.0 - smoothstep(0.1, 0.5, r);
    vec3 tint = mix(vColor, vec3(1.0), core * 0.85);
    float alpha = (core * 0.5 + halo * 0.5) * vAlpha;
    gl_FragColor = vec4(tint * alpha, alpha);
  }
`;

function buildGeometry() {
  const b = buildSparkBuffers(MAX_SPARKS);
  const geometry = new THREE.BufferGeometry();
  // `position` is unused by the shader — the vertex stage builds the position
  // from aOrigin/aDir/aTravel — but three.js needs the attribute present to
  // derive the draw count. Seed it with the origin.
  geometry.setAttribute("position", new THREE.BufferAttribute(b.origins.slice(), 3));
  geometry.setAttribute("aOrigin", new THREE.BufferAttribute(b.origins, 3));
  geometry.setAttribute("aDir", new THREE.BufferAttribute(b.dirs, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(b.colors, 3));
  geometry.setAttribute("aTail", new THREE.BufferAttribute(b.tails, 1));
  geometry.setAttribute("aPeriod", new THREE.BufferAttribute(b.periods, 1));
  geometry.setAttribute("aOffset", new THREE.BufferAttribute(b.offsets, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(b.sizes, 1));
  geometry.setAttribute("aTravel", new THREE.BufferAttribute(b.travels, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), FAR_RADIUS * 2);
  return geometry;
}

export const Sparks = memo(function Sparks({ count, reducedMotion = false }: SparksProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => buildGeometry(), []);

  const pixelRatio = useThree((state) => state.gl.getPixelRatio());
  const viewportHeight = useThree((state) => state.size.height);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uDuty: { value: DUTY },
      uMaxSize: { value: 12 },
    }),
    // Deliberately built once: uTime must survive a resize or a DPR change, or
    // every spark's phase would reset (the bug Andrew saw as "the magic stopped").
    // The two size uniforms are kept current by the effect below instead.
    [],
  );

  useEffect(() => {
    uniforms.uPixelRatio.value = pixelRatio;
    // gl_PointSize is in device pixels, so the viewport cap converts through
    // the pixel ratio too.
    uniforms.uMaxSize.value = viewportHeight * MAX_SIZE_VIEWPORT_FRACTION * pixelRatio;
  }, [uniforms, pixelRatio, viewportHeight]);

  useEffect(() => {
    const visible = reducedMotion ? 0 : Math.min(Math.max(count, 0), MAX_SPARKS);
    geometry.setDrawRange(0, visible * TAIL_POINTS);
  }, [geometry, count, reducedMotion]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value += delta;
  });

  // Reduced motion and the count are both handled by the draw range above
  // rather than by unmounting: darting streaks of light are exactly what
  // reduced motion asks to be spared, but tearing the object down would mean a
  // machine that recovered could never get its sparks back.
  return (
    <points
      geometry={geometry}
      frustumCulled={false}
      // Draw after the artifact. The medallion now returns to the OPAQUE pass at
      // full opacity (MedallionHub), which fixes the occlusion properly, but its
      // visibility lerp is asymptotic — there is a ~1.3s window after a panel
      // closes where it is still transparent. renderOrder covers that window.
      renderOrder={10}
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        transparent
        // depthTest so solid geometry occludes a spark behind it; NO depthWrite,
        // so sparks never occlude each other — the 8 tail points of one spark
        // would z-fight, and overlapping sparks would stop summing, which is
        // what produces the fluorescent bloom without a postprocessing pass.
        depthTest
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
});
