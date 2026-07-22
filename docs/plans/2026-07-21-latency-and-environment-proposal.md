# Latency + Magic Space — research and proposal (2026-07-21)

Research only. Nothing here is built. Andrew's direction from this session:

- **Perf:** auto-adapt silently, no visitor-facing quality toggle.
- **Space:** hybrid — real 3D depth for the starfield, screen-space for the close streaks.
- **Tradeoff:** Andrew's gut is that the medallion dwarfs everything else, so thinning
  the atmosphere won't buy enough; he is open to softening the artifact but wants to
  **see** the softened version before approving it.

That last point drove the method: measure first, don't assume.

---

## Part 0 — What the measurements actually say

Measured 2026-07-21 by parsing `client/public/models/medallion.glb` directly and
reading the render path. Facts are separated from inference per `lessons.md`.

### Observed facts

**Geometry (`medallion.glb`, 2.8 MB)**

| | value |
|---|---|
| triangles | **348,992** |
| vertices | 228,071 |
| primitives (≈ draw calls) | 17 |
| materials | 5 |
| textures | 6 |

Triangle budget by mesh:

| mesh | tris | share |
|---|---|---|
| `Mesh.002` (shield body) | 108,812 | 31.2% |
| `section_0N_screen` × 7 | 20,736 **each** = 145,152 | **41.6%** |
| `section_0N_bezel` × 7 | 9,720 each = 68,040 | 19.5% |
| `Cylinder` | 24,576 | 7.0% |

`20,736 = 144²`. The seven screens are uniformly subdivided grid planes. They are
flat-ish plates whose entire visible content comes from a **CanvasTexture emissive
map** and a black-glass clearcoat material. **42% of the model's geometry is spent on
seven surfaces that carry no geometric detail.**

**Textures — all uncompressed RGBA8 on the GPU, no KTX2/Basis**

| image | dims | file | VRAM (incl. mips) |
|---|---|---|---|
| `shield_body_normal` | 2048² | 850 KB | ~21.3 MB |
| `shield_body_basecolor` | 2048² | 313 KB | ~21.3 MB |
| `shield_body_roughness` | 2048² | 288 KB | ~21.3 MB |
| `medallion_core_normal` | 1024² | 343 KB | ~5.3 MB |
| `medallion_core_basecolor` | 1024² | 23 KB | ~5.3 MB |
| `medallion_core_roughness` | 1024² | 13 KB | ~5.3 MB |
| **total** | | 1.8 MB | **~80 MB** |

**Per-frame CPU + bus cost — the CRT screens (`screenWake.ts`)**

Steady state on the homepage, no hover, all seven screens parked in the `text` phase.
Every screen redraws at 30 Hz (`s.redrawAccum >= 1/30`), and each redraw does:

- `fillRect` full-canvas clear
- `drawText` — `strokeText` at `lineWidth ≈ 10px` + `fillText`, per line
- `drawGrain(200)` — 200 iterations, **3 `Math.random()` calls each**, 200 `fillRect`
- `drawScanlines` — `256/3 = 86` `fillRect`
- `s.texture.needsUpdate = true`

Per redraw cycle across seven screens: **≈ 2,000 `fillRect` calls + ~20 text
rasterizations**. At 30 Hz that is **≈ 60,000 canvas-2D ops/second on the main
thread**.

Then the upload. `THREE.CanvasTexture` inherits `generateMipmaps = true` and
`minFilter = LinearMipmapLinearFilter`. 256² is power-of-two, so **every**
`needsUpdate` re-uploads 256 × 256 × 4 = 256 KB **and rebuilds the full mip chain**:

> 7 screens × 256 KB × 30 Hz = **≈ 54 MB/s of sustained texture upload, plus seven
> mip-chain regenerations 30 times per second — forever.**

Three further observations about this loop:

1. **The text never changes.** Only the 200 grain dots and the flicker do. The full
   canvas — including the expensive wide-stroke text raster — is recomposed 30×/sec
   to animate noise.
2. **It does not stop.** `wake.update()` is called unconditionally from
   `MedallionHub`'s `useFrame`. When a content panel is open and the hub has faded to
   near-zero opacity, all seven screens keep redrawing and re-uploading at full rate.
3. **It is GPU-tier-independent.** This cost lands on the main thread and the CPU→GPU
   bus. It is exactly the cost that hurts most on a machine that is already busy —
   Andrew's stated scenario.

**Render settings (`SceneExperience.tsx`)**

- `dpr={[1, 1.5]}` — fixed, never adapts. On a 2560×1440 window that is ~8.3 M
  fragments per frame.
- `antialias: true` — MSAA on the default framebuffer, cost scales with DPR.
- `frameloop` — default `"always"`. Renders at full rate even when nothing moves but
  the lemniscate drift.
