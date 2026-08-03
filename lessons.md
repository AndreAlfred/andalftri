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
  fact. **The do-this-every-time rule was promoted to `CLAUDE.md` required
  workflow step 4 on 2026-07-22; this entry keeps only the why.**

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

## Session 2026-07-22 (screens + starfield quality pass, Claude Code)

### J. A perf "optimisation" that removes a correctness mechanism is a regression
- **What happened:** the 2026-07-21 pass disabled mipmaps on the seven CRT screen
  textures to stop three.js regenerating a mip chain on every upload, justified in
  a code comment as "the screens are viewed at a roughly constant distance and never
  minify meaningfully". Andrew came back with text that was hard to read, with
  "ripples being sent across the words", and a headache. The justification was a
  claim about the ISOTROPIC scale; what a sampler cares about is the projected pixel
  footprint, which on an angled plate is an ellipse. With `minFilter = LinearFilter`
  the GPU computes the LOD and then discards it, so the 1px-on-3px scanline comb
  undersampled and beat against the pixel grid, and the model's slow drift swept the
  beat across the glyphs.
- **Compounding it:** setting a non-mipmap min filter also silently disables
  anisotropic filtering in three.js (it returns early from the anisotropy call). So
  one line removed both of the mechanisms that keep small text legible on an oblique
  surface, and only one of them was named in the comment.
- **Lesson:** before trading away a filtering, sampling, or precision mechanism for
  speed, state what that mechanism was *for* and confirm the condition it guards
  against cannot occur. Here the guarded condition (minification) was assumed away in
  a comment rather than measured. Also: mip regeneration rides the same call as the
  upload it follows, so it could only ever be a fraction of that cost — the lever was
  always "upload less often", never "stop mipping".

### K. A clamp that everything saturates is not a bound, it is a constant
- **What happened:** star point size was computed from camera distance and then
  clamped to `[1.0, 2.6]px` to stop near stars blooming into bokeh discs. The clamp
  worked. It worked on **100.00%** of the field — measured, not estimated — because the
  pre-clamp expression produced 2.7–50px across the shell. Every star in the sky
  rendered at exactly 2.6px, which is what Andrew reported as "all the stars are the
  same size". The clamp had silently become the entire mapping.
- **Lesson:** a clamp that everything saturates is not a bound, it is a constant.
  When you add one, measure what fraction of the population actually reaches it. If
  the answer is "most", the mapping feeding the clamp is wrong and the clamp is
  hiding it.
- **2026-08-02 generalisation — this is about ceilings, not about clamps.** The same
  failure recurred in a place with no clamp in it at all. The `?diag=1` ablation
  harness ranked conditions by median frame time; on Andrew's iPhone every one of the
  eight conditions returned *exactly* 17.0ms, because the device was hitting 60Hz
  vsync with everything switched on and simply waiting out the rest of each frame.
  The harness dutifully reported "no single layer dominates" while its own p95 column
  showed two conditions taking the tail from 40.0ms to 17.0ms — an unambiguous result,
  buried, because the headline metric was pinned against a ceiling nobody had checked
  for. Restated to cover both cases: **before trusting a measurement, confirm the
  quantity was free to move.** A clamp, a frame cap, a rate limit, a saturating
  sensor and a full buffer are the same hazard wearing different clothes, and they all
  present as suspiciously equal readings rather than as an error. The tell is
  variance: if a metric shows near-zero spread across treatments that genuinely differ,
  suspect the ruler before believing the result. The fix here was to detect the
  saturation (spread < 1ms across conditions while another metric still varies) and
  rank on the metric that could still move.

### L. Model the phenomenon, not the appearance (generalises I)
- **What happened:** the first starfield invented a palette (white lerped toward a
  hand-picked cool and warm) and sized points by distance. Both produced artifacts
  Andrew rejected: hues that read as green, blues that were too blue, and uniform
  sizes. Rebuilding on the actual physics — the naked-eye spectral distribution,
  measured per-class colours, apparent magnitude, and the fact that stars are
  unresolved point sources whose apparent size comes from the point spread function
  rather than from distance — made the objectionable cases *structurally impossible*
  rather than merely tuned away. Green cannot occur, because the Planckian locus never
  enters the green region of CIE 1931.
