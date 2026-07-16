# andrewalfredtrimble — Agent Instructions

<!-- Keep this file byte-for-byte synchronized with its twin: AGENTS.md / CLAUDE.md. -->

## Purpose

Andrew Alfred Trimble's personal portfolio is an authored, spatial 3D experience built
with React Three Fiber. It is both a public repository of Andrew's taste and cultural
curation and a portfolio/resume for projects developed through human-directed AI
collaboration. The frame is itself a portfolio piece.

Live site: https://andalftri.vercel.app. Pushes to `main` auto-deploy through Vercel
in roughly 30 seconds.

## Visual hierarchy

Use this as the subtraction rule for all visual decisions:

> A warm mineral artifact in a dark void, seen through a cool smart-helmet AR
> display. Y2K appears through CRT behavior and interface motion.

The warm medallion/object world is primary. Cool cyan/aurora belongs to the helmet
edge, telemetry, screen, and hover layers. Frutiger aero, Halo, medieval insignia,
cyberpunk, and early-internet references are supporting vocabularies, not equal motifs
to stack indiscriminately. Avoid modern corporate minimalism.

## Current state

- The default homepage hub is `client/public/models/medallion.glb`, a seven-section
  Blender artifact rendered by `client/src/scene/MedallionHub.tsx`.
  `/?classic=1` restores the old placeholder `@` + capsule hub.
- The shipped GLB is v2: baked mineral base color, roughness, and normal maps on the
  body/core; reflection-driven chrome and black clearcoat glass; stable named
  `section_0N_screen` / `section_0N_bezel` meshes.
- The smart-helmet HUD, boot sequence, CRT screen cascade, camera navigation, content
  panels, static weak-device fallback, and History API routes are integrated.
- Lighting is still the generic April rig: city HDRI, flat ambient fill, white direct
  lights, default ACES exposure, and no active shadow map or postprocessing. The
  approved next design effort is the documented lighting session.
- Pixel-level WebGL judgment requires Andrew's real browser. Automated/in-app capture
  can verify loading, DOM, routes, console, and builds but not final 3D appearance.

## Current product decisions

- **Publication-copy gate:** Do not finalize, polish, or invent public-facing copy
  until the website is ready to publish and the parallel projects have matured.
  Existing scaffold copy may remain during construction. Never invent Andrew's taste,
  commentary, project claims, contact details, or launch status.
- **Cottage:** Medallion section 6 is reserved for **Cottage**, an early-phase
  project. The current code still maps section 6 to `null`; route/data/interaction
  behavior must be designed and implemented as a separate task. Do not invent Cottage
  copy while it is unpublished.
- **Contact:** Contact is a dedicated utility destination, not an influence. Its
  current `group: "influences"` value is a legacy data/rendering bucket. Flag it for
  taxonomy cleanup when the navigation/content model is revised; do not describe
  Contact as evidence of taste.
- **World-building:** Task 33 still needs Andrew's per-page direction. Do not invent
  six spatial worlds autonomously.
- **Audio:** Audio remains a future commissioned phase. Do not build audio
  infrastructure until assets and direction exist.
- Autonomous/nightly agents are appropriate for bounded mechanical tasks. Lighting,
  world-building, visual art direction, and experience-complete signoff require
  Andrew's eyes.

## Source-of-truth order

Before changing the project, reconcile sources in this order:

1. Andrew's latest direct instruction.
2. Latest dated direction in `docs/plans/feedback.md`.
3. Current queue/status in `docs/plans/master-build-plan.md` and
   `docs/plans/progress-log.md`.
4. Feature contracts such as `docs/medallion-glb-notes.md` and focused session docs
   such as `docs/plans/lighting-session.md`.
5. `lessons.md` for transferable failure history.
6. `docs/plans/website-build-spec.md` for original intent only; it is historically
   useful but predates the medallion and helmet direction.

When documents conflict, do not silently choose the oldest plan. Verify against current
code and dated decisions, then record the reconciliation.

## Commands

