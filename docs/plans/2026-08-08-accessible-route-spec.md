# Accessible route — design spec and implementation plan

**Date:** 2026-08-08
**Status:** designed, not started. Ready for a local implementation session.
**Supersedes:** the "Accessible version of the site" earmark in
`master-build-plan.md` (added 2026-07-18). That earmark asked for "its own design
pass"; this is it. The earmark's framing — a parallel, non-WebGL, screen-reader-first
route reusing the same content data — matches what Andrew decided today.

---

## 1. Decisions taken (Andrew, 2026-08-08)

Recorded here because they outrank everything below if a later session disagrees
with them (source-of-truth order #1).

1. **Two paths, not one.** An "accessibility mode" alongside the 3D site, rather
   than making the medallion itself operable.
2. **Separate-path rot is solved by written discipline plus enforcement.** Andrew's
   words: *"make it clear in all necessary directories where an agent will travel to
   make changes that a change to the visual site is not complete until the accessible
   site is changed in accordance."*
3. **Merge, don't add a third route.** Accessibility mode *is* the hardened
   `StaticFallback`. One non-3D route serves both weak devices and accessibility
   mode. Andrew accepted the tradeoff that a sighted visitor on a weak phone and a
   low-vision visitor get the same presentation.
4. **All three entry points.** Hidden skip link, OS-signal auto-route, and a visible
   toggle in the HUD.
5. **The 3D route gets non-hostile treatment plus reflow.** Not left as-is, and not
   made fully screen-reader-operable.

---

## 2. Audit findings (measured, 2026-08-08)

These are facts about the repo as it stands, not inferences. `lessons.md` entry M is
the reason this section exists: a confident accessibility brief will otherwise
describe a different codebase.

### Already correct — do not "fix"

- `aria-label` on the close, back, and HUD-open controls (`ContentPanel.tsx:100`,
  `HudOverlay.tsx:74`, `HelmetFrame.tsx:216,236`).
- `aria-current="page"` in `CyberspaceNav.tsx:31`, on real `<button>`s in a real `<ul>`.
- `alt` text on every panel image (`ProjectPanel.tsx:66`, `MusicPanel.tsx:45`,
  `InfluencePanel.tsx:28,65`).
- `aria-live="polite"` on `LoadingScreen.tsx:69`.
- Escape-to-close in both `ContentPanel.tsx:49` and `HudOverlay.tsx:19`.
- `lang="en"` on the document; a real `<meta name="description">`.
- `StaticFallback` already uses `<header>`, `<main>`, `<aside>`, `<section>`.
- `prefers-reduced-motion` block at `index.css:661` covering the context pulse, the
  return caret, the aurora, and the context-enter animation.

### Broken — the actual work

**F1. The accessible route is content-lossy today.** `StaticFallback` renders
`<ProjectPanel>` and nothing else. For any project *with* a screenshot — all three of
Heaven & Nature, See Canto, PGH — `ProjectPanel` takes its showcase branch
(`ProjectPanel.tsx:73`) and renders only an image, the title, and a link label.
`description` and `techStack` live in `Commentary.tsx:36,42`, which `StaticFallback`
never imports. **So `?lite=1` silently drops every project's description and tech
stack right now, in production.** This is `lessons.md` entry V recurring in a second
location: the 2026-08-04 fix repaired the screenshot-*less* branch, and the same
predicate still splits content across two components that only one route mounts.

**F2. No landmarks or headings in the 3D route.** `SceneExperience` returns bare
`<div>`s. No `<main>`, no `<h1>` anywhere in the 3D path; panels open at `<h2>`.

**F3. Focus is never moved, trapped, or restored.** Navigating to a page flies the
camera and mounts a panel while focus stays where it was. `HudOverlay` is a modal
with a backdrop and Escape but no `role="dialog"`, no `aria-modal`, no focus trap, no
focus restore — and a misleading `aria-hidden={false}` at `HudOverlay.tsx:43` that
does nothing.

**F4. Reflow is structurally forbidden.** `App.tsx:92` and `SceneExperience.tsx:229`
both hard-set `h-screen w-screen overflow-hidden`. `HudOverlay.tsx:90` pins a fixed
`h-[min(42rem,calc(100vh-4rem))]`. At 400% zoom the site crops rather than reflows,
on **both** routes — including the one we are about to designate as accessible.
WCAG 1.4.10 is the single most-used low-vision adaptation and it currently fails
everywhere.

**F5. Reduced-motion coverage is partial.** `SceneExperience.tsx:61` reads the
preference and passes it only to `<Environment>`. Not covered: the camera fly-to
transitions (`CameraController`/`useCamera` — by far the largest vestibular trigger
on the site), the helmet boot cascade (`helmetBoot.ts`, `bootLifecycle.ts`), the CRT
screen wake (`screenWake.ts`), and `VisorStreaks`.

**F6. Low-alpha metadata text fails AA — but body text does not.** Measured against
the fallback's effective background (`#151819` top, `#0b0e11` bottom):

| Token | Ratio | Used at | Verdict |
|---|---|---|---|
| `white/78` | 11.09 | body | pass |
| `white/72` | 9.57 | body | pass |
| `white/68` | 8.67 | body 14px | pass |
| `cyan-200/70–72` | 7.47–7.89 | kickers | pass |
| `white/55` | 6.09 | meta | pass |
| `white/42` | **4.08** | 0.66rem uppercase, 0.24em tracking | **fail** |
| `white/38` | **3.58** | nav arrow | **fail** |
| `white/35` | **3.23** | "esc / × — back to the hub" | **fail** |

The failures are concentrated in exactly the wrong place: small, uppercase,
wide-tracked *labels that tell you where you are*. Body copy is fine and should be
left alone.

**F7. The document is empty before React boots.** `index.html` ships
`<div id="root"></div>` and nothing else. A screen reader arriving at t=0 gets
silence through the capability probe (`detect-gpu` does a network fetch), the lazy
`SceneExperience` chunk, and the boot sequence. No `<noscript>`.

**F8. `<h1>@</h1>`** at `StaticFallback.tsx:68` — the page's only `h1` is a
decorative glyph that announces as "at sign" or as nothing.

---

## 3. Architecture

### 3.1 One resolver

New `client/src/lib/accessibilityMode.ts`, deliberately mirroring
`deviceHints.ts` / `qualityTier.ts`:

```ts
export type SiteMode = "visual" | "accessible";

export interface ModeInputs {
  search: string;
  storage: Pick<Storage, "getItem" | "setItem"> | null;
  matchMedia: ((q: string) => { matches: boolean }) | null;
}

/** Pure. Precedence lives here and nowhere else. */
export function resolveSiteMode(inputs: ModeInputs): SiteMode;

/** Browser-reading wrapper, synchronous by requirement. */
export function readSiteMode(): SiteMode;

/** Persist an explicit choice; must outrank the OS signal forever after. */
export function setSiteMode(mode: SiteMode): void;

/** Publish to <html data-site-mode> so CSS can respond without TS. */
export function publishSiteMode(mode: SiteMode): void;
```

**Precedence, in one place:**

1. URL — `?a11y=1` / `?a11y=0`
2. Stored explicit choice — `localStorage["site-mode"]`
3. OS signal — `(forced-colors: active)` or `(prefers-contrast: more)`
4. Default — `"visual"`

Why this shape: `lessons.md` entry Q. `?quality=` broke because precedence was
resolved in one place and re-implemented in another, and the bug was invisible until
the DOM was inspected directly. Three entry points feeding one setting is the same
hazard, larger. `SceneExperience` and the accessible route must both *ask* this
function rather than each deciding.

Why pure with injected `storage`/`matchMedia`: so it runs in the existing
`node --test` harness with no DOM and no new dependency.

**An OS signal is a hint, not consent.** Rule 2 beating rule 3 is load-bearing:
someone running High Contrast Mode who wants the artifact must be able to choose it
and have the choice stick.

### 3.2 Routing

`App.tsx` becomes a three-way branch, with accessibility mode checked **before** the
GPU probe — a `detect-gpu` benchmark fetch must never sit between a low-vision
visitor and their site:

```
readSiteMode() === "accessible"  →  <DocumentSite mode="accessible" />
forceLite || capability.isWeak   →  <DocumentSite mode="lite" />
otherwise                        →  <SceneExperience />
```

Rename `StaticFallback` → `DocumentSite`. It no longer describes a consolation
prize. The `mode` prop drives only the header copy and the return control — **not**
two visual treatments (decision 3 was "merge and harden", not "merge with a styling
layer"). One presentation, hardened.

### 3.3 Killing the drift at its source

Before adding a parity *test*, remove the thing it would be testing. Extract
`client/src/panels/ProjectContent.tsx` rendering `description`, `techStack`, and the
live/repo/video links. `Commentary.tsx` uses it (3D route). `DocumentSite` uses it
(accessible route). Neither re-implements it.

This is the structural half of the answer to Andrew's rot concern, and it is worth
more than the test: a shared component makes F1's whole bug class hard to reproduce,
where a test only reports it after someone writes it.

---

## 4. Entry points

**E1 — Skip link, in `index.html`, before `#root`.**

```html
<a class="skip-link" href="/?a11y=1">Skip to the accessible version</a>
```

Static markup, so it exists before React boots and works with JavaScript off. A plain
`<a>`, not a button: the earliest observer is a screen reader reading the document at
t=0 (entry Q applied to a new value). `.skip-link` is visually hidden until `:focus`,
then rendered as a normal high-contrast control at the top-left. Add a `<noscript>`
block beside it pointing at the same URL.

**E2 — OS auto-route.** Arm 3 of the resolver. No separate mechanism.

**E3 — Visible toggle in `HelmetFrame`**, beside the existing HUD controls. Calls
`setSiteMode("accessible")`. This is the arm that serves magnification users who see
fine, never touch a screen reader, and would never press Tab — the group E1 and E2
both serve worst.

**The return path is a hard requirement.** `DocumentSite` carries a permanent,
prominent "Switch to the 3D experience" control writing `setSiteMode("visual")`.
Anyone arriving via E2 never asked to be here; a signal about *color preference* must
not silently confiscate the artifact.

---

## 5. The parity contract

Two mechanisms. An instruction is a soft gate an agent can rationalize past; a red
test is not.

### 5.1 The instruction

A short **"Accessible route parity"** subsection appended to `CLAUDE.md`'s Required
workflow (not a separate doc — it must sit in the steps an agent already reads), and
a one-line pointer in `AGENTS.md`:

> A change to project or influence content, or to what any panel renders, is not
> complete until `DocumentSite` renders it too. `pnpm test` enforces this; if you
> changed a rendered field and `tests/contentParity.test.ts` still passes, the test
> is the thing that is wrong.

That last clause matters. It tells a future agent the test is a floor, not a ceiling.

### 5.2 The test

`tests/contentParity.test.ts`, dependency-free, in the existing harness:

1. Every `PAGES` entry resolves to a `Project` or an `Influence` — catches a new
   medallion section wired to nothing.
2. `DocumentSite.tsx`'s source imports `ProjectContent` and `InfluencePanel` —
   catches F1's exact shape, where one route mounts a component the other doesn't.
3. Every field of `Project` and `Influence` that the 3D route renders appears in the
   shared component's source text.

**Honest limitation, stated so nobody over-trusts this:** items 2 and 3 are
source-text assertions, not render assertions. They cannot see a field that is
imported but conditionally skipped. A real render test would need JSX, and Node's
type-stripping does not transform JSX — so `renderToStaticMarkup` is unavailable
without either a build step or a new dependency, and `CLAUDE.md` forbids adding major
dependencies casually. The structural fix in §3.3 is what actually carries the
guarantee; the test is the tripwire. Revisit if the repo ever gains a test bundler.

**Per `lessons.md` entry A, the test ships with a positive control.** It should fail
on the F1 gap *before* the fix lands. If it passes against today's `main`, it is
blind and must be rewritten. Record the observed failure in the commit message.

---

## 6. Hardening `DocumentSite`

- **F8** — real `<h1>Andrew Alfred Trimble</h1>`; the `@` glyph becomes decorative
  (`aria-hidden`), keeping its visual role.
- **F6** — raise `white/42` → `white/60`, `white/38` → `white/55`, `white/35` →
  `white/55` **on this route only**. Leave body copy alone; it measures fine. Reduce
  the 0.24em tracking on the smallest uppercase labels, which costs more legibility
  than the alpha does.
- **F4** — replace `min-h-screen` + fixed-height panels with a document that reflows;
  remove `overflow-hidden`; ensure single-axis scrolling at a 320px-equivalent width.
- **Nav semantics** — wrap the page list in `<nav aria-label="Sections">`, mark the
  active item with `aria-current="page"`.
- **Focus** — a visible `:focus-visible` ring meeting 3:1 against its background.
  There is currently **one** `:focus-visible` rule in all 756 lines of `index.css`
  (line 593). Add a global baseline.
- **Route changes announce** — an `aria-live="polite"` region naming the page on
  navigation, and move focus to the content heading.
- **Content** — mount the union of what the 3D route splits (§3.3), fixing F1.

---

## 7. The 3D route: non-hostile, plus reflow

Explicitly **not** making the medallion operable. Goal: never trap anyone, and
survive zoom.

- **F2** — `<main>` wrapper; a visually-hidden `<h1>`; the `<canvas>` element gets
  `aria-hidden="true"` (it conveys nothing to AT, and drei's `<Html>` portal is a
  sibling of the canvas, not a child, so panel content is unaffected — verify this in
  the DOM rather than trusting it).
- **F3** — `HudOverlay` gains `role="dialog"`, `aria-modal="true"`,
  `aria-labelledby`, a focus trap, and focus restore on close; drop the no-op
  `aria-hidden={false}`. On page navigation, move focus to the panel heading
  (`tabIndex={-1}`); on close, return it to the control that opened it.
- **F5** — route `reducedMotion` to the camera store (fly-to becomes a short cut
  rather than a sweep), the boot lifecycle (jump to end state), and `VisorStreaks`.
  **Per entries F and G: thin, never switch off.** Reduced motion means the visitor
  still arrives at the same place, faster and without the sweep — not that a layer
  disappears. Do not let a reduced-motion path unmount anything, or the recovery path
  goes with it.
- **F4** — relax `h-screen w-screen overflow-hidden` (`App.tsx:92`,
  `SceneExperience.tsx:229`) and the fixed `HudOverlay.tsx:90` height so that at 400%
  zoom every panel, control, and HUD element stays readable and reachable with
  single-axis scrolling. The canvas itself may remain a fixed backdrop.
- **F7** — `<noscript>` beside the skip link.

**This section touches the layout constraint the whole helmet composition is built
on. It needs Andrew's eyes in a real browser before it is called done.**

---

## 8. Verification

### What a coding session can verify here

- `pnpm test` — the resolver's precedence table (all four arms, plus "explicit choice
  beats OS signal"), and the parity test.
- `pnpm check`, `pnpm build`.
- DOM inspection of landmarks, roles, `tabIndex`, and the live region — and per
  entry Q's second tell, **inspect the rendered DOM directly**, do not infer from
  component state. That bug was invisible everywhere upstream.
- Computed contrast ratios, by the same method used to produce the §2 table.
- Keyboard traversal via scripted key events.

### What it cannot

- **Whether any of this actually works with a screen reader.** No sandbox verifies
  that VoiceOver announces the route change, that the focus trap feels right, or that
  the reading order is sane. This is the direct analogue of the repo's standing rule
  that visual work needs human signoff: **screen-reader work needs audible signoff.**
- Zoom/reflow behavior at 400% — needs a real browser at a real window size.

### Andrew's signoff list

macOS VoiceOver is built in; `Cmd+F5` toggles it, `Ctrl+Option+U` opens the rotor.

1. Load `/` with VoiceOver on. Press Tab once — the skip link should be the first
   stop and should announce.
2. Follow it. Confirm the accessible route announces a real `<h1>`, that the rotor
   lists landmarks and headings, and that every project reads its description and
   tech stack (this is F1 — it fails today).
3. Navigate between pages; confirm the change is announced and focus lands on the
   content.
4. Return to the 3D route via the visible control; confirm the choice sticks on
   reload.
5. On the 3D route, open and close the HUD overlay with the keyboard only; confirm
   focus is trapped while open and restored on close.
6. Zoom to 400% on both routes; confirm no two-axis scrolling and nothing cropped.
7. With Reduce Motion enabled in System Settings, confirm camera transitions are cut
   rather than swept, and that nothing has *vanished*.

---

## 9. Implementation plan

Ordered so each step is independently committable and reversible. Steps 1–3 are pure
additions and carry no visual risk; step 7 is the one that needs Andrew.

**Run `pnpm test && pnpm check && pnpm build` after every step.** No hand-written
`ShaderMaterial` is involved, so the headless shader compile check does not apply.

| # | Step | Files | Risk |
|---|---|---|---|
| 1 | `accessibilityMode.ts` + precedence tests. No consumers yet. | new lib, new test | none |
| 2 | Extract `ProjectContent.tsx`; rewire `Commentary` to use it. 3D route must look identical after. | new panel, `Commentary.tsx` | low |
| 3 | `tests/contentParity.test.ts`. **Expect it to fail on F1.** Record the failure, then fix F1 by mounting `ProjectContent` in the fallback. | new test, `StaticFallback.tsx` | none |
| 4 | Rename `StaticFallback` → `DocumentSite`; wire the three-way branch in `App.tsx`; accessibility mode resolved before the GPU probe. | `App.tsx`, rename | low |
| 5 | Entry points: skip link + `<noscript>` in `index.html`, `.skip-link` and `:focus-visible` baseline in `index.css`, HUD toggle in `HelmetFrame`, return control in `DocumentSite`. | `index.html`, `index.css`, `HelmetFrame.tsx`, `DocumentSite.tsx` | low |
| 6 | Harden `DocumentSite` (§6): `h1`, contrast, nav semantics, live region, focus-on-navigate, reflow. | `DocumentSite.tsx`, `index.css` | medium |
| 7 | 3D route (§7): landmarks, canvas `aria-hidden`, dialog semantics + focus trap/restore, reduced-motion routing, reflow. | `SceneExperience.tsx`, `HudOverlay.tsx`, `ContentPanel.tsx`, `useCamera.ts`, `index.css` | **needs Andrew's browser** |
| 8 | Parity instruction into `CLAUDE.md` + `AGENTS.md`; update `master-build-plan.md` (retire the earmark) and `progress-log.md`; curate `lessons.md`. | docs | none |

---

## 10. Out of scope

- Making the medallion itself operable — explicitly decided against (decision 1).
- A third route (decision 3).
- A mode-driven styling layer on `DocumentSite` (decision 3).
- Audio description, captions, an audio layer — audio is a future commissioned phase.
- Any new runtime dependency.

## 11. Open questions for Andrew

1. **Copy.** `DocumentSite`'s current strings ("Static fallback mode", "Wireframe
   poster mode", "the lighter 2D build so the site still feels intentional") describe
   a weak-device consolation prize and will be wrong once this route is a chosen
   destination. The publication-copy gate says do not invent public-facing copy, so
   the plan leaves them in place. **Replacement copy is yours to write.**
2. **`?a11y=` as the parameter name** — chosen for brevity and convention. Say if you
   want something less jargon-y in a URL a visitor may see.
3. **Contact's taxonomy.** `CLAUDE.md` already flags `group: "influences"` on Contact
   as a legacy bucket. The accessible route will group navigation by `group` and will
   therefore file Contact under "Influences" out loud, where the 3D route only
   implies it. Worth fixing here, but it is a data change and it is your call.
4. **`prefers-contrast: more` as an auto-route trigger** — `forced-colors: active` is
   an unambiguous signal; `prefers-contrast: more` is weaker and some sighted users
   set it for taste. Keep both arms, or `forced-colors` only?
