const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "any",
  "anything",
  "app",
  "are",
  "build",
  "building",
  "built",
  "cool",
  "for",
  "from",
  "good",
  "help",
  "helps",
  "i",
  "in",
  "involving",
  "it",
  "like",
  "looking",
  "me",
  "my",
  "of",
  "on",
  "or",
  "owners",
  "repo",
  "repos",
  "repositories",
  "some",
  "that",
  "the",
  "there",
  "to",
  "tool",
  "want",
  "with"
]);

const VERTICAL_SEARCH_PLANS = [
  {
    pattern: /\b(healthcare|health care|medical|clinic|clinics|patient|patients|hipaa)\b/i,
    label: "healthcare",
    meaning: "Find open-source healthcare, clinic, compliance, or medical-practice tools that match the user's specific workflow.",
    queries: [
      "healthcare compliance tools in:name,description,readme",
      "clinic compliance automation in:name,description,readme",
      "medical practice compliance in:name,description,readme",
      "healthcare workflow automation in:name,description,readme"
    ]
  },
  {
    pattern: /\b(legal|law firm|lawyer|attorney|paralegal|case management)\b/i,
    label: "legal",
    meaning: "Find open-source legal, law-firm, case-management, or compliance tools that match the user's specific workflow.",
    queries: [
      "legal case management tools in:name,description,readme",
      "law firm automation in:name,description,readme",
      "legal compliance workflow in:name,description,readme",
      "attorney crm open source in:name,description,readme"
    ]
  },
  {
    pattern: /\b(restaurant|restaurants|cafe|food truck|hospitality|reservation|reservations)\b/i,
    label: "restaurant",
    meaning: "Find open-source restaurant, hospitality, reservation, or local-service tools that match the user's specific workflow.",
    queries: [
      "restaurant management tools in:name,description,readme",
      "restaurant reservation automation in:name,description,readme",
      "hospitality crm open source in:name,description,readme",
      "food service workflow automation in:name,description,readme"
    ]
  },
  {
    pattern: /\b(ecommerce|e-commerce|shopify|retail|storefront|inventory|merchant)\b/i,
    label: "ecommerce",
    meaning: "Find open-source ecommerce, retail, storefront, or merchant tools that match the user's specific workflow.",
    queries: [
      "ecommerce automation tools in:name,description,readme",
      "retail inventory crm in:name,description,readme",
      "merchant workflow automation in:name,description,readme",
      "storefront marketing automation in:name,description,readme"
    ]
  }
];

export type PromptRefinement = {
  probableMeaning: string;
  bestQuery: string;
  alternateAngles: string[];
  queries: string[];
};

