import type { ClassifiedRepo, RepoScore } from "@/lib/analysis/types";
import type { NormalizedRepo, RepoCategory } from "@/lib/github/types";
import { getRepoKindInsight } from "../analysis/repo-kind";
import { extractIdeaTerms, planPromptRefinement } from "../search/planner";

function clamp(value: number, max = 100): number {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function daysSince(date: string | null): number {
  if (!date) return 9999;
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, diff / 86_400_000);
}

const GENERIC_INTENT_TERMS = new Set([
  "ai",
  "agent",
  "agents",
  "artificial",
  "automation",
  "github",
  "intelligence",
  "llm",
  "machine",
  "open",
  "project",
  "projects",
  "source",
  "tool",
  "tools"
]);

const SEARCH_SYNTAX_TERMS = new Set([
  "description",
  "descriptions",
  "find",
  "github",
  "match",
  "matches",
  "matching",
  "metadata",
  "name",
  "names",
  "open-source",
  "public",
  "readme",
  "search",
  "starter",
  "user",
  "users",
  "workflow",
  "workflows"
]);

function singularize(term: string): string {
  return term.length > 4 && term.endsWith("s") ? term.slice(0, -1) : term;
}

function hasValueIntent(prompt: string): boolean {
  return /\b(values?|valuations?|worth|prices?|pricing|market[-\s]?value|portfolio)\b/i.test(prompt);
}

function valueFeatureSignal(normalizedHaystack: string): number {
  return [
    /\bprices?\b/,
    /\bpricing\b/,
    /\bvalues?\b/,
    /\bvaluation\b/,
    /\bworth\b/,
    /\bportfolio\b/,
    /\btcgplayer\b/,
    /\bcardmarket\b/,
    /\bmarket\s+value\b/
  ].reduce((total, signal) => total + (signal.test(normalizedHaystack) ? 1 : 0), 0);
}

function valueFeatureBoost(prompt: string, normalizedHaystack: string): number {
  if (!hasValueIntent(prompt)) return 0;
  return Math.min(22, valueFeatureSignal(normalizedHaystack) * 6);
}

function scoringIntentTerms(prompt: string): string[] {
  const refinement = planPromptRefinement(prompt);
  const text = [
    refinement.probableMeaning,
    ...refinement.queries.slice(0, 6)
  ].join(" ").replace(/[-/]/g, " ");
  return Array.from(new Set(extractIdeaTerms(text)))
    .filter((term) => !GENERIC_INTENT_TERMS.has(term) && !SEARCH_SYNTAX_TERMS.has(term))
    .slice(0, 12);
}

function termMatchWeight(term: string, tokens: Set<string>, normalizedHaystack: string): number {
  const singular = singularize(term);
  if (tokens.has(term) || tokens.has(singular)) return 1;
  if (term.includes("-") && normalizedHaystack.includes(term)) return 0.8;
  if (singular !== term && singular.length >= 5 && normalizedHaystack.includes(singular)) return 0.65;
  if (term.length >= 6 && normalizedHaystack.includes(term)) return 0.45;
  return 0;
}

function domainMatchScore(prompt: string, tokens: Set<string>, normalizedHaystack: string): number {
  const domainTerms = extractIdeaTerms(prompt).filter((term) => !GENERIC_INTENT_TERMS.has(term));
  if (domainTerms.length < 2) return 0;
  const matches = domainTerms.reduce((total, term) => total + Math.min(1, termMatchWeight(term, tokens, normalizedHaystack)), 0);
  return matches / domainTerms.length;
}

