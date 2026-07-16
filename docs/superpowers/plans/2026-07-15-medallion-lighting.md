# Medallion Lighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reversible studio-lighting preview that reveals the medallion with broad neutral-white light, deep contour shadows, controlled reflections, and cyan restricted to a blue-steel edge signal; promote it only after Andrew's real-browser approval.

**Architecture:** A typed lighting configuration supplies a static Drei `Lightformer` environment and a separate direct-light key. A URL-derived lighting mode keeps the existing city rig as the default during review, while the studio mode receives explicit renderer settings and per-mesh reflection strengths. Pure URL and mesh-role decisions are covered by Node tests; visual acceptance remains a real-browser gate.

**Tech Stack:** React 19, TypeScript 5.9, React Three Fiber 9, Drei 10, Three.js 0.180, Vite 7, Node's built-in test runner, pnpm 10

## Global Constraints

- All visual art must be human-made. Do not add generated images, illustrations, HDR panoramas, textures, decorative assets, or 3D models.
- Code-authored lights, `Lightformer` reflection cards, renderer settings, and procedural effects are allowed.
- The direct key is neutral white. Do not add an amber/yellow direct light.
- Cyan may appear only through the weak blue-steel reflection card and existing screen/hover emission; do not add a cyan direct light.
- Use a 256px procedural environment captured once with `frames={1}`.
- Do not add bloom, post-processing dependencies, dynamic shadows, SSAO, contact shadows, or real-time cube-map updates.
- Do not change the GLB, its textures, the 256px screen canvases, the 30Hz screen redraw loop, route data, project copy, Cottage, or Contact taxonomy.
- Preserve the capped DPR, weak-device static fallback, `?force-3d=1`, and `?classic=1` behavior.
- Studio lighting stays behind `?lighting=studio` until Andrew approves it in a real browser.
- Run `pnpm test`, `pnpm check`, and `pnpm build` after code changes.
- Keep `AGENTS.md` and `CLAUDE.md` byte-for-byte identical.

---

## File Map

- Create `client/src/scene/lightingConfig.ts`: lighting constants plus URL preview-mode parsing.
- Create `client/src/scene/ArtifactLighting.tsx`: direct key/fill and static procedural reflection environment.
- Modify `client/src/scene/Environment.tsx`: choose legacy or studio atmosphere/rig.
- Create `client/src/scene/medallionMaterialRole.ts`: pure mesh-role and reflection-strength lookup.
- Modify `client/src/components/SceneExperience.tsx`: choose mode, renderer tone mapping/exposure, and city/studio environment.
- Modify `client/src/scene/MenuHub.tsx`: pass lighting mode to the medallion.
- Modify `client/src/scene/MedallionHub.tsx`: tune cloned materials only in studio mode.
- Create `tests/lightingConfig.test.ts`: URL/config contract tests.
- Create `tests/medallionMaterialRole.test.ts`: stable GLB-name classification tests.
- Modify `package.json`: expose the dependency-free Node test command.
- Modify `AGENTS.md` and `CLAUDE.md`: document the new test command and preview flags without letting the twins drift.
- Modify `docs/plans/lighting-session.md`: reconcile the old amber-key proposal with Andrew's approved neutral-white direction.
- Modify `docs/plans/progress-log.md`: record the preview deployment and later promotion.

### Task 1: Define and test the studio-lighting contract

**Files:**
- Create: `tests/lightingConfig.test.ts`
- Create: `client/src/scene/lightingConfig.ts`
- Modify: `package.json:6-10`

**Interfaces:**
- Produces: `LightingMode = "legacy" | "studio"`.
- Produces: `StudioToneMapping = "agx" | "aces"`.
- Produces: `getLightingPreviewSettings(search: string): { mode: LightingMode; toneMapping: StudioToneMapping; screensDormant: boolean }`.
- Produces: `STUDIO_LIGHTING`, the single tuning object consumed by the rig, renderer, and material lookup.

- [ ] **Step 1: Write the failing URL and lighting-contract tests**

