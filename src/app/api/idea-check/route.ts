import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeIdea } from "@/lib/analysis/analyst";
import { buildSearchRecovery } from "@/lib/analysis/search-recovery";
import { searchGithubRepositories } from "@/lib/github/provider";
import { classifyRepositories } from "@/lib/scoring/scoring";
import { saveIdeaCheck } from "@/lib/db/research-cases";
import { requireSafeBaseUrl } from "@/lib/keys/base-url-policy";
import { checkRateLimitForRequest } from "@/lib/security/rate-limit";
import { readJsonRequest } from "@/lib/security/request-json";
import { serverDbEnabled } from "@/lib/security/server-db";
import type { IdeaCheckResult } from "@/types/idea-check";

export const runtime = "nodejs";

const RequestSchema = z.object({
  prompt: z.string().min(8).max(1200),
  caseId: z.string().optional(),
  githubToken: z.string().max(300).optional(),
  aiProvider: z.enum(["openai", "groq", "deepseek", "custom"]).optional(),
  aiApiKey: z.string().max(300).optional(),
  aiModel: z.string().max(120).optional(),
  aiBaseUrl: z.string().max(240).optional(),
  aiBaseUrlAcknowledged: z.boolean().default(false)
});

const ideaCheckRateLimit = new Map<string, { count: number; windowStart: number }>();

export async function POST(request: Request) {
  const rateLimit = await checkRateLimitForRequest(request, ideaCheckRateLimit, {
    max: 8,
    windowMs: 60_000,
    scope: "idea-check"
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many idea checks. Try again in ${rateLimit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() } }
    );
  }

  const body = RequestSchema.safeParse(await readJsonRequest(request));

  if (!body.success) {
    return NextResponse.json({ error: "Enter a more specific idea to check." }, { status: 400 });
  }

  if (body.data.aiProvider === "custom") {
    try {
      requireSafeBaseUrl(body.data.aiBaseUrl, { allowUntrusted: body.data.aiBaseUrlAcknowledged === true });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message, code: "BASE_URL_BLOCKED" }, { status: 400 });
    }
  }

  const search = await searchGithubRepositories(body.data.prompt, body.data.githubToken);
  const classified = classifyRepositories(search.repos, body.data.prompt);

  // Wrap untrusted repo content to mitigate prompt injection
  const wrappedRepos = classified.map((repo) => ({
    ...repo,
    description: `<UNTRUSTED_REPO_CONTENT>${repo.description}</UNTRUSTED_REPO_CONTENT>`,
    readme: repo.readme ? {
      ...repo.readme,
      excerpt: `<UNTRUSTED_REPO_CONTENT>${repo.readme.excerpt}</UNTRUSTED_REPO_CONTENT>`
    } : undefined
  }));

  const analysis = await analyzeIdea(body.data.prompt, wrappedRepos, {
    provider: body.data.aiProvider,
    apiKey: body.data.aiApiKey,
    model: body.data.aiModel,
    baseUrl: body.data.aiBaseUrl
  });

  const result: IdeaCheckResult = {
    id: crypto.randomUUID(),
    prompt: body.data.prompt,
    createdAt: new Date().toISOString(),
    queries: search.queries,
    refinement: search.refinement,
    warnings: search.warnings,
    recovery: buildSearchRecovery({ prompt: body.data.prompt, repos: analysis.repos, warnings: search.warnings }),
    ...analysis
  };

  if (serverDbEnabled()) {
    saveIdeaCheck(result, body.data.caseId);
  }

  return NextResponse.json(result);
}
