import { afterEach, describe, expect, it } from "vitest";
import { serverDbEnabled } from "./server-db";

describe("server DB persistence policy", () => {
  afterEach(() => {
    delete process.env.FORKFIRST_ENABLE_SERVER_DB;
    delete process.env.OPEN_REPO_ENABLE_SERVER_DB;
  });

  it("is disabled by default", () => {
    expect(serverDbEnabled()).toBe(false);
  });

  it("is explicit opt-in only", () => {
    process.env.FORKFIRST_ENABLE_SERVER_DB = "true";
    expect(serverDbEnabled()).toBe(true);
  });

  it("keeps the legacy Open Repo server DB flag working", () => {
    process.env.OPEN_REPO_ENABLE_SERVER_DB = "true";
    expect(serverDbEnabled()).toBe(true);
  });
});
