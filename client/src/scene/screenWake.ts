import * as THREE from "three";

// CRT wake states for the medallion screens (master plan Task 29).
// Each section_0N_screen gets a CanvasTexture emissiveMap. Hovering a section
// "wakes" its screen: a short white-noise flash, then grainy bubble text with
// scanlines; unhovering fades it back to dormant black.
//
// The screens have planar, square-normalized per-section UVs (u,v ≈ 0..1 over
// the section's bounding square — see docs/medallion-glb-notes.md), so one
// 256² canvas per section maps cleanly. glTF UV convention: texture.flipY must
// stay false. If text renders mirrored/upside-down in a real browser, flip via
// ctx.translate/scale in drawText — one-line fix, noted here because this was
// authored without a GPU to verify against (lessons.md entry A).

const SIZE = 256;
const FLASH_SECONDS = 0.3;
const FADE_SECONDS = 0.45;
const TEXT_INTENSITY = 1.0;
const FLASH_INTENSITY = 1.6;

type Phase = "off" | "flash" | "text" | "fade";

interface SectionWake {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  materials: THREE.MeshStandardMaterial[];
  label: string;
  phase: Phase;
  t: number; // seconds in current phase
}

function makeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable for screen wake canvas");
  return { canvas, ctx };
}

function drawNoise(ctx: CanvasRenderingContext2D, brightness: number) {
  const img = ctx.createImageData(SIZE, SIZE);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 255 * brightness);
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
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

function drawBubbleText(ctx: CanvasRenderingContext2D, label: string, dim: number) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, SIZE, SIZE);
  if (!label) {
    // unassigned section: dormant test-pattern dot so hover still reads "alive"
    ctx.fillStyle = `rgba(150, 220, 255, ${0.5 * dim})`;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const words = label.split(" ");
  const lines: string[] = [];
  // greedy wrap at ~9 chars/line for the chunky bubble look
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > 9 && line) {
      lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);

  const fontSize = lines.length > 2 ? 40 : 48;
  ctx.font = `bold ${fontSize}px "Arial Rounded MT Bold", "Trebuchet MS", "Verdana", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const lineHeight = fontSize * 1.12;
  const y0 = SIZE / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((ln, i) => {
    const y = y0 + i * lineHeight;
    ctx.lineWidth = 10;
    ctx.strokeStyle = `rgba(20, 90, 130, ${0.9 * dim})`;
    ctx.strokeText(ln, SIZE / 2, y);
    ctx.fillStyle = `rgba(225, 250, 255, ${dim})`;
    ctx.fillText(ln, SIZE / 2, y);
  });
}

export class ScreenWakeManager {
  private sections = new Map<number, SectionWake>();

  attach(section: number, screenMeshes: THREE.Mesh[], label: string) {
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
    this.sections.set(section, {
      canvas,
      ctx,
      texture,
      materials,
      label,
      phase: "off",
      t: 0,
    });
  }

  /** Advance all wake state machines. hovered = section under the pointer (or null). */
  update(delta: number, hovered: number | null) {
    this.sections.forEach((s, sec) => {
      const wantAwake = hovered === sec;
      // transitions
      if (wantAwake && (s.phase === "off" || s.phase === "fade")) {
        s.phase = "flash";
        s.t = 0;
      } else if (!wantAwake && (s.phase === "flash" || s.phase === "text")) {
        s.phase = "fade";
        s.t = 0;
      }

      if (s.phase === "off") return;
      s.t += delta;

      if (s.phase === "flash") {
        drawNoise(s.ctx, 1.0);
        drawScanlines(s.ctx, 0.3);
        const k = Math.min(s.t / FLASH_SECONDS, 1);
        this.apply(s, FLASH_INTENSITY * (0.4 + 0.6 * k));
        if (s.t >= FLASH_SECONDS) {
          s.phase = "text";
          s.t = 0;
        }
      } else if (s.phase === "text") {
        drawBubbleText(s.ctx, s.label, 1);
        drawGrain(s.ctx, 260);
        drawScanlines(s.ctx, 0.22);
        // slight CRT flicker
        const flicker = 1 + Math.sin(s.t * 46) * 0.03 + Math.sin(s.t * 7.3) * 0.02;
        this.apply(s, TEXT_INTENSITY * flicker);
      } else if (s.phase === "fade") {
        const k = 1 - Math.min(s.t / FADE_SECONDS, 1);
        drawBubbleText(s.ctx, s.label, k);
        drawGrain(s.ctx, Math.floor(120 * k));
        drawScanlines(s.ctx, 0.22 * k);
        this.apply(s, TEXT_INTENSITY * k);
        if (s.t >= FADE_SECONDS) {
          s.phase = "off";
          s.ctx.fillStyle = "#000";
          s.ctx.fillRect(0, 0, SIZE, SIZE);
          this.apply(s, 0);
        }
      }
    });
  }

  private apply(s: SectionWake, intensity: number) {
    s.texture.needsUpdate = true;
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