- `<DreiEnvironment frames={1} resolution={256}>` — **correctly one-shot.** Not a
  per-frame cost. Good as-is.
- `castShadow`/`receiveShadow` set on every mesh, but `<Canvas>` has no `shadows`
  prop, so `shadowMap.enabled` is false. These flags are **inert** — no shadow pass
  is running. No cost, but also dead code.
- `lightingSettings` is `useMemo(..., [])`, so `emblem` is referentially stable and
  the 349k-tri `scene.clone(true)` does **not** re-run on re-render. This was checked
  specifically; it is fine.

**HUD layer (`index.css`)**

`.helmet-aurora-layer` — **four full-viewport layers**, each carrying
`mask-image` + `filter: blur(2vmin)` + `mix-blend-mode: screen`, animating
`helmetAuroraPulse` on a 12s infinite loop. The keyframes animate **both `opacity`
and `transform: scale(1 → 1.03)`**.

The existing code comment records that blur radius was already A/B'd in a harness
(4vmin vs 2vmin vs none) — that work stands. But the `scale()` is a separate variable
that was not isolated: an animated transform on an element that also carries a filter
and a mask generally forces re-rasterization and re-blur rather than a
compositor-only transform. A pure-opacity animation would likely be near-free.

`prefers-reduced-motion` covers `.hud-context-pulse`, `.hud-return-caret`, and
`.hud-context-enter` — **but not `.helmet-aurora-layer`.** The aurora keeps animating
for visitors who asked for less motion. That is an accessibility gap and a free perf
win in the same line.

**Bundle (`pnpm build`, 2026-07-21)**

| chunk | raw | gzip |
|---|---|---|
| `vendor-three` | 704.6 KB | 180.7 KB |
| `vendor-scene` (drei etc.) | 461.9 KB | 152.9 KB |
| `vendor-react-dom` | 180.3 KB | 56.2 KB |
| `SceneExperience` | 45.0 KB | 15.6 KB |
| everything else | ~48 KB | ~18 KB |
| **JS total** | **~1.44 MB** | **~424 KB** |

Plus the 2.8 MB GLB and the webfonts. Time-to-interactive is dominated by
`vendor-three` + `vendor-scene` + GLB.

### Inference

Andrew's read — "the medallion is so much more intensive than anything else that
cutting the magic won't cut it" — is **directionally right about where the weight is,
and wrong about what has to be sacrificed to get it back.**

The three largest recoverable costs, in order, are:

1. **The CRT screen loop** — ~54 MB/s of texture upload + ~60k canvas ops/s, running
   forever, including when the medallion is faded out behind a panel. Recoverable
   **with no visual change whatsoever.**
2. **145,152 triangles in seven flat screen plates** — 42% of the model, spent on
   surfaces whose appearance is 100% texture-driven. Recoverable with **essentially
   no visual change.**
3. **Fixed 1.5 DPR with no adaptation** — the standard, invisible lever for exactly
   the "capable machine, contended right now" case.

None of these three require softening the artifact in any way Andrew would notice.
The proposal is therefore ordered so that the free wins land first and the genuinely
visual tradeoffs are held back behind a preview flag for his eyes.

---

## Part 1 — Reduced latency

### Path 1A — "Reclaim the waste" (recommended first; no visual change)

Nothing here alters a single pixel at rest. Ordered by measured payoff.

**1A.1 — Fix the CRT screen loop.** Three independent changes:

- *Split the canvas into a cached base + a grain overlay.* Render text + scanlines
  once into an offscreen canvas when the label or font changes. Per redraw:
  `drawImage(base)` + `drawGrain`. Removes ~20 wide-stroke text rasterizations per
  cycle and most of the fill work.
- *Disable mipmaps on the screen textures* — `texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter`. Kills seven mip-chain rebuilds 30×/sec.
  The screens are viewed at roughly constant distance; mip levels buy nothing here.
- *Gate the loop on visibility.* Skip `update()` entirely when `opacity < 0.02` or a
  panel is open and the transition has settled. Freeze, don't tear down — state
  resumes where it left off.

  Optionally drop grain from 30 Hz to 15 Hz. CRT grain reads as noise; halving its
  rate is close to imperceptible and halves what's left. Worth an A/B, not an
  assumption.

  *Expected:* removes the large majority of ~54 MB/s upload and ~60k canvas ops/s.
  **Highest payoff of anything in this document, and invisible.**

**1A.2 — Adaptive DPR.** Wrap the scene in drei's `<PerformanceMonitor>`. Start at
1.5; step to 1.25 → 1.0 → 0.85 when the frame budget slips; climb back when it
recovers. Hysteresis and a floor prevent visible pumping. This is precisely the
"auto-adapt, silent" behavior Andrew chose, and it is the standard R3F answer to
"capable GPU, contended right now."

