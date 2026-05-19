import type { NormalizedRepo, ReadmeAnalysis } from "./types";

type GitHubReadmeResponse = {
  content?: string;
  encoding?: string;
  download_url?: string | null;
  html_url?: string | null;
};

const SETUP_PATTERNS = [/install/i, /setup/i, /quick\s*start/i, /getting started/i, /npm install/i, /pnpm install/i];
const EXAMPLE_PATTERNS = [/example/i, /usage/i, /demo/i, /sample/i, /screenshot/i];
const API_PATTERNS = [/\bapi\b/i, /endpoint/i, /sdk/i, /token/i, /github/i, /openai/i, /provider/i];
const LOCAL_PATTERNS = [/local/i, /self-host/i, /offline/i, /run dev/i, /localhost/i, /docker/i];
const LICENSE_PATTERNS = [/mit license/i, /apache license/i, /gpl/i, /bsd license/i, /license/i];

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function excerptFrom(readme: string): string {
  return readme
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_\-[\]()`]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

export function analyzeReadme(readme: string, url: string | null = null): ReadmeAnalysis {
  const hasSetup = hasAny(readme, SETUP_PATTERNS);
  const hasExamples = hasAny(readme, EXAMPLE_PATTERNS);
  const hasApiDetails = hasAny(readme, API_PATTERNS);
  const hasLocalDevelopment = hasAny(readme, LOCAL_PATTERNS);
  const hasLicenseText = hasAny(readme, LICENSE_PATTERNS);
  const lengthScore = Math.min(25, Math.round(readme.trim().length / 280));
  const qualityScore = Math.min(
    100,
    lengthScore +
      (hasSetup ? 22 : 0) +
      (hasExamples ? 20 : 0) +
      (hasApiDetails ? 18 : 0) +
      (hasLocalDevelopment ? 16 : 0) +
      (hasLicenseText ? 5 : 0)
  );

  const reasons = [
    hasSetup ? "README explains setup" : "README setup is unclear",
    hasExamples ? "README includes examples or usage" : "README examples are limited",
    hasApiDetails ? "README describes API/integration details" : "README has limited integration detail",
    hasLocalDevelopment ? "README mentions local/dev workflow" : "README may need local setup inspection"
  ];

  return {
    excerpt: excerptFrom(readme),
    url,
    hasSetup,
    hasExamples,
    hasApiDetails,
    hasLocalDevelopment,
    hasLicenseText,
    qualityScore,
    reasons
  };
}

async function fetchReadme(repo: NormalizedRepo, token?: string): Promise<ReadmeAnalysis | undefined> {
  const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/readme`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(token ? { cache: "no-store" as const } : { next: { revalidate: 900 } })
    });

    if (!response.ok) return undefined;

    const data = (await response.json()) as GitHubReadmeResponse;
    if (!data.content || data.encoding !== "base64") return undefined;

    const text = Buffer.from(data.content, "base64").toString("utf-8");
    return analyzeReadme(text, data.html_url ?? data.download_url ?? null);
  } catch {
    return undefined;
  }
}

export async function enrichRepositoriesWithReadmes(repos: NormalizedRepo[], token?: string): Promise<NormalizedRepo[]> {
  const enrichmentLimit = 12;
  const enriched = await Promise.all(
    repos.slice(0, enrichmentLimit).map(async (repo) => ({
      ...repo,
      readme: await fetchReadme(repo, token)
    }))
  );

  return [...enriched, ...repos.slice(enrichmentLimit)];
}
