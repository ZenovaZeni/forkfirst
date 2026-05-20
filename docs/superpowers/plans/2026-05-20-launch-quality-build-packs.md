# Launch-Quality Build Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ForkFirst generate Build Packs that are better than simply cloning a repo by explaining what the foundation already has, what to keep, what to replace, what to add, and what risks must be checked before building.

**Architecture:** Keep this deterministic and BYOK-safe. Improve the GitHub search plan, add a second README enrichment pass before final scoring, and restructure the Build Pack around foundation transformation instead of generic PRD boilerplate. Do not add a new paid AI dependency for launch quality.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, existing GitHub REST search/README helpers, existing Markdown Build Pack generator.

---

## File Structure

- Modify: `src/lib/search/planner.ts`
  - Add a collectibles/trading-card search vertical so prompts like "Pokemon collector app" find domain-specific repo candidates first.
- Modify: `src/lib/search/planner.test.ts`
  - Add tests proving Pokemon/TCG prompts produce targeted GitHub queries.
- Create: `src/lib/idea-check/enrich-candidates.ts`
  - Select high-likelihood repos that still lack README data, fetch their READMEs, and merge them back before final classification.
- Create: `src/lib/idea-check/enrich-candidates.test.ts`
  - Test second-pass enrichment candidate selection without making live GitHub calls.
- Modify: `src/lib/idea-check/run.ts`
  - Use the enrichment helper between initial GitHub search and final scoring.
- Modify: `src/lib/build-pack/generator.ts`
  - Add a collectibles product profile.
  - Strip untrusted-content markers from user-facing Markdown.
  - Add foundation coverage signals.
  - Add a "Foundation Transformation Plan" section.
  - Compress prompt-pack text and move it out of the PRD.
  - Filter irrelevant "also worth checking" repos.
  - Replace hardcoded npm verification commands with repo-aware verification guidance.
  - Make AGPL/data/IP warnings louder when relevant.
- Modify: `src/lib/build-pack/generator.test.ts`
  - Add regression tests for the Pokemon-card Build Pack failure.
  - Update existing verification/prompt-pack expectations.
- Modify: `src/components/prompt-packs-panel.tsx`
  - Update copy that currently says prompt packs are appended to `PRD.md > Prompt Packs`.

---

### Task 1: Add Collectibles Search Planning

**Files:**
- Modify: `src/lib/search/planner.ts`
- Modify: `src/lib/search/planner.test.ts`

- [ ] **Step 1: Write failing planner tests**

Append these tests to `src/lib/search/planner.test.ts`:

```ts
test("plans Pokemon and trading-card searches for collector app prompts", () => {
  const queries = planSearches(
    "I want an app like Pokemon Collectors that shows what my cards are worth and has a collector album."
  );

  expect(queries[0]).toBe("pokemon tcg collection manager in:name,description,readme");
  expect(queries).toContain("pokemon card collection tracker in:name,description,readme");
  expect(queries).toContain("tcg collection manager price tracker in:name,description,readme");
  expect(queries).toContain("tcgdex collection app in:name,description,readme");
});

test("explains collectible app search intent in plain English", () => {
  const refinement = planPromptRefinement("Pokemon card value tracker and binder app");

  expect(refinement.probableMeaning).toContain("trading-card");
  expect(refinement.bestQuery).toBe("pokemon tcg collection manager in:name,description,readme");
});
```

- [ ] **Step 2: Run the targeted test and confirm it fails**

Run:

```bash
npm test -- src/lib/search/planner.test.ts
```

Expected: FAIL because no collectibles vertical exists yet.

- [ ] **Step 3: Add the collectibles vertical**

In `src/lib/search/planner.ts`, add this object near the top of `VERTICAL_SEARCH_PLANS`, before generic ecommerce/business plans:

```ts
{
  pattern: /\b(pokemon|pokémon|tcg|trading cards?|card collector|card collection|collector album|card binder|card value|tcgplayer|tcgdex|cardmarket|sports cards?|magic the gathering|mtg|yugioh|yu-gi-oh|collectibles?)\b/i,
  label: "trading-card collectibles",
  meaning: "Find open-source trading-card, Pokemon TCG, collection-manager, price-tracker, or binder tools that match the user's collector workflow.",
  queries: [
    "pokemon tcg collection manager in:name,description,readme",
    "pokemon card collection tracker in:name,description,readme",
    "tcg collection manager price tracker in:name,description,readme",
    "trading card binder app in:name,description,readme",
    "pokemon tcg portfolio tracker in:name,description,readme",
    "tcgdex collection app in:name,description,readme"
  ]
}
```

