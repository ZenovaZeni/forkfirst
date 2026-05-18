import { describe, expect, test } from "vitest";
import { createUsageEntry, estimateTokens, formatEstimatedCost, summarizeUsage } from "./costs";

describe("usage cost estimates", () => {
  test("estimates tokens from text length", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("hello world")).toBe(3);
  });

  test("creates local estimate entries for a provider/model", () => {
    const entry = createUsageEntry({
      provider: "openai",
      model: "gpt-4.1-nano",
      action: "chat",
      inputText: "a".repeat(400),
      outputText: "b".repeat(800)
    });

    expect(entry.inputTokens).toBe(100);
    expect(entry.outputTokens).toBe(200);
    expect(entry.estimatedCostUsd).toBeGreaterThan(0);
    expect(entry.rateLabel).toContain("OpenAI");
    expect(entry.estimated).toBe(true);
  });

  test("summarizes entries and formats tiny costs", () => {
    const entries = [
      createUsageEntry({ provider: "groq", model: "llama-3.1-8b-instant", action: "chat", inputText: "a".repeat(400), outputText: "b".repeat(400) }),
      createUsageEntry({ provider: "custom", model: "local", action: "idea-check", inputText: "a", outputText: "b" })
    ];
    const summary = summarizeUsage(entries);

    expect(summary.entries).toBe(2);
    expect(summary.inputTokens).toBeGreaterThan(0);
    expect(formatEstimatedCost(summary.estimatedCostUsd)).toMatch(/\$0\.00|<\$0\.01/);
  });
});
