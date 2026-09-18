# Loading Critical Path Implementation Plan

**Status:** Implemented and verified locally on 2026-09-17; production verification follows the required push.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the first usable render and all portfolio media load promptly by removing accidental 3D work and third-party requests from the startup path, starting the medallion transfer earlier, and shipping browser-native optimized images with effective caching.

**Architecture:** Keep the initial React shell independent of Three.js/R3F/Drei. Choose between the 2D fallback and 3D experience synchronously from WebGL2 support, then load the 3D chunk and medallion in parallel while the lightweight loading UI receives progress through callbacks from inside the lazy scene. Serve the existing human-made media as versioned AVIF derivatives with original-format fallbacks and explicit long-lived cache headers.

**Tech Stack:** React 19, TypeScript, Vite 7, React Three Fiber/Drei, Node test runner, Vercel static hosting, AVIF.

**Spec:** `docs/plans/2026-07-21-latency-and-environment-proposal.md` section 1A.6, `docs/plans/2026-07-30-mobile-performance-research.md`, and Andrew's 2026-09-17 direct instruction that the site and its images load incredibly slowly on all devices.

## Global Constraints

- Preserve the approved medallion, lighting, helmet, routes, and authored media; this pass changes delivery, not art direction.
- Do not modify the GLB binary or generate visual assets with AI.
- Preserve a functional static fallback when WebGL2 is unavailable or `?lite=1` is present.
- Keep changes scoped and reversible; retain original raster files as fallbacks.
- After code changes, run `pnpm test`, `pnpm check`, and `pnpm build`.
- Final 3D appearance still requires Andrew's real-browser signoff.

---

### Task 1: Protect the initial JavaScript path

**Files:**
- Create: `tests/criticalPath.test.ts`
- Modify: `client/src/components/LoadingScreen.tsx`
- Modify: `client/src/components/SceneExperience.tsx`
- Modify: `client/src/App.tsx`
- Modify: `client/src/lib/deviceCapability.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: the existing `LoadingScreen` and lazy `SceneExperience` boundary.
- Produces: `SceneLoadState`, passed from `SceneExperience` to `App` and then to `LoadingScreen`; synchronous `getDeviceCapability()` based on WebGL2 availability.

- [ ] **Step 1: Write the failing critical-path build test**

Build the app in the test, parse `dist/index.html`, and assert that the initial HTML does not preload `vendor-three`, `vendor-scene`, or `vendor-device`. Also assert that the initial CSS has no remote `@import`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/criticalPath.test.ts`

Expected: FAIL because the current loading screen imports Drei, the current capability gate imports `detect-gpu`, and the stylesheet imports Google Fonts.

- [ ] **Step 3: Move scene progress tracking behind the lazy boundary**

Change `LoadingScreen` to accept plain progress props. Add a reporter inside `SceneExperience` that reads Drei's `useProgress()` and calls `onLoadStateChange(state)`. Keep the existing ready guard and fade behavior.

- [ ] **Step 4: Replace the third-party GPU lookup with synchronous renderer support detection**

Make `getDeviceCapability()` synchronously probe WebGL2 and return the existing `DeviceCapability` shape. Unsupported WebGL2 routes to `StaticFallback`; supported WebGL2 starts conservatively and lets the existing quality system adapt. Remove `detect-gpu` from dependencies and Vite chunking.

- [ ] **Step 5: Run the critical-path test and full tests**

Run: `node --test tests/criticalPath.test.ts && pnpm test`

Expected: PASS, with no initial scene/device preloads.

### Task 2: Start the required 3D asset earlier and cache static bytes

**Files:**
- Create: `client/src/lib/preloadAsset.ts`
- Create: `tests/preloadAsset.test.ts`
- Modify: `client/src/App.tsx`
- Modify: `client/src/scene/MedallionHub.tsx`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: `MEDALLION_URL` and the synchronous capable/static decision from Task 1.
- Produces: `preloadAsset(document, href, as, type?)`, which inserts a deduplicated preload link.

- [ ] **Step 1: Write failing preload tests**

