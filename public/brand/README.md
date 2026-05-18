# ForkFirst — Brand handoff

> **A single document any AI coder or developer can read top-to-bottom to set
> up the ForkFirst brand correctly on a website, app, marketing site, doc,
> or social post.** Skim the **Quick start** section if you only have one
> minute; otherwise read the whole thing — it isn't long.

---

## 1. Quick start (1 minute)

1. Copy the entire `brand/` folder into your project's static assets (e.g.
   `public/brand/` for a Next.js / Vite / static site).
2. Paste the contents of `brand/html/head-snippet.html` into the `<head>` of
   every page. Fix the `href` paths if your asset folder isn't at `/brand`.
3. Use **`brand/logo/lockup-horizontal.svg`** in the nav, footer, and
   anywhere you'd write the product name. Use **`brand/logo/mark.svg`** when
   you need just the icon (favicon-sized contexts, app icon, social avatar,
   compact UI).
4. Reference colour/type/spacing tokens from `brand/tokens/tokens.css`
   (CSS variables prefixed `--ff-`) or `brand/tokens/tokens.json` (for
   tooling).
5. The single accent colour is **cobalt — `#2647F0`** in light contexts,
   **`#5577FF`** in dark. **Never introduce a second accent.**

That's the entire brand setup. The rest of this document explains the *why*
and lists the rules for cases the quick start doesn't cover.

---

## 2. Identity

| Field        | Value                                                             |
|--------------|-------------------------------------------------------------------|
| **Name**     | ForkFirst (two words, both capitalised in display contexts)      |
| **Wordmark** | `forkfirst` (lowercase, in the wordmark only — see §4)           |
| **Tagline**  | *Idea check, before you build.*                                   |
| **Pitch**    | Find the best repo to fork — then hand the plan to your AI.       |
| **Domain**   | `forkfirst.dev` (placeholder — update before launch)              |
| **Tone**     | Quiet confidence. Editorial restraint. Engineer-friendly. No emoji.|

### What ForkFirst does
ForkFirst is a pre-build idea check for software projects. You describe the
thing you want to make; it (a) tells you whether the idea makes sense, and
(b) finds the best open-source repos to fork as your starting point. The
output is a **Builder Handoff** — one folder your AI coder (Claude Code,
Codex, Cursor) can read top-to-bottom: the plan, the repo to fork, the
rules, the brand, the skills.

This document is, itself, an example of a Builder Handoff.

---

## 3. Colour

Cobalt is the **only** accent. Everything else is ink (near-black) or paper
(warm off-white). Never introduce a second colour as a brand note.

### Brand colours (fixed — never themed)

| Token              | Hex          | Use                                              |
|--------------------|--------------|--------------------------------------------------|
| `--ff-brand-ink`   | `#0A0B0E`    | Primary foreground; the mark's letterforms.      |
| `--ff-brand-paper` | `#F6F4EF`    | Primary surface; warm off-white.                 |
| `--ff-cobalt`      | `#2647F0`    | Accent on light surfaces (most contexts).        |
| `--ff-cobalt-bright`| `#5577FF`   | Accent on dark surfaces — for contrast.          |
| `--ff-cobalt-ink`  | `#0B1F8F`    | Deep cobalt — hover state, focus rings.          |
| `--ff-cobalt-soft` | `#2647F01A`  | Tinted backgrounds, active states, badges.       |

### Semantic surfaces (themed)

Use the `--ff-ink` / `--ff-paper` / `--ff-accent` family — they swap with
the `data-theme="dark"` attribute. See `brand/tokens/tokens.css` for the
full set including `ink-2`, `muted`, `paper-2`, `paper-3`, `line`, `line-2`.

### Signal colours (status only — not brand)
`--ff-signal-fork: #19A26A` · `--ff-signal-ref: #B8860B` ·
`--ff-signal-warn: #C46A1A` · `--ff-signal-danger: #C42B1A`.
Reserved for indicators (forkability score, license warnings, etc). Do
**not** use them in marketing surfaces or logos.

---

## 4. Typography

One family does everything: **Geist** (display + UI), with **Geist Mono**
for monospace runs. Already loaded by the head snippet.

