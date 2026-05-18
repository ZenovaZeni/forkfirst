# Build Context

Use this file as the short briefing before implementing ForkFirst.

## Product

ForkFirst helps builders check whether an idea already exists before they build from scratch.

The user asks in natural language. The app searches GitHub, enriches repository candidates, ranks them, and returns a verdict with evidence.

## Locked Decisions

- V1 is local/private.
- Primary source is public GitHub.
- Starter base is Vercel Chatbot unless it proves too heavy.
- Framework is Next.js with TypeScript.
- UI layout is Chat First, Radar Second.
- Visual direction is Ink Circuit.
- Storage is local SQLite.
- `GITHUB_TOKEN` is optional.
- AI provider keys are optional. Groq is the default BYOK provider in the UI.
- Missing keys should not block the app; use warnings and demo-mode fallbacks.

## Core User Flow

1. User describes an idea in the prominent ask box.
2. Search planner creates GitHub query variants.
3. GitHub provider gathers candidates.
4. Enrichment pipeline fetches metadata.
5. Scoring engine computes deterministic health and fit signals.
6. AI analyst classifies results and produces a verdict.
7. UI shows verdict, grouped repos, evidence, and Discovery Radar.
8. User saves repos or the full idea check into a research case.

## Result Categories

- Already Exists
- Forkable
- Reference
- Gap
- Risk

## Verdicts

- Already Exists
- Use Existing
- Fork Candidate Found
- Build Differentiated
- Open Gap
- Needs More Research

## Product Quality Bar

The app must feel like a serious developer tool, not a generic SaaS dashboard.

The prompt box must be the main first impression. The Discovery Radar is the memorable answer view, not the initial obstacle.

Evidence should be clearly separated from model interpretation. GitHub facts and AI reasoning should not blur together.