```bash
pnpm dev       # Vite development server at http://localhost:3001
pnpm check     # TypeScript validation
pnpm build     # TypeScript project build + production Vite bundle
```

There is currently no automated test script. Use `/?force-3d=1` to bypass the
weak-device fallback during real-browser 3D review and `/?classic=1` for the legacy
hub comparison.

## Required workflow

1. Read the relevant current docs and inspect `git status` before editing. Preserve
   unrelated user changes.
2. Keep changes scoped and reversible. Do not edit the GLB binary by hand; geometry
   and source-material changes belong in the Blender medallion project.
3. For visual work, capture a deterministic baseline and compare the same camera/state
   after each isolated change. A build passing is not visual approval.
4. After any code change, run `pnpm check` and `pnpm build`.
5. Commit and push completed repository work so Vercel updates:

```bash
git add -A
git commit -m "brief description of what changed"
git push
```

6. Tell Andrew that the live site should update in roughly 30 seconds. Update planning
   logs only when the task calls for it; do not add repetitive blocker noise.

## Stack

- React 19, Vite, TypeScript, Tailwind CSS v4, pnpm
- React Three Fiber, Drei, Three.js
- Zustand camera state
- glTF/GLB assets exported from Blender
- Vercel deployment

## Architecture

- `client/src/App.tsx`: capability gate, loading state, lazy 3D experience
- `client/src/components/SceneExperience.tsx`: Canvas, routing, panels, helmet/HUD
- `client/src/scene/`: environment, medallion hub, camera, screen wake, legacy hub
- `client/src/hud/`: persistent helmet frame, commentary, cyberspace navigation
- `client/src/panels/`: shared HTML panel shell plus project/influence layouts
- `client/src/data/`: routes, section map, projects, influences, commentary
- `client/src/hooks/`: camera and interaction behaviors
- `client/src/index.css`: global, panel, helmet, and HUD styling
- `client/public/models/`: browser-delivered GLB assets
- `docs/plans/`: dated product direction, queue, progress, and session plans

The 3D scene uses scripted camera fly-to transitions between fixed page targets. Drei
`<Html>` panels appear when the camera arrives. The helmet/HUD is a screen-space React
layer outside the Canvas. Weak devices receive `StaticFallback`.

## Medallion contract

The source project is
`~/clawd/CLI-Anything/blender/projects/personal-site-medallion/`. Its active
`CLAUDE.md`, `AGENTS.md`, `plan.md`, and `lessons.md` govern geometry,
materials, checkpoints, baking, and export. The website contract is
`docs/medallion-glb-notes.md`.

Never rename contract meshes or change their UV convention casually. A geometry or
aperture change also requires regenerating the per-screen safe boxes used by
`client/src/scene/screenWake.ts`.

## Hard constraints

- All visual art must be human-made. Do not generate images, illustrations, decorative
  assets, or 3D models with AI.
- Procedural code effects—lighting, shaders, particles, postprocessing, CSS textures,
  and patterns—are allowed.
- Placeholder primitives and text geometry are allowed until Andrew supplies
  human-made assets.
- No Google Analytics. Use Plausible or Vercel Analytics if analytics are introduced.
- Do not add major dependencies or expensive postprocessing without checking bundle
  and real-device performance.

## Working philosophy from lessons.md

- **Measure, don't eyeball.** Separate observed facts from inference and use the
  metric that matches what the visitor actually sees.
- **One variable and one slice first.** Isolate light contributions or prototype one
  section before propagating a change.
- **Reversible by default.** Preserve clean checkpoints and a crash-proof rollback
  path before destructive or batch work.
- **Two failed tunings means stop.** Instrument the mechanism instead of continuing
  to adjust constants blindly.
- **Protect optical surfaces.** Highlight behavior can reveal geometry/normal problems
  that roughness values hide; diagnose those before compensating with lighting.
- **Visual work needs human signoff.** Do not call lighting, motion, composition, or
  world-building complete without Andrew reviewing a real-browser render.
- Append genuinely transferable wrong turns to `lessons.md`; promote recurring rules
  here and prune repetitive/stale entries.
