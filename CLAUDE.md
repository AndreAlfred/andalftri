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
- The public/default path uses the approved procedural Studio rig with ACES at
  exposure `0.92`. `?tone=agx` retains the matched-exposure comparison, while
  `?lighting=legacy` restores the complete city-HDR/direct-light rig with ACES at
  exposure `1`.
- Pixel-level WebGL judgment requires Andrew's real browser. Automated/in-app capture
  can verify loading, DOM, routes, console, and builds but not final 3D appearance.
  The sandbox does have a working WebGL2 *context* — what it lacks is an advancing
  frame loop — so hand-written shaders can and should be compile-checked headlessly
  before pushing (see `lessons.md` entry A for how).

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
5. `lessons.md` for transferable failure history — read it before acting, and treat a
   relevant entry as binding unless a dated decision above supersedes it.
6. `docs/plans/website-build-spec.md` for original intent only; it is historically
   useful but predates the medallion and helmet direction.

When documents conflict, do not silently choose the oldest plan. Verify against current
code and dated decisions, then record the reconciliation.

## Commands

```bash
pnpm dev       # Vite development server at http://localhost:3001
pnpm test      # Dependency-free Node tests for pure scene contracts
pnpm check     # TypeScript validation
pnpm build     # TypeScript project build + production Vite bundle
```

Pure scene contracts have dependency-free Node tests under `tests/`; visual WebGL
behavior still requires real-browser review. Use `/?force-3d=1` to bypass the
weak-device fallback and `/?classic=1` for the legacy hub. Lighting defaults to
Studio ACES; use `?tone=agx` for the matched-exposure comparison,
`?lighting=legacy` for the temporary complete rollback, and `?screens=dormant`
for the black-glass diagnostic.

## Required workflow

1. Read the relevant current docs and inspect `git status` before editing. Preserve
   unrelated user changes. **Read `lessons.md` first** — it is short by design and
   exists to stop you repeating a wrong turn someone already paid for.
2. Keep changes scoped and reversible. Do not edit the GLB binary by hand; geometry
   and source-material changes belong in the Blender medallion project.
3. For visual work, capture a deterministic baseline and compare the same camera/state
   after each isolated change. A build passing is not visual approval.
4. After any code change, run `pnpm test`, `pnpm check`, and `pnpm build`. **Every
   hand-written `ShaderMaterial` also gets a headless compile check before pushing** —
   the sandbox has a working WebGL2 context (only the frame loop is missing), so
   create a bare `canvas.getContext("webgl2")`, prepend the three.js boilerplate the
   shader references, and `compileShader`. A GLSL typo otherwise ships to Andrew as a
   black screen, and none of the three commands above can see it. (Promoted from
   `lessons.md` entry A, 2026-07-22 — applied twice, now standing.)
5. Commit and push completed repository work so Vercel updates:

```bash
git add -A
git commit -m "brief description of what changed"
git push
```

6. Tell Andrew that the live site should update in roughly 30 seconds. Update planning
   logs only when the task calls for it; do not add repetitive blocker noise. **A
   blocked task is a routing problem, not a stopping problem** — if the next queued
   item is gated, move to the next unblocked one and say so, rather than logging the
   same blocker again. (Promoted from `lessons.md` entry C, 2026-07-21.)
7. **Curate `lessons.md` before the session ends** — append what was learned, rewrite
   entries the session disproved, delete what went stale, and promote anything now
   permanent up into this file. See below. This is a required step, not a courtesy.

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
- Any pointer-interactive GLB beyond a few thousand triangles is wrapped in Drei's
  `<Bvh firstHitOnly>` from the start. three.js raycasts brute-force per triangle on
  every `pointermove`; the medallion is ~349k tris. (Promoted from `lessons.md` entry
  B, 2026-07-21 — held since 2026-07-10.)

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
- Keep `lessons.md` current — see the section below, which is a required part of every
  session rather than an optional flourish.

## Lessons discipline

`lessons.md` is a living document, not an archive. **Expect to write to it several
times in a session** — when a wrong turn is diagnosed, when an assumption is
disproved, when a fix reveals why the first attempt failed. Writing it once at the
end, from memory, produces vague entries; writing it at the moment of the discovery
produces useful ones. Reach for it mid-session.

**Read it first.** Before editing, before proposing, before deciding an approach. Its
whole value is stopping you from re-paying a cost someone already paid.

**What earns an entry.** Only transferable things: a wrong turn, a near-miss, a
disproved assumption, or a surprising constraint. The lesson has to be usable by a
future session working on something *else*. Not "task N is done", not a changelog of
what shipped — that belongs in `docs/plans/progress-log.md`. If the entry could not
change a future decision, it does not belong here.

Each entry: date, what happened, root cause, and the lesson stated as a rule.

**The four operations, all expected regularly:**

- **Append** — a new wrong turn, written when it happens.
- **Rewrite** — when a later session proves an entry was wrong, incomplete, or
  overstated, edit the entry rather than adding a contradicting one. Two entries that
  disagree are worse than none, because the reader cannot tell which is current.
  Entry A's 2026-07-21 refinement is the model: the original claim was too pessimistic,
  so it gained a correction in place.
- **Prune** — delete entries that have gone stale: the code they describe is gone, the
  library changed, the trap is now structurally impossible. A long lessons file stops
  being read, and an unread lessons file has no value. Prefer a short, true file.
- **Promote** — when a lesson has held across several sessions, or is really a standing
  rule rather than a war story, move it into this file (usually **Working philosophy**
  or **Hard constraints**) and delete it from `lessons.md`. Promotion is the goal;
  `lessons.md` is the proving ground, `CLAUDE.md` is what graduated.

**Where things go, when it is ambiguous:**

| Content | File |
|---|---|
| A transferable wrong turn or disproved assumption | `lessons.md` |
| A rule that now always applies | `CLAUDE.md` |
| What happened this session, what shipped, what is deferred | `docs/plans/progress-log.md` |
| Queue and task status | `docs/plans/master-build-plan.md` |
| Andrew's dated direction | `docs/plans/feedback.md` |

The failure mode to avoid is a lessons file that only grows. If a session appends
without ever rewriting, pruning, or promoting, the curation step was skipped.
