import { normalizeLikelyReceiptScannerTypo } from "../intent/normalize";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "any",
  "anything",
  "app",
  "are",
  "all",
  "build",
  "building",
  "built",
  "because",
  "cause",
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
  "keep",
  "let",
  "lets",
  "like",
  "looking",
  "make",
  "me",
  "my",
  "need",
  "needs",
  "of",
  "on",
  "or",
  "owners",
  "repo",
  "repos",
  "repositories",
  "see",
  "some",
  "stuff",
  "stuff.",
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
    pattern:
      /\b(pokemon|tcgdex)\b/i,
    label: "pokemon-tcg-collectibles",
    meaning:
      "Find open-source Pokemon TCG collection, binder, card-value, and catalog tools that match the user's collector workflow.",
    queries: [
      "pokemon tcg collection manager in:name,description,readme",
      "pokemon card collection tracker in:name,description,readme",
      "tcg collection manager price tracker in:name,description,readme",
      "trading card binder app in:name,description,readme",
      "pokemon tcg portfolio tracker in:name,description,readme",
      "tcgdex collection app in:name,description,readme"
    ]
  },
  {
    pattern:
      /\b(tcg|trading[-\s]?card|card collector|card collection|collector album|card binder|card value|tcgplayer|cardmarket|sports[-\s]?cards?|magic the gathering|mtg|yu-gi-oh|yugioh|collectibles)\b/i,
    label: "trading-card-collectibles",
    meaning:
      "Find open-source trading-card, collectibles, collection-tracking, binder, and price-tracking tools that match the user's collector workflow.",
    queries: [
      "trading card collection manager in:name,description,readme",
      "tcg collection manager price tracker in:name,description,readme",
      "card collection tracker in:name,description,readme",
      "trading card binder app in:name,description,readme",
      "collectibles inventory tracker in:name,description,readme",
      "sports card collection tracker in:name,description,readme"
    ]
  },
  {
    pattern: /\b(cat id|cat identifier|cat identification|cat breed|cat scanner|identify cat|identify cats|pet id|pet identification|pet identifier|animal identification|animal image recognition)\b/i,
    label: "pet-identification",
    meaning: "Find open-source cat, pet, breed-identification, animal-recognition, or pet-profile apps.",
    queries: [
      "cat breed identifier app in:name,description,readme",
      "pet identification app in:name,description,readme",
      "animal image recognition app in:name,description,readme",
      "cat scanner app in:name,description,readme",
      "pet profile app in:name,description,readme",
      "cat breed classifier in:name,description,readme"
    ]
  },
  {
    pattern: /\b(prompt organizer|prompt manager|prompt library|prompt collection|prompt database|prompt gallery|image prompt organizer|ai prompt organizer|save prompts?|organize prompts?)\b/i,
    label: "prompt-library",
    meaning: "Find open-source prompt managers, prompt libraries, image-prompt organizers, and reusable prompt workspaces.",
    queries: [
      "ai prompt manager app in:name,description,readme",
      "prompt library app in:name,description,readme",
      "image prompt organizer in:name,description,readme",
      "prompt collection manager in:name,description,readme",
      "prompt gallery app in:name,description,readme",
      "prompt management tool in:name,description,readme"
    ]
  },
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
    pattern: /\b(client portal|customer portal|portal|invoices?|invoicing|billing portal|customer dashboard|client dashboard|messaging)\b/i,
    label: "client-portal",
    meaning: "Find open-source client portal, customer dashboard, invoicing, messaging, and file-sharing apps.",
    queries: [
      "client portal invoice messaging in:name,description,readme",
      "customer portal invoicing in:name,description,readme",
      "client dashboard messaging in:name,description,readme",
      "invoice client portal in:name,description,readme",
      "customer portal file sharing in:name,description,readme",
      "client portal dashboard in:name,description,readme"
    ]
  },
  {
    pattern: /\b(cleaning|cleaner|cleaners|janitorial|maid|maids|housekeeping|commercial cleaning|residential cleaning)\b.*\b(quote|quotes|job|jobs|crew|crews|schedule|scheduling|dispatch|follow[-\s]?up|crm|customer|customers)\b|\b(quote|quotes|job|jobs|crew|crews|schedule|scheduling|dispatch|follow[-\s]?up|crm|customer|customers)\b.*\b(cleaning|cleaner|cleaners|janitorial|maid|maids|housekeeping|commercial cleaning|residential cleaning)\b/i,
    label: "cleaning-company-ops",
    meaning: "Find open-source cleaning, janitorial, field-service, quote, job, crew, scheduling, and follow-up apps.",
    queries: [
      "cleaning business management app in:name,description,readme",
      "cleaning company scheduling app in:name,description,readme",
      "janitorial service management app in:name,description,readme",
      "field service job scheduling app in:name,description,readme",
      "quote job crew management app in:name,description,readme",
      "cleaning service crm in:name,description,readme"
    ]
  },
  {
    pattern: /\b(roofing|contractor|contractors|field service|home service|trade|trades|plumbing|hvac|landscap(?:e|ing)|cleaning|cleaner|cleaners|janitorial|maid|maids|housekeeping)\b.*\b(crm|customer|customers|lead|leads|job|jobs|estimate|estimates|quote|quotes|invoice|crew|crews|follow[-\s]?up)\b|\b(crm|customer|customers|lead|leads|job|jobs|estimate|estimates|quote|quotes|invoice|crew|crews|follow[-\s]?up)\b.*\b(roofing|contractor|contractors|field service|home service|trade|trades|plumbing|hvac|landscap(?:e|ing)|cleaning|cleaner|cleaners|janitorial|maid|maids|housekeeping)\b/i,
    label: "service-business-crm",
    meaning: "Find open-source contractor, home-service, field-service, and small-business CRM apps with leads, customers, jobs, estimates, and follow-ups.",
    queries: [
      "roofing crm app in:name,description,readme",
      "contractor crm app in:name,description,readme",
      "field service management app in:name,description,readme",
      "home service crm in:name,description,readme",
      "job estimate invoice app in:name,description,readme",
      "service business crm in:name,description,readme"
    ]
  },
  {
    pattern: /\bcrm\b/i,
    label: "small-business-crm",
    meaning: "Find open-source CRM apps for customers, leads, notes, tasks, pipeline, and follow-up workflows.",
    queries: [
      "small business crm app in:name,description,readme",
      "open source crm app in:name,description,readme",
      "customer relationship management app in:name,description,readme",
      "sales crm app in:name,description,readme",
      "simple crm app in:name,description,readme",
      "crm dashboard app in:name,description,readme"
    ]
  },
  {
    pattern: /\b(salon|spa|barber|barbershop)\b.*\b(booking|appointment|appointments|scheduling|scheduler)\b|\b(booking|appointment|appointments|scheduling|scheduler)\b.*\b(salon|spa|barber|barbershop)\b/i,
    label: "salon-booking",
    meaning: "Find open-source salon, barber, spa, appointment-booking, and service scheduling apps.",
    queries: [
      "salon booking app in:name,description,readme",
      "appointment booking app in:name,description,readme",
      "salon appointment scheduler in:name,description,readme",
      "service booking app in:name,description,readme",
      "barbershop booking app in:name,description,readme",
      "staff scheduling appointment app in:name,description,readme"
    ]
  },
  {
    pattern: /\b(booking|appointment|appointments|scheduling|scheduler|salon|spa|barber|barbershop)\b/i,
    label: "appointment-booking",
    meaning: "Find open-source appointment, booking, scheduling, salon, or service-business apps.",
    queries: [
      "appointment booking app in:name,description,readme",
      "salon booking app in:name,description,readme",
      "scheduling app in:name,description,readme",
      "appointment scheduler in:name,description,readme",
      "service booking app in:name,description,readme",
      "barbershop booking app in:name,description,readme"
    ]
  },
  {
    pattern: /\b(kids?|children|parents?|family|families|team|teams|youth)\b.*\b(sports?|practice|game|games|schedule|schedules|calendar|coach|coaches)\b|\b(sports?|practice|game|games|schedule|schedules|calendar|coach|coaches)\b.*\b(kids?|children|parents?|family|families|team|teams|youth)\b/i,
    label: "sports-schedule",
    meaning: "Find open-source youth sports, team scheduling, family calendar, and practice/game organizer apps.",
    queries: [
      "youth sports team schedule app in:name,description,readme",
      "team management app in:name,description,readme",
      "family calendar app in:name,description,readme",
      "event scheduling app in:name,description,readme",
      "sports team management app in:name,description,readme",
      "family sports calendar app in:name,description,readme",
      "coach team schedule app in:name,description,readme"
    ]
  },
  {
    pattern: /\b(restaurant|restaurants|cafe|food truck|hospitality|reservation|reservations)\b/i,
    label: "restaurant",
    meaning: "Find open-source restaurant, hospitality, reservation, or local-service tools that match the user's specific workflow.",
    queries: [
      "restaurant reservation app in:name,description,readme",
      "table booking app in:name,description,readme",
      "restaurant booking system in:name,description,readme",
      "restaurant management system in:name,description,readme",
      "food ordering app in:name,description,readme",
      "hospitality booking app in:name,description,readme"
    ]
  },
  {
    pattern: /\b(recipe|recipes|meal planner|meal planning|cookbook|cooking|pantry)\b/i,
    label: "recipe-meal-planning",
    meaning: "Find open-source recipe manager, cookbook, pantry, grocery-list, and meal-planning apps.",
    queries: [
      "recipe manager app in:name,description,readme",
      "meal planner app in:name,description,readme",
      "self hosted recipe manager in:name,description,readme",
      "cookbook app in:name,description,readme",
      "recipe meal planner in:name,description,readme",
      "pantry recipe app in:name,description,readme"
    ]
  },
  {
    pattern: /\b(grocery|groceries|supermarket|shopping list|shopping lists|food shopping)\b/i,
    label: "grocery-shopping",
    meaning: "Find open-source grocery, shopping-list, supermarket, inventory, or food-shopping apps that match the user's workflow.",
    queries: [
      "grocery shopping list app in:name,description,readme",
      "grocery store app in:name,description,readme",
      "shopping list app in:name,description,readme",
      "grocery inventory app in:name,description,readme",
      "supermarket app template in:name,description,readme",
      "meal planner grocery list in:name,description,readme"
    ]
  },
  {
    pattern: /\b(job board|job portal|jobs board|careers?|recruitment|recruiting|applicants?|hiring)\b/i,
    label: "job-board",
    meaning: "Find open-source job board, job portal, careers, recruitment, or hiring workflow apps.",
    queries: [
      "job board app in:name,description,readme",
      "job portal app in:name,description,readme",
      "recruitment job board in:name,description,readme",
      "careers board app in:name,description,readme",
      "hiring platform app in:name,description,readme",
      "applicant tracking system in:name,description,readme"
    ]
  },
  {
    pattern: /\b(personal finance|budget|budgeting|expense tracker|expenses|money manager|finance tracker)\b/i,
    label: "personal-finance",
    meaning: "Find open-source personal finance, budget, expense-tracking, and money-management apps.",
    queries: [
      "personal finance budget app in:name,description,readme",
      "expense tracker app in:name,description,readme",
      "budget planner app in:name,description,readme",
      "money manager app in:name,description,readme",
      "personal finance tracker in:name,description,readme",
      "self hosted budgeting app in:name,description,readme"
    ]
  },
  {
    pattern: /\b(habit tracker|habit tracking|habits?|goal tracker|routine tracker|streak tracker)\b/i,
    label: "habit-tracker",
    meaning: "Find open-source habit, goal, routine, and streak-tracking apps.",
    queries: [
      "habit tracker app in:name,description,readme",
      "habit tracking app in:name,description,readme",
      "goal tracker app in:name,description,readme",
      "routine tracker app in:name,description,readme",
      "streak tracker app in:name,description,readme",
      "self hosted habit tracker in:name,description,readme"
    ]
  },
  {
    pattern: /\b(shopify|ecommerce|e-commerce|retail|store|storefront|merchant)\b.*\b(dashboard|analytics|profit|profits|margin|margins|ad spend|ads?|inventory|orders?|metrics?)\b|\b(dashboard|analytics|profit|profits|margin|margins|ad spend|ads?|inventory|orders?|metrics?)\b.*\b(shopify|ecommerce|e-commerce|retail|store|storefront|merchant)\b/i,
    label: "ecommerce-dashboard",
    meaning: "Find open-source Shopify, ecommerce, store-profit, ad-spend, inventory, and merchant analytics dashboards.",
    queries: [
      "shopify analytics dashboard in:name,description,readme",
      "ecommerce profit dashboard in:name,description,readme",
      "shopify inventory dashboard in:name,description,readme",
      "ad spend dashboard ecommerce in:name,description,readme",
      "store profit analytics dashboard in:name,description,readme",
      "merchant metrics dashboard in:name,description,readme"
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

function normalizePromptForSearch(prompt: string): string {
  return normalizeLikelyReceiptScannerTypo(prompt)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bpok(?:e)?[^a-z0-9]{0,4}mon\b/g, "pokemon");
}

export function extractIdeaTerms(prompt: string): string[] {
  return Array.from(
    new Set(
      normalizePromptForSearch(prompt)
        .replace(/[^a-z0-9+#.\s-]/g, " ")
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length > 2 && !STOP_WORDS.has(term))
    )
  ).slice(0, 10);
}

function inferProbableMeaning(prompt: string, terms: string[]): string {
  const normalizedPrompt = normalizePromptForSearch(prompt);
  const lowerPrompt = normalizedPrompt;
  const requestedName = extractRequestedName(prompt);
  const verticalPlan = findVerticalSearchPlan(prompt);

  if (requestedName) return `Check whether "${requestedName}" already exists as a GitHub project or brandable repo name.`;
  if (/\b(voice|speech|audio|whisper|wisper|assistant|transcription|stt|wake word)\b/i.test(normalizedPrompt)) {
    return "Find open-source voice assistant, speech-to-text, or Whisper-powered projects that could be used or studied.";
  }
  if (/\b(2\.5d|2d|3d|game|games|game engine|gamedev|game dev|phaser|godot|bevy|defold)\b/i.test(normalizedPrompt)) {
    return "Find game engines, frameworks, or starter projects that could help build the game idea.";
  }
  if (/\b(business owners?|small business|entrepreneurs?|founders?)\b/i.test(normalizedPrompt)) {
    return "Find open-source tools that are practical for business owners, founders, or small-business workflows.";
  }
  if (/\b(lead gen|lead generation|leads?|prospecting|realtors?|real estate|realty|broker)\b/i.test(normalizedPrompt)) {
    return "Find open-source lead-generation, prospecting, CRM, or real-estate sales tools that could help with the user's specific market.";
  }
  if (verticalPlan) return verticalPlan.meaning;
  if (/\b(ai|artificial intelligence|machine learning|llm|agents?)\b/i.test(normalizedPrompt)) {
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
  const normalizedPrompt = normalizePromptForSearch(prompt);
  return VERTICAL_SEARCH_PLANS.find((plan) => plan.pattern.test(normalizedPrompt)) ?? null;
}

const QUERY_PRODUCT_WORDS = new Set([
  "album",
  "board",
  "calendar",
  "crm",
  "dashboard",
  "generator",
  "library",
  "manager",
  "organizer",
  "portal",
  "scanner",
  "scheduler",
  "system",
  "tracker",
  "vault"
]);

const QUERY_ACTION_WORDS = new Set([
  "add",
  "book",
  "capture",
  "categorize",
  "compare",
  "create",
  "export",
  "filter",
  "find",
  "generate",
  "import",
  "log",
  "manage",
  "organize",
  "parse",
  "review",
  "save",
  "scan",
  "schedule",
  "search",
  "share",
  "sync",
  "track",
  "upload"
]);

function canonicalQueryTerm(term: string): string {
  const normalized = term
    .replace(/-/g, " ")
    .replace(/\btracks?\b/g, "track")
    .replace(/\btracking\b/g, "track")
    .replace(/\bexports?\b/g, "export")
    .replace(/\bscans?\b/g, "scan")
    .replace(/\bsaves?\b/g, "save")
    .replace(/\borganizes?\b/g, "organize")
    .replace(/\bexpenses\b/g, "expense")
    .replace(/\breceipts\b/g, "receipt")
    .replace(/\s+/g, " ")
    .trim();
  return normalized;
}

function compactQuery(parts: Array<string | null | undefined>): string {
  const query = Array.from(new Set(parts.flatMap((part) => canonicalQueryTerm(part ?? "").split(/\s+/)).filter(Boolean)))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return query ? `${query} in:name,description,readme` : "";
}

function queryDomainTerms(prompt: string): string[] {
  return Array.from(
    new Set(
      extractIdeaTerms(prompt)
        .map(canonicalQueryTerm)
        .flatMap((term) => term.split(/\s+/))
        .filter((term) => term.length >= 3)
        .filter((term) => !QUERY_PRODUCT_WORDS.has(term))
        .filter((term) => !QUERY_ACTION_WORDS.has(term))
        .filter((term) => !["first", "local", "source", "starter", "template"].includes(term))
    )
  ).slice(0, 6);
}

function queryProductTerms(prompt: string): string[] {
  const normalizedPrompt = normalizePromptForSearch(prompt).replace(/-/g, " ");
  const products = Array.from(QUERY_PRODUCT_WORDS).filter((term) => new RegExp(`\\b${term}\\b`, "i").test(normalizedPrompt));
  if (/\btrack|tracking|tracks\b/i.test(normalizedPrompt) && !products.includes("tracker")) products.push("tracker");
  if (/\bscan|scanning|scanner\b/i.test(normalizedPrompt) && !products.includes("scanner")) products.push("scanner");
  if (/\borganize|organizer|library|collection\b/i.test(normalizedPrompt) && !products.includes("organizer")) products.push("organizer");
  return products.slice(0, 3);
}

function queryFeatureTerms(prompt: string): string[] {
  const normalizedPrompt = normalizePromptForSearch(prompt).replace(/-/g, " ");
  return [
    /\bcsv\b|\bspreadsheet\b/i.test(normalizedPrompt) ? "csv export" : null,
    /\bocr\b|\bscan|scanner|receipt\b/i.test(normalizedPrompt) ? "ocr" : null,
    /\blocal first\b|\boffline\b|\blocal\b/i.test(normalizedPrompt) ? "local first" : null,
    /\breminder|notify|notification|alert\b/i.test(normalizedPrompt) ? "reminders" : null,
    /\btranscript|transcription\b/i.test(normalizedPrompt) ? "transcript search" : null,
    /\bprice|pricing|value|worth\b/i.test(normalizedPrompt) ? "price tracker" : null,
    /\bexport|download|share|copy\b/i.test(normalizedPrompt) ? "export" : null
  ].filter((term): term is string => Boolean(term));
}

function buildGeneralSearchQueries(prompt: string): string[] {
  const domainTerms = queryDomainTerms(prompt);
  const productTerms = queryProductTerms(prompt);
  const featureTerms = queryFeatureTerms(prompt);
  if (domainTerms.length === 0) return [];
  const primaryProduct = productTerms[0] ?? (featureTerms.some((term) => term.includes("export")) ? "tracker" : "app");
  const secondaryProduct = productTerms.find((term) => term !== primaryProduct && term === "tracker");
  const primary = compactQuery([domainTerms[0], primaryProduct, domainTerms[1], secondaryProduct, domainTerms[2], featureTerms.find((term) => term.includes("csv"))?.replace(" export", "")]);
  const featureFirst = compactQuery([domainTerms[0], ...featureTerms.slice(0, 2), primaryProduct, domainTerms[1]]);
  const productPattern = compactQuery([domainTerms[0], domainTerms[1], primaryProduct, "app"]);
  const workflowPattern = compactQuery([domainTerms[0], domainTerms[1], productTerms.includes("tracker") ? "tracker" : featureTerms[0], featureTerms[1]]);
  const localPattern = featureTerms.some((term) => term.includes("local")) ? compactQuery(["local first", domainTerms[1] ?? domainTerms[0], primaryProduct, featureTerms.find((term) => term.includes("csv"))]) : "";
  const starterPattern = compactQuery([domainTerms[0], primaryProduct, "starter template"]);
  return Array.from(new Set([primary, workflowPattern, featureFirst, localPattern, productPattern, starterPattern].filter(Boolean))).slice(0, 6);
}

function shouldPreferGeneralQueries(prompt: string, generalQuery: string | undefined, verticalQuery: string | undefined, verticalLabel: string | undefined): boolean {
  if (!generalQuery || !verticalQuery) return Boolean(generalQuery);
  if (verticalLabel !== "personal-finance") return false;
  const domainTerms = queryDomainTerms(prompt);
  if (domainTerms.length < 2) return false;
  const generalScore = domainTerms.filter((term) => generalQuery.includes(term)).length;
  const verticalScore = domainTerms.filter((term) => verticalQuery.includes(term)).length;
  return generalScore >= 3 && generalScore >= verticalScore + 2;
}

export function planSearches(prompt: string): string[] {
  const terms = extractIdeaTerms(prompt);
  const quotedPrompt = prompt.trim().replace(/\s+/g, " ").slice(0, 120);
  const core = terms.slice(0, 6).join(" ");
  const focused = terms.slice(0, 4).join(" ");
  const normalizedPrompt = normalizePromptForSearch(prompt);
  const lowerPrompt = normalizedPrompt;
  const requestedName = extractRequestedName(prompt);
  const isBusinessDiscovery = /\b(business owners?|small business|entrepreneurs?|founders?)\b/i.test(normalizedPrompt);
  const isLeadGenDiscovery = /\b(lead gen|lead generation|leads?|prospecting|sales outreach|scraper|enrichment)\b/i.test(normalizedPrompt);
  const isRealEstateDiscovery = /\b(realtors?|real estate(?:\s+agents?)?|realty|broker|mls|property|properties)\b/i.test(normalizedPrompt);
  const isImageGenerationDiscovery =
    /\b(image|images|photo|photos|visual|creative|generator|generate|listing media|social post)\b/i.test(normalizedPrompt);
  const verticalPlan = findVerticalSearchPlan(prompt);
  const isAiDiscovery =
    !isLeadGenDiscovery &&
    !isRealEstateDiscovery &&
    !verticalPlan &&
    /\b(ai|artificial intelligence|machine learning|llm|agents?)\b/i.test(normalizedPrompt) &&
    /\b(cool|interesting|best|good|repos?|projects?|tools?)\b/i.test(normalizedPrompt);
  const isGameDiscovery = /\b(2\.5d|2d|3d|game|games|game engine|gamedev|game dev|phaser|godot|bevy|defold)\b/i.test(normalizedPrompt);
  const isGameEngineDiscovery =
    isGameDiscovery && /\b(engine|framework|building|build|make|making|2\.5d|2d|3d|isometric|orthographic)\b/i.test(normalizedPrompt);
  const shouldSkipRawPrompt =
    isAiDiscovery || isBusinessDiscovery || isLeadGenDiscovery || isRealEstateDiscovery || Boolean(verticalPlan) || isGameDiscovery;
  const isRepoDiscoveryIdea =
    lowerPrompt.includes("github") &&
    (lowerPrompt.includes("repo") || lowerPrompt.includes("repository")) &&
    (lowerPrompt.includes("idea") || lowerPrompt.includes("exist") || lowerPrompt.includes("start"));
  const isVoiceAssistantDiscovery = /\b(voice|speech|audio|whisper|wisper|assistant|transcription|stt|wake word)\b/i.test(normalizedPrompt);
  const generalQueries = buildGeneralSearchQueries(prompt);
  const generalQueriesLead =
    !isGameDiscovery &&
    !isVoiceAssistantDiscovery &&
    !isAiDiscovery &&
    !isBusinessDiscovery &&
    !isLeadGenDiscovery &&
    !isRealEstateDiscovery &&
    shouldPreferGeneralQueries(prompt, generalQueries[0], verticalPlan?.queries[0], verticalPlan?.label);
  const generalQueriesOnly =
    !verticalPlan &&
    !isGameDiscovery &&
    !isVoiceAssistantDiscovery &&
    !isRepoDiscoveryIdea &&
    !isAiDiscovery &&
    !isBusinessDiscovery &&
    !isLeadGenDiscovery &&
    !isRealEstateDiscovery;

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
        ...(generalQueriesLead ? generalQueries : verticalPlan ? verticalPlan.queries : generalQueriesOnly ? generalQueries : []),
        ...(generalQueriesLead && verticalPlan ? verticalPlan.queries : []),
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
