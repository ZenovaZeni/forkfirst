export type SavingsLog = {
  count: number; // number of handoffs generated
  totalHandoffTokens: number; // estimated tokens across exported handoffs
};

const STORAGE_KEY = "forkfirst:handoff-token-usage";

export function estimateHandoffTokens(handoffMarkdown: string): number {
  if (!handoffMarkdown.trim()) return 0;
  return Math.max(1, Math.ceil(handoffMarkdown.length / 4));
}

export function loadSavings(): SavingsLog {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { count: 0, totalHandoffTokens: 0 };
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { count: 0, totalHandoffTokens: 0 };
    }
    const parsed = JSON.parse(stored) as Partial<SavingsLog>;
    return {
      count: parsed.count ?? 0,
      totalHandoffTokens: parsed.totalHandoffTokens ?? 0
    };
  } catch {
    return { count: 0, totalHandoffTokens: 0 };
  }
}

export function logHandoffGenerated(markdown: string): SavingsLog {
  const tokens = estimateHandoffTokens(markdown);
  const current = loadSavings();
  const updated: SavingsLog = {
    count: current.count + 1,
    totalHandoffTokens: current.totalHandoffTokens + tokens
  };

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // Silently fail if storage is unavailable
  }

  return updated;
}

export function formatTokensShort(n: number): string {
  if (n === 0) return "0";
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1)}k`;
  }
  return n.toString();
}
