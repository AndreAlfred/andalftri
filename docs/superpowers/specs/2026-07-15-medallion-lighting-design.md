# Medallion Lighting Design

**Date:** 2026-07-15  
**Status:** Approved by Andrew; Studio ACES selected on 2026-07-16
**Scope:** The capable-device React Three Fiber scene, centered on the medallion hub  
**Supersedes:** The warm-amber key and broad cyan-rim proposals in `docs/plans/lighting-session.md`

## 1. Outcome

The medallion should read first as a hand-made mineral machine emerging from a
dark void. Its baked copper, brown, and mineral variation supplies the warmth;
the scene lighting does not repaint it yellow. A broad neutral-white key reveals
most of the front face while the recesses, lower edges, and sides retain deep
contour shadows. The helmet's aurora contributes only a faint blue-steel trace
on chrome, black glass, screen edges, and hover states. It does not cast a cyan
wash across the copper body.

The intended hierarchy is:

1. **Artifact:** warm, tactile, sculptural, mysterious.
2. **Screens and chrome:** reflective black and controlled silver, with small
   cool catches.
3. **Helmet interface:** the dominant home of cyan and aurora color.
4. **Void and grid:** quiet spatial context, never a competing subject.

## 2. Authorship Boundary

No generated image, HDR panorama, texture, illustration, model, or decorative
asset will be added. The lighting system may use code-authored lights,
reflection cards, colors, and renderer settings. These are technical controls
applied to Andrew's hand-modelled and hand-directed Blender artifact; they do
not invent a replacement visual object.

AI assistance in this work is limited to:

- translating Andrew's taste decisions into renderer parameters;
- operating and editing the code that presents his Blender work;
- producing reversible comparisons and diagnostics;
- checking performance, compatibility, and regressions.

## 3. Approved Taste Decisions

The visual-companion session established four decisions:

- **Emotional center:** an unearthed mineral machine, not a clean product render
  or a cold alien prop.
- **Light color:** neutral white. Warmth comes from the baked material, not a
  yellow light concentrated in the upper-left.
- **Shadow depth:** deep contours. Consistent light color does not mean uniform
  brightness; the object must retain darkness, material variation, and mystery.
- **Cool boundary:** a blue-steel edge signal. Cyan may appear as a restrained
  reflection on chrome/glass and as existing screen/hover emission, but never as
  broad physical fill on the copper.

## 4. Chosen Technical Approach

Use a **controlled procedural studio rig** rather than the current generic city
environment, a photographic HDRI, or direct lights alone.

The rig separates four jobs that are currently mixed together:

1. A broad direct key controls how the mineral surface is revealed.
2. Static reflection cards give the metallic and glass materials intentional
   shapes to reflect.
3. Per-material reflection response prevents the body, chrome, and glass from
   receiving the environment at the same strength.
4. Explicit tone mapping and exposure preserve color variation and shadow depth.

Direct lights alone are not sufficient because chrome and black glass need an
environment to reflect. A stock panorama is not suitable because its colors and
highlight shapes would control the artifact, and it would add another art asset
whose authorship is outside this project.

## 5. Scene Architecture

### 5.1 `client/src/scene/lightingConfig.ts` — one tuning surface

Create a small typed configuration module containing the initial colors,
intensities, exposure, environment resolution, fog, grid, and per-material
reflection strengths. Values remain code, not user content. Centralizing them
prevents future sessions from scattering taste-sensitive numbers through
multiple components.

The starting values are calibration ranges, not claims that the first render is
finished:

| Control | Starting direction |
| --- | --- |
| Key color | Neutral white (`#f7f8fa` to `#ffffff`) |
| Key direction | Broad, front/upper-center; only a slight lateral bias |
| Ambient fill | Very weak neutral fill, approximately 10–20% of the current level |
| Main reflection card | Large, soft, neutral-white |
| Secondary neutral cards | Narrower cards that create readable chrome gradients |
| Cool reflection card | Blue-steel, narrow, low-energy, behind/side of the object |
| Environment capture | 256px, captured once rather than every frame |
| Exposure | Slightly under neutral, initial comparison around `0.9–1.0` |
| Body/core environment response | Restrained, approximately `0.45–0.7` |
| Chrome/@ environment response | Strongest, approximately `1.1–1.4` |
| Black-glass environment response | Moderate, approximately `0.7–1.0` |

