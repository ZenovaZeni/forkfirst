import { describe, expect, test } from "vitest";
import { planPromptRefinement, planSearches } from "./planner";

describe("search planner", () => {
  test("plans exact name searches when the user asks whether a repo name is taken", () => {
    const queries = planSearches("Does anything else out there have the name ForkFirst?");

    expect(queries[0]).toBe("forkfirst in:name");
    expect(queries).toContain('"forkfirst" in:name,description');
  });

  test("plans curated AI discovery searches for broad cool-repo prompts", () => {
    const queries = planSearches("what are some cool repos involving ai");

    expect(queries[0]).toBe("awesome artificial intelligence in:name,description,readme");
    expect(queries).toContain("ai agents tools in:name,description,readme");
    expect(queries.join(" ")).not.toContain("cool");
  });

  test("does not treat generic AI agent prompts as real-estate searches", () => {
    const queries = planSearches("ai agent tools");

    expect(queries[0]).toBe("awesome artificial intelligence in:name,description,readme");
    expect(queries.join(" ")).not.toContain("real estate");
  });

  test("builds prompt refinement from the same planned queries", () => {
    const refinement = planPromptRefinement("what are some cool repos involving ai");

    expect(refinement.probableMeaning).toContain("AI projects");
    expect(refinement.bestQuery).toBe(planSearches("what are some cool repos involving ai")[0]);
    expect(refinement.alternateAngles[0]).toContain("ai agents tools");
    expect(refinement.queries).toContain("machine learning projects in:name,description,readme");
  });

  test("plans business owner searches when the prompt asks for business repos", () => {
    const queries = planSearches("anything good for business owners?");

    expect(queries[0]).toBe("business automation tools in:name,description,readme");
    expect(queries).toContain("small business crm in:name,description,readme");
  });

  test("keeps real-estate lead-gen intent ahead of generic AI searches", () => {
    const refinement = planPromptRefinement("ai lead gen tools for realtors or real estate");

    expect(refinement.probableMeaning).toContain("real-estate sales tools");
    expect(refinement.bestQuery).toBe("real estate lead generation in:name,description,readme");
    expect(refinement.queries.slice(0, 3)).toEqual([
      "real estate lead generation in:name,description,readme",
      "realtor crm leads in:name,description,readme",
      "property leads scraper in:name,description,readme"
    ]);
    expect(refinement.queries[0]).not.toContain("ai agents tools");
  });

  test("plans real-estate image generation before generic real-estate searches", () => {
    const refinement = planPromptRefinement("I want to make an image generator for realtors");

    expect(refinement.bestQuery).toBe("real estate image generator in:name,description,readme");
    expect(refinement.queries.slice(0, 3)).toEqual([
      "real estate image generator in:name,description,readme",
      "realtor marketing image generator in:name,description,readme",
      "property listing image generator in:name,description,readme"
    ]);
    expect(refinement.queries[0]).not.toContain("voice assistant");
  });

  test("plans domain-specific searches for vertical AI tool prompts", () => {
    const refinement = planPromptRefinement("AI compliance tools for healthcare clinics");

    expect(refinement.probableMeaning).toContain("healthcare");
    expect(refinement.bestQuery).toBe("healthcare compliance tools in:name,description,readme");
    expect(refinement.queries.slice(0, 3)).toEqual([
      "healthcare compliance tools in:name,description,readme",
      "clinic compliance automation in:name,description,readme",
      "medical practice compliance in:name,description,readme"
    ]);
    expect(refinement.queries.join(" ")).not.toContain("awesome artificial intelligence");
  });

  test("refines exact name checks into a readable meaning and exact best query", () => {
    const refinement = planPromptRefinement("Does anything else out there have the name ForkFirst?");

    expect(refinement.probableMeaning).toContain("ForkFirst".toLowerCase());
    expect(refinement.bestQuery).toBe("forkfirst in:name");
    expect(refinement.alternateAngles.join(" ")).toContain("forkfirst");
  });

  test("plans specific game-engine searches before broad game resource searches", () => {
    const queries = planSearches("Are there any repos out there that help with building a 2.5D game?");

    expect(queries.slice(0, 4)).toEqual([
      "godot 2.5d game engine in:name,description,readme",
      "bevy 2.5d game engine in:name,description,readme",
      "phaser isometric game framework in:name,description,readme",
      "defold game engine in:name,description,readme"
    ]);
    expect(queries.join(" ")).not.toContain("anything");
  });

  test("plans Pokemon TCG collector searches before generic prompt searches", () => {
    const queries = planSearches("I want to build a Pokemon collector app for my TCG cards");

    expect(queries.slice(0, 6)).toEqual([
      "pokemon tcg collection manager in:name,description,readme",
      "pokemon card collection tracker in:name,description,readme",
      "tcg collection manager price tracker in:name,description,readme",
      "trading card binder app in:name,description,readme",
      "pokemon tcg portfolio tracker in:name,description,readme",
      "tcgdex collection app in:name,description,readme"
    ]);
    expect(queries[0]).not.toContain("want build");
  });

  test("refines plain-English TCG collector prompts into a collectible-card meaning", () => {
    const refinement = planPromptRefinement("Find a good foundation for a Pokémon card binder and price tracker");

    expect(refinement.probableMeaning).toContain("Pokemon TCG");
    expect(refinement.bestQuery).toBe("pokemon tcg collection manager in:name,description,readme");
    expect(refinement.alternateAngles[0]).toContain("pokemon card collection tracker");
  });

  test("hyphenated trading-card prompts use the collectibles vertical", () => {
    const queries = planSearches("I need a trading-card tracker with value estimates");

    expect(queries[0]).toBe("trading card collection manager in:name,description,readme");
    expect(queries).toContain("tcg collection manager price tracker in:name,description,readme");
    expect(queries).not.toContain("pokemon tcg collection manager in:name,description,readme");
  });

  test("non-Pokemon collectibles prompts do not force Pokemon-specific searches", () => {
    const queries = planSearches("MTG collection tracker for sports-card and other collectibles");

    expect(queries[0]).toBe("trading card collection manager in:name,description,readme");
    expect(queries).toContain("sports card collection tracker in:name,description,readme");
    expect(queries).not.toContain("tcgdex collection app in:name,description,readme");
  });
});
