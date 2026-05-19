import { z } from "zod";
import type { ChatIntent, ResearchChatContext, ResearchChatPlan, ResearchChatPlanParseResult } from "./types";
import { cleanChatText, findRepoByPrompt, suggestedPromptsForIdea, topRepos } from "./tools";

const ChatIntentSchema = z.enum([
  "refine_search",
  "new_search",
  "compare_repos",
  "explain_repo",
  "opportunity_gap",
  "show_project_sites",
  "start_handoff",
  "save_repo",
  "answer_from_context",
  "ask_clarifying_question"
] satisfies [ChatIntent, ...ChatIntent[]]);

const ResearchChatPlanSchema = z.object({
  version: z.literal(2),
  intent: ChatIntentSchema,
  confidence: z.number().min(0).max(1).catch(0.5),
  needsSearch: z.boolean().default(false),
  needsConfirmation: z.boolean().default(false),
  searchPrompt: z.string().min(1).max(500).optional(),
  targetRepoFullName: z.string().min(1).max(220).optional(),
  targetRepoFullNames: z.array(z.string().min(1).max(220)).max(8).default([]),
  clarificationQuestion: z.string().min(1).max(280).optional(),
  replyStrategy: z.enum(["conversational", "structured"]).default("conversational"),
  suggestedPrompts: z.array(z.string().min(1).max(180)).max(6).default([]),
  rationale: z.string().max(500).optional()
});

