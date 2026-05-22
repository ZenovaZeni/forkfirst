import { describe, expect, test } from "vitest";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { buildMergePlan, deriveProductIntent, inspectRepoForBuildPack } from "./workflow";

function repo(overrides: Partial<ClassifiedRepo> = {}): ClassifiedRepo {
  return {
    id: 1,
    owner: "simonwep",
    name: "ocular",
    fullName: "simonwep/ocular",
    url: "https://github.com/simonwep/ocular",
    description: "Open-source budgeting app with expense tracking, imports, exports, and Docker setup.",
    language: "Vue",
    topics: ["budget", "expenses", "csv", "self-hosted"],
    stars: 510,
    forks: 40,
    openIssues: 3,
    license: "MIT",
    pushedAt: "2026-05-01T00:00:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    archived: false,
    homepage: null,
    defaultBranch: "main",
    category: "forkable",
    score: { total: 86, fit: 82, activity: 80, popularity: 55, license: 100, docs: 92, reasons: ["Strong keyword fit", "README/docs look useful"] },
    summary: "Useful budgeting starter",
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-21T00:00:00Z",
      truncated: false,
      fileCount: 9,
      rootFiles: ["package.json", "docker-compose.yml", "README.md", "LICENSE"],
      appDirectories: ["src/app", "src/components", "src/app/api"],
      packageManagers: ["pnpm", "Docker"],
      frameworks: ["Next.js / React", "Prisma"],
      dataLayers: ["Prisma schema", "environment config"],
      inspectionTargets: ["package.json", "src/app/api/expenses/route.ts", "prisma/schema.prisma", "docker-compose.yml"],
      reasons: ["Next.js routes found", "API route files found", "Prisma schema found"]
    },
    readme: {
      excerpt: "Track budgets and expenses, import data from sheets, export JSON or CSV, and self-host with Docker.",
      url: "https://github.com/simonwep/ocular#readme",
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: false,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 90,
      reasons: ["Setup path found", "Examples found"],
      evidence: {
        fetchStatus: "ok",
        fetchedAt: "2026-05-21T00:00:00Z",
        setupSnippets: ["Deploy with Docker compose"],
        commandSnippets: ["docker compose up"],
        featureSnippets: ["budget tracking, expense history, CSV export"],
        integrationSnippets: ["Google Sheets import"],
        licenseSnippets: ["MIT"]
      }
    },
    ...overrides
  };
}

