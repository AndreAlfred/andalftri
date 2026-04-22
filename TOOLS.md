# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Stack

- **React 19** + **Vite** + **TypeScript** + **Tailwind CSS v4** + **pnpm**
- **React Three Fiber** (@react-three/fiber) + **Drei** (@react-three/drei) for 3D
- **Three.js** as the 3D engine underneath R3F

## Commands

```bash
pnpm dev          # Start dev server
pnpm check        # TypeScript check (run before every commit)
pnpm build        # Production build
```

## Deployment

- Live site: `https://andalftri.vercel.app`
- Vercel auto-deploys on push to `main`
- Rebuild takes ~30 seconds after push

## 3D asset swap

- To swap a placeholder for a Blender asset, add the GLB to `client/public/models/` and set the `modelPath` prop to `/models/filename.glb`.
- For a quick sanity check of the swap path, visit `/?asset-demo=1` to load the sample GLB used for Task 21.

---

Add whatever helps you do your job. This is your cheat sheet.
