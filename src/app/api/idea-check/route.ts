import { NextResponse } from "next/server";
import { z } from "zod";
import { runIdeaCheck } from "@/lib/idea-check/run";
import { requireSafeBaseUrl } from "@/lib/keys/base-url-policy-server";
import { checkRateLimitForRequest } from "@/lib/security/rate-limit";
import { readJsonRequest } from "@/lib/security/request-json";
import { serverDbEnabled } from "@/lib/security/server-db";

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

  if (body.data.aiBaseUrl) {
    try {
      await requireSafeBaseUrl(body.data.aiBaseUrl, { allowUntrusted: body.data.aiBaseUrlAcknowledged === true });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message, code: "BASE_URL_BLOCKED" }, { status: 400 });
    }
  }

  const result = await runIdeaCheck({
    prompt: body.data.prompt,
    caseId: body.data.caseId,
    githubToken: body.data.githubToken,
    aiProvider: body.data.aiProvider,
    aiApiKey: body.data.aiApiKey,
    aiModel: body.data.aiModel,
    aiBaseUrl: body.data.aiBaseUrl,
    save: serverDbEnabled()
  });

  return NextResponse.json(result);
}