function scoreFit(repo: NormalizedRepo, prompt: string): number {
  const terms = extractIdeaTerms(prompt);
  const intentTerms = scoringIntentTerms(prompt);
  const haystack = `${repo.fullName} ${repo.description} ${repo.topics.join(" ")} ${repo.language ?? ""} ${repo.readme?.excerpt ?? ""}`.toLowerCase();
  const normalizedHaystack = haystack.replace(/[^a-z0-9+#.\s-]/g, " ");
  const tokens = new Set(normalizedHaystack.split(/[\s/_-]+/).filter(Boolean));
  if (terms.length === 0 && intentTerms.length === 0) return 30;
  const matches = terms.reduce((total, term) => total + termMatchWeight(term, tokens, normalizedHaystack), 0);
  const intentMatches = intentTerms.reduce((total, term) => total + termMatchWeight(term, tokens, normalizedHaystack), 0);
  const rawScore = terms.length > 0 ? (matches / terms.length) * 100 : 0;
  const intentScore = intentTerms.length > 0 ? (intentMatches / intentTerms.length) * 100 : 0;
  const exactNameBoost = terms.some((term) => repo.name.toLowerCase() === term || repo.fullName.toLowerCase().includes(`/${term}`)) ? 12 : 0;
  const domainBoost = domainMatchScore(prompt, tokens, normalizedHaystack) >= 0.5 || intentScore >= 55 ? 10 : 0;
  return clamp(Math.max(rawScore, intentScore) + exactNameBoost + domainBoost + valueFeatureBoost(prompt, normalizedHaystack));
}

function isGameBuildPrompt(prompt: string): boolean {
  return /\b(2\.5d|2d|3d|game|games|game engine|gamedev|game dev|isometric|orthographic)\b/i.test(prompt);
}

function gameEngineSignal(repo: NormalizedRepo): number {
  const text = `${repo.fullName} ${repo.description} ${repo.topics.join(" ")} ${repo.readme?.excerpt ?? ""}`.toLowerCase();
  const signals = [
    /\bgodot\b/,
    /\bbevy\b/,
    /\bphaser\b/,
    /\bdefold\b/,
    /\braylib\b/,
    /\bmonogame\b/,
    /\blibgdx\b/,
    /\bgame-engine\b/,
    /\bgame engine\b/,
    /\bgame framework\b/,
    /\bisometric\b/,
    /\borthographic\b/,
    /\becs\b/
  ];
  return signals.reduce((score, signal) => score + (signal.test(text) ? 1 : 0), 0);
}

export function scoreRepository(repo: NormalizedRepo, prompt: string): RepoScore {
  const kind = getRepoKindInsight(repo);
  const age = daysSince(repo.pushedAt);
  const activity = clamp(age < 30 ? 100 : age < 180 ? 82 : age < 365 ? 62 : age < 730 ? 35 : 12);
  const popularity = clamp(Math.log10(repo.stars + 1) * 24 + Math.log10(repo.forks + 1) * 12);
  const license = repo.license ? 100 : 18;
  const metadataDocs = (repo.description ? 28 : 0) + (repo.homepage ? 12 : 0) + (repo.topics.length > 0 ? 14 : 0);
  const docs = clamp(metadataDocs + (repo.readme?.qualityScore ? repo.readme.qualityScore * 0.55 : 0));
  const fit = scoreFit(repo, prompt);
  const haystack = `${repo.fullName} ${repo.description} ${repo.topics.join(" ")} ${repo.language ?? ""} ${repo.readme?.excerpt ?? ""}`.toLowerCase();
  const normalizedHaystack = haystack.replace(/[^a-z0-9+#.\s-]/g, " ");
  const tokens = new Set(normalizedHaystack.split(/[\s/_-]+/).filter(Boolean));
  const hasDomainMatch = domainMatchScore(prompt, tokens, normalizedHaystack) >= 0.5;
  const hasValueFeatureMatch = hasValueIntent(prompt) && valueFeatureSignal(normalizedHaystack) > 0;
  const archivedPenalty = repo.archived ? 45 : 0;
  const kindUtility =
    kind.kind === "game_engine"
      ? 112
      : kind.kind === "starter_template" || kind.kind === "app"
      ? 100
      : kind.kind === "framework_sdk" || kind.kind === "library"
        ? 82
        : kind.kind === "directory" || kind.kind === "plugin_pack" || kind.kind === "research_resource"
          ? isGameBuildPrompt(prompt) ? 34 : 58
          : 68;
  const gameBoost = isGameBuildPrompt(prompt) ? Math.min(18, gameEngineSignal(repo) * 5) : 0;
  const total = clamp(fit * 0.34 + activity * 0.22 + popularity * 0.14 + license * 0.11 + docs * 0.09 + kindUtility * 0.1 + gameBoost - archivedPenalty);

  const reasons = [
    fit >= 70 ? "Strong keyword fit" : fit >= 40 ? "Partial idea fit" : "Weak idea fit",
    activity >= 70 ? "Recently active" : activity >= 35 ? "Some activity risk" : "Stale activity",
    license >= 80 ? "Has a license" : "License not detected",
    docs >= 70 ? "README/docs look useful" : docs >= 45 ? "Docs need inspection" : "Sparse docs"
  ];

  if (hasDomainMatch) reasons.push("Vertical/domain match");
  if (hasValueFeatureMatch) reasons.push("Value/pricing feature match");
  if (repo.archived) reasons.push("Repository is archived");
  if (repo.readme?.hasSetup) reasons.push("Setup path found in README");
  if (repo.readme?.hasExamples) reasons.push("Examples or usage found in README");
  if (kind.kind === "directory") reasons.push("Curated list, not a runnable app");
  if (kind.kind === "plugin_pack") reasons.push("Developer plugin pack, not a product app");
  if (kind.kind === "game_engine") reasons.push("Game engine/framework signal");

  return { total, fit, activity, popularity, license, docs, reasons };
}

export function categorizeRepo(repo: NormalizedRepo, score: RepoScore): RepoCategory {
  const kind = getRepoKindInsight(repo);
  if (repo.archived || score.activity < 20 || score.license < 30) return "risk";
  if (kind.kind === "directory" || kind.kind === "plugin_pack" || kind.kind === "research_resource") return "reference";
  if (kind.kind === "game_engine") return "forkable";
  if (kind.kind === "starter_template" && score.total >= 55 && score.activity >= 45) return "forkable";
  if (kind.kind === "framework_sdk") return "reference";
  if (score.fit >= 72 && score.popularity >= 45) return "already_exists";
  if (score.total >= 68 && score.activity >= 55) return "forkable";
  if (score.fit >= 35 || score.popularity >= 50) return "reference";
  return "gap";
}

function extractKnownRepoSlug(prompt: string): string | null {
  const urlMatch = prompt.match(/(?:https?:\/\/)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i);
  const slugMatch = prompt.match(/\b([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\b/);
  const match = urlMatch ?? slugMatch;
  return match ? `${match[1]}/${match[2]}`.toLowerCase() : null;
}

export function classifyRepositories(repos: NormalizedRepo[], prompt: string): ClassifiedRepo[] {
  const knownRepoSlug = extractKnownRepoSlug(prompt);
  return repos
    .map((repo) => {
      const baseScore = scoreRepository(repo, prompt);
      const isKnownRepo = knownRepoSlug === repo.fullName.toLowerCase();
      const score = isKnownRepo
        ? {
            ...baseScore,
            total: Math.max(baseScore.total, 98),
            fit: Math.max(baseScore.fit, 98),
            reasons: ["Exact repo requested by the user", ...baseScore.reasons]
          }
        : baseScore;
      const category = categorizeRepo(repo, score);
      return {
        ...repo,
        score,
        category,
        summary: score.reasons.slice(0, 3).join(". ")
      };
    })
    .sort((a, b) => b.score.total - a.score.total || b.score.fit - a.score.fit);
}
