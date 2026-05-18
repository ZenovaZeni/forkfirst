import { describe, expect, test } from "vitest";
import { getSavedKeyState, keyStatusLabel } from "./key-status";
import type { UserKeys } from "@/components/key-settings";

const baseKeys: UserKeys = {
  githubToken: "",
  aiProvider: "groq",
  aiApiKey: "",
  aiModel: "llama-3.1-8b-instant",
  aiBaseUrl: ""
};

describe("key status helpers", () => {
  test("distinguishes saved keys from missing keys before verification", () => {
    const state = getSavedKeyState({ ...baseKeys, githubToken: "github_pat_x" });

    expect(state.github).toBe("saved");
    expect(state.ai).toBe("missing");
    expect(state.message).toContain("Verify");
  });

  test("formats status labels", () => {
    expect(keyStatusLabel("verified")).toBe("Verified");
    expect(keyStatusLabel("failed")).toBe("Failed");
    expect(keyStatusLabel("saved")).toBe("Saved");
  });
});
