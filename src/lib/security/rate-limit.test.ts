import { afterEach, describe, expect, test, vi } from "vitest";
import { checkRateLimit, checkRateLimitForRequest } from "./rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("checkRateLimit", () => {
  test("limits requests inside the same local window", () => {
    const bucket = new Map<string, { count: number; windowStart: number }>();

    expect(checkRateLimit(bucket, "127.0.0.1", { max: 2, windowMs: 60_000 })).toEqual({ allowed: true });
    expect(checkRateLimit(bucket, "127.0.0.1", { max: 2, windowMs: 60_000 })).toEqual({ allowed: true });

    const third = checkRateLimit(bucket, "127.0.0.1", { max: 2, windowMs: 60_000 });
    expect(third.allowed).toBe(false);
  });
});

describe("checkRateLimitForRequest", () => {
  test("uses local fallback when durable env is not configured", async () => {
    const bucket = new Map<string, { count: number; windowStart: number }>();
    const request = new Request("https://example.test/api/test", {
      headers: { "x-forwarded-for": "203.0.113.9" }
    });

    await expect(checkRateLimitForRequest(request, bucket, { max: 1, windowMs: 60_000, scope: "test" })).resolves.toEqual({ allowed: true });
    const second = await checkRateLimitForRequest(request, bucket, { max: 1, windowMs: 60_000, scope: "test" });
    expect(second.allowed).toBe(false);
  });

  test("uses Upstash Redis REST when configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example-upstash.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ result: 2 }, { result: 1 }]), { status: 200 })
    );
    const request = new Request("https://example.test/api/test", {
      headers: { "x-forwarded-for": "198.51.100.2" }
    });

    const result = await checkRateLimitForRequest(request, new Map(), { max: 1, windowMs: 60_000, scope: "verify-keys" });

    expect(result.allowed).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example-upstash.test/pipeline",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-token" })
      })
    );
  });
});
