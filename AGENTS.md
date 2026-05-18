# AGENTS - ForkFirst

This file orients AI coding agents (Codex, Claude Code, Cursor, Lovable, etc.) working in this repository. It is *meta* - about ForkFirst the codebase, not about the products users research with ForkFirst.

If a user asks an AI agent to use ForkFirst to plan their own product, the **Build Pack** export in the app is the right starting point. This file is for agents editing ForkFirst itself.

## What This Project Is

ForkFirst is a local-first Next.js app that:

1. Takes a plain-English idea from a user.
2. Refines it into GitHub search queries.
3. Ranks the resulting public repos by fit, activity, popularity, license, and docs.
4. Explains the top three in plain English with reuse advice.
5. Lets the user save repos, export a Markdown report, and generate an editable Build Pack (PRD, BUILD_PLAN, REPO_STARTER_NOTES, AGENTS/CLAUDE) for another AI builder.

The project is BYOK (Bring Your Own Keys). It must continue to work without any paid keys in **demo mode**.

## Architecture Map

- `src/app/` - Next.js App Router pages and API routes (`api/idea-check`, `api/research-chat`, `api/research-cases`, `api/saved-repos`, `api/verify-keys`).
- `src/components/` - React components for the chat, repo cards, key panel, saved library, build pack modal, and verdict report.
- `src/lib/analysis/` - repo classification, scoring, demo and OpenAI analysts, plain-English narrative generation.
- `src/lib/build-pack/` - generator for the editable Build Pack Markdown (PRD/BUILD_PLAN/REPO_STARTER_NOTES/AGENTS).
- `src/lib/github/` - GitHub search client, normalization, README probing.
- `src/lib/search/` - prompt-to-query planner with vertical detection.
- `src/lib/repos/` - board filters and saved-repo helpers.
- `src/lib/keys/` - key verification status helpers.
- `src/lib/db/` - local SQLite persistence in `.forkfirst/forkfirst.sqlite`.
- `src/lib/export/` - Markdown idea-report exporter.
- `src/lib/usage/` - local rate limit and usage tracking.

## Operating Rules

- **Stay BYOK-safe.** Never log request bodies, never write user-provided keys to disk, never default to a hosted key the maintainer would have to pay for.
- **Keep demo mode usable.** Any change that requires a paid key to test must still degrade gracefully when no key is present.
- **Do not promise license safety.** Build Pack and exports must use advisory language only ("inspect", "confirm") - never "safe to fork" or "license cleared".
- **Edit narrowly.** One concern per change. Don't refactor adjacent code unless the task says so.
- **Run the checks.** Before reporting done: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` if files outside `src/lib/build-pack` or tests are touched.
- **Preserve user research.** Don't delete files under `.forkfirst/` or legacy `.open-repo/`, and don't change SQLite schema without an explicit migration plan.

## What This Project Is NOT

- Not a hosted SaaS - there's no auth, no multi-tenant storage, no billing.
- Not a license scanner - no SBOM, no SPDX clearance, no legal advice.
- Not a code-copying tool - it surfaces and ranks repos, but does not pull, fork, or write to user repos.
- Not tied to any single AI provider - must remain provider-agnostic via OpenAI-compatible APIs.

## Quick Reference

| Want to | Look at |
|---|---|
| Add a vertical (e.g., legal, restaurant) to prompt planning | `src/lib/search/planner.ts` |
| Add a profile to Build Pack output | `src/lib/build-pack/generator.ts` |
| Change repo scoring | `src/lib/analysis/builder-insights.ts`, `src/lib/analysis/analyst.ts` |
| Change repo narrative copy | `src/lib/analysis/human-answer.ts`, `src/lib/analysis/repo-kind.ts` |
| Touch the chat UI | `src/components/sidebars.tsx`, `src/app/page.tsx` |
| Add a saved-repo board | `src/lib/repos/boards.ts` |

## Verification Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
