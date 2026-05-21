import { describe, expect, test } from "vitest";
import { LAUNCH_EVAL_CASES, runLaunchEvalCase } from "./runner";

describe("launch evals", () => {
  test.each(LAUNCH_EVAL_CASES)("$id passes the offline idea-to-handoff contract", (evalCase) => {
    const result = runLaunchEvalCase(evalCase);

    expect(result.queries[0]).toContain(evalCase.expected.bestQueryContains);
    expect(result.topRepo?.fullName).toBe(evalCase.expected.expectedTopRepo);
    const expectedCategories = Array.isArray(evalCase.expected.expectedTopCategory)
      ? evalCase.expected.expectedTopCategory
      : [evalCase.expected.expectedTopCategory];
    expect(expectedCategories).toContain(result.topRepo?.category);
    expect(result.topRepo?.score.fit ?? 0).toBeGreaterThanOrEqual(evalCase.expected.minFit);
    expect(result.blueprint.productKind).toBe(evalCase.expected.productKind);

    for (const text of evalCase.expected.handoffMustContain) {
      expect(result.markdown).toMatch(new RegExp(text, "i"));
    }
    for (const text of evalCase.expected.handoffMustNotContain) {
      expect(result.markdown).not.toMatch(new RegExp(text, "i"));
    }

    expect(result.audit.passed).toBe(evalCase.expected.qualityAuditPass);
  });
});
