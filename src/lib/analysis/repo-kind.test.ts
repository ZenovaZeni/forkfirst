import { describe, expect, test } from "vitest";
import { getRepoKindInsight } from "./repo-kind";
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
      qualityScore: 80,
      reasons: ["description"]
    },
    ...overrides
  };
}

describe("repo kind insight", () => {
  test("recognizes awesome repos as directories rather than forkable apps", () => {
    const insight = getRepoKindInsight(repo());

    expect(insight.kind).toBe("directory");
    expect(insight.label).toBe("Directory / List");
    expect(insight.plainEnglish).toContain("not a single app");
    expect(insight.notFor).toContain("Copying");
  });

  test("recognizes Claude Code agent repos as plugin packs", () => {
    const insight = getRepoKindInsight(
      repo({
        owner: "wshobson",
        name: "agents",
        fullName: "wshobson/agents",
        description: "Claude Code Plugins: Orchestration and Automation with agent skills and slash commands.",
        topics: ["claude-code", "agents", "plugins"],
        readme: {
          ...repo().readme!,
          excerpt: "185 specialized AI agents, workflow orchestrators, agent skills, and commands for Claude Code."
        }
      })
    );

    expect(insight.kind).toBe("plugin_pack");
    expect(insight.goodFor).toContain("coding workflow");
    expect(insight.notFor).toContain("customer-facing web app");
  });

  test("recognizes AI SDKs as framework building blocks", () => {
    const insight = getRepoKindInsight(
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
    );

    expect(insight.kind).toBe("framework_sdk");
    expect(insight.goodFor).toContain("technical layer");
  });

  test("recognizes language API clients as SDKs, not product apps", () => {
    const insight = getRepoKindInsight(
      repo({
        owner: "recurly",
        name: "recurly-client-php",
        fullName: "recurly/recurly-client-php",
        description: "Recurly PHP Client",
        topics: ["php", "billing", "api-client"],
        readme: {
          ...repo().readme!,
          excerpt: "Install the client and configure API credentials."
        }
      })
    );

    expect(insight.kind).toBe("framework_sdk");
    expect(insight.notFor).toContain("product design");
  });

  test("recognizes CRM product repos as apps even when they mention framework versions", () => {
    const insight = getRepoKindInsight(
      repo({
        owner: "go2ismail",
        name: "Free-CRM",
        fullName: "go2ismail/Free-CRM",
        description: "Free CRM open-source Customer Relationship Management software built with ASP.NET Core 9.0.",
        topics: ["crm", "customer-management", "aspnet-core"],
        readme: {
          ...repo().readme!,
          excerpt: "Free CRM includes contacts, companies, tasks, notes, and sales workflows for business users."
        }
      })
    );

    expect(insight.kind).toBe("app");
    expect(insight.label).toBe("App / Product");
  });

  test("recognizes MCP servers as developer plugin packs", () => {
    const insight = getRepoKindInsight(
      repo({
        owner: "example",
        name: "deals-mcp",
        fullName: "example/deals-mcp",
        description: "MCP server for grocery deal hunting via an API.",
        topics: ["mcp", "server", "automation"],
        readme: {
          ...repo().readme!,
          excerpt: "Model Context Protocol server exposing tools for AI agents."
        }
      })
    );

    expect(insight.kind).toBe("plugin_pack");
  });

  test("recognizes game engines as game foundations", () => {
    const insight = getRepoKindInsight(
      repo({
        owner: "godotengine",
        name: "godot",
        fullName: "godotengine/godot",
        description: "Godot Engine - multi-platform 2D and 3D game engine.",
        topics: ["game-engine", "gamedev", "2d", "3d"],
        readme: {
          ...repo().readme!,
          excerpt: "Godot is a multi-platform 2D and 3D game engine."
        }
      })
    );

    expect(insight.kind).toBe("game_engine");
    expect(insight.label).toBe("Game Engine / Framework");
  });
});
