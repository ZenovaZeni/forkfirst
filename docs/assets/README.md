# ForkFirst release assets

This folder holds release-ready screenshots used in the GitHub repo page, blog posts, and external link previews. The README in the project root pulls smaller copies from `public/screenshots/` so they ship inside the deployed app.

## Regenerating

```bash
npm run dev                                # in one terminal
npx playwright install chromium            # first time only
node scripts/capture-screenshots.mjs       # in another terminal
```

The script writes a matching `*.png` to both `public/screenshots/` and `docs/assets/`.

## Naming convention

| File | Description |
|---|---|
| `01-home-paper.png` | Desktop home, Paper (light) theme |
| `02-home-ink.png`   | Desktop home, Ink (dark) theme |
| `03-chat-results.png` | Chat-style results after a demo prompt |
| `04-saved-library.png` | Saved library drawer |
| `05-build-pack.png` | Build Pack modal with editable Markdown |
| `06-mobile-home.png` | Mobile home screen (390×844) |
| `07-mobile-results.png` | Mobile chat/results |

## Safety

- Capture with a **fresh browser profile** so no real GitHub token or AI provider key is visible.
- Use demo prompts that do not contain personal information.
- Crop or blur any usage cost numbers if you have run real paid calls in the captured browser.
