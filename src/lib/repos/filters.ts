import type { ClassifiedRepo } from "@/lib/analysis/types";
import type { RepoCategory } from "@/lib/github/types";

export type RepoFilterState = {
  category: "all" | RepoCategory;
  minScore: 0 | 60 | 75;
  sort: "relevance" | "stars" | "updated";
};

export const defaultRepoFilters: RepoFilterState = {
  category: "all",
  minScore: 0,
  sort: "relevance"
};

export function filterRepos(repos: ClassifiedRepo[], filters: RepoFilterState): ClassifiedRepo[] {
  return repos.filter((repo) => {
    if (filters.category !== "all" && repo.category !== filters.category) return false;
    return repo.score.total >= filters.minScore;
  });
}

export function sortRepos(repos: ClassifiedRepo[], sort: RepoFilterState["sort"]): ClassifiedRepo[] {
  const nextRepos = [...repos];
  if (sort === "stars") return nextRepos.sort((a, b) => b.stars - a.stars);
  if (sort === "updated") {
    return nextRepos.sort((a, b) => new Date(b.pushedAt ?? b.updatedAt ?? 0).getTime() - new Date(a.pushedAt ?? a.updatedAt ?? 0).getTime());
  }
  return nextRepos;
}

export function applyRepoFilters(repos: ClassifiedRepo[], filters: RepoFilterState): ClassifiedRepo[] {
  return sortRepos(filterRepos(repos, filters), filters.sort);
}
