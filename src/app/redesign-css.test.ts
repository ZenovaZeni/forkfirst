import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/redesign-overrides.css"), "utf8");

function cssBlock(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = Array.from(css.matchAll(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "g")));
  return matches.at(-1)?.[1] ?? "";
}

describe("redesign CSS", () => {
  test.each([
    ".app-shell .loading-card .ls.done .ind::after",
    ".app-shell .generating-card .gcs.done .gci::after"
  ])("centers completed step checkmark for %s", (selector) => {
    const block = cssBlock(selector);

    expect(block).toContain('content: " "');
    expect(block).toContain("left: 50%");
    expect(block).toContain("top: 50%");
    expect(block).toContain("font-size: 0");
    expect(block).toContain("transform: translate(-50%, -58%) rotate(45deg)");
  });
});
