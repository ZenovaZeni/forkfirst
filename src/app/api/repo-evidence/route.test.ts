import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { prepareRepoForHandoff } from "@/lib/repo-evidence/prepare";

vi.mock("@/lib/repo-evidence/prepare", () => ({
  prepareRepoForHandoff: vi.fn(async (repo) => repo)
}));

function postRequest(body: BodyInit, contentType = "application/json") {
  return new Request("https://forkfirst.test/api/repo-evidence", {
    method: "POST",
    headers: { "Content-Type": contentType, "x-forwarded-for": "203.0.113.44" },
    body
  });
}

describe("/api/repo-evidence", () => {
  it("returns 400 for malformed JSON instead of a server error", async () => {
    const response = await POST(postRequest("{bad"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid repo evidence request." });
    expect(prepareRepoForHandoff).not.toHaveBeenCalled();
  });

  it("returns 400 when repo identity is missing", async () => {
    const response = await POST(postRequest(JSON.stringify({ repo: { owner: "openai" } })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing repo" });
    expect(prepareRepoForHandoff).not.toHaveBeenCalled();
  });
});
