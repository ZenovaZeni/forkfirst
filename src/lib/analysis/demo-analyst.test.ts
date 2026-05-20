import { describe, expect, test } from "vitest";
import { analyzeWithDemo } from "./demo-analyst";
import type { ClassifiedRepo } from "./types";

function classified(overrides: Partial<ClassifiedRepo> = {}): ClassifiedRepo {
  return {
    id: 1,
    owner: "example",
    name: "repo",
    fullName: "example/repo",
    url: "https://github.com/example/repo",
    description: "Example app",
    language: "TypeScript",
    topics: [],
    stars: 100,
    forks: 10,
    openIssues: 1,
    license: "MIT",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    category: "forkable",
    summary: "Example",
    score: {
      total: 76,
      fit: 72,
      activity: 80,
      popularity: 40,
      license: 100,
      docs: 70,
      reasons: ["Strong keyword fit"]
    },
    ...overrides
  };
}

describe("demo analyst verdicts", () => {
  test("does not call weak forkable side-results a fork candidate when the top lead is a reference", () => {
    const result = analyzeWithDemo("I want to build a client portal with invoices and messaging", [
      classified({
        owner: "dodopayments",
        name: "dodo-customer-portal",
        fullName: "dodopayments/dodo-customer-portal",
        category: "reference",
        score: { total: 85, fit: 85, activity: 90, popularity: 50, license: 100, docs: 80, reasons: ["Strong keyword fit"] }
      }),
      classified({
        owner: "vteams",
        name: "open-source-billing",
        fullName: "vteams/open-source-billing",
        category: "forkable",
        score: { total: 78, fit: 36, activity: 88, popularity: 45, license: 100, docs: 75, reasons: ["Weak idea fit"] }
      })
    ]);

    expect(result.verdict).not.toBe("fork_candidate_found");
    expect(result.verdict).toBe("build_differentiated");
  });
});
