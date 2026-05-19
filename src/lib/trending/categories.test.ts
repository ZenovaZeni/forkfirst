import { describe, it, expect } from "vitest";
import {
  TRENDING_CATEGORIES,
  buildTrendingQueries,
  findCategory
} from "./categories";

describe("trending categories", () => {
  it("every category has all required fields", () => {
    for (const cat of TRENDING_CATEGORIES) {
      expect(cat.id).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.blurb).toBeTruthy();
      expect(cat.queryTemplates.length).toBeGreaterThan(0);
    }
  });

  it("buildTrendingQueries substitutes {since} with a date 30 days ago", () => {
    const cat = TRENDING_CATEGORIES.find((c) => c.id === "ai-agents")!;
    const result = buildTrendingQueries(cat)[0];
    // {since} must be replaced
    expect(result).not.toContain("{since}");
    // The substituted date should be ISO format YYYY-MM-DD
    const match = result.match(/pushed:>(\d{4}-\d{2}-\d{2})/);
    expect(match).not.toBeNull();
    const since = new Date(match![1]);
    const diffDays = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24);
    // Should be approximately 30 days (±2 for timing jitter)
    expect(diffDays).toBeGreaterThan(28);
    expect(diffDays).toBeLessThan(32);
  });

  it("findCategory returns the right category", () => {
    const cat = findCategory("saas-starters");
    expect(cat).toBeDefined();
    expect(cat!.id).toBe("saas-starters");
    expect(cat!.label).toBe("SaaS Starters");
  });

  it("findCategory returns undefined for unknown ids", () => {
    const cat = findCategory("not-a-real-category");
    expect(cat).toBeUndefined();
  });

  it("every category uses the recent activity window", () => {
    const cat = findCategory("all")!;
    const results = buildTrendingQueries(cat);
    for (const result of results) {
      expect(result).not.toContain("{since}");
      expect(result).toContain("pushed:>");
    }
  });
});
