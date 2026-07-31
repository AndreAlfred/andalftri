# Mobile / low-power performance — research findings

**Date:** 2026-07-30
**Method:** five-advisor council (Sonnet subagents) + an adversarial verification
pass that read the repo rather than trusting the briefs.
**Status:** research only. No code changed. Needs Andrew's routing decision before
implementation.

---

## Read this part first

The council produced five confident briefs. The verification pass then read the
actual code and **killed three of their headline claims**. This is `lessons.md`
entry M repeating itself, so it is worth stating plainly before anything else:

| Council claim | Verified reality |
|---|---|
| "Touch is broken — phone users can never reach the content" | **False.** `useScrollInteraction.ts:107-126` has real `touchstart`/`touchmove`/`touchend` handlers driving the same commit logic as wheel. `MedallionHub.tsx:298` uses R3F `onClick`, which is pointer-based and fires on touch. `CyberspaceNav.tsx:28` is a real `<button>` jump list reachable from the HUD toggle. `screenWake.ts:8` documents lighting screens at boot *specifically* to solve touch. |
| "Ship the unused `useGyroscope` hook" | **Already shipped.** `useMouseParallax.ts:4,19,61` swaps gyroscope in for mouse parallax on touch devices and requests `DeviceOrientationEvent` permission on `touchstart`. |
| "Compress the GLB — add Draco / meshopt / WebP / KTX2" | **Draco and WebP already done.** `extensionsRequired` = `["KHR_draco_mesh_compression", "KHR_materials_clearcoat", "EXT_texture_webp"]`. |
| "Loading is opaque, no progress indicator" | **False.** `LoadingScreen.tsx:11,20-30,101-124` uses drei `useProgress()` and renders a real numeric percentage and a filling bar. |
| "`StaticFallback` is a consolation stub" | **False.** `StaticFallback.tsx:60-145` renders the real `PAGES` nav, `ProjectPanel`, and `InfluencePanel` with working client-side routing. It is the actual portfolio, minus the hub. |

Every one of those errors was in the *mapping* of a true general fact onto this
code, not in the fact itself. The generalizable version is already in
`lessons.md` entry M; this session is its second confirmation.

**What survived verification is below. Only act on that.**

---

## Verified GLB facts (parsed directly, not estimated)

- 2,913,816 bytes total; single embedded BIN chunk of 2,900,408 bytes.
- **348,992 triangles** — matches the in-code comment.
- 50 accessors, 17 meshes.
- Geometry is **Draco-compressed** (required, not just used).
- 6 textures, all `image/webp`, all embedded:
  - `shield_body_{normal,basecolor,roughness}` — **2048×2048** each
  - `medallion_core_{normal,basecolor,roughness}` — **1024×1024** each

---

## Finding 1 — the Canvas mounts at maximum quality before anything is measured

**This is the highest-value finding and no advisor caught it.**

`SceneExperience.tsx:197-207`:

```tsx
<Canvas
  camera={{ position: [0, 0, 8], fov: 60 }}
  dpr={1.5}
  gl={{ antialias: true, powerPreference: "high-performance", ... }}
>
```

`dpr={1.5}` is the **top rung** of `DPR_LADDER`. `AdaptiveQuality` only starts
correcting after drei's `PerformanceMonitor` has accumulated samples, and it is
deliberately slow to move — `factor={1}` (start optimistic), `step={0.15}`
(bounded movement), `flipflops={3}`. So every device, including the weakest
phone on the worst thermal day, renders the first several seconds at the highest
tier's resolution.

Why this matters more on a phone than the steady-state numbers do:

- Those first seconds coincide exactly with GLB decode, Draco decompression,
  texture upload, and the boot sequence — the frame budget is already the most
  contended it will ever be, and that is precisely when we ask for the most
  pixels.
- It is a **thermal** event, not just a slow-frames event. Phones throttle on
  accumulated heat. Spiking hard at t=0 lowers the ceiling for the whole rest of
  the session — the visitor pays for those seconds minutes later.
- The adaptive system is structurally incapable of preventing it. A monitor that
  reacts to measured frames cannot react to the frames before the first
  measurement.

**The fix is conservative-start, not a new mechanism:** derive the initial `dpr`
prop from a cheap synchronous signal (`matchMedia("(pointer: coarse)")`,
`navigator.hardwareConcurrency`, `navigator.deviceMemory`) and let
`PerformanceMonitor` climb *up* from there. This inverts the current posture from
"assume the best, get corrected" to "assume modestly, earn the top rung." Note
`factor={1}` would also need to start lower for the climb to be meaningful.

*Caveat worth measuring rather than assuming:* `antialias: true` is a real cost
on immediate-mode desktop GPUs but is comparatively cheap on Apple's tile-based
deferred renderers, which resolve MSAA on-tile without a full-resolution
round-trip to memory. Do not remove it on theory — measure it.

