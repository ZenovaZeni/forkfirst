import type { AnalysisResult, ClassifiedRepo, IdeaVerdict } from "./types";

function labelFor(verdict: IdeaVerdict): string {
  return {
    already_exists: "Already Exists",
    use_existing: "Use Existing",
    fork_candidate_found: "Fork Candidate Found",
    build_differentiated: "Build Differentiated",
    open_gap: "Open Gap",
    needs_more_research: "Needs More Research"
  }[verdict];
}

export function analyzeWithDemo(prompt: string, repos: ClassifiedRepo[]): AnalysisResult {
  const alreadyExists = repos.filter((repo) => repo.category === "already_exists" && repo.score.fit >= 65);
  const forkable = repos.filter((repo) => repo.category === "forkable" && repo.score.fit >= 55);
  const references = repos.filter((repo) => repo.category === "reference");
  const top = repos[0];

  let verdict: IdeaVerdict = "needs_more_research";
  if (alreadyExists.length >= 2 && alreadyExists[0]?.score.total > 76) verdict = "already_exists";
  else if (alreadyExists.length > 0 && forkable.length > 0) verdict = "build_differentiated";
  else if (forkable.length > 0) verdict = "fork_candidate_found";
  else if (repos.length <= 2 && references.length === 0) verdict = "open_gap";
  else if (references.length > 0) verdict = "build_differentiated";

  const summary =
    repos.length === 0
      ? "GitHub did not return strong candidates. Try a broader description or add a GitHub token for more reliable search."
      : `${labelFor(verdict)}: ${top.fullName} is the strongest signal so far. The result is based on public GitHub metadata and deterministic demo analysis for "${prompt.slice(0, 90)}".`;

  return {
    verdict,
    verdictLabel: labelFor(verdict),
    summary,
    confidence: repos.length === 0 ? 25 : Math.min(92, Math.max(45, top.score.total)),
    mode: "demo",
    repos,
    gaps:
      verdict === "open_gap" || verdict === "build_differentiated"
        ? ["Differentiate with a narrower user promise, cleaner onboarding, and workflows the existing repos do not already cover."]
        : ["Differentiate with a focused audience, original branding, and a first workflow that is simpler than the existing repos."]
  };
}
