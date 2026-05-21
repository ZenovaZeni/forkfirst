import { describe, expect, test } from "vitest";
import { safeExternalUrl, safeProjectSiteUrl } from "./project-site";

describe("project site URL filtering", () => {
  test("keeps normal project sites and GitHub Pages sites", () => {
    expect(safeProjectSiteUrl("https://demo.product.dev")).toBe("https://demo.product.dev/");
    expect(safeProjectSiteUrl("https://owner.github.io/project")).toBe("https://owner.github.io/project");
  });

  test("rejects unsafe or placeholder URLs", () => {
    expect(safeProjectSiteUrl("javascript:alert(1)")).toBeNull();
    expect(safeProjectSiteUrl("http://localhost:3000")).toBeNull();
    expect(safeProjectSiteUrl("http://127.0.0.1:3000")).toBeNull();
    expect(safeProjectSiteUrl("http://10.0.0.5:3000")).toBeNull();
    expect(safeProjectSiteUrl("http://172.16.0.5:3000")).toBeNull();
    expect(safeProjectSiteUrl("http://172.31.255.5:3000")).toBeNull();
    expect(safeProjectSiteUrl("http://192.168.1.4:3000")).toBeNull();
    expect(safeProjectSiteUrl("http://169.254.1.4:3000")).toBeNull();
    expect(safeProjectSiteUrl("http://[fe80::1]/")).toBeNull();
    expect(safeProjectSiteUrl("https://example.com")).toBeNull();
    expect(safeProjectSiteUrl("#")).toBeNull();
  });

  test("rejects GitHub repo URLs when deciding whether to show a project site", () => {
    expect(
      safeProjectSiteUrl("https://github.com/acme/app", {
        repoUrl: "https://github.com/acme/app",
        fullName: "acme/app"
      })
    ).toBeNull();
    expect(safeProjectSiteUrl("https://github.com/acme/app", { fullName: "acme/app" })).toBeNull();
  });

  test("generic external URLs still allow GitHub links for clone and GitHub actions", () => {
    expect(safeExternalUrl("https://github.com/acme/app")).toBe("https://github.com/acme/app");
  });
});
