import { fetchReadmeAnalysis } from "@/lib/github/readme";
import type { NormalizedRepo } from "@/lib/github/types";

export async function prepareRepoForHandoff(repo: NormalizedRepo, token?: string): Promise<NormalizedRepo> {
  if (repo.readme?.evidence?.fetchStatus === "ok") return repo;
  const readme = await fetchReadmeAnalysis(repo, token);
  return {
    ...repo,
    readme: readme ?? repo.readme
  };
}
