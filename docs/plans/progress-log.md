# andrewalfredtrimble — Progress Log

Timestamped log of work sessions. Alfred writes an entry after each session.

---

## 2026-04-07

- Project scaffolded by Claude Code (Opus 4.6). Workspace created with identity files, design spec, and master build plan (24 tasks across 7 phases). Ready for Alfred to begin Task 1 (project initialization).

## 2026-04-16

- Completed Task 1. Initialized this folder as its own Git repo on `main`, confirmed the Vite + React + R3F + Tailwind scaffold, ran `pnpm check` and `pnpm build` successfully, and verified the dev server responds at `http://127.0.0.1:3001`.
- Tightened `.gitignore` to avoid committing local agent/runtime files (`.claude`, `.openclaw`, `memory`, `DREAMS.md`, and `tsconfig.tsbuildinfo`).

## 2026-04-17

- Synced the plan with Andrew's note that Task 2 is complete and recorded the live Vercel URL (`https://andalftri.vercel.app`) in `IDENTITY.md` and `TOOLS.md`.
- Completed Task 3 by replacing the starter torus knot with a dedicated `Environment` scene component that renders the dark wireframe void using Drei's infinite `Grid`, fog, and layered lighting.
- Added Task 4's placeholder menu hub: a large chrome `@` logo component with a future-facing `modelPath` prop, mounted at scene center via `MenuHub`, plus a city preset environment map for reflections.
- Ran `pnpm check` and `pnpm build` successfully. Build is clean; Vite still reports the existing non-blocking large-chunk warning for the main bundle.
- Completed Task 5 by adding a reusable `useLemniscate` hook and wiring it into the chrome `@` logo, so the menu centerpiece now drifts with a slow figure-eight idle motion instead of sitting static.
- Re-ran `pnpm check` and `pnpm build` after the animation work. Both passed cleanly; the only remaining build note is the same non-blocking Vite chunk-size warning.
- Completed Task 6 by adding a reusable `useMouseParallax` hook and applying it to the top-level `MenuHub` group, so the chrome `@` cluster now drifts gently with cursor movement instead of feeling pinned in place.
- Re-ran `pnpm check` and `pnpm build` after the parallax work. Both passed cleanly; the only remaining build note is the same non-blocking Vite chunk-size warning.

## 2026-04-18

- Completed Task 7 by adding shared scene page config, a `useProximityTilt` hook based on screen-space cursor distance, and a reusable `MenuButton` component with chrome capsule placeholders, phased lemniscate motion, hover glow, and subtle pulse scaling.
- Updated `MenuHub` to render all six labeled buttons around the central `@` logo from config data. Clicks currently log the selected route, which sets up the next camera-navigation task cleanly.
- Ran `pnpm check` and `pnpm build` successfully after the Task 7 work. Build is clean; Vite still reports the existing non-blocking large-chunk warning for the main bundle.
- Completed Task 8 by adding a shared Zustand camera store, a `CameraController` scene component, and real fly-to / return-to-hub transitions wired into the six menu buttons.
- Added a temporary top HUD pill in `App.tsx` so the active page label and Back action stay available while testing navigation before the content-panel system lands.
- Installed `zustand`, re-ran `pnpm check` and `pnpm build`, and both passed cleanly. The only remaining build note is the same non-blocking Vite chunk-size warning.

## 2026-04-19

