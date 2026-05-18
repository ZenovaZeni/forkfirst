# Research And Handoff Quality Plan

Goal: make ForkFirst results and Builder Handoffs feel like a senior product engineer studied the repo landscape, chose a foundation, and wrote an AI-builder-ready launch brief.

## Research Inputs

- Claude Code guidance emphasizes: explore first, plan, then code; provide rich project context; keep verification explicit; and manage context because long always-loaded instructions degrade performance.
- AGENTS/CLAUDE-style project files should be operational: commands, project structure, conventions, protected boundaries, and verification. They should avoid secrets, vague advice, and long README-like prose.
- Cursor has moved toward Project Rules rather than relying on old `.cursorrules`, so Cursor output should be a rules-oriented section or file, not a generic Codex/Claude manifest.
- GitHub search quality depends on deliberate qualifiers and query lanes, not one broad query. Exact-name, domain, stack, starter/template, and reference/list searches should be tracked separately.

Sources checked:
- Anthropic Claude Code best practices: https://code.claude.com/docs/en/best-practices
- Anthropic scaling agentic coding guide: https://resources.anthropic.com/hubfs/Scaling%20agentic%20coding%20across%20your%20organization.pdf
- Cursor rules docs: https://docs.cursor.com/en/context
- GitHub repository search syntax: https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories
- OpenAI Codex use cases and workflow guidance: https://developers.openai.com/codex/use-cases/

## Product Bar

Every result should answer:

1. What did we search, and why was that enough or not enough?
2. What is this repo: app, SDK, template, list, plugin, benchmark, or competitor?
3. Why did this repo outrank the others?
4. What can a builder safely inspect, adapt, or avoid copying?
5. What is the first build move from this foundation?

Every handoff should answer:

1. What is the product and who is it for?
2. Which repo is the foundation and what exact parts matter?
3. What must not be copied without inspection?
4. What is v1, with acceptance criteria and failure states?
5. What should Codex, Claude Code, Cursor, or Lovable do first?

## Phase 1: Immediate UX And Wiring

- Mobile chat must fit 390px and 320px viewports without horizontal overflow.
- Mobile users need first-class navigation for New, Trending, Prompt Packs, Handoff, Library, and Settings.
- Result suggestion chips must send real follow-up chat prompts.
- Starter cards and GitHub URL shortcut must search the intended prompt, not the stale previous prompt.
- Repo drawer actions must save and start the handoff flow.
- Ready-state copy/download actions must be real and honestly labeled as Markdown until real zip generation exists.

## Phase 2: Better Search And Ranking

Files:
- `src/lib/search/planner.ts`
- `src/lib/github/types.ts`
- `src/lib/github/provider.ts`
- `src/lib/github/readme.ts`
- `src/lib/scoring/scoring.ts`
- `src/lib/analysis/types.ts`

Plan:
- Replace `string[]` query planning with typed query lanes: exact name, domain/problem, stack, starter/template, competitor/product, reference/list, fallback broad.
- Preserve query provenance on each repo: matched queries, matched intents, best GitHub score.
- Pre-score metadata results, fetch README data for the likely top 16-24, then final-score after README enrichment.
- Parse README sections instead of taking the first excerpt: overview, setup, usage, API, license, demo/screenshots.
- Split ranking into query fit, domain fit, artifact utility, maintenance, and reuse risk.
- Store repo kind as first-class data with confidence and reasons.

Tests:
- Planner fixtures for vague prompts, exact product names, specific stacks, game engines, real-estate tools, and AI agent tools.
- Provider tests for duplicate repos across query lanes and README enrichment of later but better matches.
- Scoring tests for popular generic repo vs niche exact repo, no-license competitor, stale reference, SDK vs app, and curated list.

## Phase 3: Evidence-Specific Narratives

Files:
- `src/lib/analysis/human-answer.ts`
- `src/lib/analysis/builder-insights.ts`
- `src/lib/analysis/openai-analyst.ts`
- `src/lib/analysis/demo-analyst.ts`
- `src/app/api/research-chat/route.ts`

Plan:
- Make every repo narrative cite deterministic evidence: query lane, README section, repo kind, activity, license advisory, and reason it outranked alternatives.
- Add coverage honesty: low result count, broad prompt, partial query failure, README fetch failure, and low-confidence ranking warnings.
- Add `researchMemory` to `IdeaCheckResult` so follow-up chat can explain search gaps and omitted candidates.
- Validate AI analysis with Zod and fall back to deterministic demo mode if malformed.

Tests:
- Snapshot-style output tests for no strong match, exact-name match, directory-heavy results, missing license, and search-gap follow-up.
- API tests for malformed AI JSON and no-key demo fallback.

## Phase 4: Wow-Level Builder Handoffs

Files:
- `src/lib/build-pack/generator.ts`
- `src/lib/build-pack/generator.test.ts`
- `src/lib/prompt-packs/default-packs.ts`
- `src/lib/prompt-packs/storage.ts`
- `src/components/forkfirst-redesign.tsx`

Plan:
- Pass brand answers into the generator and emit a real Brand/Product Voice section: name, audience, tone, color tokens, v1 avoid list, and copy guidance.
- Add a Repo Adaptation Matrix with rows for use as-is, adapt, study only, avoid copying, and verify first.
- Generate target-specific output:
  - Codex: `AGENTS.md` with scoped-edit and verification rules.
  - Claude Code: `CLAUDE.md` with explore/plan/verify and context-management rules.
  - Cursor: Project Rules style output, with file-level constraints.
  - Lovable: screen, data, and user-flow instructions rather than repo-agent prose.
- Move from one Markdown blob to a structured document map. Until actual zip packaging ships, label downloads as Markdown.
- Centralize prompt pack defaults and make packs target-aware.
- Add saved repos as secondary references in the handoff without replacing the primary foundation.

Tests:
- Brand answers appear in handoff and v1 avoid list.
- Missing license never appears under use-as-is/copy guidance.
- Per-target tests prove unique filenames and instructions.
- Prompt pack defaults come from one source and disabled packs are omitted.

## Phase 5: Verification Matrix

Required commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Rendered QA:

- Desktop landing, app, results, more, branding, ready, handoff, library, settings, prompt packs, trending.
- Mobile 390px and 320px: app, results, more, branding, drawer, ready, handoff.
- No horizontal overflow.
- No framework overlay.
- No console errors.
- Follow-up chat returns demo-mode answers without keys.
- Settings works with empty keys and does not persist when remember is off.
