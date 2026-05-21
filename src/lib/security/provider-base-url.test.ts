import { describe, expect, test } from "vitest";
import { GROQ_OPENAI_BASE_URL, OPENAI_BASE_URL } from "./server-keys";
import { providerBaseUrl } from "./provider-base-url";

describe("providerBaseUrl", () => {
  test("uses OpenAI for OpenAI keys instead of Groq", () => {
    expect(providerBaseUrl("openai")).toBe(OPENAI_BASE_URL);
  });

  test("uses provider-specific and custom base URLs", () => {
    expect(providerBaseUrl("groq")).toBe(GROQ_OPENAI_BASE_URL);
    expect(providerBaseUrl("deepseek")).toBe("https://api.deepseek.com");
    expect(providerBaseUrl("custom", "https://models.example.test/v1")).toBe("https://models.example.test/v1");
  });
});