### 5.2 `client/src/scene/ArtifactLighting.tsx` — the controlled studio

Create a dedicated lighting component containing:

- a large neutral-white direct key aimed across most of the medallion face;
- only enough neutral fill to prevent the shadow side becoming featureless;
- a Drei procedural environment captured once from code-authored
  `Lightformer` cards;
- large neutral cards for clean chrome/glass gradients;
- one narrow, weak blue-steel card placed to produce an edge reflection rather
  than illuminate the copper as a direct cyan light.

There will be no warm/amber direct light. There will be no cyan point, spot, or
directional light in the first pass. The cool signal comes through reflection
and the existing emissive interface behavior, which makes its material boundary
controllable.

The direct key remains independent from the environment capture. If the
reflection environment fails or is slow to initialize, the artifact remains
visible rather than disappearing into black.

### 5.3 `client/src/scene/Environment.tsx` — atmosphere, not a second rig

Keep ownership of the void, fog, and grid here, and mount `ArtifactLighting`
from this component. Remove the existing generic ambient/directional/point trio
once the studio rig is active.

The void moves closer to near-black, consistent with the helmet shell. Fog and
grid values are tightened and dimmed so the grid establishes space without
lifting the whole frame or competing with the medallion.

### 5.4 `client/src/components/SceneExperience.tsx` — renderer contract

Remove the always-on `<DreiEnvironment preset="city" />` when studio lighting is
active. Set tone mapping and exposure explicitly rather than relying on R3F
defaults.

The first implementation compared Three.js AgX and ACES in the same real
browser and viewport. AgX was the proposed default because the goal was to
retain the copper hue and material variation under bright neutral highlights.
Exposure started slightly below neutral; neither setting was accepted from
theory alone.

On 2026-07-16, Andrew reviewed the live matched-exposure comparison and selected
ACES. Studio ACES at exposure `0.92` is therefore the public/default renderer
pair. Studio `?tone=agx` remains available for matched-exposure comparison,
explicit `?tone=aces` remains accepted, and unknown tone values fall back to
ACES. The complete legacy city-HDR/direct-light rig remains available through
`?lighting=legacy` with ACES at exposure `1`.

Do not add a post-processing composer in this pass.

### 5.5 `client/src/scene/MedallionHub.tsx` — material roles

The GLB already clones every mesh material, so per-instance tuning is safe.
Classify cloned materials by the stable mesh naming contract:

- `shield_body` and `medallion_core`: restrained environment response;
- `section_0N_bezel` and `medallion_at`: strongest response;
- `section_0N_screen`: moderate response so dormant/dark areas remain black but
  retain a controlled reflection.

The baked base-color, roughness, and normal textures remain authoritative. No
runtime tint should be used to manufacture warmth. Existing screen boot,
always-readable labels, hover lift, and bezel-emissive behavior remain
functionally unchanged during the first lighting pass. Their brightness may be
rebalanced only if the neutral rig proves that they overpower the artifact.

## 6. Render and Interaction Flow

1. The capable-device path loads the current 3D scene and human-made GLB.
2. The static 256px procedural environment is captured once.
3. The broad white key reveals the baked mineral surface.
4. Material-role strengths determine how much each surface sees the reflection
   cards.
5. The screen boot cascade and hover behavior continue to supply diegetic light
   cues.
6. Lemniscate drift and proximity tilt move the medallion through the fixed rig,
   allowing reflection gradients to change subtly without changing the overall
   color hierarchy.
7. Camera navigation and hub fading continue unchanged.

