# ForkFirst MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first local/private ForkFirst MVP: a ChatGPT-like GitHub idea checker with saved research, repo scoring, verdicts, and an Ink Circuit Discovery Radar UI.

**Architecture:** Use a Next.js TypeScript app with local API routes. Keep GitHub access, deterministic scoring, AI/demo analysis, and persistence in separate modules so facts, scoring, and model reasoning stay explainable.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, SQLite, GitHub REST API, optional OpenAI provider, demo fallback provider.

---

## File Structure

- `src/app/page.tsx`: main Chat First, Radar Second interface.
- `src/app/layout.tsx`: app shell metadata and global CSS import.
- `src/app/api/idea-check/route.ts`: accepts an idea prompt and returns a verdict result.
- `src/app/api/research-cases/route.ts`: reads and writes saved local research cases.
- `src/app/api/saved-repos/route.ts`: saves favorite repositories to a research case.
- `src/lib/github/types.ts`: GitHub and normalized repository types.
- `src/lib/github/provider.ts`: public GitHub API search and enrichment.
- `src/lib/search/planner.ts`: deterministic query planning with AI-ready boundary.
- `src/lib/scoring/scoring.ts`: deterministic fit, health, activity, license, and docs scoring.
- `src/lib/analysis/types.ts`: verdict and category types.
- `src/lib/analysis/demo-analyst.ts`: deterministic fallback analyst.
- `src/lib/analysis/openai-analyst.ts`: optional OpenAI analyst provider.
- `src/lib/analysis/analyst.ts`: provider selector.
- `src/lib/db/client.ts`: SQLite connection and schema initialization.
- `src/lib/db/research-cases.ts`: local saved cases and repos.
- `src/components/idea-input.tsx`: large prompt input.
- `src/components/verdict-report.tsx`: verdict and explanation panel.
- `src/components/discovery-radar.tsx`: readable research map answer component.
- `src/components/repo-card.tsx`: compact repo evidence card.
- `src/components/sidebars.tsx`: recent checks and saved favorites rails.
- `src/types/idea-check.ts`: API result type shared by UI and server.

## Task 1: Bootstrap The App

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/app/page.tsx`

- [ ] Create a Next.js TypeScript app in the project root.
- [ ] Install dependencies: `next`, `react`, `react-dom`, `lucide-react`, `zod`, `better-sqlite3`, `openai`.
- [ ] Install dev dependencies: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@types/better-sqlite3`, `tailwindcss`, `postcss`, `autoprefixer`, `eslint`, `eslint-config-next`.
- [ ] Add scripts: `dev`, `build`, `lint`, `typecheck`.
- [ ] Verify `npm run typecheck` passes with the empty shell.

## Task 2: Core Types And Planner

**Files:**
- Create: `src/lib/github/types.ts`
- Create: `src/lib/search/planner.ts`
- Create: `src/lib/analysis/types.ts`
- Create: `src/types/idea-check.ts`

- [ ] Define normalized repository, score, category, verdict, and idea-check result types.
- [ ] Implement `planSearches(prompt: string)` to produce stable GitHub query variants from a user idea.
- [ ] Include language-agnostic and topic-like query variants.
- [ ] Verify with `npm run typecheck`.

## Task 3: GitHub Provider

**Files:**
- Create: `src/lib/github/provider.ts`

- [ ] Implement `searchGithubRepositories(prompt: string)` using query variants from the planner.
- [ ] Use `GITHUB_TOKEN` when present.
- [ ] Fall back to unauthenticated search when missing.
- [ ] Normalize repository fields needed by the scoring engine.
- [ ] Deduplicate repositories by `owner/name`.
- [ ] Return rate-limit warnings when GitHub responds with rate-limit errors.

## Task 4: Scoring And Demo Analyst

**Files:**
- Create: `src/lib/scoring/scoring.ts`
- Create: `src/lib/analysis/demo-analyst.ts`
- Create: `src/lib/analysis/openai-analyst.ts`
- Create: `src/lib/analysis/analyst.ts`

- [ ] Implement deterministic scoring for activity, popularity, license presence, docs presence, and prompt fit.
- [ ] Implement category assignment: Already Exists, Forkable, Reference, Gap, Risk.
- [ ] Implement demo verdict generation so the app works without `OPENAI_API_KEY`.
- [ ] Implement optional OpenAI analyst behind the same provider interface.
- [ ] Ensure demo mode is clearly flagged in returned results.

## Task 5: API Routes

**Files:**
- Create: `src/app/api/idea-check/route.ts`
- Create: `src/app/api/research-cases/route.ts`
- Create: `src/app/api/saved-repos/route.ts`

- [ ] Implement `POST /api/idea-check` with `{ prompt: string }`.
- [ ] Validate prompt input.
- [ ] Call GitHub provider, scoring engine, and analyst provider.
- [ ] Return a structured `IdeaCheckResult`.
- [ ] Add research-case and saved-repo persistence routes.

## Task 6: SQLite Persistence

**Files:**
- Create: `src/lib/db/client.ts`
- Create: `src/lib/db/research-cases.ts`

- [ ] Initialize local SQLite at `.forkfirst/forkfirst.sqlite`.
- [ ] Create tables for research cases, idea checks, repositories, and saved repos.
- [ ] Add helpers to save idea checks and favorites.
- [ ] Ensure directories are created automatically.

## Task 7: Ink Circuit UI

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/idea-input.tsx`
- Create: `src/components/verdict-report.tsx`
- Create: `src/components/discovery-radar.tsx`
- Create: `src/components/repo-card.tsx`
- Create: `src/components/sidebars.tsx`

- [ ] Build the Chat First, Radar Second layout.
- [ ] Keep the prompt box as the main first impression.
- [ ] Render verdict, grouped repositories, evidence cards, saved favorites, and Discovery Radar.
- [ ] Use Ink Circuit colors: graphite, near-white, acid green, amber, violet/steel, red/coral.
- [ ] Avoid marketing-page sections and generic dashboard density.

## Task 8: Verification

**Files:**
- Modify as needed based on failures.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start `npm run dev`.
- [ ] Open the app in browser.
- [ ] Verify no missing-key crashes when `GITHUB_TOKEN` and `OPENAI_API_KEY` are unset.
- [ ] Run a real idea check against public GitHub if network and rate limits allow.
- [ ] Confirm text does not overlap and the ask box is prominent.
