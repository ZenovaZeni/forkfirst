import { describe, it, expect } from "vitest";
import { encodeHandoff, decodeHandoff, ideaSlug } from "./share-url";

const SAMPLE_MARKDOWN = `# Builder Handoff\n\n## Idea\nBuild a local-first app that checks if a product idea exists on GitHub.\n\n## Top Repos\n- octokit/octokit.js\n- nicedoc/nicedoc.io\n`;
const SAMPLE_IDEA = "Local-first GitHub idea checker";

describe("ideaSlug", () => {
  it("slugifies correctly", () => {
    expect(ideaSlug("Hello World! 123")).toBe("hello-world-123");
  });

  it("truncates to 32 chars", () => {
    const long = "a".repeat(100);
    expect(ideaSlug(long).length).toBeLessThanOrEqual(32);
  });

  it("falls back to 'handoff' for empty input", () => {
    expect(ideaSlug("   !!!   ")).toBe("handoff");
  });
});

describe("encodeHandoff / decodeHandoff roundtrip", () => {
  it("roundtrips markdown + idea correctly", async () => {
    const payload = await encodeHandoff(SAMPLE_MARKDOWN, SAMPLE_IDEA);

    expect(payload.startsWith("v1.")).toBe(true);

    const result = await decodeHandoff(payload);
    expect(result).not.toBeNull();
    expect(result!.markdown).toBe(SAMPLE_MARKDOWN);
    expect(result!.idea).toBe(SAMPLE_IDEA);
  });

  it("roundtrips idea-only (minimal markdown)", async () => {
    const payload = await encodeHandoff("", "My tiny idea");
    const result = await decodeHandoff(payload);
    expect(result).not.toBeNull();
    expect(result!.idea).toBe("My tiny idea");
    expect(result!.markdown).toBe("");
  });

  it("slug embedded in payload matches idea", async () => {
    const payload = await encodeHandoff(SAMPLE_MARKDOWN, SAMPLE_IDEA);
    const parts = payload.split(".");
    expect(parts[1]).toBe("local-first-github-idea-checker");
  });
});

describe("decodeHandoff error cases", () => {
  it("returns null for a malformed payload", async () => {
    expect(await decodeHandoff("not-a-valid-payload")).toBeNull();
  });

  it("returns null for wrong version prefix", async () => {
    const payload = await encodeHandoff(SAMPLE_MARKDOWN, SAMPLE_IDEA);
    const bad = "v2" + payload.slice(2);
    expect(await decodeHandoff(bad)).toBeNull();
  });

  it("returns null for corrupted base64", async () => {
    expect(await decodeHandoff("v1.slug.!!!corrupt!!!")).toBeNull();
  });

  it("returns null for empty string", async () => {
    expect(await decodeHandoff("")).toBeNull();
  });
});

describe("payload size guardrail", () => {
  it("throws when encoded payload exceeds 6000 chars", async () => {
    // Generate highly random (incompressible) content to ensure oversized payload.
    // Each line has a unique prefix that prevents gzip from collapsing repetitions.
    const lines: string[] = [];
    for (let i = 0; i < 4000; i++) {
      lines.push(`line-${i}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);
    }
    const hugeMd = lines.join("\n");
    await expect(encodeHandoff(hugeMd, "big idea")).rejects.toThrow(/too long to share/i);
  });
});
