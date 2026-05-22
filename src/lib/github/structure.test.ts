import { describe, expect, test, vi } from "vitest";
import { analyzeRepoStructure, enrichRepositoriesWithStructure } from "./structure";
import type { NormalizedRepo } from "./types";

function repo(overrides: Partial<NormalizedRepo> = {}): NormalizedRepo {
  return {
    id: 1,
    owner: "owner",
    name: "starter",
    fullName: "owner/starter",
    url: "https://github.com/owner/starter",
    description: "Starter app",
    language: "TypeScript",
    topics: ["starter"],
    stars: 10,
    forks: 1,
    openIssues: 0,
    license: "MIT",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    defaultBranch: "main",
    ...overrides
  };
}

describe("repo structure analysis", () => {
  test("turns a GitHub tree into concrete setup and app evidence", () => {
    const analysis = analyzeRepoStructure([
      "package.json",
      "pnpm-lock.yaml",
      "src/app/page.tsx",
      "src/app/api/receipts/route.ts",
      "src/components/receipt-card.tsx",
      "prisma/schema.prisma",
      "docker-compose.yml",
      ".env.example",
      "README.md",
      "LICENSE"
    ]);

    expect(analysis.fetchStatus).toBe("ok");
    expect(analysis.packageManagers).toEqual(expect.arrayContaining(["pnpm", "Docker"]));
    expect(analysis.frameworks).toEqual(expect.arrayContaining(["Next.js / React", "Prisma"]));
    expect(analysis.appDirectories).toEqual(expect.arrayContaining(["src/app", "src/components", "src/app/api"]));
    expect(analysis.dataLayers).toEqual(expect.arrayContaining(["Prisma schema", "environment config"]));
    expect(analysis.inspectionTargets).toEqual(expect.arrayContaining(["package.json", "prisma/schema.prisma", "src/app/api/receipts/route.ts"]));
  });

  test("fetches structure only for the bounded top repos", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        tree: [
          { path: "package.json", type: "blob" },
          { path: "src/app/page.tsx", type: "blob" }
        ],
        truncated: false
      }), { status: 200 })
    );

    const enriched = await enrichRepositoriesWithStructure([repo(), repo({ id: 2, fullName: "owner/other" })], undefined, {
      limit: 1,
      fetchImpl: fetchMock,
      now: () => "2026-05-21T00:00:00Z"
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(enriched[0].structure?.frameworks).toContain("Next.js / React");
    expect(enriched[1].structure).toBeUndefined();
  });
});
