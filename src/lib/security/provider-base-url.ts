import { GROQ_OPENAI_BASE_URL, OPENAI_BASE_URL } from "./server-keys";

export function providerBaseUrl(provider?: string, baseUrl?: string): string {
  if (provider === "openai") return OPENAI_BASE_URL;
  if (provider === "groq") return GROQ_OPENAI_BASE_URL;
  if (provider === "deepseek") return "https://api.deepseek.com";
  if (provider === "custom") return baseUrl || "";
  return OPENAI_BASE_URL;
}
