import type { ClassifiedRepo } from "@/lib/analysis/types";
import { getRepoKindInsight } from "../analysis/repo-kind";

export type CompareRow = {
  name: string;
  type: string;
  category: string;
  match: string;
  docs: string;
  setup: string;
  activity: string;
  license: string;
  bestFor: string;
  watchOut: string;
  url: string;
};

function categoryLabel(category: ClassifiedRepo["category"]): string {
  return category.replace("_", " ");
}

function setupLabel(repo: ClassifiedRepo): string {
  if (repo.readme?.hasSetup && repo.readme.hasExamples) return "Setup + examples";
  if (repo.readme?.hasSetup) return "Setup found";
  if (repo.readme?.hasExamples) return "Examples found";
  if (!repo.readme) return "README unknown";
  return "Needs inspection";
}

function bestFor(repo: ClassifiedRepo): string {
  const kind = getRepoKindInsight(repo);
  if (kind.kind === "directory" || kind.kind === "plugin_pack" || kind.kind === "framework_sdk" || kind.kind === "research_resource") {
    return kind.goodFor;
  }
  if (repo.category === "forkable") return "Best as a starting point to inspect and copy.";
  if (repo.category === "already_exists") return "Best to compare before deciding to build.";
  if (repo.category === "reference") return "Best for studying architecture or UX patterns.";
  if (repo.category === "risk") return "Best only as background research.";
  return "Best as evidence of an open gap.";
}

function watchOut(repo: ClassifiedRepo): string {
  const kind = getRepoKindInsight(repo);
  if (kind.kind === "directory" || kind.kind === "plugin_pack" || kind.kind === "research_resource") return kind.notFor;
  if (repo.archived) return "Archived repository.";
  if (!repo.license) return "No license detected.";
  if (!repo.readme) return "README was not fetched.";
  if (!repo.readme.hasSetup) return "README setup path is unclear.";
  if (repo.score.fit < 40) return "Idea fit is loose.";
  return "Inspect README, issues, and examples before choosing it.";
}

export function buildCompareRow(repo: ClassifiedRepo): CompareRow {
  return {
    name: repo.fullName,
    type: getRepoKindInsight(repo).label,
    category: categoryLabel(repo.category),
    match: `${repo.score.total}%`,
    docs: repo.readme ? `${repo.readme.qualityScore}%` : "Unknown",
    setup: setupLabel(repo),
    activity: `${repo.score.activity}%`,
    license: repo.license ?? "No license",
    bestFor: bestFor(repo),
    watchOut: watchOut(repo),
    url: repo.url
  };
}
