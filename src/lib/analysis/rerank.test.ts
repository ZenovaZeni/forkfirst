import { describe, expect, test } from "vitest";
import type { ClassifiedRepo } from "./types";
import { applyRerankRecommendations, shouldUseAiReranker } from "./rerank";

function repo(fullName: string, total: number): ClassifiedRepo {
  const [owner, name] = fullName.split("/");
  return {
    id: total,
    owner,
    name,
    fullName,
    url: `https://github.com/${fullName}`,
    description: `${name} description`,
    language: "TypeScript",
    topics: [],
    stars: 100,
    forks: 10,
    openIssues: 1,
    license: "MIT",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    category: "forkable",
    score: { total, fit: total, activity: 80, popularity: 50, license: 100, docs: 80, reasons: ["Initial score"] },
    summary: "Starter"
  };
}

describe("AI rerank guardrails", () => {
  test("applies known repo recommendations while preserving every original candidate", () => {
    const original = [repo("one/weak", 70), repo("two/better", 68), repo("three/other", 66)];
    const reranked = applyRerankRecommendations(original, [
      { fullName: "unknown/repo", reason: "ignore me" },
      { fullName: "two/better", reason: "better product workflow evidence" }
    ]);

    expect(reranked.map((item) => item.fullName)).toEqual(["two/better", "one/weak", "three/other"]);
    expect(reranked[0].summary).toMatch(/AI rerank: better product workflow evidence/i);
    expect(reranked).toHaveLength(original.length);
  });

  test("uses AI reranker only when the user supplied a BYOK provider key", () => {
    expect(shouldUseAiReranker({ apiKey: undefined, repos: [repo("one/weak", 70), repo("two/better", 68)] })).toBe(false);
    expect(shouldUseAiReranker({ apiKey: "sk-test", repos: [repo("one/weak", 70)] })).toBe(false);
    expect(shouldUseAiReranker({ apiKey: "sk-test", repos: [repo("one/weak", 70), repo("two/better", 68)] })).toBe(true);
  });
});
