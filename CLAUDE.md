# andrewalfredtrimble — Claude Code Instructions

## What This Is
Andrew's personal portfolio site. 3D interactive experience built with React Three Fiber.
Y2K / frutiger aero / early internet aesthetic. The site IS the portfolio piece.

## Build Agent
Alfred builds this site from specs in `docs/plans/`. Always check `docs/plans/website-build-spec.md`
and `docs/plans/progress-log.md` before making changes — they are the source of truth.

## Hard Constraints
- **All visual art must be human-made.** No AI-generated images, 3D models, illustrations, or decorative assets.
- Procedural code effects (shaders, particles, post-processing) are fine — code, not art.
- Placeholder geometry (cubes, spheres, text meshes) is fine — will be swapped for Blender assets.
- No Google Analytics (use Plausible or Vercel Analytics)

## Design Direction
Y2K / frutiger aero / early internet aesthetic. NOT modern minimalism. NOT corporate.
Think: early 2000s video game menu screen, glossy chromed buttons, moiré effects, wireframe void.
The homepage is an interactive 3D scene, not a traditional web page.

## Stack
- **React 19** + Vite + TypeScript + Tailwind CSS v4 + pnpm
- **React Three Fiber** + **Drei** for 3D scene
- **Three.js** underneath
- GLB models from Blender for hero assets

## Architecture
- 3D scene with free camera navigation between page locations
- 2D HTML content panels overlaid via Drei `<Html>`
- Camera fly-to transitions between pages
- Mouse-reactive idle animations (lemniscate rotation, parallax, proximity tilt, hover glow)
- Mobile: scroll-driven interaction + gyro progressive enhancement
- Static fallback for weak devices
- Loading screen while 3D assets load

## Pages
**Oeuvre (projects):** Heaven & Nature, See Canto, Music
**Influences (taste):** Contact, Reading List, Inspirations

## Content
- Hardcoded data files initially (`client/src/data/`)
- Content pipeline for collections in a later phase
- Each page has main content + director's commentary (for the "@" HUD)

## Routes
- `/` — menu hub (3D scene home)
- `/heaven-and-nature` — project page
- `/see-canto` — project page
- `/music` — project page (oeuvre)
- `/contact` — contact info
- `/reading-list` — curated reading
- `/inspirations` — influences/taste

## The Medallion (hero asset — ARRIVED 2026-07-09)
The nav hub's real asset landed: `client/public/models/medallion.glb` — a
seven-section warm-metal medallion whose black-glass screens are the nav targets
(it replaces the placeholder `@` + capsule buttons once approved).
- **Integration contract: `docs/medallion-glb-notes.md`** (mesh naming
  `section_0N_screen`/`_bezel`, orientation, per-section UV convention,
  emission wiring for the CRT-wake states, placeholder-material caveat).
- **Current state:** `client/src/scene/MedallionHub.tsx` behind the
  `/?medallion=1` preview flag; Phase 8 of `docs/plans/master-build-plan.md`
  is the integration work queue.
- **The asset is built in Blender at
  `~/clawd/CLI-Anything/blender/projects/personal-site-medallion/`** — its
  `CLAUDE.md` (how to work the live-Blender loop), `plan.md` (state/roadmap),
  and `lessons.md` (wrong-turn log) are the source of truth for geometry and
  materials. Geometry/material change requests go THERE; re-export is one run
  of that project's `scripts/export_glb.py`. Never edit the GLB binary here.
- The medallion is human-directed Blender art (satisfies the Hard Constraints).

## "Needs Artist" Items (Do Not Build Without Assets)
Still pending final models: floating mediums (clouds, bubbles, etc.).
Use placeholder geometry until Andrew provides GLB files. The swap should require only changing an import path, not restructuring code.

## Audio (Future Phase)
Audio will be commissioned from friends. Don't build audio infrastructure yet.
When the time comes, it will include: ambient sound, UI hover/click sounds, transition whooshes.
Muted by default, user opts in.