const MORE_OPTIONS_RE = /\b(more options?|more repos?|alternatives?|search again|try again|find more|other options?|anything better)\b/;
const COMPARE_RE = /\b(compare|versus| vs\.? |which (one|repo|is)|why these|why those|why did.*show|why.*picked|better foundation|best foundation|side[-\s]?by[-\s]?side)\b/;
const EXPLAIN_RE = /\b(explain|plain english|what is this|what does|break it down|non[-\s]?technical|beginner)\b/;
const GAP_RE = /\b(opportunity gap|gap|white space|differentiator|differentiate|what's missing|what is missing)\b/;
const SITE_RE = /\b(project sites?|homepages?|demo links?|live links?|websites?|try it|see it|show.*site)\b/;
const HANDOFF_RE = /\b(handoff|build pack|builder handoff|prd|agent instructions|claude|codex|start.*build|send to (an )?ai builder)\b/;
const SAVE_RE = /\b(save|bookmark|pin|keep this|add to library|store this)\b/;
const CASUAL_SUGGEST_RE = /\b(any suggestions?|what else|recommend|suggest|could i add|should i add|features?|next move|next step|what do you think)\b/;
const NEW_SEARCH_RE = /\b(find|search|look for|discover|research)\b/;

function basePlan(intent: ChatIntent, context: ResearchChatContext, overrides: Partial<ResearchChatPlan> = {}): ResearchChatPlan {
  const targetRepo = overrides.targetRepoFullName ?? topRepos(context.repos, 1)[0]?.fullName;
  return {
    version: 2,
    intent,
    confidence: 0.65,
    needsSearch: false,
    needsConfirmation: false,
    targetRepoFullName: targetRepo,
    targetRepoFullNames: targetRepo ? [targetRepo] : [],
    replyStrategy: "conversational",
    suggestedPrompts: suggestedPromptsForIdea(context.idea),
    ...overrides
  };
}

function searchPrompt(context: ResearchChatContext, prefix: string) {
  const idea = cleanChatText(context.idea, 160) || cleanChatText(context.prompt, 160);
  return `${prefix}: ${idea}`.trim();
}

export function planResearchChat(context: ResearchChatContext): ResearchChatPlan {
  const prompt = cleanChatText(context.prompt, 500);
  const lower = prompt.toLowerCase();
  const repos = context.repos;
  const mentionedRepo = findRepoByPrompt(repos, prompt);
  const hasRepos = repos.length > 0;

  if (MORE_OPTIONS_RE.test(lower)) {
    return basePlan(hasRepos ? "refine_search" : "new_search", context, {
      confidence: 0.82,
      needsSearch: true,
      searchPrompt: searchPrompt(context, hasRepos ? "Find more GitHub repo options" : "Find GitHub repo options"),
      targetRepoFullNames: topRepos(repos).map((repo) => repo.fullName),
      rationale: "User asked for more or alternative repo options."
    });
  }

  if (SITE_RE.test(lower)) {
    return basePlan("show_project_sites", context, {
      confidence: 0.84,
      targetRepoFullNames: topRepos(repos, 5).map((repo) => repo.fullName),
      rationale: "User asked for live/demo/project links."
    });
  }

  if (HANDOFF_RE.test(lower)) {
    return basePlan("start_handoff", context, {
      confidence: 0.86,
      needsConfirmation: true,
      targetRepoFullName: mentionedRepo?.fullName ?? repos[0]?.fullName,
      targetRepoFullNames: [mentionedRepo?.fullName ?? repos[0]?.fullName].filter(Boolean) as string[],
      rationale: "Handoff generation should be confirmed before creating build instructions."
    });
  }

  if (SAVE_RE.test(lower)) {
    return basePlan("save_repo", context, {
      confidence: 0.78,
      targetRepoFullName: mentionedRepo?.fullName ?? repos[0]?.fullName,
      targetRepoFullNames: [mentionedRepo?.fullName ?? repos[0]?.fullName].filter(Boolean) as string[],
      rationale: "User wants to save or keep a repo."
    });
  }

  if (COMPARE_RE.test(lower)) {
    return basePlan("compare_repos", context, {
      confidence: 0.84,
      needsSearch: repos.length < 2,
      searchPrompt: repos.length < 2 ? searchPrompt(context, "Find comparable GitHub repos") : undefined,
      replyStrategy: "structured",
      targetRepoFullNames: topRepos(repos, 3).map((repo) => repo.fullName),
      rationale: "User asked for a comparison or selection."
    });
  }

  if (EXPLAIN_RE.test(lower)) {
    return basePlan("explain_repo", context, {
      confidence: 0.78,
      targetRepoFullName: mentionedRepo?.fullName ?? repos[0]?.fullName,
      targetRepoFullNames: [mentionedRepo?.fullName ?? repos[0]?.fullName].filter(Boolean) as string[],
      rationale: "User asked for a plain explanation."
    });
  }

  if (GAP_RE.test(lower)) {
    return basePlan("opportunity_gap", context, {
      confidence: 0.8,
      targetRepoFullNames: topRepos(repos, 3).map((repo) => repo.fullName),
      rationale: "User asked about differentiation or missing space."
    });
  }

  if (!hasRepos && NEW_SEARCH_RE.test(lower)) {
    return basePlan("new_search", context, {
      confidence: 0.74,
      needsSearch: true,
      searchPrompt: searchPrompt(context, "Find GitHub repo options"),
      targetRepoFullName: undefined,
      targetRepoFullNames: [],
      rationale: "User is asking for repo discovery without current repo context."
    });
  }

  if (!hasRepos) {
    return basePlan("ask_clarifying_question", context, {
      confidence: 0.62,
      clarificationQuestion: "What are you trying to build, and who is it for?",
      targetRepoFullName: undefined,
      targetRepoFullNames: [],
      suggestedPrompts: ["Find repos for my idea", "Help me narrow the audience", "What should I search for?"],
      rationale: "There is no repo context yet."
    });
  }

  return basePlan("answer_from_context", context, {
    confidence: CASUAL_SUGGEST_RE.test(lower) ? 0.78 : 0.58,
    targetRepoFullNames: topRepos(repos, 3).map((repo) => repo.fullName),
    rationale: CASUAL_SUGGEST_RE.test(lower)
      ? "User asked for casual repo-aware advice."
      : "Fallback to answering from the current repo context."
  });
}

function parseJsonLike(value: string | unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(trimmed);
}

export function parseResearchChatPlanJson(value: string | unknown): ResearchChatPlanParseResult {
  try {
    const parsed = ResearchChatPlanSchema.safeParse(parseJsonLike(value));
    if (!parsed.success) return { ok: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") };
    return { ok: true, plan: parsed.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid JSON plan" };
  }
}

export { ResearchChatPlanSchema };
