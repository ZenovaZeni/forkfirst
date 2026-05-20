import type { PromptRefinement } from "@/lib/search/planner";

export type RepoCategory = "already_exists" | "forkable" | "reference" | "gap" | "risk";

export type NormalizedRepo = {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  openIssues: number;
  license: string | null;
  pushedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  archived: boolean;
  homepage: string | null;
  githubScore?: number;
  readme?: ReadmeAnalysis;
};

export type ReadmeAnalysis = {
  excerpt: string;
  url: string | null;
  hasSetup: boolean;
  hasExamples: boolean;
  hasApiDetails: boolean;
  hasLocalDevelopment: boolean;
  hasLicenseText: boolean;
  qualityScore: number;
  reasons: string[];
  evidence?: ReadmeEvidence;
};

export type ReadmeEvidence = {
  fetchStatus: "ok" | "missing" | "rate_limited" | "error";
  fetchedAt: string | null;
  setupSnippets: string[];
  commandSnippets: string[];
  featureSnippets: string[];
  integrationSnippets: string[];
  licenseSnippets: string[];
};

export type GitHubSearchWarning = {
  type: "rate_limit" | "missing_token" | "github_error";
  message: string;
};

export type GitHubSearchResult = {
  repos: NormalizedRepo[];
  warnings: GitHubSearchWarning[];
  queries: string[];
  refinement: PromptRefinement;
};
