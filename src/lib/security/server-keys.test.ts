import { afterEach, describe, expect, it } from "vitest";
import { optionalServerAiConfig, optionalServerKey, optionalServerModel, serverKeyFallbacksEnabled } from "./server-keys";

describe("server key fallback policy", () => {
  afterEach(() => {
    delete process.env.FORKFIRST_ALLOW_SERVER_KEYS;
    delete process.env.OPEN_REPO_ALLOW_SERVER_KEYS;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.GROQ_API_KEY;
    delete process.env.GROQ_MODEL;
    delete process.env.GITHUB_TOKEN;
  });

  it("does not expose server keys unless explicitly enabled", () => {
    process.env.OPENAI_API_KEY = "sk-server";
    process.env.GROQ_API_KEY = "gsk-server";
    process.env.GITHUB_TOKEN = "ghp_server";

    expect(serverKeyFallbacksEnabled()).toBe(false);
    expect(optionalServerKey("OPENAI_API_KEY")).toBeUndefined();
    expect(optionalServerKey("GROQ_API_KEY")).toBeUndefined();
    expect(optionalServerKey("GITHUB_TOKEN")).toBeUndefined();
    expect(optionalServerAiConfig()).toBeUndefined();
  });

  it("allows server keys only with FORKFIRST_ALLOW_SERVER_KEYS", () => {
    process.env.FORKFIRST_ALLOW_SERVER_KEYS = "true";
    process.env.OPENAI_API_KEY = "sk-server";
    process.env.OPENAI_MODEL = "gpt-test";

    expect(serverKeyFallbacksEnabled()).toBe(true);
    expect(optionalServerKey("OPENAI_API_KEY")).toBe("sk-server");
    expect(optionalServerModel()).toBe("gpt-test");
  });

  it("keeps the legacy Open Repo server key flag working", () => {
    process.env.OPEN_REPO_ALLOW_SERVER_KEYS = "true";
    process.env.OPENAI_API_KEY = "sk-server";

    expect(serverKeyFallbacksEnabled()).toBe(true);
    expect(optionalServerKey("OPENAI_API_KEY")).toBe("sk-server");
  });

  it("prefers Groq for private server AI fallback when configured", () => {
    process.env.FORKFIRST_ALLOW_SERVER_KEYS = "true";
    process.env.GROQ_API_KEY = "gsk-server";
    process.env.GROQ_MODEL = "llama-test";
    process.env.OPENAI_API_KEY = "sk-server";

    expect(optionalServerAiConfig()).toMatchObject({
      provider: "groq",
      apiKey: "gsk-server",
      model: "llama-test",
      baseUrl: "https://api.groq.com/openai/v1"
    });
  });

  it("falls back to OpenAI only when Groq is not configured", () => {
    process.env.FORKFIRST_ALLOW_SERVER_KEYS = "true";
    process.env.OPENAI_API_KEY = "sk-server";
    process.env.OPENAI_MODEL = "gpt-test";

    expect(optionalServerAiConfig()).toMatchObject({
      provider: "openai",
      apiKey: "sk-server",
      model: "gpt-test"
    });
  });
});
