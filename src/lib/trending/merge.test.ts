import { describe, expect, it } from "vitest";
import { balancedTrendingItems } from "./merge";
import type { TrendingCategoryId } from "./categories";

function item(fullName: string, stars: number) {
  return {
    full_name: fullName,
    stargazers_count: stars
  };
}

describe("trending all merge", () => {
  it("round-robins categories instead of letting one category dominate by stars", () => {
    const ai = "ai-agents" satisfies TrendingCategoryId;
    const ui = "ui-kits" satisfies TrendingCategoryId;
    const mobile = "mobile-pwa" satisfies TrendingCategoryId;

    const merged = balancedTrendingItems([
      { categoryId: ai, items: [item("ai/one", 5000), item("ai/two", 4000)] },
      { categoryId: ui, items: [item("ui/one", 700), item("ui/two", 600)] },
      { categoryId: mobile, items: [item("mobile/one", 300), item("mobile/two", 200)] }
    ], [ai, ui, mobile], 6);

    expect(merged.map((repo) => repo.item.full_name)).toEqual([
      "ai/one",
      "ui/one",
      "mobile/one",
      "ai/two",
      "ui/two",
      "mobile/two"
    ]);
  });

  it("dedupes repos that appear in multiple categories", () => {
    const ai = "ai-agents" satisfies TrendingCategoryId;
    const web = "web-apps" satisfies TrendingCategoryId;

    const merged = balancedTrendingItems([
      { categoryId: ai, items: [item("shared/repo", 1000), item("ai/only", 900)] },
      { categoryId: web, items: [item("shared/repo", 1000), item("web/only", 800)] }
    ], [ai, web], 4);

    expect(merged.map((repo) => repo.item.full_name)).toEqual(["shared/repo", "ai/only", "web/only"]);
    expect(merged[0].sourceCategoryId).toBe(ai);
    expect(merged[0].matchedCategoryIds).toEqual([ai, web]);
  });
});
