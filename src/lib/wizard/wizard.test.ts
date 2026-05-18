import { describe, it, expect } from "vitest";
import { buildRefinedIdea } from "./refine";
import { WIZARD_PRESETS, applyPreset } from "./presets";

// ---------------------------------------------------------------------------
// buildRefinedIdea — answer-merging logic
// ---------------------------------------------------------------------------
describe("buildRefinedIdea", () => {
  it("returns the original idea unchanged when no answers are provided", () => {
    const result = buildRefinedIdea("I want to build a job tracker", {});
    expect(result).toBe("I want to build a job tracker");
  });

  it("returns the original idea unchanged when all answers are empty strings", () => {
    const result = buildRefinedIdea("job tracker idea", { backend: "", auth: "" });
    expect(result).toBe("job tracker idea");
  });

  it("returns the original idea unchanged when all answers are 'Skip'", () => {
    const result = buildRefinedIdea("job tracker idea", { backend: "Skip", auth: "Skip" });
    expect(result).toBe("job tracker idea");
  });

  it("builds a refined idea string from a full set of answers", () => {
    const result = buildRefinedIdea("job tracker", {
      backend: "Vercel functions",
      auth: "No auth",
      brand: "#2563eb",
      users: "indie hackers"
    });
    expect(result).toContain('Original idea: "job tracker"');
    expect(result).toContain("Builder context:");
    expect(result).toContain("- Backend: Vercel functions");
    expect(result).toContain("- Auth: No auth");
    expect(result).toContain("- Brand: #2563eb");
    expect(result).toContain("- Users: indie hackers");
  });

  it("omits 'Skip' answers from the refined idea", () => {
    const result = buildRefinedIdea("portfolio site", {
      backend: "Skip",
      auth: "No auth",
      brand: ""
    });
    expect(result).not.toContain("Skip");
    expect(result).toContain("- Auth: No auth");
    expect(result).not.toContain("Backend");
    expect(result).not.toContain("Brand");
  });

  it("capitalizes and de-hyphenates the answer key label", () => {
    const result = buildRefinedIdea("my idea", { "custom-1": "solo founders" });
    expect(result).toContain("- Custom 1: solo founders");
  });

  it("handles a single answer producing a minimal builder context block", () => {
    const result = buildRefinedIdea("minimal idea", { deploy: "Vercel" });
    const lines = result.split("\n").filter(Boolean);
    expect(lines[0]).toBe('Original idea: "minimal idea"');
    expect(lines.some((l) => l === "Builder context:")).toBe(true);
    expect(lines.some((l) => l.includes("Deploy: Vercel"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Quickstart Presets
// ---------------------------------------------------------------------------
describe("WIZARD_PRESETS / applyPreset", () => {
  const saasPreset = WIZARD_PRESETS.find((p) => p.id === "saas")!;
  const customPreset = WIZARD_PRESETS.find((p) => p.id === "custom")!;

  it("selecting a preset fills matching wizard question ids", () => {
    const questionIds = ["backend", "auth", "brand"];
    const filled = applyPreset(saasPreset, questionIds);
    expect(filled["backend"]).toBe("Vercel functions + Supabase Postgres");
    expect(filled["auth"]).toBe("Clerk");
    expect(filled["brand"]).toBe("#2563eb");
  });

  it("clicking the Custom preset returns an empty answers map (clears all pre-fills)", () => {
    const questionIds = ["backend", "auth", "deploy", "brand", "users"];
    const filled = applyPreset(customPreset, questionIds);
    expect(Object.keys(filled)).toHaveLength(0);
  });

  it("clicking a preset overwrites previously-filled answers for matching keys", () => {
    const questionIds = ["backend", "auth"];
    // First apply saas
    const afterSaas = applyPreset(saasPreset, questionIds);
    expect(afterSaas["auth"]).toBe("Clerk");
    // Now apply ai-tool — auth key should be overwritten
    const aiToolPreset = WIZARD_PRESETS.find((p) => p.id === "ai-tool")!;
    const afterAiTool = applyPreset(aiToolPreset, questionIds);
    expect(afterAiTool["auth"]).toBe("None or magic link");
  });

  it("preset keys that do not match any wizard question are gracefully skipped", () => {
    // "payments" is in the saas preset but not in our question list
    const questionIds = ["backend", "users"];
    const filled = applyPreset(saasPreset, questionIds);
    expect("payments" in filled).toBe(false);
    expect(filled["backend"]).toBe("Vercel functions + Supabase Postgres");
    expect(filled["users"]).toBe("Indie founders");
  });
});

// ---------------------------------------------------------------------------
// API response parsing helpers (inline, no fetch needed)
// ---------------------------------------------------------------------------
describe("wizard question schema validation", () => {
  function isValidQuestion(q: unknown): boolean {
    if (typeof q !== "object" || q === null) return false;
    const obj = q as Record<string, unknown>;
    return typeof obj["id"] === "string" && typeof obj["label"] === "string";
  }

  it("accepts a well-formed question object", () => {
    expect(
      isValidQuestion({
        id: "backend",
        label: "Will this need a backend?",
        suggestions: ["Local-first", "Vercel"],
        kind: "select"
      })
    ).toBe(true);
  });

  it("rejects a question missing id", () => {
    expect(isValidQuestion({ label: "What color?" })).toBe(false);
  });

  it("rejects a question missing label", () => {
    expect(isValidQuestion({ id: "color" })).toBe(false);
  });

  it("rejects non-object input", () => {
    expect(isValidQuestion("string")).toBe(false);
    expect(isValidQuestion(null)).toBe(false);
    expect(isValidQuestion(42)).toBe(false);
  });
});
