import type { ClassifiedRepo } from "@/lib/analysis/types";

export type ChatIntent =
  | "refine_search"
  | "new_search"
  | "compare_repos"
  | "explain_repo"
  | "opportunity_gap"
  | "show_project_sites"
  | "start_handoff"
  | "save_repo"
  | "answer_from_context"
  | "ask_clarifying_question";

export type ChatUiAction =
  | {
      type: "repo_cards";
      repoFullNames: string[];
      title?: string;
    }
  | {
      type: "project_links";
      links: Array<{
        repoFullName: string;
        url: string;
        label: string;
      }>;
    }
  | {
      type: "compare_table";
      rows: Array<{
        repoFullName: string;
        score: number;
        category: ClassifiedRepo["category"];
        language: string | null;
        license: string | null;
        projectSite: string | null;
        bestFor: string;
        watchOut: string;
      }>;
    }
  | {
      type: "suggested_prompts";
      prompts: string[];
    }
  | {
      type: "search_query";
      query: string;
      label: string;
    }
  | {
      type: "handoff_confirmation";
      repoFullName: string | null;
      message: string;
    }
  | {
      type: "save_repo";
      repoFullName: string;
    };

export type ResearchChatPlan = {
  version: 2;
  intent: ChatIntent;
  confidence: number;
  needsSearch: boolean;
  needsConfirmation: boolean;
  searchPrompt?: string;
  targetRepoFullName?: string;
  targetRepoFullNames: string[];
  clarificationQuestion?: string;
  replyStrategy?: "conversational" | "structured";
  suggestedPrompts: string[];
  rationale?: string;
};

export type ResearchChatPlanParseResult =
  | {
      ok: true;
      plan: ResearchChatPlan;
    }
  | {
      ok: false;
      error: string;
    };

export type ResearchChatContext = {
  prompt: string;
  idea?: string | null;
  repos: ClassifiedRepo[];
  mode?: "demo" | "ai";
  completedSearch?: boolean;
};

export type ResearchChatResponseV2 = {
  version: 2;
  mode: "demo" | "ai";
  intent: ChatIntent;
  reply: string;
  actions: ChatUiAction[];
  plan: ResearchChatPlan;
  needsConfirmation: boolean;
};
