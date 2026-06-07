# ForkFirst Brand Assets

ForkFirst uses the new **Y mark** with the existing two-tone **ForkFirst** wordmark.

## Logo Rules

- Use `logo/mark.svg` for icon contexts, favicons, app icons, and avatars.
- Use `logo/lockup-horizontal.svg` when the mark and wordmark appear together on light surfaces.
- Use `logo/lockup-horizontal-on-ink.svg` on dark surfaces.
- Keep the wordmark intact: `Fork` in ink/paper, `First` in cobalt/accent.
- Do not add a second container, glow, gradient, or decorative border around the mark.

## Files

| Asset | Use |
|---|---|
| `logo/mark.svg` | Default Y mark with a paper ring |
| `logo/mark-on-ink.svg` | Y mark without tile for dark surfaces |
| `logo/mark-inverted.svg` | Light-surface mark variant |
| `logo/wordmark.svg` | Existing light-surface wordmark |
| `logo/wordmark-on-ink.svg` | Existing dark-surface wordmark |
| `logo/lockup-horizontal.svg` | Mark + existing wordmark |
| `logo/lockup-horizontal-on-ink.svg` | Mark + existing wordmark for dark surfaces |
| `favicon/*` | Browser, Apple touch, and PWA app icons |
| `splash/*` | iOS/iPadOS PWA startup images |
| `social/og-image.png` | Social preview image |
| `social/og-image-dark.png` | Alternate social preview image |

## PWA

The root `public/manifest.json` points at the icons in `brand/favicon/`:

- `icon-192.png`
- `icon-512.png`
- `icon-maskable-512.png`

The PWA background and theme color are set to the app paper surface so install and splash surfaces match the default landing screen.

## Apple Startup Images

`brand/splash/` contains portrait and landscape startup images for common iPhone and iPad viewport sizes. The Next.js root layout maps them to `apple-touch-startup-image` links so installed iOS/iPadOS web apps launch with the current Y mark and wordmark.
