import { NextResponse } from "next/server";
import { z } from "zod";
import { createResearchCase, listResearchCases } from "@/lib/db/research-cases";
import { checkRateLimitForRequest } from "@/lib/security/rate-limit";
import { readJsonRequest } from "@/lib/security/request-json";
import { serverDbEnabled } from "@/lib/security/server-db";

export const runtime = "nodejs";

const RequestSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(240).optional()
});

const researchCasesRateLimit = new Map<string, { count: number; windowStart: number }>();

export async function GET() {
  if (!serverDbEnabled()) return NextResponse.json({ cases: [] });
  return NextResponse.json({ cases: listResearchCases() });
}

export async function POST(request: Request) {
  if (!serverDbEnabled()) {
    return NextResponse.json({ error: "Server-side research cases are disabled on this deployment.", code: "SERVER_DB_DISABLED" }, { status: 403 });
  }
  const rateLimit = await checkRateLimitForRequest(request, researchCasesRateLimit, {
    max: 20,
    windowMs: 60_000,
    scope: "research-cases"
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many research case requests. Try again in ${rateLimit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": rateLimit.retryAfterSeconds.toString() } }
    );
  }
  const body = RequestSchema.safeParse(await readJsonRequest(request));
  if (!body.success) return NextResponse.json({ error: "Invalid research case." }, { status: 400 });
  return NextResponse.json(createResearchCase(body.data.name, body.data.description ?? ""));
}
