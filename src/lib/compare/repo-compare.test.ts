import { describe, expect, test } from "vitest";
import { buildCompareRow } from "./repo-compare";
import type { ClassifiedRepo } from "@/lib/analysis/types";

const baseRepo: ClassifiedRepo = {
  id: 1,
  owner: "acme",
  name: "starter",
  fullName: "acme/starter",
  url: "https://github.com/acme/starter",
  description: "A useful starter",
  language: "TypeScript",
  topics: ["github", "search"],
  stars: 1200,
  forks: 80,
  openIssues: 12,
  license: "MIT",
  pushedAt: "2026-05-01T00:00:00Z",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2026-05-01T00:00:00Z",
  archived: false,
  homepage: null,
  category: "forkable",
  score: {
    total: 82,
    fit: 76,
    activity: 88,
    popularity: 70,
    license: 100,
    docs: 84,
    reasons: ["Strong keyword fit", "Recently active", "License detected", "README/docs look useful"]
  },
  summary: "Strong keyword fit. Recently active. License detected",
  readme: {
    excerpt: "Install with npm. Example usage included.",
    url: "https://github.com/acme/starter#readme",
    hasSetup: true,
    hasExamples: true,
    hasApiDetails: true,
    hasLocalDevelopment: true,
    hasLicenseText: true,
    qualityScore: 86,
    reasons: ["README explains setup", "README includes examples or usage"]
  }
};

describe("buildCompareRow", () => {
  test("summarizes usefulness, docs, setup, and watch-out fields", () => {
    const row = buildCompareRow(baseRepo);

    expect(row.name).toBe("acme/starter");
    expect(row.match).toBe("82%");
    expect(row.docs).toBe("86%");
    expect(row.setup).toBe("Setup + examples");
    expect(row.bestFor).toContain("starting point");
    expect(row.watchOut).toContain("README");
  });
});
