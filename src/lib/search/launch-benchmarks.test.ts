import { describe, expect, test } from "vitest";
import { buildHandoffBlueprint } from "../build-pack/blueprint";
import { planPromptRefinement } from "./planner";

describe("launch prompt benchmarks", () => {
  test.each([
    ["grocery app", "I want to make a grocery app", "grocery shopping list app"],
    ["grocery savings app", "I need a grocery app that helps me find cheaper groceries everywhere", "grocery shopping list app"],
    ["Pokemon collector", "I want an app like Pokemon Collector that tracks card values and albums", "pokemon tcg collection manager"],
    ["client portal", "I want to build a client portal with invoices and messaging", "client portal invoice messaging"],
    ["salon booking", "I want to build a booking app for a small salon", "salon booking app"],
    ["recipe meal planning", "I need a recipe saving app with meal planning", "recipe manager app"],
    ["budget app", "I want to make a personal finance budget app", "personal finance budget app"],
    ["job board", "I want to make a job board app", "job board app"],
    ["cat ID app", "cat id app", "cat breed identifier app"],
    ["image prompt organizer", "I want to make an AI image prompt organizer", "ai prompt manager app"],
    ["kids sports schedules", "I want to build a thing that helps parents organize kids sports schedules", "youth sports team schedule app"],
    ["roofing CRM", "I want to build a simple CRM for a roofing company", "roofing crm app"],
    ["Shopify profit dashboard", "I want a dashboard for tracking Shopify store profit, ad spend, and inventory", "shopify analytics dashboard"]
  ])("plans %s with the expected first search angle", (_name, prompt, expectedQueryStart) => {
    const refinement = planPromptRefinement(prompt);

    expect(refinement.bestQuery).toContain(expectedQueryStart);
    expect(refinement.bestQuery).not.toMatch(/\b(i|want|make|need)\b/i);
  });

  test("handoff blueprint benchmark keeps grocery savings distinct from recipe bookmarking", () => {
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I need a grocery app that helps me find cheaper groceries everywhere",
      researchContext: null,
      chatContext: null,
      queries: ["grocery shopping list app in:name,description,readme"],
      candidateRepos: [],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("grocery-shopping");
    expect(blueprint.productThesis).toMatch(/prices|deals|saves money/i);
    expect(blueprint.productThesis).not.toMatch(/recipe links|bookmark/i);
  });
});
