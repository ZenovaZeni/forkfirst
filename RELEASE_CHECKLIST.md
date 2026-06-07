# ForkFirst - Release Checklist

Last updated: 2026-05-16

Use this before tagging a public GitHub release. Each row is a real check, not aspirational language. Update the status column when something changes.

Legend: ✅ done · ⚠️ needs attention · ☐ to-do

---

## 1. Product Readiness

| Check | Status | Notes |
|---|---|---|
| Demo mode works without keys | ✅ | Unauthenticated GitHub search + deterministic scoring still returns useful results. |
| Idea-check API returns refined queries and ranked repos | ✅ | `src/lib/search/planner.ts` + `src/lib/analysis/*`. |
| Saved boards persist locally in browser | ✅ | browser storage; cleared via browser site data. |
| Build Pack generates PRD, BUILD_PLAN, REPO_STARTER_NOTES, AGENTS/CLAUDE | ✅ | `src/lib/build-pack/generator.ts`. |
| Build Pack stays domain-specific (no ForkFirst bleed) | ✅ | Profile detection for realtor image/lead, ClickUp, Obsidian, Cursor, voice, repo-tool. Covered by tests. |
| Build Pack labels weak matches as research leads, not fork candidates | ✅ | `recommendedRepoLabel()` thresholds + `verdictDirection()` guard. Covered by tests. |
| Build Pack includes all required sections | ✅ | Verified by `includes every required Build Pack section for a default idea` test. |
| Export Markdown report contains license disclaimer | ✅ | Added to `src/lib/export/report.ts`. Covered by test. |

## 2. UX Readiness

| Check | Status | Notes |
|---|---|---|
| Home screen explains what ForkFirst does in under 30 seconds | ✅ | Idea hero copy in `idea-input.tsx`. |
| Empty / loading / error states present in chat flow | ✅ | `src/app/page.tsx` includes empty results card, loading state, error toast. |
| Mobile layout usable | ✅ | Mobile header + drawer pattern in `sidebars.tsx`. Verified visually in prior captures. |
| Paper/Ink theme toggle works | ✅ | browser storage-backed in `src/app/page.tsx`. |
| Save / Saved button accessible (aria-label, type=button) | ✅ | Polished this pass. |
| Saved drawer copy explains local-only storage | ✅ | Added in this pass. |
| Export drawer copy notes license advice is advisory | ✅ | Added in this pass. |
| Keys drawer copy explains BYOK and where keys live | ✅ | Added in this pass. |

## 3. BYOK / Key Safety

| Check | Status | Notes |
|---|---|---|
| Keys live in browser storage only | ✅ | `src/components/key-settings.tsx` reads/writes through parent state. |
| Keys sent only to the local Next.js API for the triggered request | ✅ | Verified in `src/app/api/*` handlers. |
| Keys never written to `.forkfirst/forkfirst.sqlite` | ✅ | Documented in PRIVACY.md and SECURITY.md. |
| No public hosted owner key is required | ✅ | Demo mode works without keys. |
| Custom OpenAI-compatible base URL validation | ⚠️ | OK for local BYOK use. Public hosted deployment must add provider allowlist (see SECURITY.md). |
| Key panel copy clarifies optional + read-only scope | ✅ | Updated in this pass. |

## 4. Docs Readiness

| Check | Status | Notes |
|---|---|---|
| README.md - pitch, audience, features, BYOK, setup, screenshots, roadmap, license | ✅ | Rewritten this pass. |
| AGENTS.md - present at repo root | ✅ | Created this pass. |
| CONTRIBUTING.md - clear and accurate | ✅ | Polished this pass. |
| SECURITY.md - present and explicit | ✅ | Polished this pass. |
| PRIVACY.md - present and accurate | ✅ | Existing; still accurate. |
| ROADMAP.md - matches roadmap in README | ✅ | Already aligned. |
| .env.example - placeholders only, no secrets | ✅ | Polished this pass. |
| docs/byok.md - full BYOK guide | ✅ | Existing. |
| docs/assets/README.md - screenshot regeneration guide | ✅ | Created this pass. |

## 5. Repo Hygiene

