# Content, Typography, HUD-Context Spec — 2026-07-18

**Author:** Claude Code, from Andrew's direct instruction (2026-07-18).
**Status:** Executing. All visual endpoints still require Andrew's real-browser signoff.

Andrew's seven asks, verbatim intent: (1) new typography system, (2) reading list
from his Lent book log, (3) inspirations content (Seurat/Mondrian + podcasts) and an
earmarked accessibility-version plan, (4) project-page redesign — showcase
screenshot, copy moved to the context overlay, pulsing "Tap to see context" bubble,
`@` becomes the return-to-artifact button on the camera-origin edge, helmet narrator
removed, (5) key-light nudge for the medallion `@` glare, (6) background-environment
brainstorm (decision pending Andrew — no build), (7) music album tiles now, live
Spotify recap via Angel nightly cron later.

## 1. Typography

Self-hosted in `client/public/fonts/` (all SIL OFL 1.1; licenses in
`client/public/fonts/licenses/`):

- **Bruno Ace** — display face for the **Oeuvre** group (project titles/kickers).
- **Zen Dots** — display face for the **Influence/taste** screens (influence titles).
- **Chivo Mono** (variable) — mono for any *longer* label where legibility matters
  (boot line, nav labels, running meta text). **Space Mono stays** for short
  all-caps microtype chips (ornament labels etc.).
- **Kingthings Spikeless** — declared for the `@` glyph with graceful fallback;
  Andrew must drop `KingthingsSpikeless.ttf` into `client/public/fonts/` (freeware
  font, not bundled with the Google zip). Falls back to Zen Dots until then.

CSS variables: `--font-display-oeuvre`, `--font-display-influence`,
`--font-mono-long`, `--font-at-glyph`. Cormorant Garamond is retired from titles;
Inter remains body, Space Mono remains microtype.

## 2. Reading List

Data transcribed from Andrew's note "Books I read for Lent + 2026" (Obsidian).
Notes carry **author attribution only** — no invented taste commentary
(publication-copy gate). Categories: Lent 2026, April 2026, June 2026, Summer 2026.
"Suzanna Clark" corrected to Susanna Clarke.

## 3. Inspirations

- **Painters:** Georges Seurat and Piet Mondrian — Andrew's two favorites (his
  words). Public-domain images from Wikimedia Commons in
  `client/public/images/inspirations/` (Seurat: *A Sunday on La Grande Jatte*,
  *Bathers at Asnières*; Mondrian: *Composition II in Red, Blue and Yellow*,
  *Tableau I*). Short **factual** bios only.
- **Podcasts:** tiled section — Cortex (Relay FM), Double Tap (AMI-audio),
  Reply All (Gimlet, ended 2022), Spotless, White Horse Inn, Connected (Relay FM).
  One-sentence factual blurb revealed on hover (and on keyboard focus).
- Data model: `InfluenceItem` gains optional `display: "tile"`, `images[]`, `meta`.

## 4. Project-page / HUD context redesign

- **Showcase panel:** oeuvre pages with a screenshot (`heaven-and-nature`,
  `see-canto`) render the click-through screenshot large and standalone —
  wider ContentPanel variant, minimal corner-bracket border, no card chrome, no
  description/tech-stack blocks in the panel.
- **Context button:** upper-right bubble, larger than the old `@` toggle, slow
  ~2.8s blink/pulse, labeled "Tap to see context". Opens the overlay (old `@`
  function). Overlay now carries title, description copy, tech stack, links
  (moved from the panel), plus commentary. "Helmet narrator" branding removed.
- **Overlay entrance:** "wow" motion — scanline-wipe + scale/skew entrance
  originating from the button corner. Procedural CSS only.
- **`@` return bubble:** the `@` is now the return-to-artifact control. It sits on
  the viewport edge in the direction the camera came from (toward the hub), with a
  free-floating `^` caret outside the bubble pointing at the artifact. Direction is
  computed from `sceneConfig` (`hub lookAt − page lookAt`, screen y flipped) by a
  pure helper with Node tests (`tests/`). Rendered in Kingthings Spikeless stack.
- Bottom helmet-narrator pill is deleted.

## 5. Key light

`STUDIO_LIGHTING.direct.key.position` nudged `[0.8, 4.6, 7.5] → [0.4, 3.8, 7.9]`
(slightly lower/more frontal, aiming the specular response of the center `@`
emblem toward brilliant-white at the rest pose while preserving the approved
lemniscate-drift darkening). Runtime override for Andrew's A/B:
`?keylight=x,y,z` (free tune) and `?keylight=legacy` (old position). **Needs
Andrew's real-browser verdict; roll back by reverting the constant.**

## 6. Background environment (brainstorm only — Andrew decides)

Options presented in chat; no build. Candidate default: sparse static starfield
(single `THREE.Points`, a few thousand vertices, no per-frame updates) — cheapest
"not-a-void" option consistent with the artifact-in-void hierarchy.

## 7. Music

- `client/src/data/music.ts` — five albums with art in
  `client/public/images/music/` (Apple 600×600 CDN copies) + Apple Music/Spotify
  links: AMXNRADIO & Joel Houston *The Profound Foolishness Of ~*; Mk.gee *Two Star
  & The Dream Police*; Poor Bishop Hooper *Firstborn* and *Golgotha*; Dave Malloy
  *Preludes (Original Cast Recording)*.
- `MusicPanel` — tile grid like podcasts but roomier margins, always-visible
  title + artist labels, no hover blurbs.
- **Earmarked (do not build now):** nightly Angel cron that regenerates this data
  from Andrew's live Spotify listening.

## Earmarked follow-ups (added to master plan)

- **Accessible version of the site** — parallel non-WebGL, screen-reader-first
  route with the same content data.
- **Angel Spotify cron** — see §7.
- **Background environment build** — after Andrew picks a direction from §6.
