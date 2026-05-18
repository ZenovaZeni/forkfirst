import type { NormalizedRepo, RepoCategory } from "@/lib/github/types";

export type IdeaVerdict =
  | "already_exists"
  | "use_existing"
  | "fork_candidate_found"
  | "build_differentiated"
  | "open_gap"
  | "needs_more_research";

export type RepoScore = {
  total: number;
  fit: number;
  activity: number;
  popularity: number;
  license: number;
  docs: number;
  reasons: string[];
};

export type ClassifiedRepo = NormalizedRepo & {
  category: RepoCategory;
  score: RepoScore;
  summary: string;
};

export type AnalysisResult = {
  verdict: IdeaVerdict;
  verdictLabel: string;
  summary: string;
  confidence: number;
  mode: "openai" | "demo";
  repos: ClassifiedRepo[];
  gaps: string[];
};