Create `tests/lightingConfig.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getLightingPreviewSettings,
  STUDIO_LIGHTING,
} from "../client/src/scene/lightingConfig.ts";

test("legacy lighting remains the default during preview review", () => {
  assert.deepEqual(getLightingPreviewSettings(""), {
    mode: "legacy",
    toneMapping: "agx",
    screensDormant: false,
  });
  assert.equal(getLightingPreviewSettings("?lighting=studio").mode, "studio");
  assert.equal(getLightingPreviewSettings("?lighting=unknown").mode, "legacy");
  assert.equal(
    getLightingPreviewSettings("?lighting=studio&screens=dormant").screensDormant,
    true,
  );
});

test("ACES can be compared without changing studio exposure", () => {
  assert.equal(
    getLightingPreviewSettings("?lighting=studio&tone=aces").toneMapping,
    "aces",
  );
  assert.equal(getLightingPreviewSettings("?tone=unknown").toneMapping, "agx");
});

test("the studio rig is static, neutral-keyed, and reflection-led", () => {
  assert.equal(STUDIO_LIGHTING.environment.resolution, 256);
  assert.equal(STUDIO_LIGHTING.environment.frames, 1);
  assert.equal(STUDIO_LIGHTING.direct.key.color, "#ffffff");
  assert.equal(STUDIO_LIGHTING.direct.fill.color, "#eef2f6");

  const coolCards = STUDIO_LIGHTING.environment.cards.filter(
    (card) => card.role === "cool-edge",
  );
  const mainCard = STUDIO_LIGHTING.environment.cards.find(
    (card) => card.id === "front-softbox",
  );

  assert.equal(coolCards.length, 1);
  assert.ok(mainCard);
  assert.ok(coolCards[0].intensity < mainCard.intensity);
});

test("chrome reflects most and the mineral body reflects least", () => {
  const { body, chrome, screen } = STUDIO_LIGHTING.materialEnvIntensity;
  assert.ok(chrome > screen);
  assert.ok(screen > body);
});
```

- [ ] **Step 2: Run the test and verify the missing contract fails**

Run:

```bash
node --test tests/lightingConfig.test.ts
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `client/src/scene/lightingConfig.ts`.

- [ ] **Step 3: Implement the typed lighting configuration and preview parser**

Create `client/src/scene/lightingConfig.ts`:

```ts
export type LightingMode = "legacy" | "studio";
export type StudioToneMapping = "agx" | "aces";

export interface LightingPreviewSettings {
  mode: LightingMode;
  toneMapping: StudioToneMapping;
  screensDormant: boolean;
}

export function getLightingPreviewSettings(search: string): LightingPreviewSettings {
  const params = new URLSearchParams(search);
  return {
    mode: params.get("lighting") === "studio" ? "studio" : "legacy",
    toneMapping: params.get("tone") === "aces" ? "aces" : "agx",
    screensDormant: params.get("screens") === "dormant",
  };
}

export const STUDIO_LIGHTING = {
  background: "#080a0d",
  fog: {
    color: "#080a0d",
    near: 12,
    far: 34,
  },
  grid: {
    cellColor: "#1b2329",
    sectionColor: "#2a353e",
    fadeDistance: 24,
    fadeStrength: 1.5,
  },
  renderer: {
    exposure: 0.92,
  },
  direct: {
    fill: {
      color: "#eef2f6",
      intensity: 0.06,
    },
    key: {
      color: "#ffffff",
      intensity: 1.35,
      position: [0.8, 4.6, 7.5] as [number, number, number],
    },
  },
  environment: {
    resolution: 256,
    frames: 1,
    cards: [
      {
        id: "front-softbox",
        role: "neutral" as const,
        color: "#f8fafc",
        intensity: 2.4,
        position: [0, 2.4, 6] as [number, number, number],
        scale: [8, 6] as [number, number],
      },
      {
        id: "left-shaper",
        role: "neutral" as const,
        color: "#dfe5ea",
        intensity: 1.05,
        position: [-4.5, 1, 1] as [number, number, number],
        scale: [1.6, 6] as [number, number],
      },
      {
        id: "lower-separator",
        role: "neutral" as const,
        color: "#cbd3da",
        intensity: 0.45,
        position: [0, -5, 0] as [number, number, number],
        scale: [5, 1.5] as [number, number],
      },
      {
        id: "aurora-edge",
        role: "cool-edge" as const,
        color: "#94d9ee",
        intensity: 0.35,
        position: [5, 1, -2] as [number, number, number],
        scale: [0.75, 6.5] as [number, number],
      },
    ],
  },
  materialEnvIntensity: {
    body: 0.55,
    chrome: 1.25,
    screen: 0.85,
    default: 0.7,
  },
};
```

- [ ] **Step 4: Add the dependency-free test command**

Change the `scripts` object in `package.json` to:

```json
"scripts": {
  "dev": "vite",
  "test": "node --test tests/*.test.ts",
  "build": "tsc -b && vite build",
  "check": "tsc --noEmit"
}
```

- [ ] **Step 5: Run the contract tests**

Run:

```bash
pnpm test
```

Expected: 4 tests pass, 0 fail.

- [ ] **Step 6: Commit the tested contract**

```bash
git add package.json client/src/scene/lightingConfig.ts tests/lightingConfig.test.ts
git commit -m "test: define studio lighting contract"
```

### Task 2: Build the dormant procedural studio rig

**Files:**
- Create: `client/src/scene/ArtifactLighting.tsx`
- Modify: `client/src/scene/Environment.tsx:1-25`

**Interfaces:**
- Consumes: `STUDIO_LIGHTING` and `LightingMode` from Task 1.
- Produces: `ArtifactLighting(): JSX.Element`.
- Produces: `Environment({ lightingMode?: LightingMode }): JSX.Element`; its default remains `"legacy"` until Task 3 wires the URL mode.

- [ ] **Step 1: Confirm the tested configuration still passes before rendering it**

Run:

```bash
pnpm test
```

Expected: 4 tests pass, 0 fail.

- [ ] **Step 2: Implement the static procedural reflection environment**

Create `client/src/scene/ArtifactLighting.tsx`:

```tsx
import { Environment as DreiEnvironment, Lightformer } from "@react-three/drei";
import { memo } from "react";
import { STUDIO_LIGHTING } from "./lightingConfig";

