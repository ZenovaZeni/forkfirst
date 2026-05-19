import { NextResponse } from "next/server";
import { z } from "zod";
import { TRENDING_CATEGORIES, TRENDING_CATEGORY_IDS, buildTrendingQueries, type TrendingCategoryId } from "@/lib/trending/categories";
import { balancedTrendingItems, topTrendingItems } from "@/lib/trending/merge";
import { checkRateLimitForRequest } from "@/lib/security/rate-limit";
import { readJsonRequest } from "@/lib/security/request-json";

export const runtime = "nodejs";

type NonAllTrendingCategoryId = Exclude<TrendingCategoryId, "all">;

const RequestSchema = z.object({
  categoryId: z.enum(TRENDING_CATEGORY_IDS),
  githubToken: z.string().max(300).optional()
});

export type TrendingRepo = {
  fullName: string;
  description: string;
  stars: number;
  language: string | null;
  htmlUrl: string;
  homepage: string | null;
  license: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  topics: string[];
  sourceCategoryId?: NonAllTrendingCategoryId;
  sourceCategoryLabel?: string;
  sourceCategoryBlurb?: string;
  matchedCategoryIds?: NonAllTrendingCategoryId[];
  matchedCategoryLabels?: string[];
};

type GitHubSearchItem = {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
  homepage: string | null;
  license: { spdx_id: string } | null;
  updated_at: string | null;
  created_at: string | null;
  topics: string[];
};

type GitHubSearchResponse = {
  items: GitHubSearchItem[];
  message?: string;
};

type GitHubSearchResult = {
  query: string;
  ok: boolean;
  status: number;
  items: GitHubSearchItem[];
};

type CategorizedGitHubSearchResult = GitHubSearchResult & {
  categoryId: TrendingCategoryId;
};

const trendingRateLimit = new Map<string, { count: number; windowStart: number }>();
const TRENDING_CACHE_MS = 24 * 60 * 60 * 1000;
const trendingCache = new Map<string, { repos: TrendingRepo[]; generatedAt: string; expiresAt: number }>();