describe("idea-check workflow artifacts", () => {
  test("turns arbitrary ideas into concrete product intent without placeholder nouns", () => {
    const intent = deriveProductIntent({
      prompt: "I want to build a local-first receipt scanner that tracks expenses and exports to CSV for taxes",
      repos: [repo()]
    });

    expect(intent.productPhrase).toBe("local-first receipt scanner");
    expect(intent.targetUser).toMatch(/tax prep|receipts/i);
    expect(intent.dataObjects).toEqual(expect.arrayContaining(["Receipt", "ExpenseRecord", "CsvExport"]));
    expect(intent.screens.join(" ")).toMatch(/Receipt capture|Expense review|CSV export/i);
    expect(intent.actions.join(" ")).toMatch(/scan receipts|export expenses to CSV/i);
    expect(JSON.stringify(intent)).not.toMatch(/PrimaryItem|UserInput|one working product loop|main thing|taxes who|receipt, expense, and parsed/i);
  });

  test("normalizes recipe scanner expense wording into receipt intent", () => {
    const intent = deriveProductIntent({
      prompt: "I want a recipe scanner that tracks expenses and exports CSV",
      repos: [repo()]
    });

    expect(intent.productPhrase).toMatch(/receipt scanner/i);
    expect(intent.dataObjects).toEqual(expect.arrayContaining(["Receipt", "ExpenseRecord", "CsvExport"]));
    expect(intent.screens.join(" ")).toMatch(/Receipt capture|Expense review|CSV export/i);
    expect(intent.actions.join(" ")).toMatch(/scan receipts|export expenses to CSV/i);
    expect(JSON.stringify(intent)).not.toMatch(/Recipe|Ingredient|GroceryList/i);
  });

  test("keeps unknown-domain ideas concrete without a named blueprint", () => {
    const intent = deriveProductIntent({
      prompt: "I want a plant care tracker that logs watering, photos, reminders, and exports PDF",
      repos: [repo({ description: "Simple local-first tracker with reminders and export support." })]
    });

    expect(intent.dataObjects.join(" ")).toMatch(/Plant|Watering|Photo|Reminder|PdfExport/i);
    expect(intent.screens.join(" ")).toMatch(/plant|watering|PDF export/i);
    expect(intent.actions.join(" ")).toMatch(/manage plant|export to PDF/i);
    expect(JSON.stringify(intent)).not.toMatch(/PrimaryItem|UserInput|one working product loop|main thing/i);
  });

  test("prefers ecommerce dashboard blueprint workflow over generic generated steps", () => {
    const intent = deriveProductIntent({
      prompt: "I want a dashboard for tracking Shopify store profit, ad spend, orders, and inventory.",
      repos: [repo({
        fullName: "shopnex-ai/shopnex",
        description: "Open-source Shopify alternative built with Payload CMS.",
        topics: ["shopify", "ecommerce", "analytics", "inventory"]
      })]
    });

    expect(intent.productPhrase).toBe("Shopify profit dashboard");
    expect(intent.primaryWorkflow.join(" ")).toMatch(/connects or imports Shopify order data|normalizes the data|exports a daily or weekly store-health report/i);
    expect(intent.primaryWorkflow.join(" ")).not.toMatch(/created StoreMetric|survives refresh|backup, handoff/i);
    expect(intent.dataObjects.slice(0, 5)).toEqual(["Order", "Product", "InventoryItem", "AdSpend", "CostOfGoods"]);
  });

  test("cleans README attachment and mojibake evidence before handoff use", () => {
    const inspection = inspectRepoForBuildPack(repo({
      readme: {
        ...repo().readme!,
        excerpt: "![shopnex](https://github.com/user-attachments/assets/example) ## \u00e2\u0153\u00a8 Core Features",
        evidence: {
          fetchStatus: "ok",
          fetchedAt: "2026-05-21T00:00:00Z",
          setupSnippets: ["## \u00f0\u0178\u0161\u20ac Quick Start"],
          commandSnippets: ["pnpm dev"],
          featureSnippets: ["- **Analytics Dashboard** - Sales tracking with charts"],
          integrationSnippets: [],
          licenseSnippets: ["MIT"]
        }
      }
    }));

    expect(JSON.stringify(inspection)).not.toMatch(/user-attachments|github\.com\/user attachments|\u00e2|\u00f0|â|ð/);
    expect(inspection.readme.evidence.setup.join(" ")).toMatch(/Quick Start/);
  });

  test("inspects repo evidence into one reusable adapter object", () => {
    const inspection = inspectRepoForBuildPack(repo());

    expect(inspection.repo.fullName).toBe("simonwep/ocular");
    expect(inspection.classification.foundationMode).toBe("clone");
    expect(inspection.classification.setupFit.label).toMatch(/Docker/i);
    expect(inspection.readme.evidence.features.join(" ")).toMatch(/expense history|CSV export/i);
    expect(inspection.buildPack.firstInspectionFiles).toEqual(expect.arrayContaining(["README.md", "LICENSE", "src/app/api/expenses/route.ts", "prisma/schema.prisma"]));
    expect(inspection.buildPack.evidenceSummary.join(" ")).toMatch(/Next\.js routes found|Prisma schema found/i);
  });

  test("builds a merge plan that separates keep, replace, add, remove, and inspect work", () => {
    const intent = deriveProductIntent({
      prompt: "I want to build a local-first receipt scanner that tracks expenses and exports to CSV",
      repos: [repo()]
    });
    const inspection = inspectRepoForBuildPack(repo());
    const plan = buildMergePlan(intent, inspection);

    expect(plan.fitSummary).toMatch(/simonwep\/ocular/i);
    expect(plan.keep.map((item) => item.item).join(" ")).toMatch(/expense|CSV|working setup/i);
    expect(plan.replace.join(" ")).toMatch(/product identity|sample data|domain assumptions/i);
    expect(plan.add.join(" ")).toMatch(/Receipt|ReceiptImage|save\/export/i);
    expect(plan.inspect).toEqual(expect.arrayContaining(["README.md", "LICENSE", "package files / lockfiles"]));
  });
});
