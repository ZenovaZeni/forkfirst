const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
export const GROQ_OPENAI_BASE_URL = "https://api.groq.com/openai/v1";
export const OPENAI_BASE_URL = "https://api.openai.com/v1";

export type ServerAiConfig = {
  provider: "groq" | "openai";
  apiKey: string;
  model: string;
  baseUrl?: string;
};

export function serverKeyFallbacksEnabled(): boolean {
  return TRUE_VALUES.has((process.env.FORKFIRST_ALLOW_SERVER_KEYS ?? process.env.OPEN_REPO_ALLOW_SERVER_KEYS ?? "").toLowerCase());
}

export function optionalServerKey(name: "OPENAI_API_KEY" | "GROQ_API_KEY" | "GITHUB_TOKEN"): string | undefined {
  if (!serverKeyFallbacksEnabled()) return undefined;
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function optionalServerModel(): string | undefined {
  if (!serverKeyFallbacksEnabled()) return undefined;
  return process.env.OPENAI_MODEL?.trim() || undefined;
}

export function optionalServerAiConfig(): ServerAiConfig | undefined {
  if (!serverKeyFallbacksEnabled()) return undefined;

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    return {
      provider: "groq",
      apiKey: groqKey,
      model: process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL,
      baseUrl: GROQ_OPENAI_BASE_URL
    };
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    return {
      provider: "openai",
      apiKey: openAiKey,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4.1-nano"
    };
  }

  return undefined;
}
