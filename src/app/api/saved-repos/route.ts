import { NextResponse } from "next/server";
import { z } from "zod";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { saveRepo } from "@/lib/db/research-cases";
import { checkRateLimitForRequest } from "@/lib/security/rate-limit";
import { readJsonRequest } from "@/lib/security/request-json";
import { serverDbEnabled } from "@/lib/security/server-db";

export const runtime = "nodejs";

const RequestSchema = z.object({
  caseId: z.string().min(1),
  repo: z
    .object({
      fullName: z.string().min(1),
      url: z.string().url(),
      category: z.string().min(1)
    })
    .passthrough(),
  note: z.string().max(500).optional()
});

const savedReposRateLimit = new Map<string, { count: number; windowStart: number }>();

export async function POST(request: Request) {
  if (!serverDbEnabled()) {
    return NextResponse.json({ error: "Server-side saved repos are disabled on this deployment.", code: "SERVER_DB_DISABLED" }, { status: 403 });
  }
  const rateLimit = await checkRateLimitForRequest(request, savedReposRateLimit, {
    max: 30,
    windowMs: 60_000,
    scope: "saved-repos"
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many saved repo requests. Try again in ${rateLimit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() } }
    );
  }
  const body = RequestSchema.safeParse(await readJsonRequest(request));
  if (!body.success) return NextResponse.json({ error: "Invalid saved repo." }, { status: 400 });
  saveRepo(body.data.caseId, body.data.repo as ClassifiedRepo, body.data.note ?? "");
  return NextResponse.json({ ok: true });
}
