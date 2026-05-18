import { describe, expect, test } from "vitest";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { applyRepoFilters, filterRepos, sortRepos } from "./filters";

function repo(name: string, category: ClassifiedRepo["category"], total: number, stars: number, pushedAt: string): ClassifiedRepo {
  return {
    id: stars,
    owner: "owner",
    name,
    fullName: `owner/${name}`,
    url: `https://github.com/owner/${name}`,
    description: "",
    language: null,
    topics: [],
    stars,
    forks: 0,
    openIssues: 0,
    license: null,
    pushedAt,
    createdAt: null,
    updatedAt: pushedAt,
    archived: false,
    homepage: null,
    category,
    score: { total, fit: total, activity: total, popularity: total, license: total, docs: total, reasons: [] },
    summary: ""
  };
}

describe("repo filters", () => {
  const repos = [
    repo("alpha", "forkable", 82, 50, "2025-01-01T00:00:00Z"),
    repo("beta", "reference", 61, 500, "2024-01-01T00:00:00Z"),
    repo("gamma", "risk", 45, 100, "2026-01-01T00:00:00Z")
  ];

  test("filters by category and minimum score", () => {
    expect(filterRepos(repos, { category: "reference", minScore: 60, sort: "relevance" }).map((item) => item.name)).toEqual(["beta"]);
    expect(filterRepos(repos, { category: "all", minScore: 75, sort: "relevance" }).map((item) => item.name)).toEqual(["alpha"]);
  });

  test("sorts by stars or updated date while preserving default order for relevance", () => {
    expect(sortRepos(repos, "relevance").map((item) => item.name)).toEqual(["alpha", "beta", "gamma"]);
    expect(sortRepos(repos, "stars").map((item) => item.name)).toEqual(["beta", "gamma", "alpha"]);
    expect(sortRepos(repos, "updated").map((item) => item.name)).toEqual(["gamma", "alpha", "beta"]);
  });

  test("applies filtering and sorting together", () => {
    expect(applyRepoFilters(repos, { category: "all", minScore: 60, sort: "stars" }).map((item) => item.name)).toEqual(["beta", "alpha"]);
  });
});
