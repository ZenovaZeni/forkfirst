import { analyzeWithDemo } from "../analysis/demo-analyst";
import type { ClassifiedRepo } from "../analysis/types";
import { auditBuildPackQuality, type BuildPackQualityAudit } from "../build-pack/quality";
import { buildHandoffBlueprint, type HandoffBlueprint, type ProductKind } from "../build-pack/blueprint";
import { buildProjectBuildPack } from "../build-pack/generator";
import type { NormalizedRepo, RepoCategory } from "../github/types";
import { planSearches } from "../search/planner";
import { classifyRepositories } from "../scoring/scoring";
import type { IdeaCheckResult } from "../../types/idea-check";

type LaunchEvalExpected = {
  bestQueryContains: string;
  expectedTopRepo: string;
  expectedTopCategory: RepoCategory | RepoCategory[];
  minFit: number;
  productKind: ProductKind;
  handoffMustContain: string[];
  handoffMustNotContain: string[];
  qualityAuditPass: boolean;
};

export type LaunchEvalCase = {
  id: string;
  category: string;
  prompt: string;
  repos: NormalizedRepo[];
  expected: LaunchEvalExpected;
};

export type LaunchEvalResult = {
  queries: string[];
  repos: ClassifiedRepo[];
  topRepo: ClassifiedRepo | undefined;
  blueprint: HandoffBlueprint;
  markdown: string;
  audit: BuildPackQualityAudit;
};

function repo(overrides: Partial<NormalizedRepo>): NormalizedRepo {
  const fullName = overrides.fullName ?? "example/starter";
  const [owner, name] = fullName.split("/");
  return {
    id: overrides.id ?? Math.floor(Math.random() * 1_000_000),
    owner: overrides.owner ?? owner ?? "example",
    name: overrides.name ?? name ?? "starter",
    fullName,
    url: overrides.url ?? `https://github.com/${fullName}`,
    description: overrides.description ?? "",
    language: overrides.language ?? "TypeScript",
    topics: overrides.topics ?? [],
    stars: overrides.stars ?? 250,
    forks: overrides.forks ?? 25,
    openIssues: overrides.openIssues ?? 3,
    license: overrides.license ?? "MIT",
    pushedAt: overrides.pushedAt ?? "2026-05-01T00:00:00Z",
    createdAt: overrides.createdAt ?? "2025-01-01T00:00:00Z",
    updatedAt: overrides.updatedAt ?? "2026-05-01T00:00:00Z",
    archived: overrides.archived ?? false,
    homepage: overrides.homepage ?? null,
    githubScore: overrides.githubScore,
    readme: overrides.readme ?? {
      excerpt: overrides.description ?? "",
      url: `https://github.com/${fullName}#readme`,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: false,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 82,
      reasons: ["Setup path found", "Examples found"]
    }
  };
}

const genericAiRepo = repo({
  id: 1,
  fullName: "browser-use/browser-use",
  description: "Make websites accessible for AI agents. Automate tasks online with ease.",
  topics: ["ai", "agents", "browser", "automation"],
  stars: 94834,
  forks: 10690,
  readme: {
    excerpt: "Make websites accessible for AI agents. Automate browser tasks and workflows online with ease.",
    url: "https://github.com/browser-use/browser-use#readme",
    hasSetup: true,
    hasExamples: true,
    hasApiDetails: true,
    hasLocalDevelopment: true,
    hasLicenseText: true,
    qualityScore: 100,
    reasons: ["Setup path found", "Examples found"]
  }
});

