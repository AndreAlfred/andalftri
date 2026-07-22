# lessons.md — wrong-turn log (site repo)

Convention borrowed from the Blender medallion project
(`~/clawd/CLI-Anything/blender/projects/personal-site-medallion/lessons.md`):
when a session takes a wrong turn and learns something transferable, append an
entry (date, what happened, root cause, lesson). Prune stale entries at session
end; promote permanent rules into `CLAUDE.md`. See the "Lessons discipline"
section of `CLAUDE.md` for the full append / rewrite / prune / promote loop —
this file is expected to shrink as often as it grows.

**Promoted out (do not re-add here):**
- 2026-07-21 — entry B (BVH on pointer-interactive GLBs) → `CLAUDE.md` Hard
  constraints.
- 2026-07-21 — entry C (a blocked task is a routing problem) → `CLAUDE.md`
  Required workflow step 6.

## Session 2026-07-10 (medallion integration, Claude Code)

### A. The sandbox has a WebGL context but no frame loop — verify appearance in a real browser, compile-check shaders here
*(Title corrected 2026-07-21: the original read "cannot do WebGL", which the
refinement below disproves. The context works; the frame loop is what does not.)*
- **What happened:** the managed Claude preview browser lost the WebGL context
  repeatedly (`THREE.WebGLRenderer: Context Lost`) even on the UNMODIFIED site,
  leaving a black canvas stuck at 300×150 behind the loading gate in `App.tsx`
  (scene div stays `opacity-0` until `useProgress` settles).
- **Lesson:** for this repo, automated in-sandbox verification stops at
  `pnpm check` + `pnpm build` + console/network inspection (module errors, GLB
  fetch, Draco decode). Pixel-level 3D verification needs Andrew's real browser:
  `pnpm dev` → `localhost:5173`.
- **2026-07-21 refinement:** the ceiling is lower than "no 3D verification at
  all". The sandbox has a working WebGL2 *context* — what it lacks is an
  advancing frame loop (the canvas stays 300×150 and `useFrame` never ticks).
  So custom shaders CAN be compiled headlessly: create a bare
  `canvas.getContext("webgl2")`, prepend the three.js boilerplate the shader
  references (`modelViewMatrix`, `projectionMatrix`, `in vec3 position`, the
  `#version 300 es` / `attribute`→`in` defines), and call `compileShader`. That
  turns "a GLSL typo ships as a black screen" from an unknowable into a checked
  fact. Do this for every hand-written ShaderMaterial before pushing.

### D. detect-gpu mis-tiers Apple Silicon — Andrew got the potato fallback on a MacBook
- **What happened:** the live site served `StaticFallback` to Andrew's own Mac.
  Safari/Apple Silicon reports the WebGL renderer as an obfuscated "Apple GPU"
  string, which detect-gpu tiers at 1 (below the capable threshold). Separately,
  `type: "FALLBACK"` (benchmark CDN fetch failed) was also treated as weak,
  while App.tsx's own catch path treats the same failure as capable.
- **Fix:** `deviceCapability.ts` — any GPU whose name contains "apple" is
  capable regardless of tier; FALLBACK type is capable (unknown ≠ weak); only
  WEBGL_UNSUPPORTED and genuinely low-tier non-Apple GPUs get the fallback.
- **Lesson:** GPU-tier libraries are benchmark-table lookups, not measurements —
  always special-case the known obfuscated renderer strings ("Apple GPU",
  SwiftShader) and decide explicitly what "unknown" should mean. `?force-3d=1`
  exists as the user-facing escape hatch either way.

## Session 2026-07-21 (latency pass + magic space background, Claude Code)

### E. Measure where the cost actually is before accepting a visual sacrifice
- **What happened (near-miss):** asked to reduce latency, Andrew's own read was
  that the medallion dwarfs everything else, so thinning the atmosphere would
  not be enough and the artifact itself would probably have to be softened. He
  was directionally right about where the *weight* sits — but parsing the GLB
  and reading the render path found the two largest recoverable costs were free.
  The seven CRT screens were re-rasterizing static text 30×/sec to animate 200
  noise dots, re-uploading ~54 MB/s and rebuilding seven mip chains a second,
  ungated on visibility; and 145,152 of the model's 348,992 triangles (41.6%)
  sat in seven flat, entirely texture-driven screen plates.