export const ArtifactLighting = memo(function ArtifactLighting() {
  const { direct, environment } = STUDIO_LIGHTING;

  return (
    <>
      <ambientLight color={direct.fill.color} intensity={direct.fill.intensity} />
      <directionalLight
        color={direct.key.color}
        intensity={direct.key.intensity}
        position={direct.key.position}
      />
      <DreiEnvironment
        background={false}
        resolution={environment.resolution}
        frames={environment.frames}
      >
        {environment.cards.map((card) => (
          <Lightformer
            key={card.id}
            color={card.color}
            intensity={card.intensity}
            position={card.position}
            scale={card.scale}
            target={[0, 0, 0]}
          />
        ))}
      </DreiEnvironment>
    </>
  );
});
```

- [ ] **Step 3: Make the scene environment select legacy or studio atmosphere**

Replace `client/src/scene/Environment.tsx` with:

```tsx
import { Grid } from "@react-three/drei";
import { memo } from "react";
import { ArtifactLighting } from "./ArtifactLighting";
import { STUDIO_LIGHTING, type LightingMode } from "./lightingConfig";

interface EnvironmentProps {
  lightingMode?: LightingMode;
}

export const Environment = memo(function Environment({
  lightingMode = "legacy",
}: EnvironmentProps) {
  const studio = lightingMode === "studio";
  const background = studio ? STUDIO_LIGHTING.background : "#1a1a1a";
  const fog = studio
    ? STUDIO_LIGHTING.fog
    : { color: "#1a1a1a", near: 15, far: 40 };
  const grid = studio
    ? STUDIO_LIGHTING.grid
    : {
        cellColor: "#404040",
        sectionColor: "#808080",
        fadeDistance: 30,
        fadeStrength: 1,
      };

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[fog.color, fog.near, fog.far]} />
      <Grid
        position={[0, -3, 0]}
        args={[100, 100]}
        cellSize={1}
        cellColor={grid.cellColor}
        sectionSize={5}
        sectionColor={grid.sectionColor}
        fadeDistance={grid.fadeDistance}
        fadeStrength={grid.fadeStrength}
        infiniteGrid
      />
      {studio ? (
        <ArtifactLighting />
      ) : (
        <>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />
          <pointLight position={[-5, 5, -5]} intensity={0.3} />
        </>
      )}
    </>
  );
});
```

- [ ] **Step 4: Verify the dormant rig compiles without changing the default scene**

Run:

```bash
pnpm check
pnpm build
```

Expected: both exit 0; build retains only the existing non-blocking `vendor-three` chunk warning.

- [ ] **Step 5: Commit the procedural rig**

```bash
git add client/src/scene/ArtifactLighting.tsx client/src/scene/Environment.tsx
git commit -m "feat: add procedural artifact lighting rig"
```

### Task 3: Wire preview mode, tone mapping, and material roles

**Files:**
- Create: `tests/medallionMaterialRole.test.ts`
- Create: `client/src/scene/medallionMaterialRole.ts`
- Modify: `client/src/components/SceneExperience.tsx:1-16,33-42,151-162`
- Modify: `client/src/scene/MenuHub.tsx:1-20,78-88`
- Modify: `client/src/scene/MedallionHub.tsx:1-13,33-50,60-88`

**Interfaces:**
- Consumes: `LightingMode`, `STUDIO_LIGHTING`, and `getLightingPreviewSettings` from Task 1.
- Produces: `MedallionMaterialRole = "body" | "chrome" | "screen" | "default"`.
- Produces: `getMedallionMaterialRole(meshName: string): MedallionMaterialRole`.
- Produces: `getMedallionEnvMapIntensity(meshName: string): number`.
- Extends: `MenuHubProps` and `MedallionHubProps` with required `lightingMode: LightingMode` and `screensDormant: boolean` diagnostic plumbing.

- [ ] **Step 1: Write the failing mesh-role tests**

Create `tests/medallionMaterialRole.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  getMedallionEnvMapIntensity,
  getMedallionMaterialRole,
} from "../client/src/scene/medallionMaterialRole.ts";
import { STUDIO_LIGHTING } from "../client/src/scene/lightingConfig.ts";

