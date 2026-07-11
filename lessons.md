# lessons.md — wrong-turn log (site repo)

Convention borrowed from the Blender medallion project
(`~/clawd/CLI-Anything/blender/projects/personal-site-medallion/lessons.md`):
when a session takes a wrong turn and learns something transferable, append an
entry (date, what happened, root cause, lesson). Prune stale entries at session
end; promote permanent rules into `CLAUDE.md`.

## Session 2026-07-10 (medallion integration, Claude Code)

### A. The sandboxed preview browser cannot do WebGL — verify 3D in a real browser
- **What happened:** the managed Claude preview browser lost the WebGL context
  repeatedly (`THREE.WebGLRenderer: Context Lost`) even on the UNMODIFIED site,
  leaving a black canvas stuck at 300×150 behind the loading gate in `App.tsx`
  (scene div stays `opacity-0` until `useProgress` settles).
- **Lesson:** for this repo, automated in-sandbox verification stops at
  `pnpm check` + `pnpm build` + console/network inspection (module errors, GLB
  fetch, Draco decode). Pixel-level 3D verification needs Andrew's real browser:
  `pnpm dev` → `localhost:5173`.

### B. Raycasting a hero-scale GLB needs BVH acceleration up front
- **What happened (near-miss):** the medallion is ~349k tris; three.js raycasts
  brute-force per triangle on every pointermove. The old capsule buttons never
  exposed this cost.
- **Lesson:** any pointer-interactive GLB beyond a few k tris gets wrapped in
  Drei's `<Bvh firstHitOnly>` (three-mesh-bvh) from day one — see
  `MedallionHub.tsx`.

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

### C. Nightly autonomous loops need an explicit "skip the blocked phase" rule
- **What happened:** Alfred's loop wrote 16 identical nightly blocker entries
  into `docs/plans/feedback.md` (June 24 → July 9) because the next unchecked
  task (25, audio) is marked "Do not start" and nothing said what to do instead.
- **Lesson:** when a plan phase is gated, the plan must say where work continues
  (Phase 7 now points to Phase 8). A blocked task is a routing problem, not a
  stopping problem.
