import type { ClassifiedRepo } from "@/lib/analysis/types";
import { getRepoKindInsight } from "./repo-kind";

function repoRole(repo: ClassifiedRepo): string {
  const kind = getRepoKindInsight(repo);
  if (kind.kind === "directory") return "research map";
  if (kind.kind === "plugin_pack") return "developer workflow pack";
  if (kind.kind === "framework_sdk") return "technical building block";
  if (kind.kind === "starter_template") return "starter template";
  if (repo.category === "already_exists") return "closest existing project";
  if (repo.category === "forkable") return "best copy-and-customize option";
  if (repo.category === "reference") return "best to learn from";
  if (repo.category === "risk") return "useful but risky lead";
  return "gap signal";
}

function shortWhy(repo: ClassifiedRepo): string {
  const pieces = [];
  if (repo.score.fit >= 65) pieces.push("matches the idea closely");
  else if (repo.score.fit >= 35) pieces.push("partially matches the idea");
  else pieces.push("is adjacent to the idea");

  if (repo.readme?.hasSetup) pieces.push("has setup docs");
  if (repo.readme?.hasExamples) pieces.push("includes examples");
  if (repo.score.activity >= 70) pieces.push("looks active");
  if (repo.license) pieces.push(`uses ${repo.license}`);

  return pieces.slice(0, 4).join(", ");
}

function isNameQuestion(prompt: string): boolean {
  return /\b(name|called|named|brand)\b/i.test(prompt);
}

function isExistenceQuestion(prompt: string): boolean {
  return /\b(any|anything|already|exists?|out there|version|alternative)\b/i.test(prompt);
}

function isAiDiscoveryQuestion(prompt: string): boolean {
  return (
    !isLeadGenQuestion(prompt) &&
    !isRealEstateQuestion(prompt) &&
    /\b(ai|artificial intelligence|machine learning|llm|agents?)\b/i.test(prompt) &&
    /\b(cool|interesting|best|good|repos?|projects?|tools?)\b/i.test(prompt)
  );
}

function isBusinessDiscoveryQuestion(prompt: string): boolean {
  return /\b(business owners?|small business|entrepreneurs?|founders?)\b/i.test(prompt);
}

function isLeadGenQuestion(prompt: string): boolean {
  return /\b(lead gen|lead generation|leads?|prospecting|sales outreach|enrichment|cold outreach)\b/i.test(prompt);
}

function isRealEstateQuestion(prompt: string): boolean {
  return /\b(realtors?|real estate(?:\s+agents?)?|realty|broker|mls|property|properties)\b/i.test(prompt);
}

function trimSentence(text: string, maxLength = 230): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
}

function cleanSummaryText(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\S+\.(svg|png|jpe?g|gif)\b/gi, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#*_`|<>{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPlainHelpfulExcerpt(text: string): boolean {
  if (!text) return false;
  if (/[<>]|!\s|badge|shields|img src|href=|align=/i.test(text)) return false;
  return text.split(/\s+/).length >= 8;
}

function plainCategory(repo: ClassifiedRepo): string {
  if (repo.category === "already_exists") return "an existing product or close clone";
  if (repo.category === "forkable") return "a good starting point to copy and customize";
  if (repo.category === "reference") return "a good reference to learn from";
  if (repo.category === "risk") return "a lead to inspect carefully";
  return "evidence of a possible market gap";
}

export type RepoNarrative = {
  kindLabel: string;
  overview: string;
  why: string;
  goodFor: string;
  notFor: string;
  caution: string;
  next: string;
};

export type AnswerPick = {
  rank: number;
  repoName: string;
  role: string;
  overview: string;
  why: string;
  signal: string;
};

export type AnswerSections = {
  intro: string;
  picks: AnswerPick[];
};