- **Lesson:** "what is expensive" and "what is *recoverable*" are different
  questions, and the second one is the one that decides whether a visual
  tradeoff is needed at all. A tri count is the obvious number and often not the
  operative one — on a machine that is merely *contended*, main-thread and
  bus costs (canvas work, texture uploads, mip regeneration) hurt first and are
  invisible to a GPU-tier check, which is a one-time benchmark lookup. Measure
  before agreeing to spend the thing the project cares most about.

### F. Never tie a procedural seed to a quality parameter
- **What happened:** the starfield's buffer was built in
  `useMemo(() => build(count), [count])`, and `count` came from the adaptive
  quality tier. When the performance monitor stepped the tier down ~15s after
  load, every star position regenerated from `Math.random()` — the entire sky
  swapped in a single frame. Andrew reported it as a jarring "cut". The same
  rebuild reset every spark's animation phase.
- **Fix:** build the buffer once at `MAX_*` and let the tier drive
  `setDrawRange`. Points generated independently mean a prefix is already a
  uniform random subset, so thinning removes elements without moving the ones
  that remain — and recovering restores exactly the same ones.
- **Lesson:** anything derived from an RNG at construction is *content*, and
  content must not be a function of a performance knob. If a quality setting can
  change a buffer's length, the buffer gets allocated at maximum and the knob
  changes how much is drawn, never what is in it.

### G. Adaptive degradation must thin, never switch off
- **What happened:** the `low` quality profile set `sparkCount: 0` and
  `streakCount: 0`. A machine that dipped once lost the atmosphere permanently
  and silently — Andrew saw the magic on load and then never again. Compounding
  it, the layers were also unmounted at zero, so the effect that would have
  restored them could never run.
- **Lesson:** a degradation ladder should scale a layer down, not remove it. A
  removed layer reads as a broken feature rather than a quieter one, and it
  usually takes the recovery path with it (unmounted components stop watching
  for the conditions that would bring them back). Keep every rung non-zero and
  guard it with a test; drive visibility through draw range or count, not
  through mounting.

### H. `transform: scale()` is not a free compositor animation when the layer is filtered
- **What happened:** the helmet aurora animated `opacity` *and*
  `transform: scale(1 → 1.03)` on four full-viewport layers that each also carry
  `filter: blur(2vmin)` and a `mask-image`. The blur radius had already been
  A/B'd in a harness; the scale never had been, and it was the expensive half.
- **Lesson:** a composited layer can be translated and faded by the compositor
  alone, but it cannot be *scaled* that way — it has to be re-rendered at the
  new size to stay sharp, which re-runs every filter and mask on it, every
  frame. `translate3d` and `opacity` are cheap; `scale` on a filtered layer is
  a per-frame repaint wearing an animation's clothes. Prefer translate+opacity,
  and when a previous session has measured one property of an effect, do not
  assume the whole effect was measured.

### I. Animated alpha on soft points reads as bokeh, not as stars
- **What happened:** the starfield twinkled by animating alpha, with a
  `smoothstep` falloff across the full point radius and unclamped
  perspective-scaled `gl_PointSize`. Andrew: "stars don't change opacity, they
  are opaque" — the nearer, larger ones read as defocused highlights.
- **Lesson:** a large, soft-edged, opacity-pulsing point *is* the visual
  definition of bokeh, so this is a physics mistake before it is a taste one.
  Stars scintillate through atmosphere; in vacuum they do not. When a procedural
  element reads wrong, check whether the animation is depicting something that
  would not happen in the depicted setting — the correct answer is often to
  remove work rather than add it. Fix was: no alpha animation, clamp point size,
  and tighten the falloff to a hard dot plus one antialiased pixel.
