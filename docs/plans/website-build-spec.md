# andrewalfredtrimble — Website Build Spec

**Created:** 2026-04-07
**Version:** 1.0

---

## Vision

A personal portfolio website that breaks entirely from convention. The site is itself a portfolio piece — the frame is as sublime as the painted canvas. It showcases Andrew's taste and vibe-coded projects through an interactive 3D experience inspired by Y2K / frutiger aero / early internet aesthetics.

The homepage appears as an early-2000s video game menu screen floating in a gray wireframe void. Glossy, chromed, skeuomorphic buttons with moiré effects jut organically from a central "@" logo. Every interaction feels alive — the scene responds to the cursor, the buttons breathe, and navigating between pages is a cinematic camera flight through 3D space.

---

## Aesthetic & References

**Style:** Y2K frutiger aero, early internet, game UI, glossy skeuomorphism
**Mood:** A high-end tech demo that doubles as art direction. Chrome, glass, iridescence, wireframe geometry. Not retro for nostalgia's sake — retro as a design language that communicates craft.

**Key visual qualities:**
- Glossy, chromed surfaces with specular highlights
- Moiré patterns / interference effects on button surfaces
- Organic shapes — buttons aren't rectangles, they jut and flow
- Gray wireframe void as the "world" — minimal, structural, neutral
- Skeuomorphic edges and bevels (think Aqua-era macOS meets Halo CE)

**HUD reference:** Original Halo (CE/2) — translucent panels, angular geometry, scan lines, cyan/teal palette, military-utilitarian UI

---

## Site Map

### Homepage (Menu Hub)
The camera's default position. The "@" logo sits at center. Six glossy buttons radiate outward from it in organic positions. The scene floats in a gray wireframe void.

### Pages — Two Groups

**Oeuvre (Projects):**
1. **Heaven & Nature** — Art-driven streetwear brand website (live, built with Angel)
2. **See Canto** — Classical singing visualization and analysis tool
3. **Music** — Andrew's music work/taste

**Influences (Taste):**
4. **Contact** — How to reach Andrew
5. **Reading List** — Curated books/articles
6. **Inspirations** — Design references, things that shaped his taste

Each page exists at a unique position in 3D space. The camera flies to that position when selected. Pages float in their own medium — some on clouds, some in bubbles, some in zero-g. The specific medium per page will be determined when Blender assets are created.

---

## The "@" Logo

The centerpiece of the homepage. The "@" symbol rendered in a style reminiscent of **Kingthings Spikeless** — a calligraphic, slightly thorny, medieval-feeling typeface. It will be modeled in Blender and exported as GLB.

**Placeholder:** Until the real model arrives, use a Three.js `TextGeometry` with a serif/blackletter web font, or a simple torus knot as a stand-in. The placeholder must be swappable by changing one import path.

---

## Menu Buttons

Six buttons jut organically from the "@" logo. Each button is a distinct, non-rectangular shape — they're sculptural objects, not UI rectangles. Glossy chrome material with moiré surface effects.

**Placeholder:** Until Blender models arrive, use simple 3D shapes (rounded boxes, capsules, spheres) with a reflective MeshPhysicalMaterial. Each should have a text label (via Drei `<Text>` or `<Html>`).

### Button Labels
1. "Heaven & Nature" → `/heaven-and-nature`
2. "See Canto" → `/see-canto`
3. "Music" → `/music`
4. "Contact" → `/contact`
5. "Reading List" → `/reading-list`
6. "Inspirations" → `/inspirations`

### Button Positioning
Buttons are arranged around the "@" logo at varying distances and angles — not in a grid or circle. They overlap slightly in depth. Think of them as growing out of the logo like branches. Exact positions will be tuned visually.

---

## Interactivity

### Idle Animation — Lemniscate Rotation
All buttons (and the logo) slowly rotate on their vertical axis (Y) and very slightly on the X axis, tracing an infinity symbol (lemniscate / figure-eight) pattern when viewed from the user's perspective. The motion is lazy, hypnotic, continuous.

**Implementation:** For each object, compute rotation as:
```
rotationY = A * sin(t * speed)
rotationX = B * sin(t * speed * 2)
```
where A is the Y amplitude (~15-20 degrees), B is the X amplitude (~3-5 degrees), and `speed * 2` creates the figure-eight. Each button should have a slightly different phase offset so they don't all move in unison.

### Mouse Parallax (Scene-Wide)
The entire button cluster shifts slightly with mouse position, creating a depth/parallax effect. Mouse at screen center = no shift. Mouse toward edges = subtle scene translation. This should feel like the old iOS parallax wallpaper.

### Proximity Tilt (Per-Button)
As the cursor approaches a button (even before hovering directly), the button tilts toward the cursor. Uses raycasting or screen-space distance to detect proximity. Tilt amount scales with distance — closer = more tilt, with a max cap.

### Direct Hover (Per-Button)
When the cursor hovers directly over a button:
- Surface shimmer/glow intensifies
- Button scales up slightly (1.05-1.1x)
- Optional: emissive pulse on the chrome material
- Cursor changes to pointer

