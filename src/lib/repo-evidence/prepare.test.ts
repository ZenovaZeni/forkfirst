import { beforeEach, describe, expect, test, vi } from "vitest";
import type { NormalizedRepo, ReadmeAnalysis } from "@/lib/github/types";
import { fetchReadmeAnalysis } from "@/lib/github/readme";
import { prepareRepoForHandoff } from "./prepare";

vi.mock("@/lib/github/readme", () => ({
  fetchReadmeAnalysis: vi.fn()
}));

const fetchReadmeAnalysisMock = vi.mocked(fetchReadmeAnalysis);

function repo(overrides: Partial<NormalizedRepo> = {}): NormalizedRepo {
  return {
    id: 1,
    owner: "owner",
    name: "repo",
    fullName: "owner/repo",
    url: "https://github.com/owner/repo",
    description: "A starter repo.",
    language: "TypeScript",
    topics: [],
    stars: 10,
    forks: 1,
    openIssues: 0,
    license: "MIT",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    ...overrides
  };
}

function readme(overrides: Partial<ReadmeAnalysis> = {}): ReadmeAnalysis {
  return {
    excerpt: "README with setup and features.",
    url: "https://github.com/owner/repo#readme",
    hasSetup: true,
    hasExamples: true,
    hasApiDetails: false,
    hasLocalDevelopment: true,
    hasLicenseText: true,
    qualityScore: 80,
    reasons: ["README explains setup"],
    evidence: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-20T00:00:00Z",
      setupSnippets: ["## Quick Start"],
      commandSnippets: ["npm install"],
      featureSnippets: ["Search and export features"],
      integrationSnippets: [],
      licenseSnippets: ["MIT License"]
    },
    ...overrides
  };
}

describe("prepareRepoForHandoff", () => {
  beforeEach(() => {
    fetchReadmeAnalysisMock.mockReset();
  });

  test("does not refetch repos with fresh README evidence", async () => {
    const existing = repo({ readme: readme() });

    const result = await prepareRepoForHandoff(existing, "token");

    expect(result).toBe(existing);
    expect(fetchReadmeAnalysisMock).not.toHaveBeenCalled();
  });

  test("fetches README evidence when missing", async () => {
    const fetched = readme({ excerpt: "Fetched README evidence." });
    fetchReadmeAnalysisMock.mockResolvedValue(fetched);

    const result = await prepareRepoForHandoff(repo(), "token");

    expect(fetchReadmeAnalysisMock).toHaveBeenCalledTimes(1);
    expect(fetchReadmeAnalysisMock).toHaveBeenCalledWith(expect.objectContaining({ fullName: "owner/repo" }), "token");
    expect(result.readme).toBe(fetched);
  });

  test("preserves existing repo when README fetch fails", async () => {
    const existing = repo({ readme: readme({ evidence: undefined }) });
    fetchReadmeAnalysisMock.mockResolvedValue(undefined);

    const result = await prepareRepoForHandoff(existing);

    expect(result.readme).toBe(existing.readme);
  });
});
