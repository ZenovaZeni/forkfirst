---
name: forkfirst-builder
description: "Build, modify, or review the ForkFirst product: a local/private GitHub idea-validation and repository-discovery app. Use when working on ForkFirst's Next.js chat interface, GitHub search/enrichment pipeline, repo scoring, AI verdicts, Discovery Radar, SQLite persistence, saved research cases, or Ink Circuit visual design."
---

# ForkFirst Builder

Use this skill when implementing or reviewing ForkFirst.

## Load First

Read these project files before implementation:

- `docs/superpowers/specs/2026-05-12-forkfirst-design.md`
- `docs/build-context.md`
- `docs/starter-repo-decision.md`
- `docs/implementation-notes.md`

## Product Shape

ForkFirst is a local/private pre-build intelligence workspace. It helps a builder determine whether an idea already exists on GitHub, which repos are closest, which are forkable, which are references, and where the opportunity gap remains.

## Locked UX

- Chat First, Radar Second.
- The central ask box is the main first impression.
- Discovery Radar appears as the visual answer view.
- Left rail contains recent checks and research cases.
- Right rail contains saved favorites, result modes, and evidence controls.

## Locked Visual Direction

Use Ink Circuit:

- Black graphite base.
- Crisp near-white text.
- Acid green for primary actions and strong positive signals.
- Amber for Already Exists.
- Green for Forkable.
- Violet or steel for Reference.
- Red or coral for Gap and Risk.

Keep green sparse. The app should feel like a serious developer tool near the VS Code/GitHub world, not a neon novelty UI.

## Architecture Rules

- Keep GitHub API access inside a GitHub provider module.
- Keep model calls inside an AI analyst provider module.
- Keep deterministic scoring separate from model reasoning.
- Keep SQLite persistence separate from UI components.
- Support demo mode when keys are missing.
- Prefer fixture-backed tests for provider behavior.

## Starter Repo Guidance

Prefer adapting Vercel Chatbot as the base if starting from a repository. Keep useful Next.js, AI SDK, shadcn/Tailwind, and chat UI patterns. Remove or disable unrelated public SaaS, auth, billing, artifact, or remote-storage assumptions for V1.

If the starter is heavier than useful, fall back to a fresh Next.js app with the same architecture.

## Completion Bar

Before calling work complete:

- Run available typecheck, lint, and tests.
- Start the app locally.
- Verify the UI in a browser.
- Check that the ask box is prominent and text does not overlap.
- Confirm missing `GITHUB_TOKEN` and missing `OPENAI_API_KEY` produce graceful fallback states.
