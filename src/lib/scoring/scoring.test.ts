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
});
