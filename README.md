# andalftri

Andrew Alfred Trimble's personal site: a spatial 3D portfolio built with React Three
Fiber. The homepage is a seven-section medallion, modeled in Blender and viewed through
a smart-helmet HUD. Each section's screen opens one page of projects or influences.

**Live:** https://andalftri.vercel.app. Pushes to `main` deploy through Vercel in about
30 seconds.

> Work in progress. Page copy is scaffolding until the site is ready to publish.

## Stack

- React 19, Vite, TypeScript, Tailwind CSS v4, pnpm
- React Three Fiber, Drei, three.js
- Zustand for camera state
- glTF/GLB assets exported from Blender (Draco-compressed)
- Vercel for hosting (SPA rewrites and immutable asset caching in `vercel.json`)

## Getting started

Requires Node `^22.18.0` or `>=23.6.0`, because the tests run TypeScript directly
through `node --test`.

```bash
pnpm install
pnpm dev       # http://localhost:3001
```

| Command      | What it does                                                   |
| ------------ | -------------------------------------------------------------- |
| `pnpm dev`   | Vite dev server on port 3001                                    |
| `pnpm test`  | Dependency-free Node tests for the pure scene contracts        |
| `pnpm check` | TypeScript type check                                          |
| `pnpm build` | Project build plus the production bundle in `dist/`            |

Run all of `test`, `check`, and `build` after every change. None of them can see a
broken GLSL shader, so hand-written `ShaderMaterial`s also need a headless WebGL2
compile check before pushing. `CLAUDE.md` and `lessons.md` (entry A) explain how.

## How it works

1. **Capability gate** (`client/src/App.tsx`): weak devices get `StaticFallback`.
   Everyone else gets the 3D scene, which is lazy-loaded behind a loading screen.
2. **Scene** (`client/src/components/SceneExperience.tsx`): the Canvas, routing,
   content panels, and the helmet/HUD layer.
3. **Medallion hub** (`client/src/scene/MedallionHub.tsx`): renders
   `client/public/models/medallion.glb`. Hovering a section lights its bezel.
   Clicking one wakes its CRT screen and flies the camera to that page.
4. **Panels** (`client/src/panels/`): Drei `<Html>` panels that appear when the camera
   arrives. Routes go through the History API, so deep links and the back button work.
5. **HUD** (`client/src/hud/`): the helmet frame, boot sequence, telemetry, and
   navigation. It is a screen-space React layer outside the Canvas.

```
client/
  public/models/     browser-delivered GLB assets
  src/
    components/      Canvas shell, loading screen, static fallback
    scene/           medallion, lighting, camera, starfield, screen wake, shaders
    hud/             helmet frame, boot lifecycle, commentary, navigation
    panels/          shared panel shell + project / influence / music layouts
    data/            routes, section map, projects, influences, commentary
    hooks/           camera, parallax, gyroscope, quality, interaction
    lib/             device capability, quality tiers, asset preloading
tests/               node --test suites for the pure logic above
docs/                GLB contract, plans, specs, progress log
```

## Preview flags

These are query-string switches for review and debugging. Visitors never see them.

| Flag                 | Effect                                                         |
| -------------------- | -------------------------------------------------------------- |
| `?force-3d=1`        | Skip the weak-device fallback                                  |
| `?lite=1` / `?view=lite` | Force the static fallback                                  |
| `?quality=low\|medium\|high` | Pin a quality tier instead of the adaptive monitor     |
| `?texcap=1024`       | Pin the texture size cap (power of two) to preview phone textures on desktop |
| `?perf=1`            | Show the performance readout                                   |
| `?diag=1`            | Run the diagnostic overlay                                     |
| `?classic=1`         | Swap in the legacy placeholder `@` + capsule hub               |
| `?tone=agx`          | AgX tone mapping at matched exposure (default is ACES 0.92)    |
| `?lighting=legacy`   | Restore the old city-HDR/direct-light rig                      |
| `?keylight=legacy` / `?keylight=x,y,z` | Compare or free-tune the key light position  |
| `?emblem=baked` / `?emblem=0.42[,2.2]` | Compare or tune the center emblem's roughness/env |
| `?screens=dormant`   | Black-glass diagnostic with the screens turned off             |
| `?grain=shader`      | Use the shader-based CRT grain                                 |

## The medallion asset

The GLB is exported from a separate Blender project at
`~/clawd/CLI-Anything/blender/projects/personal-site-medallion/`. Don't edit the binary
by hand. Mesh names (`section_0N_screen`, `section_0N_bezel`), the UV convention, and
the per-screen safe boxes in `client/src/scene/screenWake.ts` are a contract, documented
in [`docs/medallion-glb-notes.md`](docs/medallion-glb-notes.md). The model is about
349k triangles, so pointer raycasting goes through Drei's `<Bvh firstHitOnly>`.

## Constraints

- All visual art is human-made. No AI-generated images, illustrations, or 3D models.
  Procedural effects (shaders, lighting, particles, CSS patterns) are fine.
- Visual changes need a review in a real browser. The build passing doesn't count as
  approval.
- No Google Analytics. If analytics are added, use Plausible or Vercel Analytics.

## Docs

- [`CLAUDE.md`](CLAUDE.md): working instructions, product decisions, and the
  source-of-truth order for agents working in this repo
- [`lessons.md`](lessons.md): log of wrong turns and why they happened
- [`docs/plans/`](docs/plans/): feedback, build queue, progress log, and dated specs
