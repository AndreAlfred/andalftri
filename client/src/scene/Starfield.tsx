import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";

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
 * COST: one draw call, one buffer, zero per-frame CPU. The twinkle runs
 * entirely in the shader off a single `uTime` uniform — no attribute is ever
 * rewritten after construction. This is the whole reason the atmosphere is
 * affordable next to what the 2026-07-21 perf pass gave back.
 */

// Deliberately outside the scene fog (near 12, far 34), which would otherwise
// erase the field entirely. A custom ShaderMaterial opts out of fog by default;
// that default is load-bearing here rather than incidental.
const SHELL_INNER = 22;
const SHELL_OUTER = 78;

interface StarfieldProps {
  count: number;
  reducedMotion?: boolean;
}

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aRate;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;

    // Two incommensurable rates so the field never falls into a visible
    // collective rhythm — the giveaway that a starfield is a loop.
    float slow = sin(uTime * aRate + aPhase);
    float fast = sin(uTime * aRate * 2.37 + aPhase * 1.7);
    vTwinkle = 0.62 + 0.26 * slow + 0.12 * fast;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // Perspective-correct: nearer stars are genuinely larger, which is what
    // sells the parallax during the camera fly-to transitions.
    gl_PointSize = aSize * uPixelRatio * (260.0 / max(-mvPosition.z, 0.001));
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    // Soft round falloff. A hard-edged square point reads as a dead pixel, and
    // at these sizes the difference is most of the effect.
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = dot(d, d);
    if (r > 0.25) discard;
    float alpha = smoothstep(0.25, 0.0, r) * vTwinkle;
    gl_FragColor = vec4(vColor * alpha, alpha);
  }
`;

function buildGeometry(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const rates = new Float32Array(count);

  const cool = new THREE.Color("#b9d4ff");
  const warm = new THREE.Color("#ffdcb4");
  const white = new THREE.Color("#ffffff");
  const tint = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    // Uniform on the sphere: acos-distributed polar angle, not a naive uniform
    // one, which would visibly cluster the field at the poles.
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const planar = Math.sqrt(1 - u * u);
    const radius = SHELL_INNER + Math.random() * (SHELL_OUTER - SHELL_INNER);

    positions[i * 3] = planar * Math.cos(theta) * radius;
    positions[i * 3 + 1] = planar * Math.sin(theta) * radius;
    positions[i * 3 + 2] = u * radius;

    // Temperature drift: cool <- white -> warm, biased toward white so the
    // tinted stars read as occasional character rather than a colour scheme.
    const temperature = Math.random() * 2 - 1;
    tint.copy(white).lerp(temperature < 0 ? cool : warm, Math.abs(temperature) ** 1.6);
    // A handful of bright stars against many faint ones. Uniform brightness
    // reads as noise; a steep falloff reads as a sky.
    const luminance = 0.3 + Math.random() ** 2.2 * 0.7;
    colors[i * 3] = tint.r * luminance;
    colors[i * 3 + 1] = tint.g * luminance;
    colors[i * 3 + 2] = tint.b * luminance;

    sizes[i] = 0.8 + Math.random() ** 3 * 3.4;
    phases[i] = Math.random() * Math.PI * 2;
    rates[i] = 0.25 + Math.random() * 0.85;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aRate", new THREE.BufferAttribute(rates, 1));
  // The shell is fixed and centred; skip the per-frame bounding-sphere work and
  // the frustum test that would cull the field the moment the camera turns.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SHELL_OUTER);
  return geometry;
}

export const Starfield = memo(function Starfield({
  count,
  reducedMotion = false,
}: StarfieldProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => buildGeometry(count), [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: typeof window === "undefined" ? 1 : window.devicePixelRatio },
    }),
    [],
  );

  useFrame((_, delta) => {
    // Reduced motion parks the twinkle rather than removing the stars — the
    // field is composition, the twinkle is the animation.
    if (reducedMotion || !materialRef.current) return;
    materialRef.current.uniforms.uTime.value += delta;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
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
