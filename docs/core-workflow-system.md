# ForkFirst Core Workflow System

ForkFirst should not behave like a repo search page with a chat box. The core product is a repeatable foundation workflow:

User idea -> repo evidence -> fit decision -> adaptation map -> builder handoff.

The user can talk naturally. The app decides whether the conversation needs normal advice, repo cards, comparison, a narrower search, or a Build Pack.

## Product Standard

ForkFirst succeeds when it gives the user a better result than blindly cloning a repo.

That means every recommendation must answer five questions:

1. What does the user actually want to build?
2. What does this repo already provide?
3. What should the builder keep from the repo?
4. What should the builder replace, remove, or build fresh?
5. What is the first finished product loop the builder should implement?

If ForkFirst cannot answer those with evidence, it should say the result is weak or adjacent instead of pretending.

## Workflow Stages

### 1. Conversation Intent

The chat should not need a brittle trigger-word library. It should classify each user message into intent using context:

- normal advice or nuance question
- new repo search
- refine current search
- explain one repo
- compare repos
- show repo details/cards
- save repo
- start handoff
- ask a clarifying question

Default response style is conversational: one to three short paragraphs. Use bullets only for comparisons, checklists, or action choices. Cards appear when the user asks for repos, comparisons, details, saved items, or a handoff.

### 2. Idea Intent

Convert the user's words into structured intent before searching:

- domain: grocery, booking, card collector, real estate leads, etc.
- target user
- critical capabilities
- optional capabilities
- platform/setup constraints
- risk words: scraping, private data, API keys, payments, children, healthcare, legal
- negative traps: words that can mean the wrong thing, such as `cat` as a Unix command instead of a pet app

This intent becomes the shared contract for search, scoring, chat copy, and Build Pack generation.

### 3. Query Ladder

Create a ladder of GitHub queries instead of one raw prompt query:

- direct product query
- feature/workflow query
- vertical/category query
- starter/template query
- reference or awesome-list query
- known repo query when the user names a repo

Use GitHub repository search qualifiers intentionally, especially `in:name,description,readme`. Keep query provenance so the UI can explain why a repo appeared.

### 4. Candidate Evidence

For each repo, normalize evidence into one shape:

- GitHub metadata: name, description, topics, stars, forks, issues, dates, license
- README evidence: setup, examples, API details, local development, license text, feature snippets
- repo kind: app, starter/template, library/tool, framework/SDK, directory/list, research resource, risk
- setup fit: web/hosted, Docker, mobile, local setup likely, OS-specific docs
- source query and matched terms

The app should rank evidence, not vibes.

### 5. Relevance Gates

Before scoring by popularity, apply hard gates:

- Direct domain match beats generic popularity.
- Directory/list repos can be useful, but label them as references.
- Libraries/tools should not be called complete products unless the idea asks for a library/tool.
- OS or setup clues should be visible in details, not crowd the main grid.
- Lexical traps must be penalized. Example: `cat id app` should not rank `sharkdp/bat`.
- Weak results should be presented as research leads, not fork targets.

### 6. Ranking And Recommendation

Rank candidates with both fit and usefulness:

- fit to the user's domain and critical workflow
- repo kind usefulness
- setup/readme quality
- license presence
- recency/activity
- popularity, but never as the main signal
- known risks and mismatch penalties

The top result should be explainable in one plain paragraph and one card. The card should show why to start there, what to watch out for, and the next move.

### 7. Alignment Map

Before generating Markdown, create an alignment map:

| Decision | Meaning |
|---|---|
| Keep | Repo feature directly helps the target product. |
| Replace | Repo code/pattern is useful, but domain copy, data, or UX must change. |
| Add | Product requirement missing from the repo. |
| Remove | Starter feature is unrelated or risky. |
| Defer | Useful later, but not part of the first product loop. |
| Inspect | Evidence is not strong enough yet. |

This prevents Build Packs from becoming generic clone instructions.

### 8. Build Pack IR

The Build Pack should be generated from structured intermediate data, not raw prose.

Minimum IR:

- original idea
- selected repo and runner-up repos
- product thesis
- target user
- first product loop
- repo evidence
- alignment decisions
- core screens
- core data objects
- user actions
- system states
- first milestone
- verification path
- license/reuse cautions
- open questions

Markdown and zip files are projections of that IR.

### 9. Quality Gates

Before export, ForkFirst should audit the handoff:

- no `PrimaryItem`, `UserInput`, or generic placeholder workflow
- domain-specific screens, actions, and data objects exist
- first milestone is product-specific
- selected repo appears in starter notes
- no license certainty claims
- no unsafe "copy this app" wording
- weak repo evidence is labeled weak

Blocking issues should show a clear modal, but the user can still export knowingly.

## AI Boundary

AI can improve the system, but it should not be the backbone.

Deterministic code owns:

- query ladder
- GitHub calls
- evidence normalization
- scoring and risk labels
- Build Pack schema
- security rules
- export quality gates

Optional BYOK AI can help with:

- ambiguous user intent
- natural chat wording
- repo comparison summaries
- alignment-map drafting from compact repo evidence
- better handoff prose

No-key mode must still search, rank, explain, and create a basic Build Pack.

## Launch Eval Harness

`npm run test:launch-evals` is the launch regression gate for the core workflow.

The first cases cover:

- Pokemon/card collector
- grocery app
- cleaning/service CRM
- salon booking
- realtor lead follow-up
- Shopify profit/inventory dashboard
- cat ID app
- kids sports schedules

Add a case every time a real user prompt exposes a failure. Do not rely only on screenshots or manual testing.

## Next Implementation Slices

1. Make chat intent/composer follow the conversational contract.
2. Introduce a typed `BuildPackIR` and alignment map before Markdown.
3. Feed compact README evidence into the alignment map.
4. Add optional AI drafting behind the deterministic IR.
5. Expand launch evals to 25-40 cases across risky launch categories.

## Launch Gate

Before claiming launch readiness:

```bash
npm run test:launch-evals
npm run lint
npm run typecheck
npm test
npm run build
```