- Completed Task 9 by adding a reusable `ContentPanel` Drei `<Html>` wrapper, then mounting a placeholder panel for each page at its 3D target location so content now fades in only after the camera arrives.
- Wired the panel close button and the temporary Back pill through a short fade-out before `returnToHub()`, so the panel exits cleanly before the camera flies back to the menu hub.
- Ran `pnpm check` successfully after the panel-system work. The app is clean for the next task: URL routing integration.
- Completed Task 10 by syncing the camera state to the browser URL with the History API, so button clicks now push deep links, direct visits to page routes fly to the correct scene target, and unknown routes normalize back to `/`.
- Wired both the panel close action and browser back navigation through the same fade-then-return flow, so the hub and page routes stay in sync without losing the existing panel transition feel.
- Ran `pnpm check` and `pnpm build` successfully after the routing work. Build is clean; Vite still reports the existing non-blocking large-chunk warning for the main bundle.
- Completed Task 11 by creating structured content data sources for projects, influences, and page commentary in `client/src/data/`, including placeholder entries for Contact, Reading List, Inspirations, See Canto, and Music.
- Added small helper lookups (`getProjectById`, `getInfluenceById`, `getCommentaryByPageId`) so the next panel and HUD tasks can wire against stable data APIs instead of hardcoded placeholder copy.
- Ran `pnpm check` successfully after the data-model work. The repo is clean for Task 12: project panel layout.
- Completed Task 12 by creating a dedicated `ProjectPanel` component and wiring all three oeuvre routes to render structured project content instead of the temporary placeholder copy.
- Added project-specific status badges, tech stack tags, outbound link rows, and a stable media placeholder block so the project pages feel intentional now and can accept screenshots later without reshaping the layout.
- Re-ran `pnpm check` and `pnpm build` successfully after the panel work. Build is clean; Vite still reports the existing non-blocking large-chunk warning for the main bundle.
- Completed Task 13 by creating `InfluencePanel.tsx` and wiring Contact, Reading List, and Inspirations to render their structured influence data instead of the temporary placeholder panel copy.
- Grouped influence entries by category and gave each item a dedicated annotation row with optional outbound-link treatment, so the collection pages now read like curated lists instead of generic placeholders.
- Re-ran `pnpm check` and `pnpm build` successfully after the influence-panel work. Build is clean; Vite still reports the existing non-blocking large-chunk warning for the main bundle.
- Completed Task 14 by proposing three type systems in `docs/plans/feedback.md`, then implementing the recommended mix: Cormorant Garamond for titles, Inter for body copy, and Space Mono for metadata and labels.
- Applied the new panel typography across the shared panel shell plus both project and influence layouts, so the 2D overlays now feel more editorial and less default-app.
- Re-ran `pnpm check` and `pnpm build` successfully after the typography work. Build is clean; Vite still reports the existing non-blocking large-chunk warning for the main bundle.
- Completed Task 15 by adding a dedicated HUD overlay and commentary view outside the R3F canvas, so each page now has a proper director's-commentary layer instead of relying only on the content panel.
- Added a floating `@` control to the page-state HUD pill and wired the overlay to close via click-outside, Escape, or the explicit close button, which gives the meta-layer the right “DVD extras” behavior.
- Re-ran `pnpm check` and `pnpm build` successfully after the HUD work. Build is clean; Vite still reports the existing non-blocking large-chunk warning for the main bundle.
- Completed Task 16 by adding a dedicated `CyberspaceNav` HUD component with clipped Halo-style panels, scanlines, cyan system accents, and jump links for all six pages.
- Wired HUD nav links to close the overlay and navigate immediately to the selected page, while keeping the active page visibly highlighted so the meta-layer now feels like a real in-universe navigation system instead of placeholder copy.
- Ran `pnpm check` successfully after the cyberspace-nav work. The repo is clean for Task 17: scroll-driven mobile interaction.

## 2026-04-22

- Completed Task 21 by teaching both `LogoModel` and `MenuButton` to hot-swap from their existing placeholder geometry to a GLB loaded with Drei `useGLTF` whenever a `modelPath` prop is present.
- Added a tiny sample GLB at `client/public/models/task-21-sample-box.glb` plus a `/?asset-demo=1` sanity-check path, so the asset swap can be previewed without disturbing the normal default scene.
- Documented the Blender-asset handoff in `TOOLS.md`, then ran `pnpm check` and `pnpm build` successfully. Build is still clean aside from the existing non-blocking Vite chunk-size warning.
- Completed Task 22 by animating the entire menu hub to recede during page travel, with the chrome `@` and all menu buttons fading and scaling down when leaving the hub, then easing back in on the return flight.
- Wired the transition state through `currentPage` / `isTransitioning` so hub interactions disable cleanly while the camera is in motion, then restored normal hover/click behavior once the camera settles back home.
- Re-ran `pnpm check` and `pnpm build` successfully after the transition-polish work. Build is still clean aside from the existing non-blocking Vite chunk-size warning.
- Completed Task 23 by memoizing static scene and panel components, sharing the capsule button geometry, and moving GLB cloning/material updates into memoized paths so the hover and fade systems stop recreating work unnecessarily.
- Trimmed per-frame scene overhead by replacing the menu hub's full-scene material traversal with a lightweight visibility state handoff, while keeping `<Html>` panels mounted only when active or mid-close.
- Added vendor chunk splitting plus a capped canvas DPR (`[1, 1.5]`) so initial scene loading is more incremental now; `pnpm check` and `pnpm build` both pass, though Vite still reports a non-blocking large `three` vendor chunk.

