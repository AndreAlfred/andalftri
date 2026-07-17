# Design Overhaul Spec — Panels, HUD, Aurora, Boot Sequence

**Date:** 2026-07-17
**Author:** Claude Code (diagnostic deep-dive), from Andrew's direct feedback
**Status:** Proposal — approved scope pending Andrew's review. No code has been changed.
**Audience:** Implementing agent. Every root cause below was verified by reading the
current code on `main` (commit `39bb84e`). File:line references are exact.

---

## Andrew's reported symptoms (2026-07-17, verbatim intent)

1. Content panels are not centered — obscured toward the lower right of the view.
2. Text clips at rounded corners of boxes.
3. The aurora overlay is cropped above/below and thin on left/right — correct look
   for mobile, but the opposite of what desktop should be.
4. The HUD boxes don't read as a HUD.
5. The "visor boot" line that types Andrew's name loops rapidly and endlessly;
   it should type once, maybe blink, and settle.

These are "a few things to start with" — treat this spec as the first design pass,
not the final art direction. **All visual endpoints require Andrew's real-browser
signoff** (lessons.md: visual work needs human signoff; sandbox/automated capture
cannot judge WebGL output).

---

## Root causes (verified)

### RC-1 — Panels anchor their top-left corner at screen center

`client/src/panels/ContentPanel.tsx:50-56` passes `transform: translateY(0|14px)`
inside the `style` prop of drei's `<Html center>`. In drei's non-transform mode,
`center` is implemented as `transform: translate3d(-50%,-50%,0)` on the same
element, and the user `style` is spread **after** it — so the entrance-animation
transform **replaces** the centering transform. The camera rig itself is correct:
`client/src/scene/CameraController.tsx` converges `lookAt` exactly onto the panel
anchor (`page.cameraLookAt`), which projects to viewport center. The panel's
top-left lands at that center point, so the box occupies the lower-right quadrant.
Regression introduced in commit `4c77278` ("Fix page-view trap + panel polish",
2026-07-11) when panels switched to non-transform Html.

### RC-2 — Scrolled/overflowing text is clipped by rounded-corner masks

Three distinct sites:

- **ContentPanel** (`ContentPanel.tsx:58,67`): the scroll container
  (`max-h-[72vh] overflow-y-auto px-6 py-7 pr-16`) lives **inside** the
  `overflow-hidden rounded-[28px]` shell, and the padding is on the scroll element
  itself. Once the user scrolls, content slides through the padding zone into the
  28px corner curves and is clipped diagonally.
- **HudOverlay** (`HudOverlay.tsx:47,59`): `overflow-hidden rounded-[32px]` with
  `min-h-[min(42rem,calc(100vh-4rem))]` and **no scroll container at all** — on
  short viewports, commentary text is simply cut off at the bottom corners.
- **CyberspaceNav** (`index.css:242-276` + `CyberspaceNav.tsx:28`): the
  `clip-path` chamfer notches (0.9rem right, 0.75rem left) cut into text that sits
  within the 16px (`px-4`) padding — the "Jump"/"Live" trailing spans and long
  labels can lose corner pixels.

### RC-3 — Aurora is four fixed-size strips sized for a phone aspect

`HelmetFrame.tsx:123-126` (duplicated in `LoadingScreen.tsx:64-67`): the edge
glows are absolute strips with hard rem sizes — top `h-44` (176px), bottom `h-40`
(160px), sides `w-32` (128px). On a 375px-wide phone, sides cover ~34% of width
(good); on a 1440px desktop they cover ~9% (thin ribbons), while the top/bottom
bands read as cropped horizontal slabs. The gradients (`index.css:141-170`) use
percentage-positioned radial blobs whose shapes distort with the strip's aspect
ratio. The layers are also duplicated per-surface (HelmetFrame, LoadingScreen,
partially HudOverlay) rather than shared.

### RC-4 — HUD chrome is styled as glassmorphism, not AR telemetry

`index.css:71-116,186-216`: `helmet-chip` / `helmet-ornament` / `helmet-action`
are soft translucent cards — heavy `backdrop-filter: blur`, `rounded-full` pills,
low-contrast 18%-alpha strokes, big drop shadows. That vocabulary reads as
consumer frosted-glass UI. The repo already contains the correct HUD vocabulary —
`.cyberspace-panel` / `.cyberspace-link` (chamfered clip-paths, cyan strokes,
scanline pseudo-elements) — but it is only used inside the HudOverlay nav, so the
helmet layer and the cyberspace layer speak two different languages.

