# andrewalfredtrimble — Master Build Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 3D interactive personal portfolio site with React Three Fiber — Y2K frutiger aero aesthetic, camera-based navigation, 2D content panels overlaid on a 3D scene.

**Architecture:** R3F `<Canvas>` owns the 3D scene. A `CameraController` manages scripted camera transitions between page locations. Each page location has a Drei `<Html>` overlay for 2D content. A separate React overlay handles the HUD and loading screen.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS v4, React Three Fiber, Drei, Three.js, pnpm

Created: 2026-04-07
Status: In progress

---

## Phase 0: Project Bootstrap

- [x] **Task 1:** Initialize repository and install dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `.gitignore`, `.prettierrc`
- Create: `client/src/main.tsx`, `client/src/App.tsx`, `client/src/index.css`
- Create: `index.html`

- [x] Step 1: Initialize git repo

```bash
cd ~/clawd/projects/andrewalfredtrimble
git init
```

- [x] Step 2: Initialize pnpm project

```bash
pnpm init
```

- [x] Step 3: Install core dependencies

```bash
pnpm add react react-dom @types/react @types/react-dom
pnpm add @react-three/fiber @react-three/drei three @types/three
pnpm add -D vite @vitejs/plugin-react typescript @tailwindcss/vite tailwindcss
```

- [x] Step 4: Create `vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },
  root: ".",
  publicDir: "client/public",
  server: {
    port: 3001,
    host: true,
  },
  build: {
    outDir: "dist",
  },
});
```

