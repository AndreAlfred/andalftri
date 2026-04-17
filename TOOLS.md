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

- Vercel auto-deploys on push to `main`
- Rebuild takes ~30 seconds after push

---

Add whatever helps you do your job. This is your cheat sheet.
