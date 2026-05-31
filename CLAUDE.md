# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint across src + config files
npm run test         # vitest run (all tests)
npm run test:launch-evals  # run launch-confidence evals only

# Run a single test file
npx vitest run src/lib/build-pack/generator.test.ts

# Run tests matching a name pattern
npx vitest run --testNamePattern "job tracker"
```

## Architecture

### The app is one large client component

`src/components/forkfirst-redesign.tsx` (~6000+ lines) is the entire UI. It manages all client state via `useState`/`useCallback`, persists to `localStorage` via workspace serialization, and drives a multi-phase flow: `landing → loading → results → branding → generating → ready`. Resist splitting this file without a clear seam — the shared state makes it genuinely one component.

### Idea-check pipeline

```
idea text
  → searchGithubRepositories()       src/lib/github/provider.ts
  → enrichTopCandidateReadmes()      src/lib/idea-check/enrich-candidates.ts
  → classifyRepositories()           src/lib/scoring/scoring.ts
  → enrichRepositoriesWithStructure() src/lib/github/structure.ts
  → rerankWithUserAi()               src/lib/analysis/rerank.ts   (BYOK, skipped if no AI key)
  → analyzeIdea()                    src/lib/analysis/analyst.ts
      → analyzeWithOpenAI()  if AI key present
      → analyzeWithDemo()    if no AI key          src/lib/analysis/demo-analyst.ts
  → buildProjectBuildPack()          src/lib/build-pack/generator.ts
```

The API entry point is `src/app/api/idea-check/route.ts` → `src/lib/idea-check/run.ts`.

### Handoff generation

`src/lib/build-pack/generator.ts` is the largest pure-logic file. It:
- Detects the product domain from the idea text (job tracker, CRM, realtor, voice tool, etc.) and selects a `ProductProfile`
- Generates all 6 split Markdown files as one combined string, separated by `# H1` headers
- Renders `## Foundation Decisions` (consolidated keep/replace/add/inspect table)
- Renders `## License And Reuse` and `## How To Use This Foundation Respectfully` via `src/lib/build-pack/license.ts`
- The client splitter in `forkfirst-redesign.tsx` (`markdownSection()`) splits the combined string into the zip files

`src/lib/build-pack/license.ts` — per-family license literacy (MIT / Apache / BSD / MPL / LGPL / GPL / AGPL / Unlicense / NOASSERTION / missing). Used in both `generator.ts` and the wizard's pre-gate check.

### BYOK + security model

- No user accounts. Keys live in client-side React state; opt-in localStorage persistence.
- `FORKFIRST_ALLOW_SERVER_KEYS=false` (default) — no server-side key fallback on public deployments.
- `FORKFIRST_ENABLE_SERVER_DB=false` (default) — SQLite via `better-sqlite3` only if opted in.
- Rate limiting is in-memory (`Map`) per serverless instance by default; set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for durable limits across instances.
- Repo content passed to the AI is wrapped in `<UNTRUSTED_REPO_CONTENT>` tags to mitigate prompt injection.

### Demo mode

"Demo mode" currently means two different things:
- **No AI key** → `analyzeWithDemo()` runs deterministic verdict logic instead of an LLM call.
- **No GitHub token** → `searchGithubRepositories()` still hits the live GitHub public API with lower rate limits, often returning irrelevant results.

The curated demo search lives at `src/lib/github/demo-search.ts` — invoked from `run.ts` when no GitHub token is present, bypassing live API calls entirely.

### Wizard

`BrandingInterview` in `forkfirst-redesign.tsx` — 3-step guided mode plus a single-scroll developer mode. Receives `repo` and `originalIdea` props for domain-aware placeholders and pre-wizard license/Docker gates. The `BrandAnswers` type and `DEFAULT_BRAND_ANSWERS` shape the wizard state; `buildPackPreferences()` maps answers to `BuildPackPreferences` for the generator.

### Testing conventions

Tests live alongside source files. `generator.test.ts` is the most important — it guards every domain-specific profile, punctuation edge cases, zip-awareness, and the new wizard fields. `license.test.ts` covers the per-family profiles. Run the full suite after any generator or license change.

### Environment variables

```bash
# Required for real GitHub search
GITHUB_TOKEN=

# Required for AI analysis (provider is auto-detected)
OPENAI_API_KEY=   # or GROQ_API_KEY / DEEPSEEK_API_KEY

# Optional server-side fallbacks (dangerous on public deployments)
FORKFIRST_ALLOW_SERVER_KEYS=false
FORKFIRST_ENABLE_SERVER_DB=false
FORKFIRST_ALLOW_PRIVATE_BASE_URLS=false

# Durable rate limiting (in-memory by default)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
