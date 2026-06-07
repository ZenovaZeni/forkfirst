# ForkFirst Launch Audit - 2026-05-21

## Scope

Full pre-launch pass focused on the user-facing repo search, mobile navigation, saved local state, BYOK key routing, Build Pack export, and production readiness.

## Issues Found And Fixed

- OpenAI provider requests were falling back to the Groq-compatible base URL in key verification and idea refinement. Added a shared provider base URL helper so OpenAI uses `https://api.openai.com/v1`, Groq uses the Groq URL, DeepSeek uses its API URL, and custom uses the user-entered base URL.
- Saved dark mode caused a React hydration warning on reload because the boot script changed the DOM before React rendered the theme toggle. The first client render now matches the server toggle markup, then updates after mount.
- Mobile long-press on the center `+` could leave the gesture flag stuck, causing later taps on the button to be ignored. The long-press state now consumes once and resets.
- Recent chats could be capped correctly but still crash persistence if browser storage failed. Local storage writes/removes now fail gracefully.
- Build Pack blocker-level quality findings were treated like warnings. Blocking findings now stop export until the user edits, while warnings can still be intentionally exported.
- Private/link-local project site URLs were not fully filtered. Added checks for private IPv4, link-local IPv4, and private/link-local IPv6 patterns.
- Standalone `/trending` used theme labels that did not match the app-wide dark theme selectors. It now uses `light` / `dark`.
- Mobile polish pass added more room for recent chats, safer mobile top spacing, less clipped search placeholders, and a better-sized sticky reply composer.
- Launch smoke zip inspection treated missing zips the same as non-Windows inspection skips. Missing zip now fails; non-Windows inspection-only skip remains non-blocking.

## Playwright Coverage

- Desktop saved dark theme reload: passed after fix, no hydration console errors.
- Standalone `/trending` dark theme: passed.
- Mobile long-press recent chats drawer: passed with 14 seeded chats visible.
- Mobile Settings navigation and heading offset: passed.
- Mobile Handoffs navigation: passed.
- Mobile result composer after a real idea check: passed; input stays inside composer bounds.
- Launch smoke UI path: passed idea check -> result -> skip builder questions -> handoff ready -> zip download -> zip content inspection.

Screenshots were written to temporary audit folders during the run:

- Full audit temp folder.
- Mobile audit temp folder.

## Verification Commands

All passed:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke:launch
```

Latest smoke highlights:

- `vas3k/TaxHacker` for receipt scanner: 89 fit
- `shopnex-ai/shopnex` for Shopify dashboard: 82 fit
- `thunderbird/appointment` for salon booking: 88 fit
- `Max0709202/youth-sports-clubs` for parent sports schedules: 69 fit
- UI Build Pack zip downloaded without dialogs or console messages.
- Zip contained `STARTER_REPO.md`, `PRD.md`, `BUILD_PLAN.md`, `REPO_STARTER_NOTES.md`, `AGENTS.md`, `CLAUDE.md`, and combined handoff markdown.
- Zip inspection found no generic placeholder hits and found the expected receipt/expense/csv/tax/parsed domain terms.

## Remaining Watch Items

- The parent sports prompt still returns a lower-confidence match than the other launch prompts. It is acceptable as a "lead" result, but it is the prompt family to keep improving after launch.
- The Build Pack quality guard should stay visible and branded in future work. Avoid browser-native alerts for quality warnings.
- Continue testing real prompts that mix domain, platform, and must-have workflow details, because the product's core value depends on idea-plus-repo fit.
- Launch confidence follow-up added deterministic eval coverage for SaaS billing portals, property maintenance portals, event ticketing, bug tracking, and kids learning apps. These are still representative offline cases, not a guarantee that every live GitHub search will return a perfect repo.

## Follow-Up Verification

After the first audit commit, the remaining native browser dialogs were replaced with branded or inline UI:

- Clear all local data now uses a ForkFirst confirmation dialog.
- Custom prompt pack deletion now uses a ForkFirst confirmation dialog.
- PWA install help now renders inline guidance instead of `alert`.
- Settings install fallback now renders inline guidance instead of `alert`.

Additional checks passed:

```bash
npm run test:launch-evals
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke:launch
```

Live deployment check against the hosted deployment also passed:

- Landing loaded with title `ForkFirst - don't make your AI builder start from zero`.
- No browser console errors or 500 responses.
- No-key `/api/idea-check` for `I want a local-first receipt scanner that tracks expenses and exports CSV` returned `vas3k/TaxHacker` at 89 fit in demo mode.

## Launch Confidence Follow-Up

This pass expanded the core offline quality bar from 9 to 14 idea-to-handoff evals:

- Existing: Pokemon/card collector, grocery app, cleaning ops, salon booking, realtor leads, Shopify profit dashboard, cat ID, kids sports schedules, receipt/expense CSV.
- Added: SaaS billing portal, property maintenance portal, event ticketing, bug tracker, kids learning app.

Improvements made:

- Search planner now has first-angle coverage for SaaS billing, property maintenance, event ticketing, bug tracking, and learning apps.
- Property maintenance no longer gets swallowed by generic real-estate lead-gen searches.
- Generic Build Packs now let selected repo/README evidence contribute concrete data objects, so repo evidence like work orders, tenants, landlords, and vendors can appear in the handoff even when the user's prompt is short.

Targeted verification passed:

```bash
npm run test:launch-evals
npm test -- src/lib/search/launch-benchmarks.test.ts src/lib/search/planner.test.ts
```