- [ ] **Step 4: Run the targeted test and confirm it passes**

Run:

```bash
npm test -- src/lib/search/planner.test.ts
```

Expected: PASS.

---

### Task 2: Add Second-Pass README Enrichment

**Files:**
- Create: `src/lib/idea-check/enrich-candidates.ts`
- Create: `src/lib/idea-check/enrich-candidates.test.ts`
- Modify: `src/lib/idea-check/run.ts`

- [ ] **Step 1: Write failing enrichment tests**

Create `src/lib/idea-check/enrich-candidates.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import type { NormalizedRepo } from "@/lib/github/types";
import { selectReadmeEnrichmentCandidates } from "./enrich-candidates";

function repo(overrides: Partial<NormalizedRepo> = {}): NormalizedRepo {
  return {
    id: overrides.id ?? 1,
    owner: overrides.owner ?? "owner",
    name: overrides.name ?? "repo",
    fullName: overrides.fullName ?? "owner/repo",
    url: overrides.url ?? "https://github.com/owner/repo",
    description: overrides.description ?? "",
    language: overrides.language ?? "TypeScript",
    topics: overrides.topics ?? [],
    stars: overrides.stars ?? 100,
    forks: overrides.forks ?? 10,
    openIssues: overrides.openIssues ?? 1,
    license: overrides.license ?? "MIT",
    pushedAt: overrides.pushedAt ?? "2026-05-01T00:00:00Z",
    createdAt: overrides.createdAt ?? "2025-01-01T00:00:00Z",
    updatedAt: overrides.updatedAt ?? "2026-05-01T00:00:00Z",
    archived: overrides.archived ?? false,
    homepage: overrides.homepage ?? null,
    readme: overrides.readme
  };
}

describe("README enrichment candidate selection", () => {
  test("selects highly relevant repos even when they appeared later in GitHub results", () => {
    const repos = [
      repo({ id: 1, fullName: "font/unrelated", description: "A font package", stars: 90000 }),
      repo({ id: 2, fullName: "security/list", description: "Awesome CSIRT links", stars: 50000 }),
      repo({
        id: 3,
        fullName: "Git-Romer/pokecollector",
        description: "Pokemon TCG collection manager with pricing, binders, wishlist, scanner, backup, and exports.",
        topics: ["pokemon", "tcg", "collection", "prices"],
        stars: 800
      })
    ];

    const selected = selectReadmeEnrichmentCandidates(
      repos,
      "I want an app like Pokemon Collectors that values cards and has a collector album.",
      2
    );

    expect(selected.map((candidate) => candidate.fullName)).toContain("Git-Romer/pokecollector");
    expect(selected.map((candidate) => candidate.fullName)).not.toContain("font/unrelated");
  });

  test("does not refetch repos that already have README analysis", () => {
    const selected = selectReadmeEnrichmentCandidates(
      [
        repo({
          fullName: "Git-Romer/pokecollector",
          description: "Pokemon TCG collection manager.",
          topics: ["pokemon", "tcg"],
          readme: {
            excerpt: "Already fetched",
            url: "https://github.com/Git-Romer/pokecollector#readme",
            hasSetup: true,
            hasExamples: true,
            hasApiDetails: false,
            hasLocalDevelopment: true,
            hasLicenseText: true,
            qualityScore: 80,
            reasons: ["Setup path found"]
          }
        })
      ],
      "Pokemon card collection manager",
      4
    );

    expect(selected).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the targeted test and confirm it fails**

Run:

```bash
npm test -- src/lib/idea-check/enrich-candidates.test.ts
```

Expected: FAIL because the helper file does not exist.

- [ ] **Step 3: Implement the helper**

Create `src/lib/idea-check/enrich-candidates.ts`:

```ts
import { enrichRepositoriesWithReadmes } from "@/lib/github/readme";
import type { NormalizedRepo } from "@/lib/github/types";
import { classifyRepositories } from "@/lib/scoring/scoring";

const DEFAULT_SECOND_PASS_LIMIT = 8;

export function selectReadmeEnrichmentCandidates(
  repos: NormalizedRepo[],
  prompt: string,
  limit = DEFAULT_SECOND_PASS_LIMIT
): NormalizedRepo[] {
  return classifyRepositories(repos, prompt)
    .filter((repo) => !repo.readme)
    .slice(0, limit);
}

