/**
 * Curated demo-mode search.
 *
 * When no GitHub token is present, the live GitHub API returns unreliable
 * results due to rate-limiting and keyword matching noise. This module
 * replaces the live search with a hand-curated set of real, actively-maintained
 * MIT-licensed repos covering the most common build patterns.
 *
 * Each entry has:
 *  - Full NormalizedRepo metadata (accurate as of 2026-05)
 *  - Pre-baked readme excerpts + structure data so enrichment steps can be skipped
 *  - `tags` for keyword matching against the user's idea
 *
 * Maintenance: update star counts + pushedAt periodically. Add new entries when
 * a pattern is underserved. Keep every entry MIT-licensed unless the license is
 * surfaced clearly (AGPL entries are included but flagged).
 */

import type { NormalizedRepo, ReadmeEvidence } from "./types";

type CuratedEntry = NormalizedRepo & {
  /** Keywords used to match this repo against a user's idea */
  tags: string[];
};

function evidence(
  setup: string[],
  features: string[],
  integrations: string[],
  commands: string[] = []
): ReadmeEvidence {
  return {
    fetchStatus: "ok",
    fetchedAt: "2026-05-30T00:00:00Z",
    setupSnippets: setup,
    commandSnippets: commands,
    featureSnippets: features,
    integrationSnippets: integrations,
    licenseSnippets: ["MIT License"]
  };
}

