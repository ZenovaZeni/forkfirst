import { describe, expect, test } from "vitest";
import type { IdeaCheckResult } from "@/types/idea-check";
import { buildHandoffBlueprint } from "./blueprint";

function repo(overrides: Partial<IdeaCheckResult["repos"][number]> = {}): IdeaCheckResult["repos"][number] {
  return {
    id: 1,
    owner: "Git-Romer",
    name: "pokecollector",
    fullName: "Git-Romer/pokecollector",
    url: "https://github.com/Git-Romer/pokecollector",
    description: "Pokemon TCG collection manager with pricing, binders, wishlist, scanner, backup, and exports.",
    language: "TypeScript",
    topics: ["pokemon", "tcg", "collection", "pricing"],
    stars: 18,
    forks: 8,
    openIssues: 0,
    license: "AGPL-3.0",
    pushedAt: "2026-05-20T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-05-20T00:00:00Z",
    archived: false,
    homepage: "https://pokecollector.romerg.de",
    category: "forkable",
    score: { total: 61, fit: 31, activity: 100, popularity: 42, license: 100, docs: 54, reasons: [] },
    summary: "Pokemon collection lead",
    readme: {
      excerpt: "Card search, collection management, binders, wishlist, TCGdex sync, Cardmarket/TCGPlayer pricing, CSV/PDF export, backup/restore, analytics, scanner, FastAPI, React, Postgres, Docker.",
      url: "https://github.com/Git-Romer/pokecollector#readme",
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 95,
      reasons: ["README explains setup", "README includes examples"]
    },
    ...overrides
  };
}

describe("handoff blueprint", () => {
  test("uses selected repo evidence when the prompt alone is too broad", () => {
    const selectedRepo = repo();
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want something like Pokemon Collectors for my wife, but with our own look.",
      researchContext: null,
      chatContext: null,
      queries: ["pokemon tcg collection manager in:name,description,readme"],
      selectedRepo,
      candidateRepos: [selectedRepo],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("card-collector");
    expect(blueprint.productThesis).toMatch(/card|collector|collection/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/search.*card|card.*search/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/binder|album|vault/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/card|collection|condition|price/i);
    expect(blueprint.firstMilestone).toMatch(/search.*card|card.*search/i);
  });

  test("ignores generic wizard placeholders that would weaken a specific blueprint", () => {
    const selectedRepo = repo();
    const blueprint = buildHandoffBlueprint({
      originalIdea: "Pokemon card value tracker and collector album.",
      researchContext: null,
      chatContext: null,
      queries: [],
      selectedRepo,
      candidateRepos: [selectedRepo],
      preferences: {
        productName: "Untitled app",
        productGoal: "Turn the selected repo into the user's product idea.",
        audience: "the target user from the idea",
        firstMilestone: "Clone the repo, inspect the core flows, and ship the smallest useful workflow."
      }
    });

    expect(blueprint.productThesis).not.toMatch(/turn the selected repo/i);
    expect(blueprint.targetUserSegment).not.toMatch(/target user from the idea/i);
    expect(blueprint.firstMilestone).not.toMatch(/clone the repo/i);
    expect(blueprint.productThesis).toMatch(/card|collector/i);
  });

  test("infers a non-card app without leaking Pokemon-specific language", () => {
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want a recipe bookmark manager that saves recipes from links, lets me tag them, and exports a grocery list.",
      researchContext: null,
      chatContext: null,
      queries: ["recipe bookmark manager github"],
      selectedRepo: undefined,
      candidateRepos: [],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("recipe-bookmark");
    expect(blueprint.productThesis).toMatch(/recipe|grocery/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/Recipe|Ingredient|GroceryList/);
    expect(blueprint.productThesis).not.toMatch(/Pokemon|card collector/i);
  });
});
