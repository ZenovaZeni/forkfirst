import { afterEach, describe, it, expect } from "vitest";
import { classifyBaseUrl, requireSafeBaseUrl } from "./base-url-policy";

describe("classifyBaseUrl", () => {
  it("returns empty for undefined/null/empty", () => {
    expect(classifyBaseUrl(undefined)).toEqual({ ok: false, reason: "empty" });
    expect(classifyBaseUrl(null)).toEqual({ ok: false, reason: "empty" });
    expect(classifyBaseUrl("")).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects invalid URLs and non-http schemes", () => {
    expect(classifyBaseUrl("not a url at all")).toEqual({ ok: false, reason: "invalid" });
    expect(classifyBaseUrl("api.openai.com")).toEqual({ ok: false, reason: "invalid" });
    expect(classifyBaseUrl("javascript:alert(1)")).toEqual({ ok: false, reason: "bad-scheme" });
    expect(classifyBaseUrl("file:///etc/passwd")).toEqual({ ok: false, reason: "bad-scheme" });
    expect(classifyBaseUrl("ftp://evil.com/upload")).toEqual({ ok: false, reason: "bad-scheme" });
  });

  it("trusts known provider hosts and subdomains", () => {
    expect(classifyBaseUrl("https://api.openai.com/v1")).toMatchObject({ ok: true, trusted: true });
    expect(classifyBaseUrl("https://api.groq.com/openai/v1")).toMatchObject({ ok: true, trusted: true });
    expect(classifyBaseUrl("https://api.deepseek.com")).toMatchObject({ ok: true, trusted: true });
    expect(classifyBaseUrl("https://openrouter.ai/api/v1")).toMatchObject({ ok: true, trusted: true });
    expect(classifyBaseUrl("https://gateway.openrouter.ai/api/v1")).toMatchObject({ ok: true, trusted: true });
    expect(classifyBaseUrl("https://eu.api.openai.com/v1")).toMatchObject({ ok: true, trusted: true });
  });

  it("marks local and private hosts as untrusted private hosts", () => {
    expect(classifyBaseUrl("http://localhost:11434/v1")).toMatchObject({ ok: true, trusted: false, privateHost: true });
    expect(classifyBaseUrl("http://127.0.0.1:8080/v1")).toMatchObject({ ok: true, trusted: false, privateHost: true });
    expect(classifyBaseUrl("http://10.0.0.5/v1")).toMatchObject({ ok: true, trusted: false, privateHost: true });
    expect(classifyBaseUrl("http://192.168.1.5/v1")).toMatchObject({ ok: true, trusted: false, privateHost: true });
    expect(classifyBaseUrl("http://172.20.0.5/v1")).toMatchObject({ ok: true, trusted: false, privateHost: true });
    expect(classifyBaseUrl("http://169.254.169.254/latest/meta-data")).toMatchObject({ ok: true, trusted: false, privateHost: true });
  });

  it("returns untrusted for unknown public hosts", () => {
    expect(classifyBaseUrl("https://evil.com/v1")).toMatchObject({ ok: true, trusted: false, host: "evil.com", privateHost: false });
    expect(classifyBaseUrl("https://openai.evil.com/v1")).toMatchObject({ ok: true, trusted: false });
  });
});

describe("requireSafeBaseUrl", () => {
  afterEach(() => {
    delete process.env.FORKFIRST_ALLOW_PRIVATE_BASE_URLS;
    delete process.env.OPEN_REPO_ALLOW_PRIVATE_BASE_URLS;
  });

  it("throws for empty, invalid, and bad schemes", () => {
    expect(() => requireSafeBaseUrl("", { allowUntrusted: false })).toThrow("Invalid base URL");
    expect(() => requireSafeBaseUrl("::bad::", { allowUntrusted: false })).toThrow("Invalid base URL");
    expect(() => requireSafeBaseUrl("javascript:alert(1)", { allowUntrusted: false })).toThrow(
      "Disallowed scheme - only http(s) is supported"
    );
  });

  it("throws for unknown host without acknowledgement", () => {
    expect(() => requireSafeBaseUrl("https://evil.com/v1", { allowUntrusted: false })).toThrow(
      "Untrusted base URL - host 'evil.com' is not on the known-provider list"
    );
  });

  it("succeeds for unknown public host with acknowledgement", () => {
    expect(requireSafeBaseUrl("https://evil.com/v1", { allowUntrusted: true })).toEqual({ host: "evil.com" });
  });

  it("succeeds for trusted host without acknowledgement", () => {
    expect(requireSafeBaseUrl("https://api.openai.com/v1", { allowUntrusted: false })).toEqual({ host: "api.openai.com" });
  });

  it("blocks localhost by default even with acknowledgement", () => {
    expect(() => requireSafeBaseUrl("http://localhost:11434/v1", { allowUntrusted: true })).toThrow(
      "Private or local base URLs are disabled by default for hosted safety"
    );
  });

  it("allows localhost when private base URLs are explicitly enabled", () => {
    process.env.FORKFIRST_ALLOW_PRIVATE_BASE_URLS = "true";
    expect(requireSafeBaseUrl("http://localhost:11434/v1", { allowUntrusted: true })).toEqual({ host: "localhost:11434" });
  });

  it("keeps the legacy Open Repo private base URL flag working", () => {
    process.env.OPEN_REPO_ALLOW_PRIVATE_BASE_URLS = "true";
    expect(requireSafeBaseUrl("http://localhost:11434/v1", { allowUntrusted: true })).toEqual({ host: "localhost:11434" });
  });
});