Test that one preload link is inserted with the requested `href`, `as`, `type`, and CORS mode, and that a second call is deduplicated.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/preloadAsset.test.ts`

Expected: FAIL because `preloadAsset` does not exist.

- [ ] **Step 3: Implement the helper and start the GLB alongside the lazy scene**

Call the helper when the 3D experience is selected. Use one shared versioned medallion URL in `App` and `MedallionHub` so the preload and loader share the browser cache.

- [ ] **Step 4: Add explicit Vercel cache headers**

Set hashed `/assets/*` and versioned `/images/*`, `/fonts/*`, and `/models/*` responses to `public, max-age=31536000, immutable`. Keep HTML at revalidation semantics.

- [ ] **Step 5: Run the targeted and full tests**

Run: `node --test tests/preloadAsset.test.ts && pnpm test`

Expected: PASS.

### Task 3: Optimize image delivery without replacing authored art

**Files:**
- Create: `tests/imageDelivery.test.ts`
- Create: versioned `.avif` derivatives beside current project, influence, podcast, and music images under `client/public/images/`
- Modify: `client/src/data/projects.ts`
- Modify: `client/src/data/influences.ts`
- Modify: `client/src/data/music.ts`
- Modify: `client/src/panels/ProjectPanel.tsx`
- Modify: `client/src/panels/InfluencePanel.tsx`
- Modify: `client/src/panels/MusicPanel.tsx`
- Modify: `tests/screenshotAspect.test.ts`

**Interfaces:**
- Consumes: current human-made PNG/JPEG files as untouched fallbacks.
- Produces: `OptimizedImageSource { src: string; optimizedSrc: string }` fields and `<picture>` markup that prefers AVIF and falls back to the original.

- [ ] **Step 1: Write failing media delivery tests**

Assert that every rendered local raster declares an AVIF source, that the file exists, that no optimized file exceeds 300 KB, and that total optimized bytes are materially smaller than original bytes. Extend the screenshot dimension reader to recognize AVIF via `ffprobe` or declared dimensions without weakening the aspect contract.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/imageDelivery.test.ts tests/screenshotAspect.test.ts`

Expected: FAIL because optimized sources do not exist.

- [ ] **Step 3: Encode versioned AVIF derivatives**

Use the installed FFmpeg/SVT-AV1 encoder. Use CRF 24 for interface screenshots and CRF 28 for paintings/cover art; preserve the original pixel dimensions. Keep originals intact.

- [ ] **Step 4: Render AVIF-first pictures with original fallbacks**

Add `decoding="async"` everywhere. The active project screenshot uses `loading="eager"` and `fetchPriority="high"`; gallery and cover images remain `loading="lazy"`.

- [ ] **Step 5: Run media and full tests**

Run: `node --test tests/imageDelivery.test.ts tests/screenshotAspect.test.ts && pnpm test`

Expected: PASS.

### Task 4: Remove render-blocking and invalid font requests

**Files:**
- Create: `client/public/fonts/Inter-Latin-v20.woff2`
- Create: `client/public/fonts/SpaceMono-Regular-Latin-v17.woff2`
- Create: `client/public/fonts/SpaceMono-Bold-Latin-v17.woff2`
- Modify: `client/src/index.css`
- Modify: `client/public/fonts/licenses/`
- Test: `tests/criticalPath.test.ts`

**Interfaces:**
- Consumes: the exact Inter and Space Mono faces currently requested from Google Fonts.
- Produces: local `@font-face` rules with `font-display: swap`, no third-party stylesheet, and no request for the absent `KingthingsSpikeless.ttf`.

- [ ] **Step 1: Extend the critical-path test**

Assert that CSS contains no `fonts.googleapis.com`, `fonts.gstatic.com`, or `KingthingsSpikeless.ttf`, and that every local font URL resolves to a file.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/criticalPath.test.ts`

Expected: FAIL on the Google Fonts import and missing Kingthings file.

- [ ] **Step 3: Self-host the existing font choices**

Download only the Latin WOFF2 subsets used by this English-language site plus the corresponding SIL OFL licenses. Remove the remote import and absent-font declaration while preserving the current font-family roles.

- [ ] **Step 4: Run the critical-path test**

Run: `node --test tests/criticalPath.test.ts`

Expected: PASS.

### Task 5: Verify, measure, document, and deploy

**Files:**
- Modify: `lessons.md`
- Modify: `docs/plans/progress-log.md`

**Interfaces:**
- Consumes: all prior tasks and the original live measurements.
- Produces: a measured before/after record and deployed production build.

- [ ] **Step 1: Run repository verification**

Run: `pnpm test && pnpm check && pnpm build`

Expected: all commands pass. Build output must show no unresolved font warning, and `dist/index.html` must not preload Three/R3F/Drei/device chunks.

- [ ] **Step 2: Compare byte budgets**

Record initial preload gzip bytes, optimized image totals, and whether the GLB begins in parallel with the lazy scene. Verify route and fallback behavior in a browser; do not claim pixel-level 3D approval.

- [ ] **Step 3: Curate documentation**

Record the session in `progress-log.md`. Add a transferable lesson only for a newly proven failure mode; rewrite or prune existing entries instead of duplicating them.

- [ ] **Step 4: Commit and push**

Run: `git add -A && git commit -m "perf: remove startup loading bottlenecks" && git push`

- [ ] **Step 5: Verify production**

After Vercel deploys, inspect live headers and loading behavior. Report that the site should update in roughly 30 seconds and request Andrew's real-device visual confirmation.
