import { describe, expect, test } from "vitest";
import { classifyRepositories } from "./scoring";
import type { NormalizedRepo } from "@/lib/github/types";

function repo(overrides: Partial<NormalizedRepo> = {}): NormalizedRepo {
  return {
    id: 1,
    owner: "steven2358",
    name: "awesome-generative-ai",
    fullName: "steven2358/awesome-generative-ai",
    url: "https://github.com/steven2358/awesome-generative-ai",
    description: "A curated list of modern Generative Artificial Intelligence projects and services.",
    language: "Mixed",
    topics: ["awesome-list", "generative-ai"],
    stars: 12000,
    forks: 1600,
    openIssues: 8,
    license: "CC0-1.0",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2021-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    readme: {
      excerpt: "A curated list of modern Generative Artificial Intelligence projects and services.",
      url: null,
      hasSetup: false,
      hasExamples: false,
      hasApiDetails: false,
      hasLocalDevelopment: false,
      hasLicenseText: true,
      qualityScore: 84,
      reasons: ["description"]
    },
    ...overrides
  };
}

describe("repo scoring", () => {
  test("does not mark curated lists as forkable apps", () => {
    const [classified] = classifyRepositories([repo()], "What are some cool AI repos for builders?");

    expect(classified.category).toBe("reference");
    expect(classified.score.reasons).toContain("Curated list, not a runnable app");
  });

  test("does not mark agent plugin packs as normal forkable products", () => {
    const [classified] = classifyRepositories(
      [
        repo({
          owner: "wshobson",
          name: "agents",
          fullName: "wshobson/agents",
          description: "Claude Code Plugins: Orchestration and Automation with agent skills and slash commands.",
          topics: ["claude-code", "agents", "plugins"],
          readme: {
            ...repo().readme!,
            excerpt: "A comprehensive production-ready system combining AI agents, workflow orchestrators, skills, and commands for Claude Code."
          }
        })
      ],
      "lead generating repos for my business"
    );

    expect(classified.category).toBe("reference");
    expect(classified.score.reasons).toContain("Developer plugin pack, not a product app");
  });

  test("treats SDKs as building blocks instead of complete forkable apps", () => {
    const [classified] = classifyRepositories(
      [
        repo({
          owner: "vercel",
          name: "ai",
          fullName: "vercel/ai",
          description: "The AI Toolkit for TypeScript. The AI SDK is an open-source library for building AI-powered applications and agents.",
          topics: ["sdk", "typescript", "ai"],
          readme: {
            ...repo().readme!,
            excerpt: "The AI SDK is a free open-source library for building AI-powered applications and agents."
          }
        })
      ],
      "cool open-source AI repos for builders"
    );

    expect(classified.category).toBe("reference");
  });

  test("ranks actual game engines above curated game resource lists for game build prompts", () => {
    const [first] = classifyRepositories(
      [
        repo({
          owner: "killop",
          name: "anything_about_game",
          fullName: "killop/anything_about_game",
          description: "A wonderful list of Game Development resources.",
          topics: ["awesome-list", "game-development"],
          stars: 4000,
          readme: {
            ...repo().readme!,
            excerpt: "A curated list of links and game development resources."
          }
        }),
        repo({
          owner: "godotengine",
          name: "godot",
          fullName: "godotengine/godot",
          description: "Godot Engine - multi-platform 2D and 3D game engine.",
          topics: ["game-engine", "gamedev", "2d", "3d"],
          stars: 1200,
          forks: 200,
          readme: {
            ...repo().readme!,
            excerpt: "Godot is a multi-platform 2D and 3D game engine."
          }
        })
      ],
      "Are there any repos out there that help with building a 2.5D game?"
    );

    expect(first.fullName).toBe("godotengine/godot");
    expect(first.category).toBe("forkable");
  });

  test("ranks niche vertical lead-gen repos above popular generic AI agent repos", () => {
    const [first] = classifyRepositories(
      [
        repo({
          owner: "popular",
          name: "ai-agents",
          fullName: "popular/ai-agents",
          description: "A framework for building AI agents, workflows, and automations.",
          topics: ["ai", "agents", "workflow", "automation"],
          stars: 65000,
          forks: 9000,
          readme: {
            ...repo().readme!,
            excerpt: "Build AI agents and workflow automations with tools, memory, and orchestration."
          }
        }),
        repo({
          owner: "niche",
          name: "real-estate-lead-gen",
          fullName: "niche/real-estate-lead-gen",
          description: "Lead generation CRM for real estate agents and realtor prospecting.",
          topics: ["real-estate", "lead-generation", "crm", "realtor"],
          stars: 220,
          forks: 35,
          readme: {
            ...repo().readme!,
            excerpt: "Capture property leads, enrich prospects, and manage outreach for realtors and real estate brokers."
          }
        })
      ],
      "AI lead gen tools for realtors or real estate"
    );

    expect(first.fullName).toBe("niche/real-estate-lead-gen");
    expect(first.score.reasons).toContain("Vertical/domain match");
  });

  test("ranks Pokemon collection managers above data repos for rough card value prompts", () => {
    const [first] = classifyRepositories(
      [
        repo({
          owner: "marcelpanse",
          name: "tcg-pocket-collection-tracker",
          fullName: "marcelpanse/tcg-pocket-collection-tracker",
          description: "Application to track your Pokemon Pocket collection and find others to trade with",
          topics: ["pokemon", "tcg", "collection", "trading"],
          stars: 150,
          forks: 44,
          license: "GPL-3.0",
          readme: {
            ...repo().readme!,
            excerpt:
              "TCG Pocket Collection Tracker is an application designed to help users efficiently track their Pokemon Pocket game cards, identify optimal card packs to open, manage trades, and engage with friends and the community. The backend manages user authentication via OTP email and includes a database for card storage.",
            qualityScore: 100
          }
        }),
        repo({
          owner: "chase-9234",
          name: "pokemon-tcg-pocket-cards",
          fullName: "chase-9234/pokemon-tcg-pocket-cards",
          description: "An open source repo for data on the Pokemon TCG Cards",
          topics: ["pokemon", "tcg", "cards", "data"],
          stars: 9000,
          forks: 350,
          readme: {
            ...repo().readme!,
            excerpt: "Open source data exports for Pokemon TCG Pocket cards."
          }
        }),
        repo({
          owner: "Git-Romer",
          name: "pokecollector",
          fullName: "Git-Romer/pokecollector",
          description:
            "A self-hosted Pokemon TCG collection manager to track cards, prices, binders, and portfolio analytics. Syncs free data from TCGdex, pulls Cardmarket/TCGPlayer prices, supports variants, wishlists, sealed products, exports, backups, and optional AI card recognition - Docker-ready.",
          topics: ["container", "docker", "docker-compose", "pokemon", "self-hosted", "tcg", "tcgdex", "trading-cards"],
          stars: 18,
          forks: 8,
          license: "AGPL-3.0",
          homepage: "https://pokecollector.example.com",
          readme: {
            ...repo().readme!,
            excerpt: "Disclaimer: this repository is vibecoded. Expect vibes, not guarantees. Proceed with version control.",
            qualityScore: 100
          }
        }),
        repo({
          owner: "public-apis",
          name: "public-apis",
          fullName: "public-apis/public-apis",
          description: "A collective list of free APIs",
          topics: ["api", "list", "data"],
          stars: 360000,
          forks: 38000,
          readme: {
            ...repo().readme!,
            excerpt: "A curated list of free public APIs for developers."
          }
        })
      ],
      "pokemon coloter where i can see values"
    );

    expect(first.fullName).toBe("Git-Romer/pokecollector");
    expect(first.score.fit).toBeGreaterThanOrEqual(70);
    expect(["already_exists", "forkable"]).toContain(first.category);
  });

  test("ranks grocery app repos above popular generic automation repos", () => {
    const [first] = classifyRepositories(
      [
        repo({
          owner: "browser-use",
          name: "browser-use",
          fullName: "browser-use/browser-use",
          description: "Make websites accessible for AI agents. Automate tasks online with ease.",
          topics: ["ai", "agents", "browser", "automation"],
          stars: 94834,
          forks: 10690,
          license: "MIT",
          readme: {
            ...repo().readme!,
            excerpt: "Make websites accessible for AI agents. Automate browser tasks and workflows online with ease.",
            hasSetup: true,
            hasExamples: true,
            qualityScore: 100
          }
        }),
        repo({
          owner: "plutonicdev",
          name: "GroceryStore",
          fullName: "plutonicdev/GroceryStore",
          description:
            "Grocery store Android app UI template for grocery shopping, supermarket products, store orders, and checkout.",
          topics: ["grocery", "shopping", "store", "android", "template"],
          stars: 51,
          forks: 24,
          license: null,
          pushedAt: "2024-11-01T00:00:00Z",
          readme: {
            ...repo().readme!,
            excerpt:
              "Grocery app template for shopping list, grocery products, supermarket store pages, cart, checkout, and order screens.",
            qualityScore: 45
          }
        })
      ],
      "I want to make a grocery app"
    );

    expect(first.fullName).toBe("plutonicdev/GroceryStore");
    expect(first.score.fit).toBeGreaterThanOrEqual(70);
    expect(first.score.reasons).toContain("Vertical/domain match");
  });
});
