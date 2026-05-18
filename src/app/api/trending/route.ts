import { NextResponse } from "next/server";
import { z } from "zod";
import { TRENDING_CATEGORIES, buildTrendingQueries } from "@/lib/trending/categories";
import { checkRateLimitForRequest } from "@/lib/security/rate-limit";
import { readJsonRequest } from "@/lib/security/request-json";

export const runtime = "nodejs";

const RequestSchema = z.object({
  categoryId: z.enum([
    "ai-agents",
    "claude-skills",
    "cursor-mcp",
    "dev-tools",
    "saas-starters",
    "indie-apps"
  ]),
  githubToken: z.string().max(300).optional()
});

export type TrendingRepo = {
  fullName: string;
  description: string;
  stars: number;
  language: string | null;
  htmlUrl: string;
  license: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  topics: string[];
};

type GitHubSearchItem = {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
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

const trendingRateLimit = new Map<string, { count: number; windowStart: number }>();

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

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ForkFirst"
  };

  if (body.data.githubToken) {
    headers.Authorization = `Bearer ${body.data.githubToken}`;
  }

  async function fetchTrendingQuery(query: string): Promise<GitHubSearchResult> {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=8`;
    const res = await fetch(url, {
      headers,
      next: { revalidate: 21600 }
    });

    if (!res.ok) {
      console.error("[trending] GitHub error:", res.status);
      return { query, ok: false, status: res.status, items: [] };
    }

    const data = (await res.json()) as GitHubSearchResponse;
    return { query, ok: true, status: res.status, items: Array.isArray(data.items) ? data.items : [] };
  }

  const queries = buildTrendingQueries(category);
  let results: GitHubSearchResult[];

  try {
    results = [];
    for (const query of queries) {
      results.push(await fetchTrendingQuery(query));
    }
  } catch {
    console.error("[trending] fetch failed");
    return NextResponse.json(
      { error: "Could not reach GitHub. Try again later.", code: "TRENDING_FETCH_FAILED" },
      { status: 502 }
    );
  }

  const successfulResults = results.filter((result) => result.ok);
  if (successfulResults.length === 0) {
    const firstStatus = results[0]?.status ?? 502;
    return NextResponse.json(
      { error: `GitHub returned ${firstStatus}. ${firstStatus === 403 ? "Rate limit hit - add a GitHub token." : "Try again later."}`, code: "TRENDING_FETCH_FAILED" },
      { status: 502 }
    );
  }

  const deduped = new Map<string, GitHubSearchItem>();
  for (const item of successfulResults.flatMap((result) => result.items)) {
    const existing = deduped.get(item.full_name);
    if (!existing || item.stargazers_count > existing.stargazers_count) {
      deduped.set(item.full_name, item);
    }
  }

  const repos: TrendingRepo[] = Array.from(deduped.values())
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 12)
    .map((item) => ({
      fullName: item.full_name,
      description: item.description ?? "",
      stars: item.stargazers_count,
      language: item.language,
      htmlUrl: item.html_url,
      license: item.license?.spdx_id ?? null,
      updatedAt: item.updated_at,
      createdAt: item.created_at,
      topics: Array.isArray(item.topics) ? item.topics.slice(0, 6) : []
    }));

  return NextResponse.json({
    repos,
    meta: {
      source: "GitHub Search API",
      queries,
      successfulQueries: successfulResults.map((result) => result.query),
      sort: "stars",
      windowDays: 30,
      cachedSeconds: 21600,
      generatedAt: new Date().toISOString()
    }
  });
}
