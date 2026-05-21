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

  test("plans grocery app searches around the product vertical, not generic make terms", () => {
    const refinement = planPromptRefinement("I want to make a grocery app");

    expect(refinement.probableMeaning).toContain("grocery");
    expect(refinement.bestQuery).toBe("grocery shopping list app in:name,description,readme");
    expect(refinement.queries.slice(0, 4)).toEqual([
      "grocery shopping list app in:name,description,readme",
      "grocery store app in:name,description,readme",
      "shopping list app in:name,description,readme",
      "grocery inventory app in:name,description,readme"
    ]);
    expect(refinement.queries.join(" ")).not.toContain("make grocery");
  });

  test("plans recipe and meal-planning searches around recipe managers", () => {
    const refinement = planPromptRefinement("I need a recipe saving app with meal planning");

    expect(refinement.bestQuery).toBe("recipe manager app in:name,description,readme");
    expect(refinement.queries.slice(0, 4)).toEqual([
      "recipe manager app in:name,description,readme",
      "meal planner app in:name,description,readme",
      "self hosted recipe manager in:name,description,readme",
      "cookbook app in:name,description,readme"
    ]);
    expect(refinement.queries.join(" ")).not.toContain("need recipe");
  });

  test("plans client portal searches around portals, invoices, and messaging", () => {
    const refinement = planPromptRefinement("I want to build a client portal with invoices and messaging");

    expect(refinement.bestQuery).toBe("client portal invoice messaging in:name,description,readme");
    expect(refinement.queries.slice(0, 4)).toEqual([
      "client portal invoice messaging in:name,description,readme",
      "customer portal invoicing in:name,description,readme",
      "client dashboard messaging in:name,description,readme",
      "invoice client portal in:name,description,readme"
    ]);
  });

  test("plans service-business CRM prompts around contractor workflows instead of generic lead gen", () => {
    expect(planSearches("I want to build a simple CRM for a roofing company").slice(0, 4)).toEqual([
      "roofing crm app in:name,description,readme",
      "contractor crm app in:name,description,readme",
      "field service management app in:name,description,readme",
      "home service crm in:name,description,readme"
    ]);
  });

  test("plans cleaning company ops prompts around field service and crew scheduling", () => {
    expect(planSearches("I want an app for a cleaning company to manage quotes, jobs, crews, and follow-ups").slice(0, 5)).toEqual([
      "cleaning business management app in:name,description,readme",
      "cleaning company scheduling app in:name,description,readme",
      "janitorial service management app in:name,description,readme",
      "field service job scheduling app in:name,description,readme",
      "quote job crew management app in:name,description,readme"
    ]);
  });

  test("plans Shopify analytics prompts around profit, ad spend, and inventory dashboards", () => {
    expect(planSearches("I want a dashboard for tracking Shopify store profit, ad spend, and inventory").slice(0, 4)).toEqual([
      "shopify analytics dashboard in:name,description,readme",
      "ecommerce profit dashboard in:name,description,readme",
      "shopify inventory dashboard in:name,description,readme",
      "ad spend dashboard ecommerce in:name,description,readme"
    ]);
  });

  test("plans common utility app verticals without raw sentence search first", () => {
    expect(planSearches("I want to make a personal finance budget app").slice(0, 3)).toEqual([
      "personal finance budget app in:name,description,readme",
      "expense tracker app in:name,description,readme",
      "budget planner app in:name,description,readme"
    ]);
    expect(planSearches("I want to make a simple habit tracker app").slice(0, 3)).toEqual([
      "habit tracker app in:name,description,readme",
      "habit tracking app in:name,description,readme",
      "goal tracker app in:name,description,readme"
    ]);
    expect(planSearches("I want to make a job board app").slice(0, 3)).toEqual([
      "job board app in:name,description,readme",
      "job portal app in:name,description,readme",
      "recruitment job board in:name,description,readme"
    ]);
  });

  test("plans booking and restaurant prompts around reservation products", () => {
    expect(planSearches("I want to build a booking app for a small salon").slice(0, 3)).toEqual([
      "salon booking app in:name,description,readme",
      "appointment booking app in:name,description,readme",
      "salon appointment scheduler in:name,description,readme"
    ]);
    expect(planSearches("I want to build a restaurant reservation app").slice(0, 3)).toEqual([
      "restaurant reservation app in:name,description,readme",
      "table booking app in:name,description,readme",
      "restaurant booking system in:name,description,readme"
    ]);
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

  test("normalizes accented Pokemon prompts into the Pokemon TCG vertical", () => {
    const prompt = "I'm looking for a Pok\u00e9mon like repo that lets me keep my Pok\u00e9mon cards and see values.";
    const refinement = planPromptRefinement(prompt);

    expect(refinement.bestQuery).toBe("pokemon tcg collection manager in:name,description,readme");
    expect(refinement.queries.slice(0, 3)).toEqual([
      "pokemon tcg collection manager in:name,description,readme",
      "pokemon card collection tracker in:name,description,readme",
      "tcg collection manager price tracker in:name,description,readme"
    ]);
  });

  test("recovers damaged Pokemon spellings instead of searching filler words", () => {
    const prompt = "I'm looking for a Pok?mon like repo that lets me see cause to keep my Pok?mon cards, values, all that stuff.";
    const refinement = planPromptRefinement(prompt);

    expect(refinement.bestQuery).toBe("pokemon tcg collection manager in:name,description,readme");
    expect(refinement.queries.join(" ")).not.toContain("cause");
    expect(refinement.queries.join(" ")).not.toContain("pok mon");
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

  test("plans short cat ID prompts as pet identification, not Unix cat tools", () => {
    const refinement = planPromptRefinement("cat id app");

    expect(refinement.bestQuery).toBe("cat breed identifier app in:name,description,readme");
    expect(refinement.queries.slice(0, 4)).toEqual([
      "cat breed identifier app in:name,description,readme",
      "pet identification app in:name,description,readme",
      "animal image recognition app in:name,description,readme",
      "cat scanner app in:name,description,readme"
    ]);
    expect(refinement.queries.join(" ")).not.toMatch(/\bcat github\b|\bcat open source\b/);
  });

  test("plans prompt organizer prompts around prompt libraries before image generators", () => {
    const refinement = planPromptRefinement("I want to make an AI image prompt organizer");

    expect(refinement.bestQuery).toBe("ai prompt manager app in:name,description,readme");
    expect(refinement.queries.slice(0, 4)).toEqual([
      "ai prompt manager app in:name,description,readme",
      "prompt library app in:name,description,readme",
      "image prompt organizer in:name,description,readme",
      "prompt collection manager in:name,description,readme"
    ]);
  });

  test("plans family sports schedule prompts around team calendars", () => {
    const refinement = planPromptRefinement("I want to build a thing that helps parents organize kids sports schedules");

    expect(refinement.bestQuery).toBe("youth sports team schedule app in:name,description,readme");
    expect(refinement.queries.slice(0, 4)).toEqual([
      "youth sports team schedule app in:name,description,readme",
      "team management app in:name,description,readme",
      "family calendar app in:name,description,readme",
      "event scheduling app in:name,description,readme"
    ]);
  });

  test("plans receipt scanner expense prompts around receipts, OCR, and CSV", () => {
    const refinement = planPromptRefinement("I want to build a local-first receipt scanner that tracks expenses and exports to CSV");

    expect(refinement.bestQuery).toBe("receipt scanner expense tracker csv in:name,description,readme");
    expect(refinement.queries.slice(0, 4).join(" ")).toMatch(/receipt/);
    expect(refinement.queries.slice(0, 4).join(" ")).toMatch(/expense/);
    expect(refinement.queries.slice(0, 4).join(" ")).toMatch(/scanner|ocr/);
    expect(refinement.queries.slice(0, 4).join(" ")).toMatch(/csv|export/);
  });

  test("treats recipe scanner with expenses and CSV as likely receipt scanner wording", () => {
    const refinement = planPromptRefinement("I want a recipe scanner that tracks expenses and exports CSV");
    const earlyQueries = refinement.queries.slice(0, 4).join(" ");

    expect(refinement.bestQuery).toBe("receipt scanner expense tracker csv in:name,description,readme");
    expect(earlyQueries).toMatch(/receipt/);
    expect(earlyQueries).toMatch(/expense/);
    expect(earlyQueries).toMatch(/csv|export/);
    expect(earlyQueries).not.toMatch(/\brecipe manager\b|meal planner|cookbook/i);
  });
});
