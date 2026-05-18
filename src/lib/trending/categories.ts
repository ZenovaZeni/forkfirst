export type TrendingCategory = {
  id: "ai-agents" | "claude-skills" | "cursor-mcp" | "dev-tools" | "saas-starters" | "indie-apps";
  label: string;
  blurb: string;
  queryTemplates: string[]; // GitHub Search query templates. {since} = ISO date 30 days ago.
};

export const TRENDING_CATEGORIES: TrendingCategory[] = [
  {
    id: "ai-agents",
    label: "AI Agents",
    blurb: "Multi-step LLM agents, RAG apps, and AI workflows.",
    queryTemplates: [
      "topic:ai-agents pushed:>{since} stars:>30"
    ]
  },
  {
    id: "claude-skills",
    label: "Claude Skills",
    blurb: "Claude Code skills, agents, and MCP-aware tools.",
    queryTemplates: [
      "topic:claude-code pushed:>{since} stars:>20"
    ]
  },
  {
    id: "cursor-mcp",
    label: "Cursor & MCP",
    blurb: "Cursor rules, MCP servers, and editor agents.",
    queryTemplates: [
      "topic:mcp-server pushed:>{since} stars:>20"
    ]
  },
  {
    id: "dev-tools",
    label: "Developer Tools",
    blurb: "CLIs, libraries, and tooling for builders.",
    queryTemplates: [
      "topic:developer-tools pushed:>{since} stars:>100"
    ]
  },
  {
    id: "saas-starters",
    label: "SaaS Starters",
    blurb: "Production-ready Next.js, T3, and SaaS boilerplates.",
    queryTemplates: [
      "topic:saas pushed:>{since} stars:>100"
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