## 7. Controlled Rollout and Recovery

Lighting is inherently visual, and the managed preview environment has a known
WebGL-readback limitation. Use a two-stage rollout:

1. Ship the studio rig behind `?lighting=studio`, while the default remains the
   existing rig. Andrew compares the same live deployment in his real browser.
2. After Andrew selected ACES in the live comparison on 2026-07-16, make Studio
   ACES the default and retain `?lighting=legacy` temporarily as an instant
   rollback path. Retain Studio `?tone=agx` as the matched-exposure comparison.

No query string and unknown lighting values select Studio ACES. Only
`?lighting=legacy` selects the complete previous rig.

No new network-hosted HDR asset or dependency is introduced. If the procedural
environment causes a runtime problem, the legacy query path and independent
direct key provide recovery without reverting the entire feature commit.

## 8. Performance Guardrails

- Environment resolution is 256px and captured once (`frames={1}`).
- Do not enable real-time cube-map updates.
- Do not add bloom, selective bloom, SSAO, contact shadows, or a new
  post-processing dependency in the first pass.
- Do not enable dynamic shadow maps for the moving ~349k-triangle medallion in
  the first pass. The baked normal/roughness detail, direct-light falloff, and
  reflection contrast establish form first.
- Preserve the existing capped DPR and weak-device static fallback.
- Do not change the GLB, its texture resolution, screen-canvas resolution, or
  30Hz screen redraw loop as part of this lighting task.

Bloom or shadows may be evaluated later only when they solve a named visual
defect and can be gated for capable hardware.

## 9. Verification

### Automated checks

- `pnpm check`
- `pnpm build`
- Confirm the build introduces no new package and no new remote art/HDR request.
- Confirm the static fallback still renders and links correctly.
- Confirm both `?lighting=studio` and the legacy path load without console or
  asset errors.

### Real-browser visual matrix

Capture the same viewport and camera state for legacy and studio modes:

1. Hub after the boot cascade settles.
2. Hub while one assigned section is hovered.
3. Medallion at the natural idle pose.
4. Medallion near both extremes of its motion envelope: idle yaw up to
   approximately ±15° and cursor proximity tilt up to approximately ±8°.
5. Hub receding during a page transition.
6. At least one narrow/mobile viewport on the capable-device path.
7. A local diagnostic with screen emission temporarily disabled, solely to
   confirm that the underlying black glass remains reflective.
8. A `?classic=1` smoke check so the retained placeholder hub does not become
   unreadable under the new global rig.

ACES and AgX were compared at matched exposure before Andrew selected ACES on
2026-07-16. For any future tuning, change one variable family at a time:
environment, direct rig, material response, then exposure/tone mapping.

## 10. Acceptance Criteria

The lighting session is complete only when Andrew confirms the real-browser
studio view and all of the following hold:

- The object reads as a warm mineral artifact in a dark void, not as a yellow-lit
  prop.
- Neutral-white light covers most of the front face while recesses and outer
  forms retain meaningful shadow.
- The baked copper/brown color variation is more visible than in the current
  city-lit version and does not look washed out.
- Chrome has shaped, controlled gradients rather than flat gray or blown-white
  patches.
- Black glass remains visibly reflective without becoming gray plastic.
- Cyan is limited to the aurora relationship: screens, hover states, glass, and
  thin chrome edge catches. The copper body has no broad cyan wash.
- The look remains coherent during idle motion, tilt, hover, and camera travel.
- Screen labels remain readable and navigation remains usable.
- The weak-device fallback, build, and type check do not regress.

## 11. Explicit Non-goals

- No final website copy.
- No Cottage route/screen implementation.
- No Contact taxonomy refactor.
- No Blender mesh, UV, texture, or material re-authoring.
- No AI-generated visual asset.
- No bloom or shadow polish before the base rig is approved.
- No attempt to reproduce the old Blender still pixel-for-pixel; it is a mood
  and material reference, while the live artifact must hold up in motion.
