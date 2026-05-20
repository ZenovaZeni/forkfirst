import { describe, expect, test } from "vitest";
import { inferRepoSetupFit, setupPreferenceScore } from "./setup-fit";

describe("repo setup fit", () => {
  test("detects docker-friendly repos before OS-specific signals", () => {
    const fit = inferRepoSetupFit({
      fullName: "acme/app",
      description: "Run with docker compose on Windows, macOS, or Linux.",
      topics: ["docker"]
    });
    expect(fit.id).toBe("docker-friendly");
    expect(setupPreferenceScore(fit, "windows")).toBeGreaterThan(0);
  });

  test("detects web hosted foundations from stack and topics", () => {
    const fit = inferRepoSetupFit({
      fullName: "acme/saas",
      language: "TypeScript",
      topics: ["nextjs", "dashboard", "saas"]
    });
    expect(fit.id).toBe("web-hosted");
    expect(setupPreferenceScore(fit, "web")).toBeGreaterThan(0);
  });

  test("flags mobile-native repos as not normal web starters", () => {
    const fit = inferRepoSetupFit({
      fullName: "acme/ios-app",
      language: "Swift",
      topics: ["ios", "mobile-app"]
    });
    expect(fit.id).toBe("mobile-native");
    expect(setupPreferenceScore(fit, "web")).toBeLessThan(0);
  });

  test("flags shell-heavy setup as macOS or Linux leaning", () => {
    const fit = inferRepoSetupFit({
      fullName: "acme/tool",
      readme: { excerpt: "Install with brew install and run make dev." }
    });
    expect(fit.id).toBe("mac-linux-focused");
    expect(setupPreferenceScore(fit, "windows")).toBeLessThan(0);
  });
});