## 2026-04-23

- Completed Task 24 by adding production metadata in `index.html`, including a stronger page title, description, canonical URL, favicon, Open Graph tags, and Twitter card tags pointed at the live Vercel site.
- Added lightweight social/share assets at `client/public/favicon.svg` and `client/public/images/og-card.svg`, and created `vercel.json` rewrite rules so direct deep links resolve back through the SPA entrypoint on Vercel.
- Ran `pnpm check` and `pnpm build` successfully after the Vercel/meta work. Build is clean; Vite still reports the existing non-blocking large `vendor-three` chunk warning.

## 2026-04-21

- Completed Task 17 by adding a dedicated `useScrollInteraction` hook that captures wheel and touch gestures at the menu hub, turns light scroll into brief lemniscate speed/phase nudges, and converts sustained scroll into directional camera tilt.
- Wired the hub and camera to that shared scroll state so mobile and desktop scrolling can preview vertical navigation, then commit to the nearest page after a short pause once the sustained-scroll threshold is crossed.
- Kept panel scrolling intact by only intercepting scroll while the user is at the hub, then ran `pnpm check` and `pnpm build` successfully. Build is still clean aside from the existing non-blocking Vite chunk-size warning.
- Completed Task 18 by adding a reusable `useGyroscope` hook around the DeviceOrientation API, including normalized tilt output plus iOS permission handling for `DeviceOrientationEvent.requestPermission()`.
- Updated the parallax system to prefer gyroscope tilt when available, while preserving the existing mouse-driven behavior as the clean desktop and unsupported-browser fallback.
- Re-ran `pnpm check` and `pnpm build` successfully after the mobile-parallax work. Build is still clean aside from the existing non-blocking Vite chunk-size warning.
- Completed Task 19 by adding `detect-gpu` capability detection plus a `deviceCapability` helper that flags tier 0 and 1 hardware for a lighter experience.
- Split the app so the Three.js scene now lives in a lazy-loaded `SceneExperience` chunk, while weak devices get a CSS wireframe poster fallback with 2D nav links and the same route-driven content panels.
- Re-ran `pnpm check` and `pnpm build` successfully after the fallback work. Build now clearly separates the main entry chunk from the heavier scene chunk; the remaining large-chunk warning is confined to `SceneExperience` and is still non-blocking.
- Completed Task 20 by creating a dedicated `LoadingScreen` component driven by Drei's `useProgress`, with a retro progress bar, animated `@`, and wireframe-chrome styling that fits the rest of the site instead of a generic loader.
- Updated `App.tsx` so capable devices now keep the scene hidden behind the loading overlay until the scene bundle and initial assets settle, then fade smoothly into the 3D world.
- Ran `pnpm check` and `pnpm build` successfully after the loading-screen work. Build remains clean; Vite still reports the existing non-blocking large-chunk warning for the main app and `SceneExperience` bundles.

## 2026-07-10