- **Lesson:** when a procedural effect depicts something real, spend the hour to find
  out how the real thing works. It is usually less code, it removes whole categories
  of art-direction bug rather than one instance, and the constraints it hands you are
  defensible in review. "Do some research if you need to" was the right instruction.

### M. Research needs an adversarial pass before it touches code
- **What happened:** three research briefs were commissioned and then independently
  verified against the actual repo. The verification caught, among others: a
  prescribed sRGB→linear colour fix for a bug that **does not exist here** (a raw
  ShaderMaterial writes verbatim into the sRGB buffer, so applying the "fix" would
  have darkened every star); a "stop interpolating hue" recommendation for code that
  never interpolates hue; a recommended saturation ceiling *higher* than the value the
  user had just rejected; and a patch whose stated line range would have produced a
  duplicate `const` and failed the build.
- **Lesson:** a confident, well-cited brief can still be describing a different
  codebase than yours. Verification has to READ THE REPO, not just re-check the
  citations — every one of those errors was in the mapping from a true general fact
  onto this specific code, not in the fact itself.
- **2026-07-30 confirmation (mobile perf council).** Same failure, larger sample. A
  five-advisor council produced five confident briefs; a verification agent that read
  the repo killed three of the headline claims. It reported touch navigation as
  entirely missing (`useScrollInteraction.ts` has real touch handlers, R3F `onClick`
  is pointer-based, `CyberspaceNav` is a `<button>` list); it recommended shipping the
  "unused" gyroscope hook (already wired into `useMouseParallax`); it recommended
  Draco and WebP compression for the GLB (both already in `extensionsRequired`); it
  called the loading screen a progress-less spinner (it renders a real `useProgress()`
  percentage). **The sharper rule:** advisors reason from a *description* of the code,
  and a description is exactly where the "already handled" cases go missing — absence
  of a feature in a brief is not evidence of absence in the repo. So the verification
  pass is not optional garnish on commissioned research, it is the step that makes the
  research usable, and it must be told to check ALREADY-DONE as a distinct verdict
  from TRUE/FALSE. Three of the five refuted claims here would have read as FALSE
  without that third option, which would have hidden that the work was already
  finished rather than merely misdescribed.

### N. A generator test driven by Math.random is flaky by construction
- **What happened:** the spark-group tests passed or failed run to run. Making the RNG
  injectable and sweeping fixed seeds turned that into a deterministic failure, which
  turned out to be a **real bug**: groups whose centre landed near either edge of the
  depth shell had every member `Math.min/max`-clamped to the same radius, collapsing a
  burst into a flat plane. Under `Math.random` it surfaced as an occasional red test
  that a re-run would clear.
- **Lesson:** procedural generators take an injectable `random` and their tests sweep
  seeds. A flaky test is worse than no test, because it trains you to re-run instead of
  to read — and here, re-running would have discarded the report of a genuine defect.
  Clamping a jittered value back into range is itself the smell: prefer sampling from
  an inset range so the value is in-bounds by construction.

## Session 2026-07-30 (mobile performance research, Claude Code)

### O. A reactive quality system cannot govern the frames before its first measurement
- **What happened:** the adaptive ladder was reviewed as if it covered the whole
  session, because that is how `AdaptiveQuality.tsx` reads. It does not. The Canvas
  mounts with `dpr={1.5}` — the TOP rung of `DPR_LADDER` — and drei's
  `PerformanceMonitor` is deliberately slow to disagree (`factor={1}` starts
  optimistic, `step={0.15}` bounds movement, `flipflops={3}`). So the weakest phone
  renders the opening seconds at the highest tier's resolution, and those seconds are
  exactly when GLB decode, Draco decompression, texture upload and the boot sequence
  are already saturating the budget. Five commissioned advisors all missed it; it
  surfaced only from reading the `<Canvas>` props directly.
- **Root cause:** the system's own framing. "Adaptive" invites you to check whether
  the *response* is correct and never to ask what the *initial condition* is. A
  measure-then-correct loop has a structural blind window equal to its own latency,
  and a bounded, optimistic-start loop widens that window on purpose.
