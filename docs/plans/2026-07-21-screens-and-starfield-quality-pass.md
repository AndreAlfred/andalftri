# Screens + starfield quality pass — plan (2026-07-21, round 2)

Andrew's review after the magic-space round. Working plan; steps get crossed off
as they land.

## Andrew's report, verbatim-ish

1. Screen text is **hard to read** after a recent change — blurrier, plus "a weird
   scanning effect that looks like ripples being sent across the words". Gives him a
   headache.
2. **All stars are the same size.** Wants a realistic starfield; says to research
   rather than invent.
3. Some stars are **grey and read as green**. Dislikes them. **Blues are too blue.**
4. **Reduce star frequency by at least 30%** — sparser.
5. Shooting stars are liked, but the **glowing head looks strange on some colours**.
6. Shooting stars are **all the same distance** from camera. Wants variety in
   position, speed and size — but **nothing much bigger than current**.
7. **Anything moving very slowly must be far away**, to preserve the depth illusion.
8. The **giant floating "sparks" read as coloured blobs**, not sparks.
9. Sparks **clip behind the screens but in front of the artifact** — obviously wrong.
10. No spark should be **as large as the "contact" screen**.
11. Sparks should appear in **randomly sized groups**, not only singly.
12. Sparks should be **about half as frequent**.

## Root-cause notes (filled in as diagnosed)

- [x] **1 — screen text.** (two causes, not one) Self-inflicted, in the 2026-07-21 perf pass. I set
  `generateMipmaps = false` + `minFilter = LinearFilter` on the seven screen
  CanvasTextures, justified with "the screens are viewed at a roughly constant
  distance and never minify meaningfully". That assumption was wrong: the plates are
  angled and small on screen, so the 256² texture IS minified, and without a mip
  chain a minified texture is point-ish sampled from the base level. The 1px
  scanlines at a 3px pitch are then guaranteed to alias — and because the medallion
  drifts on the lemniscate, the aliasing pattern crawls. That crawl is exactly the
  "ripples being sent across the words". Confirmed by research agent against the
  installed three.js source: with `minFilter = LinearFilter` the GPU computes the LOD
  and then *discards* it, sampling 4 texels of level 0 no matter how many texels the
  pixel actually covers. Setting `LinearFilter` also silently disabled anisotropic
  filtering — three.js returns early from the anisotropy call for any non-mipmap min
  filter — which matters because these plates are viewed obliquely.
  **Second cause, caught by the adversarial verifier:** adaptive DPR shipped in the
  *same commit*. `DPR_LADDER` bottoms out at 0.75, so a machine that stepped down was
  also literally rendering at three-quarter resolution. That is a far more direct
  explanation of "blurrier" than aliasing is, and it was an unexamined confound.
- [x] **2 — uniform star size.** Self-inflicted in the bokeh fix. I clamped
  `gl_PointSize` to `[1.0, 2.6] * pixelRatio`, but the pre-clamp value is
  `aSize * 260/distance`, which for the 22–78 shell is 2.7–50. Nearly every star
  saturates the clamp, so nearly every star renders at exactly 2.6px.
- [x] **9 — spark occlusion.** `MedallionHub` forces `material.transparent = true`
  on every medallion mesh regardless of opacity, so the whole artifact renders in
  the transparent pass. Sparks are also transparent with `depthWrite: false`. Within
  the transparent pass three.js sorts by object centroid, so medallion meshes drawn
  *after* the sparks paint over sparks that are genuinely in front of them, while
  the screens (which do write depth) correctly occlude sparks behind them. Hence the
  inconsistency Andrew saw.
- [x] **8/10 — blob sparks.** Same unclamped perspective sizing as the stars, in the
  other direction: a spark at ~3 units from the camera with `aSize` 5.8 projects to
  `5.8 * 260/3 ≈ 500px`. That is the coloured blob.

## Steps

### Corrections from the adversarial verification pass

- The proposed scanline pitch change (3 → 4) is **rejected**: it is an unapproved art
  change, and the moire it targets decays 50% per mip level anyway once the chain is
  restored (22% → 11% → 5.5% → 2.8%, gone by mip 3). Mipmaps alone fix it.
- The "stars are too blue because sRGB is being treated as linear" diagnosis is
  **wrong for this repo**. The starfield uses a raw ShaderMaterial with no
  `<colorspace_fragment>` include and there is no EffectComposer, so authored floats
  are written verbatim into the sRGB buffer. `[0.725, 0.831, 1]` lands on screen as
  exactly `#b9d4ff`. Applying the "fix" would have darkened every star.
- Likewise "reads as green because you interpolate hue" is **wrong**: nothing here
  interpolates hue, and green can never be the max channel in the current generator.
  The real cause is the `luminance` floor of 0.3, which lets a cool star render as a
  dark blue-grey `(0.22, 0.25, 0.30)` dot — grey by Andrew's description, and reading
  greenish against warm amber neighbours by simultaneous contrast.
- The research's recommended saturation ceiling (S ≈ 33–39%) is **higher** than the
  27.5% blue Andrew rejected. Inverted into a whiteness floor: cap around S ≈ 16%.
