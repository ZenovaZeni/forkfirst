import { analyzeWithDemo } from "./demo-analyst";
import { analyzeWithOpenAI } from "./openai-analyst";
import { optionalServerKey, optionalServerModel } from "@/lib/security/server-keys";
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
  const apiKey = options.apiKey || optionalServerKey("OPENAI_API_KEY");
  if (apiKey) {
    return analyzeWithOpenAI(prompt, repos, {
      apiKey,
      provider: options.provider ?? "openai",
      model: options.model || optionalServerModel(),
      baseUrl: options.baseUrl
    });
  }

  return analyzeWithDemo(prompt, repos);
}
