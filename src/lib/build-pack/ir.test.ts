import { describe, expect, test } from "vitest";
import type { ClassifiedRepo } from "../analysis/types";
import { buildBuildPackIR } from "./ir";

function repo(overrides: Partial<ClassifiedRepo> = {}): ClassifiedRepo {
  return {
    id: 1,
    owner: "Git-Romer",
    name: "pokecollector",
    fullName: "Git-Romer/pokecollector",
    url: "https://github.com/Git-Romer/pokecollector",
    description: "Self-hosted Pokemon TCG collection manager with card search, prices, binders, wishlist, backups, exports, and TCGdex sync.",
    language: "TypeScript",
    topics: ["pokemon", "tcg", "collection", "prices", "self-hosted"],
    stars: 180,
    forks: 18,
    openIssues: 3,
    license: "AGPL-3.0",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    category: "forkable",
    summary: "Strong keyword fit. Recently active. Has a license.",
    score: {
      total: 88,
      fit: 86,
      activity: 100,
      popularity: 60,
      license: 100,
      docs: 92,
      reasons: ["Strong keyword fit", "README/docs look useful", "Setup path found in README"]
    },
    readme: {
      excerpt: "Search Pokemon cards, manage binders, wishlist cards, pull Cardmarket and TCGPlayer prices, export CSV/PDF, backup and restore collection data.",
      url: "https://github.com/Git-Romer/pokecollector#readme",
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 95,
      reasons: ["Setup path found", "Examples found"],
      evidence: {
        fetchStatus: "ok",
        fetchedAt: "2026-05-21T00:00:00Z",
        setupSnippets: ["docker compose up starts the self-hosted collection manager"],
        commandSnippets: ["pnpm install && pnpm dev"],
        featureSnippets: ["card search, binder management, wishlist, price history, CSV export, backup and restore"],
        integrationSnippets: ["TCGdex, Cardmarket, and TCGPlayer price integrations"],
        licenseSnippets: ["AGPL-3.0"]
      }
    },
    ...overrides
  };
}

describe("Build Pack IR", () => {
  test("creates domain-specific alignment decisions before Markdown generation", () => {
    const ir = buildBuildPackIR({
      originalIdea: "I want an app like Pokemon Collector that tracks card values and albums",
      researchContext: null,
      chatContext: null,
      queries: ["pokemon tcg collection manager in:name,description,readme"],
      selectedRepo: repo(),
      candidateRepos: [repo()],
      preferences: undefined
    });

    expect(ir.product.kind).toBe("card-collector");
    expect(ir.product.coreDataObjects).toContain("OwnedCard");

    const decisionTypes = ir.alignment.decisions.map((decision) => decision.decision);
    expect(decisionTypes).toEqual(expect.arrayContaining(["keep", "replace", "add", "remove", "inspect"]));

    const keep = ir.alignment.decisions.find((decision) => decision.decision === "keep");
    expect(keep?.repoCapability).toMatch(/card search|binder|price/i);
    expect(keep?.evidenceRefs.join(" ")).toMatch(/card search|TCGdex|Cardmarket/i);

    const add = ir.alignment.decisions.find((decision) => decision.decision === "add");
    expect(add?.productNeed).toMatch(/estimated value|collection/i);
    expect(add?.repoCapability).toMatch(/missing|not confirmed|needs/i);

    const serialized = JSON.stringify(ir);
    expect(serialized).not.toMatch(/PrimaryItem|UserInput/);
  });
});
