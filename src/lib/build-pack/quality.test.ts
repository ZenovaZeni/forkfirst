import { describe, expect, test } from "vitest";
import { auditBuildPackQuality } from "./quality";

describe("Build Pack quality audit", () => {
  test("flags grocery savings handoffs that drift into recipe bookmarking", () => {
    const audit = auditBuildPackQuality({
      idea: "I want to make a grocery app",
      markdown: [
        "# PRD",
        "## Builder Preferences",
        "- Audience: Help me find groceries cheaper everywhere.",
        "## Product Thesis",
        "The app should help home cooks save recipe links and organize recipes.",
        "## Primary Workflow",
        "1. User saves a recipe URL.",
        "## Core Data Objects",
        "- Recipe",
        "- Ingredient",
        "# STARTER_REPO",
        "- Repo: TomBursch/kitchenowl",
        "# BUILD_PLAN",
        "## Implementation Phases",
        "# REPO_STARTER_NOTES",
        "## License And Reuse",
        "# AGENTS"
      ].join("\n")
    });

    expect(audit.passed).toBe(false);
    expect(audit.issues.map((issue) => issue.id)).toContain("grocery-price-drift");
  });

  test("passes a grocery savings handoff with price and store-plan language", () => {
    const audit = auditBuildPackQuality({
      idea: "I want to make a grocery app",
      markdown: [
        "# STARTER_REPO",
        "- Repo: TomBursch/kitchenowl",
        "# PRD",
        "## Builder Preferences",
        "- Audience: Help me find groceries cheaper everywhere.",
        "## Product Thesis",
        "The app should help shoppers build a grocery list, compare store prices and deals, and save price history.",
        "## Primary Workflow",
        "1. User creates a grocery list.",
        "2. System shows price/deal entries with source and date.",
        "3. User chooses a store plan.",
        "## Core Data Objects",
        "- GroceryItem",
        "- Store",
        "- PriceSnapshot",
        "- Deal",
        "# BUILD_PLAN",
        "## Implementation Phases",
        "# REPO_STARTER_NOTES",
        "## License And Reuse",
        "# AGENTS"
      ].join("\n")
    });

    expect(audit.passed).toBe(true);
    expect(audit.issues).toEqual([]);
  });

  test("flags generic wizard filler and raw README HTML", () => {
    const audit = auditBuildPackQuality({
      idea: "Build a client portal",
      markdown: [
        "# STARTER_REPO",
        "- Keep: I don't know, keep whatever you need",
        "# PRD",
        "## Product Thesis",
        "Turn the selected repo into the user's product idea.",
        "# BUILD_PLAN",
        "## Implementation Phases",
        "# REPO_STARTER_NOTES",
        "## Architecture Evidence",
        '- Command: <a href="https://example.com">',
        "## License And Reuse",
        "# AGENTS"
      ].join("\n")
    });

    expect(audit.passed).toBe(false);
    expect(audit.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(["generic-filler", "raw-html"])
    );
  });
});
