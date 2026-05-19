import { planPromptRefinement } from "@/lib/search/planner";
import { optionalServerKey } from "@/lib/security/server-keys";
import { enrichRepositoriesWithReadmes } from "./readme";
import type { GitHubSearchResult, GitHubSearchWarning, NormalizedRepo } from "./types";

type GitHubRepoItem = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: { spdx_id?: string | null; name?: string | null } | null;
  pushed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  archived: boolean;
  homepage: string | null;
  score?: number;
  owner: { login: string };
};

type GitHubSearchResponse = {
  items?: GitHubRepoItem[];
  message?: string;
};

function extractKnownRepoSlug(prompt: string): string | null {
  const urlMatch = prompt.match(/(?:https?:\/\/)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i);
  const slugMatch = prompt.match(/\b([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\b/);
  const match = urlMatch ?? slugMatch;
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

function normalizeRepo(item: GitHubRepoItem): NormalizedRepo {
  return {
    id: item.id,
    owner: item.owner.login,
    name: item.name,
    fullName: item.full_name,
    url: item.html_url,
    description: item.description ?? "",
    language: item.language,
    topics: item.topics ?? [],
    stars: item.stargazers_count,
    forks: item.forks_count,
    openIssues: item.open_issues_count,
    license: item.license?.spdx_id || item.license?.name || null,
    pushedAt: item.pushed_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    archived: item.archived,
    homepage: item.homepage,
    githubScore: item.score
  };
}

export async function searchGithubRepositories(prompt: string, userToken?: string): Promise<GitHubSearchResult> {
  const token = userToken || optionalServerKey("GITHUB_TOKEN");
  const tokenBackedFetch = Boolean(token);
  const refinement = planPromptRefinement(prompt);
  const knownRepoSlug = extractKnownRepoSlug(prompt);
  const queries = knownRepoSlug ? [`repo:${knownRepoSlug}`, ...refinement.queries] : refinement.queries;
  const warnings: GitHubSearchWarning[] = [];
  const warningKeys = new Set<string>();
  const repos = new Map<string, NormalizedRepo>();

  function addWarning(warning: GitHubSearchWarning) {
    const key = `${warning.type}:${warning.message}`;
    if (warningKeys.has(key)) return;
    warningKeys.add(key);
    warnings.push(warning);
  }

  if (!token) {
    addWarning({
      type: "missing_token",
      message: "No GitHub token is configured, so public GitHub search is using lower unauthenticated limits."
    });
  }

  if (knownRepoSlug) {
    try {
      const response = await fetch(`https://api.github.com/repos/${knownRepoSlug}`, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(tokenBackedFetch ? { cache: "no-store" as const } : { next: { revalidate: 300 } })
      });
      const data = (await response.json()) as GitHubRepoItem & { message?: string };
      if (response.ok) {
        const repo = normalizeRepo(data);
        repos.set(repo.fullName.toLowerCase(), repo);
      } else {
        addWarning({
          type: response.status === 403 ? "rate_limit" : "github_error",
          message: data.message ?? `Could not fetch ${knownRepoSlug} directly.`
        });
      }
    } catch {
      addWarning({
        type: "github_error",
        message: `Could not reach api.github.com to fetch ${knownRepoSlug}.`
      });
    }
  }

  for (const query of queries) {
    if (query.startsWith("repo:")) continue;
    const url = new URL("https://api.github.com/search/repositories");
    url.searchParams.set("q", query);
    url.searchParams.set("per_page", "10");

    let response: Response;
    let data: GitHubSearchResponse;

    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(tokenBackedFetch ? { cache: "no-store" as const } : { next: { revalidate: 300 } })
      });

      data = (await response.json()) as GitHubSearchResponse;
    } catch {
      addWarning({
        type: "github_error",
        message: "Could not reach api.github.com. Check your internet/DNS connection and try again."
      });
      continue;
    }

    if (!response.ok) {
      addWarning({
        type: response.status === 403 ? "rate_limit" : "github_error",
        message: data.message ?? `GitHub search failed with status ${response.status}.`
      });
      continue;
    }

    for (const item of data.items ?? []) {
      const repo = normalizeRepo(item);
      repos.set(repo.fullName.toLowerCase(), repo);
    }
  }

  const enrichedRepos = await enrichRepositoriesWithReadmes(Array.from(repos.values()).slice(0, 24), token);

  return {
    repos: enrichedRepos,
    warnings,
    queries,
    refinement
  };
}
