import { afterEach, describe, expect, it, vi } from "vitest";
import { requireSafeBaseUrl } from "./base-url-policy-server";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => ({ address: "93.184.216.34", family: 4 }))
}));

describe("server requireSafeBaseUrl", () => {
  afterEach(() => {
    delete process.env.FORKFIRST_ALLOW_PRIVATE_BASE_URLS;
    delete process.env.OPEN_REPO_ALLOW_PRIVATE_BASE_URLS;
  });

  it("blocks untrusted hostnames that resolve to private addresses", async () => {
    const dns = await import("node:dns/promises");
    vi.mocked(dns.lookup).mockResolvedValueOnce({ address: "10.0.0.7", family: 4 });

    await expect(requireSafeBaseUrl("https://models.example.test/v1", { allowUntrusted: true })).rejects.toThrow(
      "Private or local base URLs are disabled by default for hosted safety"
    );
  });

  it("allows acknowledged untrusted hostnames that resolve publicly", async () => {
    await expect(requireSafeBaseUrl("https://models.example.test/v1", { allowUntrusted: true })).resolves.toEqual({
      host: "models.example.test"
    });
  });
});
