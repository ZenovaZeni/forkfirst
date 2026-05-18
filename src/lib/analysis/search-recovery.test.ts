import { describe, expect, test } from "vitest";
import { buildSearchRecovery } from "./search-recovery";
import type { ClassifiedRepo } from "./types";
import type { GitHubSearchWarning } from "@/lib/github/types";

function repo(overrides: Partial<ClassifiedRepo> = {}): ClassifiedRepo {
  return {
    id: 1,
    owner: "acme",
    name: "starter",
    fullName: "acme/starter",
    url: "https://github.com/acme/starter",
    description: "A small starter project.",
    language: "TypeScript",
    topics: [],
    stars: 12,
    forks: 2,
    openIssues: 1,
    license: "MIT",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    category: "reference",
    summary: "Partial idea fit. Recently active. Has a license",
    score: {
      total: 54,
      fit: 31,
      activity: 90,
      popularity: 18,
      license: 100,
      docs: 42,
      reasons: ["Weak idea fit", "Recently active", "Has a license", "Docs need inspection"]
    },
    ...overrides
  };
}

describe("search recovery", () => {
  test("offers no-result recovery actions without treating the search as a success", () => {
    const recovery = buildSearchRecovery({
      prompt: "A scheduling tool for barber shops",
      repos: [],
      warnings: []
    });

    expect(recovery.state).toBe("no_results");
    expect(recovery.headline).toBe("No strong GitHub match yet");
    expect(recovery.explanation).toContain("GitHub did not return usable repo candidates");
    expect(recovery.actions.map((action) => action.kind)).toEqual(["tighten_idea", "known_repo", "adjacent", "trending", "demo"]);
    expect(recovery.closeMatchCount).toBe(0);
  });

  test("marks noisy results as weak and keeps the copy cautious", () => {
    const recovery = buildSearchRecovery({
      prompt: "AI lead gen for realtors",
      repos: [
        repo({ fullName: "misc/list", category: "reference", score: { ...repo().score, total: 58, fit: 28 } }),
        repo({ fullName: "tools/crm", category: "gap", score: { ...repo().score, total: 46, fit: 34 } })
      ],
      warnings: []
    });

    expect(recovery.state).toBe("weak_results");
    expect(recovery.explanation).toContain("loose or adjacent");
    expect(recovery.reassurance).toContain("treat these as leads");
    expect(recovery.closeMatchCount).toBe(0);
  });

  test("reports good results without recovery actions", () => {
    const recovery = buildSearchRecovery({
      prompt: "Open source game engine",
      repos: [
        repo({
          category: "forkable",
          score: { ...repo().score, total: 78, fit: 72, docs: 80 }
        })
      ],
      warnings: []
    });

    expect(recovery.state).toBe("ok");
    expect(recovery.actions).toEqual([]);
    expect(recovery.closeMatchCount).toBe(1);
  });

  test("calls out limited coverage when GitHub search warns about missing tokens or rate limits", () => {
    const warnings: GitHubSearchWarning[] = [{ type: "missing_token", message: "Missing GitHub token." }];
    const recovery = buildSearchRecovery({
      prompt: "Find a repo for invoices",
      repos: [repo()],
      warnings
    });

    expect(recovery.explanation).toContain("coverage may be limited");
  });
});