test("stable GLB names map to the intended material roles", () => {
  assert.equal(getMedallionMaterialRole("shield_body"), "body");
  assert.equal(getMedallionMaterialRole("medallion_core"), "body");
  assert.equal(getMedallionMaterialRole("medallion_at"), "chrome");
  assert.equal(getMedallionMaterialRole("section_01_bezel"), "chrome");
  assert.equal(getMedallionMaterialRole("section_07_screen"), "screen");
  assert.equal(getMedallionMaterialRole("unexpected_mesh"), "default");
});

test("mesh names receive the configured reflection strengths", () => {
  assert.equal(
    getMedallionEnvMapIntensity("shield_body"),
    STUDIO_LIGHTING.materialEnvIntensity.body,
  );
  assert.equal(
    getMedallionEnvMapIntensity("section_03_bezel"),
    STUDIO_LIGHTING.materialEnvIntensity.chrome,
  );
  assert.equal(
    getMedallionEnvMapIntensity("section_03_screen"),
    STUDIO_LIGHTING.materialEnvIntensity.screen,
  );
});
```

- [ ] **Step 2: Run the suite and verify the missing helper fails**

Run:

```bash
pnpm test
```

Expected: the four Task 1 tests pass, then the new test file fails with `ERR_MODULE_NOT_FOUND` for `medallionMaterialRole.ts`.

- [ ] **Step 3: Implement the pure mesh-role lookup**

Create `client/src/scene/medallionMaterialRole.ts`:

```ts
import { STUDIO_LIGHTING } from "./lightingConfig";

export type MedallionMaterialRole = "body" | "chrome" | "screen" | "default";

export function getMedallionMaterialRole(meshName: string): MedallionMaterialRole {
  if (meshName === "shield_body" || meshName === "medallion_core") {
    return "body";
  }
  if (meshName === "medallion_at" || /^section_0\d_bezel$/.test(meshName)) {
    return "chrome";
  }
  if (/^section_0\d_screen$/.test(meshName)) {
    return "screen";
  }
  return "default";
}

export function getMedallionEnvMapIntensity(meshName: string): number {
  return STUDIO_LIGHTING.materialEnvIntensity[getMedallionMaterialRole(meshName)];
}
```

- [ ] **Step 4: Run the pure tests**

Run:

```bash
pnpm test
```

Expected: 6 tests pass, 0 fail.

- [ ] **Step 5: Select preview mode and renderer settings once per scene mount**

In `client/src/components/SceneExperience.tsx`:

1. Add `import * as THREE from "three";`.
2. Add:

```ts
import {
  getLightingPreviewSettings,
  STUDIO_LIGHTING,
} from "@/scene/lightingConfig";
```

3. After the existing store selectors, add:

```ts
  const lightingSettings = useMemo(
    () => getLightingPreviewSettings(window.location.search),
    [],
  );
  const toneMapping =
    lightingSettings.mode === "studio" && lightingSettings.toneMapping === "agx"
      ? THREE.AgXToneMapping
      : THREE.ACESFilmicToneMapping;
  const toneMappingExposure =
    lightingSettings.mode === "studio" ? STUDIO_LIGHTING.renderer.exposure : 1;
