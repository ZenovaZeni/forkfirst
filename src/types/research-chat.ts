import type { IdeaCheckResult } from "./idea-check";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  result?: IdeaCheckResult;
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
};

export type ResearchFolder = {
  id: string;
  name: string;
  createdAt: string;
  collapsed?: boolean;
};
