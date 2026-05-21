import { describe, expect, test } from "vitest";
import type { IdeaCheckResult } from "@/types/idea-check";
import { buildHandoffBlueprint } from "./blueprint";

function repo(overrides: Partial<IdeaCheckResult["repos"][number]> = {}): IdeaCheckResult["repos"][number] {
  return {
    id: 1,
    owner: "Git-Romer",
    name: "pokecollector",
    fullName: "Git-Romer/pokecollector",
    url: "https://github.com/Git-Romer/pokecollector",
    description: "Pokemon TCG collection manager with pricing, binders, wishlist, scanner, backup, and exports.",
    language: "TypeScript",
    topics: ["pokemon", "tcg", "collection", "pricing"],
    stars: 18,
    forks: 8,
    openIssues: 0,
    license: "AGPL-3.0",
    pushedAt: "2026-05-20T00:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-05-20T00:00:00Z",
    archived: false,
    homepage: "https://pokecollector.romerg.de",
    category: "forkable",
    score: { total: 61, fit: 31, activity: 100, popularity: 42, license: 100, docs: 54, reasons: [] },
    summary: "Pokemon collection lead",
    readme: {
      excerpt: "Card search, collection management, binders, wishlist, TCGdex sync, Cardmarket/TCGPlayer pricing, CSV/PDF export, backup/restore, analytics, scanner, FastAPI, React, Postgres, Docker.",
      url: "https://github.com/Git-Romer/pokecollector#readme",
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 95,
      reasons: ["README explains setup", "README includes examples"]
    },
    ...overrides
  };
}

