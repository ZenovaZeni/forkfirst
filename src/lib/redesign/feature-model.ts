import type { ClassifiedRepo } from "@/lib/analysis/types";
import type { PromptPackState } from "@/lib/prompt-packs/storage";
import type { SavingsLog } from "@/lib/usage/savings";
import type { UsageEntry, UsageProvider } from "@/lib/usage/costs";
import type { IdeaCheckResult } from "@/types/idea-check";
import type { ChatIntent, ChatUiAction } from "@/lib/research-chat/types";
import type { ResearchChat, ResearchFolder } from "@/types/research-chat";

export type JsonStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type RedesignUserKeys = {
  githubToken: string;
  aiProvider: UsageProvider;
  aiApiKey: string;
  aiModel: string;
  aiBaseUrl: string;
  aiBaseUrlAcknowledged?: boolean;
};

export type RedesignAccent = "cobalt" | "ember" | "forest" | "violet";

export type IdeaCheckRequestBody = {
  prompt: string;
  caseId?: string;
  githubToken?: string;
  aiProvider?: UsageProvider;
  aiApiKey?: string;
  aiModel?: string;
  aiBaseUrl?: string;
  aiBaseUrlAcknowledged?: boolean;
};

export type ResearchChatRequestBody = {
  prompt: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  result?: IdeaCheckResult | null;
  context?: {
    screen?: string;
    selectedStarterRepoFullName?: string;
    savedRepoNames?: string[];
  };
  allowTools?: {
    search?: boolean;
    saveRepo?: boolean;
    handoff?: boolean;
  };
  githubToken?: string;
  aiProvider?: UsageProvider;
  aiApiKey?: string;
  aiModel?: string;
  aiBaseUrl?: string;
  aiBaseUrlAcknowledged?: boolean;
};

export type SavedRepoRequestBody = {
  caseId: string;
  repo: ClassifiedRepo;
  note?: string;
};

export type KeyVerificationRequestBody = Omit<IdeaCheckRequestBody, "prompt" | "caseId">;

export type SavedBuildPackVersion = {
  id: string;
  label: string;
  markdown: string;
  tokenEstimate: number;
  qualityScore: number;
  createdAt: string;
};

export type SavedBuildPackWorkspaceSnapshot = {
  result: IdeaCheckResult | null;
  brand: {
    name: string;
    audience: string;
    productGoal: string;
    firstMilestone: string;
    keepFromRepo: string;
    replaceFromRepo: string;
    addToRepo: string;
    designNotes: string;
    vibe: string;
    color: string;
    notList: string[];
  } | null;
  selectedStarterRepo: ClassifiedRepo | null;
  followUps: Array<{ role: "user" | "assistant"; content: string; ui?: ChatUiAction[]; result?: IdeaCheckResult; intent?: ChatIntent }>;
  promptPackState: PromptPackState;
  prompt: string;
  activeChatId?: string | null;
};

export type SavedBuildPack = {
  id: string;
  title: string;
  idea: string;
  starterRepo: string;
  target: string;
  markdown: string;
  tokenEstimate: number;
  qualityScore: number;
  status: "draft" | "exported";
  schemaVersion?: number;
  createdAt: string;
  updatedAt: string;
  workspace?: SavedBuildPackWorkspaceSnapshot;
  versions?: SavedBuildPackVersion[];
};

export type RedesignFeatureStorage = {
  keys: RedesignUserKeys;
  rememberKeys: boolean;
  chats: ResearchChat[];
  folders: ResearchFolder[];
  savedRepos: ClassifiedRepo[];
  savedRepoBoards: Record<string, string>;
  savedBuildPacks: SavedBuildPack[];
  usageEntries: UsageEntry[];
  promptPackState: PromptPackState;
  savingsLog: SavingsLog;
  accent: RedesignAccent;
};

