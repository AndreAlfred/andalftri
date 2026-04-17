# andrewalfredtrimble — Agent Instructions (Alfred)

## Project
Personal portfolio website for Andrew Alfred Trimble. A 3D interactive experience built with React Three Fiber — Y2K / frutiger aero / early internet aesthetic. The site is itself a portfolio piece.

## Live Site
The site auto-deploys via Vercel on every push to `main`.
Vercel rebuild takes ~30 seconds after push.

## IMPORTANT: After making ANY code changes
Always commit and push so the live site updates:
```
git add -A && git commit -m "brief description of what changed" && git push
```
Then tell the user the site will update in ~30 seconds.

## Stack
- React 19 + Vite + TypeScript + Tailwind CSS v4 + pnpm
- React Three Fiber (@react-three/fiber) + Drei (@react-three/drei)
- Three.js for 3D rendering
- glTF/GLB models (exported from Blender by Andrew)

## Key Files
- `client/src/App.tsx` — routing + top-level scene
- `client/src/scene/` — 3D scene components (MenuHub, CameraController, etc.)
- `client/src/pages/` — 2D content panels per page
- `client/src/components/` — shared UI components
- `client/src/data/` — page content data (projects, influences, commentary)
- `client/src/index.css` — CSS variables and global styles
- `client/public/models/` — GLB/glTF 3D assets

## Architecture
- **3D scene** with camera-based navigation between pages
- **2D HTML panels** (via Drei `<Html>`) overlay content on the 3D scene
- **Homepage** is a menu hub: central "@" logo with glossy buttons radiating outward
- **Page transitions** = camera fly-to animations in 3D space
- **Panel close** (X button) returns camera to menu hub
- **"@" HUD** = director's commentary overlay + cyberspace-style nav

## Pages (buttons on menu)
Two groups:
- **Oeuvre (projects):** Heaven & Nature, See Canto, Music
- **Influences (taste):** Contact, Reading List, Inspirations

## 3D Assets
Andrew creates 3D assets in Blender, exports as GLB. Use placeholder geometry (simple shapes, text meshes) until real assets arrive in `client/public/models/`. The codebase must support hot-swapping placeholders for real assets without refactoring.

## Hard Constraints
- **All visual art must be human-made.** No AI-generated images, illustrations, 3D models, or decorative assets. Procedural code effects (shaders, particles, post-processing) are fine — they're code, not art.
- CSS-only textures and patterns are fine (not "art").
- Placeholder geometry is fine (cubes, spheres, text meshes) — it will be replaced by human-made Blender assets.
