# Handoff Blueprint Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ForkFirst Build Packs reliably better than cloning a repo by turning the user idea, chat context, selected repo evidence, README evidence, and optional wizard answers into one concrete, product-specific builder blueprint.

**Architecture:** Move the Build Pack generator from keyword-profile prose to a normalized `HandoffBlueprint` model. Prepare selected repo evidence before export, then render each document from the same blueprint and evidence object. Keep no-key/demo mode useful: this must be deterministic and testable without adding a required LLM call.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, existing GitHub REST/README helpers, existing local-first UI state, existing Markdown/ZIP export path.

---

## Why This Plan Exists

The exported Pokemon collector pack proved the core failure mode:

- ForkFirst found a relevant repo, but the generated PRD still sounded generic.
- Product specificity depended too much on `result.prompt`.
- Repo evidence stayed in `REPO_STARTER_NOTES.md` instead of shaping the PRD and build plan.
- Skipping wizard questions made the output much weaker than it should be.
- Saved/stale handoffs can hide improvements in repo evidence or generator logic.

The launch bar is: if a user gives a rough idea and does not answer every question, ForkFirst should still produce a useful first build direction from the idea and selected repo evidence.

---

## File Structure

- Create: `src/lib/build-pack/blueprint.ts`
  - Defines the normalized handoff model and deterministic blueprint builder.
- Create: `src/lib/build-pack/blueprint.test.ts`
  - Tests product specificity from prompt, selected repo, README, queries, chat context, and wizard answers.
- Modify: `src/lib/build-pack/generator.ts`
  - Uses `HandoffBlueprint` instead of direct `productProfileFor()` sections.
  - Renders richer `STARTER_REPO`, `PRD`, `BUILD_PLAN`, `REPO_STARTER_NOTES`, and agent docs.
- Modify: `src/lib/build-pack/generator.test.ts`
  - Adds section-scoped regressions for Pokemon/card collector, generic app, generic wizard overrides, and prompt-pack compaction.
- Modify: `src/lib/github/types.ts`
  - Extends README analysis with optional structured evidence and fetch status.
- Modify: `src/lib/github/readme.ts`
  - Extracts setup/dev/test/API/license snippets and typed fetch status.
- Create: `src/lib/repo-evidence/prepare.ts`
  - Ensures the selected repo has fresh evidence before handoff generation.
- Create: `src/lib/repo-evidence/prepare.test.ts`
  - Tests evidence preparation without live GitHub calls.
- Create: `src/app/api/repo-evidence/route.ts`
  - Lets the client refresh selected repo evidence before exporting.
- Modify: `src/components/forkfirst-redesign.tsx`
  - Makes handoff generation evidence-aware and async when needed.
  - Prevents generic placeholders from weakening the Build Pack.
  - Marks saved markdown as a snapshot and offers regeneration when evidence/schema changes.
- Modify: `src/components/prompt-packs-panel.tsx`
  - Clarifies that prompt packs become compact builder rules, not raw PRD filler.

---

## Core Design

### The New Source Of Truth

Create a durable blueprint shape:

```ts
export type ProductKind =
  | "card-collector"
  | "repo-discovery"
  | "real-estate-tool"
  | "voice-tool"
  | "project-management"
  | "knowledge-base"
  | "developer-tool"
  | "workflow-app"
  | "marketplace"
  | "unknown-app";

export type HandoffBlueprint = {
  productKind: ProductKind;
  confidence: number;
  productThesis: string;
  targetUserSegment: string;
  jobToBeDone: string;
  currentAlternatives: string[];
  differentiatedWedge: string;
  primaryWorkflow: string[];
  keyScreens: string[];
  coreDataObjects: string[];
  userActions: string[];
  systemStates: {
    empty: string;
    loading: string;
    error: string;
    noResult: string;
    partialSuccess: string;
  };
  mvpRequirements: string[];
  explicitNonGoals: string[];
  trustPrivacySafety: string[];
  firstMilestone: string;
  successMetrics: string[];
  wowDemoScript: string[];
  inferredFrom: string[];
};
```

Everything rendered in the Build Pack should come from this blueprint plus repo evidence. Domain profiles become enrichers, not the whole product brain.

### Blueprint Signal Input

The blueprint must classify from the richest available signal, while still displaying the original idea honestly:

```ts
export type HandoffSignalInput = {
  originalIdea: string;
  researchContext?: string | null;
  chatContext?: string | null;
  queries: string[];
  selectedRepo?: BuildPackRepo;
  candidateRepos: BuildPackRepo[];
  preferences?: BuildPackPreferences;
};
```

The product kind should use:

