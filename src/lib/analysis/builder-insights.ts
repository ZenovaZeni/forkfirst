import type { ClassifiedRepo } from "./types";

export type IdeaGapInsight = {
  title: string;
  summary: string;
  points: string[];
};

export function buildPlainDecision(repo: ClassifiedRepo): string {
  if (repo.category === "already_exists") return "Use or study first";
  if (repo.category === "forkable") return "Copy and customize";
  if (repo.category === "reference") return "Study it";
  if (repo.category === "risk") return "Inspect carefully";
  return "Build the gap";
}

function extractGoal(prompt: string): string {
  const cleaned = prompt
    .replace(/\b(i want to|can i|does|anything|else|out there|have|the|name|build|make|create|is there|are there)\b/gi, " ")
    .replace(/[^a-z0-9+#.\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > 0 ? cleaned : "the idea";
}

export function buildIdeaGapInsight(prompt: string, repos: ClassifiedRepo[]): IdeaGapInsight {
  const top = repos.slice(0, 3);
  const strongest = top[0];
  const exactCount = top.filter((repo) => repo.category === "already_exists").length;
  const forkableCount = top.filter((repo) => repo.category === "forkable").length;
  const weakDocs = top.filter((repo) => !repo.readme || repo.score.docs < 55).length;
  const weakFit = top.filter((repo) => repo.score.fit < 55).length;
  const missingLicense = top.filter((repo) => !repo.license).length;
  const goal = extractGoal(prompt);

  const points = [
    exactCount > 0
      ? "Do not start from scratch until you compare the closest existing project against your feature list."
      : "No obvious clone owns the whole idea from the first pass.",
    forkableCount > 0
      ? "At least one repo looks usable as a starting point, so the next move is install friction and code quality."
      : "The best matches are more useful as references than as a clean copy target.",
    weakDocs > 0
      ? "Documentation is uneven, which is an opening for a simpler builder-friendly version."
      : "The top docs look inspectable, so differentiation needs to come from workflow and UX.",
    weakFit > 0 || missingLicense > 0
      ? "Package the missing pieces as a focused builder workflow, not another search results page."
      : `Differentiate around ${goal}: saved decisions, plain-English tradeoffs, and a faster path from idea to repo.`,
    `For this idea, make ${goal} feel practical with saved research boards, comparison, and next-step guidance.`
  ];

  return {
    title: strongest?.score.fit && strongest.score.fit >= 80 ? "Validate before you build" : "Still room to differentiate",
    summary: strongest
      ? `${strongest.fullName} is the strongest lead, but the opportunity is the decision layer around the repos: what to use, what to copy, and what gap remains.`
      : "No strong repo lead came back yet, so the gap is still unproven. Try a more specific prompt or add provider keys.",
    points
  };
}
