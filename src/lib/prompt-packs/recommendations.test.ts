import { describe, expect, test } from "vitest";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { applyPromptPackRecommendations, recommendPromptPacks } from "./recommendations";
import type { PromptPackState } from "./storage";

const baseRepo: ClassifiedRepo = {
  id: 1,
  owner: "acme",
  name: "starter",
  fullName: "acme/starter",
  url: "https://github.com/acme/starter",
  description: "A Next.js starter app",
  language: "TypeScript",
  topics: ["nextjs", "starter"],
  stars: 120,
  forks: 12,
  openIssues: 2,
  license: "MIT",
  pushedAt: "2026-01-01T00:00:00Z",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  archived: false,
  homepage: null,
  category: "forkable",
  score: {
    total: 82,
    fit: 88,
    activity: 70,
    popularity: 55,
    license: 90,
    docs: 80,
    reasons: ["Strong starter fit"]
  },
  summary: "A practical starter app."
};

describe("recommendPromptPacks", () => {
  test("recommends agent, BYOK, and security packs from idea text", () => {
    const recommendations = recommendPromptPacks({
      idea: "Build a BYOK AI agent dashboard where users paste OpenAI API keys and approve workflow automation",
      repo: baseRepo
    });

    expect(recommendations.map((item) => item.id)).toEqual(expect.arrayContaining([
      "ai-agent-product",
      "byok-secrets",
      "security-boundary",
      "dashboard-analytics"
    ]));
  });

  test("uses repo category and metadata when idea text is sparse", () => {
    const recommendations = recommendPromptPacks({
      idea: "Help me build this",
      repo: {
        ...baseRepo,
        category: "reference",
        description: "Curated CRM analytics dashboard examples",
        topics: ["crm", "analytics", "dashboard"]
      }
    });

    expect(recommendations[0].id).toBe("repo-orientation");
    expect(recommendations.map((item) => item.id)).toContain("dashboard-analytics");
    expect(recommendations.map((item) => item.id)).toContain("context-budget");
  });

  test("deduplicates ids while preserving first-match order", () => {
    const recommendations = recommendPromptPacks({
      idea: "A private local-first habit tracker dashboard for personal notes",
      repo: {
        ...baseRepo,
        description: "Offline personal tracker with analytics",
        topics: ["local-first", "dashboard", "privacy"]
      }
    });

    const ids = recommendations.map((item) => item.id);
    expect(ids).toContain("local-first-apps");
    expect(ids).toContain("dashboard-analytics");
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("applyPromptPackRecommendations", () => {
  test("adds recommended ids without removing user-selected packs", () => {
    const state: PromptPackState = {
      enabledIds: ["karpathy-mvp", "custom-keep"],
      customPacks: [{
        id: "custom-keep",
        name: "Keep Me",
        blurb: "User custom pack",
        source: "custom",
        content: "## Keep Me"
      }]
    };

    const next = applyPromptPackRecommendations(state, [
      { id: "byok-secrets", reason: "API key language matched." },
      { id: "karpathy-mvp", reason: "Already enabled." }
    ]);

    expect(next.enabledIds).toEqual(["karpathy-mvp", "custom-keep", "byok-secrets"]);
    expect(next.customPacks).toBe(state.customPacks);
  });
});