export const REDESIGN_STORAGE_KEYS = {
  keys: "forkfirst:keys",
  rememberKeys: "forkfirst:remember-keys",
  chats: "forkfirst:chats",
  folders: "forkfirst:folders",
  savedRepos: "forkfirst:saved-repos",
  savedRepoBoards: "forkfirst:saved-repo-boards",
  savedBuildPacks: "forkfirst:saved-build-packs",
  usageEntries: "forkfirst:usage",
  promptPackState: "forkfirst:prompt-packs",
  savingsLog: "forkfirst:handoff-token-usage",
  accent: "forkfirst:accent"
} as const;

export const LEGACY_REDESIGN_STORAGE_KEYS: Record<keyof typeof REDESIGN_STORAGE_KEYS, string> = {
  keys: "open-repo:keys",
  rememberKeys: "open-repo:remember-keys",
  chats: "open-repo:chats",
  folders: "open-repo:folders",
  savedRepos: "open-repo:saved-repos",
  savedRepoBoards: "open-repo:saved-repo-boards",
  savedBuildPacks: "open-repo:saved-build-packs",
  usageEntries: "open-repo:usage",
  promptPackState: "open-repo:prompt-packs",
  savingsLog: "open-repo:handoff-token-usage",
  accent: "open-repo:accent"
};

export const DEFAULT_REDESIGN_USER_KEYS: RedesignUserKeys = {
  githubToken: "",
  aiProvider: "groq",
  aiApiKey: "",
  aiModel: "llama-3.1-8b-instant",
  aiBaseUrl: "https://api.groq.com/openai/v1",
  aiBaseUrlAcknowledged: false
};

export const DEFAULT_PROMPT_PACK_STATE: PromptPackState = {
  enabledIds: ["karpathy-mvp", "indie-hacker-mvp", "ai-edit-over-generate"],
  customPacks: []
};

export const DEFAULT_SAVINGS_LOG: SavingsLog = {
  count: 0,
  totalHandoffTokens: 0
};

export const MAX_RECENT_CHATS = 100;

export const DEFAULT_REDESIGN_FEATURE_STORAGE: RedesignFeatureStorage = {
  keys: DEFAULT_REDESIGN_USER_KEYS,
  rememberKeys: false,
  chats: [],
  folders: [],
  savedRepos: [],
  savedRepoBoards: {},
  savedBuildPacks: [],
  usageEntries: [],
  promptPackState: DEFAULT_PROMPT_PACK_STATE,
  savingsLog: DEFAULT_SAVINGS_LOG,
  accent: "cobalt"
};