**1A.3 — Aurora compositing.** Test removing `transform: scale()` from
`helmetAuroraPulse`, leaving the opacity breath. One variable, one change,
measurable. Also add `.helmet-aurora-layer` to the `prefers-reduced-motion` block —
fixes an a11y gap and costs nothing.

**1A.4 — Frame-rate governor.** When no pointer movement, no camera transition, and
no hover for ~2s, cap to 30 fps. The lemniscate drift is slow enough that 30 fps
reads as intentional calm rather than jank. Full rate resumes on any input.

**1A.5 — Cleanup.** Drop the inert `castShadow`/`receiveShadow` flags. Move
`HelmetFrame`'s 500 ms ornament `setInterval` off `setState` (it re-renders the whole
helmet subtree twice a second to change a few digits) onto a ref-driven text write.

**1A.6 — Load time.** Split `vendor-three` and `vendor-scene` so the GLB fetch starts
in parallel with JS parse rather than after it; preload the GLB from `index.html`.

*Risk:* low. Every item is behavior-preserving and independently revertible.
*Verification:* each change isolated, same camera/state baseline before and after, per
the project's one-variable rule.

### Path 1B — "Soften the artifact" (needs Andrew's eyes, as requested)

Ordered from "no visible change" to "genuine tradeoff", so Andrew can approve down
the list and stop wherever he likes.

**1B.1 — Decimate the seven screen plates.** 20,736 → ~1,000–1,500 tris each in the
Blender source. **Saves ~135,000 triangles, 39% of the model.** These are flat plates
whose entire appearance comes from the CanvasTexture and the clearcoat. If any CRT
bulge curvature exists, ~1,500 tris preserves it comfortably. This is the closest
thing to a free lunch in the whole document, and it is the first thing to show him.

**1B.2 — Decimate `Mesh.002`.** 108,812 → ~50,000. The shield body already carries a
2048² normal map, and normal maps preserve perceived surface detail through
decimation well — that is what they are for. Saves ~58,000 tris. Silhouette needs
checking at the rest pose; that is a real review item, not a formality.

**1B.3 — KTX2 / Basis compression.** 6 textures, ~80 MB VRAM → ~13 MB, and a smaller,
faster-decoding download. Adds a `KTX2Loader` and a transcoder to the bundle. Some
block-compression artifacts are possible on the normal maps — needs a real-browser
look, especially on the chrome.

**1B.4 — Medallion LOD.** A decimated variant swapped in when the performance monitor
reports sustained low fps. Only worth building if 1B.1–1B.3 prove insufficient.

Combined 1B.1 + 1B.2: **348,992 → ~156,000 triangles (−55%)**, with 1B.1 carrying
most of it at near-zero visual cost.

**Recommendation:** ship 1A first, then 1B.1 (screen decimation) — Andrew almost
certainly will not need to accept a softened artifact in the sense he was bracing
for. 1B.2 and 1B.3 are the ones that genuinely need his eyes, and 1B.4 probably never
gets built.

### Subtask — previewing the low-power version

Today `?force-3d=1` forces the full scene onto a weak device. There is **no inverse**.

Proposed, smallest useful change: `?lite=1` (alias `?view=lite`) in `App.tsx`, short-
circuiting straight to `<StaticFallback>` on any device. Roughly a four-line change
next to the existing `forceFullScene` check.

Worth pairing with `?quality=low|med|high` to pin the adaptive-DPR tier, so Andrew can
see what an auto-throttled machine actually looks like without owning one. Same
pattern as the existing `?lighting=` / `?tone=` / `?emblem=` preview flags.

`?perf=1` — a small corner readout showing fps, DPR, draw calls, and the active
quality tier — would make every tuning decision below measurable instead of felt.
Recommended alongside, since it is what makes the rest verifiable.

---

## Part 2 — Magic space background

Andrew's brief: sparse points of light in varied colors and sizes; fluorescent neon
sparks, trails, and filigree-motion streaks appearing rarely and randomly at close
range with depth variation. Curiosity, mystery, whimsy.

Andrew chose **hybrid**: real 3D depth for the field, screen-space for the close
streaks. Both paths below honor that.

### Constraints this has to respect

- **Hierarchy** (`CLAUDE.md`): warm mineral artifact primary; cool cyan belongs to the
  helmet/telemetry layer. A saturated rainbow starfield would compete with the
  medallion. Keep the ambient field **dim and mostly achromatic**, and let the rare
  neon events carry the color — rarity is what makes color read as an event rather
  than decoration.
- **Existing fog** — `near: 12, far: 34` on `#080a0d`. Anything beyond ~34 units fogs
  to pure background. The starfield shell must sit **inside** that range, or the fog
  needs a per-layer exemption. Easy to miss; would read as "the stars didn't work."