```

4. Replace the Canvas opening and first scene children with:

```tsx
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping,
          toneMappingExposure,
        }}
      >
        <Environment lightingMode={lightingSettings.mode} />
        {lightingSettings.mode === "legacy" ? (
          <DreiEnvironment preset="city" />
        ) : null}
        <CameraController />
        <MenuHub
          onPageSelect={handlePageSelect}
          bootSequenceId={bootSequenceId}
        />
```

Leave the remaining panel children unchanged.

- [ ] **Step 6: Check the rig and renderer before material tuning**

Run:

```bash
pnpm check
pnpm dev --host 127.0.0.1
```

Open `http://127.0.0.1:3001/?force-3d=1&lighting=studio`, then the same URL
with `&tone=aces`. Expected: the studio atmosphere, direct rig, and tone mapping
load while all medallion materials retain their original GLB environment
strengths. Record this checkpoint if browser capture works; it isolates the rig
from the material-role change that follows.

- [ ] **Step 7: Pass the lighting and screen-diagnostic modes through the menu hub**

First, replace the existing `<MenuHub>` call in
`client/src/components/SceneExperience.tsx` with:

```tsx
        <MenuHub
          onPageSelect={handlePageSelect}
          bootSequenceId={bootSequenceId}
          lightingMode={lightingSettings.mode}
          screensDormant={lightingSettings.screensDormant}
        />
```

In `client/src/scene/MenuHub.tsx`, add:

```ts
import type { LightingMode } from "./lightingConfig";
```

Replace the props interface and function signature with:

```ts
interface MenuHubProps {
  onPageSelect: (page: PageConfig) => void;
  bootSequenceId: number;
  lightingMode: LightingMode;
  screensDormant: boolean;
}

export function MenuHub({
  onPageSelect,
  bootSequenceId,
  lightingMode,
  screensDormant,
}: MenuHubProps) {
```

Add both props to the existing `<MedallionHub>` call:

```tsx
            lightingMode={lightingMode}
            screensDormant={screensDormant}
```

- [ ] **Step 8: Tune cloned medallion materials only in studio mode**

In `client/src/scene/MedallionHub.tsx`, add:

```ts
import type { LightingMode } from "./lightingConfig";
import { getMedallionEnvMapIntensity } from "./medallionMaterialRole";
```

Replace the props interface and destructuring header with:

```ts
interface MedallionHubProps {
  onPageSelect: (page: PageConfig) => void;
  bootSequenceId: number;
  lightingMode: LightingMode;
  screensDormant: boolean;
  disabled?: boolean;
  opacity?: number;
}

export const MedallionHub = memo(function MedallionHub({
  onPageSelect,
  bootSequenceId,
  lightingMode,
  screensDormant,
  disabled = false,
  opacity = 1,
}: MedallionHubProps) {
```

Inside the clone traversal, replace the current material cloning assignment with:

```ts
      const cloneMaterial = (material: THREE.Material) => {
        const cloned = material.clone();
        if (lightingMode === "studio" && "envMapIntensity" in cloned) {
          (cloned as THREE.MeshStandardMaterial).envMapIntensity =
            getMedallionEnvMapIntensity(child.name);
        }
        return cloned;
      };
      child.material = Array.isArray(child.material)
        ? child.material.map(cloneMaterial)
        : cloneMaterial(child.material);
```

Change the clone memo dependency from:

```ts
  }, [scene]);
```

to:

```ts
  }, [scene, lightingMode]);
```

Replace the screen-boot effect with the diagnostic-aware version:

```ts
  useEffect(() => {
    if (!bootSequenceId || screensDormant) return;
    wake.bootAll(HELMET_BOOT_SCREEN_DELAY_S, HELMET_BOOT_SCREEN_STAGGER_S);
  }, [bootSequenceId, screensDormant, wake]);
```

With `?screens=dormant`, `ScreenWakeManager.attach` still installs the black
glass emissive map at intensity 0, but the boot cascade never starts. This is a
diagnostic path only; normal screen behavior is unchanged.