export async function enrichTopCandidateReadmes(
  repos: NormalizedRepo[],
  prompt: string,
  token?: string
): Promise<NormalizedRepo[]> {
  const candidates = selectReadmeEnrichmentCandidates(repos, prompt);
  if (candidates.length === 0) return repos;

  const enrichedCandidates = await enrichRepositoriesWithReadmes(candidates, token);
  const enrichedById = new Map(enrichedCandidates.map((repo) => [repo.id, repo]));

  return repos.map((repo) => enrichedById.get(repo.id) ?? repo);
}
```

- [ ] **Step 4: Wire the helper into idea checks**

Modify `src/lib/idea-check/run.ts`:

```ts
import { enrichTopCandidateReadmes } from "@/lib/idea-check/enrich-candidates";
```

Change the start of `runIdeaCheck`:

```ts
const search = await searchGithubRepositories(input.prompt, input.githubToken);
const enrichedRepos = await enrichTopCandidateReadmes(search.repos, input.prompt, input.githubToken);
const classified = classifyRepositories(enrichedRepos, input.prompt);
```

- [ ] **Step 5: Run targeted tests**

Run:

```bash
npm test -- src/lib/idea-check/enrich-candidates.test.ts src/lib/search/planner.test.ts
```

Expected: PASS.

---

### Task 3: Add a Collectibles Product Profile and Foundation Coverage Map

**Files:**
- Modify: `src/lib/build-pack/generator.ts`
- Modify: `src/lib/build-pack/generator.test.ts`

- [ ] **Step 1: Write failing Build Pack regression tests**

Append these tests to `src/lib/build-pack/generator.test.ts`:

```ts
test("Pokemon collector prompts produce a card-collector product profile", () => {
  const pokemonRepo: ClassifiedRepo = {
    ...repo(),
    fullName: "Git-Romer/pokecollector",
    url: "https://github.com/Git-Romer/pokecollector",
    description: "Pokemon TCG collection manager with pricing, binders, wishlist, scanner, backup, and exports.",
    topics: ["pokemon", "tcg", "collection", "prices"],
    license: "AGPL-3.0",
    score: { total: 68, fit: 38, activity: 70, popularity: 55, license: 55, docs: 90, reasons: ["Pokemon TCG collection match"] },
    readme: {
      ...repo().readme!,
      excerpt:
        "Card search, collection management, binders, wishlist, TCGdex sync, Cardmarket/TCGPlayer pricing, CSV/PDF export, backup/restore, analytics, scanner, FastAPI, React, Postgres, Docker.",
      qualityScore: 95
    }
  };

  const markdown = buildProjectBuildPack(
    makeResult({
      prompt:
        "Original idea: I want an app like the Pokemon Collectors app that shows what my Pokemon cards are worth and has a collector album.",
      repos: [pokemonRepo]
    }),
    "codex",
    pokemonRepo
  );

  expect(markdown).toContain("## Product Goal");
  expect(markdown).toMatch(/Pokemon card|trading-card|card collection/i);
  expect(markdown).toMatch(/search.*card|card.*search/i);
  expect(markdown).toMatch(/vault|binder|collector album/i);
  expect(markdown).toMatch(/estimated value|pricing|collection total/i);
  expect(markdown).toContain("## Foundation Coverage Map");
  expect(markdown).toContain("Already detected");
  expect(markdown).toMatch(/TCGdex|TCGPlayer|pricing|scanner|backup|export/i);
  expect(markdown).not.toContain("one input and one useful result");
});

