import type { AnalysisResult } from "@/lib/analysis/types";
import type { GitHubSearchWarning } from "@/lib/github/types";
import type { PromptRefinement } from "@/lib/search/planner";
import type { SearchRecovery } from "@/lib/analysis/search-recovery";
import type { MergePlan, ProductIntent, RepoInspection } from "@/lib/idea-check/workflow";

export type IdeaCheckResult = AnalysisResult & {
  id: string;
  prompt: string;
  createdAt: string;
  queries: string[];
  refinement?: PromptRefinement;
  warnings: GitHubSearchWarning[];
  recovery?: SearchRecovery;
  productIntent?: ProductIntent;
  repoInspections?: RepoInspection[];
  mergePlan?: MergePlan;
};
