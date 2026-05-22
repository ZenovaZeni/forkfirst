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
  if (term === "expenses") return "expense";
  if (term === "receipts") return "receipt";
  if (term === "exports") return "export";
  if (term === "tracks" || term === "tracking") return "track";
  if (term === "scans" || term === "scanning") return "scan";
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

function isAppointmentBookingPrompt(prompt: string): boolean {
  return /\b(salon|spa|barber|barbershop|booking|appointment|appointments|scheduling|scheduler)\b/i.test(prompt);
}

function isCardCollectorPrompt(prompt: string): boolean {
  return /\b(pokemon|pok[e\u00e9]mon|tcg|trading[-\s]?card|card collector|card collection|collector album|card binder|card value|tcgdex|tcgplayer|cardmarket)\b/i.test(prompt);
}

function cardCollectorEvidence(normalizedHaystack: string): number {
  return [
    /\bpokemon\b/,
    /\btcg\b/,
    /\bcard\b/,
    /\bcards\b/,
    /\bcollection\b/,
    /\bcollector\b/,
    /\bbinder\b/,
    /\bbinders\b/,
    /\bprice\b/,
    /\bprices\b/,
    /\bvalue\b/,
    /\bvalues\b/,
    /\bwishlist\b/,
    /\bportfolio\b/
  ].reduce((total, signal) => total + (signal.test(normalizedHaystack) ? 1 : 0), 0);
}

function appointmentBookingEvidence(normalizedHaystack: string): number {
  return [
    /\bbooking\b/,
    /\bbookings\b/,
    /\bappointment\b/,
    /\bappointments\b/,
    /\bscheduling\b/,
    /\bscheduler\b/,
    /\bcalendar\b/,
    /\bcalendars\b/,
    /\bslot\b/,
    /\bslots\b/,
    /\bavailability\b/,
    /\bservice booking\b/
  ].reduce((total, signal) => total + (signal.test(normalizedHaystack) ? 1 : 0), 0);
}

function verticalCompatibilityBoost(prompt: string, normalizedHaystack: string): number {
  if (isCardCollectorPrompt(prompt)) {
    return Math.min(18, cardCollectorEvidence(normalizedHaystack) * 3);
  }
  if (isAppointmentBookingPrompt(prompt)) {
    return Math.min(18, appointmentBookingEvidence(normalizedHaystack) * 5);
  }
  return 0;
}

function isPetIdentificationPrompt(prompt: string): boolean {
  return /\b(cat id|cat identifier|cat identification|cat breed|cat scanner|identify cat|identify cats|pet id|pet identification|pet identifier|animal identification|animal image recognition)\b/i.test(prompt);
}

function petIdentificationEvidence(normalizedHaystack: string): boolean {
  return /\b(breed|breeds|pet|pets|animal|animals|image|images|photo|photos|scanner|identifier|identification|classifier|classification|profile|profiles|upload|recognition)\b/i.test(normalizedHaystack);
}

function catCommandEvidence(normalizedHaystack: string): boolean {
  return /\bcat\s*\(?1\)?\s+clone\b|\bcat\s*\(?1\)?\b|\bterminal\b|\bcli\b|\bsyntax highlighting\b|\bcommand line\b/i.test(normalizedHaystack);
}

