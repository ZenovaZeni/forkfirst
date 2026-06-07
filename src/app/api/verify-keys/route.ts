import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSafeBaseUrl } from "@/lib/keys/base-url-policy-server";
import { providerBaseUrl } from "@/lib/security/provider-base-url";
import { checkRateLimitForRequest } from "@/lib/security/rate-limit";
import { readJsonRequest } from "@/lib/security/request-json";

export const runtime = "nodejs";

const RequestSchema = z.object({
  githubToken: z.string().max(300).optional(),
  aiProvider: z.enum(["openai", "groq", "deepseek", "custom"]).optional(),
  aiApiKey: z.string().max(300).optional(),
  aiModel: z.string().max(120).optional(),
  aiBaseUrl: z.string().max(240).optional(),
  aiBaseUrlAcknowledged: z.boolean().default(false)
});

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

async function verifyGithub(token?: string): Promise<boolean | null> {
  if (!token?.trim()) return null;
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${token.trim()}`
    },
    cache: "no-store"
  });
  return response.ok;
}

async function verifyAi(provider?: string, apiKey?: string, model?: string, baseUrl?: string): Promise<boolean | null> {
  if (!apiKey?.trim()) return null;
  const url = providerBaseUrl(provider, baseUrl);
  if (!url) return false;

  const response = await fetch(`${url.replace(/\/$/, "")}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      ...(provider === "openai" ? { "OpenAI-Beta": "assistants=v2" } : {})
    },
    cache: "no-store"
  });

  if (!response.ok) return false;
  if (!model?.trim()) return true;

  try {
    const data = (await response.json()) as { data?: Array<{ id?: string }> };
    if (!Array.isArray(data.data)) return true;
    return data.data.some((item) => item.id === model.trim()) || data.data.length > 0;
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  const rateLimitResult = await checkRateLimitForRequest(request, rateLimitMap, {
    max: 5,
    windowMs: 60_000,
    scope: "verify-keys"
  });

  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.retryAfterSeconds ?? 60;
    return NextResponse.json(
      { error: `Too many verification attempts. Try again in ${retryAfter} seconds.` },
      {
        status: 429,
        headers: { "Retry-After": retryAfter.toString() }
      }
    );
  }

  const body = RequestSchema.safeParse(await readJsonRequest(request));
  if (!body.success) return NextResponse.json({ error: "Invalid key verification request." }, { status: 400 });

  if (body.data.aiProvider === "custom") {
    try {
      await requireSafeBaseUrl(body.data.aiBaseUrl, { allowUntrusted: body.data.aiBaseUrlAcknowledged === true });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message, code: "BASE_URL_BLOCKED" }, { status: 400 });
    }
  }

  const [github, ai] = await Promise.allSettled([
    verifyGithub(body.data.githubToken),
    verifyAi(body.data.aiProvider, body.data.aiApiKey, body.data.aiModel, body.data.aiBaseUrl)
  ]);

  return NextResponse.json({
    github: github.status === "fulfilled" ? github.value : false,
    ai: ai.status === "fulfilled" ? ai.value : false,
    checkedAt: new Date().toISOString()
  });
}