- **Why it costs more than it looks on mobile:** this is a thermal event, not merely
  some slow frames. Phones throttle on accumulated heat, so spiking at t=0 lowers the
  ceiling for the entire rest of the session. The visitor pays at minute two for what
  happened in second one — which also means the damage is invisible to any
  steady-state measurement taken after the fact.
- **Lesson:** when a system adapts, always ask what it does *before* it has anything
  to adapt from, and state that initial condition explicitly rather than inheriting it
  from a default. Prefer starting conservative and climbing on evidence over starting
  optimistic and being corrected — the two are symmetric only if the cost of being
  wrong is symmetric, and for thermal, memory-pressure, and context-loss failures it
  never is. Corollary: a cheap synchronous signal available at mount (`pointer:
  coarse`, `maxTouchPoints`, screen size) beats an accurate asynchronous one that
  arrives after the damage.

### P. WebP in a GLB is a transport win, not a GPU-memory win
- **What happened:** the medallion's textures are `EXT_texture_webp`, and that had
  been treated as "textures are compressed" — a settled question. Costing the actual
  GPU residency for a mobile pass showed six textures (3× 2048², 3× 1024²) decompress
  to ~63 MB of RGBA on upload, ~84 MB with mip chains. On iOS Safari that is a
  material fraction of the WebGL budget, and its failure mode is not a dropped frame
  but context loss — a black canvas.
- **Root cause:** conflating two different compressions that live at different stages.
  WebP/PNG/JPEG are decoded on upload and stored uncompressed; only GPU-native formats
  (KTX2/Basis, ASTC, BCn) stay compressed *in* video memory. A file-size audit and a
  texture-memory audit are different audits and one does not imply the other.
- **Lesson:** when reasoning about texture cost, state which budget you are spending —
  network bytes, or GPU residency. `2.9 MB on the wire` and `~84 MB resident` are both
  true of this same asset and they lead to opposite conclusions about whether there is
  a problem. Compute residency as `w × h × 4 × 1.33` per texture and check it against
  the target device's ceiling before concluding an asset is optimized.

### Q. A setting that must hold from the first paint cannot be applied by an effect
- **What happened:** `?quality=low` correctly pinned the WebGL tier but left the new
  `data-quality` attribute — and therefore the helmet CSS — at the device-derived
  tier. Verified in the browser, not reasoned about: the attribute read `high` on a
  URL that had explicitly asked for `low`. Root cause was ordering, not logic. The
  pinned tier was applied by an effect inside `AdaptiveQuality`, which lives inside
  `<Canvas>`, which lives inside a lazily-imported `SceneExperience`. So the setting
  could not take effect until three separate things had mounted, and for the whole of
  loading — the exact window a preview instrument is most often used to inspect — the
  page was showing the wrong tier.
- **Fix:** resolve `?quality=` where the opening value is *constructed*
  (`readStartingTier`), not where it is later corrected. One source of precedence;
  `SceneExperience` now asks the same function rather than re-implementing the
  "pinned wins" rule, so the renderer and the store cannot mount disagreeing.
- **Lesson:** ask *when the earliest observer reads it*, not just *whether it is
  applied*. A value consumed during loading has to exist before the component tree
  that computes it. Effects run after mount by definition, so anything that must be
  true for the first paint belongs in module or store initialisation. The tell is a
  setting that works "eventually" in manual testing — that is not a slow success, it
  is a failure with a short window, and lazy-loading widens the window.
- **Second tell, worth its own note:** the bug was only visible because the DOM was
  inspected directly. Everything upstream agreed it worked — the store held `low`, the
  tests passed, `tsc` was clean. State being correct somewhere is not the same as
  state having reached the thing that renders.

### R. Stale Vite HMR can report a ReferenceError that no longer exists in the source
- **What happened:** after adding an import to `deviceHints.ts`, the console showed
  `ReferenceError: getPreviewFlags is not defined` pointing at the line that uses it —
  a binding that plainly existed in the file. It survived a dev-server restart, which
  made it look reproducible and real. It was neither: the browser's console buffer had
  retained the messages across the restart (same `?t=` cache-busting timestamp on
  every occurrence, which was the giveaway), and the page itself had never been
  hard-reloaded against the new server.
