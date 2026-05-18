import { describe, expect, test } from "vitest";
import { buildIdeaGapInsight, buildPlainDecision } from "./builder-insights";
import type { ClassifiedRepo } from "./types";

function repo(overrides: Partial<ClassifiedRepo> = {}): ClassifiedRepo {
  return {
    id: 1,
    owner: "acme",
    name: "starter",
    fullName: "acme/starter",
    url: "https://github.com/acme/starter",
    description: "A maintained starter kit",
    language: "TypeScript",
    topics: ["starter"],
    stars: 1200,
    forks: 100,
    openIssues: 10,
    license: "MIT",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    category: "forkable",
    summary: "Strong keyword fit. Recently active. License detected.",
    score: {
      total: 82,
      fit: 70,
      activity: 90,
      popularity: 60,
      license: 100,
      docs: 80,
      reasons: ["Strong keyword fit", "Recently active", "License detected"]
    },
    readme: {
      excerpt: "Setup and examples included.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: false,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 80,
      reasons: ["setup"]
    },
    ...overrides
  };
}

describe("builder insights", () => {
  test("labels repos with direct builder decisions", () => {
    expect(buildPlainDecision(repo({ category: "already_exists" }))).toBe("Use or study first");
    expect(buildPlainDecision(repo({ category: "forkable" }))).toBe("Copy and customize");
    expect(buildPlainDecision(repo({ category: "reference" }))).toBe("Study it");
    expect(buildPlainDecision(repo({ category: "gap" }))).toBe("Build the gap");
  });

  test("summarizes the remaining idea gap from the shortlist", () => {
    const insight = buildIdeaGapInsight("Build an AI repo finder with saved research boards", [
      repo({ category: "forkable", score: { ...repo().score, fit: 75 } }),
      repo({ category: "reference", readme: undefined, score: { ...repo().score, docs: 0, fit: 50 } }),
      repo({ category: "gap", license: null, score: { ...repo().score, fit: 25, license: 0 } })
    ]);

    expect(insight.title).toContain("Still room");
    expect(insight.points).toContain("Package the missing pieces as a focused builder workflow, not another search results page.");
    expect(insight.points.some((point) => point.includes("saved research boards"))).toBe(true);
  });
});
