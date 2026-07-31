import * as THREE from "three";

/**
 * Cap resident texture resolution on memory-constrained devices (2026-07-30).
 *
 * Why this exists at all, given the GLB already uses `EXT_texture_webp`: WebP is
 * a TRANSPORT format. The 2.9 MB on the wire decodes to uncompressed RGBA the
 * moment it reaches the GPU, so the authored set costs ~63 MB resident, ~84 MB
 * once three builds mip chains. File size and GPU residency are different
 * budgets and one does not imply the other — see lessons.md entry P.
 *
 * Why runtime resampling rather than a second GLB or KTX2:
 *
 *   - A mobile GLB variant means a second asset to keep in sync with the Blender
 *     source, and the medallion contract (docs/medallion-glb-notes.md) makes
 *     that a cross-repo change rather than a website one.
 *   - KTX2/Basis is the technically correct answer — it stays compressed IN GPU
 *     memory (~4 MB, better than this) rather than merely being smaller. It
 *     costs a transcoder dependency and, more importantly, ETC1S degrades normal
 *     maps badly enough to need Andrew's eyes on the artifact. Priced, not
 *     adopted; see docs/plans/2026-07-30-mobile-performance-research.md.
 *
 * This route needs no new dependency, no new asset, ships nothing to desktop,
 * and is one constant away from being reverted.
 *
 * NOTE this only reduces GPU residency. Download size and decode time are
 * unchanged — the full-resolution image is still fetched and decoded before it
 * is resampled. That is the honest limit of doing it at runtime, and it is why
 * KTX2 remains the better long-term answer.
 */

const RESAMPLED = "__textureBudgetResampled";

type ResamplableImage = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

function imageSize(image: unknown): { width: number; height: number } | null {
  if (!image || typeof image !== "object") return null;
  const candidate = image as { width?: unknown; height?: unknown };
  if (typeof candidate.width !== "number" || typeof candidate.height !== "number") return null;
  if (candidate.width <= 0 || candidate.height <= 0) return null;
  return { width: candidate.width, height: candidate.height };
}

/**
 * Resample one texture's image in place, preserving the THREE.Texture identity.
 *
 * Replacing `.image` rather than constructing a new Texture matters: every
 * material in the cloned scene already points at this object, and the loader
 * cache hands the same instance to any future mount. Swapping the object would
 * mean rebinding all of them; swapping the pixels does not.
 */
function capTexture(texture: THREE.Texture, maxEdge: number): boolean {
  const flags = texture.userData as Record<string, unknown>;
  if (flags[RESAMPLED]) return false;

  const size = imageSize(texture.image);
  if (!size) return false;

  const longEdge = Math.max(size.width, size.height);
  // Only ever downscale. An authored map already at or below the cap is left
  // exactly as it is — this is a ceiling, not a target.
  if (longEdge <= maxEdge) {
    flags[RESAMPLED] = true;
    return false;
  }

  const scale = maxEdge / longEdge;
  const width = Math.max(1, Math.round(size.width * scale));
  const height = Math.max(1, Math.round(size.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(texture.image as ResamplableImage, 0, 0, width, height);

  const previous = texture.image;
  texture.image = canvas;
  texture.needsUpdate = true;
  flags[RESAMPLED] = true;

  // An ImageBitmap holds its own decoded buffer outside the JS heap, and GC will
  // not reclaim it promptly. Closing it is the difference between peaking at
  // old+new and settling at new.
  if (typeof ImageBitmap !== "undefined" && previous instanceof ImageBitmap) {
    previous.close();
  }

  return true;
}

const MAP_SLOTS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "emissiveMap",
  "aoMap",
  "clearcoatMap",
  "clearcoatNormalMap",
  "clearcoatRoughnessMap",
] as const;

export interface TextureBudgetResult {
  /** Textures actually resampled (already-small maps are not counted). */
  resampled: number;
  /** Rough GPU bytes reclaimed, including mip chains. */
  bytesSaved: number;
}

/**
 * Walk a loaded scene and cap every material texture to `maxEdge`.
 *
 * Must run BEFORE the scene first renders. Three uploads a texture lazily on
 * first use, so resampling during the same synchronous pass that prepares the
 * scene means the full-resolution image is never uploaded at all — which is the
 * entire point. Doing it in an effect after mount would upload the large version
 * first and then replace it, paying the peak we are trying to avoid.
 */
export function capSceneTextures(
  scene: THREE.Object3D,
  maxEdge: number,
): TextureBudgetResult {
  const result: TextureBudgetResult = { resampled: 0, bytesSaved: 0 };
  if (!Number.isFinite(maxEdge) || typeof document === "undefined") return result;

  const seen = new Set<THREE.Texture>();

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];

    materials.forEach((material) => {
      if (!material) return;
      const slots = material as unknown as Record<string, THREE.Texture | null | undefined>;

      MAP_SLOTS.forEach((slot) => {
        const texture = slots[slot];
        if (!texture || seen.has(texture)) return;
        seen.add(texture);

        const before = imageSize(texture.image);
        if (capTexture(texture, maxEdge)) {
          const after = imageSize(texture.image);
          if (before && after) {
            result.resampled += 1;
            // 4 bytes per texel, ×4/3 for the mip chain.
            const bytes = (w: number, h: number) => w * h * 4 * (4 / 3);
            result.bytesSaved +=
              bytes(before.width, before.height) - bytes(after.width, after.height);
          }
        }
      });
    });
  });

  return result;
}
