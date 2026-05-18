import { describe, expect, test } from "vitest";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { defaultBoard, groupReposByBoard } from "./boards";

function repo(name: string, category: ClassifiedRepo["category"]): ClassifiedRepo {
  return {
    id: name.length,
    owner: "owner",
    name,
    fullName: `owner/${name}`,
    url: `https://github.com/owner/${name}`,
    description: "",
    language: null,
    topics: [],
    stars: 0,
    forks: 0,
    openIssues: 0,
    license: null,
    pushedAt: null,
    createdAt: null,
    updatedAt: null,
    archived: false,
    homepage: null,
    category,
    score: { total: 70, fit: 70, activity: 70, popularity: 70, license: 70, docs: 70, reasons: [] },
    summary: ""
  };
}

describe("repo boards", () => {
  test("assigns useful default boards by category", () => {
    expect(defaultBoard(repo("app", "forkable"))).toBe("Fork candidates");
    expect(defaultBoard(repo("clone", "already_exists"))).toBe("Fork candidates");
    expect(defaultBoard(repo("reference", "reference"))).toBe("Inspiration");
    expect(defaultBoard(repo("risk", "risk"))).toBe("Competitors");
    expect(defaultBoard(repo("gap", "gap"))).toBe("Later");
  });

  test("groups saved repos with explicit board overrides", () => {
    const savedRepos = [repo("one", "forkable"), repo("two", "reference"), repo("three", "risk")];
    const groups = groupReposByBoard(savedRepos, { "owner/two": "Ideas" });

    expect(groups.find((group) => group.board === "Ideas")?.repos.map((item) => item.name)).toEqual(["two"]);
    expect(groups.find((group) => group.board === "Fork candidates")?.repos.map((item) => item.name)).toEqual(["one"]);
    expect(groups.find((group) => group.board === "Competitors")?.repos.map((item) => item.name)).toEqual(["three"]);
  });
});
