# ForkFirst Design

Date: 2026-05-12

## Product Summary

ForkFirst is a local/private pre-build intelligence workspace for builders. A user describes an idea, and the app checks public GitHub to determine whether the idea already exists, which repositories are closest, which are worth forking, which are useful references, and where an opportunity gap remains.

The core promise is: do not start from scratch blind.

## Target User

The first version is for a solo builder who wants to validate project ideas before committing time to implementation. The app should feel useful for vibe coders, indie hackers, and developers who often wonder whether a project already exists or whether there is a good repo to start from.

## V1 Scope

V1 is a local/private app. It searches public GitHub repositories, enriches candidates with public metadata, ranks them, explains the results, and lets the user save favorites and idea research locally.

V1 includes:

- A simplified ChatGPT-like interface with a prominent central ask box.
- Public GitHub repository search.
- Query expansion from the user's idea into useful GitHub searches.
- Candidate enrichment using repo metadata such as stars, forks, language, topics, license, last push, README availability, issue counts, and release activity when available.
- AI-assisted ranking and explanation.
- A clear verdict for the idea.
- Result categories: Already Exists, Forkable, Reference, Gap, and Risk.
- Saved local research cases, favorite repos, and notes.
- A Discovery Radar view that maps the user's idea to existing tools, forkable starters, references, and opportunity gaps.

V1 does not include:

- Public user accounts.
- Billing.
- Team workspaces.
- Private GitHub repository access.
- A full GitHub-wide vector index.
- Automated cloning or code execution.
- Broad web search outside GitHub.

## UX Direction

The layout is locked as Chat First, Radar Second.

The first impression should feel familiar and low-friction, similar to a simplified ChatGPT workflow. The user lands on a large central prompt:

> What do you want to build?

Below it, the app explains in compact supporting copy that it will check what exists, what to fork, and where the gap is. The primary action is Check Idea.

After a search, the answer view appears below the prompt. It includes a verdict, the best matching repos, evidence summaries, and the Discovery Radar.

The left rail contains recent idea checks and saved research cases. The right rail contains saved favorites, result modes, and later evidence controls. Rails should support the main workflow without making the interface feel like a generic dashboard.

## Visual Direction

The visual direction is Ink Circuit.

Ink Circuit uses:

- A black graphite base.
- Crisp near-white text.
- Acid green as the primary signal and action accent.
- Amber for Already Exists.
- Green for Forkable or strong positive signals.
- Violet or steel for Reference.
- Red or hot coral for Gap, Risk, or warning states.

The green accent should be used sparingly. The app should feel like a serious developer tool with a memorable signal layer, not a neon toy. The result should sit near the VS Code and GitHub developer world without copying either product.

## Core Workflow

1. The user enters an idea in the central ask box.
2. The app asks the model to turn the idea into search intents and GitHub query variants.
3. The GitHub search layer gathers candidate repositories.
4. The enrichment layer fetches metadata for top candidates.
5. The scoring layer computes initial quality and fit signals.
6. The AI ranking layer classifies and explains the result set.
7. The UI presents a verdict and grouped repos.
8. The user can save repos, add notes, compare candidates, or save the full idea check as a research case.

## Verdicts

The app should produce one of these verdicts:

- Already Exists: one or more mature projects closely match the idea.
- Use Existing: the best path is to adopt an existing tool rather than build.
- Fork Candidate Found: a repo is close enough and healthy enough to start from.
- Build Differentiated: similar projects exist, but the user's angle is meaningfully distinct.
- Open Gap: few or no credible matches exist.
- Needs More Research: results are weak, ambiguous, or rate-limited.

Each verdict must include short reasoning and cite the strongest evidence from the returned repos.

## Repository Categories

Each repo can be assigned one primary category:

- Already Exists: close match to the user's idea.
- Forkable: good starting point with enough quality/activity to build from.
- Reference: useful to study but not ideal to fork.
- Gap: evidence of missing capability or underserved angle.
- Risk: stale, unclear license, poor docs, or other warning signal.

## Data Model

Local storage should support:

- Idea checks: prompt, timestamp, generated queries, verdict, summary, and result IDs.
- Repositories: owner, name, URL, description, stars, forks, language, topics, license, pushed date, open issues, archived flag, homepage, README summary, and fetched timestamp.
- Saved repos: repo ID, research case ID, category, note, and saved timestamp.
- Research cases: name, description, created timestamp, updated timestamp.

SQLite is the V1 persistence layer. The app will use a local web stack with backend routes or server actions around SQLite.

## Architecture

The system should be divided into clear modules:

- UI shell: the Chat First, Radar Second interface.
- GitHub provider: GitHub API search and metadata fetching.
- Search planner: converts an idea into query variants.
- Enrichment pipeline: normalizes candidate repo metadata.
- Scoring engine: deterministic health and relevance signals.
- AI analyst: produces verdicts, explanations, categories, and summaries.
- Persistence layer: local saved research cases, saved repos, and notes.

The deterministic scoring layer should remain separate from the AI analyst so the app can explain which facts came from GitHub and which conclusions came from model reasoning.

The first implementation should use Next.js with TypeScript because it supports a polished local web UI and backend API routes in one project. The app should read optional environment variables for `GITHUB_TOKEN` and `OPENAI_API_KEY`. If `GITHUB_TOKEN` is missing, the app should still run with unauthenticated public GitHub search and clearly warn about lower rate limits. If `OPENAI_API_KEY` is missing, the app should still run in demo mode with deterministic mock verdicts so the interface can be tested.

## Error Handling

The app should handle:

- GitHub API rate limits with a clear message and partial results.
- Empty searches by broadening queries and explaining the fallback.
- Ambiguous ideas by returning a Needs More Research verdict and asking one clarifying question.
- Missing README/license data by marking the relevant evidence as unknown.
- AI failures by still showing raw GitHub candidates with deterministic scores.

## Cost Strategy

V1 should avoid indexing all of GitHub. It should use live GitHub search, enrich the top candidates, and use AI only for query planning, ranking, summarization, and verdict generation.

This keeps prototype costs low and lets the product validate the workflow before adding a custom index.

## Testing Strategy

Tests should cover:

- Search planner output shape.
- GitHub query construction.
- Metadata normalization.
- Scoring behavior for active, stale, archived, and license-missing repos.
- Verdict prompt/output parsing.
- Persistence for saved repos and research cases.

The UI should be verified manually across desktop sizes first. Before calling the frontend complete, the implementation should be opened in a browser and checked for layout fit, non-overlapping text, usable controls, and visual consistency with Ink Circuit.

## V1 Implementation Choices

- Framework: Next.js with TypeScript.
- Storage: local SQLite.
- GitHub access: optional `GITHUB_TOKEN`; unauthenticated fallback with rate-limit warning.
- AI access: optional `OPENAI_API_KEY`; demo-mode fallback when missing.
- AI integration: provider interface from the start, with a real OpenAI provider and a deterministic demo provider.
