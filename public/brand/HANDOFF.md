# ForkFirst — "The Y" Logo & Favicon Swap

> **Hand this to your AI coder.** It's the only file they need to swap
> the old fork-tile mark for the new **Y mark** while keeping the existing
> **ForkFirst** wordmark intact. Whole job in one paste.

---

## What you're swapping

**OUT:** the old fork-glyph tile (dark square with a paper git-fork +
cobalt commit dot).

**IN:** a new mark called **"The Y"** — a confident two-stroke letter Y
without the old box. **Left arm + trunk are ink/paper; right arm is
cobalt-bright.** The wordmark **ForkFirst** stays exactly as is —
Geist 700, two-tone ("Fork" in ink / "First" in cobalt).

Same brand palette (ink / paper / cobalt). Same typography (Geist).
Same tagline. Only the icon changes, plus every file that depended on
it (favicons, app icons, OG image, lockups).

---

## TL;DR prompt — paste this into your AI coder

```
Please swap the ForkFirst logo to the new "Y" mark.

1. Copy the entire `brand-y/` folder I'm including into the project's
   public/static directory. The final layout should be /brand/...
   (note: the source folder is `brand-y/` but it should land as
   `brand/` in the deployed site — rename it on copy).

2. Replace the favicon / OG / icon <link> and <meta> tags in every
   page's <head> with the block from /brand/html/head-snippet.html.
   Fully replace — don't merge — so no stale fork-tile references
   remain anywhere in the HTML.

3. Move /brand/html/site.webmanifest to the site root (/site.webmanifest).

4. In every place the old mark appeared inline (nav, footer, mobile
   menu, marketing pages), use the new lockup:
     - Default:  /brand/logo/lockup-horizontal.svg     (32px tall)
     - Dark:     /brand/logo/lockup-horizontal-on-ink.svg
     - Stacked:  /brand/logo/lockup-stacked.svg        (avatars, mobile)
   The wordmark file path is unchanged — wordmark.svg still works.

5. Find-and-replace: any inline <svg> of the OLD fork-tile mark must be
   deleted and replaced with the new no-box Y mark. The old mark had: two circles at top, a curved
   stroke between them, a vertical stem, and a cobalt commit dot.
   The new mark has: two strokes forming a Y — paper left+trunk, cobalt
   right arm. Use <img src="/brand/logo/mark.svg"/> as the cleanest
   replacement, or paste the SVG from /brand/logo/mark.svg inline.

6. Delete the old assets to avoid drift: anything in /brand/logo/ that
   isn't in /brand-y/logo/, and any old favicon files (favicon.ico,
   favicon-old.png, the old apple-touch-icon, the old maskable, etc.)

7. The colour tokens, the wordmark itself (wordmark.svg), the Geist
   font stack, and the tagline ("Idea check, before you build.") are
   unchanged. Don't touch them.

After deploying, verify in a real browser:
  - Browser tab favicon shows the Y mark (not the old fork or boxed mark)
  - iOS "Add to Home Screen" shows the Y
  - Sharing the URL to Slack / iMessage / Twitter shows the new OG
    card (you may need to pass the URL through each platform's debugger
    to invalidate their cache)
  - Navbar shows the new lockup
  - No 404s in DevTools → Network for /brand/* URLs

Don't add a drop shadow, glow, gradient, or container around the new
mark.
```

---

## What's in `brand-y/`

