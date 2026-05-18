import type { ClassifiedRepo } from "./types";
import type { GitHubSearchWarning } from "@/lib/github/types";

export type SearchRecoveryActionKind = "tighten_idea" | "known_repo" | "adjacent" | "trending" | "demo";

export type SearchRecoveryAction = {
  kind: SearchRecoveryActionKind;
  label: string;
  prompt: string;
};

export type SearchRecoveryState = "ok" | "weak_results" | "no_results";

export type SearchRecovery = {
  state: SearchRecoveryState;
  headline: string;
  explanation: string;
  reassurance: string;
  closeMatchCount: number;
  actions: SearchRecoveryAction[];
};

type SearchRecoveryInput = {
  prompt: string;
  repos: ClassifiedRepo[];
  warnings: GitHubSearchWarning[];
};

function hasLimitedCoverageWarning(warnings: GitHubSearchWarning[]): boolean {
  return warnings.some((warning) => warning.type === "missing_token" || warning.type === "rate_limit" || warning.type === "github_error");
}

function isCloseMatch(repo: ClassifiedRepo): boolean {
  return (
    repo.score.fit >= 60 &&
    repo.score.total >= 64 &&
    (repo.category === "already_exists" || repo.category === "forkable" || repo.category === "reference")
  );
}

function recoveryActions(prompt: string): SearchRecoveryAction[] {
  return [
    {
      kind: "tighten_idea",
      label: "Tighten the idea",
      prompt: `Search again with a narrower version of this idea: ${prompt}. Focus on the target user, must-have workflow, and platform.`
    },
    {
      kind: "known_repo",
      label: "Search a known repo",
      prompt: "I already know the GitHub repo I want to use as a foundation: owner/repo. Inspect it around my product idea and compare nearby alternatives only if useful."
    },
    {
      kind: "adjacent",
      label: "Try adjacent angles",
      prompt: `Try adjacent GitHub searches for ${prompt}: starter templates, workflow tools, open-source alternatives, and maintained libraries.`
    },
    {
      kind: "trending",
      label: "Browse trending repos",
      prompt: "Open trending repos so I can pick a strong starter from what is active right now."
    },
    {
      kind: "demo",
      label: "Use demo mode",
      prompt: `Run a demo-mode idea check for ${prompt} and show the deterministic fallback guidance without requiring paid keys.`
    }
  ];
}

export function buildSearchRecovery({ prompt, repos, warnings }: SearchRecoveryInput): SearchRecovery {
  const closeMatchCount = repos.slice(0, 3).filter(isCloseMatch).length;
  const limitedCoverage = hasLimitedCoverageWarning(warnings);
  const coverageNote = limitedCoverage ? " GitHub coverage may be limited, so this is not a final answer." : "";

  if (repos.length === 0) {
    return {
      state: "no_results",
      headline: "No strong GitHub match yet",
      explanation: `GitHub did not return usable repo candidates for this wording.${coverageNote}`,
      reassurance: "That usually means the idea needs sharper keywords, a known repo to inspect, or a nearby category search.",
      closeMatchCount: 0,
      actions: recoveryActions(prompt)
    };
  }

  if (closeMatchCount === 0) {
    return {
      state: "weak_results",
      headline: "Results look weak or adjacent",
      explanation: `The repos found are loose or adjacent matches, not strong fork targets.${coverageNote}`,
      reassurance: "Please treat these as leads for research, not proof that a solid starter exists.",
      closeMatchCount: 0,
      actions: recoveryActions(prompt)
    };
  }

  return {
    state: "ok",
    headline: "GitHub matches found",
    explanation: limitedCoverage
      ? "Some useful matches came back, but GitHub coverage may be limited."
      : "The top results include at least one plausible repo lead.",
    reassurance: "Still inspect setup, license, issues, and recent commits before building on anything.",
    closeMatchCount,
    actions: []
  };
}
