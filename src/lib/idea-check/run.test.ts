import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { runIdeaCheck } from "./run";
import { analyzeIdea } from "@/lib/analysis/analyst";
import { searchGithubRepositories } from "@/lib/github/provider";
import { enrichTopCandidateReadmes } from "./enrich-candidates";
import { enrichRepositoriesWithStructure } from "../github/structure";
import { classifyRepositories } from "@/lib/scoring/scoring";

vi.mock("@/lib/analysis/analyst", () => ({ analyzeIdea: vi.fn() }));
vi.mock("@/lib/analysis/search-recovery", () => ({ buildSearchRecovery: vi.fn(() => undefined) }));
vi.mock("@/lib/github/provider", () => ({ searchGithubRepositories: vi.fn() }));
vi.mock("@/lib/github/demo-search", () => ({ searchCuratedRepos: vi.fn(() => ({ repos: [], matched: false })) }));
vi.mock("./enrich-candidates", () => ({ enrichTopCandidateReadmes: vi.fn() }));
vi.mock("../github/structure", () => ({ enrichRepositoriesWithStructure: vi.fn(async (repos) => repos) }));
vi.mock("@/lib/scoring/scoring", () => ({ classifyRepositories: vi.fn() }));
vi.mock("@/lib/db/research-cases", () => ({ saveIdeaCheck: vi.fn() }));
vi.mock("@/lib/security/server-keys", () => ({ optionalServerKey: vi.fn(() => null) }));

function repo(): ClassifiedRepo {
  return {
    id: 1,
    owner: "owner",
    name: "starter",
    fullName: "owner/starter",
    url: "https://github.com/owner/starter",
    description: "Receipt tracker with CSV export and local setup.",
    language: "TypeScript",
    topics: ["receipts", "expenses", "csv"],
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
    score: { total: 90, fit: 88, activity: 80, popularity: 50, license: 100, docs: 90, reasons: ["Strong keyword fit"] },
    summary: "Receipt starter",
    readme: {
      excerpt: "Capture receipts, track expenses, and export CSV.",
      url: "https://github.com/owner/starter#readme",
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: false,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 90,
      reasons: ["Setup path found"],
      evidence: {
        fetchStatus: "ok",
        fetchedAt: "2026-05-21T00:00:00Z",
        setupSnippets: ["npm install"],
        commandSnippets: ["npm run dev"],
        featureSnippets: ["receipt capture and CSV export"],
        integrationSnippets: [],
        licenseSnippets: ["MIT"]
      }
    }
  };
}

describe("runIdeaCheck", () => {
  beforeEach(() => {
    vi.mocked(searchGithubRepositories).mockResolvedValue({
      repos: [],
      queries: ["receipt scanner in:name,description,readme"],
      refinement: {
        probableMeaning: "Find receipt scanner apps.",
        bestQuery: "receipt scanner in:name,description,readme",
        queries: ["receipt scanner in:name,description,readme"],
        alternateAngles: []
      },
      warnings: []
    });
    vi.mocked(enrichTopCandidateReadmes).mockResolvedValue([]);
    vi.mocked(enrichRepositoriesWithStructure).mockImplementation(async (repos) => repos);
    vi.mocked(classifyRepositories).mockReturnValue([repo()]);
  });

  test("does not let provider JSON override trusted workflow fields", async () => {
    vi.mocked(analyzeIdea).mockResolvedValue({
      id: "provider-id",
      prompt: "malicious prompt from provider",
      createdAt: "2000-01-01T00:00:00Z",
      productIntent: { sourceText: "provider intent" },
      repoInspections: [],
      mergePlan: { repoFullName: "provider/repo" },
      verdict: "fork_candidate_found",
      verdictLabel: "Fork candidate found",
      summary: "Provider summary",
      confidence: 80,
      mode: "demo",
      gaps: [],
      repos: [repo()]
    } as never);

    const result = await runIdeaCheck({
      prompt: "I want a receipt scanner that exports CSV"
    });

    expect(result.prompt).toBe("I want a receipt scanner that exports CSV");
    expect(result.id).not.toBe("provider-id");
    expect(result.createdAt).not.toBe("2000-01-01T00:00:00Z");
    expect(result.productIntent?.sourceText).toBe("I want a receipt scanner that exports CSV");
    expect(result.mergePlan?.repoFullName).toBe("owner/starter");
  });
});
