import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSafeBaseUrl } from "@/lib/keys/base-url-policy";
import { providerBaseUrl } from "@/lib/security/provider-base-url";
import { checkRateLimitForRequest } from "@/lib/security/rate-limit";
import { readJsonRequest } from "@/lib/security/request-json";
import { DEFAULT_GROQ_MODEL, optionalServerAiConfig } from "@/lib/security/server-keys";

export const runtime = "nodejs";

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const RequestSchema = z.object({
  idea: z.string().min(4).max(1200),
  aiProvider: z.enum(["openai", "groq", "deepseek", "custom"]).optional(),
  aiApiKey: z.string().max(300).optional(),
  aiModel: z.string().max(120).optional(),
  aiBaseUrl: z.string().max(240).optional(),
  aiBaseUrlAcknowledged: z.boolean().default(false)
});

const QuestionKindSchema = z.enum(["select", "text", "color"]);

const QuestionSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(4).max(200),
  placeholder: z.string().max(160).optional(),
  suggestions: z.array(z.string().max(80)).max(6).optional(),
  kind: QuestionKindSchema.default("select")
});

const ResponseSchema = z.object({
  questions: z.array(QuestionSchema).min(1).max(6)
});

export type WizardQuestion = z.infer<typeof QuestionSchema>;

// ---------------------------------------------------------------------------
// Fallback questions when LLM fails
// ---------------------------------------------------------------------------
const FALLBACK_QUESTIONS: WizardQuestion[] = [
  {
    id: "backend",
    label: "Will this need a backend, or stay local-first?",
    placeholder: "e.g. local-first, Vercel functions, Supabase",
    suggestions: ["Local-first", "Vercel functions", "Supabase", "Firebase", "Skip"],
    kind: "select"
  },
  {
    id: "auth",
    label: "Do users need accounts or auth?",
    placeholder: "e.g. no auth, magic link, Google OAuth",
    suggestions: ["No auth", "Magic link", "Google OAuth", "Optional", "Skip"],
    kind: "select"
  },
  {
    id: "brand",
    label: "Pick a brand color (hex) for the UI.",
    placeholder: "#2563eb",
    kind: "color"
  },
  {
    id: "users",
    label: "Who is the primary user?",
    placeholder: "e.g. indie hackers, small teams, realtors",
    suggestions: ["Indie hackers", "Small teams", "Solo founders", "Developers", "Skip"],
    kind: "select"
  }
];

const SYSTEM_PROMPT = `You are a senior product engineer helping a builder scope a project before they fork a GitHub repo. The user has shared a one-line idea. Generate 3-4 highly relevant follow-up questions that will help tailor the build plan.

RULES:
- Skip obvious questions. If the idea says "mobile app", don't ask "is this web or mobile".
- Ask about: backend yes/no, auth, target user, brand vibe / colors, deploy target, niche-specific feature questions.
- Each question has a label (one short sentence), an optional placeholder, an optional list of suggested answers (3-5 items ending with "Skip"), and a kind.
- Use plain English. No jargon unless the idea is technical.
- Return JSON only. No prose, no markdown fences.

OUTPUT SCHEMA:
{
  "questions": [
    {
      "id": "backend" | "auth" | "brand" | "deploy" | "users" | "custom-N",
      "label": "Will this need a backend, or stay local-first?",
      "placeholder": "e.g. local-first, Vercel functions, Supabase",
      "suggestions": ["Local-first", "Vercel functions", "Supabase", "Skip"],
      "kind": "select" | "text" | "color"
    }
  ]
}`;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const rateLimitResult = await checkRateLimitForRequest(request, rateLimitMap, {
    max: 5,
    windowMs: 60_000,
    scope: "refine-idea"
  });
  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.retryAfterSeconds ?? 60;
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": retryAfter.toString() } }
    );
  }

  const body = RequestSchema.safeParse(await readJsonRequest(request));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.data.aiProvider === "custom") {
    try {
      requireSafeBaseUrl(body.data.aiBaseUrl, { allowUntrusted: body.data.aiBaseUrlAcknowledged === true });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message, code: "BASE_URL_BLOCKED" }, { status: 400 });
    }
  }

  const serverAi = body.data.aiApiKey ? undefined : optionalServerAiConfig();
  const usingServerAi = !body.data.aiApiKey && Boolean(serverAi);
  const provider = usingServerAi ? serverAi!.provider : body.data.aiProvider ?? "groq";
  const apiKey = body.data.aiApiKey?.trim() || serverAi?.apiKey;
  const model = usingServerAi ? serverAi!.model : body.data.aiModel?.trim() || DEFAULT_GROQ_MODEL;
  const baseUrl = body.data.aiBaseUrl?.trim() || serverAi?.baseUrl || providerBaseUrl(provider, body.data.aiBaseUrl?.trim());

  if (!apiKey || !baseUrl) {
    return NextResponse.json({ questions: FALLBACK_QUESTIONS });
  }

  try {
    const isOpenAI = provider === "openai";
    const payload: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: body.data.idea }
      ],
      max_tokens: 800,
      temperature: 0.4
    };
    if (isOpenAI) {
      payload.response_format = { type: "json_object" };
    }

    const llmResponse = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12_000)
    });

    if (!llmResponse.ok) {
      return NextResponse.json({ questions: FALLBACK_QUESTIONS });
    }

    const llmData = (await llmResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = llmData.choices?.[0]?.message?.content ?? "";

    // Extract JSON even when wrapped in markdown fences
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ questions: FALLBACK_QUESTIONS });

    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    const validated = ResponseSchema.safeParse(parsed);
    if (!validated.success) return NextResponse.json({ questions: FALLBACK_QUESTIONS });

    return NextResponse.json({ questions: validated.data.questions });
  } catch {
    return NextResponse.json({ questions: FALLBACK_QUESTIONS });
  }
}
