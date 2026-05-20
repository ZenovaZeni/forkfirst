import { enrichRepositoriesWithReadmes } from "../github/readme";
import type { NormalizedRepo } from "../github/types";
import { classifyRepositories } from "../scoring/scoring";

type ReadmeEnricher = (repos: NormalizedRepo[], token?: string) => Promise<NormalizedRepo[]>;

export type EnrichTopCandidateReadmesOptions = {
  limit?: number;
  enrichReadmes?: ReadmeEnricher;
};

const DEFAULT_ENRICHMENT_LIMIT = 8;
const MIN_CANDIDATE_FIT = 25;

export function selectReadmeEnrichmentCandidates(
  repos: NormalizedRepo[],
  prompt: string,
  limit = DEFAULT_ENRICHMENT_LIMIT
): NormalizedRepo[] {
  if (limit <= 0) return [];

  const reposByFullName = new Map(repos.map((repo) => [repo.fullName.toLowerCase(), repo]));

  return classifyRepositories(repos, prompt)
    .filter((repo) => !repo.readme && repo.score.fit >= MIN_CANDIDATE_FIT && repo.category !== "gap" && repo.category !== "risk")
    .slice(0, limit)
    .map((repo) => reposByFullName.get(repo.fullName.toLowerCase()))
    .filter((repo): repo is NormalizedRepo => Boolean(repo));
}

export async function enrichTopCandidateReadmes(
  repos: NormalizedRepo[],
  prompt: string,
  token?: string,
  options: EnrichTopCandidateReadmesOptions = {}
): Promise<NormalizedRepo[]> {
  const limit = options.limit ?? DEFAULT_ENRICHMENT_LIMIT;
  const candidates = selectReadmeEnrichmentCandidates(repos, prompt, limit);
  if (candidates.length === 0) return repos;

  const enrichReadmes = options.enrichReadmes ?? enrichRepositoriesWithReadmes;
  const enrichedCandidates = await enrichReadmes(candidates, token);
  const enrichedByFullName = new Map(enrichedCandidates.map((repo) => [repo.fullName.toLowerCase(), repo]));

  return repos.map((repo) => enrichedByFullName.get(repo.fullName.toLowerCase()) ?? repo);
}