### RC-5 — The boot sequence re-fires every ~420ms forever

`client/src/App.tsx:68-73` passes an **inline** `onReady` arrow to
`LoadingScreen`. `LoadingScreen.tsx:33-43` re-runs its ready effect whenever the
`onReady` identity changes, and it stays mounted (returns `null` but keeps its
hooks). The cycle: `onReady` fires → `setBootSequenceId(Date.now())` → App
re-renders → new `onReady` identity → effect re-schedules a 420ms timer → fires
again with a new `Date.now()` → forever. Effects, every ~420ms:

- `HelmetFrame.tsx:45-70` restarts the 42ms/char typewriter (needs ~1.8s for the
  43-char line) — so only the first few characters of Andrew's name ever render
  before it restarts. This is the "looping way too fast" symptom.
- `MedallionHub.tsx:139-141` re-triggers `wake.bootAll(...)` — the CRT screen
  cascade re-runs on the same loop.
- App re-renders continuously for the life of the session (hidden perf drain).

Two secondary defects in the same system, visible once the loop is fixed:

- `HelmetFrame.tsx:150` keeps the boot chip visible forever
  (`bootActive || visibleChars > 0` — `visibleChars` never returns to 0).
- No `prefers-reduced-motion` handling for the typewriter.

---

## Design direction

All work must serve the site's visual hierarchy (CLAUDE.md):

> A warm mineral artifact in a dark void, seen through a cool smart-helmet AR
> display. Y2K appears through CRT behavior and interface motion.

Implications for this pass:

- The helmet/HUD layer is **cool, thin, precise, peripheral**. It frames; it does
  not upholster. Reducing fill, blur, and pill-roundness moves toward spec.
- The content panels are **screens inside the visor** — they should sit composed
  and centered in the visor's focal zone, never crowding the periphery ornaments.
- Aurora is **helmet-edge light**, so its geometry must follow the viewport's
  aspect (a wide visor glows at the left/right periphery; a tall phone visor
  glows top/bottom) — exactly the inversion Andrew described.
- Everything here is procedural CSS/code effects — allowed under the human-made
  art constraint. No image assets may be generated.

---

## Workstream A — Panel presentation layer

**Goal:** panels are visually centered, responsive, and never clip their text.

### A1. Recenter panels (fixes RC-1)

Two acceptable approaches; pick after inspecting complexity:

- **Minimal fix:** stop overriding drei's centering transform. Move the entrance
  animation (`opacity` + `translateY`) onto an **inner** wrapper div inside
  `<Html>`, leaving the Html element's own transform untouched.
- **Preferred fix (architectural):** lift panels out of the Canvas entirely into
  a screen-space React layer (sibling of `HelmetFrame`), centered with flexbox.
  The panels are already effectively screen-space (see comment block in
  `ContentPanel.tsx:14-20` — 3D transform was deliberately abandoned). Drei
  `<Html>` adds projection cost and stacking-context complexity for zero visual
  benefit. Visibility timing continues to key off `currentPage`,
  `isTransitioning`, and the close-delay state that already lives in
  `SceneExperience`. This also frees panel z-index from `zIndexRange` coupling.

Acceptance:
- On every route, at 1440×900, 1280×800, 768×1024, and 375×812, the panel's
  bounding box is horizontally and vertically centered in the viewport (measure
  `getBoundingClientRect()` center vs viewport center; tolerance ±8px).
- Entrance animation still plays (fade + rise), close/Escape still work, HUD pill
  still sits above the panel.

### A2. Corner-safe scrolling (fixes RC-2, ContentPanel)

Restructure the panel shell so the rounded mask and the scroll viewport are not
fighting:

- Padding moves off the scroll element: shell (`rounded-[28px] overflow-hidden`)
  → inner static padding frame → scroll element inside the padded area, so
  scrolled content never enters the corner-curve zone.
- Add top/bottom scroll fade masks (CSS `mask-image` linear-gradient on the
  scroll viewport) so text entering/leaving the scroll area dissolves instead of
  guillotining at the padding edge.