- **New bug found in passing:** `Starfield.tsx` reads `window.devicePixelRatio` once,
  but the renderer's pixel ratio is driven live by `AdaptiveQuality`. On a Retina Mac
  the shader multiplies by 2.0 while the buffer is at 1.5 or lower — stars render
  33–167% larger than specified. Fixed with `gl.getPixelRatio()`.
- Halo/glare sprites on bright stars are **rejected**: they contradict Andrew's dated
  2026-07-21 "a star is a hard dot, not bokeh" decision, which outranks the research.
- Spark occlusion fix needs **both** the opaque-pass gating *and* `renderOrder`: the
  hub's visibility lerp is asymptotic, so there is a ~1.35s window after a panel
  closes where the medallion is still transparent. `renderOrder` covers that window.
  Two hazards: `material.needsUpdate` must be set when flipping `transparent` (the
  program is compiled with `#define OPAQUE` otherwise and the fade breaks), and the
  epsilon must tolerate the lerp never reaching exactly 1.

### Phase A — research (no code)
- [x] A1. Realistic starfield: stellar colour from temperature, why no green stars,
      magnitude distribution, point-sprite sizing conventions.
- [x] A2. three.js depth/render-order: correct fix for the spark occlusion.
- [x] A3. Canvas-texture minification: mipmaps, anisotropy, and what actually cures
      the crawling-ripple aliasing.

### Phase B — screens (Andrew's item 1)
- [x] B1. Restore mipmaps on the screen textures; recover the cost elsewhere.
- [x] B2. Add anisotropic filtering for the angled plates.
- [x] B3. Re-check the grain/scanline compositing for added softness.
- [x] B4. Verify the perf win from the earlier pass is not given back wholesale.

### Phase C — starfield (items 2, 3, 4)
- [x] C1. Replace the ad-hoc palette with a blackbody temperature ramp; no greens,
      desaturated blues.
- [x] C2. Magnitude-based brightness AND size; decouple size from distance.
- [x] C3. Reduce counts by ~35%.
- [x] C4. Update/extend the starfield tests for the new contract.

### Phase D — sparks (items 5–12)
- [x] D1. Clamp projected size hard; nothing near the scale of a screen.
- [x] D2. Widen the depth range; vary size, speed and position independently.
- [x] D3. Couple apparent speed to distance so slow movers are always far.
- [x] D4. Group spawning with randomly sized bursts.
- [x] D5. Halve the frequency.
- [x] D6. Fix the occlusion/render-order bug.
- [x] D7. Soften the head glow, especially on saturated hues.

### Phase E — verify + land
- [x] E1. `pnpm test`, `pnpm check`, `pnpm build`.
- [x] E2. Headless shader compile check (lessons.md entry A).
- [ ] E3. Commit, push, tell Andrew.
- [ ] E4. Curate `lessons.md` (CLAUDE.md "Lessons discipline").

## Landed 2026-07-22

**Screens.** Mip chain restored (`LinearMipmapLinearFilter` + `generateMipmaps`),
anisotropy 16 — the second of those was silently disabled by the first, and it is
what keeps oblique text sharp rather than merely stable. Text outline cut from
`fontSize * 0.22` to `* 0.13` (a 10px stroke centred on the path was eating 5px into
every letterform) and the steady-state scanline alpha from 0.22 to 0.17. The DPR
ladder floor moved 0.75 → 1.0, since sub-1.0 rendering was the other half of
"blurrier". Grain rate cut 30/20/12 → 20/15/10 Hz, which more than pays for the
restored mip regeneration.

**Starfield.** Rebuilt on the naked-eye spectral distribution (O 0.6% / B 19.6% /
A 21.7% / F 14.3% / G 13.3% / K 24.6% / M 6.0%) with measured per-class colours, so
green is now structurally impossible rather than merely avoided. Saturation rides
brightness and caps at ~16%, well under the 27.5% blue Andrew rejected; faint stars
are white rather than the dark blue-grey dots that read as green. Size comes from
apparent magnitude with **no distance term at all** — measured p1 1.28px / p50 1.62 /
p99 2.76 / max 3.90, against a previous distribution where 100.00% of stars saturated
a 2.6px clamp. Counts cut ~35%.

**Sparks.** Depth range 6–16 → 7–38 with groups of 1–5 sharing a firing time; apparent
speed is now *coupled* to distance so a slow spark is always a far one; size hard-capped
at 3.5% of viewport height (was uncapped, and a near spark projected to ~500px); duty
halved to 0.1; head pushed white-hot with a coloured halo, which is both how
incandescence actually works and what makes the head read consistently across every
palette hue. Occlusion fixed at the root — the medallion returns to the opaque pass at
full opacity, with `renderOrder` covering the ~1.3s transparent window after a panel
closes.

**Two bugs found by the work rather than reported:**
- `Starfield` read `window.devicePixelRatio` once while `AdaptiveQuality` drives the
  renderer's ratio live, so stars rendered 33–167% larger than specified.
- Spark groups landing near either shell edge had every member *clamped* to the same
  radius, collapsing a burst into a flat plane. Caught only because the generator tests
  were made deterministic — it was invisible under `Math.random`.

**Not verified visually.** Same limitation as always: the sandbox compiles shaders and
runs the DOM but never advances the WebGL frame loop. Shader compilation, module
transforms, the size/colour distributions and all 68 tests are checked; how any of it
actually looks is Andrew's call.