- (Claude Code, Blender-side collaborator — not Alfred) Delivered the medallion hero asset: exported `client/public/models/medallion.glb` (888KB, Draco, KHR_clearcoat, named `section_0N_screen`/`_bezel` meshes with per-section planar UVs) and wrote the integration contract at `docs/medallion-glb-notes.md`.
- Built the first integration slice: `client/src/scene/MedallionHub.tsx` behind a `/?medallion=1` preview flag in `MenuHub.tsx` — reuses `useLemniscate` + hub parallax/scroll systems, BVH-accelerated per-section hover glow + label, click→page via a placeholder `SECTION_PAGE_MAP` (awaiting Andrew's blessing; section 6 unassigned). `pnpm check` and `pnpm build` pass; in-browser 3D verification deferred to a real browser (see `lessons.md` entry A).
- Added **Phase 8: Medallion Hero Integration** (Tasks 27–30) to the master plan and unblocked the nightly loop: Phase 7's audio gate now explicitly routes to Phase 8. Updated `CLAUDE.md` (medallion section + cross-pointers to the Blender project) and created `lessons.md`.
- Completed Task 27 by polishing the medallion preview: stronger per-section hover emissive, smoother hover-label fade/lift, and a tighter label position so the hub reads more like a CRT-era navigation object than a raw GLB drop.
- Added a `?force-3d=1` escape hatch in `App.tsx` for local browser verification, because headless Chromium reports a weak SwiftShader GPU and otherwise falls back to the poster mode before the medallion route can be exercised.
- Re-ran `pnpm check` successfully after the Task 27 pass. Browser automation still confirms the preview route boots but loses WebGL context under headless readback pressure, so real FPS judgment stays a real-browser job and any perf fix should happen in Blender decimation, not JavaScript.
- (Claude Code, later that night) Task 29 first pass: added `client/src/scene/screenWake.ts` — per-section CanvasTexture emissiveMaps with a wake state machine (hover: 0.3s white-noise flash → grainy bubble-text label with scanlines + CRT flicker; unhover: 0.45s fade). Wired into `MedallionHub.tsx` (wake manager owns screen emissives; hover loop now drives bezels only). `pnpm check` + `pnpm build` pass; text orientation and timing need real-browser verification (authored GPU-blind — see screenWake.ts header).
- Repo hygiene per tonight's health check: `.gitignore` now covers `openclaw-workspace-state.json` and `test-results/`; master plan gained a blocked-session commit rule so feedback.md blocker entries can't silently accumulate again (root cause of the June 24–July 9 gap — git/Vercel plumbing was verified healthy, zero unpushed commits).
- (Claude Code) Fixed the weak-device gate that served Andrew the static fallback on his own Mac: `deviceCapability.ts` now treats the obfuscated Safari/Apple-Silicon "Apple GPU" renderer as capable and treats detect-gpu's FALLBACK type (benchmark CDN fetch failure) as capable, matching App.tsx's catch path. Only WEBGL_UNSUPPORTED and genuinely low-tier non-Apple GPUs get the poster now. See lessons.md entry D.
- (Claude Code) Task 29 iteration per Andrew's live review: (1) label text was cut off by the screen shapes on sections 1/2/3/4/7 — added per-section text-safe boxes (largest rectangle inscribed in each ring aperture, computed from live Blender geometry by the medallion project's `compute_screen_safe_boxes.py`) plus an auto-fitting wrap/font-size layout in `screenWake.ts`; (2) replaced the plain noise flash with a tube-TV blink-on: full-tube flash → irregular hot horizontal line growing outward at mid-screen → the line swells vertically to fill the tube → picture fades in. Blink line/band draw full-canvas on purpose (overdraw hides under the chrome). `pnpm check` + build pass; aesthetics need Andrew's/Alfred's real-browser eye.
- (Claude Code) GLB v2 shipped — the striations are back. Baked the procedural body_warm_metal graph to textures (exact-channel EMIT bakes off a second material output; UV-unwrapped shield_body; tangent normal bake captures the bump layer) and re-exported with textured materials for shield_body + medallion_core (WebP-in-GLB, 3.1MB total, node/UV contract unchanged — drop-in for Task 30). Note: the first bake attempt crashed the GUI Blender session (Metal GPU bake); rerun headless on CPU took ~20s total. Real-browser look check still pending.
- (Claude Code) Fixed the "trapped on page views" bug Andrew hit on See Canto: drei Html's default z-index (~16.7M) put the oversized 3D-transformed panel above the z-20 Back pill, with its own close button scaled off-screen. ContentPanel is now SCREEN-SPACE (no transform — camera faces panels head-on so 3D scaling bought nothing and blurred text), zIndexRange [15,0] keeps it under the HUD pill, Escape closes it, and a subtle "esc / × — back to the hub" footer makes the exit discoverable. Page cameras pulled back z 5→8. Panel polish: visitor-voice placeholder copy in ProjectPanel (was developer-facing instructions), InfluencePanel item titles downsized for hierarchy, gentle rise-in transition.
- (Claude Code, final session wrap) Task 28 DONE: the medallion is the default hub (`/?classic=1` keeps the placeholder hub for comparison); section→page mapping accepted for now. Task 29 revised: screens now BOOT ON PAGE LOAD in a staggered cascade (section order, 0.13s apart) and stay lit — hover is a brightness lift; this doubles as the touch answer (labels always visible, one tap navigates). Wake redraws throttled to ~30Hz per screen; screen glow follows hub recede via a global dim. Phase 9 (Helmet HUD & World-Building — Andrew's smart-helmet AR vision: aurora edge glow, peripheral defocus, neon data tickers, name boot-sequence, HUD-as-narrator, everything diegetic) added to the master plan as Tasks 31–34. Lighting groundwork doc at docs/plans/lighting-session.md (with a ready-to-paste session prompt).

## 2026-07-12

- Completed Task 31 by adding a persistent `HelmetFrame` overlay with a typed boot line (`ANDREW ALFRED TRIMBLE // HELMET LINK STABLE`), animated aurora edge glow, peripheral blur mask, visor noise, and a diegetic bottom control pill so the site now reads like a single smart-helmet interface instead of separate loader/HUD layers.
- Unified the power-on timing by moving the medallion screen cascade onto the same post-loading boot event as the visor text; `App.tsx` now emits a shared boot-sequence signal, `MedallionHub.tsx` listens for it, and the old immediate-on-mount screen boot no longer races ahead behind the loading overlay.
- Restyled the existing loading screen and commentary overlay into the same helmet language (`helmet-panel` / `helmet-chip` / `helmet-action`) so loading, narration, and in-page controls share one visual device. Ran `pnpm check` successfully after the work; next queue item is Task 32.

## 2026-07-13

- Completed Task 32 by adding three quiet helmet ornaments at the viewport edges: vector drift, section/signal, and heading/noise readouts that cycle procedurally and react to page state, visor boot, and transition intensity.
- Moved the medallion section mapping into shared data (`client/src/data/hubSections.ts`) so the helmet frame and 3D hub now agree on the active section ID instead of carrying separate route maps.
- Ran `pnpm check` successfully after the HUD pass. Task 32 is complete; the next unchecked task is Task 33, which still needs Andrew's per-page world-building input before implementation.

## 2026-07-16

- Implemented Andrew's approved 2026-07-15 medallion-lighting direction: a broad neutral-white key, deep contours, warmth preserved in the baked mineral material, and a restrained blue-steel reflection that connects to the helmet aurora without washing the copper cyan.
- Added the procedural studio preview behind `?lighting=studio`, with matched-exposure `?tone=aces` comparison and `?screens=dormant` black-glass diagnostic paths. At this preview checkpoint, the legacy lighting remained the public/default path pending Andrew's real-browser signoff.
- Added dependency-free tests for preview parsing and the GLB material-role contract; `pnpm test`, `pnpm check`, and `pnpm build` pass at this implementation checkpoint.
- Andrew explicitly selected Studio ACES in the live matched-exposure comparison. Promoted Studio ACES at exposure `0.92` to the no-query default, retained `?lighting=legacy` as the temporary complete rollback, and retained `?tone=agx` as the matched-exposure comparison.

## 2026-07-18

- Direct session with Andrew: typography system (Bruno Ace / Zen Dots / Chivo Mono, self-hosted OFL), real reading-list data from Andrew's Lent log, inspirations content (Seurat + Mondrian public-domain images, podcast tile grid), music album tiles with Spotify/Apple links, project pages converted to standalone screenshot showcase with copy moved to the context overlay, `@` return bubble + pulsing 'Tap to see context' bubble replacing the helmet narrator, key-light nudge with ?keylight= A/B param. Spec: docs/plans/2026-07-18-content-typography-hud-spec.md. Visual endpoints pending Andrew's real-browser review.
- Added Earmarked section to the master build plan with three forward-looking tasks: accessible non-WebGL version, Angel nightly Spotify recap via cron, and background world/environment (blocked pending Andrew's brainstorm direction).

## 2026-07-19

- (Claude Code, Blender side) `medallion.glb` updated — `medallion_core` rebaked with new `core_warm_metal` material: concentric elliptical striations (lathe-turned look) replacing the mis-scaled "copper wool" texture; object-scale undistort fixed feature sizes to match the body; no geometry/contract changes. Source material builder is `scripts/build_core_concentric_mat.py` in the Blender repo.

## 2026-07-21 — Latency pass + magic space (Claude Code)

Andrew's direction this session: adapt silently (no visitor-facing quality
control), hybrid 3D-field + screen-space-streak background, grid removed,
starfield near-white with a slight cool/warm drift.

**Measured first** (`docs/plans/2026-07-21-latency-and-environment-proposal.md`).
Andrew's instinct was that the medallion dwarfs everything and thinning the
atmosphere would not buy enough. Directionally right about where the weight is,
but the two largest recoverable costs turned out to need no visual sacrifice at
all:

- the seven CRT screens were pushing ~54 MB/s of sustained texture upload and
  ~60k canvas-2d ops/sec, forever, re-rasterizing static text to animate noise,
  never gated on visibility, and rebuilding seven mip chains 30x/sec;
- 145,152 of the model's 348,992 triangles (41.6%) sit in seven flat,
  texture-driven screen plates.

Shipped: the CRT rebuild, adaptive DPR, the aurora scale fix, reduced-motion
coverage for the aurora, `?lite=1` / `?quality=` / `?perf=1`, grid removal, and
the three magic-space layers. 38 tests, tsc and build clean, all four new
shaders compile against a real WebGL2 context.

**Deferred, with reasons:**

- *Idle frame governor* (proposal 1A.4). The only clean way to cap the frame
  rate in R3F is `frameloop="never"` plus a hand-rolled rAF driver, which would
  put the boot cascade and the screen-wake state machine on a clock this session
  did not own. Held rather than shipped fragile — the lemniscate means
  `frameloop="demand"` is not available as the easy version.
- *HelmetFrame ornament interval* (1A.5). Listed as cleanup, then measured: it
  is two setStates per second, which is negligible. Left alone rather than
  churned. The proposal overstated it.
- *Screen-plate decimation* (1B.1) and *KTX2* (1B.3) — queued in
  master-build-plan.md. Decimation belongs to the Blender project by contract.
- *Moire on the CRTs* — Andrew's request, queued for its own session.

**Needs Andrew's real browser.** Nothing 3D was visually verified: the sandbox
runs the DOM and compiles shaders but never advances the WebGL frame loop (the
canvas stays at its default 300x150). Shader compilation, route behaviour, the
lite fallback and the console are verified; star density, spark rarity, streak
frequency and the medallion against a starfield instead of a grid are not.

### 2026-07-21 addendum -- Andrew's first review of the magic space

Two findings, one of them a bug this session introduced.

**Stars read as bokeh.** Andrew: "stars don't change opacity, they are opaque."
He was right, and for the exact reason he named -- a large soft point with
animated alpha is the definition of a defocused highlight. Real stars
scintillate through atmosphere; there is none in space, so removing the twinkle
was both the honest choice and the cheap one. Three things caused the read and
all three changed: the alpha pulse is gone, `gl_PointSize` is clamped so a near
star cannot bloom into a disc, and the falloff is tight so a point is a hard dot
with one antialiased pixel. The field now has zero per-frame work -- not even a
uniform to update.

**The sky "cut" to a new distribution ~15s in.** Self-inflicted. The adaptive
tier stepped down, which changed `starCount`, which was a `useMemo` dependency,
which regenerated every position from `Math.random()`. An entirely new sky in
one frame.

The lesson worth keeping: **never tie a procedural seed to a quality
parameter.** Both the starfield and the sparks now build once at max size and
let the tier drive `setDrawRange`. Because positions are generated
independently, a prefix of the buffer is already a uniform random subset, so
thinning removes stars without moving the ones that remain.

The same rebuild reset every spark's phase, and `low` zeroed sparks and streaks
outright -- so a machine that dipped once lost the atmosphere permanently and
silently. That is why Andrew saw magic on load and none afterwards. **No tier
switches a layer off any more**; thinning is the goal, and a zero is a different
and worse thing. Guarded by a test.

Magic frequency raised at Andrew's request. The largest single win was not a
count: the spark shell reached 22 units in every direction while the camera only
ever sees a cone of it, so most live sparks were firing behind the viewer.
Tightening the shell to 16 put far more of them on screen without adding a
vertex.

`?perf=1` now also reports the monitor's raw health factor, so a tier change is
diagnosable instead of mysterious.

Still needs Andrew's eyes: the sandbox compiles shaders and drives the DOM but
never advances the WebGL frame loop, so star density, the new opaque dot, spark
rarity and streak frequency are all unverified visually.

---

## 2026-07-30 — mobile / low-power performance (Tier A + Tier C)

Research first (`docs/plans/2026-07-30-mobile-performance-research.md`), then
Andrew approved Tier A and Tier C. Shipped:

**The opening bid was the bug.** The Canvas mounted at `dpr={1.5}` — the top rung
of `DPR_LADDER` — on every device, and `PerformanceMonitor` cannot correct frames
that happen before its first sample. So the weakest phone rendered its opening
seconds at maximum cost, exactly while GLB decode, Draco decompression and
texture upload were already saturating the budget. On a phone that is a thermal
event, not just slow frames: heat accumulated at t=0 lowers the ceiling for the
whole session. `startingTierFor` now derives the opening tier from synchronous
device hints (`pointer: coarse`, `maxTouchPoints`, screen short edge,
`hardwareConcurrency`, `deviceMemory`) and the monitor is seeded with the
matching factor so it argues in **both** directions. A capable desktop still
starts at `high` — the change does not tax the good case. Absent signals mean
unknown, never weak, matching the rule `deviceCapability.ts` already applies to
detect-gpu's FALLBACK type.

**The helmet CSS joined the quality system.** Four animated full-viewport
`filter: blur() + mask-image` layers plus a full-viewport `backdrop-filter` sat
entirely outside every quality knob, because no tier value had ever reached the
DOM. `useQuality` now writes the live tier to `<html data-quality>` and
`index.css` responds through two custom properties. Per entry G every rung stays
non-zero — this thins, it never removes a layer. Desktop values are unchanged, so
`high` is byte-identical to before. Measured in-browser at 375×812: aurora
7.5px → 3px, peripheral 14px → 6px.

**Texture residency (Tier C).** `EXT_texture_webp` compresses on the wire only;
on upload the maps decode to uncompressed RGBA, so the authored set (3× 2048² +
3× 1024²) costs ~84 MB resident with mip chains. On iOS Safari the failure mode
is context loss — a black canvas — not a dropped frame. `capSceneTextures`
resamples the 2048² set to 1024² on phone-sized touch devices, before the scene
first renders so the large version is never uploaded at all. Verified against a
synthetic scene matching the real layout: **48 MB reclaimed**, 1024² maps
untouched (a ceiling, not a target), shared textures deduped, idempotent on
re-run, and a genuine no-op on desktop. Texture identity is preserved — the
pixels are swapped, not the `THREE.Texture` — so every material binding survives.

KTX2/Basis remains the better long-term answer (~4 MB, stays compressed *in* GPU
memory) and is still **not** adopted: it needs a transcoder dependency and ETC1S
degrades normal maps enough to need Andrew's eyes on the artifact. Priced in the
research doc, not taken.

**Context loss is now survivable.** `preventDefault()` on `webglcontextlost` —
without it the browser will not even attempt a restore, so the default behaviour
was a permanently dead canvas — and a drop to the floor tier on restore. Losing
the context is the strongest possible over-budget signal and the one the
frame-time monitor structurally cannot produce, because by then there are no
frames left to measure.

**New preview instrument:** `?texcap=N` (power of two) pins the texture cap, so
the phone's texture path can be judged on a screen big enough to judge it on. A
phone gets the reduction but is the worst place to evaluate it.

Also fixed en route: `?quality=` pinned the WebGL tier but not the CSS one,
because it was applied by an effect inside the lazily-mounted Canvas subtree —
see lessons.md entry Q.

83 tests pass (13 new), `pnpm check` and `pnpm build` clean, no new dependency,
bundle unchanged.

**Needs Andrew's eyes (Tier B, not started):** the aurora and backdrop-filter
radii at `low` are art-direction values, not compute numbers — the aurora ones
are backed by the existing harness note on `.helmet-aurora-layer` (4vmin/2vmin/
none were indistinguishable), the `backdrop-filter` radius has never been A/B'd.
Also unverified: the resampled artifact on a real phone (`?texcap=1024` on
desktop is the proxy), and whether sub-1.0 DPR is acceptable on a phone now that
the confounding mipmap bug is fixed. Per lessons.md entry A the sandbox drives
the DOM and compiles shaders but never advances the frame loop, so none of the
visual outcomes above are verified — only the mechanisms are.

---

## 2026-08-02 — the lag is texture uploads, not the medallion

Andrew ran `?diag=1` on an iPhone (iOS 18.7, 393×852 @dpr 3, tier `low` — the
conservative start from 2026-07-30 worked). The result settled the question that
motivated the whole harness.

Every condition returned a median of **exactly 17.0ms** — 60Hz vsync. The phone
was hitting the frame cap with everything on, so the median could not move and
the harness's own verdict said "no single layer dominates". That was wrong, and
wrong in an instructive way: the median was pinned against a ceiling (lessons.md
entry K, now rewritten to cover ceilings generally, not just clamps).

The p95 column had the answer:

| condition | median | p95 |
|---|---|---|
| Baseline | 17.0 | 40.0 |
| DPR 0.75 | 17.0 | 40.0 |
| Bezels hidden | 17.0 | 38.0 |
| Sparks off | 17.0 | 36.0 |
| Starfield off | 17.0 | 33.0 |
| Helmet aurora off | 17.0 | 20.0 |
| **Screens hidden** | 17.0 | **17.0** |
| **CRT redraw frozen** | 17.0 | **17.0** |

`Screens hidden` and `CRT redraw frozen` score **identically**, and that pair is
the proof. Hiding the screen meshes removes 145,152 triangles AND the uploads
(a WebGL texture uploads lazily at bind time, so an undrawn mesh never uploads).
Freezing the redraw removes the uploads while still rasterizing every one of
those triangles. Same result. **The geometry costs nothing measurable.**

So the low-poly Blender re-export was not built. It would have been days of work
against a mesh the measurement exonerates. `DPR 0.75` and `Bezels hidden` sitting
at baseline independently confirm the scene is neither fill-rate nor vertex bound.

**Fix shipped: an upload budget.** Seven screens at 10–20Hz average barely over
one upload per frame, which is why the median never moved — the damage lands on
the frames where several coincide, because `texImage2D` from a canvas must flush
that canvas's 2D command queue first, so N coincident uploads means N stalls in
one frame. `ScreenWakeManager.update` now grants at most `MAX_UPLOADS_PER_FRAME`
(2) texture uploads per frame, with a rotating cursor so no section is
systematically the one deferred. Per-screen redraw rate is unchanged; the
redraws simply never land together. The boot fade-in is exempt (it redraws every
frame by design and is the authored cascade) but still consumes budget.

Also fixed: the accumulator zeroed on redraw, discarding the remainder, which
made the effective period depend on frame timing and let independently-phased
screens drift into lockstep. Now decremented.

**Harness corrections:** ranks on p95 when the medians are saturated, detects
saturation by spread rather than a hard-coded 16.7ms (so it works on 120Hz
ProMotion), requires the tail to still vary before claiming a cap (otherwise a
genuinely flat sweep would be mislabelled "capped"), and names the metric in the
verdict so "recovers 57%" cannot be read as a claim about the typical frame.

Second contributor worth noting: `Helmet aurora off` recovers 50% of the tail.
The CSS blur layers are real, they are already tier-gated as of 2026-07-30, and
they are the next lever if the upload fix does not close the gap.

**Open:** whether the fix works. Re-run `?diag=1` — if baseline p95 now matches
`CRT redraw frozen` p95, it is closed. If a gap remains, the residue is
per-upload cost and the next lever is texture size at `low` (256→128), which
needs Andrew's eyes because of the entry-J legibility history.

100 tests pass, check and build clean.