| Check | Status | Notes |
|---|---|---|
| `.gitignore` covers env, build, sqlite, dev logs, QA screenshots, OS noise | ✅ | Rewritten this pass. |
| No `.env` or `.env.local` committed | ✅ | Only `.env.example` exists. |
| No `.forkfirst/`, `.superpowers/`, `.starter-reference/` committed | ✅ | All in `.gitignore`. |
| No `.dev-server*.log` or `.qa-*.png` committed | ✅ | Added to `.gitignore`. |
| `tsconfig.tsbuildinfo` ignored | ✅ | Added to `.gitignore`. |
| `node_modules/`, `.next/`, `out/`, `build/` ignored | ✅ | In `.gitignore`. |
| Screenshots in `public/screenshots/` are clean and reviewable | ✅ | 3 release-ready screenshots present; regenerate with `npm run screenshots`. |

## 6. Test / Build Status

| Command | Status | Notes |
|---|---|---|
| `npm run typecheck` | ✅ | Clean. |
| `npm run lint` | ✅ | Clean. |
| `npm test` | ✅ | 61 / 61 passing across 13 files. |
| `npm run build` | ✅ | Production build succeeds in ~10s. |

Verified on 2026-05-16 against Node 20+ on Windows 11.

## 7. Known Limitations

- **No cloud sync.** Saved repos and pasted keys live in the active browser only; switching machines means re-pasting and re-saving.
- **GitHub rate limits.** Without a personal access token the unauthenticated GitHub search is rate-limited and may return partial results.
- **License classification is advisory only.** The app surfaces what GitHub reports as the license and flags repos that need manual inspection. It does not perform legal clearance.
- **No hosted accounts / no multi-tenant safety.** Public hosting must add auth, rate limits, provider URL allowlists, and never log request bodies (see SECURITY.md).
- **Single language.** Copy is English only.
- **Screenshots regenerate manually.** No CI job captures or compares them; run `npm run screenshots` after meaningful UI changes.

## 8. Launch Notes

Before tagging:

1. Pull a clean clone into a fresh folder and run `npm install && npm run dev` from scratch.
2. Run the four checks above (`typecheck`, `lint`, `test`, `build`).
3. Open `http://127.0.0.1:3000` in a clean browser profile and walk the BYOK smoke test from `docs/release-checklist.md`.
4. Regenerate screenshots (`npm run screenshots`) if any visible UI changed since the last capture.
5. Tag the release and push (`git tag v0.1.0 && git push --tags`).

## 9. Suggested First GitHub Release Description

> ### ForkFirst v0.1.0 - Local-first GitHub idea discovery
>
> ForkFirst helps builders check whether an idea already exists on GitHub, compare useful repos, save research, and generate an editable AI build pack for Codex, Claude Code, Cursor, Lovable, or any AI coding tool.
>
> **Highlights**
>
> - Plain-English repo discovery: describe an idea, get three explained repo leads.
> - **BYOK only** - bring your own GitHub token and any OpenAI-compatible AI provider key. Keys are session-only by default; persistent browser storage is opt-in. Demo mode works without keys.
> - **Editable Build Pack** with PRD, BUILD_PLAN, REPO_STARTER_NOTES, and AGENTS/CLAUDE files tailored to nine product profiles (realtor image, realtor lead-gen, ClickUp-style, Obsidian-style, Cursor-style, voice assistant, lead-gen, repo-discovery, generic).
> - **Markdown idea report** export with executive summary, recommended next moves, repo notes, opportunity gaps, and a license disclaimer.
> - **Paper / Ink** light and dark themes.
> - Saves locally to `.forkfirst/forkfirst.sqlite` and to the browser's browser storage. No hosted account required.
>
> **Get started**
>
> ```bash
> git clone <your-forkfirst-repo-url>
> cd forkfirst
> npm install
> npm run dev
> ```
>
> Open `http://127.0.0.1:3000`, paste your keys in the **Keys and providers** panel, and run your first prompt.
>
> See the README for setup, BYOK details, example prompts, and the roadmap. MIT licensed.

---

## Status Summary

**Is this repo ready to publish?** ✅ Yes - all blocking checks pass.

**Remaining recommendations (non-blocking):**

- Regenerate screenshots with `npm run screenshots` once the dev server is up to ensure they match the latest UI copy.
- Confirm the public repo URL and optional app env links point to the intended public project channels.
