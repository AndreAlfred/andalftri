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

### C. Nightly autonomous loops need an explicit "skip the blocked phase" rule
- **What happened:** Alfred's loop wrote 16 identical nightly blocker entries
  into `docs/plans/feedback.md` (June 24 → July 9) because the next unchecked
  task (25, audio) is marked "Do not start" and nothing said what to do instead.
- **Lesson:** when a plan phase is gated, the plan must say where work continues
  (Phase 7 now points to Phase 8). A blocked task is a routing problem, not a
  stopping problem.
