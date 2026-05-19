import type { IdeaCheckResult } from "./idea-check";
import type { ClassifiedRepo } from "../lib/analysis/types";
import type { ChatIntent, ChatUiAction } from "../lib/research-chat/types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  result?: IdeaCheckResult;
  ui?: ChatUiAction[];
  intent?: ChatIntent;
};

export type ResearchChat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pinnedAt?: string | null;
  folderId?: string | null;
  messages: ChatMessage[];
  result: IdeaCheckResult | null;
  wizardAnswers?: Record<string, string>;
  workspace?: {
    screen?: "results" | "more" | "branding" | "ready";
    brand?: {
      name: string;
      audience: string;
      vibe: string;
      color: string;
      notList: string[];
    } | null;
    selectedStarterRepo?: ClassifiedRepo | null;
    followUps?: Array<{ role: "user" | "assistant"; content: string; ui?: ChatUiAction[]; result?: IdeaCheckResult; intent?: ChatIntent }>;
    prompt?: string;
  };
};

export type ResearchFolder = {
  id: string;
  name: string;
  createdAt: string;
  collapsed?: boolean;
};
