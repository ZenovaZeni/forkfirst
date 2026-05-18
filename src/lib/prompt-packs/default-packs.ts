export type PromptPack = {
  id: string;
  name: string;
  blurb: string;
  source: "default" | "custom";
  content: string;
};

export const DEFAULT_PROMPT_PACKS: PromptPack[] = [
  {
    id: "repo-orientation",
    name: "Repo Orientation",
    blurb: "Make the builder understand the starter repo before editing it.",
    source: "default",
    content: `## Repo Orientation - Builder Guidance

Understand the selected starter repo before changing it.

- Start by mapping the repo structure, major modules, data models, build commands, test commands, and app entrypoints.
- Use the repo's existing terminology instead of inventing new names.
- Identify the files most relevant to the requested product before proposing changes.
- Trace important flows end to end, such as UI to API to persistence.
- Search for the closest existing implementation before adding a new component, helper, route, or service.
- Summarize assumptions and open questions before editing if missing information could change the implementation direction.`,
  },
  {
    id: "plan-then-edit",
    name: "Plan Then Edit",
    blurb: "Use a short plan for multi-file or high-risk changes before coding.",
    source: "default",
    content: `## Plan Then Edit - Builder Guidance

Do not jump straight into broad edits when the task needs thought.

- For non-trivial work, inspect the relevant files first and produce a short implementation plan.
- Name the files likely to change, the behavior being changed, the risks, and the verification steps.
- Keep the plan scoped to the requested outcome; do not expand the product without permission.
- Prefer small, reviewable increments over broad rewrites.
- Call out migrations, dependency additions, destructive commands, or security-sensitive changes before doing them.
- Once the plan is approved or clearly implied, execute it directly and verify each meaningful step.`,
  },
  {
    id: "karpathy-mvp",
    name: "Karpathy MVP Rules",
    blurb: "Build the simplest thing that can honestly prove the idea.",
    source: "default",
    content: `## Karpathy MVP Rules - Builder Guidance

Keep every change small, surgical, and directly traceable to the user's goal.

- Think before coding. List assumptions and ask the builder to verify them before writing risky code.
- Simplicity first. If 200 lines could be 50, rewrite it smaller.
- Surgical changes only. Every changed line must support the user's requested product, not a side quest.
- Replace vague verbs with checkable criteria: "add export" becomes "export the current list as CSV and test the downloaded columns."
- Edit before regenerating. If most of the output is right, fix the wrong part instead of rewriting the whole file.
- Skip premature abstraction. Ship a useful first version, then optimize once real usage shows what matters.`,
  },
  {
    id: "indie-hacker-mvp",
    name: "Indie Hacker MVP",
    blurb: "Solo-founder discipline: small, useful, fast, and revenue-aware.",
    source: "default",
    content: `## Indie Hacker MVP - Builder Guidance

Speed and usefulness beat impressive architecture.

- Build the smallest coherent user journey first.
- Avoid team-scale systems, complex permissions, analytics, and admin surfaces unless the user asked for them.
- Prefer one working vertical slice over many unfinished screens.
- Use simple copy, simple data models, and clear calls to action.
- Make the app easy to deploy and easy to explain.
- Leave follow-up ideas in the plan, not half-built in the code.`,
  },
  {
    id: "incremental-mvp",
    name: "Incremental MVP",
    blurb: "Break big product builds into vertical slices users can actually try.",
    source: "default",
    content: `## Incremental MVP - Builder Guidance

Turn the idea into a sequence of usable milestones.

- Implement the core user journey before secondary features.
- Break the first build into UI shell, data model, core behavior, persistence, and polish.
- Verify the app still runs after each milestone.
- Save auth, payments, analytics, admin, automation, and onboarding for later unless essential to the first use case.
- Keep tasks outcome-oriented rather than technology-first.
- End with a next-build checklist that a human or AI builder can continue from.`,
  },
  {
    id: "existing-patterns",
    name: "Existing Patterns",
    blurb: "Force the builder to reuse the repo's conventions instead of inventing new ones.",
    source: "default",
    content: `## Existing Patterns - Builder Guidance

The starter repo is the foundation. Respect it.

- Match the repo's framework, routing style, file layout, naming, styling, and test conventions.
- Reuse existing helpers, components, services, schemas, API clients, and state patterns before adding new abstractions.
- Follow the repo's package manager and documented scripts.
- Add dependencies only when no reasonable local option exists.
- Place new code near related code unless the architecture clearly says otherwise.
- If a new abstraction is necessary, explain why the existing pattern does not fit.`,
  },
  {
    id: "ai-edit-over-generate",
    name: "Edit Over Generate",
    blurb: "Stop regenerating from scratch. Edit what works and preserve context.",
    source: "default",
    content: `## Edit Over Generate - Builder Guidance

Editing is cheaper and safer than regenerating.

- Never regenerate a whole file when a targeted patch would work.
- If 80 percent is right, edit the wrong 20 percent.
- Avoid paste-from-scratch rewrites unless the structure is fundamentally wrong.
- Keep existing behavior intact unless the user asked to change it.
- Make one feature work, test it, then move to the next.
- When context is bloated, summarize decisions and continue with a smaller, clearer task.`,
  },
  {
    id: "anti-overbuild",
    name: "Anti-Overbuild",
    blurb: "Stop AI builders from adding frameworks, screens, and edge cases nobody asked for.",
    source: "default",
    content: `## Anti-Overbuild - Builder Guidance

Solve the product in front of you, not the imaginary enterprise version.

- Implement only the stated behavior and the minimum surrounding pieces required for it to work.
- Avoid new dependencies, services, queues, auth systems, or databases unless they are necessary.
- List explicit non-goals before building large features.
- Delete speculative scaffolding, fake settings, and dead navigation before finishing.
- Keep configuration boring and discoverable.
- Prefer a small honest limitation over a complicated fake completeness story.`,
  },
  {
    id: "test-first-verification",
    name: "Test-First Verification",
    blurb: "Make the builder prove the change with the repo's own checks.",
    source: "default",
    content: `## Test-First Verification - Builder Guidance

Every meaningful change needs proof.

- Identify relevant existing tests before adding new ones.
- Add or update tests for changed behavior, edge cases, and failure paths.
- Match existing test style, fixtures, and assertion patterns.
- Run the narrowest useful test first, then broader checks when risk warrants it.
- If a check cannot run, explain why and name what remains unverified.
- Never hide, weaken, or delete tests to make the build look green.`,
  },
  {
    id: "no-silent-success",
    name: "No Silent Success",
    blurb: "Prevent fake green states, swallowed errors, and demo data pretending to be real.",
    source: "default",
    content: `## No Silent Success - Builder Guidance

The app must not pretend something worked when it did not.

- Do not swallow exceptions or replace failures with success-shaped UI.
- Label sample, mock, and demo data clearly.
- Surface failed API calls, invalid credentials, empty results, and partial exports honestly.
- Avoid broad catch blocks unless they preserve useful error information.
- Verification must exercise real behavior, not just render the happy path.
- If a provider or integration is unavailable, show a truthful fallback and setup note.`,
  },
  {
    id: "code-review-before-done",
    name: "Code Review Before Done",
    blurb: "Make the builder review its own diff for bugs, regressions, and missing tests.",
    source: "default",
    content: `## Code Review Before Done - Builder Guidance

Before calling work finished, review it like a skeptical maintainer.

- Compare the final diff against the original goal and implementation plan.
- Prioritize bugs, regressions, missing tests, security problems, accessibility issues, and scope creep.
- Cite exact files and lines for any concern.
- If no issues are found, say that clearly and name remaining risks.
- Do not bury findings under a cheerful summary.
- Confirm that unrelated user changes were preserved.`,
  },
  {
    id: "frontend-design-fidelity",
    name: "Frontend Design Fidelity",
    blurb: "Push builders toward polished, consistent, non-generic UI.",
    source: "default",
    content: `## Frontend Design Fidelity - Builder Guidance

Build UI that looks intentional, not generated.

- Inspect existing components, design tokens, typography, spacing, color, and interaction patterns before creating UI.
- Use screenshots, mockups, or product references as visual requirements when provided.
- Preserve the app's visual language unless the user explicitly asks for a new direction.
- Build responsive states for mobile and desktop.
- Check empty, loading, error, hover, focus, and disabled states.
- Use screenshots or browser verification for visual changes when practical.`,
  },
  {
    id: "mobile-first-polish",
    name: "Mobile-First Polish",
    blurb: "Make mobile, foldables, touch targets, and small screens first-class.",
    source: "default",
    content: `## Mobile-First Polish - Builder Guidance

The product must work comfortably on small screens.

- Design primary flows for mobile and desktop, not desktop only.
- Use touch targets large enough for thumbs and spacing that does not crowd screen edges.
- Account for safe areas, sticky nav, keyboards, long text, and narrow foldable cover screens.
- Avoid hover-only interactions for required actions.
- Test at least one narrow mobile viewport and one desktop viewport for UI work.
- Keep navigation reachable without blocking content.`,
  },
  {
    id: "dashboard-analytics",
    name: "Dashboard Analytics",
    blurb: "For dashboards, admin tools, CRMs, trackers, and operational apps.",
    source: "default",
    content: `## Dashboard Analytics - Builder Guidance

Operational tools should be dense, scannable, and calm.

- Prioritize tables, filters, search, status, bulk actions, and comparison over marketing-style hero sections.
- Define the core metrics and the decisions each metric supports.
- Include empty states, loading states, and error states for every data surface.
- Keep charts readable and label units clearly.
- Preserve keyboard and screen-reader access for forms, filters, and tables.
- Make repeated workflows faster than one-off exploration.`,
  },
  {
    id: "local-first-apps",
    name: "Local-First Apps",
    blurb: "For personal tools, note apps, trackers, offline-first utilities, and BYOD data.",
    source: "default",
    content: `## Local-First Apps - Builder Guidance

Favor user-owned data and offline-friendly behavior.

- Store user data locally first when the product does not require server sync.
- Provide import, export, and backup paths for important user data.
- Clearly document what touches the network and what stays on device.
- Avoid accounts for the minimum viable version unless cross-device sync is essential.
- Preserve privacy in logs, analytics, and error reporting.
- Make data migration and reset behavior explicit.`,
  },
  {
    id: "byok-secrets",
    name: "BYOK Secrets",
    blurb: "For apps where users bring API keys, tokens, webhooks, or provider credentials.",
    source: "default",
    content: `## BYOK Secrets - Builder Guidance

Treat user-provided keys as sensitive from the first line of code.

- Never hardcode API keys, tokens, or user secrets.
- Keep server-only secrets out of browser bundles.
- Use environment variables or session-only browser storage as appropriate, and document the tradeoff.
- Preserve a demo or no-key path when feasible.
- Do not log secrets, full request bodies containing secrets, or sensitive auth headers.
- Add clear setup notes, missing-key errors, and provider-bound request explanations.`,
  },
  {
    id: "privacy-first-patterns",
    name: "Privacy-First Patterns",
    blurb: "Limit collection, avoid accounts by default, and explain data flow honestly.",
    source: "default",
    content: `## Privacy-First Patterns - Builder Guidance

Default to storing less and explaining more.

- Do not add tracking, telemetry, or analytics without explicit product need and disclosure.
- Avoid accounts until the product truly needs identity, sync, billing, or collaboration.
- Keep sensitive temporary values in session storage when persistence is not required.
- Document what is stored locally, what is sent to a server, and what goes to third-party providers.
- Scrub secrets and personal data from logs and error messages.
- Do not promise "100 percent safe" or "never leaves your browser" unless the architecture truly proves it.`,
  },
  {
    id: "security-boundary",
    name: "Security Boundary",
    blurb: "For auth, payments, files, API keys, admin features, and destructive actions.",
    source: "default",
    content: `## Security Boundary - Builder Guidance

Security-sensitive work needs explicit guardrails.

- Never run destructive commands, delete data, rotate credentials, or alter production systems without explicit approval.
- Treat authentication, authorization, payments, file uploads, and admin actions as high-risk surfaces.
- Validate inputs at trust boundaries and fail closed.
- Keep secrets out of client code, logs, telemetry, and generated docs.
- Add abuse, rate-limit, and permission notes when exposing public endpoints.
- End with a short security review and residual-risk list.`,
  },
  {
    id: "ai-agent-product",
    name: "AI Agent Product",
    blurb: "For apps with tools, agents, workflows, memory, or automation.",
    source: "default",
    content: `## AI Agent Product - Builder Guidance

Agent products need controlled autonomy, not one giant prompt.

- Define each agent role, tool permission, memory rule, and handoff point.
- Keep prompts short and move detailed knowledge into retrievable references or skills.
- Add audit logs for tool calls, user approvals, and externally visible actions.
- Include cost controls, retry limits, timeouts, and failure states.
- Separate planning, execution, review, and reporting loops when the task is complex.
- Make it clear when the user is talking to an AI versus normal app logic.`,
  },
  {
    id: "context-budget",
    name: "Context Budget",
    blurb: "Keep agent context useful without dumping giant docs into every handoff.",
    source: "default",
    content: `## Context Budget - Builder Guidance

Use context deliberately so the builder does not drown.

- Separate product intent, repo facts, user decisions, and implementation constraints.
- Reference exact files, errors, screenshots, tickets, or logs when available.
- Summarize long documents into task-relevant facts.
- Keep root instruction files short; link deeper references only when needed.
- Preserve durable decisions in AGENTS.md, CLAUDE.md, or tool-specific rules files.
- Remove stale assumptions when the product direction changes.`,
  },
  {
    id: "persistent-instructions",
    name: "Persistent Instructions",
    blurb: "Generate clean AGENTS, CLAUDE, Cursor, Replit, and builder instruction files.",
    source: "default",
    content: `## Persistent Instructions - Builder Guidance

The handoff should be easy for any coding agent to resume.

- Keep project instructions concise, specific, and actionable.
- Include setup commands, build commands, test commands, architecture notes, and coding conventions.
- Separate global preferences from project-specific rules.
- Use scoped or nested instructions only when parts of the repo need different rules.
- Avoid vague guidance like "write clean code"; give concrete behaviors instead.
- Do not duplicate divergent instructions across AGENTS.md, CLAUDE.md, Cursor rules, or Replit notes.`,
  },
  {
    id: "design-system-handoff",
    name: "Design System Handoff",
    blurb: "Give builders brand, UI, motion, and component rules they can actually use.",
    source: "default",
    content: `## Design System Handoff - Builder Guidance

Make the visual direction concrete enough to build.

- Define the product personality, audience, brand words, and anti-brand words.
- Specify typography, color, spacing, radius, icons, components, and motion rules.
- Include examples of what the app should and should not feel like.
- Map design decisions to implementation tokens when the repo has them.
- Keep accessibility and contrast as requirements, not polish.
- Update DESIGN.md or equivalent docs when the visual system changes.`,
  },
  {
    id: "saas-app-starter",
    name: "SaaS App Starter",
    blurb: "For B2B tools, subscriptions, teams, billing, roles, and production apps.",
    source: "default",
    content: `## SaaS App Starter - Builder Guidance

Build SaaS foundations deliberately, not accidentally.

- Define the core account, user, team, role, and billing assumptions before implementation.
- Separate public marketing surfaces from authenticated product surfaces.
- Document required environment variables and provider setup.
- Keep authorization checks close to data access and server actions.
- Add onboarding, empty states, and upgrade boundaries only where they support the first workflow.
- Do not fake billing, auth, or admin features; mark placeholders clearly.`,
  },
  {
    id: "build-pack-from-repo",
    name: "Build Pack From Repo",
    blurb: "Turn the selected starter repo into concrete PRD, plan, repo notes, and agent rules.",
    source: "default",
    content: `## Build Pack From Repo - Builder Guidance

The selected repo is evidence and foundation, not a license guarantee.

- Extract architecture, reusable concepts, integration points, constraints, and risky assumptions from the starter repo.
- Name exactly what to clone, what to study, what to replace, and what to avoid.
- Use advisory license language only: inspect, confirm, verify, and review before reuse.
- Turn findings into PRD, build plan, starter repo notes, design direction, and agent instructions.
- Highlight what should be reused conceptually versus copied directly.
- Tell the builder to open the cloned starter repo before creating new files elsewhere.`,
  },
  {
    id: "production-handoff",
    name: "Production Handoff",
    blurb: "Leave the next AI builder or human with setup, risks, and continuation notes.",
    source: "default",
    content: `## Production Handoff - Builder Guidance

Finish with a handoff someone else can trust.

- Leave a short implementation summary with changed files and rationale.
- Document setup, environment variables, run commands, and test commands.
- Mention known limitations, TODOs, and unverified assumptions.
- Include deployment notes only for the repo's actual target platform.
- Avoid claiming security, license, or production readiness beyond what was verified.
- Keep the final handoff in clear Markdown so another AI agent or human can resume cleanly.`,
  },
];
