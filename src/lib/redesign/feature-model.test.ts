import { describe, expect, test } from "vitest";
import {
  DEFAULT_REDESIGN_USER_KEYS,
  LEGACY_REDESIGN_STORAGE_KEYS,
  REDESIGN_STORAGE_KEYS,
  buildIdeaCheckRequestBody,
  readFeatureStorage,
  readJsonValue,
  writeFeatureStorage,
  type JsonStorage,
  type RedesignFeatureStorage
} from "./feature-model";

function memoryStorage(seed: Record<string, string> = {}): JsonStorage {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

describe("redesign feature model", () => {
  test("uses ForkFirst feature storage keys", () => {
    expect(REDESIGN_STORAGE_KEYS).toEqual({
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
    });
  });

  test("reads legacy Open Repo storage keys during migration", () => {
    const storage = memoryStorage({
      [LEGACY_REDESIGN_STORAGE_KEYS.rememberKeys]: "true",
      [LEGACY_REDESIGN_STORAGE_KEYS.savedRepos]: JSON.stringify([{ fullName: "legacy/repo" }])
    });

    const state = readFeatureStorage(storage);

    expect(state.rememberKeys).toBe(true);
    expect(state.savedRepos).toEqual([{ fullName: "legacy/repo" }]);
  });

  test("reads feature storage with defaults when values are missing or malformed", () => {
    const storage = memoryStorage({
      [REDESIGN_STORAGE_KEYS.keys]: "{bad-json",
      [REDESIGN_STORAGE_KEYS.savedRepos]: JSON.stringify([{ fullName: "owner/repo" }]),
      [REDESIGN_STORAGE_KEYS.savedRepoBoards]: JSON.stringify({ "owner/repo": "Fork candidates" }),
      [REDESIGN_STORAGE_KEYS.rememberKeys]: "false"
    });

    const state = readFeatureStorage(storage);

    expect(state.keys).toEqual(DEFAULT_REDESIGN_USER_KEYS);
    expect(state.rememberKeys).toBe(false);
    expect(state.savedRepos).toEqual([{ fullName: "owner/repo" }]);
    expect(state.savedRepoBoards).toEqual({ "owner/repo": "Fork candidates" });
    expect(state.chats).toEqual([]);
    expect(state.folders).toEqual([]);
    expect(state.usageEntries).toEqual([]);
    expect(state.promptPackState.enabledIds).toContain("karpathy-mvp");
    expect(state.savingsLog).toEqual({ count: 0, totalHandoffTokens: 0 });
    expect(state.accent).toBe("cobalt");
  });

  test("writes only defined feature storage slices", () => {
    const storage = memoryStorage();
    const patch: Partial<RedesignFeatureStorage> = {
      rememberKeys: true,
      accent: "forest",
      folders: [{ id: "folder-1", name: "Research", createdAt: "2026-05-16T00:00:00.000Z" }]
    };

    writeFeatureStorage(storage, patch);

    expect(readJsonValue(storage, REDESIGN_STORAGE_KEYS.rememberKeys, false)).toBe(true);
    expect(readJsonValue(storage, REDESIGN_STORAGE_KEYS.accent, "cobalt")).toBe("forest");
    expect(readJsonValue(storage, REDESIGN_STORAGE_KEYS.folders, [])).toEqual(patch.folders);
    expect(storage.getItem(REDESIGN_STORAGE_KEYS.keys)).toBeNull();
  });

  test("builds the existing idea-check request body from prompt, keys, and case id", () => {
    const body = buildIdeaCheckRequestBody("  build a repo research board  ", {
      githubToken: "ghp_test",
      aiProvider: "custom",
      aiApiKey: "sk-test",
      aiModel: "local-model",
      aiBaseUrl: "https://models.example.test/v1",
      aiBaseUrlAcknowledged: true
    }, "case-123");

    expect(body).toEqual({
      prompt: "build a repo research board",
      caseId: "case-123",
      githubToken: "ghp_test",
      aiProvider: "custom",
      aiApiKey: "sk-test",
      aiModel: "local-model",
      aiBaseUrl: "https://models.example.test/v1",
      aiBaseUrlAcknowledged: true
    });
  });

  test("omits empty optional idea-check credentials while preserving provider defaults", () => {
    const body = buildIdeaCheckRequestBody("small local-first issue tracker", DEFAULT_REDESIGN_USER_KEYS);

    expect(body).toEqual({
      prompt: "small local-first issue tracker",
      aiProvider: "groq",
      aiModel: "llama-3.1-8b-instant",
      aiBaseUrl: "https://api.groq.com/openai/v1",
      aiBaseUrlAcknowledged: false
    });
  });
});