- [x] Step 5: Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./client/src/*"]
    }
  },
  "include": ["client/src", "vite-env.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [x] Step 6: Create `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Andrew Alfred Trimble</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/client/src/main.tsx"></script>
  </body>
</html>
```

- [x] Step 7: Create `client/src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [x] Step 8: Create `client/src/App.tsx` with a basic R3F canvas

```tsx
import { Canvas } from "@react-three/fiber";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a1a" }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <mesh>
          <torusKnotGeometry args={[1, 0.3, 128, 32]} />
          <meshStandardMaterial color="#808080" wireframe />
        </mesh>
      </Canvas>
    </div>
  );
}
```

- [x] Step 9: Create `client/src/index.css`

```css
@import "tailwindcss";

*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

- [x] Step 10: Create `.gitignore`

```
node_modules/
dist/
.DS_Store
*.local
```

- [x] Step 11: Run `pnpm check` (add `"check": "tsc --noEmit"` to package.json scripts first), verify no errors

- [x] Step 12: Run `pnpm dev`, verify the torus knot wireframe renders at localhost:3001

- [x] Step 13: Commit

```bash
git add -A && git commit -m "Task 1: Initialize project — React + Vite + R3F + Tailwind"
```

---

- [x] **Task 2:** Deploy to Vercel

- [x] Step 1: Create a Vercel project linked to this repo. Push to a new GitHub remote.

```bash
git remote add origin <github-url>
git push -u origin main
```

- [x] Step 2: Verify Vercel auto-deploys and the torus knot wireframe is visible at the live URL.

- [x] Step 3: Update `IDENTITY.md` and `TOOLS.md` with the live URL.

- [x] Step 4: Commit

```bash
git add -A && git commit -m "Task 2: Deploy to Vercel" && git push
```

---

## Phase 1: 3D Scene Foundation

- [x] **Task 3:** Wireframe void environment

**Files:**
- Create: `client/src/scene/Environment.tsx`
- Modify: `client/src/App.tsx`

Build the gray wireframe void that all content floats in. This is the "world."

- [x] Step 1: Create `Environment.tsx` — an infinite grid plane with gray wireframe lines. Use Drei's `<Grid>` helper or a custom `gridHelper`. Background color `#1a1a1a`. Grid lines `#808080` with fade at distance.

```tsx
import { Grid } from "@react-three/drei";

export function Environment() {
  return (
    <>
      <color attach="background" args={["#1a1a1a"]} />
      <fog attach="fog" args={["#1a1a1a", 15, 40]} />
      <Grid
        position={[0, -3, 0]}
        args={[100, 100]}
        cellSize={1}
        cellColor="#404040"
        sectionSize={5}
        sectionColor="#808080"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />
    </>
  );
}
```

- [x] Step 2: Replace the test torus knot in `App.tsx` with `<Environment />`. Verify the wireframe void renders.

- [x] Step 3: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 3: Wireframe void environment" && git push
```

---

- [x] **Task 4:** Placeholder "@" logo

**Files:**
- Create: `client/src/scene/LogoModel.tsx`
- Create: `client/src/scene/MenuHub.tsx`
- Modify: `client/src/App.tsx`

- [x] Step 1: Create `LogoModel.tsx` — a placeholder for the "@" logo. Use Drei's `<Text3D>` with a bundled font, or a `<Text>` with large size. The component must accept an optional `modelPath` prop for future GLB swap.

```tsx
import { Text3D, Center } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

interface LogoModelProps {
  modelPath?: string; // Future: path to GLB file
}

export function LogoModel({ modelPath }: LogoModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Future: if modelPath provided, load GLB instead
  // For now, render text placeholder

  return (
    <Center>
      <Text3D
        ref={meshRef}
        font="/fonts/helvetiker_regular.typeface.json"
        size={2}
        height={0.4}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.05}
        bevelSize={0.03}
      >
        @
        <meshPhysicalMaterial
          color="#c0c0c0"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={1.0}
        />
      </Text3D>
    </Center>
  );
}
```

Note: Download `helvetiker_regular.typeface.json` from Three.js examples into `client/public/fonts/`. Or use Drei `<Text>` as a simpler alternative if font loading is problematic.

- [x] Step 2: Create `MenuHub.tsx` — renders the `LogoModel` at the scene center.

```tsx
import { LogoModel } from "./LogoModel";

export function MenuHub() {
  return (
    <group>
      <LogoModel />
    </group>
  );
}
```

- [x] Step 3: Add `<MenuHub />` to the scene in `App.tsx`. Verify the "@" renders in the wireframe void.

- [x] Step 4: Add an environment map for reflections. Use Drei's `<Environment>` with a preset.

```tsx
import { Environment as DreiEnv } from "@react-three/drei";
// Inside the Canvas:
<DreiEnv preset="city" />
```

- [x] Step 5: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 4: Placeholder @ logo with chrome material" && git push
```

---

- [x] **Task 5:** Lemniscate idle animation

**Files:**
- Create: `client/src/hooks/useLemniscate.ts`
- Modify: `client/src/scene/LogoModel.tsx`

- [x] Step 1: Create `useLemniscate.ts` — a hook that returns rotation values tracing a figure-eight (lemniscate) path.

```typescript
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface LemniscateOptions {
  yAmplitude?: number;   // degrees, default 15
  xAmplitude?: number;   // degrees, default 4
  speed?: number;        // default 0.3
  phaseOffset?: number;  // radians, default 0
}

export function useLemniscate(
  ref: React.RefObject<THREE.Object3D | null>,
  options: LemniscateOptions = {}
) {
  const {
    yAmplitude = 15,
    xAmplitude = 4,
    speed = 0.3,
    phaseOffset = 0,
  } = options;

  const yAmp = THREE.MathUtils.degToRad(yAmplitude);
  const xAmp = THREE.MathUtils.degToRad(xAmplitude);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + phaseOffset;
    ref.current.rotation.y = yAmp * Math.sin(t);
    ref.current.rotation.x = xAmp * Math.sin(t * 2);
  });
}
```

- [x] Step 2: Apply `useLemniscate` to the `LogoModel` component. The "@" should lazily rotate in a figure-eight pattern.

- [x] Step 3: Verify visually — the "@" should smoothly trace the lemniscate. Adjust amplitudes if needed.

- [x] Step 4: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 5: Lemniscate idle animation on @ logo" && git push
```

---

- [x] **Task 6:** Mouse parallax (scene-wide)

**Files:**
- Create: `client/src/hooks/useMouseParallax.ts`
- Modify: `client/src/scene/MenuHub.tsx`

- [x] Step 1: Create `useMouseParallax.ts` — tracks normalized mouse position and returns a smooth offset vector for the scene.

```typescript
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

interface ParallaxOptions {
  intensity?: number; // default 0.5
  smoothing?: number; // lerp factor, default 0.05
}

export function useMouseParallax(
  ref: React.RefObject<THREE.Group | null>,
  options: ParallaxOptions = {}
) {
  const { intensity = 0.5, smoothing = 0.05 } = options;
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    target.current.set(
      mouse.current.x * intensity,
      mouse.current.y * intensity * 0.5,
      0
    );
    ref.current.position.lerp(target.current, smoothing);
  });
}
```

- [x] Step 2: Wrap the `MenuHub` contents in a `<group ref={groupRef}>` and apply `useMouseParallax` to it.

- [x] Step 3: Verify — moving the mouse around the screen should subtly shift the entire logo/button cluster. The effect should be smooth and gentle.

- [x] Step 4: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 6: Scene-wide mouse parallax" && git push
```

---

- [x] **Task 7:** Menu buttons with proximity tilt and hover effects

**Files:**
- Create: `client/src/scene/MenuButton.tsx`
- Create: `client/src/hooks/useProximityTilt.ts`
- Create: `client/src/data/sceneConfig.ts`
- Modify: `client/src/scene/MenuHub.tsx`

- [x] Step 1: Create `sceneConfig.ts` — defines the 3D position for each button relative to the logo, and the camera target for each page.

```typescript
export interface PageConfig {
  id: string;
  label: string;
  route: string;
  group: "oeuvre" | "influences";
  buttonOffset: [number, number, number];
  cameraPosition: [number, number, number];
  cameraLookAt: [number, number, number];
}

export const PAGES: PageConfig[] = [
  {
    id: "heaven-and-nature",
    label: "Heaven & Nature",
    route: "/heaven-and-nature",
    group: "oeuvre",
    buttonOffset: [-3.5, 1.8, 0.5],
    cameraPosition: [-15, 2, 5],
    cameraLookAt: [-15, 0, 0],
  },
  {
    id: "see-canto",
    label: "See Canto",
    route: "/see-canto",
    group: "oeuvre",
    buttonOffset: [3.2, 2.2, -0.3],
    cameraPosition: [15, 3, 5],
    cameraLookAt: [15, 0, 0],
  },
  {
    id: "music",
    label: "Music",
    route: "/music",
    group: "oeuvre",
    buttonOffset: [-2.0, -1.5, 0.8],
    cameraPosition: [-10, -8, 5],
    cameraLookAt: [-10, -8, 0],
  },
  {
    id: "contact",
    label: "Contact",
    route: "/contact",
    group: "influences",
    buttonOffset: [2.8, -1.0, -0.5],
    cameraPosition: [12, -6, 5],
    cameraLookAt: [12, -6, 0],
  },
  {
    id: "reading-list",
    label: "Reading List",
    route: "/reading-list",
    group: "influences",
    buttonOffset: [0.5, 3.0, 0.2],
    cameraPosition: [3, 15, 5],
    cameraLookAt: [3, 15, 0],
  },
  {
    id: "inspirations",
    label: "Inspirations",
    route: "/inspirations",
    group: "influences",
    buttonOffset: [-1.0, -3.2, 0.4],
    cameraPosition: [-5, -15, 5],
    cameraLookAt: [-5, -15, 0],
  },
];

export const MENU_HUB_CAMERA = {
  position: [0, 0, 8] as [number, number, number],
  lookAt: [0, 0, 0] as [number, number, number],
};
```

- [x] Step 2: Create `useProximityTilt.ts` — tilts an object toward the cursor based on screen-space distance.

```typescript
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface ProximityTiltOptions {
  maxTilt?: number;    // degrees, default 15
  range?: number;      // screen-space distance threshold (0-1), default 0.3
  smoothing?: number;  // lerp factor, default 0.08
}

export function useProximityTilt(
  ref: React.RefObject<THREE.Mesh | null>,
  options: ProximityTiltOptions = {}
) {
  const { maxTilt = 15, range = 0.3, smoothing = 0.08 } = options;
  const { camera } = useThree();
  const targetRotation = useRef(new THREE.Euler());
  const maxRad = THREE.MathUtils.degToRad(maxTilt);
  const mouse = useRef({ x: 0, y: 0 });

  // Track mouse in NDC
  useFrame(() => {
    // Mouse tracking is via a global listener set in the parallax hook
    // This hook reads from a shared mouse state — for now, use pointer events
  });

  // Note: Implementation will use R3F's pointer events (onPointerMove on the Canvas)
  // or a shared mouse context. The exact wiring depends on how the parallax hook shares state.
  // Angel should create a shared MouseContext or use R3F's built-in pointer state.
}
```

Note: The proximity tilt implementation needs access to the mouse position. Angel should create a `MouseContext` provider that both the parallax and proximity systems read from, OR use R3F's `useThree().pointer` (which gives NDC coordinates of the last pointer event on the canvas). The `useThree().pointer` approach is simpler. Refine during implementation.

- [x] Step 3: Create `MenuButton.tsx` — a placeholder button with chrome material, lemniscate animation (with per-button phase offset), proximity tilt, and hover glow.

```tsx
import { useRef, useState } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useLemniscate } from "@/hooks/useLemniscate";
import type { PageConfig } from "@/data/sceneConfig";

interface MenuButtonProps {
  page: PageConfig;
  index: number;
  onClick: (page: PageConfig) => void;
  modelPath?: string; // Future: GLB file for this button
}

export function MenuButton({ page, index, onClick, modelPath }: MenuButtonProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Each button gets a different phase offset for the lemniscate
  useLemniscate(groupRef, {
    yAmplitude: 12,
    xAmplitude: 3,
    speed: 0.25,
    phaseOffset: index * (Math.PI / 3),
  });

  return (
    <group
      ref={groupRef}
      position={page.buttonOffset}
    >
      <mesh
        ref={meshRef}
        onClick={() => onClick(page)}
        onPointerEnter={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = "default"; }}
        scale={hovered ? 1.08 : 1}
      >
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshPhysicalMaterial
          color="#c0c0c0"
          metalness={0.95}
          roughness={0.05}
          envMapIntensity={1.5}
          emissive={hovered ? "#404060" : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="top"
        font="/fonts/SpaceMono-Regular.ttf"
      >
        {page.label}
      </Text>
    </group>
  );
}
```

- [x] Step 4: Update `MenuHub.tsx` to render all six `MenuButton` components from `PAGES` config.

- [x] Step 5: Verify — six labeled buttons float around the "@" logo, each lazily rotating with offset timing. Hovering shows glow + scale. Clicking logs to console (no navigation yet).

- [x] Step 6: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 7: Menu buttons with lemniscate, hover glow, proximity tilt" && git push
```

---

## Phase 2: Camera Navigation & Content Panels

- [x] **Task 8:** Camera controller with fly-to transitions

**Files:**
- Create: `client/src/hooks/useCamera.ts`
- Create: `client/src/scene/CameraController.tsx`
- Modify: `client/src/App.tsx`

- [x] Step 1: Create a camera state manager. Track: current page (or "hub"), whether transitioning, and target position/lookAt. Use React state + R3F's `useFrame` for smooth interpolation.

```typescript
// useCamera.ts
import { create } from "zustand"; // install: pnpm add zustand

interface CameraState {
  targetPosition: [number, number, number];
  targetLookAt: [number, number, number];
  currentPage: string | null; // null = hub
  isTransitioning: boolean;
  flyTo: (position: [number, number, number], lookAt: [number, number, number], pageId: string) => void;
  returnToHub: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  targetPosition: [0, 0, 8],
  targetLookAt: [0, 0, 0],
  currentPage: null,
  isTransitioning: false,
  flyTo: (position, lookAt, pageId) =>
    set({ targetPosition: position, targetLookAt: lookAt, currentPage: pageId, isTransitioning: true }),
  returnToHub: () =>
    set({ targetPosition: [0, 0, 8], targetLookAt: [0, 0, 0], currentPage: null, isTransitioning: true }),
}));
```

Note: Install zustand — `pnpm add zustand`.

- [x] Step 2: Create `CameraController.tsx` — reads from the store, smoothly lerps the camera position and lookAt each frame.

```tsx
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useCameraStore } from "@/hooks/useCamera";

export function CameraController() {
  const { camera } = useThree();
  const { targetPosition, targetLookAt, isTransitioning } = useCameraStore();
  const lookAtTarget = useRef(new THREE.Vector3());
  const posTarget = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    posTarget.current.set(...targetPosition);
    lookAtTarget.current.set(...targetLookAt);

    camera.position.lerp(posTarget.current, 0.03);
    currentLookAt.current.lerp(lookAtTarget.current, 0.03);
    camera.lookAt(currentLookAt.current);

    // Mark transition complete when close enough
    const dist = camera.position.distanceTo(posTarget.current);
    if (dist < 0.05 && isTransitioning) {
      useCameraStore.setState({ isTransitioning: false });
    }
  });

  return null;
}
```

- [x] Step 3: Wire button clicks to `flyTo`. Wire a temporary "Back" button (HTML overlay) to `returnToHub`.

- [x] Step 4: Verify — clicking a button smoothly flies the camera to a distant position. Clicking "Back" returns to hub. The "@" and buttons are visible from the hub but distant from page positions.

- [x] Step 5: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 8: Camera controller with fly-to transitions" && git push
```

---

- [x] **Task 9:** Content panel system

**Files:**
- Create: `client/src/panels/ContentPanel.tsx`
- Modify: `client/src/App.tsx` or `client/src/scene/Scene.tsx`

- [x] Step 1: Create `ContentPanel.tsx` — a Drei `<Html>` wrapper that renders a styled panel at the camera's target page location. Shows an X close button. Fades in after camera arrives, fades out on close.

```tsx
import { Html } from "@react-three/drei";
import { useCameraStore } from "@/hooks/useCamera";
import type { ReactNode } from "react";

interface ContentPanelProps {
  position: [number, number, number];
  pageId: string;
  children: ReactNode;
  onClose: () => void;
}

export function ContentPanel({ position, pageId, children, onClose }: ContentPanelProps) {
  const { currentPage, isTransitioning } = useCameraStore();
  const isVisible = currentPage === pageId && !isTransitioning;

  if (!isVisible) return null;

  return (
    <Html
      position={position}
      center
      distanceFactor={8}
      style={{
        width: "600px",
        maxHeight: "80vh",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.4s ease-in-out",
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      <div className="relative bg-black/80 backdrop-blur-sm text-white rounded-lg p-8 overflow-y-auto max-h-[80vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl leading-none"
        >
          &times;
        </button>
        {children}
      </div>
    </Html>
  );
}
```

- [x] Step 2: For each page in `PAGES`, render a `<ContentPanel>` with placeholder content ("Coming soon — [Page Name]").

- [x] Step 3: Wire the X button to `returnToHub()`.

- [x] Step 4: Verify — fly to a page, panel appears, X closes it and camera returns.

- [x] Step 5: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 9: Content panel system with Drei Html overlay" && git push
```

---

- [x] **Task 10:** URL routing integration

**Files:**
- Modify: `client/src/App.tsx`
- Install: `pnpm add wouter` (or use browser history API directly)

- [x] Step 1: Sync camera state with URL. When a button is clicked, update the URL to `/heaven-and-nature`, etc. When the user navigates directly to a URL, fly the camera to that page.

- [x] Step 2: The hub is `/`. Closing a panel navigates back to `/`.

- [x] Step 3: Browser back button should return to hub (close panel, fly camera back).

- [x] Step 4: Verify — direct URL navigation works, back button works, deep links work.

- [x] Step 5: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 10: URL routing synced with camera state" && git push
```

---

## Phase 3: Page Content

- [x] **Task 11:** Data model — projects and influences

**Files:**
- Create: `client/src/data/projects.ts`
- Create: `client/src/data/influences.ts`
- Create: `client/src/data/commentary.ts`

- [x] Step 1: Create `projects.ts` with the `Project` interface and initial data for Heaven & Nature, See Canto, and Music.

```typescript
export interface Project {
  id: string;
  title: string;
  description: string;
  media: {
    screenshots?: string[];
    videoUrl?: string;
    liveUrl?: string;
    repoUrl?: string;
  };
  techStack: string[];
  status: "live" | "in-progress" | "concept";
}

export const PROJECTS: Project[] = [
  {
    id: "heaven-and-nature",
    title: "Heaven & Nature",
    description: "Art-driven ethical streetwear brand website. Built with an autonomous AI build agent (Angel) working from specs overnight. 2007 personal homepage aesthetic — visible borders, density, texture, personality.",
    media: {
      liveUrl: "https://heaven-and-nature.vercel.app",
    },
    techStack: ["React", "Vite", "Tailwind CSS", "Vercel"],
    status: "live",
  },
  {
    id: "see-canto",
    title: "See Canto",
    description: "Classical singing visualization and analysis tool.",
    media: {},
    techStack: [],
    status: "concept",
  },
  {
    id: "music",
    title: "Music",
    description: "Andrew's music work and taste.",
    media: {},
    techStack: [],
    status: "in-progress",
  },
];
```

- [x] Step 2: Create `influences.ts` with the `Influence` interface and initial data for Contact, Reading List, and Inspirations. Populate with placeholder items.

- [x] Step 3: Create `commentary.ts` with director's commentary strings per page. Placeholder text for now — Andrew will write the real commentary.

- [x] Step 4: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 11: Data model — projects, influences, commentary" && git push
```

---

- [x] **Task 12:** Project panel layout

**Files:**
- Create: `client/src/panels/ProjectPanel.tsx`
- Modify: content panel rendering in App/Scene

- [x] Step 1: Create `ProjectPanel.tsx` — renders a `Project` inside a `ContentPanel`. Shows title, description, tech stack tags, status badge, and links.

- [x] Step 2: Wire the three project pages to render `ProjectPanel` with their data.

- [x] Step 3: Verify — fly to "Heaven & Nature", see the project details rendered in the panel.

- [x] Step 4: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 12: Project panel layout" && git push
```

---

- [x] **Task 13:** Influence panel layout

**Files:**
- Create: `client/src/panels/InfluencePanel.tsx`

- [x] Step 1: Create `InfluencePanel.tsx` — renders an `Influence` inside a `ContentPanel`. Shows title, intro, and a list of items with names, links, and annotations.

- [x] Step 2: Wire the three influence pages to render `InfluencePanel` with their data.

- [x] Step 3: Verify — fly to "Reading List", see the curated list rendered in the panel.

- [x] Step 4: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 13: Influence panel layout" && git push
```

---

- [x] **Task 14:** Typography selection for 2D panels

**Files:**
- Modify: `client/src/index.css`
- Modify: panel components as needed

- [x] Step 1: Propose 2-3 font combinations for the 2D panels. Consider: clean sans-serif body, monospace for metadata/labels, something distinctive for panel titles. Write proposals to `docs/plans/feedback.md` for Andrew's review.

- [x] Step 2: Implement Andrew's chosen fonts (or best judgment if no feedback yet). Install via Google Fonts or local files.

- [x] Step 3: Apply typography to all panel components.

- [x] Step 4: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 14: Typography for 2D content panels" && git push
```

---

## Phase 4: HUD System

- [x] **Task 15:** "@" HUD overlay — director's commentary

**Files:**
- Create: `client/src/hud/HudOverlay.tsx`
- Create: `client/src/hud/Commentary.tsx`
- Modify: `client/src/App.tsx`

- [x] Step 1: Create `HudOverlay.tsx` — a full-viewport React overlay (NOT inside R3F Canvas). Renders on top of everything when the "@" is clicked. Dark translucent background, blurs the 3D scene behind it.

- [x] Step 2: Create `Commentary.tsx` — displays the director's commentary text for the current page. Reads from `commentary.ts` based on current page ID.

- [x] Step 3: Add an "@" button to the UI (floating HTML, always visible when on a page). Clicking it toggles the HUD.

- [x] Step 4: HUD dismisses on: click outside content area, Escape key, or explicit close button.

- [x] Step 5: Verify — navigate to a page, click "@", see the commentary overlay. Dismiss it.

- [x] Step 6: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 15: HUD overlay with director's commentary" && git push
```

---

- [x] **Task 16:** Cyberspace nav (Halo-style)

**Files:**
- Create: `client/src/hud/CyberspaceNav.tsx`
- Modify: `client/src/hud/HudOverlay.tsx`

- [x] Step 1: Create `CyberspaceNav.tsx` — a styled navigation menu inside the HUD. Original Halo CE/2 aesthetic:
  - Dark translucent panels (`bg-[rgba(0,20,30,0.85)]`)
  - Angular/clipped geometry (CSS `clip-path` for angular panel shapes)
  - Scan line effect (CSS repeating linear gradient or pseudo-element)
  - Cyan/teal accent color (`#00E5FF`)
  - Monospace typography
  - Lists all six pages as nav links

- [x] Step 2: Clicking a nav link: closes the HUD, then flies the camera to that page.

- [x] Step 3: Current page is highlighted in the nav.

- [x] Step 4: Verify — open HUD, see Halo-style nav, click a different page, HUD closes and camera transitions.

- [x] Step 5: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 16: Cyberspace nav — Halo-style HUD navigation" && git push
```

---

## Phase 5: Mobile Experience

- [x] **Task 17:** Scroll-driven interaction for mobile

**Files:**
- Create: `client/src/hooks/useScrollInteraction.ts`
- Modify: `client/src/scene/MenuHub.tsx`, `client/src/scene/CameraController.tsx`

- [x] Step 1: Create `useScrollInteraction.ts` — captures scroll/wheel events on mobile (and desktop). Light scroll nudges the lemniscate speed/phase. Heavy sustained scroll tilts the camera up or down to reveal pages in that direction.

- [x] Step 2: Define thresholds: < 100px accumulated scroll = lemniscate nudge. > 300px accumulated in one direction = camera tilt toward a page. Map scroll direction to page positions (pages above hub = scroll up, pages below = scroll down).

- [x] Step 3: When scroll commits to a page (threshold crossed + pause), fly camera to nearest page in that direction.

- [x] Step 4: On mobile, prevent default page scroll. When a content panel is open, allow normal scroll within the panel.

- [x] Step 5: Verify on mobile viewport (Chrome DevTools device mode) — scroll drives scene interaction.

- [x] Step 6: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 17: Scroll-driven interaction for mobile" && git push
```

---

- [x] **Task 18:** Gyroscope progressive enhancement

**Files:**
- Create: `client/src/hooks/useGyroscope.ts`
- Modify: `client/src/hooks/useMouseParallax.ts` or `client/src/scene/MenuHub.tsx`

- [x] Step 1: Create `useGyroscope.ts` — wraps the DeviceOrientation API. Returns normalized tilt values (alpha, beta, gamma mapped to -1..1 range). Returns null if not supported. Handles permission request on iOS 13+ (`DeviceOrientationEvent.requestPermission()`).

- [x] Step 2: In the parallax system, prefer gyroscope values over mouse when available. On desktop (no gyro), mouse drives parallax. On mobile with gyro, device tilt drives parallax.

- [x] Step 3: Verify on a real phone if possible, or confirm the fallback works cleanly in desktop browsers (gyro returns null, mouse takes over).

- [x] Step 4: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 18: Gyroscope progressive enhancement for mobile parallax" && git push
```

---

- [x] **Task 19:** Static fallback for weak devices

**Files:**
- Create: `client/src/components/StaticFallback.tsx`
- Create: `client/src/lib/deviceCapability.ts`
- Modify: `client/src/App.tsx`

- [x] Step 1: Install `detect-gpu` — `pnpm add detect-gpu`.

- [x] Step 2: Create `deviceCapability.ts` — uses `detect-gpu` to classify the device. If GPU tier is 0 or 1, flag as "weak."

- [x] Step 3: Create `StaticFallback.tsx` — a 2D version of the menu. Renders a static background image (or CSS-only wireframe) with 2D button links. No Three.js loaded.

- [x] Step 4: In `App.tsx`, check device capability on mount. If weak, render `StaticFallback` instead of `Canvas`.

- [x] Step 5: Verify — the static fallback renders, links work, no 3D code is loaded.

- [x] Step 6: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 19: Static fallback for weak devices" && git push
```

---

## Phase 6: Polish

- [x] **Task 20:** Loading screen

**Files:**
- Create: `client/src/components/LoadingScreen.tsx`
- Modify: `client/src/App.tsx`

- [x] Step 1: Create `LoadingScreen.tsx` — displays while 3D assets load. Use Drei's `useProgress` hook to track loading percentage. Design should match the site aesthetic (wireframe, retro progress bar, "@" symbol animation).

- [x] Step 2: Show loading screen until assets are loaded, then fade/transition into the 3D scene.

- [x] Step 3: Verify — on first load (clear cache), loading screen appears, then scene reveals.

- [x] Step 4: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 20: Loading screen" && git push
```

---

- [ ] **Task 21:** Asset swap system for Blender models

**Files:**
- Modify: `client/src/scene/LogoModel.tsx`
- Modify: `client/src/scene/MenuButton.tsx`

- [ ] Step 1: Refactor `LogoModel.tsx` — when `modelPath` is provided, load the GLB via Drei's `useGLTF` and render it. When not provided, render the placeholder text mesh. The switch should be a single prop change.

- [ ] Step 2: Same for `MenuButton.tsx` — accept a `modelPath` prop that swaps the capsule geometry for a loaded GLB.

- [ ] Step 3: Test with a sample GLB (download any free model) to verify the swap works.

- [ ] Step 4: Document in `TOOLS.md`: "To swap a placeholder for a Blender asset, add the GLB to `client/public/models/` and set the `modelPath` prop to `/models/filename.glb`."

- [ ] Step 5: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 21: Asset swap system — placeholder to GLB hot-swap" && git push
```

---

- [ ] **Task 22:** Menu button fade during transitions

**Files:**
- Modify: `client/src/scene/MenuButton.tsx`
- Modify: `client/src/scene/MenuHub.tsx`

- [ ] Step 1: When the camera starts flying to a page, fade the buttons and logo (reduce opacity, scale down slightly). When returning to hub, fade them back in.

- [ ] Step 2: Use the `isTransitioning` and `currentPage` state from the camera store to drive the fade.

- [ ] Step 3: Verify — click a button, buttons gracefully recede. Return to hub, they come back.

- [ ] Step 4: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 22: Menu button fade during camera transitions" && git push
```

---

- [ ] **Task 23:** Performance optimization

**Files:**
- Various scene files

- [ ] Step 1: Audit the R3F scene for performance. Check:
  - Are materials shared (not recreated per component)?
  - Are geometries instanced where possible?
  - Is `useFrame` doing minimal work?
  - Are `<Html>` components only rendered when visible?

- [ ] Step 2: Add `React.memo` to static scene components. Use `useMemo` for geometries and materials.

- [ ] Step 3: Test performance — target 60fps on mid-range hardware, 30fps minimum on low-end.

- [ ] Step 4: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 23: Performance optimization" && git push
```

---

- [ ] **Task 24:** Vercel configuration and meta tags

**Files:**
- Create or modify: `vercel.json` (if needed for SPA routing)
- Modify: `index.html`

- [ ] Step 1: Add proper meta tags: title, description, OpenGraph image, favicon.

- [ ] Step 2: Ensure SPA routing works on Vercel (all routes serve `index.html`). Add `vercel.json` rewrite rules if needed.

- [ ] Step 3: Verify — direct URL navigation works on the deployed site, social previews show correct metadata.

- [ ] Step 4: Run `pnpm check`, commit, push.

```bash
git add -A && git commit -m "Task 24: Vercel config and meta tags" && git push
```

---

## Phase 7: Audio (Future — Blocked Until Commissioned)

- [ ] **Task 25:** Audio system scaffold
- [ ] **Task 26:** Integrate commissioned audio assets

These tasks are blocked until Andrew commissions and receives audio from friends. Do not start.

---

**After each task:** `pnpm check` → commit → push → update this file → update progress-log.md