- original prompt
- follow-up/chat context
- selected repo full name, description, topics, README excerpt
- query list/refinement
- non-generic wizard answers

The output should not depend on one fragile regex against `result.prompt`.

### Wizard Rule

Wizard answers can sharpen a blueprint, but they cannot replace a strong domain blueprint with generic placeholder copy.

Generic strings to ignore as overrides:

```ts
const GENERIC_WIZARD_COPY = [
  /turn the selected repo into the user'?s product idea/i,
  /clone the repo, inspect the core flows/i,
  /target user from the idea/i,
  /your app/i,
  /untitled app/i
];
```

---

## Task 1: Add The Blueprint Model

**Files:**
- Create: `src/lib/build-pack/blueprint.ts`
- Create: `src/lib/build-pack/blueprint.test.ts`

- [ ] **Step 1: Write section-specific blueprint tests**

Create `src/lib/build-pack/blueprint.test.ts` with:

```ts
import { describe, expect, test } from "vitest";
import { buildHandoffBlueprint } from "./blueprint";
import type { IdeaCheckResult } from "@/types/idea-check";

function repo(overrides = {}) {
  return {
    id: 1,
    owner: "Git-Romer",
    name: "pokecollector",
    fullName: "Git-Romer/pokecollector",
    url: "https://github.com/Git-Romer/pokecollector",
    description: "Pokemon TCG collection manager with pricing, binders, wishlist, scanner, backup, and exports.",
    language: "TypeScript",
    topics: ["pokemon", "tcg", "collection", "pricing"],
    stars: 18,
    forks: 8,
    openIssues: 0,
    license: "AGPL-3.0",
    pushedAt: "2026-05-20T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-05-20T00:00:00Z",
    archived: false,
    homepage: "https://pokecollector.romerg.de",
    category: "forkable",
    score: { total: 61, fit: 31, activity: 100, popularity: 42, license: 100, docs: 54, reasons: [] },
    readme: {
      excerpt: "Card search, collection management, binders, wishlist, TCGdex sync, Cardmarket/TCGPlayer pricing, CSV/PDF export, backup/restore, analytics, scanner, FastAPI, React, Postgres, Docker.",
      url: "https://github.com/Git-Romer/pokecollector#readme",
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 95,
      reasons: ["README explains setup", "README includes examples"]
    },
    ...overrides
  } as IdeaCheckResult["repos"][number];
}

describe("handoff blueprint", () => {
  test("uses selected repo evidence when the prompt alone is too broad", () => {
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want something like Pokemon Collectors for my wife, but with our own look.",
      researchContext: null,
      chatContext: null,
      queries: ["pokemon tcg collection manager in:name,description,readme"],
      selectedRepo: repo(),
      candidateRepos: [repo()],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("card-collector");
    expect(blueprint.productThesis).toMatch(/card|collector|collection/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/search.*card|card.*search/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/binder|album|vault/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/card|collection|condition|price/i);
    expect(blueprint.firstMilestone).toMatch(/search.*card|card.*search/i);
  });

  test("ignores generic wizard placeholders that would weaken a specific blueprint", () => {
    const blueprint = buildHandoffBlueprint({
      originalIdea: "Pokemon card value tracker and collector album.",
      researchContext: null,
      chatContext: null,
      queries: [],
      selectedRepo: repo(),
      candidateRepos: [repo()],
      preferences: {
        productName: "Untitled app",
        productGoal: "Turn the selected repo into the user's product idea.",
        audience: "the target user from the idea",
        firstMilestone: "Clone the repo, inspect the core flows, and ship the smallest useful workflow."
      }
    });

    expect(blueprint.productThesis).not.toMatch(/turn the selected repo/i);
    expect(blueprint.targetUserSegment).not.toMatch(/target user from the idea/i);
    expect(blueprint.firstMilestone).not.toMatch(/clone the repo/i);
    expect(blueprint.productThesis).toMatch(/card|collector/i);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- src/lib/build-pack/blueprint.test.ts
```

Expected: FAIL because `blueprint.ts` does not exist.

- [ ] **Step 3: Implement the minimal blueprint module**

Create `src/lib/build-pack/blueprint.ts` with the exported types above and:

