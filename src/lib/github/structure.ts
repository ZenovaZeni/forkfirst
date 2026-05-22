import type { NormalizedRepo, RepoStructureAnalysis } from "./types";

type TreeItem = {
  path?: string;
  type?: string;
};

type TreeResponse = {
  tree?: TreeItem[];
  truncated?: boolean;
  message?: string;
};

type EnrichOptions = {
  limit?: number;
  fetchImpl?: typeof fetch;
  now?: () => string;
};

const DEFAULT_LIMIT = 6;

function unique(items: Array<string | null | undefined>, limit = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (!item) continue;
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}

function hasPath(paths: string[], pattern: RegExp): boolean {
  return paths.some((path) => pattern.test(path));
}

function firstMatching(paths: string[], pattern: RegExp, limit = 4): string[] {
  return paths.filter((path) => pattern.test(path)).slice(0, limit);
}

export function analyzeRepoStructure(paths: string[], now: () => string = () => new Date().toISOString(), truncated = false): RepoStructureAnalysis {
  const normalized = unique(paths.map((path) => path.replace(/\\/g, "/")), 2500);
  const rootFiles = unique(normalized.filter((path) => !path.includes("/")), 12);
  const packageManagers = unique([
    hasPath(normalized, /(^|\/)pnpm-lock\.yaml$/i) ? "pnpm" : null,
    hasPath(normalized, /(^|\/)yarn\.lock$/i) ? "Yarn" : null,
    hasPath(normalized, /(^|\/)package-lock\.json$/i) ? "npm" : null,
    hasPath(normalized, /(^|\/)bun\.lockb?$/i) ? "Bun" : null,
    hasPath(normalized, /(^|\/)requirements\.txt$/i) || hasPath(normalized, /(^|\/)pyproject\.toml$/i) ? "Python" : null,
    hasPath(normalized, /(^|\/)Dockerfile$/i) || hasPath(normalized, /(^|\/)docker-compose\.ya?ml$/i) ? "Docker" : null
  ], 8);
  const frameworks = unique([
    hasPath(normalized, /(^|\/)next\.config\.[cm]?[jt]s$/i) || hasPath(normalized, /(^|\/)src\/app\/.*\.(tsx|ts|jsx|js)$/i) ? "Next.js / React" : null,
    hasPath(normalized, /(^|\/)vite\.config\.[cm]?[jt]s$/i) ? "Vite" : null,
    hasPath(normalized, /(^|\/)nuxt\.config\./i) ? "Nuxt" : null,
    hasPath(normalized, /(^|\/)svelte\.config\./i) ? "SvelteKit" : null,
    hasPath(normalized, /(^|\/)app\.py$/i) || hasPath(normalized, /(^|\/)flask/i) ? "Flask" : null,
    hasPath(normalized, /(^|\/)manage\.py$/i) ? "Django" : null,
    hasPath(normalized, /(^|\/)prisma\/schema\.prisma$/i) ? "Prisma" : null,
    hasPath(normalized, /(^|\/)drizzle\.config\./i) ? "Drizzle" : null
  ], 10);
  const appDirectories = unique([
    hasPath(normalized, /^src\/app\//i) ? "src/app" : null,
    hasPath(normalized, /^app\//i) ? "app" : null,
    hasPath(normalized, /^pages\//i) ? "pages" : null,
    hasPath(normalized, /^src\/components\//i) ? "src/components" : null,
    hasPath(normalized, /^components\//i) ? "components" : null,
    hasPath(normalized, /^src\/app\/api\//i) || hasPath(normalized, /^app\/api\//i) ? "src/app/api" : null,
    hasPath(normalized, /^server\//i) ? "server" : null,
    hasPath(normalized, /^api\//i) ? "api" : null
  ], 10);
  const dataLayers = unique([
    hasPath(normalized, /(^|\/)prisma\/schema\.prisma$/i) ? "Prisma schema" : null,
    hasPath(normalized, /(^|\/)drizzle\//i) || hasPath(normalized, /(^|\/)drizzle\.config\./i) ? "Drizzle schema" : null,
    hasPath(normalized, /(^|\/)(schema|models?|entities)\//i) ? "model/schema directory" : null,
    hasPath(normalized, /(^|\/)(migrations?|db)\//i) ? "database migrations" : null,
    hasPath(normalized, /(^|\/)\.env\.example$/i) ? "environment config" : null,
    hasPath(normalized, /(^|\/)(sqlite|database)\.(db|sqlite)$/i) ? "SQLite data file" : null
  ], 10);
  const inspectionTargets = unique([
    ...firstMatching(normalized, /(^|\/)README\.md$/i, 1),
    ...firstMatching(normalized, /(^|\/)LICENSE(\..*)?$/i, 1),
    ...firstMatching(normalized, /(^|\/)package\.json$/i, 1),
    ...firstMatching(normalized, /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?)$/i, 1),
    ...firstMatching(normalized, /(^|\/)(next|vite|nuxt|svelte|drizzle)\.config\./i, 2),
    ...firstMatching(normalized, /(^|\/)prisma\/schema\.prisma$/i, 1),
    ...firstMatching(normalized, /(^|\/)(src\/app|app)\/api\/.*\.(ts|js|tsx|jsx)$/i, 4),
    ...firstMatching(normalized, /(^|\/)(src\/components|components)\/.*\.(tsx|jsx|vue|svelte)$/i, 3),
    ...firstMatching(normalized, /(^|\/)(Dockerfile|docker-compose\.ya?ml)$/i, 2)
  ], 14);
  const reasons = unique([
    frameworks.length ? `${frameworks.join(", ")} files found` : null,
    appDirectories.length ? `${appDirectories.join(", ")} directories found` : null,
    dataLayers.length ? `${dataLayers.join(", ")} found` : null,
    packageManagers.length ? `${packageManagers.join(", ")} setup files found` : null,
    truncated ? "GitHub tree response was truncated; inspect the repo directly for the full file list." : null
  ], 8);

  return {
    fetchStatus: "ok",
    fetchedAt: now(),
    truncated,
    fileCount: normalized.length,
    rootFiles,
    appDirectories,
    packageManagers,
    frameworks,
    dataLayers,
    inspectionTargets,
    reasons
  };
}

function emptyStructure(fetchStatus: RepoStructureAnalysis["fetchStatus"], now: () => string): RepoStructureAnalysis {
  return {
    fetchStatus,
    fetchedAt: fetchStatus === "ok" ? now() : null,
    truncated: false,
    fileCount: 0,
    rootFiles: [],
    appDirectories: [],
    packageManagers: [],
    frameworks: [],
    dataLayers: [],
    inspectionTargets: [],
    reasons: []
  };
}

export async function fetchRepoStructure(repo: NormalizedRepo, token?: string, options: EnrichOptions = {}): Promise<RepoStructureAnalysis> {
  const branch = repo.defaultBranch || "HEAD";
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date().toISOString());
  const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/git/trees/${encodeURIComponent(branch)}?recursive=1`;

  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(token ? { cache: "no-store" as const } : { next: { revalidate: 300 } })
    });
    const data = (await response.json()) as TreeResponse;
    if (!response.ok) {
      return emptyStructure(response.status === 403 ? "rate_limited" : "error", now);
    }
    const paths = (data.tree ?? []).filter((item) => item.type === "blob" && item.path).map((item) => item.path!);
    if (paths.length === 0) return emptyStructure("missing", now);
    return analyzeRepoStructure(paths, now, Boolean(data.truncated));
  } catch {
    return emptyStructure("error", now);
  }
}

export async function enrichRepositoriesWithStructure<T extends NormalizedRepo>(
  repos: T[],
  token?: string,
  options: EnrichOptions = {}
): Promise<T[]> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const selected = repos.slice(0, limit);
  const enriched = await Promise.all(selected.map(async (repo) => ({
    ...repo,
    structure: await fetchRepoStructure(repo, token, options)
  })));
  return [...enriched, ...repos.slice(limit)];
}
