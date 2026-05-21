import { describe, expect, test } from "vitest";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import type { IdeaCheckResult } from "@/types/idea-check";
import { buildProjectBuildPack, notToBuildInV1 } from "./generator";
import { auditBuildPackQuality } from "./quality";

const REQUIRED_SECTIONS = [
  "# STARTER_REPO",
  "## Selected Foundation",
  "## Clone Or Fork Commands",
  "## File Inspection Checklist",
  "## Original Idea",
  "## Product Thesis",
  "## Brand And Design Brief",
  "## Target User Segment",
  "## Job To Be Done",
  "## Primary Workflow",
  "## Key Screens / Surfaces",
  "## Core Data Objects",
  "## MVP Requirements",
  "## Skip In v1",
  "## Trust, Privacy, And Safety",
  "## Repo Research Notes",
  "## License And Reuse",
  "## First Milestone",
  "## Wow Demo Script",
  "## Verification Checklist",
  "## Prompt To Start"
];

function expectAllRequiredSections(markdown: string): void {
  for (const section of REQUIRED_SECTIONS) {
    expect(markdown).toContain(section);
  }
}

function makeResult(overrides: Partial<IdeaCheckResult>, repoOverrides: Partial<ClassifiedRepo> = {}): IdeaCheckResult {
  return {
    id: "1",
    prompt: "Original idea: build something",
    createdAt: "2026-01-01T00:00:00Z",
    queries: [],
    warnings: [],
    verdict: "fork_candidate_found",
    verdictLabel: "Fork candidate found",
    summary: "A useful repo exists.",
    confidence: 70,
    mode: "demo",
    gaps: [],
    repos: [{ ...repo(), ...repoOverrides }],
    ...overrides
  };
}

function repo(): ClassifiedRepo {
  return {
    id: 1,
    owner: "owner",
    name: "starter",
    fullName: "owner/starter",
    url: "https://github.com/owner/starter",
    description: "A starter app for validating ideas.",
    language: "TypeScript",
    topics: [],
    stars: 1200,
    forks: 100,
    openIssues: 3,
    license: "MIT",
    pushedAt: "2026-01-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    archived: false,
    homepage: null,
    category: "forkable",
    score: { total: 82, fit: 80, activity: 80, popularity: 80, license: 80, docs: 80, reasons: ["Strong keyword fit"] },
    summary: "Strong lead",
    readme: {
      excerpt: "Install with npm, run the demo, and inspect the examples folder before adapting the starter.",
      url: "https://github.com/owner/starter#readme",
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: false,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 82,
      reasons: ["Setup path found", "Examples found"]
    }
  };
}

function result(): IdeaCheckResult {
  return {
    id: "1",
    prompt: "Build an open-source repo discovery app",
    createdAt: "2026-01-01T00:00:00Z",
    queries: [],
    warnings: [],
    verdict: "fork_candidate_found",
    verdictLabel: "Fork candidate found",
    summary: "A useful repo exists.",
    confidence: 82,
    mode: "demo",
    gaps: ["Differentiate with workflow"],
    repos: [repo()]
  };
}

