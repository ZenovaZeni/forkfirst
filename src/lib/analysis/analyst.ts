import { analyzeWithDemo } from "./demo-analyst";
import { analyzeWithOpenAI } from "./openai-analyst";
import { optionalServerAiConfig } from "@/lib/security/server-keys";
import type { AnalysisResult, ClassifiedRepo } from "./types";

type AnalyzeIdeaOptions = {
  provider?: "openai" | "groq" | "deepseek" | "custom";
  apiKey?: string;
  model?: string;
  baseUrl?: string;
};

export async function analyzeIdea(
  prompt: string,
  repos: ClassifiedRepo[],
  options: AnalyzeIdeaOptions = {}
): Promise<AnalysisResult> {
  const serverAi = options.apiKey ? undefined : optionalServerAiConfig();
  const apiKey = options.apiKey || serverAi?.apiKey;
  if (apiKey) {
    return analyzeWithOpenAI(prompt, repos, {
      apiKey,
      provider: options.apiKey ? options.provider ?? "groq" : serverAi?.provider ?? options.provider ?? "groq",
      model: options.apiKey ? options.model : serverAi?.model || options.model,
      baseUrl: options.apiKey ? options.baseUrl : serverAi?.baseUrl || options.baseUrl
    });
  }

  return analyzeWithDemo(prompt, repos);
}