const fallbackTrendingRepos: Partial<Record<TrendingCategoryId, TrendingRepo[]>> = {
  "ai-agents": [
    {
      fullName: "microsoft/autogen",
      description: "A programming framework for agentic AI.",
      stars: 48000,
      language: "Python",
      htmlUrl: "https://github.com/microsoft/autogen",
      homepage: "https://microsoft.github.io/autogen/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["ai-agents", "llm", "multi-agent"]
    },
    {
      fullName: "crewAIInc/crewAI",
      description: "Framework for orchestrating role-playing autonomous AI agents.",
      stars: 36000,
      language: "Python",
      htmlUrl: "https://github.com/crewAIInc/crewAI",
      homepage: "https://www.crewai.com/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["ai-agents", "automation", "llm"]
    },
    {
      fullName: "langchain-ai/langgraph",
      description: "Build resilient language agents as graphs.",
      stars: 17000,
      language: "Python",
      htmlUrl: "https://github.com/langchain-ai/langgraph",
      homepage: "https://langchain-ai.github.io/langgraph/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["agents", "llm", "graphs"]
    }
  ],
  "cursor-mcp": [
    {
      fullName: "modelcontextprotocol/servers",
      description: "Reference implementations for the Model Context Protocol.",
      stars: 60000,
      language: "TypeScript",
      htmlUrl: "https://github.com/modelcontextprotocol/servers",
      homepage: "https://modelcontextprotocol.io/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["mcp", "mcp-server", "llm"]
    },
    {
      fullName: "punkpeye/awesome-mcp-servers",
      description: "A collection of MCP servers.",
      stars: 65000,
      language: "Markdown",
      htmlUrl: "https://github.com/punkpeye/awesome-mcp-servers",
      homepage: null,
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["mcp", "awesome-list", "servers"]
    },
    {
      fullName: "upstash/context7",
      description: "Up-to-date documentation context for AI code editors and agents.",
      stars: 25000,
      language: "TypeScript",
      htmlUrl: "https://github.com/upstash/context7",
      homepage: "https://context7.com/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["mcp", "documentation", "cursor"]
    }
  ],
  "web-apps": [
    {
      fullName: "vercel/next.js",
      description: "The React Framework.",
      stars: 130000,
      language: "TypeScript",
      htmlUrl: "https://github.com/vercel/next.js",
      homepage: "https://nextjs.org/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["nextjs", "react", "web-app"]
    },
    {
      fullName: "remix-run/remix",
      description: "Build better websites.",
      stars: 32000,
      language: "TypeScript",
      htmlUrl: "https://github.com/remix-run/remix",
      homepage: "https://remix.run/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["web-app", "react", "fullstack"]
    },
    {
      fullName: "supabase/supabase",
      description: "The open source Firebase alternative.",
      stars: 90000,
      language: "TypeScript",
      htmlUrl: "https://github.com/supabase/supabase",
      homepage: "https://supabase.com/",
      license: "Apache-2.0",
      updatedAt: null,
      createdAt: null,
      topics: ["backend", "database", "fullstack"]
    }
  ],
  "saas-starters": [
    {
      fullName: "nextjs/saas-starter",
      description: "A starter template for building SaaS applications with Next.js.",
      stars: 12000,
      language: "TypeScript",
      htmlUrl: "https://github.com/nextjs/saas-starter",
      homepage: "https://nextjs.org/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["saas", "nextjs", "starter"]
    },
    {
      fullName: "boxyhq/saas-starter-kit",
      description: "Enterprise SaaS starter kit with auth and common app patterns.",
      stars: 5000,
      language: "TypeScript",
      htmlUrl: "https://github.com/boxyhq/saas-starter-kit",
      homepage: "https://boxyhq.com/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["saas", "starter", "nextjs"]
    },
    {
      fullName: "t3-oss/create-t3-app",
      description: "The best way to start a full-stack, typesafe Next.js app.",
      stars: 26000,
      language: "TypeScript",
      htmlUrl: "https://github.com/t3-oss/create-t3-app",
      homepage: "https://create.t3.gg/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["starter", "nextjs", "typescript"]
    }
  ],
  "indie-apps": [
    {
      fullName: "home-assistant/android",
      description: "Home Assistant Companion for Android.",
      stars: 3600,
      language: "Kotlin",
      htmlUrl: "https://github.com/home-assistant/android",
      homepage: "https://www.home-assistant.io/",
      license: "Apache-2.0",
      updatedAt: null,
      createdAt: null,
      topics: ["open-source-app", "android", "home-assistant"]
    },
    {
      fullName: "home-assistant/iOS",
      description: "Home Assistant for Apple platforms.",
      stars: 2200,
      language: "Swift",
      htmlUrl: "https://github.com/home-assistant/iOS",
      homepage: "https://www.home-assistant.io/",
      license: "Apache-2.0",
      updatedAt: null,
      createdAt: null,
      topics: ["open-source-app", "ios", "home-assistant"]
    },
    {
      fullName: "dominikmuellr/trudido",
      description: "Simple tasks. Secure notes. Made in Europe.",
      stars: 230,
      language: "Dart",
      htmlUrl: "https://github.com/dominikmuellr/trudido",
      homepage: null,
      license: "GPL-3.0",
      updatedAt: null,
      createdAt: null,
      topics: ["open-source-app", "tasks", "notes"]
    }
  ],
  dashboards: [
    {
      fullName: "tremorlabs/tremor",
      description: "React components to build charts and dashboards.",
      stars: 16000,
      language: "TypeScript",
      htmlUrl: "https://github.com/tremorlabs/tremor",
      homepage: "https://tremor.so/",
      license: "Apache-2.0",
      updatedAt: null,
      createdAt: null,
      topics: ["dashboard", "charts", "react"]
    }
  ],
  "mobile-pwa": [
    {
      fullName: "ionic-team/ionic-framework",
      description: "A powerful cross-platform app runtime and UI toolkit.",
      stars: 51000,
      language: "TypeScript",
      htmlUrl: "https://github.com/ionic-team/ionic-framework",
      homepage: "https://ionicframework.com/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["mobile-app", "pwa", "cross-platform"]
    }
  ],
  "scrapers-apis": [
    {
      fullName: "apify/crawlee",
      description: "A web scraping and browser automation library.",
      stars: 17000,
      language: "TypeScript",
      htmlUrl: "https://github.com/apify/crawlee",
      homepage: "https://crawlee.dev/",
      license: "Apache-2.0",
      updatedAt: null,
      createdAt: null,
      topics: ["web-scraping", "automation", "api"]
    }
  ],
  "ui-kits": [
    {
      fullName: "shadcn-ui/ui",
      description: "Beautifully designed components that you can copy and paste into your apps.",
      stars: 90000,
      language: "TypeScript",
      htmlUrl: "https://github.com/shadcn-ui/ui",
      homepage: "https://ui.shadcn.com/",
      license: "MIT",
      updatedAt: null,
      createdAt: null,
      topics: ["ui-components", "react", "tailwindcss"]
    }
  ]
};

