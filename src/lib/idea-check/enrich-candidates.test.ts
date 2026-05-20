import { describe, expect, test, vi } from "vitest";
import type { NormalizedRepo, ReadmeAnalysis } from "@/lib/github/types";
import { enrichTopCandidateReadmes, selectReadmeEnrichmentCandidates } from "./enrich-candidates";

const readme: ReadmeAnalysis = {
  excerpt: "Install and run this Pokemon TCG collection manager locally.",
  url: "https://github.com/example/repo#readme",
  hasSetup: true,
  hasExamples: true,
  hasApiDetails: false,
  hasLocalDevelopment: true,
  hasLicenseText: true,
  qualityScore: 86,
  reasons: ["README explains setup"]
};

function repo(overrides: Partial<NormalizedRepo>): NormalizedRepo {
  return {
    id: overrides.id ?? Math.floor(Math.random() * 1_000_000),
    owner: overrides.owner ?? "owner",
    name: overrides.name ?? "repo",
    fullName: overrides.fullName ?? `${overrides.owner ?? "owner"}/${overrides.name ?? "repo"}`,
    url: overrides.url ?? "https://github.com/owner/repo",
    description: overrides.description ?? "",
    language: overrides.language ?? "TypeScript",
    topics: overrides.topics ?? [],
    stars: overrides.stars ?? 0,
    forks: overrides.forks ?? 0,
    openIssues: overrides.openIssues ?? 0,
    license: overrides.license ?? "MIT",
    pushedAt: overrides.pushedAt ?? "2026-05-01T00:00:00Z",
    createdAt: overrides.createdAt ?? "2025-01-01T00:00:00Z",
    updatedAt: overrides.updatedAt ?? "2026-05-01T00:00:00Z",
    archived: overrides.archived ?? false,
    homepage: overrides.homepage ?? null,
    githubScore: overrides.githubScore,
    readme: overrides.readme
  };
}

describe("README candidate enrichment", () => {
  test("selects a later relevant Pokemon collector repo ahead of unrelated high-star repos", () => {
    const prompt = "I want to build a Pokemon TCG card collection manager with prices";
    const unrelated = repo({
      id: 1,
      owner: "popular",
      name: "awesome-react",
      fullName: "popular/awesome-react",
      description: "A curated list of React components and UI libraries",
      topics: ["react", "awesome"],
      stars: 95_000
    });
    const pokecollector = repo({
      id: 2,
      owner: "Git-Romer",
      name: "pokecollector",
      fullName: "Git-Romer/pokecollector",
      description: "Pokemon card collection tracker for collectors",
      topics: ["pokemon", "tcg", "collection"],
      stars: 15
    });

    const candidates = selectReadmeEnrichmentCandidates([unrelated, pokecollector], prompt, 1);

    expect(candidates).toEqual([pokecollector]);
  });

  test("enriches only selected repos and does not refetch repos with existing README data", async () => {
    const prompt = "Pokemon TCG collection manager";
    const existingReadme = repo({
      id: 1,
      owner: "docs",
      name: "pokemon-tcg-manager",
      fullName: "docs/pokemon-tcg-manager",
      description: "Pokemon TCG collection manager",
      topics: ["pokemon", "tcg"],
      readme
    });
    const missingReadme = repo({
      id: 2,
      owner: "Git-Romer",
      name: "pokecollector",
      fullName: "Git-Romer/pokecollector",
      description: "Pokemon card collection tracker",
      topics: ["pokemon", "collection"]
    });
    const enrichReadmes = vi.fn(async (repos: NormalizedRepo[]) =>
      repos.map((candidate) => ({
        ...candidate,
        readme: { ...readme, excerpt: `README for ${candidate.fullName}` }
      }))
    );

    const enriched = await enrichTopCandidateReadmes([existingReadme, missingReadme], prompt, undefined, {
      enrichReadmes
    });

    expect(enrichReadmes).toHaveBeenCalledTimes(1);
    expect(enrichReadmes).toHaveBeenCalledWith([missingReadme], undefined);
    expect(enriched.find((candidate) => candidate.fullName === existingReadme.fullName)?.readme).toBe(readme);
    expect(enriched.find((candidate) => candidate.fullName === missingReadme.fullName)?.readme?.excerpt).toBe(
      "README for Git-Romer/pokecollector"
    );
  });
});