| Role            | Family     | Weight | Tracking  |
|-----------------|------------|--------|-----------|
| Display / hero  | Geist      | 700    | -0.05em   |
| H1              | Geist      | 700    | -0.04em   |
| H2              | Geist      | 600    | -0.035em  |
| H3 / titles     | Geist      | 600    | -0.025em  |
| Body            | Geist      | 400    | -0.005em  |
| Caption         | Geist      | 500    | 0         |
| Eyebrow / label | Geist Mono | 500    | 0.14em ↑  |
| Code / data     | Geist Mono | 400–600| 0         |

**Rules**
- Headlines balance with `text-wrap: balance`; body with `text-wrap: pretty`.
- Tight tracking on display sizes is mandatory — don't ship Geist at the
  default 0 letter-spacing in 80px+ headings.
- Lowercase wordmark is no longer used. In running text, always write
  **ForkFirst** (one word, camelCase). The display wordmark splits into
  two tones — see §5.

---

## 5. Logo

The mark is a **fork-tile**: a dark rounded square containing a paper
git-fork glyph with a **cobalt commit dot** at the bottom. The wordmark
is **ForkFirst** in Geist 700, **two-tone**: `Fork` in ink, `First` in
cobalt — the differentiator earns the colour.

### Geometry

Built on a 64×64 grid:
- Tile — `rect 0,0,64,64` with `rx=14` (≈22%) filled ink (`#0A0B0E`).
- Two top circles — `(18,18)` and `(46,18)` radius `5.5`, paper.
- Y-connector — path `M18,21 Q18,32 32,32 Q46,32 46,21`, paper stroke 4.
- Stem — `M32,32 L32,39`, paper stroke 4, round cap.
- Cobalt commit dot — `circle 32,45 r=6.5` filled cobalt (`#2647F0`).

### Asset index

| File                                             | Use it for                                         |
|--------------------------------------------------|----------------------------------------------------|
| `brand/logo/mark.svg`                            | **Default mark** — ink tile + paper fork + cobalt. |
| `brand/logo/mark-on-ink.svg`                     | Same composition tuned for dark surfaces.          |
| `brand/logo/mark-cobalt-tile.svg`                | Full cobalt tile + paper fork — bold contexts.    |
| `brand/logo/mark-inverted.svg`                   | Paper tile + ink fork — light contexts.           |
| `brand/logo/wordmark.svg`                        | Two-tone ForkFirst wordmark, light.                |
| `brand/logo/wordmark-on-ink.svg`                 | Two-tone wordmark, dark.                           |
| `brand/logo/wordmark.png` / `wordmark-2x.png`    | PNG fallback where SVG isn't possible.             |
| `brand/logo/lockup-horizontal.svg`               | **Default lockup** — use this in nav and footer.   |
| `brand/logo/lockup-horizontal-on-ink.svg`        | Default lockup, dark.                              |
| `brand/logo/lockup-stacked.svg`                  | Vertical lockup for tall surfaces and avatars.     |
| `brand/logo/lockup-stacked-on-ink.svg`           | Stacked, dark.                                     |

### Sizing rules

- **Mark** — minimum 16 px. Below 16 px, drop the commit dot and keep the
  fork-glyph silhouette.
- **Wordmark** — minimum 80 px wide for the two-tone split to read.
- **Lockup** — minimum 100 px wide (tile scales with wordmark).

### Clearspace

Reserve **at least one commit-dot diameter** (≈1/5 of the tile height) of
empty space on every side of the mark or lockup. Don't crowd it with
other UI controls.

### Don't

- Don't recolour the commit dot. Cobalt is the only accent.
- Don't apply a drop shadow, glow, gradient, bevel, or texture to the
  tile or any part of the fork glyph.
- Don't outline-stroke the tile or the fork glyph. The mark is filled
  shapes + paper strokes only.
- Don't rotate or skew the mark. Square grid; keep it level.
- Don't lock the tile inside another container (no double-rounded box).
- Don't typeset "ForkFirst" in any font other than Geist for the wordmark
  use; in running text any sans is fine.
- Don't split the wordmark into two tones in **running prose**. The split
  is reserved for the display wordmark and logo lockups.

---

## 6. Favicons & app icons

`brand/html/head-snippet.html` already wires these up. The set includes:

