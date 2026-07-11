# medallion.glb — integration notes (v1, exported 2026-07-09)

`client/public/models/medallion.glb` — the seven-section medallion hero object,
exported from the Blender project (`~/clawd/CLI-Anything/blender/projects/
personal-site-medallion/`, working file `medallion_wellington_v6_animprep_wip.blend`).

## File facts
- 888 KB, glTF 2.0 binary, **KHR_draco_mesh_compression** (drei's `useGLTF`
  decodes Draco out of the box) + **KHR_materials_clearcoat** (three.js supports
  it natively on MeshPhysicalMaterial).
- ~349k tris total. Root node `medallion_parent` (rotation baked so the face
  normal points **+Z** — toward the default camera). 17 child meshes.

## Node / mesh naming contract (raycast + animation targets)
- `section_0N_screen` (N=1..7) — the black glass slab of each section.
- `section_0N_bezel` (N=1..7) — the chrome ring around it.
- `shield_body` — the terrain body. `medallion_core`, `medallion_at` — center.
- Section numbering matches Andrew's map: 7=left big, 1=top-left, 2=top-mid
  small, 3=right-top big, 4=right-mid, 5=bottom big, 6=bottom-left.
- There are NO `_rim` objects (retired pre-export). If any older plan/code
  mentions `section_0N_rim`, use `section_0N_bezel` instead.

## Animation intent (spec §2/§3/§8.6/§13)
1. Lemniscate drift (idle) + mouse parallax / proximity tilt — transform the
   root; the 8° aesthetic tilt from the stills is NOT baked in, apply it here.
2. Per-section hover glow — raycast against `section_0N_bezel` + `_screen`.
3. TV-wake per screen (white-noise flash → grainy bubble text): each screen has
   **planar per-section UVs** (square-normalized: u,v ∈ ~[0,1] over the
   section's bounding square, no aspect distortion; screen center ≈ (0.5,0.5)).
   Drive an emissive map / shader per mesh. The glass material ships with
   emission black + strength 0 — clone the material per screen (three.js:
   `mesh.material = mesh.material.clone()`) and animate `emissive` /
   `emissiveMap` / custom shader per section.

## Materials: v2 baked (2026-07-11)
`shield_body` and `medallion_core` now carry BAKED textures from the procedural
Cycles graphs (the mineral striations are back): baseColor + roughness +
tangent normal maps, WebP inside the GLB (EXT_texture_webp — three.js loads it
natively), metallic factor 0.72 (measured from the source graph). Chrome and
glass remain flat placeholders — their look is reflection-driven and already
reads correctly. Bake pipeline: Blender project `scripts/bake_body_textures.py`
(headless: `Blender --background <blend> --python scripts/bake_body_textures.py`)
then `scripts/export_glb.py`. File grew 888KB -> ~3.1MB.

## Material caveat (placeholder PBR) [HISTORICAL — superseded by v2 above]
The Blender look is procedural Cycles (mineral body, warm metal) which glTF
can't carry; this v1 ships flat PBR approximations:
- `EXPORT_body_warm_metal` (copper-brown, metallic .85, rough .45)
- `EXPORT_accent_chrome` (metallic 1.0, rough .15), `EXPORT_at_chrome`
- `EXPORT_screen_black_glass` (near-black, rough .08, clearcoat 1.0)
A texture-baked v2 (base color/roughness/normal maps for the body's mineral
strata) is planned Blender-side; the node names and UV contract will not change,
so integration work is safe to build now.
