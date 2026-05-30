import { describe, expect, test } from "vitest";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import {
  buildAttributionSnippet,
  profileForLicense,
  renderLicenseAndAttributionBlock,
  renderRespectfulUseChecklist
} from "./license";

function makeRepo(overrides: Partial<ClassifiedRepo> = {}): ClassifiedRepo {
  return {
    id: 1,
    owner: "octocat",
    name: "hello-world",
    fullName: "octocat/hello-world",
    url: "https://github.com/octocat/hello-world",
    description: "A friendly starter.",
    language: "TypeScript",
    topics: [],
    stars: 100,
    forks: 10,
    openIssues: 2,
    license: "MIT",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    category: "forkable",
    score: { total: 80, fit: 75, activity: 80, popularity: 70, license: 95, docs: 70, reasons: [] },
    summary: "ok",
    ...overrides
  };
}

describe("profileForLicense", () => {
  test("MIT is permissive with attribution required", () => {
    const profile = profileForLicense("MIT");
    expect(profile.family).toBe("permissive");
    expect(profile.attributionRequired).toBe(true);
    expect(profile.shareAlikeRequired).toBe(false);
    expect(profile.permissions).toContain("Commercial use");
  });

  test("Apache-2.0 calls out the NOTICE file and change-marking", () => {
    const profile = profileForLicense("Apache-2.0");
    expect(profile.family).toBe("permissive");
    expect(profile.conditions.some((c) => /NOTICE/i.test(c))).toBe(true);
    expect(profile.conditions.some((c) => /significant changes/i.test(c))).toBe(true);
  });

  test("AGPL is recognized as network copyleft", () => {
    const profile = profileForLicense("AGPL-3.0");
    expect(profile.family).toBe("network-copyleft");
    expect(profile.shareAlikeRequired).toBe(true);
    expect(profile.oneLineSummary).toMatch(/network|SaaS|hosted/i);
  });

  test("GPL is strong copyleft", () => {
    const profile = profileForLicense("GPL-3.0");
    expect(profile.family).toBe("strong-copyleft");
    expect(profile.shareAlikeRequired).toBe(true);
  });

  test("LGPL is weak copyleft", () => {
    const profile = profileForLicense("LGPL-2.1");
    expect(profile.family).toBe("weak-copyleft");
  });

  test("MPL-2.0 is weak (per-file) copyleft", () => {
    const profile = profileForLicense("MPL-2.0");
    expect(profile.family).toBe("weak-copyleft");
    expect(profile.shareAlikeRequired).toBe(true);
  });

  test("BSD is permissive", () => {
    const profile = profileForLicense("BSD-3-Clause");
    expect(profile.family).toBe("permissive");
  });

  test("Unlicense and CC0 are public domain — attribution legally optional", () => {
    expect(profileForLicense("Unlicense").family).toBe("public-domain");
    expect(profileForLicense("Unlicense").attributionRequired).toBe(false);
    expect(profileForLicense("CC0-1.0").family).toBe("public-domain");
  });

  test("NOASSERTION is treated as proprietary-or-unknown with reuse blocked", () => {
    const profile = profileForLicense("NOASSERTION");
    expect(profile.family).toBe("proprietary-or-unknown");
    expect(profile.permissions.length).toBe(0);
    expect(profile.forbidden.some((f) => /do not copy/i.test(f))).toBe(true);
  });

  test("null license routes to the missing-license profile", () => {
    const profile = profileForLicense(null);
    expect(profile.family).toBe("missing");
    expect(profile.spdx).toBe(null);
    expect(profile.forbidden.some((f) => /Do not copy code/i.test(f))).toBe(true);
  });

  test("unknown SPDX falls through but still requires reading LICENSE", () => {
    const profile = profileForLicense("WeirdLicense-9000");
    expect(profile.family).toBe("proprietary-or-unknown");
    expect(profile.conditions.some((c) => /LICENSE file/i.test(c))).toBe(true);
  });
});

describe("buildAttributionSnippet", () => {
  test("includes repo, owner, url, and license label", () => {
    const repo = makeRepo({ license: "MIT" });
    const profile = profileForLicense("MIT");
    const snippet = buildAttributionSnippet(repo, profile);
    expect(snippet.markdownReadme).toContain("octocat/hello-world");
    expect(snippet.markdownReadme).toContain("https://github.com/octocat/hello-world");
    expect(snippet.markdownReadme).toContain("MIT");
    expect(snippet.codeHeaderComment).toContain("Adapted from octocat/hello-world");
    expect(snippet.packageJsonField).toContain("acknowledgements");
  });

  test("falls back gracefully when owner is missing", () => {
    const repo = makeRepo({ owner: "", fullName: "scoped/pkg" });
    const profile = profileForLicense("MIT");
    const snippet = buildAttributionSnippet(repo, profile);
    expect(snippet.markdownReadme).toContain("scoped/pkg");
  });
});

describe("renderLicenseAndAttributionBlock", () => {
  test("MIT block surfaces summary, must-dos, and a markdown attribution code block", () => {
    const lines = renderLicenseAndAttributionBlock(makeRepo({ license: "MIT" }));
    const text = lines.join("\n");
    expect(text).toMatch(/Detected license:/);
    expect(text).toMatch(/Plain-English summary:/);
    expect(text).toMatch(/Must do before you ship/);
    expect(text).toMatch(/```markdown/);
    expect(text).toMatch(/Attribution snippet/);
  });

  test("missing license block warns instead of cheerfully attributing", () => {
    const lines = renderLicenseAndAttributionBlock(makeRepo({ license: null }));
    const text = lines.join("\n");
    expect(text).toMatch(/no license detected/i);
    expect(text).toMatch(/Do not copy code/i);
  });
});

describe("renderRespectfulUseChecklist", () => {
  test("includes the build-on-not-as line and credit ask", () => {
    const lines = renderRespectfulUseChecklist(makeRepo({ license: "MIT" }));
    const text = lines.join("\n");
    expect(text).toMatch(/foundation.*not a finished product/i);
    expect(text).toMatch(/Credit octocat/);
    expect(text).toMatch(/Replace upstream branding/);
  });

  test("warns louder when license is copyleft", () => {
    const lines = renderRespectfulUseChecklist(makeRepo({ license: "AGPL-3.0" }));
    const text = lines.join("\n");
    expect(text).toMatch(/copyleft/i);
  });

  test("warns hardest when no license at all", () => {
    const lines = renderRespectfulUseChecklist(makeRepo({ license: null }));
    const text = lines.join("\n");
    expect(text).toMatch(/No clear license/i);
    expect(text).toMatch(/do not copy/i);
  });

  test("returns a safe stub when no repo selected", () => {
    const lines = renderRespectfulUseChecklist(undefined);
    expect(lines.join("\n")).toMatch(/Build ON, not AS/);
  });
});