describe("build pack generator", () => {
  test("generates Codex-specific project context", () => {
    const markdown = buildProjectBuildPack(result(), "codex");

    expect(markdown).toContain("Target builder: Codex");
    expect(markdown).toContain("# AGENTS");
    expect(markdown).toContain("owner/starter");
    expect(markdown).toContain("Acceptance Criteria");
    expect(markdown).toContain("- [ ] Inspect the current repo before editing and summarize what already exists.");
  });

  test("generates Claude Code-specific instructions", () => {
    const markdown = buildProjectBuildPack(result(), "claude-code");

    expect(markdown).toContain("Target builder: Claude Code");
    expect(markdown).toContain("CLAUDE.md");
  });

  test("exports separate builder handoff documents", () => {
    const markdown = buildProjectBuildPack(result(), "codex");

    expect(markdown).toContain("# PRD");
    expect(markdown).toContain("# STARTER_REPO");
    expect(markdown).toContain("# BUILD_PLAN");
    expect(markdown).toContain("# REPO_STARTER_NOTES");
    expect(markdown).toContain("# AGENTS");
    expect(markdown).toContain("## License And Reuse");
    expect(markdown).toContain("MIT");
  });

  test("includes concrete PRD and repo reuse evidence from the idea result", () => {
    const markdown = buildProjectBuildPack(result(), "codex");

    expect(markdown).toContain("## Snapshot\n- Verdict: Fork candidate found (82% confidence)");
    expect(markdown).toContain("- Summary: Fork candidate: owner/starter is the first repo to inspect from this pass. Fit score: 80%.");
    expect(markdown).toContain("- [ ] Differentiate with workflow");
    expect(markdown).toContain("- Score: total 82%, fit 80%, activity 80%, popularity 80%, license 80%, docs 80%");
    expect(markdown).toContain("- Activity snapshot: 1,200 stars, 100 forks, 3 open issues, last pushed 2026-01-01");
    expect(markdown).toContain("- README signals: setup docs, examples, local development notes");
    expect(markdown).toContain("git clone https://github.com/owner/starter");
    expect(markdown).toContain("- [ ] README and setup docs for owner/starter.");
    expect(markdown).toContain("## Recommended Repo Decision");
    expect(markdown).toContain("- [ ] Record setup, license, and architecture evidence in REPO_STARTER_NOTES.md before implementation.");
  });

  test("turns build phases and verification into editable checklists", () => {
    const markdown = buildProjectBuildPack(result(), "claude-code");

    expect(markdown).toContain("### Phase 0 - Clone Foundation And Add Handoff Files");
    expect(markdown).toContain("- [ ] Create STARTER_REPO.md, PRD.md, BUILD_PLAN.md, REPO_STARTER_NOTES.md, and CLAUDE.md in the cloned repo root from this combined handoff packet.");
    expect(markdown).toContain("- [ ] Copy/split the relevant sections yourself without asking the user to manually arrange the Markdown.");
    expect(markdown).toContain("### Phase 2 - Smallest Product Loop");
    expect(markdown).toContain("## Verification Checklist");
    expect(markdown).toContain("- [ ] Run the starter repo's documented install, build, dev, and test commands");
    expect(markdown).toContain("- [ ] If lint, typecheck, or test scripts are missing, record that instead of inventing commands.");
    expect(markdown).toContain("- [ ] Add focused automated tests or a manual QA checklist for the primary workflow");
  });

  test("cleans follow-up lookup noise out of the handoff", () => {
    const lookupResult = {
      ...result(),
      prompt:
        "Build an open-source repo discovery app\n\nFollow-up refinement: Find more GitHub repos and alternatives for this idea. Avoid repeating the same top three when possible.\n\nOriginal idea: I want to build a ChatGPT-like app that tells me if my idea already exists on GitHub and finds the best repo to start from."
    };

    const markdown = buildProjectBuildPack(lookupResult, "codex");

    expect(markdown).toContain(
      "## Original Idea\nI want to build a ChatGPT-like app that tells me if my idea already exists on GitHub and finds the best repo to start from."
    );
    expect(markdown).not.toContain("Find more GitHub repos and alternatives");
    expect(markdown).not.toContain("Avoid repeating the same top three");
    expect(markdown).not.toContain("## Original Idea\nBuild an open-source repo discovery app\n\nFollow-up refinement");
    expect(markdown).toContain("clear reuse decision, repo evidence, and a build-ready plan");
  });

  test("keeps a realtor image-generator build pack focused on the actual product", () => {
    const lowFitRepo = {
      ...repo(),
      fullName: "erxes/erxes",
      url: "https://github.com/erxes/erxes",
      description: "Experience Operating System for marketing, sales, operations, and support.",
      category: "reference" as const,
      score: { total: 65, fit: 5, activity: 100, popularity: 100, license: 100, docs: 100, reasons: ["Weak idea fit"] }
    };
    const realtorResult: IdeaCheckResult = {
      ...result(),
      prompt:
        "I want to make an image generator for realtors.\n\nFollow-up refinement: Find more GitHub repos similar to AleksNeStu/ai-real-estate-assistant.\n\nOriginal idea: I want to make an image generator for realtors.",
      queries: [
        "real estate crm in:name,description,readme",
        "real estate marketing in:name,description,readme",
        "open source voice assistant in:name,description,readme"
      ],
      repos: [lowFitRepo],
      verdictLabel: "Fork Candidate Found",
      confidence: 72
    };

    const markdown = buildProjectBuildPack(realtorResult, "codex");

    expect(markdown).toContain("## Original Idea\nI want to make an image generator for realtors.");
    expect(markdown).toContain("Help realtors turn a listing, property photo, or marketing prompt into usable branded visuals");
    expect(markdown).toContain("A realtor, real-estate marketer, or solo agent");
    expect(markdown).toContain("- Verdict: Needs more focused research");
    expect(markdown).toContain("Fit score: 5%");
    expect(markdown).toContain("erxes/erxes is a research lead only");
    expect(markdown).toContain("real estate marketing in:name,description,readme");
    expect(markdown).not.toContain("open source voice assistant");
    expect(markdown).toContain("You are building the product described in Original Idea, not ForkFirst itself.");
  });

  test("includes every required Build Pack section for a default idea", () => {
    const markdown = buildProjectBuildPack(result(), "codex");
    expectAllRequiredSections(markdown);
    expect(markdown).toContain("## Primary Workflow\n1. ");
  });

  test("turns brand answers and chat context into builder constraints", () => {
    const markdown = buildProjectBuildPack(result(), "codex", repo(), {
      productName: "JobShelf",
      audience: "solo founders applying to jobs",
      vibe: "calm and editorial",
      accentColor: "#2647F0",
      skipInV1: ["Billing"],
      chatContext: "user: I want CSV export and a calm mobile flow."
    });

    expect(markdown).toContain("Focused on: owner/starter");
    expect(markdown).toContain("- Product name: JobShelf");
    expect(markdown).toContain("- Audience: solo founders applying to jobs");
    expect(markdown).toContain("- Brand vibe: calm and editorial");
    expect(markdown).toContain("- Accent color: #2647F0");
    expect(markdown).toContain("- Conversation context: user: I want CSV export and a calm mobile flow.");
    expect(markdown).toContain("- Billing");
    expect(markdown).toContain("- Product promise to express in the UI:");
    expect(markdown).toContain("git clone https://github.com/owner/starter jobshelf");
  });

  test("uses the chosen focus repo as the clone foundation", () => {
    const selectedRepo: ClassifiedRepo = {
      ...repo(),
      id: 2,
      owner: "chosen",
      name: "better-base",
      fullName: "chosen/better-base",
      url: "https://github.com/chosen/better-base",
      score: { ...repo().score, fit: 92 }
    };
    const markdown = buildProjectBuildPack(
      { ...result(), repos: [repo(), selectedRepo] },
      "claude-code",
      selectedRepo
    );

    expect(markdown).toContain("Focused on: chosen/better-base");
    expect(markdown).toContain("- Repo: chosen/better-base");
    expect(markdown).toContain("git clone https://github.com/chosen/better-base");
    expect(markdown).not.toContain("- Repo: owner/starter");
  });

  test("realtor image generator prompt produces a domain-specific Build Pack", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: I want to make an image generator for realtors."
      }),
      "codex"
    );

    expectAllRequiredSections(markdown);
    expect(markdown).toContain("## Original Idea\nI want to make an image generator for realtors.");
    expect(markdown).toContain("Help realtors turn a listing");
    expect(markdown).toContain("listing hero");
    expect(markdown).toMatch(/Direct MLS data ingestion|Automated posting to Instagram/);
    expect(markdown).not.toMatch(/\bnotebook app\b|\bCursor alternative\b|\bClickUp\b/i);
  });

  test("open-source ClickUp prompt produces a project-tool Build Pack", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: I want an open-source version of ClickUp."
      }),
      "codex"
    );

    expectAllRequiredSections(markdown);
    expect(markdown).toContain("ClickUp");
    expect(markdown).toMatch(/task and project tracker|task board|board view/i);
    expect(markdown).toMatch(/Multi-tenant SaaS billing|seats|organization admin/i);
    expect(markdown).not.toMatch(/\brealtor\b|\bnotebook\b|\bvoice assistant\b|\bCursor alternative\b/i);
  });

  test("WhisperFlow-style voice assistant prompt produces a voice-tool Build Pack", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: I want to build a voice assistant like WhisperFlow."
      }),
      "claude-code"
    );

    expectAllRequiredSections(markdown);
    expect(markdown).toContain("WhisperFlow");
    expect(markdown).toMatch(/Whisper|transcribe|transcript/i);
    expect(markdown).toMatch(/System-wide global hotkey|real-time live captioning|custom voice training/i);
    expect(markdown).not.toMatch(/\brealtor\b|\bClickUp\b|\bnotebook app\b|\btask board\b/i);
  });

  test("Obsidian-style notebook prompt produces a notes-tool Build Pack", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: I want to build a notebook app like Obsidian."
      }),
      "codex"
    );

    expectAllRequiredSections(markdown);
    expect(markdown).toContain("Obsidian");
    expect(markdown).toMatch(/Markdown|backlink|wiki-link/i);
    expect(markdown).toMatch(/Cloud sync|Mobile apps|Plugin marketplace/i);
    expect(markdown).not.toMatch(/\brealtor\b|\bClickUp\b|\bvoice assistant\b|\bCursor alternative\b/i);
  });

  test("AI lead-gen for real-estate agents prompt produces a real-estate lead Build Pack", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: I want to build an AI lead-gen tool for real estate agents."
      }),
      "codex"
    );

    expectAllRequiredSections(markdown);
    expect(markdown).toMatch(/realtor|real-estate|real estate/i);
    expect(markdown).toMatch(/lead|prospect/i);
    expect(markdown).toMatch(/MLS|Zillow|Realtor\.com|terms of service/i);
    expect(markdown).not.toMatch(/\bnotebook app\b|\bClickUp\b|\bvoice assistant\b|\bCursor alternative\b/i);
  });

  test("roofing CRM prompt produces a contractor-specific CRM Build Pack", () => {
    const markdown = buildProjectBuildPack(
      makeResult(
        {
          prompt: "Original idea: I want to build a simple CRM for a roofing company.",
          queries: ["roofing crm app in:name,description,readme"]
        },
        {
          owner: "go2ismail",
          name: "Free-CRM",
          fullName: "go2ismail/Free-CRM",
          description: "Open-source customer relationship management CRM software for contacts, companies, notes, and tasks.",
          topics: ["crm", "customer-management"],
          readme: {
            ...repo().readme!,
            excerpt: "Free CRM with contacts, companies, tasks, notes, sales, and customer management."
          }
        }
      ),
      "codex"
    );

    expectAllRequiredSections(markdown);
    expect(markdown).toMatch(/roofing|contractor|service business/i);
    expect(markdown).toMatch(/lead|estimate|job|follow-up|customer/i);
    expect(markdown).not.toMatch(/repo evidence|PrimaryItem|UserInput|one working product loop/i);
  });

  test("cleaning company operations prompt produces a domain-specific Build Pack", () => {
    const idea = "I want an app for a cleaning company to manage quotes, jobs, crews, and follow-ups";
    const markdown = buildProjectBuildPack(
      makeResult(
        {
          prompt: `Original idea: ${idea}`,
          queries: [
            "cleaning business management app in:name,description,readme",
            "cleaning company scheduling app in:name,description,readme"
          ],
          verdictLabel: "Needs more focused research",
          confidence: 55
        },
        {
          owner: "invoicerr-app",
          name: "invoicerr",
          fullName: "invoicerr-app/invoicerr",
          description: "Invoicerr is an invoicing application for quotes, invoices, payments, customers, and signatures.",
          topics: ["invoices", "quotes", "customers"],
          score: { ...repo().score, total: 64, fit: 14 },
          readme: {
            ...repo().readme!,
            excerpt: "Create quotes, generate invoices, track payments, collect signatures, REST API backend, Docker setup."
          }
        }
      ),
      "codex"
    );

    expectAllRequiredSections(markdown);
    expect(markdown).toMatch(/cleaning company|cleaning business/i);
    expect(markdown).toMatch(/quote|job|crew|follow-up/i);
    expect(markdown).toMatch(/Customer|Quote|Job|Crew|FollowUpTask/i);
    expect(markdown).not.toMatch(/PrimaryItem|UserInput|one working product loop|User starts the primary task/i);
    expect(auditBuildPackQuality({ idea, markdown }).issues.map((issue) => issue.id)).not.toContain("generic-handoff");
  });

  test("realtor scraping prompt produces lead follow-up Build Pack instead of image workflow", () => {
    const markdown = buildProjectBuildPack(
      makeResult(
        {
          prompt: "Original idea: I want an app that helps realtors scrape leads and organize follow-ups.",
          queries: ["real estate lead generation in:name,description,readme", "realtor crm leads in:name,description,readme"]
        },
        {
          owner: "omkarcloud",
          name: "google-maps-scraper",
          fullName: "omkarcloud/google-maps-scraper",
          description: "Google Maps scraper and lead generation tool with business emails, phone numbers, social profiles, and API access.",
          topics: ["scraper", "lead-generation", "real-estate"],
          readme: {
            ...repo().readme!,
            excerpt: "Extract businesses, phone numbers, websites, and social profiles for lead research."
          },
          category: "reference",
          score: { ...repo().score, total: 75, fit: 43 }
        }
      ),
      "codex"
    );

    expectAllRequiredSections(markdown);
    expect(markdown).toMatch(/realtor|real estate/i);
    expect(markdown).toMatch(/lead|source|qualify|follow-up|consent|terms/i);
    expect(markdown).not.toMatch(/listing hero|image prompt|visual concepts|property photo/i);
  });

  test("Shopify dashboard prompt produces ecommerce analytics Build Pack", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: I want a dashboard for tracking Shopify store profit, ad spend, and inventory.",
        queries: ["shopify analytics dashboard in:name,description,readme", "ecommerce profit dashboard in:name,description,readme"],
        repos: [
          {
            ...repo(),
            owner: "openthc",
            name: "pos",
            fullName: "openthc/pos",
            description: "Software solutions for retail POS, CRM, delivery, ordering, inventory, and reporting.",
            topics: ["retail", "pos", "inventory"],
            category: "reference",
            score: { ...repo().score, total: 68, fit: 25 }
          }
        ]
      }),
      "codex"
    );

    expectAllRequiredSections(markdown);
    expect(markdown).toMatch(/Shopify|ecommerce|store/i);
    expect(markdown).toMatch(/profit|ad spend|inventory|orders|margin/i);
    expect(markdown).not.toMatch(/lead source|target customer|outreach|PrimaryItem|UserInput/i);
  });

  test("open-source Cursor alternative prompt produces a code-editor Build Pack", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: Is there an open-source Cursor alternative?"
      }),
      "claude-code"
    );

    expectAllRequiredSections(markdown);
    expect(markdown).toContain("Cursor");
    expect(markdown).toMatch(/inline completion|diff|edit/i);
    expect(markdown).toMatch(/Multi-file agentic refactors|hosted accounts|marketplace/i);
    expect(markdown).not.toMatch(/\brealtor\b|\bnotebook app\b|\bvoice assistant\b|\bClickUp\b/i);
  });

  test("flags weak repo matches as research leads, not safe forks", () => {
    const weakRepo: ClassifiedRepo = {
      ...repo(),
      fullName: "owner/loosely-related",
      url: "https://github.com/owner/loosely-related",
      category: "reference",
      score: { total: 30, fit: 12, activity: 60, popularity: 60, license: 60, docs: 50, reasons: ["Loose match"] }
    };
    const markdown = buildProjectBuildPack(
      makeResult(
        {
          prompt: "Original idea: I want to make an image generator for realtors.",
          repos: [weakRepo],
          verdictLabel: "Fork candidate found",
          confidence: 60
        }
      ),
      "codex"
    );

    expect(markdown).toContain("- Verdict: Needs more focused research");
    expect(markdown).toContain("owner/loosely-related is a research lead only");
    expect(markdown).not.toMatch(/owner\/loosely-related is a fork candidate/i);
  });

  test("does not pretend a starter repo is license-cleared", () => {
    const unlicensedRepo: ClassifiedRepo = {
      ...repo(),
      license: null,
      score: { ...repo().score, fit: 80 }
    };
    const markdown = buildProjectBuildPack(
      makeResult({ prompt: "Original idea: build a niche workflow tool", repos: [unlicensedRepo] }),
      "codex"
    );

    expect(markdown).toMatch(/No license was detected/i);
    expect(markdown).toContain("Do not copy third-party code until license and attribution are documented.");
  });

  test("notToBuildInV1 does not emit a fallback bullet for unclassified gaps", () => {
    // Bug 2 guard: unrecognized gaps must not produce a raw "Anything directly related to:" bullet
    const gappyResult = makeResult({
      gaps: [
        "Differentiate with saved research cases and deep product context that competitors skip.",
        "Some unrelated product nuance that does not classify neatly."
      ]
    });
    const bullets = notToBuildInV1(gappyResult);
    for (const bullet of bullets) {
      expect(bullet).not.toMatch(/Anything directly related to:/i);
      // Each bullet must end at a word boundary (no mid-word truncation)
      expect(bullet).toMatch(/[a-zA-Z0-9.)"']$/);
    }
  });

  test("Skip In v1 section dedupes and does not repeat the same concept twice", () => {
    // Bug 1 guard: merged section must not contain near-duplicate entries
    const markdown = buildProjectBuildPack(result(), "codex");

    expect(markdown).not.toContain("## Not In First Version");
    expect(markdown).not.toContain("## What NOT To Build In v1");
    expect(markdown).toContain("## Skip In v1");

    // Extract the Skip In v1 section
    const skipSection = markdown.split("## Skip In v1")[1]?.split("##")[0] ?? "";
    const bullets = skipSection.split("\n").filter((line) => line.startsWith("- "));
    // No exact duplicates
    const unique = new Set(bullets);
    expect(unique.size).toBe(bullets.length);
    // Capped at 6
    expect(bullets.length).toBeLessThanOrEqual(6);
  });

  test("Skip In v1 section does not contain enterprise jargon", () => {
    const markdown = buildProjectBuildPack(result(), "codex");
    expect(markdown).not.toContain("SBOM");
    expect(markdown).not.toContain("legal clearance claims");
    expect(markdown).not.toContain("third-party AI app store integrations");
    expect(markdown).not.toContain("Background crawling or scraping of GitHub beyond the documented search API");
  });

  test("Pokemon collector prompt produces a card-specific product handoff with IP and data risks", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: I want to build a Pokemon card collection tracker like Pokemon Collector.",
        repos: [
          {
            ...repo(),
            fullName: "cards/pokemon-collector",
            url: "https://github.com/cards/pokemon-collector",
            description: "Pokemon TCG collection manager with card search, binder, pricing, and export.",
            topics: ["pokemon", "tcg", "cards", "collection", "pricing"]
          }
        ]
      }),
      "codex"
    );

    expect(markdown).toMatch(/card search|search cards/i);
    expect(markdown).toMatch(/detail.*value|value.*detail/i);
    expect(markdown).toMatch(/collection vault|album|binder/i);
    expect(markdown).toMatch(/condition|quantity|purchase price|notes/i);
    expect(markdown).toMatch(/total estimated value/i);
    expect(markdown).toMatch(/backup|export/i);
    expect(markdown).toMatch(/original branding/i);
    expect(markdown).toMatch(/do not copy Pokemon Collector/i);
    expect(markdown).toMatch(/official logos|copied product UI/i);
    expect(markdown).toMatch(/card-image|pricing API terms/i);
    expect(markdown).toMatch(/values as estimates/i);
  });

  test("Build Pack includes typed alignment decisions before builder instructions", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: I want to build a Pokemon card collection tracker like Pokemon Collector.",
        repos: [
          {
            ...repo(),
            fullName: "cards/pokemon-collector",
            url: "https://github.com/cards/pokemon-collector",
            description: "Pokemon TCG collection manager with card search, binder, pricing, and export.",
            topics: ["pokemon", "tcg", "cards", "collection", "pricing"],
            readme: {
              ...repo().readme!,
              excerpt: "Card search, binder management, wishlist, TCGPlayer prices, CSV export, backup and restore.",
              evidence: {
                fetchStatus: "ok",
                fetchedAt: "2026-05-21T00:00:00Z",
                setupSnippets: ["pnpm install and pnpm dev"],
                commandSnippets: ["pnpm test"],
                featureSnippets: ["card search, binder management, wishlist, price history, CSV export"],
                integrationSnippets: ["TCGPlayer price integration"],
                licenseSnippets: ["MIT"]
              }
            }
          }
        ]
      }),
      "codex"
    );

    const alignment = markdown.split("## Alignment Decisions")[1]?.split("## Foundation Coverage Map")[0] ?? "";
    expect(alignment).toContain("| Decision | Product Need | Repo Capability | Evidence | Builder Instruction |");
    expect(alignment).toMatch(/\|\s*Keep\s*\|/i);
    expect(alignment).toMatch(/\|\s*Replace\s*\|/i);
    expect(alignment).toMatch(/\|\s*Add\s*\|/i);
    expect(alignment).toMatch(/\|\s*Remove\s*\|/i);
    expect(alignment).toMatch(/\|\s*Inspect\s*\|/i);
    expect(alignment).toMatch(/card search|binder|TCGPlayer/i);
    expect(alignment).not.toMatch(/PrimaryItem|UserInput/);
  });

  test("receipt scanner expense prompt produces a concrete local-first handoff", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: I want to build a local-first receipt scanner that tracks expenses and exports to CSV",
        queries: ["receipt scanner expense tracker csv in:name,description,readme"],
        repos: [
          {
            ...repo(),
            fullName: "simonwep/ocular",
            url: "https://github.com/simonwep/ocular",
            description: "Ocular is an open-source budgeting tracking app to track your budget across the years.",
            topics: ["budget", "expense", "csv", "self-hosted"],
            readme: {
              ...repo().readme!,
              excerpt: "Self-hosted budgeting app. Import data from Google Sheets annual planner and export as json.",
              evidence: {
                fetchStatus: "ok",
                fetchedAt: "2026-05-21T00:00:00Z",
                setupSnippets: ["Deploy via Docker in seconds"],
                commandSnippets: ["docker compose up"],
                featureSnippets: ["budget tracking, expense history, import, export"],
                integrationSnippets: ["Google Sheets import and JSON export"],
                licenseSnippets: ["MIT"]
              }
            }
          }
        ]
      }),
      "codex"
    );

    expect(markdown).toMatch(/receipt/i);
    expect(markdown).toMatch(/OCR|manual entry/i);
    expect(markdown).toMatch(/ExpenseRecord|ReceiptImage|CsvExport/i);
    expect(markdown).toMatch(/local-first|browser storage|CSV/i);
    expect(markdown).toMatch(/Review parsed receipt|expense list|CSV export/i);
    expect(markdown).not.toMatch(/PrimaryItem|UserInput|User starts the primary task|one working product loop/i);
    expect(auditBuildPackQuality({ idea: "I want to build a local-first receipt scanner that tracks expenses and exports to CSV", markdown }).passed).toBe(true);
  });

  test("generic trading-card prompts avoid Pokemon-specific product copy", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: I want to build an MTG and sports-card tracker.",
        repos: [
          {
            ...repo(),
            fullName: "cards/trading-vault",
            description: "Trading card collection manager with binder, pricing, and export.",
            topics: ["tcg", "sports-cards", "collection", "pricing"]
          }
        ]
      }),
      "codex"
    );

    expect(markdown).toMatch(/trading-card|sports-card|collectibles collector/i);
    expect(markdown).toMatch(/collection vault|album|binder/i);
    expect(markdown).toContain("## Foundation Coverage Map");
    expect(markdown).toContain("card search/catalog");
    expect(markdown).toContain("collection/vault");
    expect(markdown).toContain("pricing/value estimates");
    expect(markdown).toMatch(/official league|brand|logo/i);
    expect(markdown).not.toContain("Pokemon Collector");
    expect(markdown).not.toContain("official Pokemon logos");
    expect(markdown).not.toContain("Pokemon TCG or trading-card collector");
  });

  test("cleans untrusted repo tags and adds a foundation coverage map", () => {
    const taggedRepo: ClassifiedRepo = {
      ...repo(),
      description: "<UNTRUSTED_REPO_CONTENT>Pokemon TCG card catalog, collection vault, wishlist, pricing dashboard, export, scanner, API, database, and Docker setup.</UNTRUSTED_REPO_CONTENT>",
      topics: ["pokemon", "tcg", "collection", "pricing", "docker"],
      readme: {
        ...repo().readme!,
        excerpt: "<UNTRUSTED_REPO_CONTENT>React frontend with binder groups, value analytics, backup export, image-assisted entry, backend API, SQLite persistence.</UNTRUSTED_REPO_CONTENT>"
      }
    };

    const markdown = buildProjectBuildPack(
      makeResult({ prompt: "Original idea: Pokemon card collection vault", repos: [taggedRepo] }),
      "codex"
    );

    expect(markdown).not.toContain("<UNTRUSTED_REPO_CONTENT>");
    expect(markdown).not.toContain("</UNTRUSTED_REPO_CONTENT>");
    expect(markdown).toContain("## Foundation Coverage Map");
    expect(markdown).toContain("Already detected:");
    expect(markdown).toContain("card search/catalog");
    expect(markdown).toContain("collection/vault");
    expect(markdown).toContain("binder/wishlist/grouping");
    expect(markdown).toContain("pricing/value estimates");
    expect(markdown).toContain("export/backup");
    expect(markdown).toContain("scanner/image-assisted entry");
    expect(markdown).toContain("analytics/dashboard");
    expect(markdown).toContain("frontend shell");
    expect(markdown).toContain("backend/API");
    expect(markdown).toContain("database/persistence");
    expect(markdown).toContain("Docker/local setup");
    expect(markdown).toContain("Keep first:");
    expect(markdown).toContain("Replace/rebrand:");
    expect(markdown).toContain("Add/customize:");
    expect(markdown).toContain("Remove/defer:");
    expect(markdown).toContain("Risk checks:");
  });

  test("cleans untrusted markers from differentiation gaps", () => {
    const markdown = buildProjectBuildPack(
      makeResult({
        gaps: [
          "<UNTRUSTED_REPO_CONTENT>Differentiate with a focused collection workflow.</UNTRUSTED_REPO_CONTENT>"
        ]
      }),
      "codex"
    );

    expect(markdown).not.toContain("<UNTRUSTED_REPO_CONTENT>");
    expect(markdown).not.toContain("</UNTRUSTED_REPO_CONTENT>");
    expect(markdown).toContain("- [ ] Differentiate with a focused collection workflow.");
  });

  test("summarizes prompt packs under builder rules instead of dumping raw packs into PRD", () => {
    const promptPackMarkdown = [
      "## Repo Orientation",
      "This exact raw prompt pack text should not be dumped into the PRD.",
      "- Inspect every route and component before editing.",
      "## Test-First Verification",
      "- Run the relevant test before and after every change."
    ].join("\n");

    const markdown = buildProjectBuildPack(result(), "codex", undefined, undefined, promptPackMarkdown);
    const prd = markdown.split("# BUILD_PLAN")[0] ?? "";
    const agents = markdown.split("# AGENTS")[1] ?? "";

    expect(prd).not.toContain("## Prompt Packs");
    expect(prd).not.toContain("This exact raw prompt pack text should not be dumped into the PRD.");
    expect(agents).toContain("## Builder Rule Packs");
    expect(agents).toContain("Repo Orientation");
    expect(agents).not.toContain("This exact raw prompt pack text should not be dumped into the PRD.");
    expect(agents).toContain("Inspect every route and component before editing.");
    expect(agents).toContain("Test-First Verification");
  });

  test("filters unrelated also-worth-checking repos when a focus repo is selected", () => {
    const focus: ClassifiedRepo = {
      ...repo(),
      id: 2,
      fullName: "cards/tcg-vault",
      url: "https://github.com/cards/tcg-vault",
      description: "Pokemon TCG collection vault with card search and pricing.",
      topics: ["pokemon", "tcg", "cards", "collection"],
      score: { ...repo().score, fit: 92 }
    };
    const unrelatedFonts: ClassifiedRepo = {
      ...repo(),
      id: 3,
      fullName: "fontsource/fontsource",
      url: "https://github.com/fontsource/fontsource",
      description: "Self-host open source fonts.",
      topics: ["fonts", "typography"],
      score: { ...repo().score, fit: 0 }
    };
    const unrelatedSecurity: ClassifiedRepo = {
      ...repo(),
      id: 4,
      fullName: "security/awesome-security",
      url: "https://github.com/security/awesome-security",
      description: "Awesome security links.",
      topics: ["security", "awesome-list"],
      score: { ...repo().score, fit: 0 }
    };

    const markdown = buildProjectBuildPack(
      makeResult({
        prompt: "Original idea: Pokemon card collection tracker",
        repos: [focus, unrelatedFonts, unrelatedSecurity]
      }),
      "codex",
      focus
    );

    expect(markdown).toContain("cards/tcg-vault");
    expect(markdown).not.toContain("fontsource/fontsource");
    expect(markdown).not.toContain("security/awesome-security");
  });

  test("verification checklist is repo-aware instead of inventing npm scripts", () => {
    const markdown = buildProjectBuildPack(result(), "codex");

    expect(markdown).not.toContain("Run npm run lint and address any new violations.");
    expect(markdown).not.toContain("Run npm run typecheck and resolve any new errors.");
    expect(markdown).not.toContain("Run npm test and confirm the primary workflow has at least one focused test.");
    expect(markdown).toContain("Run the starter repo's documented install, build, dev, and test commands");
    expect(markdown).toContain("If lint, typecheck, or test scripts are missing, record that instead of inventing commands.");
    expect(markdown).toContain("Manually run the first milestone end to end");
    expect(markdown).toContain("Add focused automated tests or a manual QA checklist");
  });

  test("AGPL license notes call out network-use source-sharing obligations", () => {
    const agplRepo: ClassifiedRepo = {
      ...repo(),
      license: "AGPL-3.0"
    };

    const markdown = buildProjectBuildPack(
      makeResult({ prompt: "Original idea: build a niche workflow tool", repos: [agplRepo] }),
      "codex"
    );

    expect(markdown).toContain("AGPL-3.0");
    expect(markdown).toMatch(/network use|source-sharing|source sharing/i);
  });
});
