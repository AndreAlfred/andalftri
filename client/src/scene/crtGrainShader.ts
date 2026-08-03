import * as THREE from "three";

/**
 * Procedural CRT grain + scanlines in the material shader (2026-08-03).
 *
 * WHY: measured on Andrew's iPhone, the seven screens' `texImage2D` calls were
 * the entire remaining frame-time tail — and the canvas 2D drawing that feeds
 * them costs nothing (the `screens-off` ablation still performs every fillRect
 * and still scores a clean 17.0ms, because an unbound texture never uploads).
 * The text on those screens is STATIC. It is only the grain animation that
 * forces a re-upload seven times a rendered second, forever.
 *
 * So: upload the text once, and compute the grain and scanlines per-fragment.
 * That takes the steady-state upload count to zero rather than merely reducing
 * it, and as a side effect the grain can animate at full frame rate instead of
 * the tier's 8–20Hz.
 *
 * MATCHING THE EXISTING LOOK. This is an A/B (`?grain=shader`), so the shader
 * reproduces the canvas version's numbers rather than improving on them —
 * otherwise the comparison would be measuring a taste change and a performance
 * change at once and neither could be judged. From the canvas implementation:
 *
 *   scanlines  1 black row every 3, on a 256px canvas, composited at alpha 0.17
 *   grain      `count` rects/frame, half `rgba(255,255,255,0.16)`, half
 *              `rgba(0,0,0,0.22)`, each 1–3px wide and 1px tall, where
 *              count = 200 + 140 * hoverLevel
 *
 * A 1–3px-wide, 1px-tall rect averages two texels, so the shader hashes on
 * 2×1 texel cells: 128×256 = 32,768 cells, and `count/2` rects of ~1 cell each
 * gives a per-kind probability of count/65536. The noise is re-seeded from
 * `floor(time * grainHz)` so it steps at the SAME cadence the canvas did —
 * running it per-frame would look smoother and more like film grain, which is a
 * different artistic result, not a faster version of this one.
 *
 * ENTRY-J PROOFING. The July regression was a sampling failure: a 1px comb at a
 * 3px pitch, undersampled on an oblique surface, beating against the pixel grid
 * and rippling across the glyphs. Baked into a texture, the only defence is the
 * mip chain. Computed per-fragment we can do strictly better — `fwidth` gives
 * the projected footprint directly, so the scanline is box-filtered by its own
 * screen-space derivative and collapses to its exact average (1/3 duty) once a
 * pixel spans more than a period. Moiré is then structurally impossible rather
 * than merely filtered away. Note the derivative is taken on the CONTINUOUS row
 * coordinate, never on `fract` of it, which would spike at every wrap.
 */

export interface CrtGrainUniforms {
  uCrtTime: { value: number };
  /** Per-kind dot probability per 2x1 texel cell. */
  uCrtGrainDensity: { value: number };
  /** Scanline darkening, 0..1. Matches the canvas composite alpha. */
  uCrtScanline: { value: number };
  /** Noise re-seed rate; matches the tier's canvas redraw rate. */
  uCrtGrainHz: { value: number };
  /** Decorrelates the seven screens, which drew independent randoms before. */
  uCrtSeed: { value: number };
}

export function createCrtGrainUniforms(): CrtGrainUniforms {
  return {
    uCrtTime: { value: 0 },
    uCrtGrainDensity: { value: 200 / 65536 },
    uCrtScanline: { value: 0.17 },
    uCrtGrainHz: { value: 10 },
    uCrtSeed: { value: 0 },
  };
}

/** Canvas texel size the constants above are expressed in. */
const CRT_TEXELS = 256.0;
const SCANLINE_PERIOD = 3.0;

const PREAMBLE = /* glsl */ `
uniform float uCrtTime;
uniform float uCrtGrainDensity;
uniform float uCrtScanline;
uniform float uCrtGrainHz;
uniform float uCrtSeed;

// Hash without Sine (Dave Hoskins). Chosen over the usual fract(sin(dot(...)))
// because that one's precision collapses on mobile GPUs at mediump and produces
// visible banding rather than noise — which is exactly the platform this exists
// for.
float crtHash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

const EMISSIVE_FRAGMENT = /* glsl */ `
#ifdef USE_EMISSIVEMAP

  vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
  vec3 crtColor = emissiveColor.rgb;

  vec2 crtTexel = vEmissiveMapUv * ${CRT_TEXELS.toFixed(1)};

  // --- grain ---------------------------------------------------------------
  // 2x1 texel cells match the average footprint of the canvas version's rects.
  // The time term is floored so the field steps at the tier's rate instead of
  // resampling every frame.
  vec2 crtCell = vec2( floor( crtTexel.x * 0.5 ), floor( crtTexel.y ) );
  float crtStep = floor( uCrtTime * uCrtGrainHz );
  float crtNoise = crtHash21( crtCell + crtStep + uCrtSeed );

  float crtBright = step( 1.0 - uCrtGrainDensity, crtNoise );
  float crtDark = step( crtNoise, uCrtGrainDensity );

  // Source-over compositing, matching the 2D canvas: white at alpha 0.16 then
  // black at alpha 0.22.
  crtColor = mix( crtColor, vec3( 1.0 ), 0.16 * crtBright );
  crtColor *= 1.0 - 0.22 * crtDark;

  // --- scanlines -----------------------------------------------------------
  // fwidth is taken on the continuous row coordinate. Taking it on the fract()
  // below would spike at every wrap and punch a bright line through the comb.
  float crtRow = crtTexel.y / ${SCANLINE_PERIOD.toFixed(1)};
  float crtPhase = fract( crtRow );
  float crtWidth = max( fwidth( crtRow ), 1e-5 );
  float crtDuty = 1.0 / ${SCANLINE_PERIOD.toFixed(1)};

  float crtCoverage = 1.0 - smoothstep( crtDuty - crtWidth, crtDuty + crtWidth, crtPhase );
  // Once one pixel spans a whole period the comb is unresolvable; collapse to
  // its exact average so it dims uniformly instead of aliasing into moire.
  crtCoverage = mix( crtCoverage, crtDuty, clamp( crtWidth * 2.0, 0.0, 1.0 ) );

  crtColor *= 1.0 - uCrtScanline * crtCoverage;

  totalEmissiveRadiance *= crtColor;

#endif
`;

/**
 * Install the procedural grain on one screen material.
 *
 * `customProgramCacheKey` is a constant because every screen compiles the same
 * code — without it three would treat each material's patched shader as unique
 * and compile seven identical programs, which is a startup cost on exactly the
 * device this is meant to help.
 */
export function installCrtGrain(
  material: THREE.MeshStandardMaterial,
  uniforms: CrtGrainUniforms,
): void {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `${PREAMBLE}\nvoid main() {`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      EMISSIVE_FRAGMENT,
    );
  };
  material.customProgramCacheKey = () => "crt-procedural-grain-v1";
  material.needsUpdate = true;
}

/**
 * Grain density for a section's current hover level, matching the canvas
 * version's `200 + 140 * hoverLevel` dot count.
 *
 * Halved because the canvas splits its count between bright and dark passes,
 * and divided by the 32,768 cells in a 128x256 grid — expressed as the algebra
 * rather than a magic 0.00305 so the relationship to the canvas code survives.
 */
export function grainDensityFor(hoverLevel: number): number {
  const count = 200 + 140 * hoverLevel;
  return count / 2 / (CRT_TEXELS * 0.5 * CRT_TEXELS);
}
