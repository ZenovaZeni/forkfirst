import { analyzeIdea } from "@/lib/analysis/analyst";
import { buildSearchRecovery } from "@/lib/analysis/search-recovery";
import { searchGithubRepositories } from "@/lib/github/provider";
import { classifyRepositories } from "@/lib/scoring/scoring";
import { saveIdeaCheck } from "@/lib/db/research-cases";
import type { IdeaCheckResult } from "@/types/idea-check";

export type RunIdeaCheckInput = {
  prompt: string;
  caseId?: string;
  githubToken?: string;
  aiProvider?: "openai" | "groq" | "deepseek" | "custom";
  aiApiKey?: string;
  aiModel?: string;
  aiBaseUrl?: string;
  aiBaseUrlAcknowledged?: boolean;
  save?: boolean;
};

export async function runIdeaCheck(input: RunIdeaCheckInput): Promise<IdeaCheckResult> {
  const search = await searchGithubRepositories(input.prompt, input.githubToken);
  const classified = classifyRepositories(search.repos, input.prompt);

  // Wrap untrusted repo content to mitigate prompt injection
  const wrappedRepos = classified.map((repo) => ({
    ...repo,
    description: `<UNTRUSTED_REPO_CONTENT>${repo.description}</UNTRUSTED_REPO_CONTENT>`,
    readme: repo.readme
      ? {
          ...repo.readme,
          excerpt: `<UNTRUSTED_REPO_CONTENT>${repo.readme.excerpt}</UNTRUSTED_REPO_CONTENT>`
        }
      : undefined
  }));

  const analysis = await analyzeIdea(input.prompt, wrappedRepos, {
    provider: input.aiProvider,
    apiKey: input.aiApiKey,
    model: input.aiModel,
    baseUrl: input.aiBaseUrl
  });

  const result: IdeaCheckResult = {
    id: crypto.randomUUID(),
    prompt: input.prompt,
    createdAt: new Date().toISOString(),
    queries: search.queries,
    refinement: search.refinement,
    warnings: search.warnings,
    recovery: buildSearchRecovery({ prompt: input.prompt, repos: analysis.repos, warnings: search.warnings }),
    ...analysis
  };

  if (input.save) {
    saveIdeaCheck(result, input.caseId);
  }

  return result;
}
