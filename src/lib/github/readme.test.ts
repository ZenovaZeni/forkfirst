import { describe, expect, test } from "vitest";
import { analyzeReadme } from "./readme";

describe("analyzeReadme", () => {
  test("detects setup, examples, API, and local-development signals", () => {
    const result = analyzeReadme(`
      # Local Repo Assistant

      ## Installation
      npm install

      ## Quickstart
      npm run dev

      ## Example
      Use the GitHub API to scan repositories.

      MIT License
    `);

    expect(result.hasSetup).toBe(true);
    expect(result.hasExamples).toBe(true);
    expect(result.hasApiDetails).toBe(true);
    expect(result.hasLocalDevelopment).toBe(true);
    expect(result.qualityScore).toBeGreaterThanOrEqual(80);
    expect(result.reasons).toContain("README explains setup");
  });
});