test("AGPL and Pokemon data/IP risks are prominent for card collector foundations", () => {
  const pokemonRepo: ClassifiedRepo = {
    ...repo(),
    fullName: "Git-Romer/pokecollector",
    description: "Pokemon TCG collection manager with TCGdex and TCGPlayer pricing.",
    topics: ["pokemon", "tcg", "tcgdex"],
    license: "AGPL-3.0",
    score: { ...repo().score, fit: 40 },
    readme: {
      ...repo().readme!,
      excerpt: "Uses TCGdex, Cardmarket, TCGPlayer, card images, scanner, and export tools."
    }
  };

  const markdown = buildProjectBuildPack(
    makeResult({
      prompt: "Original idea: Pokemon card value tracker and collector album.",
      repos: [pokemonRepo]
    }),
    "codex",
    pokemonRepo
  );

  expect(markdown).toMatch(/AGPL.*network|network.*AGPL|reciprocal obligations/i);
  expect(markdown).toMatch(/card image|Pokemon branding|API terms|estimated values/i);
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```bash
npm test -- src/lib/build-pack/generator.test.ts
```

Expected: FAIL because there is no collectibles profile or coverage map.

- [ ] **Step 3: Add marker cleanup and repo text helpers**

In `src/lib/build-pack/generator.ts`, add helpers near other string helpers:

```ts
function cleanRepoContent(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/<\/?UNTRUSTED_REPO_CONTENT>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function repoHaystack(repo: BuildPackRepo | undefined): string {
  if (!repo) return "";
  return cleanRepoContent(
    [
      repo.fullName,
      repo.description,
      repo.language,
      repo.license,
      repo.topics.join(" "),
      repo.readme?.excerpt,
      repo.readme?.reasons.join(" ")
    ].filter(Boolean).join(" ")
  ).toLowerCase();
}
```

- [ ] **Step 4: Add the collectibles product profile**

Inside `productProfileFor`, after the existing domain booleans and before the real-estate branches, add:

```ts
const isCollectiblesTool = /\b(pokemon|pokémon|tcg|trading cards?|card collector|card collection|collector album|card binder|card value|tcgplayer|tcgdex|cardmarket|sports cards?|magic the gathering|mtg|yugioh|yu-gi-oh|collectibles?)\b/i.test(idea);

if (isCollectiblesTool) {
  return {
    goal: "Help collectors search Pokemon or trading cards, save their personal collection, track estimated value, and organize cards into a simple collector album or vault.",
    primaryUser: "A casual or serious card collector who wants to know what they own, what it may be worth, and which cards belong in each binder, deck, or wishlist.",
    problem: "Card collections often live in boxes, binders, screenshots, and spreadsheets. The user needs a simple loop for finding a card, saving its condition and quantity, and seeing a realistic estimated collection value without copying another app's brand.",
    promise: "Give the collector a fast card search, clear card detail/value view, personal vault, binder-style organization, backup/export, and a path to add scanner or richer price integrations later.",
    coreWorkflow: [
      "User searches for a Pokemon or trading card by name, set, number, or keyword.",
      "User opens a card detail page with image, set, rarity, variant, and estimated value when available.",
      "User saves the card to their collection with condition, quantity, purchase price, notes, and binder or album location.",
      "User views the collection as a searchable vault or album with total estimated value and filters.",
      "User exports or backs up the collection before trusting the app with real inventory."
    ],
    stories: [
      "As a collector, I can search cards and quickly identify the exact version I own.",
      "As a collector, I can save quantity, condition, notes, and purchase price for each card.",
      "As a collector, I can see an estimated value for one card and for my full collection.",
      "As a collector, I can organize cards into albums, binders, wishlist, or custom groups.",
      "As a builder, I can preserve working card-data, pricing, and collection features from the starter repo while replacing the brand and product direction."
    ],
    mustHave: [
      "Card search with useful empty, loading, no-result, and error states.",
      "Card detail view with image, set, rarity, variant, and estimated value when available.",
      "Collection save flow for condition, quantity, purchase price, notes, and album/binder location.",
      "Collection dashboard with filters and total estimated value.",
      "Backup/export path so users do not feel trapped in local data."
    ],
    notInFirstVersion: [
      "Marketplace buying, selling, bidding, or escrow.",
      "Official Pokemon branding, copied UI, logos, or app-store positioning.",
      "Real-time price guarantees; label values as estimates until data terms and refresh behavior are verified.",
      "Native mobile apps, barcode scanning, or AI image scanning before manual search and collection tracking work.",
      "Public social network, leaderboards, or trading features before private collection value is reliable."
    ],
    firstMilestone: "Build the collector loop: search for a card, open details, save it with condition and quantity, see it in a vault/album, show an estimated collection value, and export or back up the data.",
    successMetrics: [
      "A collector can add three real cards to the collection in under two minutes.",
      "The app clearly distinguishes estimated value from guaranteed sale price.",
      "Saved cards, notes, and collection totals survive refresh and can be exported.",
      "The product looks original and does not rely on copied Pokemon Collector branding."
    ]
  };
}
```

- [ ] **Step 5: Add foundation feature detection**

Add these helpers near `adaptationMap`:

```ts
type FoundationCoverage = {
  alreadyDetected: string[];
  keepFirst: string[];
  replaceOrRebrand: string[];
  addOrCustomize: string[];
  removeOrDefer: string[];
  riskChecks: string[];
};

function detectFoundationFeatures(repo: BuildPackRepo | undefined): string[] {
  const text = repoHaystack(repo);
  const features = [
    [/\b(search|catalog|tcgdex|tcgplayer|cardmarket)\b/i, "card search/catalog"],
    [/\b(collection|collector|vault|inventory|owned cards?)\b/i, "collection/vault tracking"],
    [/\b(binder|album|wishlist|deck)\b/i, "binder, album, wishlist, or grouping"],
    [/\b(price|pricing|value|valuation|market)\b/i, "pricing/value estimates"],
    [/\b(export|csv|pdf|backup|restore)\b/i, "export/backup"],
    [/\b(scanner|scan|gemini|ocr|camera)\b/i, "scanner or image-assisted entry"],
    [/\b(analytics|dashboard|charts?)\b/i, "analytics/dashboard"],
    [/\b(react|vite|next|frontend|tailwind)\b/i, "working frontend shell"],
    [/\b(fastapi|express|api|backend)\b/i, "backend/API layer"],
    [/\b(postgres|postgresql|sqlite|database|prisma)\b/i, "database/persistence layer"],
    [/\b(docker|compose|container)\b/i, "Docker/local setup"]
  ] as const;

  return features.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
}

function foundationCoverageMap(
  repo: BuildPackRepo | undefined,
  profile: ProductProfile,
  preferences?: BuildPackPreferences
): FoundationCoverage {
  const detected = detectFoundationFeatures(repo);
  const keep = stringPreference(preferences, "keepFromRepo");
  const replace = stringPreference(preferences, "replaceFromRepo");
  const add = stringPreference(preferences, "addToRepo");
  const isCardProduct = /card|pokemon|tcg|collector|binder/i.test(profile.goal + " " + profile.promise);

  return {
    alreadyDetected: detected.length ? detected : ["No concrete foundation features were detected from the available metadata. Inspect the repo before deciding."],
    keepFirst: keep
      ? [keep]
      : detected.length
        ? detected.slice(0, 6)
        : ["Only keep setup, routing, and data patterns that survive inspection."],
    replaceOrRebrand: replace
      ? [replace]
      : [
          "Product name, visual identity, onboarding, copy, sample data, and any screens that make the result feel like the starter app.",
          "Navigation and dashboard emphasis so the app serves the user's exact collector workflow."
        ],
    addOrCustomize: add
      ? [add]
      : [
          profile.firstMilestone,
          "Focused empty/loading/error states and an export or backup path for user trust."
        ],
    removeOrDefer: [
      "Unrelated social, admin, marketplace, team, or demo features until the first workflow is proven.",
      "Any starter assets, logos, or sample content that create brand/IP confusion."
    ],
    riskChecks: [
      ...(repo?.license?.toUpperCase().includes("AGPL")
        ? ["AGPL/network-use obligations: confirm source distribution expectations before a hosted or closed commercial launch."]
        : []),
      ...(isCardProduct
        ? ["Card images, Pokemon naming/branding, and pricing API terms: use original branding, label values as estimates, and confirm provider terms before launch."]
        : []),
      "Confirm package scripts, setup docs, seed data, and dependency health before asking the builder to modify code."
    ]
  };
}

function coverageLines(coverage: FoundationCoverage): string[] {
  return [
    `- Already detected: ${coverage.alreadyDetected.join("; ")}`,
    `- Keep first: ${coverage.keepFirst.join("; ")}`,
    `- Replace/rebrand: ${coverage.replaceOrRebrand.join("; ")}`,
    `- Add/customize: ${coverage.addOrCustomize.join("; ")}`,
    `- Remove/defer: ${coverage.removeOrDefer.join("; ")}`,
    `- Risk checks: ${coverage.riskChecks.join("; ")}`
  ];
}
```

- [ ] **Step 6: Add the coverage map to STARTER_REPO**

Inside `buildProjectBuildPack`, create:

```ts
const foundationCoverage = foundationCoverageMap(bestRepo, profile, wizardAnswers);
```

Then after `## Repo-To-Product Adaptation Map`, add:

```ts
`## Foundation Coverage Map`,
...coverageLines(foundationCoverage),
``,
```

- [ ] **Step 7: Run targeted tests**

Run:

```bash
npm test -- src/lib/build-pack/generator.test.ts
```

Expected: PASS after updating expectations in later tasks.

---

### Task 4: Compress Prompt Packs and Move Them Out of the PRD

**Files:**
- Modify: `src/lib/build-pack/generator.ts`
- Modify: `src/lib/build-pack/generator.test.ts`
- Modify: `src/components/prompt-packs-panel.tsx`

- [ ] **Step 1: Write failing tests**

Append to `src/lib/build-pack/generator.test.ts`:

```ts
test("prompt packs are compacted into builder rules instead of bloating the PRD", () => {
  const promptPack = [
    "## Landing AI Vision Agent",
    "- Rule one: keep the workflow focused.",
    "- Rule two: avoid generic SaaS filler.",
    "- Rule three: do not build fake dashboards.",
    "",
    "## UX Rules",
    "- Make mobile flows compact.",
    "- Prefer useful content over decoration.",
    "- Remove visual noise."
  ].join("\n");

  const markdown = buildProjectBuildPack(result(), "codex", repo(), undefined, promptPack);
  const prd = markdown.split("# PRD")[1]?.split("# BUILD_PLAN")[0] ?? "";
  const agents = markdown.split("# AGENTS")[1] ?? "";

  expect(prd).not.toContain("## Prompt Packs");
  expect(prd).not.toContain("Rule three: do not build fake dashboards.");
  expect(agents).toContain("## Builder Rule Packs");
  expect(agents).toContain("Landing AI Vision Agent");
  expect(agents).toContain("- Rule one: keep the workflow focused.");
  expect(agents).toContain("Full prompt pack text is omitted");
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```bash
npm test -- src/lib/build-pack/generator.test.ts
```

Expected: FAIL because prompt packs are still dumped into the PRD.

- [ ] **Step 3: Implement prompt pack compaction**

Add this helper to `src/lib/build-pack/generator.ts`:

```ts
function compactPromptPackMarkdown(markdown?: string): string[] {
  if (!markdown?.trim()) return [];

  const sections = markdown
    .split(/\n(?=##\s+)/g)
    .map((section) => section.trim())
    .filter(Boolean)
    .slice(0, 6);

  const lines: string[] = [
    "## Builder Rule Packs",
    "The user enabled these build-rule packs. Apply the intent, but keep the product PRD focused on the actual app.",
    "Full prompt pack text is omitted from the PRD to keep the handoff concise."
  ];

  for (const section of sections) {
    const sectionLines = section.split("\n").map((line) => line.trim()).filter(Boolean);
    const heading = sectionLines[0]?.replace(/^##\s*/, "") ?? "Prompt Pack";
    const bullets = sectionLines.filter((line) => /^[-*]\s+/.test(line)).slice(0, 2);
    lines.push("", `### ${heading}`, ...(bullets.length ? bullets : ["- Apply this pack only where it improves the first milestone."]));
  }

  return lines;
}
```

- [ ] **Step 4: Remove PRD prompt-pack block**

In the PRD section of `buildProjectBuildPack`, delete the conditional block that adds:

```ts
`## Prompt Packs`,
`The user has enabled the following build-philosophy packs. Apply these throughout your work:`,
promptPackMarkdown
```

- [ ] **Step 5: Add compact packs to the agent section**

Before `## Operating Rules` in the `# AGENTS`/`# CLAUDE` section, add:

```ts
...compactPromptPackMarkdown(promptPackMarkdown),
...(promptPackMarkdown ? [``] : []),
```

- [ ] **Step 6: Update prompt-pack panel copy**

In `src/components/prompt-packs-panel.tsx`, replace:

```tsx
Enabled packs are appended to the Builder Handoff under <strong>PRD.md &gt; Prompt Packs</strong>. Preview shows the exact Markdown before you include it.
```

with:

```tsx
Enabled packs are summarized in the Builder Handoff under <strong>AGENTS.md &gt; Builder Rule Packs</strong> so the PRD stays focused on the product.
```

- [ ] **Step 7: Run targeted tests**

Run:

```bash
npm test -- src/lib/build-pack/generator.test.ts
```

Expected: PASS after related expectation updates.

---

### Task 5: Filter Weak Alternates and Fix Verification Guidance

**Files:**
- Modify: `src/lib/build-pack/generator.ts`
- Modify: `src/lib/build-pack/generator.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/lib/build-pack/generator.test.ts`:

```ts
test("focused Build Packs omit irrelevant also-worth-checking repos", () => {
  const selected: ClassifiedRepo = {
    ...repo(),
    fullName: "Git-Romer/pokecollector",
    description: "Pokemon TCG collection manager with card values and binders.",
    topics: ["pokemon", "tcg", "collection"],
    score: { ...repo().score, fit: 42 }
  };
  const unrelated: ClassifiedRepo = {
    ...repo(),
    id: 2,
    fullName: "stgiga/UnifontEX",
    description: "A font package.",
    topics: ["font"],
    category: "reference",
    score: { total: 20, fit: 0, activity: 80, popularity: 80, license: 80, docs: 20, reasons: ["No idea fit"] }
  };

  const markdown = buildProjectBuildPack(
    makeResult({
      prompt: "Original idea: Pokemon card value tracker and collector album.",
      repos: [selected, unrelated]
    }),
    "codex",
    selected
  );

  expect(markdown).toContain("Git-Romer/pokecollector");
  expect(markdown).not.toContain("stgiga/UnifontEX");
});

test("verification guidance does not invent npm scripts for unknown starter repos", () => {
  const markdown = buildProjectBuildPack(result(), "codex");

  expect(markdown).toContain("Run the starter repo's documented install, build, dev, and test commands");
  expect(markdown).toContain("If a lint, typecheck, or test script is missing, record that instead of inventing one.");
  expect(markdown).not.toContain("Run npm run lint");
  expect(markdown).not.toContain("Run npm run typecheck");
  expect(markdown).not.toContain("Run npm test");
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```bash
npm test -- src/lib/build-pack/generator.test.ts
```

Expected: FAIL because weak alternates and npm scripts are still present.

- [ ] **Step 3: Add alternate filtering helpers**

Add to `src/lib/build-pack/generator.ts` near `relevantTerms`:

```ts
function repoTermSet(repo: BuildPackRepo | undefined): Set<string> {
  return relevantTerms(repoHaystack(repo));
}

function sharesUsefulDomain(repo: BuildPackRepo, primaryRepo: BuildPackRepo | undefined, originalIdea: string): boolean {
  const ideaTerms = relevantTerms(originalIdea);
  const primaryTerms = repoTermSet(primaryRepo);
  const repoTerms = repoTermSet(repo);
  let overlap = 0;

  for (const term of repoTerms) {
    if (ideaTerms.has(term) || primaryTerms.has(term)) overlap += 1;
  }

  return overlap >= 2;
}

function shouldShowAlternateRepo(repo: BuildPackRepo, primaryRepo: BuildPackRepo | undefined, originalIdea: string): boolean {
  if (repo.fullName === primaryRepo?.fullName) return false;
  if (repo.score.fit < 25) return false;
  if (!sharesUsefulDomain(repo, primaryRepo, originalIdea)) return false;
  return true;
}
```

- [ ] **Step 4: Apply alternate filtering**

Replace:

```ts
const alsoWorthChecking = focusRepo ? topRepos.filter((repo) => repo.fullName !== focusRepo.fullName).slice(0, 2) : [];
```

with:

```ts
const alsoWorthChecking = focusRepo
  ? topRepos.filter((repo) => shouldShowAlternateRepo(repo, focusRepo, originalIdea)).slice(0, 2)
  : [];
```

Replace:

```ts
const otherTopRepos = focusRepo ? [] : topRepos.slice(1);
```

with:

```ts
const otherTopRepos = focusRepo
  ? []
  : topRepos.slice(1).filter((repo) => shouldShowAlternateRepo(repo, bestRepo, originalIdea));
```

- [ ] **Step 5: Replace verification checklist**

In `buildProjectBuildPack`, replace the current verification checklist items:

```ts
"Run npm run lint and address any new violations.",
"Run npm run typecheck and resolve any new errors.",
"Run npm test and confirm the primary workflow has at least one focused test.",
"Manually run the first milestone end to end before claiming it works.",
"Update BUILD_PLAN.md checkboxes with what is actually done."
```

with:

```ts
"Run the starter repo's documented install, build, dev, and test commands from its README, package files, Makefile, Docker files, or equivalent setup docs.",
"If a lint, typecheck, or test script is missing, record that instead of inventing one.",
"Manually run the first milestone end to end before claiming it works.",
"Add focused automated coverage or a written manual QA path for the primary workflow.",
"Update BUILD_PLAN.md checkboxes with what is actually done and what is blocked."
```

- [ ] **Step 6: Run targeted tests**

Run:

```bash
npm test -- src/lib/build-pack/generator.test.ts
```

Expected: PASS after updating older expectations that looked for npm commands.

---

### Task 6: Improve License/Data/IP Warnings

**Files:**
- Modify: `src/lib/build-pack/generator.ts`
- Modify: `src/lib/build-pack/generator.test.ts`

- [ ] **Step 1: Strengthen AGPL wording**

Replace the GPL branch in `licenseReuseNote`:

```ts
return `${repo.license} may add reciprocal obligations. Confirm compatibility before copying code into a closed or differently licensed project.`;
```

with:

```ts
if (license.includes("AGPL")) {
  return `${repo.license} may add network-use source sharing obligations. Confirm compatibility before copying, hosting, or turning this into a closed or differently licensed product.`;
}
return `${repo.license} may add reciprocal obligations. Confirm compatibility before copying code into a closed or differently licensed project.`;
```

- [ ] **Step 2: Add domain risk notes**

Add this helper:

```ts
function domainReuseRiskNote(originalIdea: string, repo: BuildPackRepo | undefined): string | null {
  const text = `${originalIdea} ${repoHaystack(repo)}`;
  if (/\b(pokemon|pokémon|tcg|trading cards?|tcgdex|tcgplayer|cardmarket)\b/i.test(text)) {
    return "Card-product risk: use original branding, avoid official logos or copied product UI, confirm card-image and pricing API terms, and label values as estimates until data refresh and provider terms are verified.";
  }
  return null;
}
```

Inside `buildProjectBuildPack`, create:

```ts
const domainRiskNote = domainReuseRiskNote(originalIdea, bestRepo);
```

In `## License And Reuse`, change:

```ts
bestRepo ? licenseReuseNote(bestRepo) : "No starter repo was selected, so no reuse rights have been confirmed.",
```

to:

```ts
bestRepo ? licenseReuseNote(bestRepo) : "No starter repo was selected, so no reuse rights have been confirmed.",
...(domainRiskNote ? [``, domainRiskNote] : []),
```

- [ ] **Step 3: Run targeted tests**

Run:

```bash
npm test -- src/lib/build-pack/generator.test.ts
```

Expected: PASS.

---

### Task 7: Regenerate and Compare the Pokemon Build Pack

**Files:**
- No source files if the app already has the flow available.
- Optional scratch only: use temp files under `%TEMP%`, not committed.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 2: Start the app locally**

Run:

```bash
npm run dev -- --port 3051
```

Expected: app starts on `http://127.0.0.1:3051`.

- [ ] **Step 3: Use the same Pokemon prompt**

In the app, run:

```text
I want an app like the Pokemon Collectors app, an app that can show me how much my Pokemon cards are worth and have a collector's album and whatever else is helpful that you think could be put into that. Can you help me with that?
```

Expected:
- Search queries include Pokemon/TCG collection manager terms.
- `Git-Romer/pokecollector` or another true card-collection repo appears as a strong candidate.
- Irrelevant font/security awesome-list repos do not appear as recommended alternates.

- [ ] **Step 4: Export the Build Pack and compare against the old zip**

Expected new Build Pack improvements:
- The selected repo is treated as a foundation candidate or strong reference, not a weak generic lead.
- `PRD.md` is about the collector app, not generic prompt-pack rules.
- `STARTER_REPO.md` includes a `Foundation Coverage Map`.
- The plan says what already exists in the repo: card search, collection/vault, pricing/value, binder/wishlist/grouping, backup/export, scanner if detected, frontend/backend/database/Docker if detected.
- The plan says what to replace: name, visual design, product copy, sample data, copied app feel.
- The plan says what to add or customize: wife/user-specific collector flow, original look, backup/export, estimated values, simpler v1.
- AGPL and card data/IP risks are visible.
- Verification tells the builder to use documented repo commands, not blindly run `npm run lint`.

- [ ] **Step 5: Commit**

Run:

```bash
git status --short
git add src/lib/search/planner.ts src/lib/search/planner.test.ts src/lib/idea-check/enrich-candidates.ts src/lib/idea-check/enrich-candidates.test.ts src/lib/idea-check/run.ts src/lib/build-pack/generator.ts src/lib/build-pack/generator.test.ts src/components/prompt-packs-panel.tsx docs/superpowers/plans/2026-05-20-launch-quality-build-packs.md
git commit -m "Improve launch build pack quality"
```

Expected: commit succeeds with only intended files staged.

---

## Execution Notes

- This plan intentionally avoids adding a new LLM call to the Build Pack generator. It is cheaper, faster, more testable, and safer for launch.
- After this lands, ForkFirst still can use AI for summaries/verdicts when a user provides a key, but the no-key/demo path should produce a much more useful foundation handoff.
- The strongest quality bar is the Pokemon collector case: if the new pack makes a builder understand "start from this foundation, keep these working features, rebrand/refocus it, check AGPL/API/IP risk, then ship the collector loop," the launch behavior is moving in the right direction.