function categoryMeta(categoryId: NonAllTrendingCategoryId) {
  const category = TRENDING_CATEGORIES.find((item) => item.id === categoryId);
  return {
    sourceCategoryId: categoryId,
    sourceCategoryLabel: category?.label ?? categoryId,
    sourceCategoryBlurb: category?.blurb ?? "",
    matchedCategoryIds: [categoryId],
    matchedCategoryLabels: [category?.label ?? categoryId]
  };
}

function withCategoryMeta(repo: TrendingRepo, categoryId: NonAllTrendingCategoryId, matchedCategoryIds: NonAllTrendingCategoryId[] = [categoryId]): TrendingRepo {
  const source = TRENDING_CATEGORIES.find((item) => item.id === categoryId);
  const matchedLabels = matchedCategoryIds
    .map((id) => TRENDING_CATEGORIES.find((item) => item.id === id)?.label ?? id);
  return {
    ...repo,
    sourceCategoryId: categoryId,
    sourceCategoryLabel: source?.label ?? categoryId,
    sourceCategoryBlurb: source?.blurb ?? "",
    matchedCategoryIds,
    matchedCategoryLabels: matchedLabels
  };
}

function fallbackForCategory(categoryId: TrendingCategoryId) {
  if (categoryId !== "all" && fallbackTrendingRepos[categoryId]?.length) {
    return fallbackTrendingRepos[categoryId]!.map((repo) => withCategoryMeta(repo, categoryId));
  }
  const seen = new Set<string>();
  return Object.entries(fallbackTrendingRepos)
    .flatMap(([id, repos]) => (repos ?? []).map((repo) => withCategoryMeta(repo, id as NonAllTrendingCategoryId)))
    .filter((repo) => {
      if (seen.has(repo.fullName)) return false;
      seen.add(repo.fullName);
      return true;
    })
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 12);
}