export function orderRecentChats(chats: ResearchChat[], limit = MAX_RECENT_CHATS): ResearchChat[] {
  return [...chats]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

export function readJsonValue<T>(storage: JsonStorage | null | undefined, key: string, fallback: T): T {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readJsonValueWithFallback<T>(storage: JsonStorage | null | undefined, key: string, legacyKey: string | undefined, fallback: T): T {
  if (!storage) return fallback;
  if (storage.getItem(key) !== null) return readJsonValue(storage, key, fallback);
  return legacyKey ? readJsonValue(storage, legacyKey, fallback) : fallback;
}

export function writeJsonValue<T>(storage: JsonStorage | null | undefined, key: string, value: T): void {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

export function removeJsonValue(storage: JsonStorage | null | undefined, key: string): void {
  if (!storage) return;
  storage.removeItem(key);
}

export function readFeatureStorage(storage: JsonStorage | null | undefined): RedesignFeatureStorage {
  return {
    keys: normalizeUserKeys(readJsonValueWithFallback(storage, REDESIGN_STORAGE_KEYS.keys, LEGACY_REDESIGN_STORAGE_KEYS.keys, DEFAULT_REDESIGN_USER_KEYS)),
    rememberKeys: readJsonValueWithFallback(storage, REDESIGN_STORAGE_KEYS.rememberKeys, LEGACY_REDESIGN_STORAGE_KEYS.rememberKeys, DEFAULT_REDESIGN_FEATURE_STORAGE.rememberKeys),
    chats: orderRecentChats(readJsonValueWithFallback(storage, REDESIGN_STORAGE_KEYS.chats, LEGACY_REDESIGN_STORAGE_KEYS.chats, [])),
    folders: readJsonValueWithFallback(storage, REDESIGN_STORAGE_KEYS.folders, LEGACY_REDESIGN_STORAGE_KEYS.folders, []),
    savedRepos: readJsonValueWithFallback(storage, REDESIGN_STORAGE_KEYS.savedRepos, LEGACY_REDESIGN_STORAGE_KEYS.savedRepos, []),
    savedRepoBoards: readJsonValueWithFallback(storage, REDESIGN_STORAGE_KEYS.savedRepoBoards, LEGACY_REDESIGN_STORAGE_KEYS.savedRepoBoards, {}),
    savedBuildPacks: normalizeSavedBuildPacks(readJsonValueWithFallback(storage, REDESIGN_STORAGE_KEYS.savedBuildPacks, LEGACY_REDESIGN_STORAGE_KEYS.savedBuildPacks, [])),
    usageEntries: readJsonValueWithFallback(storage, REDESIGN_STORAGE_KEYS.usageEntries, LEGACY_REDESIGN_STORAGE_KEYS.usageEntries, []),
    promptPackState: normalizePromptPackState(readJsonValueWithFallback(storage, REDESIGN_STORAGE_KEYS.promptPackState, LEGACY_REDESIGN_STORAGE_KEYS.promptPackState, DEFAULT_PROMPT_PACK_STATE)),
    savingsLog: normalizeSavingsLog(readJsonValueWithFallback(storage, REDESIGN_STORAGE_KEYS.savingsLog, LEGACY_REDESIGN_STORAGE_KEYS.savingsLog, DEFAULT_SAVINGS_LOG)),
    accent: normalizeAccent(readJsonValueWithFallback(storage, REDESIGN_STORAGE_KEYS.accent, LEGACY_REDESIGN_STORAGE_KEYS.accent, DEFAULT_REDESIGN_FEATURE_STORAGE.accent))
  };
}

export function writeFeatureStorage(storage: JsonStorage | null | undefined, patch: Partial<RedesignFeatureStorage>): void {
  if (patch.keys !== undefined) writeJsonValue(storage, REDESIGN_STORAGE_KEYS.keys, patch.keys);
  if (patch.rememberKeys !== undefined) writeJsonValue(storage, REDESIGN_STORAGE_KEYS.rememberKeys, patch.rememberKeys);
  if (patch.chats !== undefined) writeJsonValue(storage, REDESIGN_STORAGE_KEYS.chats, patch.chats);
  if (patch.folders !== undefined) writeJsonValue(storage, REDESIGN_STORAGE_KEYS.folders, patch.folders);
  if (patch.savedRepos !== undefined) writeJsonValue(storage, REDESIGN_STORAGE_KEYS.savedRepos, patch.savedRepos);
  if (patch.savedRepoBoards !== undefined) writeJsonValue(storage, REDESIGN_STORAGE_KEYS.savedRepoBoards, patch.savedRepoBoards);
  if (patch.savedBuildPacks !== undefined) writeJsonValue(storage, REDESIGN_STORAGE_KEYS.savedBuildPacks, patch.savedBuildPacks);
  if (patch.usageEntries !== undefined) writeJsonValue(storage, REDESIGN_STORAGE_KEYS.usageEntries, patch.usageEntries);
  if (patch.promptPackState !== undefined) writeJsonValue(storage, REDESIGN_STORAGE_KEYS.promptPackState, patch.promptPackState);
  if (patch.savingsLog !== undefined) writeJsonValue(storage, REDESIGN_STORAGE_KEYS.savingsLog, patch.savingsLog);
  if (patch.accent !== undefined) writeJsonValue(storage, REDESIGN_STORAGE_KEYS.accent, patch.accent);
}

export function clearFeatureStorage(storage: JsonStorage | null | undefined): void {
  Object.values(REDESIGN_STORAGE_KEYS).forEach((key) => removeJsonValue(storage, key));
  Object.values(LEGACY_REDESIGN_STORAGE_KEYS).forEach((key) => removeJsonValue(storage, key));
}

export function buildIdeaCheckRequestBody(prompt: string, keys: RedesignUserKeys, caseId?: string): IdeaCheckRequestBody {
  return compactUndefined({
    prompt: prompt.trim(),
    caseId: emptyToUndefined(caseId),
    githubToken: emptyToUndefined(keys.githubToken),
    aiProvider: keys.aiProvider,
    aiApiKey: emptyToUndefined(keys.aiApiKey),
    aiModel: emptyToUndefined(keys.aiModel),
    aiBaseUrl: emptyToUndefined(keys.aiBaseUrl),
    aiBaseUrlAcknowledged: keys.aiBaseUrlAcknowledged === true
  });
}

export function buildResearchChatRequestBody({
  prompt,
  messages,
  result,
  keys,
  context,
  allowTools
}: {
  prompt: string;
  messages?: ResearchChatRequestBody["messages"];
  result?: IdeaCheckResult | null;
  keys: RedesignUserKeys;
  context?: ResearchChatRequestBody["context"];
  allowTools?: ResearchChatRequestBody["allowTools"];
}): ResearchChatRequestBody {
  return compactUndefined({
    prompt: prompt.trim(),
    messages,
    result,
    context,
    allowTools,
    githubToken: emptyToUndefined(keys.githubToken),
    aiProvider: keys.aiProvider,
    aiApiKey: emptyToUndefined(keys.aiApiKey),
    aiModel: emptyToUndefined(keys.aiModel),
    aiBaseUrl: emptyToUndefined(keys.aiBaseUrl),
    aiBaseUrlAcknowledged: keys.aiBaseUrlAcknowledged === true
  });
}

export function buildSavedRepoRequestBody(caseId: string, repo: ClassifiedRepo, note?: string): SavedRepoRequestBody {
  return compactUndefined({
    caseId,
    repo,
    note: emptyToUndefined(note)
  });
}

export function buildKeyVerificationRequestBody(keys: RedesignUserKeys): KeyVerificationRequestBody {
  return compactUndefined({
    githubToken: emptyToUndefined(keys.githubToken),
    aiProvider: keys.aiProvider,
    aiApiKey: emptyToUndefined(keys.aiApiKey),
    aiModel: emptyToUndefined(keys.aiModel),
    aiBaseUrl: emptyToUndefined(keys.aiBaseUrl),
    aiBaseUrlAcknowledged: keys.aiBaseUrlAcknowledged === true
  });
}

function normalizeUserKeys(value: Partial<RedesignUserKeys> | null | undefined): RedesignUserKeys {
  return {
    ...DEFAULT_REDESIGN_USER_KEYS,
    ...(value ?? {}),
    aiProvider: value?.aiProvider ?? DEFAULT_REDESIGN_USER_KEYS.aiProvider
  };
}

function normalizePromptPackState(value: Partial<PromptPackState> | null | undefined): PromptPackState {
  return {
    enabledIds: Array.isArray(value?.enabledIds) ? value.enabledIds : DEFAULT_PROMPT_PACK_STATE.enabledIds,
    customPacks: Array.isArray(value?.customPacks) ? value.customPacks : DEFAULT_PROMPT_PACK_STATE.customPacks
  };
}

function normalizeSavingsLog(value: Partial<SavingsLog> | null | undefined): SavingsLog {
  return {
    count: value?.count ?? DEFAULT_SAVINGS_LOG.count,
    totalHandoffTokens: value?.totalHandoffTokens ?? DEFAULT_SAVINGS_LOG.totalHandoffTokens
  };
}

function normalizeSavedBuildPacks(value: unknown): SavedBuildPack[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Partial<SavedBuildPack> => !!item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : cryptoSafeId(),
      title: typeof item.title === "string" ? item.title : "Untitled Build Pack",
      idea: typeof item.idea === "string" ? item.idea : "",
      starterRepo: typeof item.starterRepo === "string" ? item.starterRepo : "No starter selected",
      target: typeof item.target === "string" ? item.target : "codex",
      markdown: typeof item.markdown === "string" ? item.markdown : "",
      tokenEstimate: typeof item.tokenEstimate === "number" ? item.tokenEstimate : 0,
      qualityScore: typeof item.qualityScore === "number" ? item.qualityScore : 0,
      status: (item.status === "exported" ? "exported" : "draft") as SavedBuildPack["status"],
      schemaVersion: typeof item.schemaVersion === "number" ? item.schemaVersion : undefined,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
      updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString(),
      workspace: normalizeBuildPackWorkspace(item.workspace),
      versions: normalizeBuildPackVersions(item.versions)
    }))
    .filter((item) => item.markdown.trim().length > 0);
}