```ts
import type { IdeaCheckResult } from "@/types/idea-check";
import type { BuildPackPreferences } from "./generator";

type BuildPackRepo = IdeaCheckResult["repos"][number];

function textFrom(input: HandoffSignalInput): string {
  const repo = input.selectedRepo;
  return [
    input.originalIdea,
    input.researchContext,
    input.chatContext,
    ...input.queries,
    repo?.fullName,
    repo?.description,
    repo?.topics.join(" "),
    repo?.readme?.excerpt
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isGenericPreference(value: unknown): boolean {
  if (typeof value !== "string") return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return GENERIC_WIZARD_COPY.some((pattern) => pattern.test(trimmed));
}

function stringPreference(preferences: BuildPackPreferences | undefined, key: string): string | null {
  const value = preferences?.[key];
  return isGenericPreference(value) ? null : String(value).trim();
}

function cardCollectorBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  return {
    productKind: "card-collector",
    confidence: 86,
    productThesis: `${name ? `${name} should` : "The product should"} help collectors search cards, save a personal collection, organize cards into albums or binders, and understand estimated collection value without copying another collector app's brand.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? "A casual or serious Pokemon/trading-card collector who wants to know what they own, where it is, and what it may be worth.",
    jobToBeDone: "When I look through my cards, I want to identify each card, save condition and quantity, see an estimated value, and organize it into a collection I can trust and export.",
    currentAlternatives: ["Pokemon Collector-style apps", "TCGPlayer/Cardmarket lookups", "spreadsheets", "binder checklists", "manual eBay/PriceCharting searches"],
    differentiatedWedge: "Use the open-source foundation for working collection mechanics, then rebrand and simplify around one private collector loop with clear value-estimate language and strong backup/export.",
    primaryWorkflow: [
      "User searches for a card by name, set, number, or keyword.",
      "User opens a card detail/value view with image, set, rarity, variant, source, and estimated value when available.",
      "User saves the card with condition, quantity, purchase price, notes, and binder or album location.",
      "User views the collection as a searchable vault/album with filters and total estimated value.",
      "User exports or backs up the collection before relying on it for real inventory."
    ],
    keyScreens: ["Search/catalog", "Card detail/value", "Add/edit owned card", "Collection vault/album", "Wishlist", "Export/backup", "Settings/data source"],
    coreDataObjects: ["Card", "Set", "OwnedCard", "Condition", "Variant", "BinderOrAlbum", "WishlistItem", "PriceSnapshot", "BackupExport"],
    userActions: ["search cards", "add to collection", "edit condition/quantity", "group in album", "mark wishlist", "view total value", "export backup"],
    systemStates: {
      empty: "No cards saved yet; show a search-first empty state and sample card guidance.",
      loading: "Searching card data or refreshing prices; keep the current collection visible.",
      error: "Card data or pricing source failed; explain what did not load and allow retry/manual entry.",
      noResult: "No exact card match; offer set/number tips and manual card entry.",
      partialSuccess: "Card saved but value unavailable; keep it in the collection and label price as missing."
    },
    mvpRequirements: [
      "Card search with no-result and manual-entry fallback.",
      "Card detail/value view with estimated-price wording.",
      "Owned-card save flow for condition, quantity, purchase price, notes, and album/binder location.",
      "Collection vault with filters and total estimated value.",
      "CSV/JSON export or backup path."
    ],
    explicitNonGoals: [
      "Do not copy Pokemon Collector's product UI, name, app icon, screenshots, or store positioning.",
      "Do not use official Pokemon branding or protected assets unless rights and provider terms allow it.",
      "Do not build marketplace selling, trading, escrow, social feeds, or native mobile apps in v1.",
      "Do not present estimated values as guaranteed resale prices."
    ],
    trustPrivacySafety: [
      "Confirm AGPL/license obligations before copying code into a closed or hosted product.",
      "Confirm TCGdex, TCGPlayer, Cardmarket, image, and pricing data terms before caching or commercial use.",
      "Label all prices as estimates with source/date when possible.",
      "Give users export/backup so local collection data is not trapped."
    ],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the collector loop: search for a card, open details, save it with condition and quantity, see it in a vault/album, show total estimated collection value, and export or back up the data.",
    successMetrics: [
      "A collector can add three real cards in under two minutes.",
      "Saved collection data survives refresh and exports correctly.",
      "The UI clearly distinguishes estimated value from guaranteed sale price.",
      "The product looks original and does not feel like a copied app."
    ],
    wowDemoScript: [
      "Search for a recognizable sample card.",
      "Open the detail/value view and show estimated value with source/date language.",
      "Add the card to a binder with condition and quantity.",
      "Show the collection total update.",
      "Export or back up the collection."
    ],
    inferredFrom: ["user idea", "selected repo metadata", "README evidence", "search queries"]
  };
}