describe("handoff blueprint", () => {
  test("uses selected repo evidence when the prompt alone is too broad", () => {
    const selectedRepo = repo();
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want something like Pokemon Collectors for my wife, but with our own look.",
      researchContext: null,
      chatContext: null,
      queries: ["pokemon tcg collection manager in:name,description,readme"],
      selectedRepo,
      candidateRepos: [selectedRepo],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("card-collector");
    expect(blueprint.productThesis).toMatch(/card|collector|collection/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/search.*card|card.*search/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/binder|album|vault/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/card|collection|condition|price/i);
    expect(blueprint.firstMilestone).toMatch(/search.*card|card.*search/i);
  });

  test("ignores generic wizard placeholders that would weaken a specific blueprint", () => {
    const selectedRepo = repo();
    const blueprint = buildHandoffBlueprint({
      originalIdea: "Pokemon card value tracker and collector album.",
      researchContext: null,
      chatContext: null,
      queries: [],
      selectedRepo,
      candidateRepos: [selectedRepo],
      preferences: {
        productName: "Untitled app",
        productGoal: "Turn the selected repo into the user's product idea.",
        audience: "the target user from the idea",
        firstMilestone: "Clone the repo, inspect the core flows, and ship the smallest useful workflow."
      }
    });

    expect(blueprint.productThesis).not.toMatch(/turn the selected repo/i);
    expect(blueprint.targetUserSegment).not.toMatch(/target user from the idea/i);
    expect(blueprint.firstMilestone).not.toMatch(/clone the repo/i);
    expect(blueprint.productThesis).toMatch(/card|collector/i);
  });

  test("infers a non-card app without leaking Pokemon-specific language", () => {
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want a recipe bookmark manager that saves recipes from links, lets me tag them, and exports a grocery list.",
      researchContext: null,
      chatContext: null,
      queries: ["recipe bookmark manager github"],
      selectedRepo: undefined,
      candidateRepos: [],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("recipe-bookmark");
    expect(blueprint.productThesis).toMatch(/recipe|grocery/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/Recipe|Ingredient|GroceryList/);
    expect(blueprint.productThesis).not.toMatch(/Pokemon|card collector/i);
  });

  test("keeps grocery savings prompts focused on shopping, not recipe bookmarking", () => {
    const selectedRepo = repo({
      owner: "TomBursch",
      name: "kitchenowl",
      fullName: "TomBursch/kitchenowl",
      description: "KitchenOwl is a self-hosted grocery list and recipe manager.",
      topics: ["grocery", "shopping-list", "recipes"],
      readme: {
        ...repo().readme!,
        excerpt: "Self-hosted grocery list, recipe manager, meal planning, and household shopping app."
      }
    });

    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want to make a grocery app",
      researchContext: null,
      chatContext: null,
      queries: ["grocery shopping list app in:name,description,readme"],
      selectedRepo,
      candidateRepos: [selectedRepo],
      preferences: {
        audience: "Just to help me find groceries cheaper everywhere and keep up with that.",
        keepFromRepo: "I don't know, keep whatever you need"
      }
    });

    expect(blueprint.productKind).toBe("grocery-shopping");
    expect(blueprint.productThesis).toMatch(/compare store prices|deals|saves money/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/price|deal|store plan/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/PriceSnapshot|Store|Deal/i);
    expect(blueprint.productThesis).not.toMatch(/recipe links|recipe bookmark/i);
  });

  test("turns salon booking prompts into a booking blueprint instead of a generic workflow", () => {
    const selectedRepo = repo({
      owner: "thunderbird",
      name: "appointment",
      fullName: "thunderbird/appointment",
      description: "Invite others to grab times on your calendar. Choose a date. Make appointments easy.",
      topics: ["appointment", "booking", "calendar"],
      readme: {
        ...repo().readme!,
        excerpt: "Appointment booking, booker page, subscriber dashboard, Docker setup, calendar scheduling."
      }
    });

    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want to make a booking app for a small salon",
      researchContext: null,
      chatContext: null,
      queries: ["salon booking app in:name,description,readme"],
      selectedRepo,
      candidateRepos: [selectedRepo],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("appointment-booking");
    expect(blueprint.productThesis).toMatch(/salon|booking|appointments/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/service|staff|availability|appointment/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/Service|StaffMember|Appointment/i);
    expect(blueprint.productThesis).not.toMatch(/one working product loop|selected repo/i);
  });

  test("turns contractor CRM prompts into a service CRM blueprint", () => {
    const selectedRepo = repo({
      owner: "go2ismail",
      name: "Free-CRM",
      fullName: "go2ismail/Free-CRM",
      description: "Open-source customer relationship management CRM software.",
      topics: ["crm", "customer-management"],
      readme: {
        ...repo().readme!,
        excerpt: "Free CRM with contacts, companies, tasks, notes, sales, and customer management."
      }
    });
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want to build a simple CRM for a roofing company",
      researchContext: null,
      chatContext: null,
      queries: ["roofing crm app in:name,description,readme"],
      selectedRepo,
      candidateRepos: [selectedRepo],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("service-business-crm");
    expect(blueprint.productThesis).toMatch(/roofing|contractor|service/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/lead|estimate|job|follow/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/Customer|Lead|Job|Estimate/i);
    expect(blueprint.coreDataObjects.join(" ")).not.toMatch(/PrimaryItem|UserInput/i);
  });

  test("turns cleaning company operations prompts into a quote, job, crew, and follow-up blueprint", () => {
    const selectedRepo = repo({
      owner: "invoicerr-app",
      name: "invoicerr",
      fullName: "invoicerr-app/invoicerr",
      description: "Invoicing app with quotes, invoices, payments, signatures, and customer workflows.",
      topics: ["invoices", "quotes", "customers"],
      readme: {
        ...repo().readme!,
        excerpt: "Create quotes, generate invoices, track payments, collect signatures, REST API backend, Docker setup."
      }
    });
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want an app for a cleaning company to manage quotes, jobs, crews, and follow-ups",
      researchContext: null,
      chatContext: null,
      queries: ["cleaning business management app in:name,description,readme"],
      selectedRepo,
      candidateRepos: [selectedRepo],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("service-business-crm");
    expect(blueprint.productThesis).toMatch(/cleaning|quote|job|crew|follow/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/quote|job|crew|follow/i);
    expect(blueprint.keyScreens.join(" ")).toMatch(/quote|job|crew|follow/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/Customer|Quote|Job|Crew|FollowUpTask/i);
    expect(blueprint.coreDataObjects.join(" ")).not.toMatch(/PrimaryItem|UserInput/i);
  });

  test("turns realtor lead scraping prompts into a lead workflow, not an image workflow", () => {
    const selectedRepo = repo({
      owner: "omkarcloud",
      name: "google-maps-scraper",
      fullName: "omkarcloud/google-maps-scraper",
      description: "Google Maps scraper and lead generation tool with business emails, phone numbers, social profiles, and API access.",
      topics: ["scraper", "lead-generation", "real-estate"],
      readme: {
        ...repo().readme!,
        excerpt: "Extract businesses, phone numbers, websites, and social profiles for lead research."
      }
    });
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want an app that helps realtors scrape leads and organize follow-ups",
      researchContext: null,
      chatContext: null,
      queries: ["real estate lead generation in:name,description,readme"],
      selectedRepo,
      candidateRepos: [selectedRepo],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("real-estate-leads");
    expect(blueprint.productThesis).toMatch(/realtor|lead|follow/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/source|qualify|follow/i);
    expect(blueprint.explicitNonGoals.join(" ")).toMatch(/terms|consent|bulk/i);
    expect(blueprint.productThesis).not.toMatch(/image|visual|listing photo/i);
  });

  test("turns Shopify profit prompts into an ecommerce analytics dashboard blueprint", () => {
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want a dashboard for tracking Shopify store profit, ad spend, and inventory",
      researchContext: null,
      chatContext: null,
      queries: ["shopify analytics dashboard in:name,description,readme"],
      selectedRepo: undefined,
      candidateRepos: [],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("ecommerce-dashboard");
    expect(blueprint.productThesis).toMatch(/profit|ad spend|inventory|shopify/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/orders|ad spend|inventory|margin/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/Order|AdSpend|InventoryItem|ProfitMetric/i);
    expect(blueprint.coreDataObjects.join(" ")).not.toMatch(/PrimaryItem|UserInput/i);
  });

  test("turns prompt organizer prompts into a prompt-library blueprint", () => {
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want to make an AI image prompt organizer",
      researchContext: null,
      chatContext: null,
      queries: ["ai prompt manager app in:name,description,readme"],
      selectedRepo: undefined,
      candidateRepos: [],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("prompt-library");
    expect(blueprint.productThesis).toMatch(/prompt|organize|reuse/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/save|tag|search|copy/i);
    expect(blueprint.productThesis).not.toMatch(/generate beautiful artwork/i);
  });

  test("turns kids sports schedule prompts into a team-calendar blueprint", () => {
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want to build a thing that helps parents organize kids sports schedules",
      researchContext: null,
      chatContext: null,
      queries: ["youth sports team schedule app in:name,description,readme"],
      selectedRepo: undefined,
      candidateRepos: [],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("sports-schedule");
    expect(blueprint.productThesis).toMatch(/parents|sports|schedule/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/practice|game|calendar|reminder/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/Child|Team|Event|Reminder/i);
  });

  test("synthesizes concrete handoff fields for arbitrary app ideas without a named blueprint", () => {
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want a podcast clip generator with transcript search and CSV export",
      researchContext: null,
      chatContext: null,
      queries: ["podcast clip generator transcript search csv export in:name,description,readme"],
      selectedRepo: undefined,
      candidateRepos: [],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("workflow-app");
    expect(blueprint.productThesis).toMatch(/podcast|clip|transcript/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/search|export|review/i);
    expect(blueprint.coreDataObjects.join(" ")).toMatch(/Podcast|Clip|Transcript|CsvExport/);
    expect(blueprint.keyScreens.join(" ")).toMatch(/Podcast|Search|Export/i);
    expect(blueprint.coreDataObjects.join(" ")).not.toMatch(/PrimaryItem|UserInput/);
  });

  test("treats recipe scanner with expenses and CSV as receipt scanner intent", () => {
    const blueprint = buildHandoffBlueprint({
      originalIdea: "I want a recipe scanner that tracks expenses and exports CSV for taxes",
      researchContext: null,
      chatContext: null,
      queries: ["receipt scanner expense tracker csv in:name,description,readme"],
      selectedRepo: undefined,
      candidateRepos: [],
      preferences: undefined
    });

    expect(blueprint.productKind).toBe("receipt-expense");
    expect(blueprint.productThesis).toMatch(/receipt|expense|csv/i);
    expect(blueprint.productThesis).toMatch(/tax prep|receipts/i);
    expect(blueprint.primaryWorkflow.join(" ")).toMatch(/receipt|parsed|expense|CSV/i);
    expect(blueprint.keyScreens.join(" ")).toMatch(/Receipt capture|Parsed receipt review|Expense ledger|CSV export/i);
    expect(blueprint.coreDataObjects).toEqual(expect.arrayContaining(["Receipt", "ReceiptImage", "ParsedReceipt", "ExpenseRecord", "ExpenseCategory", "CsvExport", "LocalBackup"]));
    expect(blueprint.explicitNonGoals.join(" ")).toMatch(/tax filing|OCR|cloud sync/i);
    expect(blueprint.productThesis).not.toMatch(/home cooks|recipe links|grocery-list/i);
    expect(`${blueprint.productThesis} ${blueprint.primaryWorkflow.join(" ")} ${blueprint.coreDataObjects.join(" ")}`).not.toMatch(/receipt, expense, and parsed|taxes who|Recipe|Ingredient|GroceryList|Invoice/i);
    expect(blueprint.coreDataObjects).not.toContain("For");
  });
});