### Click
On click, the camera begins flying to that page's location in 3D space.

---

## Camera & Transitions

### Camera System
A single perspective camera. Default position looks at the menu hub. Each page has a predefined camera target (position + lookAt). The camera is NOT user-controlled (no orbit controls) — it only moves via scripted transitions.

### Fly-To Transition
When a button is clicked:
1. Buttons fade or scale down slightly (they're being left behind)
2. Camera smoothly interpolates from current position to target page position
3. Easing: ease-in-out cubic or spring physics (via `@react-spring/three` or Drei's `useSpring`)
4. Duration: 1-2 seconds
5. On arrival, the 2D content panel fades in

### Return Transition
When the content panel is closed (X button):
1. Panel fades out
2. Camera smoothly flies back to the menu hub position
3. Buttons fade/scale back in

---

## 2D Content Panels

Each page's actual content is rendered as a 2D HTML overlay using Drei's `<Html>` component. This gives us full React + Tailwind for content rendering while the 3D scene remains visible behind/around the panel.

### Panel Design
- Positioned in 3D space (attached to the page's location)
- Semi-transparent or solid background — should be readable but not fully hide the 3D scene
- Has a clear **X close button** in the top-right corner
- Scrollable for long content
- Styled per page (each page has its own identity)
- Responsive within the panel (not necessarily matching viewport responsive — the panel is a fixed-size window in 3D space)

### Panel Content Types

**Project Pages (Oeuvre):**
- Title
- Description / write-up
- Screenshots or embedded media
- Links (live site, GitHub, etc.)
- Tech stack tags
- Status (live / in progress / concept)

**Collection Pages (Influences):**
- Title
- Curated list of items
- Each item: name, link, short annotation/note
- Possibly categorized or tagged

---

## The "@" HUD (Director's Commentary)

Pressing/clicking the "@" symbol from any page opens a full-screen overlay HUD. This is a meta-layer — the "DVD extras" for the site.

### HUD Contents
1. **Director's Commentary** — Andrew's freeform notes about the current page. Personal context, the story behind the project, what he learned, what he'd do differently. Stored as text per page in the data files.
2. **Cyberspace Nav** — A 2D navigation menu styled like an original Halo (CE/2) HUD:
   - Translucent dark panels with angular geometry
   - Scan line effects (CSS)
   - Cyan/teal accent color palette
   - Military-utilitarian typography (monospace/condensed)
   - Lists all pages with direct jump links (bypasses 3D camera transitions)
3. **Page metadata** — Optional: tech stack, date started, current status

### HUD Behavior
- Opens as a full-viewport overlay on top of the 3D scene
- 3D scene visible but dimmed/blurred behind it
- Dismissible via click-outside, Escape key, or close button
- When jumping to a page via the cyberspace nav, HUD closes and camera transitions

---

## Mobile Experience

### Touch Navigation
- The viewport IS the 3D scene — no default page scrolling
- **Light scroll gesture** nudges the lemniscate rotation — provides tactile feedback ("this responds to me")
- **Heavy scroll up/down** tilts the camera perspective to reach pages in that direction
- **Tap a button** = same as click, flies camera to page
- **When a content panel is open**, the panel itself scrolls normally

### Gyroscope (Progressive Enhancement)
If the device supports the DeviceOrientation API:
- Device tilt drives the parallax effect (replacing mouse position)
- Subtle, 1:1 mapping of device angle to scene shift
- Falls back gracefully if not supported (scroll-driven interaction handles it)

### Weak Devices
- Detect via GPU tier (e.g., `detect-gpu` library) or frame rate monitoring
- Static fallback: render a single screenshot/poster of the 3D scene with 2D button overlays
- Content panels work identically in static mode

---

## Loading Screen

The site will have a loading screen while 3D assets (GLB models, textures, HDR environment) load.

**Design:** The loading screen itself should be a design moment — not a generic spinner. Consider:
- The "@" symbol rendering progressively (stroke animation)
- A wireframe that fills in
- A retro progress bar with percentage

The loading screen should match the site's aesthetic. Design details TBD — can be a Phase 6 polish task.

---

## Audio (Future Phase — Not In Initial Build)

Audio will be **commissioned from friends** — original work, not stock.

When the time comes:
- **Ambient:** Subtle background tone/texture for the 3D scene
- **UI sounds:** Hover, click, transition whooshes
- **Per-page ambient:** Optional different soundscapes per page location
- **Muted by default** — user opts in via a visible audio toggle
- Browser autoplay policies will need careful handling

This is a separate production effort. The initial build should have no audio infrastructure — it will be added as a complete system in a later phase.

---

## Content Model

### Project (Oeuvre)
```typescript
interface Project {
  id: string;               // URL slug
  title: string;
  description: string;      // 1-3 paragraphs
  media: {
    screenshots?: string[]; // paths to images
    videoUrl?: string;      // optional embed
    liveUrl?: string;       // link to live site
    repoUrl?: string;       // link to GitHub
  };
  techStack: string[];      // e.g. ["React", "Three.js", "Tailwind"]
  status: "live" | "in-progress" | "concept";
  commentary: string;       // Director's commentary for the HUD
}
```

### Influence (Taste)
```typescript
interface Influence {
  id: string;               // URL slug
  title: string;            // Page title (e.g. "Reading List")
  intro?: string;           // Optional intro paragraph
  items: {
    name: string;
    url?: string;
    note: string;           // Andrew's annotation
    category?: string;      // Optional grouping
  }[];
  commentary: string;       // Director's commentary for the HUD
}
```

### Scene Position
```typescript
interface PageSceneConfig {
  id: string;                         // matches Project.id or Influence.id
  position: [number, number, number]; // camera target position
  lookAt: [number, number, number];   // camera lookAt point
  buttonOffset: [number, number, number]; // position relative to "@" logo on menu
  floatingMedium: "cloud" | "bubble" | "zero-g" | "custom"; // TBD per page
}
```

---

## Typography (2D Panels & HUD)

TBD — to be determined during implementation. The 2D content panels and HUD need a type system that complements the 3D aesthetic. Consider:
- A clean sans-serif for body text (readability in overlay context)
- A monospace for the HUD / cyberspace nav (Halo feel)
- Something distinctive for page titles

Angel should propose options during Phase 3 and write them to `feedback.md` for Andrew's approval.

---

## Color Palette

### 3D Scene
- **Void:** Gray wireframe — `#808080` grid lines on `#1a1a1a` or transparent background
- **Button material:** Chrome/reflective — driven by environment map and material properties, not flat colors
- **Moiré / shimmer:** Iridescent — computed via shaders or thin-film interference

### 2D Panels
TBD — should complement the 3D scene without competing. Likely semi-transparent dark backgrounds with light text.

### HUD
- **Background:** Dark translucent (`rgba(0, 20, 30, 0.85)`)
- **Accent:** Cyan/teal (`#00E5FF` or similar)
- **Text:** White or light gray
- **Scan lines:** Subtle horizontal lines via CSS

---

## File Structure (Target)

```
andrewalfredtrimble/
├── client/
│   ├── public/
│   │   ├── models/          # GLB/glTF 3D assets (from Blender)
│   │   ├── images/          # Screenshots, media for content panels
│   │   └── fonts/           # Custom fonts if needed
│   └── src/
│       ├── App.tsx           # Router + top-level Canvas
│       ├── main.tsx          # Entry point
│       ├── index.css         # Tailwind + global styles
│       ├── scene/
│       │   ├── Scene.tsx         # Top-level R3F scene composition
│       │   ├── MenuHub.tsx       # "@" logo + buttons arrangement
│       │   ├── MenuButton.tsx    # Individual button (interaction + animation)
│       │   ├── LogoModel.tsx     # "@" logo (placeholder → GLB swap)
│       │   ├── CameraController.tsx  # Scripted camera movement
│       │   ├── Environment.tsx   # Wireframe void + lighting
│       │   ├── FloatingMedium.tsx    # Cloud/bubble/zero-g wrappers
│       │   └── effects/
│       │       ├── LemniscateAnimation.tsx  # Idle rotation hook/component
│       │       ├── MouseParallax.tsx        # Scene-wide parallax
│       │       └── ProximityTilt.tsx        # Per-object cursor tilt
│       ├── hud/
│       │   ├── HudOverlay.tsx        # Full "@" HUD
│       │   ├── CyberspaceNav.tsx     # Halo-style nav menu
│       │   └── Commentary.tsx        # Director's commentary display
│       ├── panels/
│       │   ├── ContentPanel.tsx      # Shared panel wrapper (X button, scroll, fade)
│       │   ├── ProjectPanel.tsx      # Layout for project pages
│       │   └── InfluencePanel.tsx    # Layout for collection pages
│       ├── pages/              # Route-level components if needed
│       ├── data/
│       │   ├── projects.ts       # Oeuvre content
│       │   ├── influences.ts     # Taste content
│       │   ├── commentary.ts     # Director's commentary per page
│       │   └── sceneConfig.ts    # 3D positions for each page
│       ├── hooks/
│       │   ├── useCamera.ts          # Camera state + transition controls
│       │   ├── useLemniscate.ts      # Lemniscate rotation hook
│       │   ├── useMouseParallax.ts   # Mouse position → scene offset
│       │   ├── useProximityTilt.ts   # Cursor distance → object tilt
│       │   ├── useGyroscope.ts       # DeviceOrientation hook
│       │   └── useScrollInteraction.ts # Mobile scroll capture
│       ├── components/
│       │   ├── LoadingScreen.tsx  # 3D asset loading screen
│       │   └── StaticFallback.tsx # Weak device fallback
│       └── lib/
│           └── deviceCapability.ts   # GPU detection + capability flags
├── docs/
│   └── plans/
│       ├── website-build-spec.md     # This file
│       ├── master-build-plan.md      # Phased task list
│       ├── progress-log.md           # Session log
│       └── feedback.md               # Andrew ↔ Angel communication
├── AGENTS.md
├── CLAUDE.md
├── IDENTITY.md
├── SOUL.md
├── USER.md
├── TOOLS.md
├── HEARTBEAT.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```
