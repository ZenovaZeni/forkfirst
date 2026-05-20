import { describe, expect, test } from "vitest";
import { composeResearchChatResponse } from "./composer";
import { parseResearchChatPlanJson, planResearchChat } from "./planner";
import type { ClassifiedRepo } from "@/lib/analysis/types";

function repo(overrides: Partial<ClassifiedRepo> = {}): ClassifiedRepo {
  return {
    id: 1,
    owner: "vteams",
    name: "open-source-billing",
    fullName: "vteams/open-source-billing",
    url: "https://github.com/vteams/open-source-billing",
    description: "Open Source Billing makes invoices and payments easier for small teams.",
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
    homepage: "https://billing.example.com",
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

describe("research chat planner and composer", () => {
  test("answers casual suggestions without falling into a report template", () => {
    const plan = planResearchChat({
      prompt: "any suggestions?",
      idea: "I want to build a client portal.",
      repos: [repo()]
    });
    const response = composeResearchChatResponse(plan, {
      prompt: "any suggestions?",
      idea: "I want to build a client portal.",
      repos: [repo()]
    });

    expect(plan.intent).toBe("answer_from_context");
    expect(response.reply).toContain("vteams/open-source-billing");
    expect(response.reply).not.toContain("## Short answer");
    expect(response.reply).not.toContain("### Current repo context");
    expect(response.reply.split("\n").filter((line) => line.trim().startsWith("- "))).toHaveLength(0);
    expect(response.actions.some((action) => action.type === "repo_cards")).toBe(false);
    expect(response.actions.some((action) => action.type === "suggested_prompts")).toBe(true);
  });

  test("plans a more-options request as a search refinement", () => {
    const plan = planResearchChat({
      prompt: "Can you find more options like these?",
      idea: "billing portal for freelancers",
      repos: [repo()]
    });

    expect(plan.intent).toBe("refine_search");
    expect(plan.needsSearch).toBe(true);
    expect(plan.searchPrompt).toContain("billing portal for freelancers");
  });

  test("search refinement shows repo cards after the search actually runs", () => {
    const plan = planResearchChat({
      prompt: "Can you find more options like these?",
      idea: "billing portal for freelancers",
      repos: [repo()]
    });
    const beforeSearch = composeResearchChatResponse(plan, {
      prompt: "Can you find more options like these?",
      idea: "billing portal for freelancers",
      repos: [repo()]
    });
    const afterSearch = composeResearchChatResponse(
      {
        ...plan,
        targetRepoFullNames: ["vteams/open-source-billing"]
      },
      {
        prompt: "Can you find more options like these?",
        idea: "billing portal for freelancers",
        repos: [repo()],
        completedSearch: true
      }
    );

    expect(beforeSearch.actions.some((action) => action.type === "repo_cards")).toBe(false);
    expect(beforeSearch.actions.some((action) => action.type === "search_query")).toBe(true);
    expect(afterSearch.actions.some((action) => action.type === "repo_cards")).toBe(true);
    expect(afterSearch.actions.some((action) => action.type === "search_query")).toBe(false);
    expect(afterSearch.reply).toContain("I found");
  });

  test("compare plan uses existing repos instead of asking for a new search", () => {
    const first = repo();
    const second = repo({
      id: 2,
      owner: "invoice-kit",
      name: "starter",
      fullName: "invoice-kit/starter",
      url: "https://github.com/invoice-kit/starter",
      homepage: null,
      score: { ...repo().score, total: 64 }
    });
    const plan = planResearchChat({
      prompt: "Compare these two and tell me which is the better foundation",
      idea: "billing portal for freelancers",
      repos: [first, second]
    });
    const response = composeResearchChatResponse(plan, {
      prompt: "Compare these two and tell me which is the better foundation",
      idea: "billing portal for freelancers",
      repos: [first, second]
    });

    expect(plan.intent).toBe("compare_repos");
    expect(plan.needsSearch).toBe(false);
    expect(plan.targetRepoFullNames).toEqual(["vteams/open-source-billing", "invoice-kit/starter"]);
    expect(response.actions.some((action) => action.type === "compare_table")).toBe(true);
  });

  test("why-these prompts use the comparison path", () => {
    const first = repo();
    const second = repo({
      id: 2,
      owner: "invoice-kit",
      name: "starter",
      fullName: "invoice-kit/starter",
      url: "https://github.com/invoice-kit/starter",
      score: { ...repo().score, total: 64 }
    });
    const plan = planResearchChat({
      prompt: "Why these three?",
      idea: "billing portal for freelancers",
      repos: [first, second]
    });

    expect(plan.intent).toBe("compare_repos");
    expect(plan.targetRepoFullNames).toEqual(["vteams/open-source-billing", "invoice-kit/starter"]);
  });

  test("project-site requests return project link actions", () => {
    const response = composeResearchChatResponse(
      planResearchChat({
        prompt: "Show me the project sites",
        idea: "billing portal for freelancers",
        repos: [repo()]
      }),
      {
        prompt: "Show me the project sites",
        idea: "billing portal for freelancers",
        repos: [repo()]
      }
    );

    const linksAction = response.actions.find((action) => action.type === "project_links");
    expect(linksAction).toBeDefined();
    expect(linksAction?.links).toEqual([
      {
        repoFullName: "vteams/open-source-billing",
        url: "https://billing.example.com/",
        label: "vteams/open-source-billing"
      }
    ]);
  });

  test("project links discard unsafe homepage URLs", () => {
    const response = composeResearchChatResponse(
      planResearchChat({
        prompt: "Show me the project sites",
        idea: "billing portal for freelancers",
        repos: [repo({ homepage: "javascript:alert(1)" })]
      }),
      {
        prompt: "Show me the project sites",
        idea: "billing portal for freelancers",
        repos: [repo({ homepage: "javascript:alert(1)" })]
      }
    );

    expect(response.actions.some((action) => action.type === "project_links")).toBe(false);
  });

  test("handoff action requires confirmation before generation", () => {
    const plan = planResearchChat({
      prompt: "Start the handoff for the best repo",
      idea: "billing portal for freelancers",
      repos: [repo()]
    });
    const response = composeResearchChatResponse(plan, {
      prompt: "Start the handoff for the best repo",
      idea: "billing portal for freelancers",
      repos: [repo()]
    });

    expect(plan.intent).toBe("start_handoff");
    expect(plan.needsConfirmation).toBe(true);
    expect(response.needsConfirmation).toBe(true);
    expect(response.actions.some((action) => action.type === "handoff_confirmation")).toBe(true);
  });

  test("validates AI JSON plans before trusting them", () => {
    const parsed = parseResearchChatPlanJson(`{
      "version": 2,
      "intent": "compare_repos",
      "confidence": 0.7,
      "targetRepoFullNames": ["vteams/open-source-billing"]
    }`);
    const rejected = parseResearchChatPlanJson(`{
      "version": 2,
      "intent": "delete_everything",
      "confidence": 1
    }`);

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.plan.intent).toBe("compare_repos");
    expect(rejected.ok).toBe(false);
  });
});