| File                                       | Purpose                                  |
|--------------------------------------------|------------------------------------------|
| `brand/favicon/favicon.svg`                | Vector favicon (modern browsers).        |
| `brand/favicon/favicon-16.png`             | Legacy 16×16.                            |
| `brand/favicon/favicon-32.png`             | Legacy 32×32.                            |
| `brand/favicon/favicon-48.png`             | Windows.                                 |
| `brand/favicon/apple-touch-icon.png`       | 180×180 — iOS home-screen.               |
| `brand/favicon/icon-192.png`               | 192×192 — PWA.                           |
| `brand/favicon/icon-512.png`               | 512×512 — PWA install/splash.            |
| `brand/favicon/icon-maskable-512.png`      | PWA maskable — extra safe-zone padding.  |
| `brand/favicon/icon-192-dark.png`          | Dark-mode PWA icon.                      |
| `brand/favicon/icon-512-dark.png`          | Dark-mode PWA icon.                      |

A `site.webmanifest` is provided at `brand/html/site.webmanifest`. Move it
to `/site.webmanifest` (or update the link path in the head snippet).

---

## 7. Social images

| File                                  | Purpose                                            |
|---------------------------------------|----------------------------------------------------|
| `brand/social/og-image.png`           | 1200×630 OG/Twitter card (paper background).       |
| `brand/social/og-image-dark.png`      | 1200×630 OG card (ink background).                 |

For per-page OG cards, override the headline and subhead but keep the
mark + eyebrow + cobalt rule in place to preserve recognition.

---

## 8. Voice & copy

- **Plain English.** Engineer-friendly, declarative. No hype words.
- **Title case proper nouns**; *ForkFirst*, *Builder Handoff*.
- **Active voice.** "ForkFirst finds the best repo," not "the best repo
  is found by ForkFirst."
- **No emoji** in product or marketing copy. (Internal docs are fine.)
- **No exclamation marks** in marketing or UI.
- **One idea per sentence** in headlines and CTAs.

Good lines:
- *Idea check, before you build.*
- *Hand the plan to your AI.*
- *Forkable, not from scratch.*

Avoid:
- "AI-powered" (we don't talk about the tools we use; we talk about the
  outcome)
- "Revolutionary", "game-changing", "the future of"
- Anything that needs an emoji to read right.

---

## 9. CSS tokens — quick reference

All tokens prefixed `--ff-`. Import `brand/tokens/tokens.css` once.

```css
.btn-primary {
  background: var(--ff-ink);
  color: var(--ff-paper);
  font-family: var(--ff-font-ui);
  font-size: var(--ff-size-body);
  font-weight: var(--ff-weight-semibold);
  padding: var(--ff-space-3) var(--ff-space-5);
  border-radius: var(--ff-radius-md);
}
.btn-primary:hover { background: var(--ff-accent); }
```

For a JS/Tailwind config, read `brand/tokens/tokens.json` and map keys to
your design-token system.

---

## 10. File index

```
brand/
├── README.md                                  ← you are here
├── HANDOFF.md                                 ← concise AI/dev swap brief
├── tokens/
│   ├── tokens.css                             ← CSS variables (drop-in)
│   └── tokens.json                            ← JSON dump for tooling
├── html/
│   ├── head-snippet.html                      ← copy into <head>
│   └── site.webmanifest                       ← PWA manifest
├── logo/
│   ├── mark.svg                               ← fork-tile (default)
│   ├── mark-on-ink.svg                        ← dark-context variant
│   ├── mark-cobalt-tile.svg                   ← bold cobalt tile
│   ├── mark-inverted.svg                      ← paper tile, ink fork
│   ├── wordmark.svg / .png / -2x.png          ← two-tone ForkFirst
│   ├── wordmark-on-ink.svg / .png / -2x.png
│   ├── lockup-horizontal.svg / .png / -2x.png ← mark + wordmark (default)
│   ├── lockup-horizontal-on-ink.svg / .png
│   ├── lockup-stacked.svg                     ← mark above wordmark
│   └── lockup-stacked-on-ink.svg
├── favicon/
│   ├── favicon.svg                            ← vector
│   ├── favicon-16.png / favicon-32.png / favicon-48.png
│   ├── apple-touch-icon.png                   ← 180×180
│   ├── icon-192.png / icon-512.png            ← PWA
│   ├── icon-maskable-512.png                  ← PWA maskable
│   └── icon-192-light.png / icon-512-light.png ← paper-tile PWA variants
└── social/
    ├── og-image.png                           ← 1200×630, paper
    └── og-image-dark.png                      ← 1200×630, ink
```

---

*If something in this document conflicts with what's on screen, this
document wins. Fix the surface, not the rules.*