function normalizeBuildPackVersions(value: unknown): SavedBuildPackVersion[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Partial<SavedBuildPackVersion> => !!item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : cryptoSafeId(),
      label: typeof item.label === "string" ? item.label : "Saved version",
      markdown: typeof item.markdown === "string" ? item.markdown : "",
      tokenEstimate: typeof item.tokenEstimate === "number" ? item.tokenEstimate : estimateTokenFallback(item.markdown),
      qualityScore: typeof item.qualityScore === "number" ? item.qualityScore : 0,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString()
    }))
    .filter((item) => item.markdown.trim().length > 0)
    .slice(0, 12);
}

function normalizeBuildPackWorkspace(value: unknown): SavedBuildPackWorkspaceSnapshot | undefined {
  if (!value || typeof value !== "object") return undefined;
  const workspace = value as Partial<SavedBuildPackWorkspaceSnapshot>;
  return {
    result: workspace.result ?? null,
    brand: workspace.brand && typeof workspace.brand === "object" ? {
      name: typeof workspace.brand.name === "string" ? workspace.brand.name : "",
      audience: typeof workspace.brand.audience === "string" ? workspace.brand.audience : "",
      productGoal: typeof workspace.brand.productGoal === "string" ? workspace.brand.productGoal : "",
      firstMilestone: typeof workspace.brand.firstMilestone === "string" ? workspace.brand.firstMilestone : "",
      keepFromRepo: typeof workspace.brand.keepFromRepo === "string" ? workspace.brand.keepFromRepo : "",
      replaceFromRepo: typeof workspace.brand.replaceFromRepo === "string" ? workspace.brand.replaceFromRepo : "",
      addToRepo: typeof workspace.brand.addToRepo === "string" ? workspace.brand.addToRepo : "",
      designNotes: typeof workspace.brand.designNotes === "string" ? workspace.brand.designNotes : "",
      vibe: typeof workspace.brand.vibe === "string" ? workspace.brand.vibe : "",
      color: typeof workspace.brand.color === "string" ? workspace.brand.color : "",
      notList: Array.isArray(workspace.brand.notList) ? workspace.brand.notList.filter((item): item is string => typeof item === "string") : []
    } : null,
    selectedStarterRepo: workspace.selectedStarterRepo ?? null,
    followUps: Array.isArray(workspace.followUps)
      ? workspace.followUps.filter((turn): turn is { role: "user" | "assistant"; content: string; ui?: ChatUiAction[]; result?: IdeaCheckResult; intent?: ChatIntent } =>
        !!turn && (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string")
      : [],
    promptPackState: normalizePromptPackState(workspace.promptPackState),
    prompt: typeof workspace.prompt === "string" ? workspace.prompt : "",
    activeChatId: typeof workspace.activeChatId === "string" ? workspace.activeChatId : null
  };
}

function estimateTokenFallback(value: unknown) {
  return typeof value === "string" ? Math.max(1, Math.ceil(value.length / 4)) : 0;
}

function cryptoSafeId() {
  return `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAccent(value: unknown): RedesignAccent {
  return value === "ember" || value === "forest" || value === "violet" || value === "cobalt" ? value : "cobalt";
}

function emptyToUndefined(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function compactUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}
