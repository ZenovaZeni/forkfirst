import type { ClassifiedRepo } from "@/lib/analysis/types";

export const repoBoards = ["Ideas", "Fork candidates", "Inspiration", "Competitors", "Later"] as const;

export type RepoBoard = (typeof repoBoards)[number];

export function defaultBoard(repo: ClassifiedRepo): RepoBoard {
  if (repo.category === "forkable" || repo.category === "already_exists") return "Fork candidates";
  if (repo.category === "reference") return "Inspiration";
  if (repo.category === "risk") return "Competitors";
  return "Later";
}

export function groupReposByBoard(savedRepos: ClassifiedRepo[], savedRepoBoards: Record<string, string>) {
  return repoBoards.map((board) => ({
    board,
    repos: savedRepos.filter((repo) => (savedRepoBoards[repo.fullName] ?? defaultBoard(repo)) === board)
  }));
}
