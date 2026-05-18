import type { ClassifiedRepo } from "@/lib/analysis/types";
import type { IdeaCheckResult } from "@/types/idea-check";
import type { PromptPackState } from "./storage";

export type PromptPackRecommendation = {
  id: string;
  reason: string;
};

export type PromptPackRecommendationInput = {
  idea?: string | null;
  result?: Pick<IdeaCheckResult, "prompt" | "verdict" | "summary" | "gaps" | "repos"> | null;
  repo?: ClassifiedRepo | null;
};

type RecommendationRule = {
  ids: string[];
  reason: string;
  patterns: RegExp[];
};

const BASE_RECOMMENDATIONS: PromptPackRecommendation[] = [
  { id: "repo-orientation", reason: "A starter repo is part of the handoff, so the builder should inspect it first." },
  { id: "existing-patterns", reason: "Keeps edits aligned to the selected repo conventions." },
  { id: "build-pack-from-repo", reason: "Turns the repo evidence into concrete PRD, plan, notes, and agent rules." },
  { id: "production-handoff", reason: "Leaves setup, risks, and continuation notes for the next builder." }
];

const RULES: RecommendationRule[] = [
  {
    ids: ["ai-agent-product", "context-budget"],
    reason: "AI, agent, prompt, or automation language matched.",
    patterns: [/\b(ai|llm|gpt|chatbot|agent|prompt|copilot|workflow automation|automate|tool calls?|memory)\b/i]
  },
  {
    ids: ["byok-secrets", "security-boundary", "privacy-first-patterns"],
    reason: "API key, token, credential, or provider setup language matched.",
    patterns: [/\b(byok|api key|token|secret|credential|oauth|webhook|openai|anthropic|github app|provider key)\b/i]
  },
  {
    ids: ["security-boundary"],
    reason: "Auth, payment, file, admin, or destructive-action language matched.",
    patterns: [/\b(auth|login|sign in|permission|role|admin|payment|billing|stripe|subscription|upload|delete|destructive)\b/i]
  },
  {
    ids: ["saas-app-starter", "security-boundary"],
    reason: "SaaS, team, subscription, or B2B product language matched.",
    patterns: [/\b(saas|b2b|tenant|team|workspace|subscription|seat|billing|customer portal)\b/i]
  },
  {
    ids: ["dashboard-analytics"],
    reason: "Dashboard, CRM, tracker, table, or analytics language matched.",
    patterns: [/\b(dashboard|analytics|admin|crm|tracker|kanban|table|metrics|reporting|operations|monitor)\b/i]
  },
  {
    ids: ["local-first-apps", "privacy-first-patterns"],
    reason: "Local, offline, private, personal, or notes language matched.",
    patterns: [/\b(local-first|offline|private|privacy|personal|notes?|journal|habit|backup|import|export)\b/i]
  },
  {
    ids: ["frontend-design-fidelity", "design-system-handoff"],
    reason: "UI, design, brand, landing, or component language matched.",
    patterns: [/\b(ui|ux|frontend|front-end|design|brand|landing page|component|tailwind|responsive|polish)\b/i]
  },
  {
    ids: ["mobile-first-polish"],
    reason: "Mobile, PWA, iOS, Android, or touch interface language matched.",
    patterns: [/\b(mobile|pwa|ios|android|responsive|touch|phone|tablet)\b/i]
  }
];

function repoText(repo: ClassifiedRepo | null | undefined): string {
  if (!repo) return "";
  return [
    repo.fullName,
    repo.description,
    repo.language ?? "",
    repo.summary,
    repo.topics.join(" "),
    repo.score.reasons.join(" "),
    repo.readme?.excerpt ?? "",
    repo.readme?.reasons.join(" ") ?? ""
  ].join(" ");
}

function addRecommendation(
  recommendations: PromptPackRecommendation[],
  seen: Set<string>,
  recommendation: PromptPackRecommendation
) {
  if (seen.has(recommendation.id)) return;
  seen.add(recommendation.id);
  recommendations.push(recommendation);
}

export function recommendPromptPacks(input: PromptPackRecommendationInput): PromptPackRecommendation[] {
  const selectedRepo = input.repo ?? input.result?.repos[0] ?? null;
  const text = [
    input.idea ?? "",
    input.result?.prompt ?? "",
    input.result?.summary ?? "",
    input.result?.verdict ?? "",
    input.result?.gaps.join(" ") ?? "",
    repoText(selectedRepo)
  ].join(" ");
  const recommendations: PromptPackRecommendation[] = [];
  const seen = new Set<string>();

  for (const recommendation of BASE_RECOMMENDATIONS) {
    addRecommendation(recommendations, seen, recommendation);
  }

  if (selectedRepo?.category === "reference" || selectedRepo?.category === "gap") {
    addRecommendation(recommendations, seen, {
      id: "context-budget",
      reason: "The selected repo is more reference than direct fork, so keep handoff context focused."
    });
  }
  if (selectedRepo?.category === "risk") {
    addRecommendation(recommendations, seen, {
      id: "security-boundary",
      reason: "The selected repo is risky enough to warrant explicit guardrails."
    });
    addRecommendation(recommendations, seen, {
      id: "no-silent-success",
      reason: "Risky or uncertain repos should not produce fake green handoff states."
    });
  }
  if (selectedRepo?.category === "already_exists") {
    addRecommendation(recommendations, seen, {
      id: "anti-overbuild",
      reason: "A close existing product was found, so avoid building an inflated duplicate."
    });
  }

  for (const rule of RULES) {
    if (!rule.patterns.some((pattern) => pattern.test(text))) continue;
    for (const id of rule.ids) {
      addRecommendation(recommendations, seen, { id, reason: rule.reason });
    }
  }

  return recommendations;
}

export function applyPromptPackRecommendations(
  state: PromptPackState,
  recommendations: PromptPackRecommendation[]
): PromptPackState {
  const enabled = new Set(state.enabledIds);
  for (const recommendation of recommendations) {
    enabled.add(recommendation.id);
  }
  return {
    ...state,
    enabledIds: Array.from(enabled)
  };
}