```
brand-y/                            ← rename to `brand/` on copy
├── HANDOFF.md                      ← this file
├── logo/
│   ├── mark.svg                    ← THE Y — primary mark
│   ├── mark-on-ink.svg             ← Y stroked, no tile (for placement
│   │                                  on existing dark surfaces)
│   ├── mark-inverted.svg           ← light-surface mark variant
│   ├── wordmark.svg                ← UNCHANGED — same ForkFirst as before
│   ├── wordmark-on-ink.svg         ← UNCHANGED
│   ├── lockup-horizontal.svg       ← DEFAULT for nav / footer
│   ├── lockup-horizontal-on-ink.svg
│   ├── lockup-stacked.svg          ← stacked contexts, avatars, mobile
│   └── lockup-stacked-on-ink.svg
├── favicon/
│   ├── favicon.svg                 ← modern browsers
│   ├── favicon-16.png
│   ├── favicon-32.png
│   ├── favicon-48.png
│   ├── apple-touch-icon.png        ← 180×180, iOS
│   ├── icon-192.png                ← PWA
│   ├── icon-512.png                ← PWA
│   ├── icon-maskable-512.png       ← PWA, safe-zone padding
│   ├── icon-192-light.png          ← paper-tile PWA (light-mode systems)
│   └── icon-512-light.png
├── html/
│   ├── head-snippet.html           ← the <head> block from step 2
│   └── site.webmanifest            ← PWA manifest → site root
└── social/
    ├── og-image.png                ← 1200×630, ink background (default)
    └── og-image-paper.png          ← 1200×630, paper background (alt)
```

---

## Step 1 — Drop in the folder

Copy the entire `brand-y/` folder into your project's static assets
**and rename it to `brand/`**. Final paths in the deployed site:

```
public/                       (or static/ — wherever / is served from)
├── brand/
│   ├── logo/...
│   ├── favicon/...
│   ├── html/...
│   └── social/...
└── site.webmanifest          (copy of brand/html/site.webmanifest)
```

If your project already has a `brand/` folder, replace it wholesale or
diff-merge — the old mark/favicon files should not remain.

---

## Step 2 — Replace the `<head>` block

Open your root layout file (`app/layout.tsx`, `_document.tsx`,
`index.html`, `<svelte:head>`, etc) and **replace** any existing
favicon / OG / icon `<link>` and `<meta>` tags with the block from
`brand/html/head-snippet.html`:

```html
<!-- Charset + viewport -->
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>

<!-- Title + description (override per page as needed) -->
<title>ForkFirst — Idea check, before you build</title>
<meta name="description" content="Find the best repo to fork — then hand the plan to your AI."/>

<!-- Favicons -->
<link rel="icon" type="image/svg+xml" href="/brand/favicon/favicon.svg"/>
<link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon/favicon-32.png"/>
<link rel="icon" type="image/png" sizes="16x16" href="/brand/favicon/favicon-16.png"/>
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicon/apple-touch-icon.png"/>
<link rel="manifest" href="/site.webmanifest"/>
<meta name="theme-color" content="#0A0B0E"/>

<!-- Open Graph -->
<meta property="og:type" content="website"/>
<meta property="og:title" content="ForkFirst — Idea check, before you build"/>
<meta property="og:description" content="Find the best repo to fork — then hand the plan to your AI."/>
<meta property="og:image" content="/brand/social/og-image.png"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:site_name" content="ForkFirst"/>
<meta property="og:url" content="https://forkfirst.dev"/>

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="ForkFirst"/>
<meta name="twitter:description" content="Find the best repo to fork — then hand the plan to your AI."/>
<meta name="twitter:image" content="/brand/social/og-image.png"/>

<!-- Fonts (Geist + Geist Mono) -->
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link
  href="https://fonts.googleapis.com/css2?family=Geist:wght@300..900&family=Geist+Mono:wght@400..600&display=swap"
  rel="stylesheet"/>
```

Don't merge — fully replace, so no stale fork-tile references remain.

---

## Step 3 — Swap the navbar / footer logo

Find the existing logo component (`<Logo />`, `<Brand />`, `<header>`
`<img>`, inline SVG) and use the new lockup. Pick **one** of these two
patterns and use it everywhere for consistency.

### Option A — Use the SVG asset (simplest)

```html
<a href="/" aria-label="ForkFirst home">
  <img
    src="/brand/logo/lockup-horizontal.svg"
    alt="ForkFirst"
    height="32"
    style="width: auto; display: block;"
  />
</a>
```

For dark-mode contexts, swap to `lockup-horizontal-on-ink.svg`. For
square contexts (mobile, avatar, footer block), use
`lockup-stacked.svg`.

### Option B — Mark + inline wordmark (recommended, sharper at small sizes)

