# Lighting Session Plan — "Object Emerges From Darkness"

Status: planning doc, not yet executed. Written 2026-07-12 per Andrew's 2026-07-11
design intent. Read-only inputs: `client/src/scene/Environment.tsx`,
`client/src/components/SceneExperience.tsx`, `client/src/scene/MedallionHub.tsx`,
`docs/medallion-glb-notes.md`.

## 1. Diagnosis

- `Environment.tsx`: flat `#1a1a1a` background + fog `["#1a1a1a", 15, 40]`, an
  infinite drei `<Grid>` at y=-3, and a generic white three-point rig —
  `ambientLight intensity=0.4`, `directionalLight position=[5,10,5]
  intensity=0.8`, `pointLight position=[-5,5,-5] intensity=0.3`. No color
  temperature intent anywhere.
- `SceneExperience.tsx:154` also mounts `<DreiEnvironment preset="city" />` —
  a neutral/cool baked HDRI supplying IBL for all `MeshStandardMaterial`/
  `MeshPhysicalMaterial` reflections + ambient. Its cool gray tones wash
  across `body_warm_metal`'s mineral browns and the chrome bezels — this IBL
  is the dominant light source for anything metallic/glassy and is why the
  medallion reads corporate/cool instead of warm-dark. Biggest lever here.
- `<Canvas>` (`SceneExperience.tsx:148-152`) sets no `gl.toneMapping`/
  `toneMappingExposure` — R3F defaults to `ACESFilmicToneMapping` at exposure
  1, which compresses highlights and slightly desaturates warm tones; stacked
  on the cool IBL it flattens mineral warmth further. `dpr={[1,1.5]}`, no
  bloom/post pipeline mounted anywhere in `client/src` yet.
- `MedallionHub.tsx` clones every material per-mesh (lines 70-72), so runtime
  mutation is already safe. Screens ship emission black/zero (per
  `medallion-glb-notes.md`); `ScreenWakeManager` (`wake.attach`/`wake.update`,
  lines 111-124) drives bezel hover glow to `HOVER_BEZEL_EMISSIVE = #67a9ff`
  (cool blue, line 33) — the cool-accent-on-hover language the aurora/AR
  direction wants already exists, just not echoed in ambient light or bloom.

## 2. Proposals

**A. Replace `preset="city"`.**
A1 (~30 min, cheapest): swap to drei's `"night"` preset — darkest, least IBL
fill, lets manual lights dominate. One line: `SceneExperience.tsx:154`.
A2 (~2-3 hrs, recommended): replace the preset with a custom drei
`<Environment resolution={256}>` + `<Lightformer>` panels — no external HDR
download (stays code, not art): one warm-amber panel upper-front (mirrors the
Blender "soft warm key upper-front"), one narrow cool-cyan strip behind/rim
(mirrors the future aurora accent). Bakes the two-temperature split into
specular reflections themselves, not just point lights. Keep A1 as a 10-min
fallback if A2's chrome reflections read too busy.

**B. Manual 3-light rig (~1 hr).** Replace `Environment.tsx:20-22`:
soft warm key upper-front (`directionalLight`/`spotLight`, ~`[3,6,4]`, color
`#ffdcb0`-ish, intensity 0.9-1.1); weak cool-neutral fill (~0.15-0.25,
preserve "rich shadow retention" — do not flatten with ambient); cool rim
(`pointLight`/`spotLight` behind/side, e.g. `[-5,3,-6]`, `#7fd8ff`-ish,
0.3-0.4) that visually rhymes with `HOVER_BEZEL_EMISSIVE`. Drop or gut the
flat `ambientLight intensity={0.4}` — main culprit killing contrast.

**C. Per-material `envMapIntensity` (~30 min, live tweak loop).** Since
materials are already cloned per-mesh (`MedallionHub.tsx:70-72`), branch on
`child.name` right after clone: body ~0.6-0.8 (protects the baked mineral
albedo), chrome bezel ~1.2-1.5 (chrome IS its reflection), glass screen
~0.4-0.6 (reflective but not bright pre-wake, per spec).

**D. Tone mapping & exposure (~20 min).** Add `gl={{ ...,
toneMapping: THREE.ACESFilmicToneMapping }}` to `SceneExperience.tsx`'s
`<Canvas>` explicitly, and A/B against `THREE.AgXToneMapping` (three r160+,
handles saturated warm/cool splits with less highlight desaturation — good
fit for two deliberately separated color families). Expose
`toneMappingExposure` as one tunable (try 0.9-1.1) — the dark mood wants
slight underexposure, not just dark albedo.