export function extractIdeaTerms(prompt: string): string[] {
  return Array.from(
    new Set(
      prompt
        .toLowerCase()
        .replace(/[^a-z0-9+#.\s-]/g, " ")
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length > 2 && !STOP_WORDS.has(term))
    )
  ).slice(0, 10);
}

function inferProbableMeaning(prompt: string, terms: string[]): string {
  const lowerPrompt = prompt.toLowerCase();
  const requestedName = extractRequestedName(prompt);
  const verticalPlan = findVerticalSearchPlan(prompt);

  if (requestedName) return `Check whether "${requestedName}" already exists as a GitHub project or brandable repo name.`;
  if (/\b(voice|speech|audio|whisper|wisper|assistant|transcription|stt|wake word)\b/i.test(prompt)) {
    return "Find open-source voice assistant, speech-to-text, or Whisper-powered projects that could be used or studied.";
  }
  if (/\b(2\.5d|2d|3d|game|games|game engine|gamedev|game dev|phaser|godot|bevy|defold)\b/i.test(prompt)) {
    return "Find game engines, frameworks, or starter projects that could help build the game idea.";
  }
  if (/\b(business owners?|small business|entrepreneurs?|founders?)\b/i.test(prompt)) {
    return "Find open-source tools that are practical for business owners, founders, or small-business workflows.";
  }
  if (/\b(lead gen|lead generation|leads?|prospecting|realtors?|real estate|realty|broker|crm)\b/i.test(prompt)) {
    return "Find open-source lead-generation, prospecting, CRM, or real-estate sales tools that could help with the user's specific market.";
  }
  if (verticalPlan) return verticalPlan.meaning;
  if (/\b(ai|artificial intelligence|machine learning|llm|agents?)\b/i.test(prompt)) {
    return "Find useful AI projects, agents, tools, or references that a builder could learn from or build on.";
  }
  if (
    lowerPrompt.includes("github") &&
    (lowerPrompt.includes("repo") || lowerPrompt.includes("repository")) &&
    (lowerPrompt.includes("idea") || lowerPrompt.includes("exist") || lowerPrompt.includes("start"))
  ) {
    return "Find repo-discovery or project-recommendation tools that overlap with this product idea.";
  }

  return terms.length > 0
    ? `Find GitHub projects related to ${terms.slice(0, 5).join(", ")}.`
    : "Find GitHub projects that match the user's idea and reveal whether to fork, study, or build fresh.";
}

function queryToAngle(query: string, index: number): string {
  const readable = query.replace(/\s+in:name,description,readme|\s+in:name,description/g, "").replace(/\s+/g, " ").trim();
  const labels = ["Closest direct match", "Alternative wording", "Starter/template angle", "Reference or awesome-list angle"];
  return `${labels[index] ?? "Additional angle"}: ${readable}`;
}

export function planPromptRefinement(prompt: string): PromptRefinement {
  const queries = planSearches(prompt);
  const terms = extractIdeaTerms(prompt);
  const bestQuery = queries[0] ?? `${terms.join(" ")} in:name,description,readme`.trim();

  return {
    probableMeaning: inferProbableMeaning(prompt, terms),
    bestQuery,
    alternateAngles: queries.slice(1, 5).map((query, index) => queryToAngle(query, index)),
    queries
  };
}

function extractRequestedName(prompt: string): string | null {
  const match = prompt.match(/\b(?:name|called|named|brand)\s+["']?([a-z0-9_.-]{3,})["']?/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function findVerticalSearchPlan(prompt: string): (typeof VERTICAL_SEARCH_PLANS)[number] | null {
  return VERTICAL_SEARCH_PLANS.find((plan) => plan.pattern.test(prompt)) ?? null;
}

export function planSearches(prompt: string): string[] {
  const terms = extractIdeaTerms(prompt);
  const quotedPrompt = prompt.trim().replace(/\s+/g, " ").slice(0, 120);
  const core = terms.slice(0, 6).join(" ");
  const focused = terms.slice(0, 4).join(" ");
  const lowerPrompt = prompt.toLowerCase();
  const requestedName = extractRequestedName(prompt);
  const isBusinessDiscovery = /\b(business owners?|small business|entrepreneurs?|founders?)\b/i.test(prompt);
  const isLeadGenDiscovery = /\b(lead gen|lead generation|leads?|prospecting|sales outreach|scraper|enrichment|crm)\b/i.test(prompt);
  const isRealEstateDiscovery = /\b(realtors?|real estate(?:\s+agents?)?|realty|broker|mls|property|properties)\b/i.test(prompt);
  const isImageGenerationDiscovery =
    /\b(image|images|photo|photos|visual|creative|generator|generate|listing media|social post)\b/i.test(prompt);
  const verticalPlan = findVerticalSearchPlan(prompt);
  const isAiDiscovery =
    !isLeadGenDiscovery &&
    !isRealEstateDiscovery &&
    !verticalPlan &&
    /\b(ai|artificial intelligence|machine learning|llm|agents?)\b/i.test(prompt) &&
    /\b(cool|interesting|best|good|repos?|projects?|tools?)\b/i.test(prompt);
  const isGameDiscovery = /\b(2\.5d|2d|3d|game|games|game engine|gamedev|game dev|phaser|godot|bevy|defold)\b/i.test(prompt);
  const isGameEngineDiscovery =
    isGameDiscovery && /\b(engine|framework|building|build|make|making|2\.5d|2d|3d|isometric|orthographic)\b/i.test(prompt);
  const shouldSkipRawPrompt =
    isAiDiscovery || isBusinessDiscovery || isLeadGenDiscovery || isRealEstateDiscovery || Boolean(verticalPlan) || isGameDiscovery;
  const isRepoDiscoveryIdea =
    lowerPrompt.includes("github") &&
    (lowerPrompt.includes("repo") || lowerPrompt.includes("repository")) &&
    (lowerPrompt.includes("idea") || lowerPrompt.includes("exist") || lowerPrompt.includes("start"));
  const isVoiceAssistantDiscovery = /\b(voice|speech|audio|whisper|wisper|assistant|transcription|stt|wake word)\b/i.test(prompt);

  return Array.from(
    new Set(
      [
        ...(requestedName
          ? [`${requestedName} in:name`, `"${requestedName}" in:name,description`, `${requestedName} github in:name,description,readme`]
          : []),
        ...(isAiDiscovery
          ? [
              "awesome artificial intelligence in:name,description,readme",
              "ai agents tools in:name,description,readme",
              "llm applications in:name,description,readme",
              "machine learning projects in:name,description,readme"
            ]
          : []),
        ...(isBusinessDiscovery
          ? [
              "business automation tools in:name,description,readme",
              "small business crm in:name,description,readme",
              "marketing automation open source in:name,description,readme",
              "business intelligence dashboard in:name,description,readme"
            ]
          : []),
        ...(isRealEstateDiscovery && isImageGenerationDiscovery
          ? [
              "real estate image generator in:name,description,readme",
              "realtor marketing image generator in:name,description,readme",
              "property listing image generator in:name,description,readme",
              "real estate social media generator in:name,description,readme",
              "listing photo ai generator in:name,description,readme"
            ]
          : isLeadGenDiscovery && isRealEstateDiscovery
          ? [
              "real estate lead generation in:name,description,readme",
              "realtor crm leads in:name,description,readme",
              "property leads scraper in:name,description,readme",
              "real estate prospecting in:name,description,readme",
              "real estate marketing automation in:name,description,readme"
            ]
          : isLeadGenDiscovery
            ? [
                "lead generation tool in:name,description,readme",
                "sales prospecting crm in:name,description,readme",
                "lead enrichment open source in:name,description,readme",
                "cold outreach automation in:name,description,readme"
              ]
            : isRealEstateDiscovery
              ? [
                  "real estate crm in:name,description,readme",
                  "property management leads in:name,description,readme",
                  "mls real estate in:name,description,readme",
                  "real estate marketing in:name,description,readme"
                ]
              : []),
        ...(verticalPlan ? verticalPlan.queries : []),
        ...(isVoiceAssistantDiscovery
          ? [
              "open source voice assistant in:name,description,readme",
              "whisper voice assistant in:name,description,readme",
              "speech to text assistant in:name,description,readme",
              "local voice assistant in:name,description,readme",
              "whisperflow voice assistant in:name,description,readme"
            ]
          : []),
        ...(isGameEngineDiscovery
          ? [
              "godot 2.5d game engine in:name,description,readme",
              "bevy 2.5d game engine in:name,description,readme",
              "phaser isometric game framework in:name,description,readme",
              "defold game engine in:name,description,readme",
              "open source isometric game engine in:name,description,readme"
            ]
          : isGameDiscovery
            ? [
              "godot game engine in:name,description,readme",
              "bevy game engine in:name,description,readme",
              "phaser game framework in:name,description,readme",
              "defold game engine in:name,description,readme",
              "open source game engine in:name,description,readme"
            ]
          : []),
        ...(isRepoDiscoveryIdea
          ? [
              "github repository discovery ai in:name,description,readme",
              "github repo search semantic in:name,description,readme",
              "open source project discovery in:name,description,readme",
              "repository recommendation engine github in:name,description,readme"
            ]
          : []),
        ...(shouldSkipRawPrompt ? [] : [`${quotedPrompt} in:name,description,readme`]),
        `${core} in:name,description,readme`,
        `${focused} github in:name,description,readme`,
        `${focused} open source in:name,description,readme`,
        `${focused} starter template in:name,description,readme`
      ].filter((query) => query.trim().length > 0)
    )
  ).slice(0, 7);
}