function trendingResponse(categoryId: TrendingCategoryId, repos: TrendingRepo[], meta: Record<string, unknown>) {
  return NextResponse.json({
    repos,
    meta: {
      source: "GitHub Search API",
      sort: "stars",
      windowDays: 30,
      cachedSeconds: TRENDING_CACHE_MS / 1000,
      generatedAt: new Date().toISOString(),
      categoryId,
      ...meta
    }
  });
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimitForRequest(request, trendingRateLimit, {
    max: 20,
    windowMs: 60_000,
    scope: "trending"
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many trending requests. Try again in ${rateLimit.retryAfterSeconds} seconds.`, code: "TRENDING_RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() } }
    );
  }

  const body = RequestSchema.safeParse(await readJsonRequest(request));

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request. Provide a valid categoryId.", code: "TRENDING_FETCH_FAILED" },
      { status: 400 }
    );
  }

  const category = TRENDING_CATEGORIES.find((c) => c.id === body.data.categoryId);
  if (!category) {
    return NextResponse.json(
      { error: "Unknown category.", code: "TRENDING_FETCH_FAILED" },
      { status: 400 }
    );
  }
  const tokenBackedFetch = Boolean(body.data.githubToken);
  const cacheKey = body.data.categoryId;
  const cached = trendingCache.get(cacheKey);
  if (!tokenBackedFetch && cached && cached.expiresAt > Date.now()) {
    return trendingResponse(cacheKey, cached.repos, {
      source: "ForkFirst cache",
      generatedAt: cached.generatedAt,
      stale: false
    });
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ForkFirst"
  };

  if (body.data.githubToken) {
    headers.Authorization = `Bearer ${body.data.githubToken}`;
  }

  async function fetchTrendingQuery(query: string, perPage = 8): Promise<GitHubSearchResult> {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`;
    const res = await fetch(url, {
      headers,
      ...(tokenBackedFetch ? { cache: "no-store" as const } : { next: { revalidate: TRENDING_CACHE_MS / 1000 } })
    });

    if (!res.ok) {
      console.error("[trending] GitHub error:", res.status);
      return { query, ok: false, status: res.status, items: [] };
    }

    const data = (await res.json()) as GitHubSearchResponse;
    return { query, ok: true, status: res.status, items: Array.isArray(data.items) ? data.items : [] };
  }

  const allCategories = TRENDING_CATEGORIES.filter((item): item is typeof item & { id: NonAllTrendingCategoryId } => item.id !== "all");
  const queryGroups = body.data.categoryId === "all"
    ? allCategories.map((item) => ({
      categoryId: item.id,
      queries: buildTrendingQueries(item),
      perPage: 4
    }))
    : [{
      categoryId: category.id,
      queries: buildTrendingQueries(category),
      perPage: 8
    }];
  const queries = queryGroups.flatMap((group) => group.queries);
  let results: CategorizedGitHubSearchResult[];

  try {
    results = await Promise.all(queryGroups.flatMap((group) =>
      group.queries.map(async (query) => ({
        ...(await fetchTrendingQuery(query, group.perPage)),
        categoryId: group.categoryId
      }))
    ));
  } catch {
    console.error("[trending] fetch failed");
    if (cached) {
      return trendingResponse(cacheKey, cached.repos, {
        source: "ForkFirst stale cache",
        generatedAt: cached.generatedAt,
        stale: true
      });
    }
    return trendingResponse(cacheKey, fallbackForCategory(cacheKey), {
      source: "ForkFirst fallback",
      stale: true,
      warning: "Could not reach GitHub, so ForkFirst is showing a curated starter set."
    });
  }

  const successfulResults = results.filter((result) => result.ok);
  if (successfulResults.length === 0) {
    const firstStatus = results[0]?.status ?? 502;
    if (cached) {
      return trendingResponse(cacheKey, cached.repos, {
        source: "ForkFirst stale cache",
        generatedAt: cached.generatedAt,
        stale: true,
        warning: `GitHub returned ${firstStatus}.`
      });
    }
    return trendingResponse(cacheKey, fallbackForCategory(cacheKey), {
      source: "ForkFirst fallback",
      stale: true,
      warning: `GitHub returned ${firstStatus}. Showing a curated starter set instead.`
    });
  }

  const orderedItems = body.data.categoryId === "all"
    ? balancedTrendingItems(successfulResults, allCategories.map((item) => item.id), 36)
    : topTrendingItems(successfulResults.flatMap((result) => result.items), 12).map((item) => ({
      item,
      ...categoryMeta(category.id as NonAllTrendingCategoryId)
    }));

  const repos: TrendingRepo[] = orderedItems
    .map((entry) => {
      const item = entry.item;
      const sourceCategory = TRENDING_CATEGORIES.find((cat) => cat.id === entry.sourceCategoryId);
      const matchedCategoryLabels = entry.matchedCategoryIds
        .map((id) => TRENDING_CATEGORIES.find((cat) => cat.id === id)?.label ?? id);
      return {
      fullName: item.full_name,
      description: item.description ?? "",
      stars: item.stargazers_count,
      language: item.language,
      htmlUrl: item.html_url,
      homepage: item.homepage,
      license: item.license?.spdx_id ?? null,
      updatedAt: item.updated_at,
      createdAt: item.created_at,
      topics: Array.isArray(item.topics) ? item.topics.slice(0, 6) : [],
      sourceCategoryId: entry.sourceCategoryId,
      sourceCategoryLabel: sourceCategory?.label ?? entry.sourceCategoryId,
      sourceCategoryBlurb: sourceCategory?.blurb ?? "",
      matchedCategoryIds: entry.matchedCategoryIds,
      matchedCategoryLabels
    };
    });

  if (!tokenBackedFetch) {
    trendingCache.set(cacheKey, {
      repos,
      generatedAt: new Date().toISOString(),
      expiresAt: Date.now() + TRENDING_CACHE_MS
    });
  }
  return trendingResponse(cacheKey, repos, {
    queries,
    successfulQueries: successfulResults.map((result) => result.query)
  });
}