- **The `<Grid>`** — an `infiniteGrid` floor currently sits under the artifact. A
  starfield and a studio floor grid are different fictions. Whether the grid stays,
  fades, or goes is a real art-direction call for Andrew, not something to decide
  autonomously.
- `prefers-reduced-motion` must calm the streaks.
- Task 33 (per-page world-building) is still un-directed. This proposal covers the
  **hub void only**, and should be built so per-page variation can layer on later.

### Path 2A — "Deep field + visor sparks" (recommended)

**Layer 1 — the field (3D, real depth).** One `THREE.Points`, 3,000–5,000 vertices
distributed in a shell around the camera, with a custom `ShaderMaterial`. Per-vertex
attributes: size, color (from a curated palette), twinkle phase, twinkle rate.
Animation runs entirely in the vertex/fragment shader from a single `uTime` uniform.

> **One draw call. Zero per-frame CPU work. No geometry updates.** Cheaper per frame
> than a *single* one of the seven CRT screens is today.

Depth parallax comes free from the existing camera fly-to transitions.

**Layer 2 — the close sparks (3D, near camera).** A small instanced-quad system,
~24–48 instances, most idle at any moment. A cheap CPU spawner wakes one occasionally;
the shader handles its life cycle. These carry the depth variation Andrew asked for.

**Layer 3 — the filigree streaks (screen-space, on the visor).** A 2D canvas or SVG
layer inside `HelmetFrame`, above the WebGL canvas. Rare curved streaks tracing
filigree arcs and fading.

Putting the streaks here rather than in 3D is the strongest idea in this document:
they read as light moving **across the visor glass**, which is exactly the
smart-helmet fiction the site already commits to — and it satisfies "every element
must have a reason to exist and a place to exist in" from Phase 9. It is also nearly
free, and it is the one layer that can keep running at full quality on a weak machine
because it never touches the 3D budget.

*Cost:* ~2 draw calls added, one small CPU spawner, no new dependencies.
*Risk:* low. Fully additive; deletable in one commit.

### Path 2B — "Volumetric nebula" (richer, more expensive)

A single large inverted sphere or box with a fragment shader painting fbm-noise
nebula clouds, dust lanes, and stars in one pass, plus the same Layer 3 streaks.

Deeper and more genuinely "magic" — real depth in the clouds, colored gas, god-ray
suggestion. But the cost is **fullscreen fragment work**, which lands hardest on
exactly the contended machines Part 1 is trying to help, and it scales with DPR, so it
fights adaptive DPR rather than cooperating with it.

Viable if tiered: nebula at high quality, Path 2A's point field at low. That means
building both, so it is really "2A plus an upgrade" rather than an alternative.

*Recommendation:* not first. Revisit once 2A is live and the perf headroom from Part 1
is measured rather than projected.

### Path 2C — screen-space only (mentioned for completeness)

Everything as a 2D parallax layer behind the canvas. Cheapest possible; loses the
depth Andrew explicitly asked for. Listed only so the tradeoff is on record.

### How this interacts with Part 1

Path 2A's field is roughly **one draw call and no per-frame CPU work**. Set against a
current baseline of ~54 MB/s of texture upload from the CRT screens, the atmosphere is
not a meaningful share of the budget.

This is the substantive answer to Andrew's tradeoff question: **the choice between
"cut the magic" and "soften the artifact" is close to a false one.** Path 2A costs
roughly nothing next to what 1A.1 alone gives back. The order that follows — fix the
waste, then decimate the screens, then add the space, then decide about 1B.2/1B.3
with real headroom numbers in hand — likely ends with the site both faster *and* more
atmospheric than it is today, with the artifact untouched.

If a machine still struggles after all of that, the graceful degradation order should
be: streak frequency → spark count → DPR floor → star count → medallion LOD. The
artifact softens **last**, not first — and on current evidence, probably never.

---

## Open questions for Andrew

1. **The floor grid.** Does `infiniteGrid` stay, fade, or go once there is a starfield?
   Art direction, not a technical call.
2. **Palette discipline.** Proposal is a dim, mostly-achromatic field with rare
   saturated neon events. Confirm before building — this is the main risk of the
   background competing with the medallion.
3. **1B.2 and 1B.3** (shield decimation, KTX2) need a real-browser A/B. 1B.1 (screen
   decimation) almost certainly does not, but it is cheap to show anyway.

## Suggested order

1. `?lite=1` + `?perf=1` — makes everything after this measurable. (Small.)
2. 1A.1 — the CRT screen loop. Biggest win, invisible.
3. 1A.2 — adaptive DPR.
4. 1A.3–1A.5 — aurora, governor, cleanup.
5. 1B.1 — screen-plate decimation in Blender. Show Andrew.
6. 2A Layers 1–3 — magic space.
7. Re-measure. Decide on 1B.2 / 1B.3 with numbers, not guesses.
