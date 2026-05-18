# ForkFirst release assets

Release screenshots live in `public/screenshots/` so the README can render them on GitHub and the deployed app can serve them directly.

## Regenerating

```bash
npm run dev
npx playwright install chromium
node scripts/capture-screenshots.mjs
```

The capture script writes the current launch screenshots to `public/screenshots/`.

## Current screenshots

| File | Description |
|---|---|
| `public/screenshots/home.png` | Desktop home screen |
| `public/screenshots/rebrand-desktop-paper.png` | Desktop home, Paper theme |
| `public/screenshots/rebrand-desktop-ink.png` | Desktop home, Ink theme |
| `public/screenshots/rebrand-mobile-paper.png` | Mobile home screen |
| `public/screenshots/results.png` | Ranked repo results after a demo prompt |
| `public/screenshots/build-pack.png` | Builder Handoff modal with editable Markdown |

## Safety

- Capture with a fresh browser profile so no real GitHub token or AI provider key is visible.
- Use demo prompts that do not contain personal information.
- Crop or blur any usage cost numbers if you have run real paid calls in the captured browser.
