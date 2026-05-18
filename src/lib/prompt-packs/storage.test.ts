import { describe, expect, test, beforeEach, vi } from "vitest";
import {
  loadPromptPackState,
  resolvePacks,
  enabledPackMarkdown,
  addCustomPack,
  togglePack,
  deleteCustomPack,
  estimateTokens
} from "./storage";

const STORAGE_KEY = "forkfirst:prompt-packs";

// In-memory localStorage shim (node env has no localStorage)
function makeLocalStorageShim() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    _store: store
  };
}

let lsShim = makeLocalStorageShim();

beforeEach(() => {
  lsShim = makeLocalStorageShim();
  vi.stubGlobal("window", { localStorage: lsShim });
  vi.stubGlobal("localStorage", lsShim);
});

describe("loadPromptPackState", () => {
  test("returns default state when localStorage is empty", () => {
    const state = loadPromptPackState();
    expect(state.customPacks).toEqual([]);
    expect(state.enabledIds).toContain("karpathy-mvp");
    expect(state.enabledIds).toContain("indie-hacker-mvp");
    expect(state.enabledIds).toContain("ai-edit-over-generate");
    expect(state.enabledIds).toHaveLength(3);
  });

  test("restores persisted state from localStorage", () => {
    const saved = { enabledIds: ["karpathy-mvp"], customPacks: [] };
    lsShim.setItem(STORAGE_KEY, JSON.stringify(saved));
    const state = loadPromptPackState();
    expect(state.enabledIds).toEqual(["karpathy-mvp"]);
  });
});

describe("addCustomPack + resolvePacks", () => {
  test("adding a custom pack makes it appear in resolvePacks", () => {
    let state = loadPromptPackState();
    state = addCustomPack(state, {
      name: "My Pack",
      blurb: "A test pack",
      content: "## My Pack\nDo the thing."
    });
    const resolved = resolvePacks(state);
    const custom = resolved.find((pack) => pack.name === "My Pack");
    expect(custom).toBeDefined();
    expect(custom?.source).toBe("custom");
    expect(custom?.enabled).toBe(true);
  });
});

describe("togglePack persistence", () => {
  test("toggling off a default pack persists and reloads as off", () => {
    const state = loadPromptPackState();
    // karpathy-mvp is on by default; toggle it off
    togglePack(state, "karpathy-mvp");
    // Reload from storage
    const reloaded = loadPromptPackState();
    expect(reloaded.enabledIds).not.toContain("karpathy-mvp");
  });
});

describe("enabledPackMarkdown", () => {
  test("joins markdown for multiple enabled packs", () => {
    let state = loadPromptPackState();
    // Keep only karpathy-mvp and indie-hacker-mvp on
    state = { ...state, enabledIds: ["karpathy-mvp", "indie-hacker-mvp"] };
    const md = enabledPackMarkdown(state);
    expect(md).toContain("Karpathy MVP Rules");
    expect(md).toContain("Indie Hacker MVP");
    expect(md).toContain("---");
  });

  test("returns empty string when no packs are enabled", () => {
    const state = { enabledIds: [], customPacks: [] };
    expect(enabledPackMarkdown(state)).toBe("");
  });
});

describe("deleteCustomPack", () => {
  test("removes the pack and its id from enabledIds", () => {
    let state = loadPromptPackState();
    state = addCustomPack(state, { name: "Temp", blurb: "Temp", content: "temp" });
    const id = state.customPacks[0].id;
    state = deleteCustomPack(state, id);
    expect(state.customPacks).toHaveLength(0);
    expect(state.enabledIds).not.toContain(id);
  });
});

describe("estimateTokens", () => {
  test("estimates tokens as chars/4", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("a".repeat(400))).toBe(100);
  });
});