```html
<a href="/" aria-label="ForkFirst home" style="
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
">
  <img src="/brand/logo/mark.svg" alt="" width="28" height="28"/>
  <span style="
    font-family: var(--ff-font-display, 'Geist', system-ui, sans-serif);
    font-weight: 700;
    font-size: 17px;
    letter-spacing: -0.035em;
    line-height: 1;
  ">
    <span style="color: var(--ff-ink, #0A0B0E)">Fork</span><span style="color: var(--ff-accent, #2647F0)">First</span>
  </span>
</a>
```

The wordmark colours are unchanged from the previous brand — same
`Fork` in ink + `First` in cobalt split.

---

## Step 4 — Delete the old assets

Search the codebase and **delete** every reference to the old mark.
Anything matching these patterns is the old fork-tile mark — kill it.

| What to look for                                                | What to do                                       |
|-----------------------------------------------------------------|--------------------------------------------------|
| Inline SVG containing `Q 18 32 32 32 Q 46 32 46 21`             | Delete the SVG block; use `mark.svg` instead.    |
| Any inline `<circle cx="32" cy="45" r="6.5" fill="#2647F0">`    | That's the old commit dot. Replace the parent.   |
| `favicon.ico` references                                        | Delete — modern setup uses `favicon.svg` + PNGs. |
| Old `apple-touch-icon` (the fork-tile one)                      | Replaced by the new one in `/brand/favicon/`.    |
| Old maskable PWA icon                                           | Replaced by `icon-maskable-512.png`.             |

Run the dev server, open DevTools → Network, hard-refresh, and look
for any `/brand/...` 404s. Each one tells you a stale reference is
still around.

---

## Step 5 — Test

After deploying, verify each of these visually:

- [ ] Browser tab favicon shows **the Y** mark (not the old fork or boxed mark)
- [ ] iOS Safari "Add to Home Screen" picks up the new apple-touch-icon
- [ ] Android "Add to Home Screen" picks up the maskable icon and the Y
      survives the device's mask shape (test on a circle-mask launcher)
- [ ] Navbar shows the new lockup, app-bar scale (~32 px tall)
- [ ] No 404s for `/brand/...` URLs in DevTools → Network
- [ ] Sharing the URL to Slack / iMessage / Twitter shows the new OG
      card (social platforms cache OG images aggressively — pass through
      each platform's debugger to force re-fetch:
      <https://www.opengraph.xyz/>, Twitter Card Validator, etc)
- [ ] Dark-mode pages: the cobalt arm uses **cobalt-bright** (`#5577FF`)
      — built into `mark.svg` and `mark-on-ink.svg`. Light-mode pages
      using `mark-inverted.svg` use regular cobalt (`#2647F0`).

---

## What didn't change

- **Colour tokens.** Same ink / paper / cobalt / cobalt-bright. If you
  already wired `tokens.css`, you don't need to re-do anything.
- **Fonts.** Still Geist + Geist Mono. Already in the head snippet above.
- **Wordmark.** `wordmark.svg` is byte-identical to the previous brand.
- **Tagline / voice.** *Idea check, before you build.* Unchanged.
- **`brand/README.md`** — keep using the long-form brand guide for
  voice/copy/component rules. Only §5 (Logo) is superseded by this
  file.

---

## Geometry notes (for the curious or for re-rendering)

The Y is built on the same 64×64 grid as the old fork-tile mark, so
existing 28-px and 32-px slots in the UI still fit perfectly.

```
viewBox 0 0 64 64
ring:        circle 32,32 r=25      stroke #5577FF  opacity .16
left+trunk:  M14,12 L32,36 L32,54   stroke ink/paper  width 9   round cap+join
right arm:   M50,12 L33,35          stroke #5577FF  width 9   round cap
```

The right arm intentionally ends at `(33, 35)` — one unit above and
right of the joint — so the cobalt stroke tucks against the paper
trunk with a 1-px gap. **Don't
"clean this up"** — that gap is the join.

For dark surfaces use `#5577FF` on the right arm; for paper surfaces
(`mark-inverted.svg`) use `#2647F0`. This matches the existing
brand-token convention.

---

*Same brand. Same wordmark. Sharper mark. If something on screen
doesn't match this file, fix the surface — not the rules.*
