# ForkFirst — Logo & Favicon Swap

> **Hand this to your AI coder.** It's the only file they need to swap the
> old logo and favicon for the new ones. Whole job in one paste.

---

## What you're swapping in

A refined **fork-tile** mark — a dark rounded square containing a paper
git-fork glyph with a **cobalt commit dot** — paired with a **two-tone
wordmark**: `Fork` in ink, `First` in cobalt.

Replaces any previous logo, favicon, app icon, and OG image.

---

## Step 1 — Drop the `brand/` folder into your project

Copy the entire **`brand/`** folder from this design package into your
app's public/static directory. Final layout in the deployed site:

```
public/                            (or static/, or wherever your host serves /)
├── brand/
│   ├── README.md                  ← full brand brief (read once)
│   ├── tokens/tokens.css          ← CSS variables (--ff-*)
│   ├── tokens/tokens.json
│   ├── html/head-snippet.html     ← the <head> block from step 2
│   ├── html/site.webmanifest      ← PWA manifest
│   ├── logo/
│   │   ├── mark.svg               ← the mark, scalable; use this everywhere
│   │   ├── mark-on-ink.svg        ← dark-context variant
│   │   ├── mark-cobalt-tile.svg   ← cobalt-tile variant (bold)
│   │   ├── mark-inverted.svg      ← paper-tile, ink fork (light context)
│   │   ├── wordmark.svg           ← two-tone ForkFirst wordmark
│   │   ├── wordmark-on-ink.svg
│   │   ├── wordmark.png           ← 1× PNG fallback
│   │   ├── wordmark-2x.png        ← 2× PNG
│   │   ├── lockup-horizontal.svg  ← DEFAULT for navs / footers
│   │   ├── lockup-horizontal-on-ink.svg
│   │   ├── lockup-horizontal.png  / -2x.png  / -on-ink.png
│   │   ├── lockup-stacked.svg     ← for square / portrait contexts
│   │   └── lockup-stacked-on-ink.svg
│   ├── favicon/
│   │   ├── favicon.svg            ← modern browsers
│   │   ├── favicon-16.png
│   │   ├── favicon-32.png
│   │   ├── favicon-48.png
│   │   ├── apple-touch-icon.png   ← iOS — 180×180
│   │   ├── icon-192.png           ← PWA
│   │   ├── icon-512.png           ← PWA
│   │   ├── icon-maskable-512.png  ← PWA maskable (extra safe-zone padding)
│   │   ├── icon-192-light.png     ← optional, for light-bg systems
│   │   └── icon-512-light.png
│   └── social/
│       ├── og-image.png           ← 1200×630 (paper)
│       └── og-image-dark.png      ← 1200×630 (ink)
└── site.webmanifest               ← copy `brand/html/site.webmanifest` here
```

If you're hosting from a different root, fix the paths in step 2.

---

## Step 2 — Replace the `<head>` block on every page

Open your site's main HTML / layout file (root `index.html`,
`_document.tsx` for Next.js, `<svelte:head>` for SvelteKit, etc) and
**replace** any existing favicon / OG / icon `<link>` and `<meta>` tags
with the block below. Don't merge — fully replace, so no stale references
remain.

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
<meta property="og:url" content="https://forkfirst.dev"/>  <!-- update to your real URL -->

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

<!-- Design tokens -->
<link rel="stylesheet" href="/brand/tokens/tokens.css"/>
```

---

## Step 3 — Swap the navbar / footer logo

Find the existing logo component in your code (likely `<Logo />`,
`<Brand />`, a `<header>` `<img>`, or inline SVG) and replace it with the
new lockup. **One of two approaches** — pick one and use it everywhere
for consistency.

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
square contexts (mobile app, avatar, footer block), use
`lockup-stacked.svg`.

### Option B — Use the mark + inline wordmark (more flexible, recommended)

```html
<a href="/" aria-label="ForkFirst home" style="
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
">
  <img src="/brand/logo/mark.svg" alt="" width="28" height="28"/>
  <span style="
    font-family: var(--ff-font-display);
    font-weight: 700;
    font-size: 17px;
    letter-spacing: -0.035em;
    line-height: 1;
  ">
    <span style="color: var(--ff-ink)">Fork</span><span style="color: var(--ff-accent)">First</span>
  </span>
</a>
```

This keeps the text rasterised by the browser (sharper at small sizes)
and gives you control over the tone split via CSS variables.

---

## Step 4 — Find-and-replace stale references

Search the codebase for these strings and **delete or update** every
match:

| Find                                                  | Replace with                                       |
|-------------------------------------------------------|----------------------------------------------------|
| Old favicon paths (`favicon.ico`, `favicon-old.png`)  | The new `brand/favicon/...` paths from step 2.     |
| Any inline SVG of the old logo                        | The new lockup component from step 3.              |
| `#FF5555` or any coral / red commit-dot colour        | `var(--ff-cobalt)` / `#2647F0`                     |
| `"Fork First"` (two words, in display copy)           | `ForkFirst` (one word) — *only* in display copy    |
| Hardcoded blue (`#3b82f6`, `#0066cc`, etc) as accent  | `var(--ff-cobalt)` / `#2647F0`                     |

> ⚠️ **Note on the wordmark casing.** In running prose / body copy, write
> **ForkFirst** as one camelCase word. The two-tone split only applies to
> the *display wordmark* (logo, hero, social cards) — not to every
> sentence that mentions the brand.

---

## Step 5 — Test

After deploying, verify:

- [ ] Browser tab favicon shows the dark fork-tile with cobalt commit dot
- [ ] iOS Safari "Add to Home Screen" picks up the apple-touch-icon
- [ ] Navbar shows the new lockup at app-bar scale (32 px tall ish)
- [ ] No 404s for `/brand/...` URLs in DevTools → Network
- [ ] Sharing the URL to Slack / iMessage / Twitter shows the new OG card
      (the social platforms cache these — pass through their debugger to
      force a re-fetch if needed)
- [ ] Dark-mode pages use the cobalt-bright accent
      (`var(--ff-cobalt-bright)`, `#5577FF`) instead of cobalt

---

## What didn't change

- **Colour tokens.** The cobalt / ink / paper palette is unchanged. If
  you've already wired `tokens.css` you don't need to re-do anything.
- **Fonts.** Still Geist + Geist Mono. Already in the head snippet.
- **The full BRAND.md** at `brand/README.md` — read it once for the
  voice, rules, and full guideline set.

If you hit anything weird, look at **`brand/README.md`** — it's the long
form. This file is the short form.
