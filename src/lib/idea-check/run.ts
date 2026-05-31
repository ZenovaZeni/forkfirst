import { analyzeIdea } from "@/lib/analysis/analyst";
import { rerankWithUserAi } from "../analysis/rerank";
import { buildSearchRecovery } from "@/lib/analysis/search-recovery";
import { searchGithubRepositories } from "@/lib/github/provider";
import { searchCuratedRepos } from "@/lib/github/demo-search";
import { enrichRepositoriesWithStructure } from "../github/structure";
import { classifyRepositories } from "@/lib/scoring/scoring";
import { saveIdeaCheck } from "@/lib/db/research-cases";
import type { IdeaCheckResult } from "@/types/idea-check";
import { enrichTopCandidateReadmes } from "./enrich-candidates";
import { buildMergePlan, buildRepoInspections, deriveProductIntent } from "./workflow";
import { optionalServerKey } from "@/lib/security/server-keys";

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
  const hasToken = Boolean(input.githubToken || optionalServerKey("GITHUB_TOKEN"));

  // ── Demo path: no GitHub token → use curated repo set, skip live API calls ──
  if (!hasToken) {
    const { repos: curatedRepos, matched } = searchCuratedRepos(input.prompt);
    const classified = classifyRepositories(curatedRepos, input.prompt);
    const productIntent = deriveProductIntent({
      prompt: input.prompt,
      refinement: { queries: [], probableMeaning: input.prompt, bestQuery: input.prompt, alternateAngles: [] },
      repos: classified,
      selectedRepo: classified[0]
    });
    const wrappedRepos = classified.map((repo) => ({
      ...repo,
      description: `<UNTRUSTED_REPO_CONTENT>${repo.description}</UNTRUSTED_REPO_CONTENT>`,
      readme: repo.readme
        ? { ...repo.readme, excerpt: `<UNTRUSTED_REPO_CONTENT>${repo.readme.excerpt}</UNTRUSTED_REPO_CONTENT>` }
        : undefined
    }));
    const analysis = await analyzeIdea(input.prompt, wrappedRepos, {
      provider: input.aiProvider,
      apiKey: input.aiApiKey,
      model: input.aiModel,
      baseUrl: input.aiBaseUrl
    });
    const cleanRepoByName = new Map(classified.map((repo) => [repo.fullName.toLowerCase(), repo]));
    const analysisOrderedRepos = analysis.repos
      .map((repo) => cleanRepoByName.get(repo.fullName.toLowerCase()))
      .filter((repo): repo is (typeof classified)[number] => Boolean(repo));
    const inspectionRepos = analysisOrderedRepos.length ? analysisOrderedRepos : classified;
    const repoInspections = buildRepoInspections(inspectionRepos);
    const mergePlan = buildMergePlan(productIntent, repoInspections[0] ?? null);
    const demoWarning = matched
      ? { type: "missing_token" as const, message: "Showing curated starter repos. Add a GitHub token to search live GitHub for your exact idea." }
      : { type: "missing_token" as const, message: "No close match in the curated set. Add a GitHub token to search all of GitHub." };
    const result: IdeaCheckResult = {
      ...analysis,
      id: crypto.randomUUID(),
      prompt: input.prompt,
      createdAt: new Date().toISOString(),
      queries: [],
      warnings: [demoWarning],
      recovery: buildSearchRecovery({ prompt: input.prompt, repos: analysis.repos, warnings: [demoWarning] }),
      productIntent,
      repoInspections,
      mergePlan
    };
    if (input.save) saveIdeaCheck(result, input.caseId);
    return result;
  }

  // ── Live path: GitHub token present → full search + enrichment pipeline ─────
  const search = await searchGithubRepositories(input.prompt, input.githubToken);
  const enrichedRepos = await enrichTopCandidateReadmes(search.repos, input.prompt, input.githubToken);
  const initiallyClassified = classifyRepositories(enrichedRepos, input.prompt);
  const structuredRepos = await enrichRepositoriesWithStructure(initiallyClassified, input.githubToken);
  const classified = await rerankWithUserAi({
    prompt: input.prompt,
    repos: classifyRepositories(structuredRepos, input.prompt),
    provider: input.aiProvider,
    apiKey: input.aiApiKey,
    model: input.aiModel,
    baseUrl: input.aiBaseUrl
  });
  const productIntent = deriveProductIntent({
    prompt: input.prompt,
    refinement: search.refinement,
    repos: classified,
    selectedRepo: classified[0]
  });

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
  const cleanRepoByName = new Map(classified.map((repo) => [repo.fullName.toLowerCase(), repo]));
  const analysisOrderedRepos = analysis.repos
    .map((repo) => cleanRepoByName.get(repo.fullName.toLowerCase()))
    .filter((repo): repo is (typeof classified)[number] => Boolean(repo));
  const inspectionRepos = analysisOrderedRepos.length ? analysisOrderedRepos : classified;
  const repoInspections = buildRepoInspections(inspectionRepos);
  const mergePlan = buildMergePlan(productIntent, repoInspections[0] ?? null);

  const result: IdeaCheckResult = {
    ...analysis,
    id: crypto.randomUUID(),
    prompt: input.prompt,
    createdAt: new Date().toISOString(),
    queries: search.queries,
    refinement: search.refinement,
    warnings: search.warnings,
    recovery: buildSearchRecovery({ prompt: input.prompt, repos: analysis.repos, warnings: search.warnings }),
    productIntent,
    repoInspections,
    mergePlan
  };

  if (input.save) {
    saveIdeaCheck(result, input.caseId);
  }

  return result;
}
