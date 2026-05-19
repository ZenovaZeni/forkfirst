export const TRENDING_CATEGORY_IDS = [
  "all",
  "ai-agents",
  "cursor-mcp",
  "saas-starters",
  "web-apps",
  "dashboards",
  "mobile-pwa",
  "scrapers-apis",
  "ui-kits",
  "indie-apps"
] as const;

export type TrendingCategoryId = (typeof TRENDING_CATEGORY_IDS)[number];

export type TrendingCategory = {
  id: TrendingCategoryId;
  label: string;
  blurb: string;
  queryTemplates: string[]; // GitHub Search query templates. {since} = ISO date 30 days ago.
};

export const TRENDING_CATEGORIES: TrendingCategory[] = [
  {
    id: "all",
    label: "All",
    blurb: "Daily GitHub picks across AI agents, app starters, dashboards, mobile apps, automation, and UI kits.",
    queryTemplates: [
      "topic:ai-agents pushed:>{since} stars:>50",
      "topic:saas pushed:>{since} stars:>100",
      "topic:nextjs pushed:>{since} stars:>150",
      "topic:dashboard pushed:>{since} stars:>80",
      "topic:web-scraping pushed:>{since} stars:>80",
      "topic:pwa pushed:>{since} stars:>80"
    ]
  },
  {
    id: "ai-agents",
    label: "AI Agents",
    blurb: "Multi-step LLM agents, RAG apps, and AI workflows.",
    queryTemplates: [
      "topic:ai-agents pushed:>{since} stars:>30"
    ]
  },
  {
    id: "cursor-mcp",
    label: "MCP & Automations",
    blurb: "MCP servers, editor agents, workflow automation, and AI-builder helpers.",
    queryTemplates: [
      "topic:mcp-server pushed:>{since} stars:>20",
      "topic:automation pushed:>{since} stars:>100",
      "topic:claude-code pushed:>{since} stars:>20"
    ]
  },
  {
    id: "saas-starters",
    label: "SaaS Starters",
    blurb: "Starter repos with auth, billing, dashboards, teams, and production app structure.",
    queryTemplates: [
      "topic:saas pushed:>{since} stars:>100",
      "topic:starter-template pushed:>{since} stars:>100",
      "topic:nextjs-template pushed:>{since} stars:>80"
    ]
  },
  {
    id: "web-apps",
    label: "Web Apps",
    blurb: "Next.js, React, full-stack apps, and useful product foundations.",
    queryTemplates: [
      "topic:nextjs pushed:>{since} stars:>150",
      "topic:react pushed:>{since} stars:>200",
      "topic:fullstack pushed:>{since} stars:>50"
    ]
  },
  {
    id: "dashboards",
    label: "Dashboards",
    blurb: "Admin panels, analytics dashboards, CRM-style tools, and internal app foundations.",
    queryTemplates: [
      "topic:dashboard pushed:>{since} stars:>80",
      "topic:admin-dashboard pushed:>{since} stars:>50",
      "topic:analytics-dashboard pushed:>{since} stars:>30"
    ]
  },
  {
    id: "mobile-pwa",
    label: "Mobile & PWA",
    blurb: "Mobile app foundations, installable PWAs, cross-platform apps, and offline-first ideas.",
    queryTemplates: [
      "topic:pwa pushed:>{since} stars:>80",
      "topic:mobile-app pushed:>{since} stars:>50",
      "topic:react-native pushed:>{since} stars:>150"
    ]
  },
  {
    id: "scrapers-apis",
    label: "Scrapers & APIs",
    blurb: "Scrapers, API tools, data pipelines, lead-gen utilities, and automation backends.",
    queryTemplates: [
      "topic:web-scraping pushed:>{since} stars:>80",
      "topic:api pushed:>{since} stars:>200",
      "topic:data-pipeline pushed:>{since} stars:>50"
    ]
  },
  {
    id: "ui-kits",
    label: "UI Kits",
    blurb: "Component libraries, design systems, Tailwind kits, and front-end building blocks.",
    queryTemplates: [
      "topic:ui-components pushed:>{since} stars:>80",
      "topic:tailwindcss pushed:>{since} stars:>150",
      "topic:design-system pushed:>{since} stars:>50"
    ]
  },
  {
    id: "indie-apps",
    label: "Indie Apps",
    blurb: "Solo-founder side projects with real users.",
    queryTemplates: [
      "topic:open-source-app pushed:>{since} stars:>50"
    ]
  }
];

/** Substitute {since} with 30 days before the supplied clock date. */
export function buildTrendingQueries(category: TrendingCategory, now = new Date()): string[] {
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return category.queryTemplates.map((query) => query.replace(/\{since\}/g, since));
}

/** Look up a category by id. */
export function findCategory(id: string): TrendingCategory | undefined {
  return TRENDING_CATEGORIES.find((c) => c.id === id);
}