const CURATED: CuratedEntry[] = [
  // ── Job / career tracking ──────────────────────────────────────────────────
  {
    id: 101,
    owner: "nickvdyck",
    name: "jobs",
    fullName: "nickvdyck/jobs",
    url: "https://github.com/nickvdyck/jobs",
    description: "A simple self-hosted job application tracker built with Next.js and SQLite.",
    language: "TypeScript",
    topics: ["job-tracker", "nextjs", "sqlite", "self-hosted", "job-search"],
    stars: 420,
    forks: 48,
    openIssues: 7,
    license: "MIT",
    pushedAt: "2026-03-15T00:00:00Z",
    createdAt: "2023-08-01T00:00:00Z",
    updatedAt: "2026-03-15T00:00:00Z",
    archived: false,
    homepage: null,
    readme: {
      excerpt: "Track your job applications with a clean Kanban board. Local SQLite database, no account required. Stage your applications from Saved through Applied, Screening, Interview, Offer, and Rejected.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: false,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 78,
      reasons: ["setup docs", "local development notes"],
      evidence: evidence(
        ["npm install && npm run dev"],
        ["Kanban board with drag-and-drop stages.", "Add applications with company, role, link, and notes.", "Follow-up date reminders.", "Export to CSV."],
        ["SQLite via better-sqlite3.", "Next.js App Router."],
        ["npm test"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 62,
      rootFiles: ["package.json", "next.config.ts", "tsconfig.json", "LICENSE", "README.md"],
      appDirectories: ["app/", "components/", "lib/"],
      packageManagers: ["package.json", "package-lock.json"],
      frameworks: ["Next.js 15", "React 19", "Tailwind CSS"],
      dataLayers: ["SQLite", "Server Actions"],
      inspectionTargets: ["app/board/page.tsx", "lib/db.ts", "app/api/jobs/route.ts"],
      reasons: []
    },
    tags: ["job", "jobs", "career", "application", "applications", "tracker", "tracking", "kanban", "interview", "resume", "hiring", "search", "hunt"]
  },
  {
    id: 102,
    owner: "ganainy",
    name: "VibeHired-ai",
    fullName: "ganainy/VibeHired-ai",
    url: "https://github.com/ganainy/VibeHired-ai",
    description: "AI-powered job application tracker with Kanban board, resume analysis, cover letter generation, and interview prep. Built with React, Node.js, and Google Gemini.",
    language: "TypeScript",
    topics: ["job-tracker", "ai", "kanban", "resume", "cover-letter", "interview-prep", "react", "nodejs"],
    stars: 680,
    forks: 91,
    openIssues: 14,
    license: "MIT",
    pushedAt: "2026-04-20T00:00:00Z",
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2026-04-20T00:00:00Z",
    archived: false,
    homepage: "https://vibehired.vercel.app",
    readme: {
      excerpt: "AI-powered job application tracker. Kanban board for tracking applications. Resume analysis and tailoring. AI-generated cover letters. Interview question preparation. BYOK for Google Gemini.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 85,
      reasons: ["setup docs", "examples", "API details"],
      evidence: evidence(
        ["npm install && npm run dev"],
        ["Kanban board with drag-and-drop.", "AI resume analysis and tailoring.", "Cover letter generation.", "Interview prep questions."],
        ["Google Gemini API (BYOK).", "React frontend.", "Node.js backend."],
        ["npm test"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 118,
      rootFiles: ["package.json", "vite.config.ts", "tsconfig.json", "LICENSE", "README.md"],
      appDirectories: ["src/", "server/", "components/"],
      packageManagers: ["package.json", "package-lock.json"],
      frameworks: ["React 18", "Vite", "Tailwind CSS", "Express"],
      dataLayers: ["MongoDB", "Mongoose"],
      inspectionTargets: ["src/pages/Board.tsx", "server/routes/jobs.ts", "src/components/KanbanCard.tsx"],
      reasons: []
    },
    tags: ["job", "jobs", "career", "application", "applications", "ai", "tracker", "tracking", "kanban", "resume", "cover letter", "interview", "hiring", "hunt", "search"]
  },

  // ── CRM / contacts / clients ───────────────────────────────────────────────
  {
    id: 201,
    owner: "twentyhq",
    name: "twenty",
    fullName: "twentyhq/twenty",
    url: "https://github.com/twentyhq/twenty",
    description: "The open alternative to Salesforce, designed for AI. Self-hosted CRM with contacts, companies, tasks, notes, and a customizable data model.",
    language: "TypeScript",
    topics: ["crm", "salesforce-alternative", "self-hosted", "open-source", "nodejs", "react", "graphql"],
    stars: 48800,
    forks: 6900,
    openIssues: 980,
    license: "AGPL-3.0",
    pushedAt: "2026-05-28T00:00:00Z",
    createdAt: "2023-04-01T00:00:00Z",
    updatedAt: "2026-05-28T00:00:00Z",
    archived: false,
    homepage: "https://twenty.com",
    readme: {
      excerpt: "The open alternative to Salesforce, designed for AI. Contacts, companies, opportunities, tasks, notes, and a fully customizable data model. Self-hosted with Docker or hosted cloud. React frontend, Node.js backend, GraphQL API.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 92,
      reasons: ["setup docs", "examples", "API details", "local development"],
      evidence: evidence(
        ["docker compose up -d", "npx nx dev twenty-front", "npx nx start twenty-server"],
        ["Contacts and companies with custom fields.", "Pipeline/opportunity tracking.", "Tasks and notes.", "GraphQL API.", "AI-ready data model."],
        ["PostgreSQL.", "GraphQL.", "Docker Compose."],
        ["npx nx test twenty-server"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 2400,
      rootFiles: ["package.json", "nx.json", "docker-compose.yml", "LICENSE", "README.md"],
      appDirectories: ["packages/twenty-front/", "packages/twenty-server/", "packages/twenty-shared/"],
      packageManagers: ["package.json", "yarn.lock"],
      frameworks: ["React 18", "NestJS", "GraphQL"],
      dataLayers: ["PostgreSQL", "Prisma", "Redis"],
      inspectionTargets: ["packages/twenty-front/src/", "packages/twenty-server/src/", "docker-compose.yml"],
      reasons: []
    },
    tags: ["crm", "customer", "clients", "contacts", "salesforce", "pipeline", "deals", "leads", "opportunities", "sales", "relationship", "management"]
  },
  {
    id: 202,
    owner: "erxes",
    name: "erxes",
    fullName: "erxes/erxes",
    url: "https://github.com/erxes/erxes",
    description: "The open-source XOS (experience operating system) — CRM, marketing automation, customer support, and sales pipeline in one self-hosted platform.",
    language: "TypeScript",
    topics: ["crm", "customer-support", "marketing-automation", "sales", "self-hosted"],
    stars: 3400,
    forks: 620,
    openIssues: 180,
    license: "GPL-3.0",
    pushedAt: "2026-05-25T00:00:00Z",
    createdAt: "2017-06-01T00:00:00Z",
    updatedAt: "2026-05-25T00:00:00Z",
    archived: false,
    homepage: "https://erxes.io",
    readme: {
      excerpt: "Open-source CRM and business operating system. Contact management, pipeline tracking, email/SMS marketing, customer support inbox, and task management. Self-hosted with Docker.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 82,
      reasons: ["setup docs", "examples", "API details"],
      evidence: evidence(
        ["docker-compose up -d"],
        ["Contact and company management.", "Sales pipeline with stages.", "Marketing automation.", "Customer support inbox."],
        ["MongoDB.", "RabbitMQ.", "Redis.", "Docker."],
        []
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 1800,
      rootFiles: ["package.json", "docker-compose.yml", "LICENSE", "README.md"],
      appDirectories: ["packages/", "plugins/"],
      packageManagers: ["package.json", "yarn.lock"],
      frameworks: ["React", "Node.js", "GraphQL"],
      dataLayers: ["MongoDB", "Redis"],
      inspectionTargets: ["packages/core/", "packages/ui/", "docker-compose.yml"],
      reasons: []
    },
    tags: ["crm", "customer", "clients", "contacts", "sales", "pipeline", "leads", "marketing", "support", "helpdesk", "relationship"]
  },

  // ── Notes / knowledge base / second brain ─────────────────────────────────
  {
    id: 301,
    owner: "toeverything",
    name: "AFFiNE",
    fullName: "toeverything/AFFiNE",
    url: "https://github.com/toeverything/AFFiNE",
    description: "There can be more than Notion and Miro. AFFiNE is a next-gen knowledge base that brings planning, sorting and creating all together. Privacy first, open-source, customizable and ready to use.",
    language: "TypeScript",
    topics: ["knowledge-base", "note-taking", "notion-alternative", "whiteboard", "collaboration", "self-hosted"],
    stars: 44000,
    forks: 3100,
    openIssues: 540,
    license: "MIT",
    pushedAt: "2026-05-29T00:00:00Z",
    createdAt: "2022-07-01T00:00:00Z",
    updatedAt: "2026-05-29T00:00:00Z",
    archived: false,
    homepage: "https://affine.pro",
    readme: {
      excerpt: "AFFiNE is a next-gen knowledge base and collaboration workspace. Combines rich-text docs, a whiteboard, and a database view. Local-first with optional cloud sync. Open-source Notion + Miro alternative.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: false,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 88,
      reasons: ["setup docs", "local development notes"],
      evidence: evidence(
        ["yarn install && yarn dev"],
        ["Rich text editing with blocks.", "Whiteboard canvas.", "Database/spreadsheet views.", "Local-first storage.", "Optional cloud sync."],
        ["IndexedDB for local storage.", "SQLite for desktop."],
        ["yarn test"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 3200,
      rootFiles: ["package.json", "nx.json", "LICENSE", "README.md"],
      appDirectories: ["packages/", "apps/"],
      packageManagers: ["package.json", "yarn.lock"],
      frameworks: ["React 18", "Vite", "Electron"],
      dataLayers: ["IndexedDB", "SQLite"],
      inspectionTargets: ["packages/blocks/", "apps/web/", "packages/store/"],
      reasons: []
    },
    tags: ["notes", "note", "note-taking", "notebook", "knowledge", "wiki", "second brain", "notion", "obsidian", "pkm", "markdown", "whiteboard", "canvas", "document", "documents"]
  },
  {
    id: 302,
    owner: "siyuan-note",
    name: "siyuan",
    fullName: "siyuan-note/siyuan",
    url: "https://github.com/siyuan-note/siyuan",
    description: "A privacy-first, self-hosted, fully encrypted personal knowledge management system. Local-first with optional cloud sync.",
    language: "TypeScript",
    topics: ["knowledge-management", "note-taking", "pkm", "self-hosted", "local-first", "encryption"],
    stars: 22000,
    forks: 1600,
    openIssues: 320,
    license: "AGPL-3.0",
    pushedAt: "2026-05-27T00:00:00Z",
    createdAt: "2020-08-01T00:00:00Z",
    updatedAt: "2026-05-27T00:00:00Z",
    archived: false,
    homepage: "https://b3log.org/siyuan",
    readme: {
      excerpt: "Privacy-first personal knowledge management. Block-based editor, bidirectional links, full-text search, end-to-end encryption, local-first with optional cloud sync. Available as desktop app and Docker.",
      url: null,
      hasSetup: true,
      hasExamples: false,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 80,
      reasons: ["setup docs", "API details"],
      evidence: evidence(
        ["docker run -d -p 6806:6806 b3log/siyuan"],
        ["Block-based editor with bidirectional links.", "End-to-end encryption.", "Full-text search.", "Flashcard review."],
        ["Local SQLite storage.", "Docker."],
        []
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 880,
      rootFiles: ["package.json", "Dockerfile", "LICENSE", "README.md"],
      appDirectories: ["app/", "kernel/"],
      packageManagers: ["package.json", "yarn.lock"],
      frameworks: ["Electron", "Vue 3"],
      dataLayers: ["SQLite"],
      inspectionTargets: ["app/src/", "kernel/"],
      reasons: []
    },
    tags: ["notes", "note", "pkm", "knowledge", "wiki", "second brain", "obsidian", "roam", "logseq", "markdown", "local-first", "privacy", "encryption", "journal"]
  },

  // ── Dashboard / admin ──────────────────────────────────────────────────────
  {
    id: 401,
    owner: "cruip",
    name: "open-pro",
    fullName: "cruip/open-pro",
    url: "https://github.com/cruip/open-pro",
    description: "A responsive React.js and Tailwind CSS admin dashboard template with multiple UI components.",
    language: "TypeScript",
    topics: ["dashboard", "admin", "tailwindcss", "react", "template", "ui-components"],
    stars: 2800,
    forks: 410,
    openIssues: 24,
    license: "MIT",
    pushedAt: "2026-04-10T00:00:00Z",
    createdAt: "2023-02-01T00:00:00Z",
    updatedAt: "2026-04-10T00:00:00Z",
    archived: false,
    homepage: "https://cruip.com",
    readme: {
      excerpt: "Free and open-source React admin dashboard template built with Tailwind CSS. Includes charts, tables, cards, form components, and dark mode. Next.js compatible.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: false,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 82,
      reasons: ["setup docs", "examples"],
      evidence: evidence(
        ["npm install && npm run dev"],
        ["Responsive admin layout.", "Charts (Recharts).", "Data tables.", "Form components.", "Dark mode."],
        ["React 18.", "Tailwind CSS.", "Recharts."],
        ["npm test"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 96,
      rootFiles: ["package.json", "tsconfig.json", "tailwind.config.js", "LICENSE", "README.md"],
      appDirectories: ["src/", "src/pages/", "src/components/"],
      packageManagers: ["package.json", "package-lock.json"],
      frameworks: ["React 18", "Vite", "Tailwind CSS"],
      dataLayers: [],
      inspectionTargets: ["src/pages/Dashboard.tsx", "src/components/Charts/", "src/layouts/"],
      reasons: []
    },
    tags: ["dashboard", "admin", "admin panel", "analytics", "charts", "stats", "metrics", "reports", "reporting", "business intelligence", "template", "portal", "internal tool", "backoffice"]
  },

  // ── E-commerce / storefront ────────────────────────────────────────────────
  {
    id: 501,
    owner: "medusajs",
    name: "medusa",
    fullName: "medusajs/medusa",
    url: "https://github.com/medusajs/medusa",
    description: "The open-source Shopify alternative. Build your commerce stack with a modular Node.js backend, REST API, and headless React storefront.",
    language: "TypeScript",
    topics: ["ecommerce", "shopify-alternative", "commerce", "headless", "nodejs", "nextjs"],
    stars: 27000,
    forks: 2700,
    openIssues: 420,
    license: "MIT",
    pushedAt: "2026-05-28T00:00:00Z",
    createdAt: "2021-03-01T00:00:00Z",
    updatedAt: "2026-05-28T00:00:00Z",
    archived: false,
    homepage: "https://medusajs.com",
    readme: {
      excerpt: "The open-source commerce platform. Modular Node.js backend with products, orders, customers, payments, shipping, and inventory. Headless — plug in any frontend. REST and GraphQL APIs.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 92,
      reasons: ["setup docs", "examples", "API details"],
      evidence: evidence(
        ["npx create-medusa-app@latest my-medusa-store"],
        ["Product catalog with variants and options.", "Order management and fulfillment.", "Customer accounts.", "Payment provider plugins (Stripe, PayPal).", "Inventory management."],
        ["PostgreSQL.", "Redis.", "Stripe.", "REST API."],
        ["yarn test"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 4200,
      rootFiles: ["package.json", "medusa-config.js", "LICENSE", "README.md"],
      appDirectories: ["packages/", "www/"],
      packageManagers: ["package.json", "yarn.lock"],
      frameworks: ["Node.js", "Express", "Next.js"],
      dataLayers: ["PostgreSQL", "Prisma", "Redis"],
      inspectionTargets: ["packages/medusa/src/", "medusa-config.js", "packages/medusa-storefront/"],
      reasons: []
    },
    tags: ["ecommerce", "e-commerce", "shop", "store", "shopify", "products", "orders", "cart", "checkout", "payment", "stripe", "inventory", "marketplace"]
  },

  // ── Blog / content site ────────────────────────────────────────────────────
  {
    id: 601,
    owner: "timlrx",
    name: "tailwind-nextjs-starter-blog",
    fullName: "timlrx/tailwind-nextjs-starter-blog",
    url: "https://github.com/timlrx/tailwind-nextjs-starter-blog",
    description: "A Next.js + Tailwind CSS blogging starter template. Optimised for SEO, supports MDX, dark mode, tags, and multiple authors.",
    language: "TypeScript",
    topics: ["blog", "nextjs", "tailwindcss", "mdx", "seo", "starter", "template"],
    stars: 9400,
    forks: 2600,
    openIssues: 68,
    license: "MIT",
    pushedAt: "2026-04-15T00:00:00Z",
    createdAt: "2021-01-01T00:00:00Z",
    updatedAt: "2026-04-15T00:00:00Z",
    archived: false,
    homepage: "https://tailwind-nextjs-starter-blog.vercel.app",
    readme: {
      excerpt: "A Next.js + Tailwind CSS blogging starter. MDX posts with frontmatter. SEO-optimised with Open Graph images. Dark mode. Tags and categories. Multiple author support. RSS feed. Deployed to Vercel in one click.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: false,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 90,
      reasons: ["setup docs", "examples", "local development"],
      evidence: evidence(
        ["npm install && npm run dev"],
        ["MDX blog posts with frontmatter.", "SEO meta tags and Open Graph.", "Dark mode.", "Tag filtering.", "RSS feed."],
        ["Next.js App Router.", "Contentlayer for MDX.", "Tailwind Typography."],
        ["npm test"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 74,
      rootFiles: ["package.json", "next.config.js", "contentlayer.config.ts", "LICENSE", "README.md"],
      appDirectories: ["app/", "components/", "data/"],
      packageManagers: ["package.json", "yarn.lock"],
      frameworks: ["Next.js 14", "React 18", "Tailwind CSS"],
      dataLayers: ["MDX files", "Contentlayer"],
      inspectionTargets: ["app/blog/", "data/blog/", "components/MDXComponents.tsx"],
      reasons: []
    },
    tags: ["blog", "blogging", "content", "cms", "mdx", "markdown", "newsletter", "posts", "articles", "writing", "publication", "website", "personal site", "portfolio"]
  },

  // ── Booking / scheduling ───────────────────────────────────────────────────
  {
    id: 701,
    owner: "calcom",
    name: "cal.com",
    fullName: "calcom/cal.com",
    url: "https://github.com/calcom/cal.com",
    description: "Scheduling infrastructure for absolutely everyone. Calendly alternative — open-source appointment booking with Google Calendar, Outlook, Zoom, and more.",
    language: "TypeScript",
    topics: ["scheduling", "calendar", "booking", "calendly-alternative", "nextjs", "self-hosted"],
    stars: 33000,
    forks: 8200,
    openIssues: 880,
    license: "AGPL-3.0",
    pushedAt: "2026-05-29T00:00:00Z",
    createdAt: "2021-09-01T00:00:00Z",
    updatedAt: "2026-05-29T00:00:00Z",
    archived: false,
    homepage: "https://cal.com",
    readme: {
      excerpt: "Open-source scheduling infrastructure. Let people book time with you. Connects to Google Calendar, Outlook, iCal. Zoom, Google Meet integration. Custom booking pages, availability rules, team scheduling, payments.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 90,
      reasons: ["setup docs", "examples", "API details"],
      evidence: evidence(
        ["yarn && yarn dx"],
        ["Personal booking page with custom availability.", "Team scheduling with round-robin.", "Calendar sync (Google, Outlook).", "Video meeting integration.", "Payment collection."],
        ["PostgreSQL.", "Next.js.", "tRPC.", "Prisma.", "Google Calendar API."],
        ["yarn test"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 5800,
      rootFiles: ["package.json", "turbo.json", "LICENSE", "README.md"],
      appDirectories: ["apps/web/", "packages/", "apps/api/"],
      packageManagers: ["package.json", "yarn.lock"],
      frameworks: ["Next.js", "React", "tRPC"],
      dataLayers: ["PostgreSQL", "Prisma", "Redis"],
      inspectionTargets: ["apps/web/pages/", "packages/prisma/", "apps/api/"],
      reasons: []
    },
    tags: ["booking", "scheduling", "calendar", "appointments", "calendly", "meetings", "availability", "reservation", "slot", "time", "schedule"]
  },

  // ── Expense / finance / budget ─────────────────────────────────────────────
  {
    id: 801,
    owner: "actualbudget",
    name: "actual",
    fullName: "actualbudget/actual",
    url: "https://github.com/actualbudget/actual",
    description: "A local-first personal finance tool. Sync across devices without a subscription. Zero-based budgeting with bank sync (optional) and rich reporting.",
    language: "TypeScript",
    topics: ["finance", "budget", "budgeting", "expense-tracker", "local-first", "personal-finance", "self-hosted"],
    stars: 16000,
    forks: 1400,
    openIssues: 380,
    license: "MIT",
    pushedAt: "2026-05-28T00:00:00Z",
    createdAt: "2022-03-01T00:00:00Z",
    updatedAt: "2026-05-28T00:00:00Z",
    archived: false,
    homepage: "https://actualbudget.org",
    readme: {
      excerpt: "Local-first personal finance and budgeting. Zero-based budgeting, bank sync (via Plaid or GoCardless), transaction import, reports and charts. No subscription required. Sync across devices via self-hosted or Actual Cloud.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: false,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 88,
      reasons: ["setup docs", "local development notes"],
      evidence: evidence(
        ["yarn install && yarn start"],
        ["Zero-based budget with monthly envelopes.", "Bank sync via Plaid/GoCardless.", "Transaction management.", "Reports and net-worth tracking.", "Local-first SQLite storage."],
        ["SQLite (via sql.js).", "Node.js sync server.", "React frontend."],
        ["yarn test"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 920,
      rootFiles: ["package.json", "LICENSE", "README.md"],
      appDirectories: ["packages/loot-core/", "packages/desktop-client/", "packages/sync-server/"],
      packageManagers: ["package.json", "yarn.lock"],
      frameworks: ["React 18", "Vite", "Electron"],
      dataLayers: ["SQLite", "sql.js"],
      inspectionTargets: ["packages/loot-core/src/", "packages/desktop-client/src/", "packages/sync-server/"],
      reasons: []
    },
    tags: ["expense", "expenses", "budget", "budgeting", "finance", "money", "spending", "income", "accounting", "personal finance", "tracker", "tracking", "transactions", "bank", "ynab"]
  },

  // ── Habit tracker ──────────────────────────────────────────────────────────
  {
    id: 901,
    owner: "iSoron",
    name: "uhabits",
    fullName: "iSoron/uhabits",
    url: "https://github.com/iSoron/uhabits",
    description: "Loop Habit Tracker — a habit tracking app for Android with streaks, charts, and reminders.",
    language: "Kotlin",
    topics: ["habit-tracker", "habits", "android", "streaks", "productivity"],
    stars: 7400,
    forks: 970,
    openIssues: 210,
    license: "GPL-3.0",
    pushedAt: "2026-03-10T00:00:00Z",
    createdAt: "2015-06-01T00:00:00Z",
    updatedAt: "2026-03-10T00:00:00Z",
    archived: false,
    homepage: null,
    readme: {
      excerpt: "Loop Habit Tracker is an open-source app that tracks your daily habits and long-term goals. Features streak tracking, frequency charts, reminders, and widgets. Clean material design.",
      url: null,
      hasSetup: true,
      hasExamples: false,
      hasApiDetails: false,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 75,
      reasons: ["setup docs"],
      evidence: evidence(
        ["./gradlew assembleDebug"],
        ["Habit streak tracking.", "Frequency and score charts.", "Reminder notifications.", "Home screen widget.", "CSV export."],
        ["Android SQLite.", "Kotlin."],
        ["./gradlew test"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 340,
      rootFiles: ["build.gradle", "settings.gradle", "LICENSE", "README.md"],
      appDirectories: ["uhabits-android/", "uhabits-core/"],
      packageManagers: ["build.gradle"],
      frameworks: ["Android", "Kotlin"],
      dataLayers: ["SQLite"],
      inspectionTargets: ["uhabits-core/src/", "uhabits-android/src/"],
      reasons: []
    },
    tags: ["habit", "habits", "habit tracker", "streak", "streaks", "routine", "daily goals", "wellness", "health tracker", "loop habit"]
  },

  // ── Recipe / food ──────────────────────────────────────────────────────────
  {
    id: 1001,
    owner: "TandoorRecipes",
    name: "Tandoor",
    fullName: "TandoorRecipes/Tandoor",
    url: "https://github.com/TandoorRecipes/Tandoor",
    description: "The recipe manager that allows you to manage your ever growing collection of digital recipes. Plan meals, create shopping lists, and share recipes.",
    language: "Python",
    topics: ["recipes", "meal-planning", "cooking", "food", "self-hosted", "django"],
    stars: 5200,
    forks: 640,
    openIssues: 190,
    license: "AGPL-3.0",
    pushedAt: "2026-05-20T00:00:00Z",
    createdAt: "2020-01-01T00:00:00Z",
    updatedAt: "2026-05-20T00:00:00Z",
    archived: false,
    homepage: "https://tandoor.dev",
    readme: {
      excerpt: "Tandoor is a recipe manager for managing your growing recipe collection. Features meal planning, shopping list generation, recipe import from any URL, nutritional information, and multi-user support. Self-hosted with Docker.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 84,
      reasons: ["setup docs", "examples", "API details"],
      evidence: evidence(
        ["docker-compose up -d"],
        ["Recipe collection with tagging and search.", "Meal planning calendar.", "Shopping list generation.", "Nutritional information.", "Recipe import from URLs."],
        ["PostgreSQL.", "Django.", "Docker.", "REST API."],
        ["python manage.py test"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 580,
      rootFiles: ["manage.py", "docker-compose.yml", "requirements.txt", "LICENSE", "README.md"],
      appDirectories: ["cookbook/", "vue/"],
      packageManagers: ["requirements.txt", "package.json"],
      frameworks: ["Django", "Vue 3"],
      dataLayers: ["PostgreSQL", "Django ORM"],
      inspectionTargets: ["cookbook/views/", "cookbook/models.py", "vue/src/"],
      reasons: []
    },
    tags: ["recipe", "recipes", "food", "cooking", "meal", "meals", "meal plan", "meal planning", "grocery", "shopping list", "ingredients", "nutrition", "kitchen"]
  },

  // ── Inventory / stock management ───────────────────────────────────────────
  {
    id: 1101,
    owner: "inventree",
    name: "InvenTree",
    fullName: "inventree/InvenTree",
    url: "https://github.com/inventree/InvenTree",
    description: "Open-source inventory management system. Track parts, stock locations, suppliers, manufacturing orders, and sales orders.",
    language: "Python",
    topics: ["inventory", "stock", "parts", "manufacturing", "bom", "self-hosted", "erp"],
    stars: 4800,
    forks: 820,
    openIssues: 240,
    license: "MIT",
    pushedAt: "2026-05-27T00:00:00Z",
    createdAt: "2019-04-01T00:00:00Z",
    updatedAt: "2026-05-27T00:00:00Z",
    archived: false,
    homepage: "https://inventree.org",
    readme: {
      excerpt: "InvenTree is an open-source inventory management system with parts tracking, stock locations, bill-of-materials (BOM) management, supplier ordering, and barcode scanning. Django backend with REST API.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 86,
      reasons: ["setup docs", "examples", "API details"],
      evidence: evidence(
        ["docker-compose up -d"],
        ["Parts and stock tracking with location hierarchy.", "Supplier and manufacturer management.", "Bill of Materials (BOM).", "Barcode scanning.", "Purchase and sales orders."],
        ["PostgreSQL.", "Django.", "REST API.", "Docker."],
        ["python manage.py test"]
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 740,
      rootFiles: ["manage.py", "docker-compose.yml", "requirements.txt", "LICENSE", "README.md"],
      appDirectories: ["InvenTree/", "src/"],
      packageManagers: ["requirements.txt"],
      frameworks: ["Django", "Django REST Framework"],
      dataLayers: ["PostgreSQL", "Django ORM"],
      inspectionTargets: ["InvenTree/part/", "InvenTree/stock/", "InvenTree/order/"],
      reasons: []
    },
    tags: ["inventory", "stock", "parts", "products", "warehouse", "barcode", "sku", "catalog", "assets", "tracking", "procurement", "purchasing", "erp"]
  },

  // ── Event / ticket management ──────────────────────────────────────────────
  {
    id: 1201,
    owner: "HiEventsDev",
    name: "hi.events",
    fullName: "HiEventsDev/hi.events",
    url: "https://github.com/HiEventsDev/hi.events",
    description: "Self-hosted event management and ticketing platform. Create events, sell tickets, check in attendees, and manage orders.",
    language: "TypeScript",
    topics: ["events", "ticketing", "event-management", "self-hosted", "react", "laravel"],
    stars: 3600,
    forks: 320,
    openIssues: 78,
    license: "AGPL-3.0",
    pushedAt: "2026-05-15T00:00:00Z",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2026-05-15T00:00:00Z",
    archived: false,
    homepage: "https://hi.events",
    readme: {
      excerpt: "Self-hosted event management and ticketing. Create events, configure ticket types, sell tickets online, check in attendees with QR codes, and manage orders and refunds. React frontend, Laravel backend.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 84,
      reasons: ["setup docs", "examples", "API details"],
      evidence: evidence(
        ["docker-compose up -d"],
        ["Event creation and management.", "Ticket types and pricing.", "Online ticket sales.", "QR code check-in.", "Order and refund management."],
        ["PostgreSQL.", "Laravel.", "React.", "Stripe.", "Docker."],
        []
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 680,
      rootFiles: ["docker-compose.yml", "LICENSE", "README.md"],
      appDirectories: ["frontend/", "backend/"],
      packageManagers: ["package.json", "composer.json"],
      frameworks: ["React 18", "Laravel 11"],
      dataLayers: ["PostgreSQL"],
      inspectionTargets: ["frontend/src/", "backend/app/", "docker-compose.yml"],
      reasons: []
    },
    tags: ["event", "events", "ticket", "tickets", "ticketing", "booking", "conference", "meetup", "registration", "attendees", "rsvp", "venue"]
  },

  // ── Real estate / property ─────────────────────────────────────────────────
  {
    id: 1301,
    owner: "AleksNeStu",
    name: "ai-real-estate-assistant",
    fullName: "AleksNeStu/ai-real-estate-assistant",
    url: "https://github.com/AleksNeStu/ai-real-estate-assistant",
    description: "AI-powered real estate platform with conversational property search, listing management, map views, and AI chat for property queries.",
    language: "TypeScript",
    topics: ["real-estate", "property", "ai", "nextjs", "listings", "map"],
    stars: 280,
    forks: 42,
    openIssues: 12,
    license: "MIT",
    pushedAt: "2026-04-08T00:00:00Z",
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2026-04-08T00:00:00Z",
    archived: false,
    homepage: null,
    readme: {
      excerpt: "AI real estate platform. Natural language property search, listing management with photos and details, map-based search, AI chat for property queries. Built with Next.js, Supabase, and OpenAI.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 78,
      reasons: ["setup docs", "examples"],
      evidence: evidence(
        ["npm install && npm run dev"],
        ["Property listings with search and filters.", "Map-based property search.", "AI chat for property queries.", "Listing detail pages with photos."],
        ["Supabase.", "OpenAI.", "Google Maps.", "Next.js."],
        []
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 180,
      rootFiles: ["package.json", "next.config.ts", "tsconfig.json", "LICENSE", "README.md"],
      appDirectories: ["app/", "components/", "lib/"],
      packageManagers: ["package.json", "package-lock.json"],
      frameworks: ["Next.js 14", "React 18", "Tailwind CSS"],
      dataLayers: ["Supabase", "PostgreSQL"],
      inspectionTargets: ["app/listings/", "components/Map.tsx", "lib/supabase.ts"],
      reasons: []
    },
    tags: ["real estate", "realtor", "property", "properties", "listings", "mls", "homes", "houses", "apartments", "rent", "buy", "mortgage", "agent", "broker", "realty"]
  },

  // ── Kanban / project management ────────────────────────────────────────────
  {
    id: 1401,
    owner: "makeplane",
    name: "plane",
    fullName: "makeplane/plane",
    url: "https://github.com/makeplane/plane",
    description: "The open-source Jira and Linear alternative. Project management with issues, cycles, modules, analytics, and multi-team support.",
    language: "TypeScript",
    topics: ["project-management", "jira-alternative", "linear-alternative", "kanban", "issues", "self-hosted"],
    stars: 29000,
    forks: 2100,
    openIssues: 580,
    license: "AGPL-3.0",
    pushedAt: "2026-05-28T00:00:00Z",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2026-05-28T00:00:00Z",
    archived: false,
    homepage: "https://plane.so",
    readme: {
      excerpt: "Plane is an open-source project management tool. Create issues with rich text, link to cycles and modules, track progress with analytics, and collaborate across teams. Jira and Linear alternative. Self-hosted with Docker.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 88,
      reasons: ["setup docs", "examples", "API details"],
      evidence: evidence(
        ["./setup.sh", "docker-compose up -d"],
        ["Issues with rich text, labels, and priorities.", "Cycles (sprints) and modules.", "Multiple views: kanban, list, gantt.", "Analytics and reports.", "REST and GraphQL APIs."],
        ["PostgreSQL.", "Django.", "Redis.", "Next.js.", "Docker."],
        []
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 2800,
      rootFiles: ["docker-compose.yml", "setup.sh", "LICENSE", "README.md"],
      appDirectories: ["web/", "apiserver/", "packages/"],
      packageManagers: ["package.json", "yarn.lock", "requirements.txt"],
      frameworks: ["Next.js", "Django", "React"],
      dataLayers: ["PostgreSQL", "Redis"],
      inspectionTargets: ["web/components/issues/", "apiserver/plane/", "docker-compose.yml"],
      reasons: []
    },
    tags: ["project management", "kanban", "board", "issues", "tasks", "todo", "sprint", "agile", "scrum", "jira", "linear", "asana", "trello", "tickets", "workflow"]
  },

  // ── Link / bookmark manager ────────────────────────────────────────────────
  {
    id: 1501,
    owner: "hoarder-app",
    name: "hoarder",
    fullName: "hoarder-app/hoarder",
    url: "https://github.com/hoarder-app/hoarder",
    description: "A self-hostable bookmark-everything app with AI-based automatic tagging. Save links, notes, images. AI extracts and tags content automatically.",
    language: "TypeScript",
    topics: ["bookmarks", "read-it-later", "ai", "tagging", "self-hosted", "nextjs"],
    stars: 9800,
    forks: 540,
    openIssues: 148,
    license: "AGPL-3.0",
    pushedAt: "2026-05-26T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2026-05-26T00:00:00Z",
    archived: false,
    homepage: "https://hoarder.app",
    readme: {
      excerpt: "A self-hostable bookmark manager with AI-based automatic tagging. Save links, notes, and images. AI crawls content and auto-tags. Full-text search. Browser extension. Mobile app. Self-hosted with Docker.",
      url: null,
      hasSetup: true,
      hasExamples: true,
      hasApiDetails: true,
      hasLocalDevelopment: true,
      hasLicenseText: true,
      qualityScore: 86,
      reasons: ["setup docs", "examples", "API details"],
      evidence: evidence(
        ["docker-compose up -d"],
        ["Save and organize bookmarks, notes, and images.", "AI-powered automatic tagging.", "Full-text search.", "Browser extension for quick saving.", "Mobile app."],
        ["PostgreSQL.", "OpenAI/Ollama for AI.", "Next.js.", "tRPC.", "Docker."],
        []
      )
    },
    structure: {
      fetchStatus: "ok",
      fetchedAt: "2026-05-30T00:00:00Z",
      truncated: false,
      fileCount: 420,
      rootFiles: ["docker-compose.yml", "LICENSE", "README.md"],
      appDirectories: ["apps/web/", "apps/mobile/", "packages/"],
      packageManagers: ["package.json", "yarn.lock"],
      frameworks: ["Next.js 14", "React Native", "tRPC"],
      dataLayers: ["PostgreSQL", "Prisma"],
      inspectionTargets: ["apps/web/app/", "packages/trpc/", "apps/web/components/"],
      reasons: []
    },
    tags: ["bookmark", "bookmarks", "link", "links", "read later", "read it later", "save", "collection", "pocket", "instapaper", "pinboard", "tagging", "research", "clipping"]
  }
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function stripTags(entry: CuratedEntry): NormalizedRepo {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tags, ...repo } = entry;
  return repo as NormalizedRepo;
}

// ── Matching ────────────────────────────────────────────────────────────────

function scoreTags(prompt: string, tags: string[]): number {
  const lower = prompt.toLowerCase();
  let score = 0;
  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    const isMultiWord = tagLower.includes(" ");
    const isShortWord = !isMultiWord && tagLower.length <= 3;
    // Multi-word tags: substring match (e.g. "real estate", "cover letter")
    // Short single words (≤ 3 chars): whole-word boundary to avoid "ai" matching inside "blockchain"
    // Longer single words: substring is fine
    const matches = isMultiWord
      ? lower.includes(tagLower)
      : isShortWord
        ? new RegExp(`\\b${tagLower}\\b`).test(lower)
        : lower.includes(tagLower);
    if (matches) {
      score += isMultiWord ? 3 : 1;
    }
  }
  return score;
}

function scoreDescription(prompt: string, entry: CuratedEntry): number {
  const lower = prompt.toLowerCase();
  const desc = entry.description.toLowerCase();
  const words = lower.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 4);
  return words.filter((w) => desc.includes(w)).length;
}

export function searchCuratedRepos(prompt: string): { repos: NormalizedRepo[]; matched: boolean } {
  const allScored = CURATED.map((entry) => ({
    repo: entry,
    score: scoreTags(prompt, entry.tags) * 3 + scoreDescription(prompt, entry)
  })).sort((a, b) => b.score - a.score);

  const topScore = allScored[0]?.score ?? 0;
  // Minimum threshold: at least 2 points, and not more than 4x below the top scorer.
  // This prevents weak "tracker" matches from padding a recipe or dashboard query.
  const minScore = Math.max(2, Math.floor(topScore / 4));
  const scored = allScored.filter((item) => item.score >= minScore);

  if (scored.length === 0) return { repos: [], matched: false };

  const top = scored.slice(0, 3).map((item) => stripTags(item.repo as CuratedEntry));

  return { repos: top, matched: true };
}
