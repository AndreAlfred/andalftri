import * as THREE from "three";

// CRT wake states for the medallion screens (master plan Task 29 + 2026-07-11
// revision). Each section_0N_screen gets a CanvasTexture emissiveMap. On site
// load every screen boots in a staggered cascade with a tube-TV blink-on
// (bright flash -> irregular hot horizontal line at mid-screen growing wide ->
// the line swells vertically until the band fills the tube -> picture fades
// in) and then STAYS ON (Andrew 2026-07-11: screens come on at load; also
// solves touch devices — labels are always visible, one tap navigates).
// Hover = a brightness lift on that section, not an on/off toggle.
//
// TEXT SAFE BOXES: the screens are irregular blobs and the per-section UVs
// cover the whole plate's bounding square (including skirt hidden under the
// chrome), so naive centered text gets cut off by the aperture shape. The
// boxes below are the largest rectangle inscribed in each section's actual
// ring aperture (10mm inside the chrome wall), computed from the live Blender
// geometry by personal-site-medallion/scripts/compute_screen_safe_boxes.py
// (2026-07-10, GLB v1). Regenerate + repaste after any plate/ring change.
// Units: canvas UV (0..1, v DOWN — glTF convention, texture.flipY=false).
// The blink line/band intentionally draw across the FULL canvas: pixels
// outside the aperture sit under the chrome, so the effect reads edge-to-edge.
const SAFE_BOXES: Record<number, { u0: number; v0: number; u1: number; v1: number }> = {
  1: { u0: 0.1938, v0: 0.1625, u1: 0.6375, v1: 0.5562 },
  2: { u0: 0.2062, v0: 0.3125, u1: 0.6812, v1: 0.675 },
  3: { u0: 0.15, v0: 0.4188, u1: 0.8812, v1: 0.7062 },
  4: { u0: 0.1625, v0: 0.3375, u1: 0.825, v1: 0.6 },
  5: { u0: 0.2562, v0: 0.3063, u1: 0.7, v1: 0.7813 },
  6: { u0: 0.375, v0: 0.2187, u1: 0.5937, v1: 0.7375 },
  7: { u0: 0.1063, v0: 0.2875, u1: 0.6, v1: 0.7062 },
};
const DEFAULT_BOX = { u0: 0.25, v0: 0.3, u1: 0.75, v1: 0.7 };

const SIZE = 256;
// blink-on sub-phase boundaries (seconds within the "blink" phase)
const T_FLASH = 0.1;
const T_LINE = 0.34;
const T_BAND = 0.62;
const BLINK_SECONDS = T_BAND;
const TEXT_FADE_IN = 0.28;
const FADE_SECONDS = 0.45;
const TEXT_INTENSITY = 1.0;

type Phase = "off" | "blink" | "text" | "fade";

interface TextLayout {
  lines: string[];
  fontSize: number;
  font: string;
}

interface SectionWake {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  materials: THREE.MeshStandardMaterial[];
  label: string;
  fontStack: string;
  box: { x: number; y: number; w: number; h: number }; // canvas px
  layout: TextLayout | null;
  phase: Phase;
  t: number;
  jitterSeed: number;
  bootDelay: number | null;
  hoverLevel: number;
  redrawAccum: number;
}

function makeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable for screen wake canvas");
  return { canvas, ctx };
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// 2026-07-19 (Andrew): the display names ON the CRT screens carry the site's
// display faces — Bruno Ace for oeuvre sections, Zen Dots for influence
// sections. The old rounded-sans stack stays as the fallback tail (canvas 2d
// silently falls back if a family isn't loaded yet — see the font-load
// invalidation in ScreenWakeManager.attach). Both faces ship a single 400
// weight, so labels draw at normal weight: a synthetic canvas "bold" would
// smear these wide display faces.
const FALLBACK_STACK = '"Arial Rounded MT Bold", "Trebuchet MS", "Verdana", sans-serif';
export const OEUVRE_SCREEN_FONT = `"Bruno Ace", ${FALLBACK_STACK}`;
export const INFLUENCE_SCREEN_FONT = `"Zen Dots", ${FALLBACK_STACK}`;