export function buildRepoNarrative(repo: ClassifiedRepo): RepoNarrative {
  const kind = getRepoKindInsight(repo);
  const description = cleanSummaryText(repo.description || repo.summary || "No repository description was available.");
  const readmeExcerpt = cleanSummaryText(repo.readme?.excerpt ?? "");
  const readmeDetail = isPlainHelpfulExcerpt(readmeExcerpt) ? ` README highlights: ${trimSentence(readmeExcerpt, 130)}` : "";
  const overview = trimSentence(`${kind.plainEnglish} ${description}${readmeDetail}`, 320);
  const docs = repo.readme
    ? repo.readme.hasSetup && repo.readme.hasExamples
      ? "The README has setup guidance and examples, so a user can evaluate it without guessing."
      : repo.readme.hasSetup
        ? "The README has setup guidance, but examples may need a closer look."
        : "The README exists, but the setup path is not obvious yet."
    : "README details were not available from GitHub, so this needs manual inspection.";

  const why =
    kind.kind === "directory" || kind.kind === "plugin_pack" || kind.kind === "research_resource"
      ? `${kind.goodFor} ${docs}`
      : repo.score.fit >= 65
        ? `It has a strong idea match and looks like ${plainCategory(repo)}. ${docs}`
        : repo.score.fit >= 35
          ? `It partially matches the idea and could still save research time. ${docs}`
          : `It is adjacent rather than exact, but it may reveal useful patterns or competitors. ${docs}`;

  const caution =
    kind.kind === "directory" || kind.kind === "plugin_pack" || kind.kind === "research_resource"
      ? kind.notFor
      : repo.archived
      ? "It is archived, so treat it as reference unless a maintained fork exists."
      : !repo.license
        ? "No license was detected, which can make reuse risky."
        : repo.score.activity < 35
          ? "Activity looks weak, so check recent issues and commits before building on it."
          : repo.score.fit < 35
            ? "The match is loose, so confirm the README really overlaps with the idea."
            : "Check issues, install friction, and recent releases before committing to it.";

  const next =
    kind.kind === "directory" || kind.kind === "plugin_pack" || kind.kind === "framework_sdk" || kind.kind === "research_resource"
      ? kind.reuseAdvice
      : repo.category === "already_exists"
      ? "Compare its feature set with your idea, then decide whether to use it, copy it, or differentiate."
      : repo.category === "forkable"
        ? "Open GitHub, scan the README and examples, then test the install path."
        : repo.category === "reference"
          ? "Study the architecture and UX, then look for a more maintained starting point."
          : "Use it as research context, then keep searching for a stronger foundation.";

  return { kindLabel: kind.label, overview, why, goodFor: kind.goodFor, notFor: kind.notFor, caution, next };
}

export function buildAnswerHeadline(prompt: string, repos: ClassifiedRepo[]): string {
  if (repos.length === 0) return "No strong GitHub match yet";
  if (isNameQuestion(prompt)) return "Similar names found";
  if (isLeadGenQuestion(prompt) && isRealEstateQuestion(prompt)) return "Real estate lead-gen repos found";
  if (isLeadGenQuestion(prompt)) return "Lead-gen repos worth checking";
  if (isRealEstateQuestion(prompt)) return "Real estate repo leads found";
  if (isAiDiscoveryQuestion(prompt)) return "AI repos worth exploring";
  if (isBusinessDiscoveryQuestion(prompt)) return "Business tools worth exploring";
  if (isExistenceQuestion(prompt) && repos.some((repo) => repo.category === "already_exists")) return "Yes, close matches exist";
  if (repos.some((repo) => repo.category === "forkable")) return "3 repos worth inspecting";
  return "Research leads found";
}

export function buildAnswerSections(prompt: string, repos: ClassifiedRepo[]): AnswerSections {
  const top = repos.slice(0, 3);
  if (top.length === 0) {
    return {
      intro: `No close match for "${prompt}" — try rephrasing, or add a GitHub token to search all of GitHub for your exact idea.`,
      picks: []
    };
  }

  const hasExisting = top.some((repo) => repo.category === "already_exists");
  const intro = isNameQuestion(prompt)
    ? "I found similar names on GitHub. That does not automatically block the name, but check these before you publish."
    : isLeadGenQuestion(prompt) && isRealEstateQuestion(prompt)
      ? "I treated this as a real-estate lead-generation search, not a generic AI search. Start with these leads, then verify whether they actually help with realtor prospecting, CRM, enrichment, or outreach."
      : isLeadGenQuestion(prompt)
        ? "I treated this as a lead-generation search. These repos may help with prospecting, enrichment, outreach, or CRM workflows, but inspect fit before building on them."
        : isRealEstateQuestion(prompt)
          ? "I treated this as a real-estate workflow search. These leads may help with property data, realtor tools, CRM, or market research."
    : isAiDiscoveryQuestion(prompt)
      ? "I found interesting AI repos to explore. Read the short summaries first, then open only the ones that sound useful."
      : isBusinessDiscoveryQuestion(prompt)
        ? "I found open-source business tools that may be useful to owners or operators. Start with the summaries, then dig into the best fit."
        : hasExisting
          ? "Yes. I found open-source repos that overlap with your question. Inspect these three before starting from scratch."
          : "I did not find one obvious clone, but these repos could save time or show what already exists.";

  return {
    intro,
    picks: top.map((repo, index) => {
      const narrative = buildRepoNarrative(repo);
      return {
        rank: index + 1,
        repoName: repo.fullName,
        role: repoRole(repo),
        overview: trimSentence(narrative.overview, 150),
        why: `Why it matters: ${trimSentence(narrative.why, 155)}`,
        signal: repo.score.reasons.slice(0, 2).join(", ") || shortWhy(repo)
      };
    })
  };
}

export function buildHumanAnswer(prompt: string, repos: ClassifiedRepo[]): string {
  const sections = buildAnswerSections(prompt, repos);
  const bullets = sections.picks
    .map((pick) => `${pick.rank}. ${pick.repoName} - ${pick.role}. ${pick.overview} ${pick.why} Quick check: ${pick.signal}.`)
    .join("\n\n");

  return bullets ? `${sections.intro}\n${bullets}` : sections.intro;
}
