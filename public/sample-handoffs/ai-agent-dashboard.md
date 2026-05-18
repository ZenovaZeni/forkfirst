# ForkFirst Sample Handoff: AI Agent Dashboard

## Idea

Build a dashboard for monitoring AI agent runs: tasks, status, logs, cost estimates, outputs, and retry decisions.

## Repos Found

Sample generated from live GitHub Search API results checked on 2026-05-17. Re-check license and repo health before reuse.

1. `coding-by-feng/ai-agent-session-center` - real-time dashboard for AI coding agent sessions, including Claude Code, Gemini CLI, Codex, terminals, prompt history, tool logs, and queuing. License metadata was not present in GitHub search results.
2. `AyuskaSaha/RiskShield` - AI-powered multi-agent risk workflow with dashboards and copilot concepts. Useful as an adjacent agent-dashboard reference.
3. `ZealGoxix/SecureWatch` - threat-event dashboard with AI explanations and exports. Useful for log/event review patterns.

## Selected Starter Repo

`coding-by-feng/ai-agent-session-center`

```bash
git clone https://github.com/coding-by-feng/ai-agent-session-center.git agent-ops-console
cd agent-ops-console
npm install
npm run dev
```

## Builder Direction

Inspect the session-center repo first and use it as a strong reference for agent-session concepts. Keep the useful real-time session model, terminal/log views, and run history ideas. Adapt the product around agent runs, tools, model calls, costs, artifacts, and review decisions.

## Product Requirements

- List agent runs with status, owner, model/provider, duration, estimated cost, and last event.
- Detail view shows prompt, tool calls, logs, artifacts, and final result.
- Filter by status, model, project, and date.
- Mark runs as reviewed, retry, or archive.
- Keep provider keys out of logs and exported artifacts.

## Brand

Operational, trustworthy, dense but readable. This should feel like a control room for builders, not a marketing analytics dashboard.

## Builder Instructions

- Start by mapping existing dashboard routes/components.
- Preserve working UI primitives and table interactions.
- Add fake fixture data first, then wire real adapters.
- Treat logs and prompts as sensitive data.
- Add redaction helpers before adding export.

## First Milestone

User can inspect a list of agent runs, open one run, review logs/artifacts, and mark it reviewed.
