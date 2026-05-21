import { describe, expect, test } from "vitest";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import type { IdeaCheckResult } from "@/types/idea-check";
import { buildProjectBuildPack } from "./generator";

const POKEMON_PROMPT =
  "Original idea: I want an app like the Pokemon Collectors app, an app that can show me how much my Pokemon cards are worth and have a collector's album and whatever else is helpful that you think could be put into that. Can you help me with that?";

function section(markdown: string, heading: string): string {
  const match = markdown.match(new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |\\n# |$)`));
  return match?.[1] ?? "";
}

function repo(overrides: Partial<ClassifiedRepo> = {}): ClassifiedRepo {
  return {
    id: 1,
    owner: "Git-Romer",
    name: "pokecollector",
    fullName: "Git-Romer/pokecollector",
    url: "https://github.com/Git-Romer/pokecollector",
    description: "Pokemon TCG collection manager with card search, prices, binders, portfolio analytics, wishlist, scanner, backup, and exports.",
    language: "TypeScript",
    topics: ["pokemon", "tcg", "collection", "pricing", "binder"],
    stars: 18,
    forks: 8,
    openIssues: 0,
    license: "AGPL-3.0",
    pushedAt: "2026-05-20T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-05-20T00:00:00Z",
    archived: false,
    homepage: "https://pokecollector.romerg.de",
    category: "reference",
    score: { total: 61, fit: 31, activity: 100, popularity: 42, license: 100, docs: 54, reasons: ["Pokemon TCG collection match"] },
    summary: "Pokemon card collection lead",
    readme: {
      excerpt: "A self-hosted Pokemon TCG collection manager to track cards, prices, binders, portfolio analytics, TCGdex sync, Cardmarket/TCGPlayer prices, wishlist, sealed products, CSV/PDF export, backup/restore, scanner, FastAPI, React, Postgres, Docker.",
      url: "https://github.com/Git-Romer/pokecollector#readme",
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 95,
      reasons: ["README explains setup", "README includes examples"],
      evidence: {
        fetchStatus: "ok",
        fetchedAt: "2026-05-20T12:00:00Z",
        setupSnippets: ["## Quick Start"],
        commandSnippets: ["docker compose up -d"],
        featureSnippets: ["Cardmarket EUR pricing and TCGPlayer USD pricing via TCGdex"],
        integrationSnippets: ["Card data: TCGdex"],
        licenseSnippets: ["GNU AGPLv3"]
      }
    },
    ...overrides
  };
}

function result(overrides: Partial<IdeaCheckResult> = {}): IdeaCheckResult {
  return {
    id: "pokemon-check",
    prompt: POKEMON_PROMPT,
    createdAt: "2026-05-20T12:00:00Z",
    queries: [
      "pokemon tcg collection manager in:name,description,readme",
      "pokemon card collection tracker in:name,description,readme",
      "tcg collection manager price tracker in:name,description,readme"
    ],
    warnings: [],
    verdict: "build_differentiated",
    verdictLabel: "Build Differentiated",
    summary: "A useful Pokemon TCG foundation exists.",
    confidence: 61,
    mode: "demo",
    gaps: [],
    repos: [repo()],
    ...overrides
  };
}

describe("Build Pack export regressions", () => {
  test("exact Pokemon collector prompt produces a product-specific PRD without wizard answers", () => {
    const markdown = buildProjectBuildPack(result(), "codex", repo());
    const prd = markdown.split("# PRD")[1]?.split("# BUILD_PLAN")[0] ?? "";

    expect(section(prd, "Product Thesis")).toMatch(/card|collector|estimated collection value/i);
    expect(section(prd, "Primary Workflow")).toMatch(/search.*card|detail\/value|condition|vault\/album|export/i);
    expect(section(prd, "Core Data Objects")).toMatch(/Card|OwnedCard|Condition|PriceSnapshot/i);
    expect(section(prd, "Skip In v1")).toMatch(/Pokemon Collector|guaranteed resale/i);
    expect(section(markdown, "Architecture Evidence")).toMatch(/README fetch status: ok|TCGPlayer|TCGdex|docker compose/i);
    expect(markdown).not.toContain("User enters the main thing they need help with.");
    expect(markdown).not.toContain("One primary input.");
  });

  test("partial wizard answers do not weaken the card collector blueprint", () => {
    const markdown = buildProjectBuildPack(result(), "codex", repo(), {
      productName: "Untitled app",
      vibe: "calm",
      accentColor: "#2647F0"
    });
    const prd = markdown.split("# PRD")[1]?.split("# BUILD_PLAN")[0] ?? "";

    expect(section(prd, "Product Thesis")).toMatch(/card|collector/i);
    expect(section(prd, "Primary Workflow")).toMatch(/search.*card|vault|album|export/i);
    expect(section(prd, "Product Thesis")).not.toMatch(/turn the selected repo/i);
  });

  test("recipe bookmark prompt is specific but not Pokemon-specific", () => {
    const recipeRepo = repo({
      owner: "cook",
      name: "recipe-box",
      fullName: "cook/recipe-box",
      url: "https://github.com/cook/recipe-box",
      description: "Recipe bookmark manager with tags, saved links, ingredients, and grocery list export.",
      topics: ["recipes", "bookmarks", "grocery-list"],
      license: "MIT",
      readme: {
        ...repo().readme!,
        excerpt: "Save recipe links, tag recipes, edit ingredients, generate grocery lists, and export shopping lists.",
        evidence: {
          fetchStatus: "ok",
          fetchedAt: "2026-05-20T12:00:00Z",
          setupSnippets: ["npm install"],
          commandSnippets: ["npm run dev"],
          featureSnippets: ["Save recipe links and generate grocery lists"],
          integrationSnippets: [],
          licenseSnippets: ["MIT License"]
        }
      }
    });
    const markdown = buildProjectBuildPack(
      result({
        id: "recipe-check",
        prompt: "Original idea: I want a recipe bookmark manager that saves recipes from links, lets me tag them, and exports a grocery list.",
        queries: ["recipe bookmark manager github"],
        repos: [recipeRepo]
      }),
      "codex",
      recipeRepo
    );
    const prd = markdown.split("# PRD")[1]?.split("# BUILD_PLAN")[0] ?? "";

    expect(section(prd, "Product Thesis")).toMatch(/recipe|grocery/i);
    expect(section(prd, "Core Data Objects")).toMatch(/Recipe|Ingredient|GroceryList/i);
    expect(section(prd, "Product Thesis")).not.toMatch(/Pokemon|card collector/i);
  });

  test("grocery savings handoff follows user preferences over recipe-heavy repo metadata", () => {
    const groceryRepo = repo({
      owner: "TomBursch",
      name: "kitchenowl",
      fullName: "TomBursch/kitchenowl",
      url: "https://github.com/TomBursch/kitchenowl",
      description: "KitchenOwl is a self-hosted grocery list and recipe manager.",
      topics: ["grocery", "shopping-list", "recipes", "self-hosted"],
      license: "AGPL-3.0",
      category: "forkable",
      score: { total: 100, fit: 100, activity: 100, popularity: 100, license: 100, docs: 100, reasons: ["Strong keyword fit"] },
      readme: {
        ...repo().readme!,
        excerpt: '<h4 align="center" | | | </h4 <h4 align="center" KitchenOwl is a self-hosted grocery list and recipe manager with meal planning and Docker setup.',
        evidence: {
          fetchStatus: "ok",
          fetchedAt: "2026-05-20T12:00:00Z",
          setupSnippets: ["## App Install"],
          commandSnippets: ['<a href="https://hub.docker.com/repository/docker/tombursch/kitchenowl">', '<img alt="Docker pulls" src="https://img.shields.io/docker/pulls/tombursch/kitchenowl" />'],
          featureSnippets: ["Grocery list, recipes, meal planning, shared household lists."],
          integrationSnippets: ['<img alt="Stars" src="https://img.shields.io/github/stars/tombursch/kitchenowl" />'],
          licenseSnippets: ["AGPL-3.0"]
        }
      }
    });

    const markdown = buildProjectBuildPack(
      result({
        id: "grocery-check",
        prompt: "Original idea: I want to make a grocery app",
        queries: ["grocery shopping list app in:name,description,readme"],
        verdict: "already_exists",
        verdictLabel: "Already Exists",
        confidence: 92,
        gaps: ["Differentiate with a focused audience, original branding, and a first workflow that is simpler than the existing repos."],
        repos: [groceryRepo]
      }),
      "codex",
      groceryRepo,
      {
        productName: "Grocery",
        audience: "Just to help me find groceries cheaper everywhere and keep up with that.",
        productGoal: "Grocery store app",
        firstMilestone: "Full working frontend, backend, and persistent data.",
        keepFromRepo: "I don't know, keep whatever you need",
        vibe: "calm and trustworthy",
        accentColor: "#2647F0"
      }
    );
    const prd = markdown.split("# PRD")[1]?.split("# BUILD_PLAN")[0] ?? "";

    expect(section(prd, "Product Thesis")).toMatch(/compare store prices|deals|saves money/i);
    expect(section(prd, "Primary Workflow")).toMatch(/price|deal|store plan/i);
    expect(section(prd, "Core Data Objects")).toMatch(/PriceSnapshot|Store|Deal/i);
    expect(section(prd, "Product Thesis")).not.toMatch(/save recipe links|bookmark/i);
    expect(markdown).not.toContain("Keep from repo: I don't know");
    expect(markdown).not.toContain("saved research cases");
    expect(markdown).not.toMatch(/<h[1-6]|<a href|<img|shields\.io/i);
    expect(section(markdown, "Architecture Evidence")).not.toMatch(/<a href|<img|shields\.io/i);
  });
});