function verticalMismatchPenalty(prompt: string, normalizedHaystack: string): number {
  if (isPetIdentificationPrompt(prompt) && (!petIdentificationEvidence(normalizedHaystack) || catCommandEvidence(normalizedHaystack))) {
    return 62;
  }
  return 0;
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
  const variants = new Set([term, singular]);
  if (singular === "scan" || term === "scanner") ["scan", "scanner", "scanning", "ocr", "capture", "upload"].forEach((variant) => variants.add(variant));
  if (singular === "track") ["track", "tracker", "tracking", "history", "log"].forEach((variant) => variants.add(variant));
  if (singular === "export") ["export", "exports", "csv", "download"].forEach((variant) => variants.add(variant));
  if (singular === "receipt") ["receipt", "receipts", "document"].forEach((variant) => variants.add(variant));
  if (singular === "expense") ["expense", "expenses", "budget"].forEach((variant) => variants.add(variant));
  if (term === "local-first" || term === "local") ["local", "local-first", "offline", "self-hosted", "self"].forEach((variant) => variants.add(variant));
  if (Array.from(variants).some((variant) => tokens.has(variant))) return 1;
  if (Array.from(variants).some((variant) => variant.length >= 4 && normalizedHaystack.includes(variant))) return 0.8;
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

function plannedIntentMatchScore(prompt: string, tokens: Set<string>, normalizedHaystack: string): number {
  const intentTerms = scoringIntentTerms(prompt);
  if (intentTerms.length === 0) return 0;
  const intentMatches = intentTerms.reduce((total, term) => total + termMatchWeight(term, tokens, normalizedHaystack), 0);
  return intentMatches / intentTerms.length;
}

function isAppFoundationRequest(prompt: string): boolean {
  return /\b(app|application|dashboard|tracker|portal|manager|organizer|scanner|scheduler|crm|system|platform|product)\b/i.test(prompt);
}

type CoverageSignal = {
  matchedTerms: number;
  requestedTerms: number;
  buckets: number;
  missingCriticalFeature: boolean;
  thinCoverage: boolean;
};

function hasPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function requestedFeatureMissing(prompt: string, normalizedHaystack: string): boolean {
  const checks: Array<{ requested: RegExp[]; evidence: RegExp[] }> = [
    {
      requested: [/\b(scan|scanner|capture|photo|image|ocr|upload)\b/i],
      evidence: [/\b(scan|scanner|capture|photo|image|ocr|upload|camera|file)\b/i]
    },
    {
      requested: [/\b(export|csv|download|pdf|json)\b/i],
      evidence: [/\b(export|csv|download|pdf|json|spreadsheet)\b/i]
    },
    {
      requested: [/\b(local[-\s]?first|offline|local storage|browser storage|on device)\b/i],
      evidence: [/\b(local|offline|browser|device|self[-\s]?hosted|sqlite|indexeddb|storage)\b/i]
    },
    {
      requested: [/\b(message|messaging|chat|notification|reminder|alert)\b/i],
      evidence: [/\b(message|messaging|chat|notification|reminder|alert|email)\b/i]
    },
    {
      requested: [/\b(calendar|schedule|booking|appointment|availability)\b/i],
      evidence: [/\b(calendar|schedule|booking|appointment|availability|slot)\b/i]
    }
  ];
  return checks.some((check) => hasPattern(prompt, check.requested) && !hasPattern(normalizedHaystack, check.evidence));
}

function coverageSignal(prompt: string, terms: string[], tokens: Set<string>, normalizedHaystack: string): CoverageSignal {
  const requestedTerms = terms
    .filter((term) => !GENERIC_INTENT_TERMS.has(term))
    .filter((term) => !SEARCH_SYNTAX_TERMS.has(term));
  const matchedTerms = requestedTerms.reduce((total, term) => total + (termMatchWeight(term, tokens, normalizedHaystack) > 0 ? 1 : 0), 0);
  const actionBucket = hasPattern(prompt, [/\b(scan|track|save|export|organize|search|schedule|book|generate|manage|capture|upload|filter|review|edit|import)\b/i]) &&
    hasPattern(normalizedHaystack, [/\b(scan|track|save|export|organize|search|schedule|book|generate|manage|capture|upload|filter|review|edit|import)\b/i]);
  const featureBucket = hasPattern(prompt, [/\b(csv|ocr|dashboard|calendar|message|notification|backup|analytics|report|local[-\s]?first|offline|price|value)\b/i]) &&
    hasPattern(normalizedHaystack, [/\b(csv|ocr|dashboard|calendar|message|notification|backup|analytics|report|local|offline|price|value|export)\b/i]);
  const entityBucket = requestedTerms.some((term) => !ACTION_WORDS_FOR_SCORING.has(term) && termMatchWeight(term, tokens, normalizedHaystack) > 0);
  const buckets = [actionBucket, featureBucket, entityBucket].filter(Boolean).length;
  const missingCriticalFeature = requestedFeatureMissing(prompt, normalizedHaystack);
  return {
    matchedTerms,
    requestedTerms: requestedTerms.length,
    buckets,
    missingCriticalFeature,
    thinCoverage: requestedTerms.length >= 3 && (matchedTerms < 2 || buckets < 2)
  };
}

const ACTION_WORDS_FOR_SCORING = new Set([
  "add",
  "book",
  "build",
  "capture",
  "create",
  "edit",
  "export",
  "filter",
  "find",
  "generate",
  "import",
  "manage",
  "organize",
  "review",
  "save",
  "scan",
  "schedule",
  "search",
  "share",
  "track",
  "upload"
]);

function scoreFit(repo: NormalizedRepo, prompt: string): number {
  const terms = extractIdeaTerms(prompt);
  const intentTerms = scoringIntentTerms(prompt);
  const structureText = [
    ...(repo.structure?.frameworks ?? []),
    ...(repo.structure?.appDirectories ?? []),
    ...(repo.structure?.dataLayers ?? []),
    ...(repo.structure?.packageManagers ?? []),
    ...(repo.structure?.reasons ?? [])
  ].join(" ");
  const haystack = `${repo.fullName} ${repo.description} ${repo.topics.join(" ")} ${repo.language ?? ""} ${repo.readme?.excerpt ?? ""} ${structureText}`.toLowerCase();
  const normalizedHaystack = haystack.replace(/[^a-z0-9+#.\s-]/g, " ");
  const tokens = new Set(normalizedHaystack.split(/[\s/_-]+/).filter(Boolean));
  if (terms.length === 0 && intentTerms.length === 0) return 30;
  const matches = terms.reduce((total, term) => total + termMatchWeight(term, tokens, normalizedHaystack), 0);
  const intentMatches = intentTerms.reduce((total, term) => total + termMatchWeight(term, tokens, normalizedHaystack), 0);
  const rawScore = terms.length > 0 ? (matches / terms.length) * 100 : 0;
  const intentScore = intentTerms.length > 0 ? (intentMatches / intentTerms.length) * 100 : 0;
  const exactNameBoost = terms.some((term) => repo.name.toLowerCase() === term || repo.fullName.toLowerCase().includes(`/${term}`)) ? 12 : 0;
  const domainBoost = domainMatchScore(prompt, tokens, normalizedHaystack) >= 0.5 || intentScore >= 55 ? 10 : 0;
  const mismatchPenalty = verticalMismatchPenalty(prompt, normalizedHaystack);
  const coverage = coverageSignal(prompt, terms, tokens, normalizedHaystack);
  const coverageBoost = coverage.buckets >= 2 ? 8 : 0;
  const featurePenalty = coverage.missingCriticalFeature ? 18 : 0;
  const thinCoverageCap = isAppFoundationRequest(prompt) && coverage.thinCoverage ? 76 : 100;
  return clamp(
    Math.min(
      thinCoverageCap,
      Math.max(rawScore, intentScore) +
        exactNameBoost +
        domainBoost +
        coverageBoost +
        valueFeatureBoost(prompt, normalizedHaystack) +
        verticalCompatibilityBoost(prompt, normalizedHaystack) -
        mismatchPenalty -
        featurePenalty
    )
  );
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
  const structureText = [
    ...(repo.structure?.frameworks ?? []),
    ...(repo.structure?.appDirectories ?? []),
    ...(repo.structure?.dataLayers ?? []),
    ...(repo.structure?.packageManagers ?? []),
    ...(repo.structure?.reasons ?? [])
  ].join(" ");
  const haystack = `${repo.fullName} ${repo.description} ${repo.topics.join(" ")} ${repo.language ?? ""} ${repo.readme?.excerpt ?? ""} ${structureText}`.toLowerCase();
  const normalizedHaystack = haystack.replace(/[^a-z0-9+#.\s-]/g, " ");
  const tokens = new Set(normalizedHaystack.split(/[\s/_-]+/).filter(Boolean));
  const hasDomainMatch = domainMatchScore(prompt, tokens, normalizedHaystack) >= 0.5 || plannedIntentMatchScore(prompt, tokens, normalizedHaystack) >= 0.55;
  const hasValueFeatureMatch = hasValueIntent(prompt) && valueFeatureSignal(normalizedHaystack) > 0;
  const coverage = coverageSignal(prompt, extractIdeaTerms(prompt), tokens, normalizedHaystack);
  const isAppRequest = isAppFoundationRequest(prompt);
  const nonAppKindPenalty = isAppRequest && (kind.kind === "directory" || kind.kind === "plugin_pack" || kind.kind === "research_resource" || kind.kind === "framework_sdk" || kind.kind === "library") ? 8 : 0;
  const archivedPenalty = repo.archived ? 45 : 0;
  const kindUtility =
    kind.kind === "game_engine"
      ? 112
      : kind.kind === "starter_template" || kind.kind === "app"
      ? 100
      : kind.kind === "framework_sdk" || kind.kind === "library"
        ? isAppRequest ? 62 : 82
        : kind.kind === "directory" || kind.kind === "plugin_pack" || kind.kind === "research_resource"
          ? isGameBuildPrompt(prompt) ? 34 : 58
          : 68;
  const gameBoost = isGameBuildPrompt(prompt) ? Math.min(18, gameEngineSignal(repo) * 5) : 0;
  const total = clamp(fit * 0.34 + activity * 0.22 + popularity * 0.14 + license * 0.11 + docs * 0.09 + kindUtility * 0.1 + gameBoost - archivedPenalty - nonAppKindPenalty);

  const reasons = [
    fit >= 70 && !coverage.thinCoverage && !coverage.missingCriticalFeature ? "Strong workflow fit" : fit >= 40 ? "Partial idea fit" : "Weak idea fit",
    activity >= 70 ? "Recently active" : activity >= 35 ? "Some activity risk" : "Stale activity",
    license >= 80 ? "Has a license" : "License not detected",
    docs >= 70 ? "README/docs look useful" : docs >= 45 ? "Docs need inspection" : "Sparse docs"
  ];

  if (hasDomainMatch) reasons.push("Vertical/domain match");
  if (coverage.thinCoverage) reasons.push("Limited workflow coverage");
  if (coverage.missingCriticalFeature) reasons.push("Missing requested feature signal");
  if (nonAppKindPenalty > 0) reasons.push("Reference type for app request");
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
