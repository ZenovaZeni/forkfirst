import { buildRepoNarrative } from "../analysis/human-answer";
import type { ClassifiedRepo } from "../analysis/types";
import { groupReposByBoard } from "../repos/boards";
import { planPromptRefinement } from "../search/planner";
import type { IdeaCheckResult } from "../../types/idea-check";

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "forkfirst"
  );
}

function formatCategory(category: ClassifiedRepo["category"]): string {
  return category.replace(/_/g, " ");
}

function formatRepoLine(repo: ClassifiedRepo): string {
  const license = repo.license ?? "No license detected";
  const language = repo.language ?? "Unknown language";
  return `${formatCategory(repo.category)} - ${repo.score.total}% score - ${repo.stars.toLocaleString()} stars - ${language} - ${license}`;
}

function formatWarning(type: string): string {
  return type.replace(/_/g, " ");
}

function buildRecommendedActions(result: IdeaCheckResult, topRepos: ClassifiedRepo[]): string[] {
  if (topRepos.length === 0) {
    return [
      "Run a narrower follow-up search with a product name, framework, or core technical phrase.",
      "Search GitHub directly for exact repo names you expected to see.",
      "Treat the current result as inconclusive until at least one credible repo lead appears."
    ];
  }

  const actions = [
    `Inspect ${topRepos[0].fullName} first and verify setup, license, activity, and issue health.`,
    "Compare the top repo against the next two leads before choosing to copy, reference, or build-from-scratch.",
    "Save the strongest leads into boards, then generate a Build Pack for your coding tool."
  ];

  if (result.gaps.length > 0) {
    actions.push("Use the opportunity gaps below as differentiation criteria for the first milestone.");
  }

  if (result.warnings.length > 0) {
    actions.push("Re-run with a GitHub token if rate limits or incomplete search warnings affected coverage.");
  }

  return actions;
}

export function buildExportMarkdown(result: IdeaCheckResult, savedRepos: ClassifiedRepo[], savedRepoBoards: Record<string, string>): string {
  const topRepos = result.repos.slice(0, 3);
  const bestRepo = topRepos[0];
  const refinement = result.refinement ?? planPromptRefinement(result.prompt);
  const savedGroups = groupReposByBoard(savedRepos, savedRepoBoards).filter((group) => group.repos.length > 0);
  const queries = result.queries.length ? result.queries : refinement.queries;
  const generatedAt = new Date().toISOString();
  const recommendedActions = buildRecommendedActions(result, topRepos);
  const lines = [
    `# ForkFirst Idea Report`,
    ``,
    `Generated: ${generatedAt}`,
    `Research run: ${result.createdAt}`,
    `Mode: ${result.mode}`,
    ``,
    `## Executive Summary`,
    `- Idea: ${result.prompt}`,
    `- Verdict: ${result.verdictLabel} (${result.confidence}% confidence)`,
    `- Summary: ${result.summary}`,
    `- Repo coverage: ${result.repos.length} leads reviewed; ${topRepos.length} highlighted below`,
    `- Best lead: ${bestRepo ? `${bestRepo.fullName} (${formatRepoLine(bestRepo)})` : "No strong repository lead found"}`,
    ``,
    `## Recommended Next Moves`,
    ...recommendedActions.map((action) => `- ${action}`),
    ``,
    `## Prompt Refinement`,
    `- What the user probably means: ${refinement.probableMeaning}`,
    `- Best GitHub search: ${refinement.bestQuery}`,
    ...(refinement.alternateAngles.length
      ? [`- Alternate angles:`, ...refinement.alternateAngles.map((angle) => `  - ${angle}`)]
      : [`- Alternate angles: None recorded.`]),
    ``,
    `## GitHub Queries`,
    ...queries.map((query) => `- ${query}`),
    ``,
    `## Top Repos`,
    ...(topRepos.length
      ? topRepos.flatMap((repo, index) => {
          const narrative = buildRepoNarrative(repo);
          return [
            `### ${index + 1}. ${repo.fullName}`,
            `- URL: ${repo.url}`,
            `- Snapshot: ${formatRepoLine(repo)}`,
            `- Score breakdown: fit ${repo.score.fit}, activity ${repo.score.activity}, popularity ${repo.score.popularity}, license ${repo.score.license}, docs ${repo.score.docs}`,
            `- Forks/issues: ${repo.forks.toLocaleString()} forks, ${repo.openIssues.toLocaleString()} open issues`,
            `- Last pushed: ${repo.pushedAt}`,
            `- Homepage: ${repo.homepage ?? "None listed"}`,
            `- What it does: ${narrative.overview}`,
            `- Good for: ${narrative.goodFor}`,
            `- Not good for: ${narrative.notFor}`,
            `- Next step: ${narrative.next}`,
            repo.score.reasons.length ? `- Signals: ${repo.score.reasons.join("; ")}` : `- Signals: No score reasons were recorded.`,
            ``
          ];
        })
      : [`No strong repositories were found.`, ``]),
    `## Risks And Warnings`,
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${formatWarning(warning.type)}: ${warning.message}`) : [`- No GitHub warnings were reported.`]),
    ...(result.gaps.length ? [``, `## Opportunity Gaps`, ...result.gaps.map((gap) => `- ${gap}`)] : []),
    ``,
    `## Saved Repos`,
    ...(savedGroups.length
      ? savedGroups.flatMap((group) => [
          `### ${group.board}`,
          ...group.repos.map((repo) => `- [${repo.fullName}](${repo.url}) - ${formatRepoLine(repo)}`),
          ``
        ])
      : [`No saved repos yet. Save repos in the app to include a board-by-board shortlist in future exports.`]),
    ``,
    `## Reproduce This Search`,
    `1. Open ForkFirst.`,
    `2. Paste the idea above into the prompt box.`,
    `3. Add a GitHub token for higher rate limits if the warning section mentions incomplete coverage.`,
    `4. Re-run the listed GitHub queries when you want to verify the result manually.`,
    ``,
    `## License Disclaimer`,
    `This report is research, not legal clearance. License fields are read from GitHub metadata and are advisory only.`,
    `Before copying or customizing any repo, inspect the LICENSE file, attribution notices, dependency licenses, and any asset, model, or data licenses.`
  ];

  return lines.join("\n");
}