- [ ] **Step 9: Verify preview integration**

Run:

```bash
pnpm test
pnpm check
pnpm build
```

Expected: 6 tests pass; type check and build exit 0; no new dependency or asset appears; only the existing non-blocking `vendor-three` warning remains.

- [ ] **Step 10: Commit the preview integration**

```bash
git add tests/medallionMaterialRole.test.ts client/src/scene/medallionMaterialRole.ts client/src/components/SceneExperience.tsx client/src/scene/MenuHub.tsx client/src/scene/MedallionHub.tsx
git commit -m "feat: wire studio lighting preview"
```

### Task 4: Verify, document, and prepare the reviewed preview

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `docs/plans/lighting-session.md:1-6`
- Modify: `docs/plans/progress-log.md`
- Modify: `.gitignore`
- Add: `docs/superpowers/specs/2026-07-15-medallion-lighting-design.md`
- Add: `docs/superpowers/plans/2026-07-15-medallion-lighting.md`

**Interfaces:**
- Produces the live review URLs:
  - Legacy: `https://andalftri.vercel.app/?force-3d=1`
  - Studio AgX: `https://andalftri.vercel.app/?force-3d=1&lighting=studio`
  - Studio ACES: `https://andalftri.vercel.app/?force-3d=1&lighting=studio&tone=aces`
- Preserves the public default as legacy until Task 5.

- [ ] **Step 1: Run the complete local verification suite**

Run:

```bash
pnpm test
pnpm check
pnpm build
git diff --check
```

Expected: 6 tests pass; check/build/diff-check exit 0; only the existing non-blocking bundle warning remains.

- [ ] **Step 2: Smoke-test all diagnostic paths in a real or in-app browser**

Run:

```bash
pnpm dev --host 127.0.0.1
```

Open these exact local URLs:

```text
http://127.0.0.1:3001/?force-3d=1
http://127.0.0.1:3001/?force-3d=1&lighting=studio
http://127.0.0.1:3001/?force-3d=1&lighting=studio&tone=aces
http://127.0.0.1:3001/?force-3d=1&lighting=studio&screens=dormant
http://127.0.0.1:3001/?force-3d=1&lighting=studio&classic=1
```

Expected: each route reaches the app without a console exception, model/Draco/texture request failure, or routing regression. The studio network log has no remote city-HDR request. The dormant-screen diagnostic leaves the underlying glass black and available for reflection inspection. Automated capture is not visual approval.

- [ ] **Step 3: Synchronize the root instruction twins**

In both `AGENTS.md` and `CLAUDE.md`, replace the command block with:

```bash
pnpm dev       # Vite development server at http://localhost:3001
pnpm test      # Dependency-free Node tests for pure scene contracts
pnpm check     # TypeScript validation
pnpm build     # TypeScript project build + production Vite bundle
```

Replace “There is currently no automated test script” with:

```text
Pure scene contracts have dependency-free Node tests under `tests/`; visual WebGL behavior still requires real-browser review.
```

Verify:

```bash
cmp -s AGENTS.md CLAUDE.md
```

Expected: exit 0.

- [ ] **Step 4: Reconcile the older lighting-session plan**

Change the status at the top of `docs/plans/lighting-session.md` to:

```markdown
Status: superseded in part by Andrew's approved 2026-07-15 design. The studio
preview is implemented behind `?lighting=studio` and awaits real-browser visual
signoff. See `docs/superpowers/specs/2026-07-15-medallion-lighting-design.md`.
```

Insert before the existing diagnosis:

```markdown
## 0. Approved 2026-07-15 direction

- Warmth comes from the baked mineral material, not an amber/yellow light.
- Use a broad neutral-white key with deep contour shadows.
- Use a controlled procedural reflection environment instead of the city HDRI.
- Cyan is a weak blue-steel reflection on chrome/glass plus existing screen and
  hover emission; it is not a direct wash across the copper body.
- Bloom and dynamic shadows remain deferred until the non-bloom rig passes.
```

- [ ] **Step 5: Record the preview in the progress log**

Append to `docs/plans/progress-log.md`:

```markdown
## 2026-07-15

- Approved the medallion lighting direction with Andrew: neutral-white key,
  deep contours, warmth preserved in the baked mineral material, and a restrained
  blue-steel reflection that connects to the helmet aurora without washing the
  copper cyan.
- Added the procedural studio-lighting preview behind `?lighting=studio`, with
  `?tone=aces` for matched ACES/AgX review and the existing public lighting left
  as the default until real-browser signoff.
- Added dependency-free tests for preview parsing and the GLB material-role
  contract; `pnpm test`, `pnpm check`, and `pnpm build` pass.
```

- [ ] **Step 6: Commit the complete preview documentation on the feature branch**

```bash
git add -A
git commit -m "docs: record studio lighting preview"
```

Expected: the feature branch is clean and contains all preview code, tests, and
documentation. Do not push or merge it until the subagent-driven final branch
review is clean.

- [ ] **Step 7: After final review and branch integration, give Andrew the live comparison links and visual checklist**

The controller—not the Task 4 implementer—uses the branch-finishing workflow to
integrate the reviewed feature branch into `main`, pushes `main`, waits roughly
30 seconds for Vercel, and then provides the three links above.

Ask Andrew to compare the live legacy, Studio AgX, and Studio ACES URLs at the same viewport. Request judgment on only these points:

1. Does the copper retain more variation without looking yellow or washed out?
2. Does white light cover enough of the face while the contours remain mysterious?
3. Do chrome and black glass have readable, shaped reflections?
4. Is the cyan trace subtle enough to blend with the mask's aurora?
5. Does the lighting remain coherent as the medallion drifts and tilts?
6. Does one page flight and return preserve the lighting and screen fade?
7. Does a narrow/mobile viewport preserve the hierarchy without clipping the hub?

Do not call the lighting complete before Andrew answers.

### Task 5: Promote the approved studio rig and retain rollback

**Gate:** Execute only after Andrew explicitly approves the live Studio AgX preview. If Andrew prefers ACES or asks for tuning, amend the approved design and this plan before promotion.

**Files:**
- Modify: `tests/lightingConfig.test.ts`
- Modify: `client/src/scene/lightingConfig.ts`
- Modify: `docs/plans/lighting-session.md`
- Modify: `docs/plans/progress-log.md`

**Interfaces:**
- Changes the no-query default from `"legacy"` to `"studio"`.
- Retains `?lighting=legacy` as the rollback path.
- Retains AgX at exposure `0.92` as the approved default.

- [ ] **Step 1: Change the mode tests first**

Replace the first test in `tests/lightingConfig.test.ts` with:

```ts
test("studio lighting is the default after visual approval", () => {
  assert.deepEqual(getLightingPreviewSettings(""), {
    mode: "studio",
    toneMapping: "agx",
    screensDormant: false,
  });
  assert.equal(getLightingPreviewSettings("?lighting=legacy").mode, "legacy");
  assert.equal(getLightingPreviewSettings("?lighting=studio").mode, "studio");
  assert.equal(getLightingPreviewSettings("?lighting=unknown").mode, "studio");
});
```

- [ ] **Step 2: Run the test and verify it fails against the preview default**

Run:

```bash
pnpm test
```

Expected: the new default/legacy assertions fail; all other tests pass.

- [ ] **Step 3: Promote studio and make legacy the explicit override**

In `getLightingPreviewSettings`, replace the `mode` line with:

```ts
    mode: params.get("lighting") === "legacy" ? "legacy" : "studio",
```

- [ ] **Step 4: Run final verification**

Run:

```bash
pnpm test
pnpm check
pnpm build
git diff --check
```

Expected: 6 tests pass; all other commands exit 0; only the existing non-blocking bundle warning remains.

- [ ] **Step 5: Mark the lighting session complete in the focused plan and progress log**

Change the `docs/plans/lighting-session.md` status to:

```markdown
Status: complete after Andrew's real-browser approval. Studio lighting is the
default; `?lighting=legacy` remains as a temporary rollback comparison.
```

Append to the existing `2026-07-15` progress entry:

```markdown
- Andrew approved the live Studio AgX view. Promoted it to the public default
  and retained `?lighting=legacy` as a temporary rollback path.
```

- [ ] **Step 6: Commit and push the promotion**

```bash
git add tests/lightingConfig.test.ts client/src/scene/lightingConfig.ts docs/plans/lighting-session.md docs/plans/progress-log.md
git commit -m "feat: promote approved studio lighting"
git push
```

Expected: push to `origin/main` succeeds; Vercel begins the public-default update and normally finishes in roughly 30 seconds.
