# Implementation Notes

This is not the full implementation plan. It captures non-negotiable engineering notes for the build.

## Modules

- `github-provider`: GitHub API search and repository metadata fetching.
- `search-planner`: transforms user ideas into GitHub search queries.
- `repo-enrichment`: normalizes GitHub data into app repository records.
- `scoring-engine`: deterministic scoring for health, activity, license, docs, and fit.
- `ai-analyst`: verdicts, repo classifications, summaries, and explanation.
- `persistence`: SQLite access for research cases, idea checks, saved repos, and notes.
- `ui-shell`: Chat First, Radar Second interface.
- `discovery-radar`: readable research map showing the top repo, alternatives, and inferred build stack.

## Provider Boundaries

Keep external dependencies behind interfaces:

- GitHub provider should have real and fixture-backed implementations.
- AI analyst should have real OpenAI and deterministic demo implementations.
- Persistence should be isolated from UI components.

## Demo Mode

Demo mode is required.

When `OPENAI_API_KEY` is missing, the app should:

- Use deterministic query expansion.
- Use deterministic scoring.
- Return a plausible structured verdict from local rules.
- Clearly label the result as demo mode.

When `GITHUB_TOKEN` is missing, the app should:

- Use unauthenticated public GitHub API calls.
- Show a rate-limit warning.
- Continue to work for light usage.

## UI Guardrails

- Keep the central ask box prominent.
- Do not make the first screen a dashboard.
- Keep cards compact and scannable.
- Use acid green only for primary action and positive signal.
- Use amber for Already Exists, green for Forkable, violet/steel for Reference, red/coral for Gap/Risk.
- Avoid oversized marketing sections.
- Avoid decorative gradients or blobs that do not communicate product state.

## Testing Targets

- Search planner returns stable query variants.
- GitHub provider handles empty results and rate limits.
- Scoring engine handles stale, active, archived, and license-missing repos.
- AI analyst output parser handles malformed or missing model fields.
- SQLite persistence saves and reloads research cases, saved repos, and notes.
- UI renders without overlap at desktop, laptop, and phone widths.
