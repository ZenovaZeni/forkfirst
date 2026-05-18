import { describe, expect, test } from "vitest";
import type { ClassifiedRepo } from "../analysis/types";
import type { IdeaCheckResult } from "../../types/idea-check";
import { buildExportMarkdown, slugify } from "./report";

function repo(name = "starter"): ClassifiedRepo {
  return {
    id: 1,
    owner: "owner",
    name,
    fullName: `owner/${name}`,
    url: `https://github.com/owner/${name}`,
    description: "A useful starter repo.",
    language: "TypeScript",
    topics: [],
    stars: 1234,
    forks: 55,
    openIssues: 2,
    license: "MIT",
    pushedAt: "2026-01-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    archived: false,
    homepage: null,
    category: "forkable",
    score: { total: 88, fit: 80, activity: 90, popularity: 70, license: 100, docs: 80, reasons: ["Strong keyword fit", "Recently active"] },
    summary: "Strong lead"
  };
}

function result(): IdeaCheckResult {
  return {
    id: "1",
    prompt: "Build a repo finder",
    createdAt: "2026-01-01T00:00:00Z",
    queries: ["repo finder in:name,description,readme"],
    warnings: [{ type: "missing_token", message: "No GitHub token configured." }],
    verdict: "fork_candidate_found",
    verdictLabel: "Fork candidate found",
    summary: "A repo may help.",
    confidence: 82,
    mode: "demo",
    gaps: ["Need workflow differentiation"],
    repos: [repo()]
  };
}

describe("export report", () => {
  test("slugifies filenames safely", () => {
    expect(slugify("Build a Repo Finder!!!")).toBe("build-a-repo-finder");
    expect(slugify("!!!")).toBe("forkfirst");
  });

  test("includes refinement, warnings, repo reasons, gaps, and saved boards", () => {
    const markdown = buildExportMarkdown(result(), [repo("saved")], { "owner/saved": "Ideas" });

    expect(markdown).toContain("## Executive Summary");
    expect(markdown).toContain("Best lead: owner/starter");
    expect(markdown).toContain("## Recommended Next Moves");
    expect(markdown).toContain("## Prompt Refinement");
    expect(markdown).toContain("repo finder in:name,description,readme");
    expect(markdown).toContain("missing token: No GitHub token configured.");
    expect(markdown).toContain("Snapshot: forkable - 88% score - 1,234 stars - TypeScript - MIT");
    expect(markdown).toContain("Forks/issues: 55 forks, 2 open issues");
    expect(markdown).toContain("Strong keyword fit");
    expect(markdown).toContain("Need workflow differentiation");
    expect(markdown).toContain("### Ideas");
    expect(markdown).toContain("owner/saved");
    expect(markdown).toContain("## Reproduce This Search");
    expect(markdown).toContain("## License Disclaimer");
    expect(markdown).toContain("research, not legal clearance");
  });

  test("gives useful next moves when no repos are found", () => {
    const emptyResult = { ...result(), repos: [], warnings: [], gaps: [] };
    const markdown = buildExportMarkdown(emptyResult, [], {});

    expect(markdown).toContain("Best lead: No strong repository lead found");
    expect(markdown).toContain("Run a narrower follow-up search");
    expect(markdown).toContain("No strong repositories were found.");
    expect(markdown).toContain("No saved repos yet. Save repos in the app");
  });
});
