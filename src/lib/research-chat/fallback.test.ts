import { describe, expect, test } from "vitest";
import { buildConversationalRepoFallback } from "./fallback";
import type { ClassifiedRepo } from "@/lib/analysis/types";

function repo(overrides: Partial<ClassifiedRepo> = {}): ClassifiedRepo {
  return {
    id: 1,
    owner: "vteams",
    name: "open-source-billing",
    fullName: "vteams/open-source-billing",
    url: "https://github.com/vteams/open-source-billing",
    description: "Open Source Billing a super simple way to create and send invoices and receive payments online.",
    language: "TypeScript",
    topics: ["billing", "invoices"],
    stars: 420,
    forks: 40,
    openIssues: 8,
    license: "MIT",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    category: "forkable",
    summary: "A billing app starter.",
    score: {
      total: 78,
      fit: 70,
      activity: 80,
      popularity: 55,
      license: 90,
      docs: 52,
      reasons: ["Partial idea fit", "Recently active", "Has a license"]
    },
    readme: {
      excerpt: "Setup notes and invoice examples.",
      url: "https://github.com/vteams/open-source-billing#readme",
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: false,
      hasLocalDevelopment: false,
      hasLicenseText: true,
      qualityScore: 62,
      reasons: ["setup", "examples"]
    },
    ...overrides
  };
}

describe("research chat conversational fallback", () => {
  test("answers casual suggestion requests like chat instead of a report template", () => {
    const reply = buildConversationalRepoFallback("any suggestions?", [repo()], {
      idea: "I want to build a client portal."
    });

    expect(reply).toContain("Yes");
    expect(reply).toContain("vteams/open-source-billing");
    expect(reply).not.toContain("## Short answer");
    expect(reply).not.toContain("### Current repo context");
    expect(reply).not.toContain("- 1.");
    expect(reply.split("\n").filter((line) => line.trim().startsWith("- "))).toHaveLength(3);
  });
});
