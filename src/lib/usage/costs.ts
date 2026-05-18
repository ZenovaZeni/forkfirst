export type UsageProvider = "openai" | "groq" | "deepseek" | "custom";

export type UsageAction = "idea-check" | "chat" | "verify-keys" | "trending";

export type UsageEntry = {
  id: string;
  createdAt: string;
  provider: UsageProvider;
  model: string;
  action: UsageAction;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  rateLabel: string;
  estimated: true;
};

export type UsageSummary = {
  entries: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
};

type Rate = {
  inputPerMillion: number;
  outputPerMillion: number;
  label: string;
};

const DEFAULT_RATES: Record<UsageProvider, Rate> = {
  openai: {
    inputPerMillion: 0.1,
    outputPerMillion: 0.4,
    label: "OpenAI GPT-4.1 nano preset"
  },
  groq: {
    inputPerMillion: 0.05,
    outputPerMillion: 0.08,
    label: "Groq Llama 3.1 8B Instant preset"
  },
  deepseek: {
    inputPerMillion: 0.14,
    outputPerMillion: 0.28,
    label: "DeepSeek V4 Flash cache-miss preset"
  },
  custom: {
    inputPerMillion: 0,
    outputPerMillion: 0,
    label: "Custom provider rate not configured"
  }
};

export function estimateTokens(text: string): number {
  if (!text.trim()) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function getUsageRate(provider: UsageProvider, model: string): Rate {
  const normalized = model.toLowerCase();

  if (provider === "openai") {
    if (normalized.includes("4.1-nano") || normalized.includes("gpt-4.1-nano")) return DEFAULT_RATES.openai;
    if (normalized.includes("4o-mini")) {
      return { inputPerMillion: 0.15, outputPerMillion: 0.6, label: "OpenAI GPT-4o mini preset" };
    }
  }

  if (provider === "groq") {
    if (normalized.includes("llama-3.1-8b") || normalized.includes("8b-instant")) return DEFAULT_RATES.groq;
    if (normalized.includes("llama-3.3-70b")) {
      return { inputPerMillion: 0.59, outputPerMillion: 0.79, label: "Groq Llama 3.3 70B preset" };
    }
  }

  if (provider === "deepseek") {
    if (normalized.includes("deepseek-chat")) {
      return { inputPerMillion: 0.27, outputPerMillion: 1.1, label: "DeepSeek chat legacy preset" };
    }
    return DEFAULT_RATES.deepseek;
  }

  return DEFAULT_RATES[provider];
}

export function estimateUsageCostUsd(inputTokens: number, outputTokens: number, provider: UsageProvider, model: string): number {
  const rate = getUsageRate(provider, model);
  return (inputTokens / 1_000_000) * rate.inputPerMillion + (outputTokens / 1_000_000) * rate.outputPerMillion;
}

export function createUsageEntry({
  provider,
  model,
  action,
  inputText,
  outputText
}: {
  provider: UsageProvider;
  model: string;
  action: UsageAction;
  inputText: string;
  outputText: string;
}): UsageEntry {
  const inputTokens = estimateTokens(inputText);
  const outputTokens = estimateTokens(outputText);
  const rate = getUsageRate(provider, model);

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    provider,
    model,
    action,
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateUsageCostUsd(inputTokens, outputTokens, provider, model),
    rateLabel: rate.label,
    estimated: true
  };
}

export function summarizeUsage(entries: UsageEntry[]): UsageSummary {
  return entries.reduce(
    (summary, entry) => ({
      entries: summary.entries + 1,
      inputTokens: summary.inputTokens + entry.inputTokens,
      outputTokens: summary.outputTokens + entry.outputTokens,
      estimatedCostUsd: summary.estimatedCostUsd + entry.estimatedCostUsd
    }),
    { entries: 0, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 }
  );
}

export function formatEstimatedCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.01) return `<$0.01`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(cost);
}