- **Lesson:** before diagnosing a module-level error in a dev server, confirm the
  error is *current* — check the timestamps/URLs in the stack for a stale build id,
  and force a real reload rather than trusting that restarting the server invalidated
  the page. A console is an append-only log, not a view of present state. Corollary
  specific to this repo's verification loop: `pnpm check` passing while the console
  shows a `ReferenceError` should raise "is this console stale?" before it raises "did
  TypeScript miss something?" — the second is possible but far rarer than the first.

## Session 2026-08-01 (mobile lag, second attempt — instrumenting instead of tuning)

### S. Absence of a measurement is not a measurement of zero
- **What happened:** the `?diag=1` ablation harness folds per-condition frame times
  into a ranked table. A condition with no samples has a median of 0 ms, which the
  recovery formula `(baseline - median) / baseline` scored as a **100% saving** — so
  any unmeasured condition sorted straight to the top and `verdict()` announced it as
  the dominant cost. A unit test with an empty sample map caught it before it shipped.
  The realistic trigger is the most likely thing to happen on the target device: the
  phone locks or the tab backgrounds partway through a 39-second sweep, and the tool
  built to end the guessing confidently reports a fabricated winner.
- **Root cause:** a sentinel that is also a legal value. Zero means "no data" to the
  collector and "instantaneous" to the arithmetic, and nothing in between checked
  which one it was.
- **Lesson:** when a summary statistic can be computed from an empty set, decide
  explicitly what the empty case means before the formula runs, and carry the sample
  count alongside the value so downstream ranking can refuse to rank it. Anywhere a
  "better" score can be achieved by measuring *less*, the metric is inverted for the
  missing case. This generalises past diagnostics — the same shape appears in any
  code that averages, ranks, or diffs collections that might be empty.
- **Adjacent rule that paid off:** the harness itself exists because CLAUDE.md says
  two failed tunings means stop tuning and instrument. Two rounds of mechanism-level
  reasoning (both internally sound, both verified against the code) failed to fix the
  reported lag, because being right about a mechanism is not the same as that
  mechanism being the bottleneck. The instrument was cheaper than the third guess.

### T. Interleave ablation conditions on hardware that throttles
- **What happened (design note, not a wrong turn):** the obvious sweep shape — measure
  condition A for 5s, then B, then C — is invalid on a phone. Thermal throttling means
  the device measured at second 40 is materially slower than the one measured at second
  5, so a sequential sweep confounds "which layer is expensive" with "which layer was
  measured last", and the ordering alone would manufacture a result.
- **Lesson:** on any device whose performance drifts with time-under-load, ablation
  conditions must be interleaved round-robin and rotated between rounds, with a median
  taken across rounds. Rotation matters as much as interleaving: a heavy condition
  leaves the GPU hotter for whatever follows it, so a fixed cycle order taxes the same
  neighbour every round. This is the measurement analogue of entry E — the metric has
  to match what the visitor actually experiences, and on a phone that includes minute
  two, not just second one.

### U. A ranking and the number printed beside it must come from one decision
- **What happened:** the 2026-08-02 fix made `summarize` fall back to ranking on p95
  when the medians saturate. It worked — Andrew's next sweep came back correctly
  ordered, uploads at the top, geometry at the bottom. Every row also read **"+0%"**,
  because both display sites (the overlay table and the copyable report) were still
  printing `recoveredPct`, the median-based metric that was zero for everything. The
  sort and the numbers next to it were answering different questions, and the table
  looked broken at exactly the moment it was right.
- **Root cause:** the ranking decision was made inside `summarize` and then re-derived
  nowhere — the consumers never asked which metric had been used, they assumed. One
  producer, three consumers, and the contract between them was implicit.
- **Lesson:** when a function sorts by a metric it chooses at runtime, it has to
  EXPORT that choice, not just the sorted list. Anything that renders the result needs
  to ask "ranked by what?" rather than guess, and the answer should come from a single
  shared helper (`rankingMetric` here) so a future metric cannot be added to the sort
  without every display site following it. The general form: derived state computed
  independently in two places will diverge, and the version that diverges silently is
  the one being shown to the user.
