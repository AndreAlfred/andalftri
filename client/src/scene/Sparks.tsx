import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Near-field neon sparks (2026-07-21, Andrew's "magic space").
 *
 * The rare, coloured half of the brief: fluorescent sparks with trails that
 * appear sparsely and randomly at close range, with real depth variation. The
 * starfield stays near-white precisely so these can carry all the colour — an
 * event, not a colour scheme.
 *
 * COST: one draw call, zero per-frame CPU. There is no spawner. Each spark's
 * whole life cycle is a `fract()` of `uTime` against its own period, so the
 * "random appearance" is the shader reading pre-baked per-spark constants. A
 * CPU spawner would have re-uploaded a buffer on every spawn; this never
 * touches the buffer after construction.
 *
 * Apparent randomness comes from mutually-incommensurable periods rather than
 * from an RNG: with periods spread over an irrational-ish range, the sparks
 * never resynchronise into a visible pattern, which is what a shared period
 * would do within seconds.
 */

const TAIL_POINTS = 8;
const SHELL_INNER = 6;
const SHELL_OUTER = 22;
/** Fraction of its period a spark is actually alive. Low = rare. */
const DUTY = 0.13;

// Fluorescent, deliberately saturated — these are the only saturated things in
// the void, which is what makes them read as events.
const NEON = ["#3ef0ff", "#ff5ae0", "#7cff9a", "#ffc94a", "#b07bff"];

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
    gl_PointSize = aSize * tailFade * uPixelRatio * (260.0 / max(-mvPosition.z, 0.001));
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if (vAlpha <= 0.001) discard;
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = dot(d, d);
    if (r > 0.25) discard;
    // Hot core, soft halo — additive blending turns the overlap into the
    // fluorescent bloom Andrew asked for without any postprocessing pass.
    float core = smoothstep(0.25, 0.0, r);
    float glow = smoothstep(0.25, 0.02, r);
    float alpha = (core * 0.55 + glow * 0.65) * vAlpha;
    gl_FragColor = vec4(vColor * alpha, alpha);
  }
`;

function buildGeometry(count: number) {
  const total = count * TAIL_POINTS;
  const positions = new Float32Array(total * 3);
  const origins = new Float32Array(total * 3);
  const dirs = new Float32Array(total * 3);
  const colors = new Float32Array(total * 3);
  const tails = new Float32Array(total);
  const periods = new Float32Array(total);
  const offsets = new Float32Array(total);
  const sizes = new Float32Array(total);
  const travels = new Float32Array(total);

  const color = new THREE.Color();

  for (let s = 0; s < count; s += 1) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const planar = Math.sqrt(1 - u * u);
    const radius = SHELL_INNER + Math.random() * (SHELL_OUTER - SHELL_INNER);
    const ox = planar * Math.cos(theta) * radius;
    const oy = planar * Math.sin(theta) * radius;
    const oz = u * radius;

    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    ).normalize();

    color.set(NEON[Math.floor(Math.random() * NEON.length)]);
    // Spread the periods widely and never share one. A common period would
    // have every spark fire in lockstep, which reads as a machine, not magic.
    const period = 7 + Math.random() * 26;
    const offset = Math.random() * period;
    const size = 2.2 + Math.random() * 3.6;
    const travel = 2.5 + Math.random() * 7;

    for (let t = 0; t < TAIL_POINTS; t += 1) {
      const i = s * TAIL_POINTS + t;
      origins[i * 3] = ox;
      origins[i * 3 + 1] = oy;
      origins[i * 3 + 2] = oz;
      // `position` is unused by the shader but three.js requires the attribute
      // to exist to compute draw range; seed it with the origin.
      positions[i * 3] = ox;
      positions[i * 3 + 1] = oy;
      positions[i * 3 + 2] = oz;
      dirs[i * 3] = dir.x;
      dirs[i * 3 + 1] = dir.y;
      dirs[i * 3 + 2] = dir.z;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      tails[i] = t / (TAIL_POINTS - 1);
      periods[i] = period;
      offsets[i] = offset;
      sizes[i] = size;
      travels[i] = travel;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aOrigin", new THREE.BufferAttribute(origins, 3));
  geometry.setAttribute("aDir", new THREE.BufferAttribute(dirs, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aTail", new THREE.BufferAttribute(tails, 1));
  geometry.setAttribute("aPeriod", new THREE.BufferAttribute(periods, 1));
  geometry.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aTravel", new THREE.BufferAttribute(travels, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SHELL_OUTER + 10);
  return geometry;
}

export const Sparks = memo(function Sparks({ count, reducedMotion = false }: SparksProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => buildGeometry(count), [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: typeof window === "undefined" ? 1 : window.devicePixelRatio },
      uDuty: { value: DUTY },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value += delta;
  });

  // Streaks of light darting across the periphery are exactly what reduced
  // motion is asking to be spared, so this layer goes away entirely rather
  // than slowing down. It is decoration; the field is composition.
  if (count <= 0 || reducedMotion) return null;

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
