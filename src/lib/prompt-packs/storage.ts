import { DEFAULT_PROMPT_PACKS, type PromptPack } from "./default-packs";

export type { PromptPack };

export type PromptPackState = {
  enabledIds: string[];
  customPacks: PromptPack[];
};

export type ResolvedPack = PromptPack & { enabled: boolean };

const STORAGE_KEY = "forkfirst:prompt-packs";

const DEFAULT_ENABLED_IDS = ["karpathy-mvp", "indie-hacker-mvp", "ai-edit-over-generate"];

function defaultState(): PromptPackState {
  return {
    enabledIds: DEFAULT_ENABLED_IDS,
    customPacks: []
  };
}

export function loadPromptPackState(): PromptPackState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<PromptPackState>;
    return {
      enabledIds: Array.isArray(parsed.enabledIds) ? parsed.enabledIds : DEFAULT_ENABLED_IDS,
      customPacks: Array.isArray(parsed.customPacks) ? parsed.customPacks : []
    };
  } catch {
    return defaultState();
  }
}

export function savePromptPackState(state: PromptPackState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resolvePacks(state: PromptPackState): ResolvedPack[] {
  const enabledSet = new Set(state.enabledIds);
  const defaults: ResolvedPack[] = (DEFAULT_PROMPT_PACKS ?? []).map((pack) => ({
    ...pack,
    enabled: enabledSet.has(pack.id)
  }));
  const custom: ResolvedPack[] = state.customPacks.map((pack) => ({
    ...pack,
    enabled: enabledSet.has(pack.id)
  }));
  return [...defaults, ...custom];
}

export function enabledPackMarkdown(state: PromptPackState): string {
  const enabledSet = new Set(state.enabledIds);
  const allPacks = [...(DEFAULT_PROMPT_PACKS ?? []), ...state.customPacks];
  const enabled = allPacks.filter((pack) => enabledSet.has(pack.id));
  if (enabled.length === 0) return "";
  return enabled.map((pack) => pack.content).join("\n\n---\n\n");
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function generateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function addCustomPack(
  state: PromptPackState,
  pack: Omit<PromptPack, "id" | "source">
): PromptPackState {
  const id = generateId();
  const newPack: PromptPack = { ...pack, id, source: "custom" };
  const next: PromptPackState = {
    ...state,
    customPacks: [...state.customPacks, newPack],
    enabledIds: [...state.enabledIds, id]
  };
  savePromptPackState(next);
  return next;
}

export function updateCustomPack(
  state: PromptPackState,
  id: string,
  patch: Partial<Pick<PromptPack, "name" | "blurb" | "content">>
): PromptPackState {
  const next: PromptPackState = {
    ...state,
    customPacks: state.customPacks.map((pack) =>
      pack.id === id ? { ...pack, ...patch } : pack
    )
  };
  savePromptPackState(next);
  return next;
}

export function deleteCustomPack(state: PromptPackState, id: string): PromptPackState {
  const next: PromptPackState = {
    ...state,
    customPacks: state.customPacks.filter((pack) => pack.id !== id),
    enabledIds: state.enabledIds.filter((enabledId) => enabledId !== id)
  };
  savePromptPackState(next);
  return next;
}

export function togglePack(state: PromptPackState, id: string): PromptPackState {
  const enabledSet = new Set(state.enabledIds);
  if (enabledSet.has(id)) {
    enabledSet.delete(id);
  } else {
    enabledSet.add(id);
  }
  const next: PromptPackState = { ...state, enabledIds: Array.from(enabledSet) };
  savePromptPackState(next);
  return next;
}
