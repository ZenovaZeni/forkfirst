import { describe, expect, test } from "vitest";
import { buildAnswerHeadline, buildAnswerSections, buildHumanAnswer, buildRepoNarrative } from "./human-answer";
import type { ClassifiedRepo } from "./types";

function repo(overrides: Partial<ClassifiedRepo> = {}): ClassifiedRepo {
  return {
    id: 1,
    owner: "acme",
    name: "engine",
    fullName: "acme/engine",
    url: "https://github.com/acme/engine",
    description: "A modular open-source game engine with editor tooling and examples.",
    language: "TypeScript",
    topics: ["game-engine", "editor"],
    stars: 1200,
    forks: 140,
    openIssues: 12,
    license: "MIT",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    category: "forkable",
    summary: "A modular open-source game engine with editor tooling and examples.",
    score: {
      total: 82,
      fit: 72,
      activity: 84,
      popularity: 62,
      license: 100,
      docs: 86,
      reasons: ["Strong keyword fit", "Recently active", "License detected"]
    },
    readme: {
      excerpt: "Includes quickstart setup, examples, plugins, and local development notes for building games.",
      url: "https://github.com/acme/engine#readme",
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 86,
      reasons: ["setup", "examples"]
    },
    ...overrides
  };
}

describe("human answer", () => {
  test("writes a direct human answer with repo-specific paragraphs instead of static boilerplate", () => {
    const answer = buildHumanAnswer("are there any games open repo? or game engines?", [
      repo({ fullName: "acme/engine", name: "engine" }),
      repo({ fullName: "playkit/studio", name: "studio", category: "reference", score: { ...repo().score, fit: 54 } }),
      repo({ fullName: "canvas/gamekit", name: "gamekit", category: "already_exists", score: { ...repo().score, fit: 88 } })
    ]);

    expect(answer).toContain("Yes");
    expect(answer).toContain("acme/engine");
    expect(answer).toContain("modular open-source game engine");
    expect(answer).toContain("Why it matters:");
    expect(answer).not.toContain("Yes, start with these repos");
  });

  test("builds sectioned answer data for UI rendering", () => {
    const sections = buildAnswerSections("Do any repo search apps already exist?", [
      repo({ fullName: "acme/engine", name: "engine" }),
      repo({ fullName: "playkit/studio", name: "studio" }),
      repo({ fullName: "canvas/gamekit", name: "gamekit" })
    ]);

    expect(sections.intro).toContain("repos");
    expect(sections.picks).toHaveLength(3);
    expect(sections.picks[0]).toMatchObject({
      rank: 1,
      repoName: "acme/engine",
      role: "best copy-and-customize option"
    });
    expect(sections.picks[0].why).toContain("Why it matters:");
  });

  test("uses a name-focused headline and answer when the user asks about a project name", () => {
    const headline = buildAnswerHeadline("Does anything else out there have the name ForkFirst?", [repo()]);
    const answer = buildHumanAnswer("Does anything else out there have the name ForkFirst?", [repo()]);

    expect(headline).toBe("Similar names found");
    expect(answer).toContain("similar names");
  });

  test("uses discovery language for broad repo exploration prompts", () => {
    const headline = buildAnswerHeadline("What are some cool repos involving AI?", [repo()]);
    const sections = buildAnswerSections("What are some cool repos involving AI?", [repo()]);

    expect(headline).toBe("AI repos worth exploring");
    expect(sections.intro).toContain("interesting AI repos");
  });

  test("keeps real estate lead-gen prompts out of generic AI framing", () => {
    const headline = buildAnswerHeadline("AI lead gen tools for realtors or real estate", [repo()]);
    const sections = buildAnswerSections("AI lead gen tools for realtors or real estate", [repo()]);

    expect(headline).toBe("Real estate lead-gen repos found");
    expect(sections.intro).toContain("real-estate lead-generation");
    expect(sections.intro).not.toContain("interesting AI repos");
  });

  test("repo narrative includes what it does and what to check next", () => {
    const narrative = buildRepoNarrative(repo());

    expect(narrative.overview).toContain("A modular open-source game engine");
    expect(narrative.why).toContain("strong");
    expect(narrative.next).toContain("Open GitHub");
  });

  test("repo narrative removes README markup and raw URLs from summaries", () => {
    const narrative = buildRepoNarrative(
      repo({
        description: "A game engine for web projects.",
        readme: {
          ...repo().readme!,
          excerpt:
            "![badge](https://img.shields.io/badge/test.svg) See [docs](https://example.com/docs) for setup steps and local examples before choosing it."
        }
      })
    );

    expect(narrative.overview).toContain("See docs for setup");
    expect(narrative.overview).not.toContain("https://");
    expect(narrative.overview).not.toContain("<img");
  });

  test("explains curated lists as research maps rather than apps", () => {
    const narrative = buildRepoNarrative(
      repo({
        owner: "steven2358",
        name: "awesome-generative-ai",
        fullName: "steven2358/awesome-generative-ai",
        description: "A curated list of modern Generative Artificial Intelligence projects and services.",
        topics: ["awesome-list", "generative-ai"],
        category: "reference",
        readme: {
          ...repo().readme!,
          hasSetup: false,
          hasExamples: false,
          excerpt: "A curated list of modern Generative Artificial Intelligence projects and services."
        }
      })
    );

    expect(narrative.kindLabel).toBe("Directory / List");
    expect(narrative.overview).toContain("not a single app");
    expect(narrative.goodFor).toContain("Research");
    expect(narrative.notFor).toContain("Copying");
  });

  test("explains agent packs as developer workflow tools", () => {
    const sections = buildAnswerSections("Can I use this for lead generation?", [
      repo({
        owner: "wshobson",
        name: "agents",
        fullName: "wshobson/agents",
        description: "Claude Code Plugins: Orchestration and Automation with agent skills and slash commands.",
        topics: ["claude-code", "agents", "plugins"],
        category: "reference",
        readme: {
          ...repo().readme!,
          excerpt: "185 specialized AI agents, workflow orchestrators, agent skills, and commands for Claude Code."
        }
      })
    ]);

    expect(sections.picks[0].role).toBe("developer workflow pack");
    expect(sections.picks[0].overview).toContain("workflow helpers");
  });
});