- Establish a repo rule (document in this file's implementation notes when done):
  **an element with `overflow: hidden` and radius r must not contain a scroll
  viewport whose content can approach within r of its corners.**

### A3. HudOverlay scrolling (fixes RC-2, HudOverlay)

Give the commentary column a real scroll container with the same corner-safe
structure and fade masks. The overlay must handle 100vh < 42rem gracefully.

### A4. Chamfer text-safety (fixes RC-2, CyberspaceNav)

Ensure horizontal padding on `.cyberspace-link` content exceeds the notch depth
(≥ notch + 4px), or inset the text spans from the clipped edges. Verify with the
longest label ("Heaven & Nature") and both trailing badges.

Acceptance for A2-A4: at all four test viewports, with each panel/overlay open
and scrolled to top, middle, and bottom, no glyph is partially cut by a corner
mask or clip-path.

---

## Workstream B — Boot sequence lifecycle

**Goal:** boot types once, settles, exits. Nothing re-fires.

### B1. Fire `onReady` exactly once (fixes RC-5)

- Wrap App's `onReady` in `useCallback` (empty deps).
- Add a fired-once ref guard inside `LoadingScreen` so `onReady` cannot fire
  twice regardless of caller identity churn (defense in depth — do both).
- Keep the existing `hasSettled` grace so a no-asset session still boots.

### B2. Boot chip lifecycle (fixes the forever-visible chip)

Timeline after fix: type at the current 42ms/char → line completes → cursor
blinks for ~2.5s hold → chip fades out and unmounts its visibility state
(`bootActive` alone should drive visibility, not `visibleChars > 0`). A
`prefers-reduced-motion` user gets the full line immediately with a short hold,
no typewriter.

### B3. Contract tests

Add a dependency-free Node test (`tests/`) for the boot lifecycle contract:
given the line length and `HELMET_BOOT_CHAR_MS`, the total type duration, hold,
and fade windows are consistent, and a "fire ready" reducer/guard cannot emit
twice. (Pure-logic extraction: pull the once-guard and timeline math into a
small module, e.g. `client/src/hud/bootLifecycle.ts`, so it is testable without
React.)

Acceptance: on a fresh load of `/`, the visor line types Andrew's name exactly
once; the medallion CRT cascade (`wake.bootAll`) runs exactly once; React does
not re-render App on an interval afterward (verify with React DevTools profiler
or a render counter during review).

---

## Workstream C — Aurora / visor chrome geometry

**Goal:** aurora reads as helmet-edge light at every aspect ratio; one shared
implementation.

### C1. Extract shared `VisorChrome` component

One component renders vignette + peripheral blur + aurora + visor noise, used by
`HelmetFrame`, `LoadingScreen`, and (subset) `HudOverlay`. Kill the current
triplication (`HelmetFrame.tsx:121-127`, `LoadingScreen.tsx:62-68`,
`HudOverlay.tsx:44-45`).

### C2. Aspect-aware aurora geometry (fixes RC-3)

Replace the four fixed rem strips with viewport-relative geometry. Recommended
construction (procedural, no assets):

- A single full-viewport layer whose glow hugs the edge via an elliptical ring
  `mask-image` (transparent center → opaque rim), so coverage scales with both
  axes automatically.
- Aspect emphasis via `@media (orientation: landscape)` /
  `(orientation: portrait)` (or an aspect-ratio media query): landscape biases
  the rim mask and gradient weight toward the left/right periphery; portrait
  biases top/bottom — the inversion Andrew asked for. Keep the existing
  `helmetAuroraPulse` animation, applied to the unified layer(s) with staggered
  delays if multiple hues are layered.
- Keep hues in the existing cyan/teal family (`index.css:141-170` values are the
  palette reference); intensity endpoints are an Andrew-eyes decision.

Acceptance: at 375×812 the current mobile character is preserved (Andrew
confirmed it reads correctly); at ≥1280px wide the side glow is the dominant
aurora presence and top/bottom recede to a thin rim; no visible rectangular
cutoff line at any viewport between 320px and 3440px wide. Final look requires
Andrew's real-browser review at his desktop resolution.

---

## Workstream D — HUD design language

**Goal:** helmet chrome reads as AR telemetry, unified with the cyberspace
vocabulary already in the codebase.

### D1. Define a `hud-frame` primitive (fixes RC-4)

A CSS component class (plus optional React wrapper) providing:

- Chamfered corner geometry via `clip-path` (align angles with
  `.cyberspace-panel`'s existing 1.25rem chamfer language).
- Corner bracket ticks (pseudo-elements or 1px gradient borders) — the classic
  AR reticle framing.
- Thin, brighter strokes (raise cyan stroke alpha from ~0.18 toward ~0.35-0.5),
  near-transparent fills, drastically reduced `backdrop-filter` blur (the
  periphery blur belongs to VisorChrome, not to each box).
- Optional scanline overlay reusing `.hud-scanlines`.

### D2. Apply across the helmet layer

Convert, in order of visibility: the three telemetry ornaments
(`helmet-ornament`), the visor-boot chip, the helmet-narrator bottom pill, the
HudOverlay shell, and the loading card. Buttons (`helmet-action`) drop
`rounded-full` for chamfered rectangles consistent with the frame language.
Monospace microtype stays (`Space Mono` is correct); consider `font-variant-
numeric: tabular-nums` on telemetry values so the 160ms jitter stops causing
width wobble — and slow the ornament update cadence (`HelmetFrame.tsx:112`,
currently 160ms) to something calmer (~400-600ms with eased value interpolation)
so numbers read as instruments, not noise.

Acceptance: side-by-side before/after screenshots at desktop and mobile widths
for each converted element; Andrew signs off on the direction after seeing the
ornaments + boot chip converted first (do those two, pause for review, then
propagate — "one slice first" per lessons.md).

---

## Sequencing and handoff notes

Recommended order (each step independently shippable and revertible):

1. **B (boot lifecycle)** — smallest, highest-annoyance, zero visual-taste risk,
   and it stops the permanent re-render churn that could confound later visual
   review. Includes the contract test.
2. **A1 minimal recenter** — one-line-class of fix; immediately restores
   usability. If the team opts for the architectural lift-out, do it as a
   follow-up commit so the fix isn't hostage to the refactor.
3. **A2-A4 corner safety** — mechanical CSS restructuring, verifiable
   deterministically.
4. **C (aurora)** — visual; needs Andrew checkpoint at desktop resolution.
5. **D (HUD language)** — most taste-dependent; convert two elements, get
   Andrew's eyes, then propagate.

Per-change workflow (CLAUDE.md): `pnpm test`, `pnpm check`, `pnpm build`, commit,
push (auto-deploys in ~30s). For visual steps, capture a deterministic
before/after at the same route + viewport and attach to the review request. Do
not call any visual workstream complete without Andrew's real-browser approval.

**Out of scope for this pass:** Contact taxonomy cleanup (`group: "influences"`
legacy bucket), Cottage (section 6), world-building (Task 33), audio, copy
polish (publication-copy gate). Do not touch the GLB or Blender project.

## Addendum (2026-07-17, during execution) — RC-6: unlayered reset kills all Tailwind spacing utilities

Discovered by the Task 3 implementer and independently verified against the built
CSS: `client/src/index.css:10-16` declares an **unlayered** universal reset
(`*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box }`).
Tailwind v4 emits its utilities inside `@layer utilities`, and per the CSS
cascade-layers spec, unlayered author rules take precedence over **all** layered
rules regardless of specificity or order. Consequence: every `p-*`, `px-*`,
`m-*`, `mt-*`, and `space-y-*` utility on the site has never applied — in
production, since the first commit (2026-04-16). `gap-*` works (it isn't
margin/padding), which is why layouts held together well enough to hide this.

This is the dominant cause of the "text clipping at rounded corners" symptom
(RC-2's structural issues are real but secondary): with rendered padding at
zero, text sits flush against every rounded-corner mask. It also means all
authored inter-section spacing rhythm is missing site-wide.

**Fix (Task 3.5):** delete the unlayered reset. Tailwind v4's preflight in
`@layer base` already provides an equivalent reset (`box-sizing: border-box`,
`margin: 0`, `padding: 0`, `border: 0 solid`), so removal restores the authored
utilities without losing reset behavior. **This changes the rendered appearance
of every surface on the site** — it must ship on the branch and get Andrew's
real-browser review before merging to main. Tasks 4-5 must be implemented on
top of this fix so aurora/HUD decisions are made against the true rendering.

## Additional findings logged during the dive (not in Andrew's list)

- `ContentPanel` `zIndexRange={[15,0]}` vs HelmetFrame `z-30`: telemetry
  ornaments can overlap panel content at small viewports; A1's lift-out (if
  taken) should define an explicit stacking order: scene < panels < helmet
  chrome < HudOverlay.
- `LoadingScreen` stays mounted forever after fade (returns `null` but keeps
  hooks); after B1 this is harmless, but unmounting it once ready would be
  cleaner.
- The loading card and HudOverlay will inherit their look from D's `hud-frame`
  conversion — no separate design needed.