/** Wrap + size the label so every line fits the safe box. */
function fitTextToBox(
  ctx: CanvasRenderingContext2D,
  label: string,
  box: { w: number; h: number },
  fontStack: string,
): TextLayout {
  const words = label.split(" ");
  for (let fontSize = 46; fontSize >= 14; fontSize -= 2) {
    const font = `${fontSize}px ${fontStack}`;
    ctx.font = font;
    const lines: string[] = [];
    let line = "";
    let widest = 0;
    for (const w of words) {
      const cand = line ? `${line} ${w}` : w;
      if (ctx.measureText(cand).width <= box.w || !line) {
        line = cand;
      } else {
        widest = Math.max(widest, ctx.measureText(line).width);
        lines.push(line);
        line = w;
      }
    }
    if (line) {
      widest = Math.max(widest, ctx.measureText(line).width);
      lines.push(line);
    }
    const lineHeight = fontSize * 1.14;
    if (widest <= box.w && lines.length * lineHeight <= box.h) {
      return { lines, fontSize, font };
    }
  }
  return { lines: [label], fontSize: 14, font: `14px ${fontStack}` };
}

function drawScanlines(ctx: CanvasRenderingContext2D, alpha: number) {
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  for (let y = 0; y < SIZE; y += 3) {
    ctx.fillRect(0, y, SIZE, 1);
  }
}

function drawGrain(ctx: CanvasRenderingContext2D, count: number) {
  for (let i = 0; i < count; i += 1) {
    const bright = Math.random() > 0.5;
    ctx.fillStyle = bright ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.22)";
    ctx.fillRect(Math.random() * SIZE, Math.random() * SIZE, 1 + Math.random() * 2, 1);
  }
}