export const LAUNCH_EVAL_CASES: LaunchEvalCase[] = [
  {
    id: "pokemon-card-collector",
    category: "collectibles",
    prompt: "I want an app like Pokemon Collector that tracks card values and albums",
    repos: [
      repo({
        id: 2,
        fullName: "Git-Romer/pokecollector",
        description: "Self-hosted Pokemon TCG collection manager with prices, binders, wishlist, backups, exports, and TCGdex sync.",
        topics: ["pokemon", "tcg", "collection", "prices", "self-hosted"],
        stars: 180,
        forks: 18,
        license: "AGPL-3.0",
        readme: {
          excerpt: "Search Pokemon cards, manage binders, wishlist cards, pull Cardmarket and TCGPlayer prices, export CSV/PDF, backup and restore collection data.",
          url: "https://github.com/Git-Romer/pokecollector#readme",
          hasSetup: true,
          hasExamples: true,
          hasApiDetails: true,
          hasLocalDevelopment: true,
          hasLicenseText: true,
          qualityScore: 95,
          reasons: ["Setup path found", "Examples found"]
        }
      }),
      repo({
        id: 3,
        fullName: "public-apis/public-apis",
        description: "A collective list of free APIs.",
        topics: ["api", "list", "data"],
        stars: 360000,
        forks: 38000,
        readme: {
          excerpt: "A curated list of free public APIs for developers.",
          url: "https://github.com/public-apis/public-apis#readme",
          hasSetup: false,
          hasExamples: false,
          hasApiDetails: true,
          hasLocalDevelopment: false,
          hasLicenseText: true,
          qualityScore: 70,
          reasons: ["API details found"]
        }
      })
    ],
    expected: {
      bestQueryContains: "pokemon tcg collection manager",
      expectedTopRepo: "Git-Romer/pokecollector",
      expectedTopCategory: ["already_exists", "forkable"],
      minFit: 70,
      productKind: "card-collector",
      handoffMustContain: ["Card", "OwnedCard", "estimated value", "binder"],
      handoffMustNotContain: ["PrimaryItem", "UserInput", "safe to fork", "<a href"],
      qualityAuditPass: true
    }
  },
  {
    id: "grocery-app",
    category: "local commerce",
    prompt: "I want to make a grocery app",
    repos: [
      genericAiRepo,
      repo({
        id: 4,
        fullName: "plutonicdev/GroceryStore",
        description: "Grocery store Android app UI template for grocery shopping, supermarket products, store orders, cart, and checkout.",
        topics: ["grocery", "shopping", "store", "android", "template"],
        stars: 51,
        forks: 24,
        license: null,
        readme: {
          excerpt: "Grocery app template for shopping list, grocery products, supermarket store pages, cart, checkout, and order screens.",
          url: "https://github.com/plutonicdev/GroceryStore#readme",
          hasSetup: true,
          hasExamples: true,
          hasApiDetails: false,
          hasLocalDevelopment: true,
          hasLicenseText: false,
          qualityScore: 45,
          reasons: ["Setup path found"]
        }
      })
    ],
    expected: {
      bestQueryContains: "grocery shopping list app",
      expectedTopRepo: "plutonicdev/GroceryStore",
      expectedTopCategory: ["forkable", "reference"],
      minFit: 70,
      productKind: "grocery-shopping",
      handoffMustContain: ["GroceryItem", "ShoppingList", "export"],
      handoffMustNotContain: ["browser-use", "recipe bookmark", "PrimaryItem"],
      qualityAuditPass: true
    }
  },
  {
    id: "cleaning-company-ops",
    category: "service business",
    prompt: "I want an app for a cleaning company to manage quotes, jobs, crews, and follow-ups",
    repos: [
      repo({
        id: 5,
        fullName: "cleanops/cleaning-crm",
        description: "Cleaning business management app for quotes, jobs, crew scheduling, customer records, service checklists, and follow-ups.",
        topics: ["cleaning", "crm", "quotes", "jobs", "scheduling"],
        stars: 420,
        forks: 44,
        readme: {
          excerpt: "Manage cleaning quotes, convert accepted quotes to jobs, assign crews, track service checklists, completion notes, recurring schedules, and follow-up tasks.",
          url: "https://github.com/cleanops/cleaning-crm#readme",
          hasSetup: true,
          hasExamples: true,
          hasApiDetails: true,
          hasLocalDevelopment: true,
          hasLicenseText: true,
          qualityScore: 90,
          reasons: ["Setup path found", "Examples found"]
        }
      }),
      repo({
        id: 6,
        fullName: "invoicerr-app/invoicerr",
        description: "Open-source invoicing application for quotes, invoices, payments, and signatures.",
        topics: ["invoices", "quotes", "payments"],
        stars: 688,
        forks: 47,
        license: "AGPL-3.0"
      })
    ],
    expected: {
      bestQueryContains: "cleaning business management app",
      expectedTopRepo: "cleanops/cleaning-crm",
      expectedTopCategory: "already_exists",
      minFit: 70,
      productKind: "service-business-crm",
      handoffMustContain: ["Quote", "Job", "Crew", "FollowUpTask"],
      handoffMustNotContain: ["PrimaryItem", "UserInput", "one working product loop"],
      qualityAuditPass: true
    }
  },
  {
    id: "salon-booking",
    category: "appointments",
    prompt: "I want to build a booking app for a small salon",
    repos: [
      repo({
        id: 7,
        fullName: "thunderbird/appointment",
        description: "Invite others to grab times on your calendar. Choose a date. Make appointments as easy as it gets.",
        topics: ["appointment", "booking", "calendar"],
        stars: 535,
        forks: 20,
        language: "Python",
        license: "MPL-2.0",
        readme: {
          excerpt: "Appointment booking, booker pages, scheduling flows, calendar slots, Docker setup, and subscriber dashboard.",
          url: "https://github.com/thunderbird/appointment#readme",
          hasSetup: true,
          hasExamples: true,
          hasApiDetails: false,
          hasLocalDevelopment: true,
          hasLicenseText: true,
          qualityScore: 86,
          reasons: ["Setup path found", "Examples found"]
        }
      })
    ],
    expected: {
      bestQueryContains: "salon booking app",
      expectedTopRepo: "thunderbird/appointment",
      expectedTopCategory: ["forkable", "reference"],
      minFit: 55,
      productKind: "appointment-booking",
      handoffMustContain: ["Service", "StaffMember", "Appointment", "availability"],
      handoffMustNotContain: ["PrimaryItem", "UserInput", "safe to fork"],
      qualityAuditPass: true
    }
  },
  {
    id: "realtor-leads",
    category: "real estate",
    prompt: "I want an app that helps realtors scrape leads and organize follow-ups",
    repos: [
      repo({
        id: 8,
        fullName: "omkarcloud/google-maps-scraper",
        description: "Google Maps Scraper and lead generation tool. Extract business emails, phone numbers, websites, and social profiles.",
        topics: ["scraper", "lead-generation", "real-estate"],
        stars: 2665,
        forks: 423,
        language: "Mixed",
        readme: {
          excerpt: "Extract businesses, phone numbers, websites, emails, and social profiles for lead research. Includes enrichment features and API access.",
          url: "https://github.com/omkarcloud/google-maps-scraper#readme",
          hasSetup: true,
          hasExamples: true,
          hasApiDetails: true,
          hasLocalDevelopment: true,
          hasLicenseText: true,
          qualityScore: 88,
          reasons: ["Setup path found", "API details found"]
        }
      }),
      genericAiRepo
    ],
    expected: {
      bestQueryContains: "real estate lead generation",
      expectedTopRepo: "omkarcloud/google-maps-scraper",
      expectedTopCategory: ["forkable", "reference"],
      minFit: 40,
      productKind: "real-estate-leads",
      handoffMustContain: ["LeadSource", "Qualification", "FollowUpTask", "consent"],
      handoffMustNotContain: ["image prompt", "listing hero", "PrimaryItem"],
      qualityAuditPass: true
    }
  },
  {
    id: "shopify-profit-dashboard",
    category: "ecommerce",
    prompt: "I want a dashboard for tracking Shopify store profit, ad spend, and inventory",
    repos: [
      repo({
        id: 9,
        fullName: "openthc/pos",
        description: "Software solutions for retail POS, CRM, delivery, ordering, inventory, and reporting.",
        topics: ["retail", "pos", "inventory", "reporting"],
        stars: 1187,
        forks: 170,
        language: "Mixed",
        license: "CC0-1.0",
        readme: {
          excerpt: "Retail POS, product inventory, delivery, ordering, CRM, margin reporting, and store operations.",
          url: "https://github.com/openthc/pos#readme",
          hasSetup: true,
          hasExamples: true,
          hasApiDetails: false,
          hasLocalDevelopment: true,
          hasLicenseText: true,
          qualityScore: 80,
          reasons: ["Setup path found"]
        }
      })
    ],
    expected: {
      bestQueryContains: "shopify analytics dashboard",
      expectedTopRepo: "openthc/pos",
      expectedTopCategory: ["forkable", "reference"],
      minFit: 20,
      productKind: "ecommerce-dashboard",
      handoffMustContain: ["ProfitMetric", "AdSpend", "InventoryItem", "margin"],
      handoffMustNotContain: ["LeadSource", "Qualification", "PrimaryItem"],
      qualityAuditPass: true
    }
  },
  {
    id: "cat-id-app",
    category: "pets",
    prompt: "cat id app",
    repos: [
      repo({
        id: 10,
        fullName: "petvision/cat-breed-id",
        description: "Cat breed identifier app with photo upload, pet profiles, breed estimates, traits, and saved cats.",
        topics: ["cat", "breed", "pet", "image-recognition"],
        stars: 240,
        forks: 22,
        readme: {
          excerpt: "Upload a cat photo, estimate breed traits, save cat profiles, add notes, and export pet records.",
          url: "https://github.com/petvision/cat-breed-id#readme",
          hasSetup: true,
          hasExamples: true,
          hasApiDetails: true,
          hasLocalDevelopment: true,
          hasLicenseText: true,
          qualityScore: 82,
          reasons: ["Setup path found"]
        }
      }),
      repo({
        id: 11,
        fullName: "sharkdp/bat",
        description: "A cat(1) clone with wings.",
        topics: ["cli", "terminal", "cat"],
        stars: 58947,
        forks: 1564,
        language: "Rust",
        license: "Apache-2.0"
      })
    ],
    expected: {
      bestQueryContains: "cat breed identifier app",
      expectedTopRepo: "petvision/cat-breed-id",
      expectedTopCategory: ["already_exists", "forkable"],
      minFit: 70,
      productKind: "pet-identification",
      handoffMustContain: ["CatProfile", "Photo", "BreedEstimate"],
      handoffMustNotContain: ["cat\\(1\\)", "PrimaryItem", "UserInput"],
      qualityAuditPass: true
    }
  },
  {
    id: "kids-sports-schedules",
    category: "family",
    prompt: "I want to build a thing that helps parents organize kids sports schedules",
    repos: [
      repo({
        id: 12,
        fullName: "teamup/youth-sports-scheduler",
        description: "Youth sports team schedule app for parents, coaches, games, practices, reminders, and family calendar exports.",
        topics: ["sports", "schedule", "parents", "team", "calendar"],
        stars: 310,
        forks: 33,
        readme: {
          excerpt: "Create children and teams, add games and practices, notify parents, export schedules to calendars, and track coach updates.",
          url: "https://github.com/teamup/youth-sports-scheduler#readme",
          hasSetup: true,
          hasExamples: true,
          hasApiDetails: true,
          hasLocalDevelopment: true,
          hasLicenseText: true,
          qualityScore: 86,
          reasons: ["Setup path found", "Examples found"]
        }
      }),
      repo({
        id: 13,
        fullName: "freeCodeCamp/awesome-quincy-larson-emails",
        description: "Archive of emails sent weekly.",
        topics: ["emails", "archive"],
        stars: 1180,
        forks: 160,
        language: "Python"
      })
    ],
    expected: {
      bestQueryContains: "youth sports team schedule app",
      expectedTopRepo: "teamup/youth-sports-scheduler",
      expectedTopCategory: ["already_exists", "forkable"],
      minFit: 70,
      productKind: "sports-schedule",
      handoffMustContain: ["Child", "Team", "SportsEvent", "Reminder"],
      handoffMustNotContain: ["freeCodeCamp", "Quincy", "PrimaryItem", "UserInput"],
      qualityAuditPass: true
    }
  }
];

export function runLaunchEvalCase(evalCase: LaunchEvalCase): LaunchEvalResult {
  const queries = planSearches(evalCase.prompt);
  const repos = classifyRepositories(evalCase.repos, evalCase.prompt);
  const analysis = analyzeWithDemo(evalCase.prompt, repos);
  const result: IdeaCheckResult = {
    id: evalCase.id,
    prompt: evalCase.prompt,
    createdAt: "2026-05-21T00:00:00.000Z",
    queries,
    warnings: [],
    ...analysis
  };
  const topRepo = result.repos[0];
  const blueprint = buildHandoffBlueprint({
    originalIdea: evalCase.prompt,
    researchContext: null,
    chatContext: null,
    queries,
    selectedRepo: topRepo,
    candidateRepos: result.repos,
    preferences: undefined
  });
  const markdown = buildProjectBuildPack(result, "codex", topRepo);
  const audit = auditBuildPackQuality({ idea: evalCase.prompt, markdown });

  return {
    queries,
    repos: result.repos,
    topRepo,
    blueprint,
    markdown,
    audit
  };
}
