import { NextResponse } from "next/server";
import { z } from "zod";
import { prepareRepoForHandoff } from "@/lib/repo-evidence/prepare";
import { checkRateLimitForRequest } from "@/lib/security/rate-limit";
import { readJsonRequest } from "@/lib/security/request-json";
import type { NormalizedRepo } from "@/lib/github/types";

export const runtime = "nodejs";

const RequestSchema = z.object({
  repo: z.object({
    owner: z.string().min(1).max(120),
    name: z.string().min(1).max(120)
  }).passthrough(),
  githubToken: z.string().max(300).optional()
});

const repoEvidenceRateLimit = new Map<string, { count: number; windowStart: number }>();

export async function POST(request: Request) {
  const rateLimit = await checkRateLimitForRequest(request, repoEvidenceRateLimit, {
    max: 12,
    windowMs: 60_000,
    scope: "repo-evidence"
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many repo evidence requests. Try again in ${rateLimit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() } }
    );
  }

  const rawBody = await readJsonRequest(request);
  const body = RequestSchema.safeParse(rawBody);
  if (!body.success) {
    if (rawBody && typeof rawBody === "object" && "repo" in rawBody) {
      return NextResponse.json({ error: "Missing repo" }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid repo evidence request." }, { status: 400 });
  }

  try {
    const repo = await prepareRepoForHandoff(body.data.repo as NormalizedRepo, body.data.githubToken);
    return NextResponse.json({ repo });
  } catch {
    return NextResponse.json({ error: "Unable to prepare repo evidence" }, { status: 500 });
  }
}