**E. Screens as light sources — emissive + selective bloom (~1 day, biggest
lift).** `ScreenWakeManager` already ramps emissive per screen on hover/wake
(`MedallionHub.tsx:111,121,134`) — wiring exists. Add
`@react-three/postprocessing`'s `<EffectComposer>` + `<SelectiveBloom>` (or
`<Bloom>` with a luminance threshold above the dormant-screen base) in
`SceneExperience.tsx`. New dependency — check bundle size and confirm unused
passes tree-shake. Perf: bloom is full-screen multi-pass; must gate behind
the existing weak-device static-fallback check (root `CLAUDE.md`
Architecture section), never render unconditionally. This is what makes the
CRT-wake glow feel like a true diegetic light source.

**F. Background/void (~45 min).** Tighten fog near distance (e.g. 8-10, from
15) and/or darken fog color a shade below background so geometry recedes into
black faster. Dim `<Grid>`'s `cellColor="#404040"`/`sectionColor="#808080"`
~40-50% and/or tighten `fadeDistance`/`fadeStrength` so the grid recedes
instead of competing with the medallion. Consider a radial vignette (cheap
CSS `radial-gradient` overlay first, shader pass later) previewing the
helmet-AR framing direction.

## 3. Verification plan

- **Real browser only** — the sandboxed preview browser cannot render WebGL.
- Confirm `/?force-3d=1` (`client/src/App.tsx:13`) still bypasses the
  static/mobile fallback so changes are reachable during testing.
- Per proposal: run dev server, load `/?force-3d=1`, screenshot (1) hub idle,
  (2) one screen hovered (bezel glow + wake emissive), (3) camera at a couple
  `flyTo` page positions from `sceneConfig.ts` — lighting must hold off-axis.
- Cross-check against a Blender still from
  `~/clawd/CLI-Anything/blender/projects/personal-site-medallion/` for mood
  parity (warm body in shadow, controlled chrome hits, black-but-reflective
  dormant screens).
- If E ships, confirm the weak-device static fallback still renders sanely
  and doesn't silently inherit a bloom-dependent look that never shows.

## 4. Session prompt (paste to a fresh Claude/Alfred session)

```
Goal: bring the site's lighting toward the Blender renders' "object emerges
from darkness" mood — warm mineral body with rich shadow retention, controlled
chrome hits, dormant black screens that still read reflective — while
reserving cool cyan/aurora tones for the future smart-helmet AR frame accents,
NOT the object itself. Two temperature families, deliberately separated: warm
stays on the medallion, cool stays at the edges/on hover accents.

Files to read first (read-only, verify current line numbers, don't assume):
- client/src/scene/Environment.tsx (lights, fog, grid)
- client/src/components/SceneExperience.tsx (Canvas, DreiEnvironment preset)
- client/src/scene/MedallionHub.tsx (material clone loop, ScreenWakeManager,
  HOVER_BEZEL_EMISSIVE = #67a9ff — rhyme with this, don't fight it)
- docs/medallion-glb-notes.md (baked mineral body, chrome placeholder, glass
  dormant-emission-zero)
- docs/plans/lighting-session.md (this doc — full proposal set)

Constraints:
- No AI-generated art assets (root CLAUDE.md hard constraint) — procedural/
  code lighting and post effects are fine.
- Do not edit master-build-plan.md, feedback.md, or progress-log.md unless
  explicitly asked.
- Respect the weak-device static fallback — gate any postprocessing (bloom),
  never render it unconditionally.
- Verification only works in a real browser (/?force-3d=1); the sandboxed
  preview cannot render WebGL — no "looks right" claims without a screenshot.

Acceptance criteria:
- Medallion body/chrome read warm and dramatic against a darker void.
- Cyan/aurora accents appear only at hover/edge/future-frame contexts, never
  as the dominant light on the object.
- Dormant screens still read as reflective black glass, not flat/dead.
- No regression to the weak-device fallback path.

Process: prototype ONE proposal from section 2 first (recommend A1 preset
swap + B manual rig — cheapest, most reversible), screenshot real-browser
before/after, get Andrew's eyes on it before rolling out further proposals.
```