---

## Finding 2 — texture memory is the likely iOS Safari failure mode

Nobody in the council costed this, and it may be the difference between "laggy"
and "the canvas goes blank."

WebP is a *transport* format. On upload the GPU stores uncompressed RGBA:

| Texture set | Resolution | GPU bytes |
|---|---|---|
| `shield_body_*` ×3 | 2048² | 3 × 16.8 MB = **50.3 MB** |
| `medallion_core_*` ×3 | 1024² | 3 × 4.2 MB = **12.6 MB** |
| Subtotal | | 62.9 MB |
| With mip chains (×1.33) | | **~84 MB** |
| 7 CRT canvas textures (256²) | | ~2.4 MB |

~86 MB of texture residency, before the framebuffer, before the starfield and
spark buffers, before three.js's own overhead. iOS Safari's WebGL memory ceiling
is tight and the failure mode is not a slow frame — it is **context loss**, a
black canvas.

Two routes, in increasing cost:

1. **Ship a 1024² variant of the `shield_body` set for coarse-pointer devices.**
   Drops ~38 MB. Requires a Blender re-export, so it is a medallion-contract
   change, not a website change — see `docs/medallion-glb-notes.md`.
2. **KTX2 / Basis supercompression**, which stays compressed *in GPU memory*
   (~4 MB total rather than ~63 MB). This is the technically correct answer and
   it is what the format exists for. It costs a transcoder dependency, which
   `CLAUDE.md` says must be bundle-and-device-checked before adoption. Worth
   pricing, not worth adopting blind.

There is also no `webglcontextlost` handler anywhere in the repo. Given the
above, one is cheap insurance regardless of which route is taken.

---

## Finding 3 — the helmet CSS is completely outside the quality system

**Verified true.** The tier never reaches the DOM: no `classList`, no
`data-tier`, no CSS custom property carries it. Meanwhile `VisorChrome.tsx:30-33`
renders **four full-viewport layers**, and `index.css:373,383-384` gives each one:

```css
mask-image: radial-gradient(...);
filter: blur(2vmin);
animation: helmetAuroraPulse 12s ease-in-out infinite;
```

Plus a fifth static blurred+masked layer, `.helmet-peripheral-blur`
(`index.css:320-327`).

The only gate on any of it is `prefers-reduced-motion` (`index.css:625-642`) —
an OS accessibility setting, not a performance signal. So a device that has
already stepped down to `low` tier, cut its stars by 60% and its DPR to 1.0, is
still compositing four animated full-viewport blurred and masked layers.

This is the cleanest structural gap in the whole system, and it is also the one
most likely to dominate on mobile: blur is a fill-rate and compositor cost, it
scales with viewport area, and it is entirely invisible to every WebGL-side
measurement the site takes.

The mechanism is small — write the tier to a `data-quality` attribute on the
root element and let existing CSS custom properties respond. **The values are an
art-direction decision and need Andrew's eyes.** The wiring does not.

`lessons.md` entry H is directly relevant: a previous session found
`transform: scale()` on these filtered layers was forcing a full per-frame
repaint. That the blur radius has been A/B'd but the *layer count* never has is
the same shape of gap.

---

## Finding 4 — no `document.hidden` gate on the CRT redraw loop

**Partially true, and the partial matters.** `screenWake.ts:503-505` *does*
throttle: `grainInterval` comes from the tier's `grainHz`, and it drops to
`DIMMED_GRAIN_HZ` (6 Hz) when hub opacity is low. So the "ungated" framing from
the 2026-07-21 session is out of date — visibility-linked gating exists for the
panel-open case.

What genuinely does not exist anywhere in the repo is a `visibilitychange` /
`document.hidden` check, or any frustum/distance skip. Seven canvases keep
redrawing at up to 20 Hz in a backgrounded tab, relying only on rAF throttling
implicitly. On a phone, a backgrounded tab that keeps doing canvas→upload→mip
work is a battery complaint waiting to happen.

Cheap, zero visual risk, uncontroversial.

---

## Finding 5 — the Apple GPU rule cannot distinguish an iPhone from a MacBook

**Verified true**, `deviceCapability.ts:31-35`:

```ts
const gpuName = (result.gpu ?? "").toLowerCase();
const appleGpuQuirk = gpuName.includes("apple");
const isWeak =
  result.type === "WEBGL_UNSUPPORTED" ||
  (result.tier <= 1 && !appleGpuQuirk && result.type !== "FALLBACK");
```

Four of five advisors called this the fatal flaw. **They overstated it**, and the
correction is worth recording: because touch, gyroscope, and jump-nav all work,
routing an iPhone into the full scene is not the broken-experience catastrophe
the council described. It is a *tuning* problem, not an access problem.