function drawText(s: SectionWake, dim: number) {
  const { ctx, box } = s;
  if (!s.label) {
    // unassigned section: dormant test-pattern dot so hover still reads "alive"
    ctx.fillStyle = `rgba(150, 220, 255, ${0.5 * dim})`;
    ctx.beginPath();
    ctx.arc(box.x + box.w / 2, box.y + box.h / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (!s.layout) s.layout = fitTextToBox(ctx, s.label, box, s.fontStack);
  const { lines, fontSize, font } = s.layout;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const lineHeight = fontSize * 1.14;
  const cxp = box.x + box.w / 2;
  const y0 = box.y + box.h / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((ln, i) => {
    const y = y0 + i * lineHeight;
    ctx.lineWidth = Math.max(6, fontSize * 0.22);
    ctx.strokeStyle = `rgba(20, 90, 130, ${0.9 * dim})`;
    ctx.strokeText(ln, cxp, y);
    ctx.fillStyle = `rgba(225, 250, 255, ${dim})`;
    ctx.fillText(ln, cxp, y);
  });
}

/** The hot horizontal turn-on line: irregular, jittering, growing outward. */
function drawBlinkLine(ctx: CanvasRenderingContext2D, spread: number, seed: number, heat: number) {
  const yC = SIZE / 2;
  const halfW = (0.12 + 0.88 * easeOutCubic(spread)) * (SIZE / 2);
  const x0 = SIZE / 2 - halfW;
  const x1 = SIZE / 2 + halfW;
  // soft bloom
  const bloom = ctx.createLinearGradient(0, yC - 12, 0, yC + 12);
  bloom.addColorStop(0, "rgba(120, 190, 255, 0)");
  bloom.addColorStop(0.5, `rgba(160, 215, 255, ${0.5 * heat})`);
  bloom.addColorStop(1, "rgba(120, 190, 255, 0)");
  ctx.fillStyle = bloom;
  ctx.fillRect(x0, yC - 12, x1 - x0, 24);
  // jittery core, drawn in short segments with irregular vertical offsets
  for (let x = x0; x < x1; x += 3) {
    const jag = Math.sin(x * 0.71 + seed * 13.7) + Math.sin(x * 2.3 + seed * 5.1);
    const yo = jag * (1.6 * (1 - spread) + 0.4);
    ctx.fillStyle = `rgba(235, 250, 255, ${heat})`;
    ctx.fillRect(x, yC + yo - 1, 3, 2);
  }
  // hot irregular tips
  ctx.fillStyle = `rgba(255, 255, 255, ${heat})`;
  ctx.fillRect(x0 - 2 + Math.random() * 3, yC - 1.5, 4, 3);
  ctx.fillRect(x1 - 2 + Math.random() * 3, yC - 1.5, 4, 3);
  // center hot spot
  ctx.fillRect(SIZE / 2 - 3, yC - 2, 6, 4);
}

export class ScreenWakeManager {
  private sections = new Map<number, SectionWake>();

  attach(
    section: number,
    screenMeshes: THREE.Mesh[],
    label: string,
    fontStack: string = OEUVRE_SCREEN_FONT,
  ) {
    if (this.sections.has(section) || screenMeshes.length === 0) return;
    const { canvas, ctx } = makeCanvas();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false; // glTF UV convention
    texture.colorSpace = THREE.SRGBColorSpace;
    const materials: THREE.MeshStandardMaterial[] = [];
    screenMeshes.forEach((mesh) => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        if (!("emissive" in m)) return;
        const std = m as THREE.MeshStandardMaterial;
        std.emissive.set("#ffffff"); // map carries the color
        std.emissiveMap = texture;
        std.emissiveIntensity = 0;
        std.needsUpdate = true;
        materials.push(std);
      });
    });
    const b = SAFE_BOXES[section] ?? DEFAULT_BOX;
    this.sections.set(section, {
      canvas,
      ctx,
      texture,
      materials,
      label,
      fontStack,
      box: {
        x: b.u0 * SIZE,
        y: b.v0 * SIZE,
        w: (b.u1 - b.u0) * SIZE,
        h: (b.v1 - b.v0) * SIZE,
      },
      layout: null,
      phase: "off",
      t: 0,
      jitterSeed: Math.random() * 100,
      bootDelay: null,
      hoverLevel: 0,
      redrawAccum: 0,
    });

    // Webfonts load lazily on first DOM use, and at boot no panel has rendered
    // yet — without this explicit load the canvas would draw the fallback sans
    // forever. When the face arrives, dropping `layout` makes the text phase's
    // 30Hz redraw re-measure and re-render with the real font. Sized query
    // (16px) is arbitrary: FontFaceSet.load keys on family, not size.
    if (typeof document !== "undefined" && "fonts" in document) {
      const primaryFamily = fontStack.split(",")[0]?.trim();
      if (primaryFamily) {
        document.fonts
          .load(`16px ${primaryFamily}`)
          .then((faces) => {
            const s = this.sections.get(section);
            if (s && faces.length > 0) s.layout = null;
          })
          .catch(() => {
            // fallback stack already covers a failed load
          });
      }
    }
  }

  /** Kick off the staggered boot cascade (sections light in numeric order). */
  bootAll(initialDelay: number, stagger: number) {
    let idx = 0;
    [...this.sections.keys()].sort((a, b) => a - b).forEach((sec) => {
      const s = this.sections.get(sec);
      if (s && s.phase === "off" && s.bootDelay === null) {
        s.bootDelay = initialDelay + idx * stagger;
        idx += 1;
      }
    });
  }

  /** Advance all wake state machines. hovered lifts that section's brightness;
   *  globalDim follows hub visibility so screens fade with the receding hub. */
  update(delta: number, hovered: number | null, globalDim = 1) {
    this.sections.forEach((s, sec) => {
      s.hoverLevel = THREE.MathUtils.lerp(
        s.hoverLevel, hovered === sec ? 1 : 0, 0.14);
      if (s.phase === "off") {
        if (s.bootDelay === null) return;
        s.bootDelay -= delta;
        if (s.bootDelay > 0) return;
        s.bootDelay = null;
        s.phase = "blink";
        s.t = 0;
        s.jitterSeed = Math.random() * 100;
      }
      s.t += delta;
      const { ctx } = s;

      if (s.phase === "blink") {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, SIZE, SIZE);
        if (s.t < T_FLASH) {
          // 1) full-tube flash
          const k = s.t / T_FLASH;
          ctx.fillStyle = `rgba(225, 240, 255, ${0.65 + 0.35 * k})`;
          ctx.fillRect(0, 0, SIZE, SIZE);
          this.apply(s, 1.9 * globalDim);
        } else if (s.t < T_LINE) {
          // 2) irregular horizontal line growing outward at mid-screen
          const p = (s.t - T_FLASH) / (T_LINE - T_FLASH);
          drawBlinkLine(ctx, p, s.jitterSeed, 1);
          this.apply(s, 1.5 * globalDim);
        } else {
          // 3) the line swells vertically until the band fills the tube
          const p = (s.t - T_LINE) / (T_BAND - T_LINE);
          const halfH = 2 + easeInOutCubic(p) * (SIZE / 2 - 2);
          const yC = SIZE / 2;
          const grad = ctx.createLinearGradient(0, yC - halfH, 0, yC + halfH);
          grad.addColorStop(0, "rgba(140, 200, 255, 0)");
          grad.addColorStop(0.5, `rgba(215, 240, 255, ${0.9 - 0.45 * p})`);
          grad.addColorStop(1, "rgba(140, 200, 255, 0)");
          ctx.fillStyle = grad;
          // irregular top/bottom edges: per-column jitter, calming as it grows
          for (let x = 0; x < SIZE; x += 4) {
            const jag =
              (Math.sin(x * 0.9 + s.jitterSeed * 7.7) +
                Math.sin(x * 0.23 + s.jitterSeed)) *
              3 *
              (1 - p);
            ctx.fillRect(x, yC - halfH + jag, 4, (halfH + jag) * 2);
          }
          drawBlinkLine(ctx, 1, s.jitterSeed, 0.9 - 0.6 * p);
          drawScanlines(ctx, 0.18);
          this.apply(s, (1.5 - 0.5 * p) * globalDim);
        }
        if (s.t >= BLINK_SECONDS) {
          s.phase = "text";
          s.t = 0;
        }
      } else if (s.phase === "text") {
        // 4) picture fades in, then stays on (grain/flicker at ~30Hz)
        s.redrawAccum += delta;
        const fadeIn = Math.min(s.t / TEXT_FADE_IN, 1);
        if (s.redrawAccum >= 1 / 30 || fadeIn < 1) {
          s.redrawAccum = 0;
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, SIZE, SIZE);
          if (fadeIn < 1) {
            const grad = ctx.createLinearGradient(0, 0, 0, SIZE);
            grad.addColorStop(0, "rgba(150, 205, 255, 0)");
            grad.addColorStop(0.5, `rgba(190, 225, 255, ${0.35 * (1 - fadeIn)})`);
            grad.addColorStop(1, "rgba(150, 205, 255, 0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, SIZE, SIZE);
          }
          drawText(s, fadeIn);
          drawGrain(ctx, 200 + Math.floor(140 * s.hoverLevel));
          drawScanlines(ctx, 0.22);
          s.texture.needsUpdate = true;
        }
        const flicker = 1 + Math.sin(s.t * 46) * 0.03 + Math.sin(s.t * 7.3) * 0.02;
        this.applyIntensity(
          s, TEXT_INTENSITY * flicker * (1 + 0.45 * s.hoverLevel) * globalDim);
      } else if (s.phase === "fade") {
        const k = 1 - Math.min(s.t / FADE_SECONDS, 1);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, SIZE, SIZE);
        drawText(s, k);
        drawGrain(ctx, Math.floor(120 * k));
        drawScanlines(ctx, 0.22 * k);
        this.apply(s, TEXT_INTENSITY * k * globalDim);
        if (s.t >= FADE_SECONDS) {
          s.phase = "off";
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, SIZE, SIZE);
          this.apply(s, 0);
        }
      }
    });
  }

  private apply(s: SectionWake, intensity: number) {
    s.texture.needsUpdate = true;
    this.applyIntensity(s, intensity);
  }

  private applyIntensity(s: SectionWake, intensity: number) {
    s.materials.forEach((m) => {
      m.emissiveIntensity = intensity;
    });
  }

  dispose() {
    this.sections.forEach((s) => {
      s.materials.forEach((m) => {
        m.emissiveMap = null;
        m.emissiveIntensity = 0;
        m.needsUpdate = true;
      });
      s.texture.dispose();
    });
    this.sections.clear();
  }
}