export function buildHandoffBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const signal = textFrom(input);
  if (/\b(pokemon|pok[eé]mon|tcg|trading[-\s]?card|card collector|card collection|collector album|card binder|card value|tcgdex|tcgplayer|cardmarket)\b/i.test(signal)) {
    return cardCollectorBlueprint(input);
  }
  return genericWorkflowBlueprint(input);
}
```

Also implement `genericWorkflowBlueprint(input)` with the same shape but concrete, not placeholder:

```ts
function genericWorkflowBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  const repo = input.selectedRepo;
  return {
    productKind: "workflow-app",
    confidence: 45,
    productThesis: stringPreference(input.preferences, "productGoal") ?? `${name || "The app"} should turn the user's idea into one working product loop, using ${repo?.fullName ?? "the selected repo"} only where its setup, data model, routes, or UI patterns genuinely help.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? "The most specific user implied by the idea; refine this during repo inspection instead of building for everyone.",
    jobToBeDone: "Complete one painful workflow from input to useful saved output.",
    currentAlternatives: ["manual spreadsheets", "generic SaaS tools", "custom scripts", "existing apps found during repo research"],
    differentiatedWedge: "Start from working code, remove unrelated assumptions, and ship the user's narrow workflow faster than a blank scaffold.",
    primaryWorkflow: [
      "User starts the primary task from a clear first screen.",
      "User enters or selects the minimum information required.",
      "System produces the useful result, record, or decision.",
      "User reviews and edits the result.",
      "User saves, exports, or revisits the result."
    ],
    keyScreens: ["Start/new item", "Result/detail", "Saved library", "Settings/data", "Export/share"],
    coreDataObjects: ["UserInput", "Result", "SavedItem", "Settings", "Export"],
    userActions: ["create", "review", "edit", "save", "export", "delete"],
    systemStates: {
      empty: "No saved items; guide the user into the first task.",
      loading: "Primary task is running; show clear progress.",
      error: "Task failed; preserve input and explain retry/recovery.",
      noResult: "No useful result; suggest narrower input or alternate path.",
      partialSuccess: "Some useful data exists; let the user save it and continue."
    },
    mvpRequirements: ["One primary task", "One useful result/detail surface", "Save/revisit", "Export/backup", "Empty/loading/error/no-result states"],
    explicitNonGoals: ["No broad admin system", "No team/billing unless the idea requires it", "No unrelated starter features", "No copied assets or license-unclear code"],
    trustPrivacySafety: ["Document what data is stored", "Check license before reuse", "Keep secrets out of client/logs", "Avoid claims that were not verified"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the smallest vertical slice: create the main item, produce the useful result, save it, and export it.",
    successMetrics: ["A new user completes the primary workflow without setup help", "The result survives refresh", "The repo reuse decision is documented"],
    wowDemoScript: ["Start from empty state", "Complete primary workflow", "Save result", "Export or revisit result"],
    inferredFrom: ["fallback blueprint", repo ? "selected repo metadata" : "user idea"]
  };
}
```

- [ ] **Step 4: Run blueprint tests**

Run:

```bash
npm test -- src/lib/build-pack/blueprint.test.ts
```

Expected: PASS.

---

## Task 2: Make README Evidence Durable

**Files:**
- Modify: `src/lib/github/types.ts`
- Modify: `src/lib/github/readme.ts`
- Create: `src/lib/repo-evidence/prepare.ts`
- Create: `src/lib/repo-evidence/prepare.test.ts`

- [ ] **Step 1: Extend README types**

In `src/lib/github/types.ts`, add:

```ts
export type ReadmeEvidence = {
  fetchStatus: "ok" | "missing" | "rate_limited" | "error";
  fetchedAt: string | null;
  setupSnippets: string[];
  commandSnippets: string[];
  featureSnippets: string[];
  integrationSnippets: string[];
  licenseSnippets: string[];
};
```

Then add to `ReadmeAnalysis`:

```ts
evidence?: ReadmeEvidence;
```

- [ ] **Step 2: Extract snippets in README analysis**

In `src/lib/github/readme.ts`, add:

```ts
function matchingLines(readme: string, patterns: RegExp[], limit = 4): string[] {
  return readme
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 8 && patterns.some((pattern) => pattern.test(line)))
    .slice(0, limit);
}
```

In `analyzeReadme`, include:

```ts
evidence: {
  fetchStatus: "ok",
  fetchedAt: new Date().toISOString(),
  setupSnippets: matchingLines(readme, SETUP_PATTERNS),
  commandSnippets: matchingLines(readme, [/npm |pnpm |yarn |docker|compose|pip |poetry|bun |cargo |go run/i]),
  featureSnippets: matchingLines(readme, [/feature|search|collection|dashboard|export|backup|scanner|analytics|workflow|auth/i], 6),
  integrationSnippets: matchingLines(readme, API_PATTERNS, 6),
  licenseSnippets: matchingLines(readme, LICENSE_PATTERNS, 3)
}
```

- [ ] **Step 3: Export a fetch helper with status**

Change the private `fetchReadme` into an exported helper:

```ts
export async function fetchReadmeAnalysis(repo: NormalizedRepo, token?: string): Promise<ReadmeAnalysis | undefined> {
  // existing fetch logic
}
```

Keep `enrichRepositoriesWithReadmes` calling `fetchReadmeAnalysis`.

- [ ] **Step 4: Add evidence preparation**

Create `src/lib/repo-evidence/prepare.ts`:

```ts
import { fetchReadmeAnalysis } from "@/lib/github/readme";
import type { NormalizedRepo } from "@/lib/github/types";

export async function prepareRepoForHandoff(repo: NormalizedRepo, token?: string): Promise<NormalizedRepo> {
  if (repo.readme?.evidence?.fetchStatus === "ok") return repo;
  const readme = await fetchReadmeAnalysis(repo, token);
  return {
    ...repo,
    readme: readme ?? repo.readme
  };
}
```

- [ ] **Step 5: Test evidence preparation with a mocked fetch helper**

Use `vi.mock("@/lib/github/readme", ...)` in `prepare.test.ts` to verify:

- existing ok evidence skips fetch
- missing evidence fetches once
- fetch failure preserves original repo

- [ ] **Step 6: Run evidence tests**

Run:

```bash
npm test -- src/lib/repo-evidence/prepare.test.ts src/lib/github/readme.test.ts
```

Expected: PASS.

---

## Task 3: Render Build Packs From Blueprint + Evidence

**Files:**
- Modify: `src/lib/build-pack/generator.ts`
- Modify: `src/lib/build-pack/generator.test.ts`

- [ ] **Step 1: Replace direct profile construction**

In `buildProjectBuildPack`, replace:

```ts
const baseProfile = productProfileFor(originalIdea);
const profile = profileWithPreferences(baseProfile, wizardAnswers);
```

with:

```ts
const chatContext = typeof wizardAnswers?.chatContext === "string" ? wizardAnswers.chatContext : null;
const blueprint = buildHandoffBlueprint({
  originalIdea,
  researchContext,
  chatContext,
  queries: result.queries,
  selectedRepo: bestRepo,
  candidateRepos: topRepos,
  preferences: wizardAnswers
});
const profile = profileFromBlueprint(blueprint);
```

Add a temporary adapter:

```ts
function profileFromBlueprint(blueprint: HandoffBlueprint): ProductProfile {
  return {
    goal: blueprint.productThesis,
    primaryUser: blueprint.targetUserSegment,
    problem: blueprint.jobToBeDone,
    promise: blueprint.differentiatedWedge,
    coreWorkflow: blueprint.primaryWorkflow,
    stories: blueprint.userActions.map((action) => `As a user, I can ${action}.`),
    mustHave: blueprint.mvpRequirements,
    notInFirstVersion: blueprint.explicitNonGoals,
    firstMilestone: blueprint.firstMilestone,
    successMetrics: blueprint.successMetrics
  };
}
```

This keeps the first patch small. Later tasks can remove the old `ProductProfile` path entirely.

- [ ] **Step 2: Replace PRD sections with normalized blueprint sections**

In the PRD render block, replace Product Goal/Primary User/etc. with:

```ts
`## Product Thesis`,
blueprint.productThesis,
``,
`## Target User Segment`,
blueprint.targetUserSegment,
``,
`## Job To Be Done`,
blueprint.jobToBeDone,
``,
`## Current Alternatives`,
...bulletItems(blueprint.currentAlternatives),
``,
`## Differentiated Wedge`,
blueprint.differentiatedWedge,
``,
`## Primary Workflow`,
...blueprint.primaryWorkflow.map((step, index) => `${index + 1}. ${step}`),
``,
`## Key Screens / Surfaces`,
...bulletItems(blueprint.keyScreens),
``,
`## Core Data Objects`,
...bulletItems(blueprint.coreDataObjects),
``,
`## User Actions`,
...bulletItems(blueprint.userActions),
``,
`## System States`,
`- Empty: ${blueprint.systemStates.empty}`,
`- Loading: ${blueprint.systemStates.loading}`,
`- Error: ${blueprint.systemStates.error}`,
`- No result: ${blueprint.systemStates.noResult}`,
`- Partial success: ${blueprint.systemStates.partialSuccess}`,
``,
`## MVP Requirements`,
...checkItems(blueprint.mvpRequirements),
``,
`## Explicit Non-Goals`,
...bulletItems(blueprint.explicitNonGoals),
``,
`## Trust, Privacy, And Safety`,
...bulletItems(blueprint.trustPrivacySafety),
``,
`## Success Metrics`,
...checkItems(blueprint.successMetrics),
```

- [ ] **Step 3: Add a Reuse Matrix to STARTER_REPO**

Add:

```ts
function reuseMatrixLines(repo: BuildPackRepo | undefined, blueprint: HandoffBlueprint): string[] {
  return [
    "| Area | Keep | Replace | Build Fresh | Avoid | Evidence |",
    "|---|---|---|---|---|---|",
    `| Product workflow | Starter flows that support ${blueprint.primaryWorkflow[0]} | Copy, labels, sample data | Missing steps from the primary workflow | Unrelated starter features | ${repo?.readme?.evidence?.featureSnippets?.[0] ?? "Inspect README/app files"} |`,
    `| Data model | Entities matching ${blueprint.coreDataObjects.slice(0, 3).join(", ")} | Domain-specific assumptions | Missing product entities | License-unclear data | ${repo?.readme?.evidence?.integrationSnippets?.[0] ?? "Inspect models/schemas"} |`,
    `| UI | Useful shells, lists, cards, forms | Branding, layout that feels copied | Screens listed in PRD | Protected logos/assets | ${repo?.readme?.excerpt?.slice(0, 120) ?? "Inspect components"} |`,
    `| Setup/tests | Documented commands | Broken scripts | Missing QA for first milestone | Invented commands | ${repo?.readme?.evidence?.commandSnippets?.[0] ?? "Inspect package files"} |`
  ];
}
```

Render under `STARTER_REPO`:

```ts
`## Reuse Matrix`,
...reuseMatrixLines(bestRepo, blueprint),
``,
```

- [ ] **Step 4: Add evidence to REPO_STARTER_NOTES**

Add:

```ts
`## Architecture Evidence`,
bestRepo?.readme?.evidence?.fetchStatus
  ? `- README fetch status: ${bestRepo.readme.evidence.fetchStatus}`
  : "- README fetch status: unknown",
...(bestRepo?.readme?.evidence?.setupSnippets ?? []).map((line) => `- Setup: ${line}`),
...(bestRepo?.readme?.evidence?.commandSnippets ?? []).map((line) => `- Command: ${line}`),
...(bestRepo?.readme?.evidence?.featureSnippets ?? []).map((line) => `- Feature: ${line}`),
...(bestRepo?.readme?.evidence?.integrationSnippets ?? []).map((line) => `- Integration: ${line}`),
``,
`## Files Likely To Inspect First`,
...bulletItems(filesLikelyToInspect(bestRepo, blueprint)),
``,
```

With:

```ts
function filesLikelyToInspect(repo: BuildPackRepo | undefined, blueprint: HandoffBlueprint): string[] {
  const text = `${repo?.readme?.excerpt ?? ""} ${repo?.description ?? ""}`.toLowerCase();
  const files = ["README.md", "LICENSE", "package files / lockfiles", "app entrypoints"];
  if (/react|vite|next|frontend/.test(text)) files.push("frontend routes/components");
  if (/fastapi|express|backend|api/.test(text)) files.push("backend API routes/services");
  if (/postgres|sqlite|database|model|schema/.test(text)) files.push("database models/schemas");
  if (blueprint.productKind === "card-collector") files.push("card search, owned collection, pricing, export, and backup modules");
  return files;
}
```

- [ ] **Step 5: Add section-scoped tests**

In `generator.test.ts`, add helpers:

```ts
function section(markdown: string, heading: string) {
  const match = markdown.match(new RegExp(`## ${heading}\\\\n([\\\\s\\\\S]*?)(?=\\\\n## |\\\\n# |$)`));
  return match?.[1] ?? "";
}
```

Test:

```ts
const prd = markdown.split("# PRD")[1]?.split("# BUILD_PLAN")[0] ?? "";
expect(section(prd, "Product Thesis")).toMatch(/card|collector/i);
expect(section(prd, "Primary Workflow")).toMatch(/search.*card|binder|estimated/i);
expect(section(prd, "Core Data Objects")).toMatch(/OwnedCard|Condition|PriceSnapshot/i);
expect(section(prd, "Explicit Non-Goals")).toMatch(/official Pokemon|guaranteed resale/i);
```

- [ ] **Step 6: Run generator tests**

Run:

```bash
npm test -- src/lib/build-pack/generator.test.ts src/lib/build-pack/blueprint.test.ts
```

Expected: PASS.

---

## Task 4: Prepare Selected Repo Evidence Before Export

**Files:**
- Create: `src/app/api/repo-evidence/route.ts`
- Modify: `src/components/forkfirst-redesign.tsx`

- [ ] **Step 1: Add API route**

Create `src/app/api/repo-evidence/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prepareRepoForHandoff } from "@/lib/repo-evidence/prepare";
import type { NormalizedRepo } from "@/lib/github/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { repo?: NormalizedRepo; githubToken?: string };
    if (!body.repo?.owner || !body.repo?.name) {
      return NextResponse.json({ error: "Missing repo" }, { status: 400 });
    }
    const repo = await prepareRepoForHandoff(body.repo, body.githubToken);
    return NextResponse.json({ repo });
  } catch {
    return NextResponse.json({ error: "Unable to prepare repo evidence" }, { status: 500 });
  }
}
```

Do not log request bodies or tokens.

- [ ] **Step 2: Add client helper**

In `forkfirst-redesign.tsx`, add:

```ts
async function prepareSelectedRepoForExport(repo: ClassifiedRepo, githubToken?: string): Promise<ClassifiedRepo> {
  if (repo.readme?.evidence?.fetchStatus === "ok") return repo;
  const response = await fetch("/api/repo-evidence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo, githubToken })
  });
  if (!response.ok) return repo;
  const data = (await response.json()) as { repo?: ClassifiedRepo };
  return data.repo ?? repo;
}
```

- [ ] **Step 3: Convert zip/copy generation to async evidence-aware flow**

Replace direct `makeHandoffMarkdown()` usage in export/copy handlers with:

```ts
const buildPreparedHandoffMarkdown = useCallback(async () => {
  if (!result) return "# Builder Handoff\n\nRun an idea check first.";
  const starter = selectedStarterRepo ?? result.repos[0] ?? null;
  const preparedStarter = starter ? await prepareSelectedRepoForExport(starter, keys.githubToken) : null;
  if (preparedStarter) {
    setSelectedStarterRepo(preparedStarter);
  }
  return buildProjectBuildPack(
    result,
    "codex",
    preparedStarter ?? starter ?? result.repos[0],
    buildPackPreferences(brand, followUps),
    enabledPackMarkdown(promptPackState)
  );
}, [brand, followUps, keys.githubToken, promptPackState, result, selectedStarterRepo]);
```

Use it in:

- copy handoff
- download `.md`
- download `.zip`
- save Build Pack

- [ ] **Step 4: Add UX state**

Add state:

```ts
const [handoffPreparing, setHandoffPreparing] = useState(false);
```

Wrap export handlers:

```ts
setHandoffPreparing(true);
try {
  const markdown = await buildPreparedHandoffMarkdown();
  downloadHandoffZip("forkfirst-build-pack.zip", createHandoffDocuments(markdown), markdown);
} finally {
  setHandoffPreparing(false);
}
```

Disable export buttons while preparing and label them “Preparing evidence...” only in the button tooltip or small status line, not as a big blocking modal.

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

---

## Task 5: Snapshot And Regeneration Rules

**Files:**
- Modify: `src/components/forkfirst-redesign.tsx`
- Modify: saved build-pack storage types if needed in the same file or local storage helper.

- [ ] **Step 1: Add schema version**

Add:

```ts
const BUILD_PACK_SCHEMA_VERSION = 2;
```

When saving a pack, include:

```ts
schemaVersion: BUILD_PACK_SCHEMA_VERSION
```

If the existing type does not include it, extend the type with optional:

```ts
schemaVersion?: number;
```

- [ ] **Step 2: Prefer regenerated markdown for active workspace**

Current logic:

```ts
const sourceMarkdown = activeBuildPack?.markdown || generatedMarkdown;
```

Change to:

```ts
const activePackIsCurrent = activeBuildPack?.schemaVersion === BUILD_PACK_SCHEMA_VERSION;
const sourceMarkdown = activeBuildPack && activePackIsCurrent ? activeBuildPack.markdown : generatedMarkdown;
```

- [ ] **Step 3: Label old packs as snapshots**

In Handoff UI, if `activeBuildPack && !activePackIsCurrent`, show subtle text:

```text
This saved handoff uses an older generator. Regenerate before exporting for launch-quality output.
```

- [ ] **Step 4: Test manually**

Use a locally saved old pack and verify:

- old text is not silently preferred forever
- regeneration creates the new PRD structure
- user can still open the old snapshot if needed

---

## Task 6: Prompt Pack Compaction Table

**Files:**
- Modify: `src/lib/build-pack/generator.ts`
- Modify: `src/components/prompt-packs-panel.tsx`
- Modify: `src/lib/build-pack/generator.test.ts`

- [ ] **Step 1: Render packs as a compact table**

Replace first-bullet-only summaries with:

```md
## Builder Rule Packs
| Pack | Why Included | Must Follow | Verification |
|---|---|---|---|
| Local-First Apps | The user enabled local-first guidance. | Store important user data locally first when possible. | Export/backup path exists and storage is documented. |
```

- [ ] **Step 2: Keep raw prompt packs out of PRD**

Test:

```ts
expect(prd).not.toContain("## Prompt Packs");
expect(prd).not.toContain("This exact raw prompt pack text");
expect(agents).toContain("| Pack | Why Included | Must Follow | Verification |");
```

- [ ] **Step 3: Update panel copy**

Use:

```tsx
Enabled packs are summarized in the Builder Handoff under <strong>AGENTS.md &gt; Builder Rule Packs</strong>, so the PRD stays focused on the actual product.
```

---

## Task 7: Launch Regression Suite

**Files:**
- Modify: `src/lib/build-pack/generator.test.ts`
- Create: `src/lib/build-pack/export-regression.test.ts`

- [ ] **Step 1: Add real failure-case regression**

Test the exact prompt from the exported zip:

```ts
const prompt = "Original idea: I want an app like the Pokemon Collectors app, an app that can show me how much my Pokemon cards are worth and have a collector's album and whatever else is helpful that you think could be put into that. Can you help me with that?";
```

Assertions:

- PRD `Product Thesis` mentions cards/collector/value/album.
- PRD `Primary Workflow` includes search, detail/value, save to collection, album/vault, export/backup.
- Build plan phase 2 names product-specific data/screens/actions.
- Repo notes include README evidence or an explicit evidence-unavailable reason.
- No section says only “one input / one useful result” for this case.

- [ ] **Step 2: Add no-wizard regression**

Call `buildProjectBuildPack(result, "codex", selectedRepo, undefined, undefined)`.

Expected: still product-specific.

- [ ] **Step 3: Add partial-wizard regression**

Pass only:

```ts
{ productName: "Untitled app", vibe: "calm", accentColor: "#2647F0" }
```

Expected: does not weaken product-specific PRD.

- [ ] **Step 4: Add arbitrary-app regression**

Use a non-card example:

```text
I want a recipe bookmark manager that saves recipes from links, lets me tag them, and exports a grocery list.
```

Expected: not Pokemon-specific, not generic one-input output. It should infer recipe links, saved recipes, tags, grocery list, export.

This may require adding a simple recipe/bookmark blueprint enricher or improving the generic blueprint from nouns/verbs in prompt/repo evidence.

- [ ] **Step 5: Run full suite**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all pass.

---

## Task 8: Manual Export QA

**Files:**
- No source files unless QA finds issues.

- [ ] **Step 1: Start app locally**

Run:

```bash
npm run dev -- --port 3057
```

- [ ] **Step 2: Run the Pokemon prompt**

Use the exact prompt from the failed export.

- [ ] **Step 3: Skip most wizard questions**

Only set a product name or skip entirely.

- [ ] **Step 4: Export zip**

Inspect:

- `PRD.md`
- `STARTER_REPO.md`
- `BUILD_PLAN.md`
- `REPO_STARTER_NOTES.md`
- `AGENTS.md`
- `CLAUDE.md`

- [ ] **Step 5: Quality checklist**

The exported pack passes only if:

- It is obviously about a collector/card-value app.
- It says what to keep from the selected repo.
- It says what to replace/rebrand.
- It says what to add/customize.
- It warns about AGPL, Pokemon/IP, card images, pricing API terms, and estimated values.
- It tells the builder the first vertical slice.
- It does not require the user to answer all questions to be useful.
- It does not waste most of the PRD on prompt-pack boilerplate.

---

## Non-Goals For This Pass

- Do not add login.
- Do not add a paid required AI generation step.
- Do not make this Pokemon-specific.
- Do not remove demo/no-key mode.
- Do not promise legal/license safety.
- Do not build a full repo clone/fork system.
- Do not hide generic outputs behind a cosmetic “quality score.”

---

## Execution Order

1. Blueprint model and tests.
2. README evidence model and preparation helper.
3. Generator rendering from blueprint.
4. Evidence-aware export UI.
5. Snapshot regeneration behavior.
6. Prompt-pack compaction.
7. Regression suite.
8. Manual export QA with the failed Pokemon prompt.

This order matters because the generator should not be rewritten again until the blueprint and evidence model exist.

---

## Acceptance Criteria

- A user can skip the wizard and still get a product-specific Build Pack.
- The selected repo can influence product direction when it clearly matches the idea.
- The generated PRD has screens, data objects, states, workflow, non-goals, and safety notes.
- The build plan decomposes the actual vertical slice, not just “build one useful workflow.”
- Repo evidence has provenance: fetched README evidence or a clear unavailable reason.
- Saved old packs cannot silently mask a better generator.
- Tests include the exact failed Pokemon prompt and at least one unrelated app idea.
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

