import type { AnalysisResult } from "@/lib/analysis/types";
import type { GitHubSearchWarning } from "@/lib/github/types";
import type { PromptRefinement } from "@/lib/search/planner";
import type { SearchRecovery } from "@/lib/analysis/search-recovery";

export type IdeaCheckResult = AnalysisResult & {
  id: string;
  prompt: string;
  createdAt: string;
  queries: string[];
  refinement?: PromptRefinement;
  warnings: GitHubSearchWarning[];
  recovery?: SearchRecovery;
};