But the rule is still doing something it was never designed to do. It was
written for one reason — stop Andrew's M-series MacBook getting punted to
`StaticFallback` (`lessons.md` entry D) — and it accidentally became the policy
for every iPhone and iPad ever made, spanning about nine years of silicon, with
no signal distinguishing them.

The narrow fix preserves entry D's intent while removing the overreach: keep
"Apple ⇒ not weak", but stop treating "not weak" as "top tier." Combine the GPU
string with `navigator.maxTouchPoints` and screen dimensions to pick a *starting
tier*, which is also exactly what Finding 1 needs. The two fixes are the same
fix.

---

## Finding 6 — the quality ladder has one lever and a floor it can hit

**Verified true.** `useQuality.ts:56-66`: `setDpr` derives
`tier = tierForDpr(dpr)` and re-derives the entire profile from it. There is no
independent control of `starCount` / `sparkCount` / `streakCount` / `grainHz` —
they move only when a DPR change crosses a `tierForDpr` boundary. Everything is
downstream of one number.

`DPR_LADDER = [1, 1.15, 1.3, 1.5]` has no sub-1.0 rung, and
`AdaptiveQuality.tsx:61` has `onFallback={() => applyTier("low")}` as the last
resort. So `low` / DPR 1.0 is a **hard floor with nothing beneath it**. A phone
that is still dropping frames at `low` has no remaining move.

Note the floor was raised deliberately on 2026-07-22 — the old 0.75 rung was a
legibility cliff for the small screen text, and it shipped alongside the mipmap
regression (`lessons.md` entry J), which means **sub-1.0 DPR has never actually
been evaluated on its own**. Its one trial was confounded by a genuine sampling
bug in the same commit.

That is worth re-testing specifically on mobile, where the argument is different
from desktop: a phone at CSS-pixel DPR 1.0 is already rendering below its native
3× device pixel ratio, and it is held closer but at far higher physical pixel
density. Whether the desktop legibility cliff exists at all on a phone is an
open, testable question — and it is Andrew's call, not an autonomous one.

---

## Recommended sequencing

**Tier A — mechanism only, no art-direction decision, safe to implement:**

1. `document.hidden` gate on the `screenWake` redraw loop (Finding 4).
2. Write the quality tier to the DOM as a `data-quality` attribute (Finding 3
   wiring — *not* the values).
3. Add a `webglcontextlost` handler (Finding 2 insurance).
4. Derive a conservative initial `dpr` and starting tier from `pointer: coarse` +
   `maxTouchPoints` + screen size; lower `PerformanceMonitor`'s `factor` so it
   climbs (Findings 1 and 5 — one change).

**Tier B — needs Andrew in a real browser:**

5. What the aurora layers actually do at `low` (blur radius? layer count? Entry G
   applies: thin, never switch off — keep every rung non-zero).
6. Whether sub-1.0 DPR is acceptable *on a phone specifically*, now that the
   confounding mipmap bug is fixed.

**Tier C — costed decision, not a task:**

7. `shield_body` at 1024² for mobile (Blender re-export, medallion contract), or
   KTX2/Basis (dependency + bundle check). Price both before choosing.

**Measurement protocol** — none of the council proposed one, and per
`lessons.md` entry E this is the part that decides whether any visual tradeoff is
needed at all. Before changing anything: Chrome remote-debug a real phone against
`?perf=1`, capture a **sustained 90-second** trace (not a snapshot — thermal
throttling means second 3 and second 90 are different machines), and record GPU
frame time vs. compositor/paint time vs. main-thread JS separately. That split is
what tells you whether Finding 1, 2, or 3 is actually dominant here. Everything
above is mechanism-level reasoning; only the trace makes it a measurement.

---

## Where the council was actually useful

Stripped of the unverified claims, three ideas justified the exercise:

- **Reframing mobile as a different physical machine, not a slower one** —
  tile-based deferred rendering, memory bandwidth, sustained thermal ceiling, and
  viewing distance are four separate constraints, and only the first is what
  "optimization" usually means. Findings 1–3 all descend from this.
- **Viewing distance as art-direction permission.** Detail that is imperceptible
  at arm's length on a 6-inch panel is not a sacrifice to remove. That is a
  genuinely useful frame for the publication gate: it converts some of what looks
  like degradation into fidelity-to-intent.
- **A phone is a held object with an orientation sensor.** The specific
  recommendation was already implemented, but the underlying observation — that
  the smart-helmet metaphor is *more* literal on a device you physically tilt —
  is worth keeping for whenever task 33 world-building gets Andrew's direction.
  Recorded here, not acted on, per the standing rule against inventing spatial
  direction autonomously.
