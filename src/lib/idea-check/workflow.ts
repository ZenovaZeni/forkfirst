import { getRepoKindInsight, type RepoKindInsight } from "../analysis/repo-kind";
import type { ClassifiedRepo, RepoScore } from "../analysis/types";
import { buildHandoffBlueprint, type HandoffBlueprint } from "../build-pack/blueprint";
import type { ReadmeEvidence, RepoCategory, RepoStructureAnalysis } from "../github/types";
import { normalizeLikelyReceiptScannerTypo } from "../intent/normalize";
import { inferRepoSetupFit, type SetupFit } from "../repos/setup-fit";
import { extractIdeaTerms, type PromptRefinement } from "../search/planner";

type FoundationMode = "clone" | "inspect" | "none";

export type ProductIntent = {
  sourceText: string;
  productPhrase: string;
  targetUser: string;
  jobToBeDone: string;
  coreGoal: string;
  differentiatedWedge: string;
  domainTerms: string[];
  actions: string[];
  dataObjects: string[];
  screens: string[];
  primaryWorkflow: string[];
  mustHaveFeatures: string[];
  nonGoals: string[];
  constraints: string[];
  firstMilestone: string;
  successMetrics: string[];
  confidence: number;
  inferredFrom: string[];
};

export type RepoInspection = {
  repo: {
    fullName: string;
    url: string;
    owner: string;
    name: string;
    description: string;
    language: string | null;
    topics: string[];
    homepage: string | null;
  };
  publicSignals: {
    stars: number;
    forks: number;
    openIssues: number;
    pushedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    archived: boolean;
    license: string | null;
  };
  classification: {
    category: RepoCategory;
    kind: RepoKindInsight;
    score: RepoScore;
    setupFit: SetupFit;
    foundationMode: FoundationMode;
  };
  readme: {
    status: ReadmeEvidence["fetchStatus"] | "unknown";
    url: string | null;
    qualityScore: number | null;
    signals: string[];
    excerpt: string | null;
    evidence: {
      setup: string[];
      commands: string[];
      features: string[];
      integrations: string[];
      license: string[];
    };
  };
  structure: {
    status: RepoStructureAnalysis["fetchStatus"] | "unknown";
    truncated: boolean;
    fileCount: number;
    rootFiles: string[];
    appDirectories: string[];
    packageManagers: string[];
    frameworks: string[];
    dataLayers: string[];
    inspectionTargets: string[];
    signals: string[];
  };
  buildPack: {
    recommendedUse: "clone_candidate" | "reference_only" | "research_only" | "avoid_until_verified";
    evidenceSummary: string[];
    firstInspectionFiles: string[];
    reuseRisks: string[];
    unknowns: string[];
  };
};

export type MergePlanItem = {
  item: string;
  evidence: string[];
};

export type MergePlan = {
  repoFullName: string | null;
  foundationMode: FoundationMode;
  fitSummary: string;
  keep: MergePlanItem[];
  replace: string[];
  add: string[];
  remove: string[];
  inspect: string[];
  missingProductNeeds: string[];
  warnings: string[];
};

type DeriveProductIntentInput = {
  prompt: string;
  refinement?: PromptRefinement;
  repos?: ClassifiedRepo[];
  selectedRepo?: ClassifiedRepo;
};

const GENERIC_TEXT = [
  /\bmain thing\b/i,
  /\bone useful result\b/i,
  /\bone primary input\b/i,
  /\bone working product loop\b/i,
  /\bprimaryitem\b/i,
  /\buserinput\b/i,
  /\btarget user from the idea\b/i
];

const INTENT_STOP_WORDS = new Set([
  "able",
  "about",
  "across",
  "after",
  "also",
  "anything",
  "around",
  "before",
  "build",
  "builder",
  "could",
  "from",
  "have",
  "help",
  "helps",
  "into",
  "like",
  "make",
  "need",
  "needs",
  "show",
  "that",
  "their",
  "thing",
  "this",
  "user",
  "users",
  "want",
  "where",
  "with"
]);

const TERM_OBJECTS: Array<{ pattern: RegExp; objects: string[]; screens: string[]; actions: string[] }> = [
  { pattern: /\b(receipts?|expenses?|csv|scanner|ocr)\b/i, objects: ["Receipt", "ReceiptImage", "ParsedReceipt", "ExpenseRecord", "Merchant", "CsvExport"], screens: ["Receipt capture", "Expense review", "Expense list", "CSV export"], actions: ["scan receipts", "review parsed expenses", "edit expense fields", "export expenses to CSV"] },
  { pattern: /\b(bookings?|appointments?|calendar|salon|availability)\b/i, objects: ["Appointment", "Customer", "Service", "StaffMember", "AvailabilitySlot"], screens: ["Booking calendar", "Appointment detail", "Service setup", "Customer list"], actions: ["book appointments", "manage availability", "confirm or reschedule appointments", "send reminders"] },
  { pattern: /\b(grocer(?:y|ies)|shopping|pantry|recipes?|meal)\b/i, objects: ["GroceryItem", "ShoppingList", "PantryItem", "Recipe", "StorePrice"], screens: ["Shopping list", "Item detail", "Pantry view", "Store price comparison"], actions: ["add grocery items", "compare prices", "plan shopping trips", "export or share a list"] },
  { pattern: /\b(cards?|collection|collector|album|binder|tcg|pokemon|price|value|worth)\b/i, objects: ["Card", "OwnedCard", "CollectionAlbum", "PriceSnapshot", "WishlistItem"], screens: ["Card search", "Card detail", "Collection album", "Value dashboard"], actions: ["search cards", "save owned cards", "organize an album", "track estimated value"] },
  { pattern: /\b(images?|photos?|prompt|prompts?|organizer|gallery)\b/i, objects: ["ImagePrompt", "GeneratedImage", "PromptTag", "PromptCollection"], screens: ["Prompt library", "Prompt editor", "Image gallery", "Tag filters"], actions: ["save prompts", "organize prompt tags", "preview generated images", "copy or export prompts"] },
  { pattern: /\b(realtors?|real estate|leads?|scrape|follow[-\s]?ups?|prospects?)\b/i, objects: ["Lead", "BusinessProfile", "Contact", "FollowUpTask", "LeadSource"], screens: ["Lead search", "Lead detail", "Follow-up board", "Export list"], actions: ["collect leads", "qualify prospects", "organize follow-ups", "export lead lists"] },
  { pattern: /\b(crm|customers?|clients?|roofing|quotes?|jobs?|pipeline)\b/i, objects: ["Customer", "Lead", "Job", "Quote", "FollowUpTask"], screens: ["CRM dashboard", "Customer detail", "Job pipeline", "Quote builder"], actions: ["track customers", "move jobs through a pipeline", "create quotes", "schedule follow-ups"] },
  { pattern: /\b(shopify|profit|ad spend|inventory|dashboard|metrics?)\b/i, objects: ["StoreMetric", "ProfitSnapshot", "AdSpend", "InventoryItem", "SalesChannel"], screens: ["Profit dashboard", "Ad spend view", "Inventory table", "Metric detail"], actions: ["connect store data", "track profit", "review ad spend", "monitor inventory"] },
  { pattern: /\b(sports?|schedule|parents?|kids?|teams?|games?|practice)\b/i, objects: ["Team", "Player", "ScheduleEvent", "Practice", "ParentContact"], screens: ["Team schedule", "Event detail", "Family calendar", "Roster"], actions: ["add games and practices", "share schedules", "track player availability", "send reminders"] },
  { pattern: /\b(cat|cats|pet|pets|identify|id|breed|animal)\b/i, objects: ["PetProfile", "PetPhoto", "IdentificationResult", "BreedGuess", "CareNote"], screens: ["Photo capture", "Identification result", "Pet profile", "Care notes"], actions: ["upload pet photos", "review identification results", "save pet profiles", "track care notes"] }
];

function cleanText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<\/?UNTRUSTED_REPO_CONTENT>/gi, "")
    .replace(/!\s*\[[^\]]*]\s*\([^)]*\)/g, " ")
    .replace(/!\s*[a-z0-9_-]+\s+https?:\/\/\S+/gi, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/^#+\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isGeneric(value: string | null | undefined): boolean {
  if (!value) return true;
  return GENERIC_TEXT.some((pattern) => pattern.test(value));
}

function unique(items: Array<string | null | undefined>, limit = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const item = cleanText(raw);
    if (!item) continue;
    const key = item.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

function pascalCase(value: string): string {
  return value
    .replace(/[^a-z0-9\s-]/gi, " ")
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join("");
}

function singularize(value: string): string {
  if (value.endsWith("ies") && value.length > 4) return `${value.slice(0, -3)}y`;
  if (value.endsWith("ses") && value.length > 4) return value.slice(0, -2);
  if (value.endsWith("s") && !value.endsWith("ss") && value.length > 3) return value.slice(0, -1);
  return value;
}

function dataObjectName(term: string): string {
  return pascalCase(singularize(term));
}

function exportObjectsFromPrompt(prompt: string): string[] {
  const formats = [
    { pattern: /\bcsv\b/i, object: "CsvExport", action: "export to CSV", screen: "CSV export" },
    { pattern: /\bpdf\b/i, object: "PdfExport", action: "export to PDF", screen: "PDF export" },
    { pattern: /\bjson\b/i, object: "JsonExport", action: "export to JSON", screen: "JSON export" },
    { pattern: /\bexcel|spreadsheet|xlsx\b/i, object: "SpreadsheetExport", action: "export to spreadsheet", screen: "Spreadsheet export" }
  ];
  return formats.filter((format) => format.pattern.test(prompt)).map((format) => format.object);
}

function exportActionsFromPrompt(prompt: string): string[] {
  const formats = [
    { pattern: /\bcsv\b/i, action: "export to CSV" },
    { pattern: /\bpdf\b/i, action: "export to PDF" },
    { pattern: /\bjson\b/i, action: "export to JSON" },
    { pattern: /\bexcel|spreadsheet|xlsx\b/i, action: "export to spreadsheet" }
  ];
  return formats.filter((format) => format.pattern.test(prompt)).map((format) => format.action);
}

function exportScreensFromPrompt(prompt: string): string[] {
  const formats = [
    { pattern: /\bcsv\b/i, screen: "CSV export" },
    { pattern: /\bpdf\b/i, screen: "PDF export" },
    { pattern: /\bjson\b/i, screen: "JSON export" },
    { pattern: /\bexcel|spreadsheet|xlsx\b/i, screen: "Spreadsheet export" }
  ];
  return formats.filter((format) => format.pattern.test(prompt)).map((format) => format.screen);
}

function phraseFromPrompt(prompt: string): string {
  const cleaned = normalizeLikelyReceiptScannerTypo(prompt)
    .replace(/Original idea:\s*/gi, " ")
    .replace(/Follow-up refinement:[\s\S]*$/gi, " ")
    .replace(/\b(i\s+want\s+to|i\s+need\s+to|can\s+you\s+help\s+me|please)\b/gi, " ")
    .replace(/\b(build|make|create|find)\b\s+(?:me\s+)?/gi, " ")
    .replace(/\b(an?|the)\s+(app|tool|thing|system|dashboard|website)\s+(that|where|for|to)?\b/gi, " ")
    .replace(/^\s*(?:an?|the)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (/\b(shopify|ecommerce|e-commerce|store)\b/i.test(cleaned) && /\b(dashboard|profit|ad spend|inventory|orders?|analytics|metrics?)\b/i.test(cleaned)) {
    return /\bshopify\b/i.test(cleaned) ? "Shopify profit dashboard" : "ecommerce profit dashboard";
  }
  const explicitProduct = cleaned.match(/\b((?:local[-\s]?first\s+)?(?:[a-z0-9+#.-]+\s+){0,4}(?:scanner|tracker|dashboard|portal|manager|organizer|scheduler|generator|library|crm|app|tool))\b/i)?.[1]?.trim();
  if (explicitProduct && explicitProduct.length >= 6) return explicitProduct;
  return cleaned.length > 8 ? cleaned : prompt.replace(/\s+/g, " ").trim();
}

function targetUserFromPrompt(prompt: string, productPhrase: string): string {
  if (/\bfor\s+tax(?:es)?\b/i.test(prompt)) return "people organizing receipts for tax prep";
  const direct = prompt.match(/\bfor\s+(?:a|an|the)?\s*([^,.]+?)(?:\s+that\b|\s+who\b|\s+where\b|\s+with\b|$)/i)?.[1]?.trim();
  if (direct && direct.length >= 3 && direct.length <= 70) return direct;
  if (/\brealtors?|real estate|broker/i.test(prompt)) return "realtors or real-estate operators who need a faster lead workflow";
  if (/\bparents?|kids?|sports?/i.test(prompt)) return "parents and organizers coordinating youth activities";
  if (/\bcollector|cards?|album|binder|tcg|pokemon/i.test(prompt)) return "collectors who want a private, organized collection workflow";
  if (/\bsalon|booking|appointment/i.test(prompt)) return "small service businesses that need simple booking operations";
  if (/\bcrm|customers?|clients?|roofing/i.test(prompt)) return "small business operators managing customers and follow-ups";
  return `the user trying to ${productPhrase}`;
}

function semanticSignals(prompt: string): Pick<ProductIntent, "domainTerms" | "actions" | "dataObjects" | "screens"> {
  const normalizedPrompt = normalizeLikelyReceiptScannerTypo(prompt);
  const lower = normalizedPrompt.toLowerCase();
  const matches = TERM_OBJECTS.filter((entry) => entry.pattern.test(lower));
  const terms = extractIdeaTerms(normalizedPrompt).filter((term) => !INTENT_STOP_WORDS.has(term));
  const exportObjects = exportObjectsFromPrompt(normalizedPrompt);
  const exportActions = exportActionsFromPrompt(normalizedPrompt);
  const exportScreens = exportScreensFromPrompt(normalizedPrompt);
  const matchedActions = unique(matches.flatMap((entry) => entry.actions), 8);
  const matchedObjects = unique(matches.flatMap((entry) => entry.objects), 9);
  const matchedScreens = unique(matches.flatMap((entry) => entry.screens), 8);
  const fallbackObjects = terms
    .filter((term) => term.length >= 4)
    .filter((term) => !/\b(local|first|tracks?|exports?|scanner|organizer|manager|dashboard|system|app)\b/i.test(term))
    .slice(0, 5)
    .map(dataObjectName)
    .filter((term) => term && !["App", "Tool", "Thing", "System"].includes(term));
  const fallbackScreens = terms.slice(0, 3).map((term) => `${term.charAt(0).toUpperCase()}${term.slice(1)} workspace`);
  const fallbackActions = terms.slice(0, 4).map((term) => `manage ${term}`);

  return {
    domainTerms: unique([...terms, ...matches.flatMap((entry) => entry.objects.map((objectName) => objectName.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()))], 14),
    actions: matchedActions.length ? unique([...matchedActions, ...exportActions], 8) : unique([...fallbackActions, ...exportActions], 8),
    dataObjects: matchedObjects.length ? unique([...matchedObjects, ...exportObjects, "SavedRecord", "ExportJob"], 9) : unique([...fallbackObjects, ...exportObjects, "SavedRecord", "ExportJob"], 9),
    screens: matchedScreens.length ? unique([...matchedScreens, ...exportScreens, "Settings and export"], 8) : unique([...fallbackScreens, ...exportScreens, "List/library", "Detail/review", "Settings and export"], 8)
  };
}

function concreteList(preferred: string[], fallback: string[], limit: number): string[] {
  const preferredConcrete = preferred.filter((item) => !isGeneric(item));
  return unique([...preferredConcrete, ...fallback], limit);
}

function workflowFromIntent(signals: Pick<ProductIntent, "actions" | "dataObjects" | "screens">): string[] {
  const primaryObject = signals.dataObjects[0] ?? "SavedRecord";
  const secondaryObject = signals.dataObjects[1] ?? "DetailRecord";
  const firstScreen = signals.screens[0] ?? "Intake";
  const secondScreen = signals.screens[1] ?? "Review";
  const firstAction = signals.actions[0] ?? `create a ${primaryObject}`;
  const secondAction = signals.actions[1] ?? `review ${secondaryObject}`;
  const thirdAction = signals.actions[2] ?? "save the result";
  const fourthAction = signals.actions[3] ?? "export or share the result";
  return [
    `User starts in ${firstScreen} and can ${firstAction}.`,
    `User reviews the created ${primaryObject} in ${secondScreen} with the important fields visible.`,
    `User can ${secondAction} and correct missing or wrong data before saving.`,
    `User can ${thirdAction} so the workflow survives refresh or return visits.`,
    `User can ${fourthAction} for backup, handoff, or continued work elsewhere.`
  ];
}

function mustHaveFromIntent(intent: Pick<ProductIntent, "actions" | "dataObjects" | "screens">): string[] {
  return unique([
    `${intent.screens[0] ?? "Primary workspace"} with a clear first action.`,
    `${intent.dataObjects[0] ?? "SavedRecord"} model with create, edit, save, and delete-safe behavior.`,
    ...intent.actions.slice(0, 4).map((action) => `User can ${action}.`),
    "Local save or export path so useful work is not trapped in the session.",
    "Empty, loading, error, no-result, and partial-success states for the primary workflow."
  ], 9);
}

export function deriveProductIntent(input: DeriveProductIntentInput): ProductIntent {
  const normalizedPrompt = normalizeLikelyReceiptScannerTypo(input.prompt);
  const productPhrase = phraseFromPrompt(normalizedPrompt);
  const targetUser = targetUserFromPrompt(normalizedPrompt, productPhrase);
  const signals = semanticSignals(`${normalizedPrompt} ${input.refinement?.probableMeaning ?? ""}`);
  const blueprint = buildHandoffBlueprint({
    originalIdea: normalizedPrompt,
    researchContext: input.refinement?.probableMeaning ?? null,
    queries: input.refinement?.queries ?? [],
    selectedRepo: input.selectedRepo,
    candidateRepos: input.repos ?? []
  });
  const preferBlueprint = blueprint.productKind !== "workflow-app" && blueprint.productKind !== "unknown-app";
  const generatedWorkflow = workflowFromIntent(signals);
  const primaryWorkflow = preferBlueprint
    ? concreteList(blueprint.primaryWorkflow, generatedWorkflow, 6)
    : concreteList(generatedWorkflow, blueprint.primaryWorkflow, 6);
  const dataObjects = preferBlueprint
    ? concreteList(blueprint.coreDataObjects, signals.dataObjects, 9)
    : concreteList(signals.dataObjects, blueprint.coreDataObjects, 9);
  const screens = preferBlueprint
    ? concreteList(blueprint.keyScreens, signals.screens, 8)
    : concreteList(signals.screens, blueprint.keyScreens, 8);
  const actions = preferBlueprint
    ? concreteList(blueprint.userActions, signals.actions, 8)
    : concreteList(signals.actions, blueprint.userActions, 8);
  const firstMilestone = isGeneric(blueprint.firstMilestone)
    ? `Build the first usable loop for ${productPhrase}: ${actions.slice(0, 3).join(", ")}, then save or export the result.`
    : blueprint.firstMilestone;
  const coreGoal = isGeneric(blueprint.productThesis)
    ? `Build a ${productPhrase} for ${targetUser}, centered on ${actions.slice(0, 3).join(", ")}.`
    : blueprint.productThesis;

  return {
    sourceText: normalizedPrompt,
    productPhrase,
    targetUser: isGeneric(blueprint.targetUserSegment) ? targetUser : blueprint.targetUserSegment,
    jobToBeDone: isGeneric(blueprint.jobToBeDone)
      ? `When I need ${productPhrase}, I want to ${actions.slice(0, 3).join(", ")} without rebuilding the foundation from scratch.`
      : blueprint.jobToBeDone,
    coreGoal,
    differentiatedWedge: isGeneric(blueprint.differentiatedWedge)
      ? `Use the repo as working foundation evidence, then replace domain assumptions so the first loop specifically serves ${targetUser}.`
      : blueprint.differentiatedWedge,
    domainTerms: unique([...signals.domainTerms, ...extractIdeaTerms(normalizedPrompt)], 14),
    actions,
    dataObjects,
    screens,
    primaryWorkflow,
    mustHaveFeatures: concreteList(mustHaveFromIntent({ actions, dataObjects, screens }), blueprint.mvpRequirements, 9),
    nonGoals: concreteList(blueprint.explicitNonGoals, [
      "Do not copy another product's branding, screenshots, UI copy, or protected assets.",
      "Do not add accounts, billing, team permissions, or complex integrations before the first loop works.",
      "Do not treat GitHub metadata as license or architecture proof."
    ], 7),
    constraints: concreteList(blueprint.trustPrivacySafety, [
      "Confirm license, attribution, asset, and data-source terms before copying code or data.",
      "Keep secret keys out of client code, logs, telemetry, and generated handoff files.",
      "Prefer local persistence or explicit export until hosted storage is intentionally designed."
    ], 7),
    firstMilestone,
    successMetrics: concreteList(blueprint.successMetrics, [
      `A first-time user can complete the ${actions[0] ?? "primary"} flow without setup confusion.`,
      "The user can save, copy, export, or revisit the useful result.",
      "The builder can point to the repo files kept, replaced, added, removed, and inspected."
    ], 6),
    confidence: Math.max(blueprint.confidence, signals.domainTerms.length >= 3 ? 72 : 58),
    inferredFrom: unique(["plain-English idea", "GitHub search plan", ...blueprint.inferredFrom], 8)
  };
}

function foundationModeFor(repo: ClassifiedRepo): FoundationMode {
  if (repo.archived || repo.category === "risk") return "inspect";
  if (repo.score.fit >= 45 && (repo.category === "forkable" || repo.category === "already_exists")) return "clone";
  return "inspect";
}

function recommendedUse(repo: ClassifiedRepo, mode: FoundationMode): RepoInspection["buildPack"]["recommendedUse"] {
  if (repo.archived || repo.category === "risk") return "avoid_until_verified";
  if (mode === "clone") return "clone_candidate";
  if (repo.score.fit >= 25) return "reference_only";
  return "research_only";
}

function readmeSignals(repo: ClassifiedRepo): string[] {
  if (!repo.readme) return ["README not available from the search result."];
  return unique([
    repo.readme.hasSetup ? "Setup docs found" : "Setup docs not confirmed",
    repo.readme.hasExamples ? "Examples found" : "Examples not confirmed",
    repo.readme.hasApiDetails ? "API details found" : "API details not confirmed",
    repo.readme.hasLocalDevelopment ? "Local development notes found" : "Local development not confirmed",
    repo.readme.hasLicenseText ? "License mention found in README" : "License text not confirmed in README"
  ], 6);
}

function evidenceSummary(repo: ClassifiedRepo): string[] {
  const evidence = repo.readme?.evidence;
  return unique([
    cleanText(repo.description),
    ...(repo.structure?.reasons ?? []),
    ...(repo.structure?.frameworks ?? []).map((item) => `${item} file evidence found`),
    ...(repo.structure?.dataLayers ?? []).map((item) => `${item} evidence found`),
    ...(evidence?.featureSnippets ?? []),
    ...(evidence?.integrationSnippets ?? []),
    ...(evidence?.setupSnippets ?? []),
    ...(evidence?.commandSnippets ?? []),
    ...repo.score.reasons
  ], 6);
}

function inspectionFiles(repo: ClassifiedRepo, setupFit: SetupFit): string[] {
  const text = `${repo.description} ${repo.readme?.excerpt ?? ""} ${repo.language ?? ""}`.toLowerCase();
  const files = ["README.md", "LICENSE", "package files / lockfiles", "app entrypoints", "routes/components", "data models or persistence layer"];
  if (/next|react|vite|vue|svelte|frontend|ui/.test(text)) files.push("frontend routes and reusable UI components");
  if (/api|backend|server|express|fastapi|django|flask/.test(text)) files.push("API routes and backend services");
  if (/postgres|sqlite|mysql|mongodb|prisma|drizzle|schema|model/.test(text)) files.push("database schema and migration files");
  if (setupFit.id === "docker-friendly") files.push("Dockerfile and docker-compose files");
  return unique([...files, ...(repo.structure?.inspectionTargets ?? [])], 14);
}

export function inspectRepoForBuildPack(repo: ClassifiedRepo): RepoInspection {
  const kind = getRepoKindInsight(repo);
  const setupFit = inferRepoSetupFit(repo);
  const mode = foundationModeFor(repo);
  const evidence = repo.readme?.evidence;
  const risks = unique([
    repo.license ? `Detected license is ${repo.license}; still confirm full LICENSE, notices, assets, and dependency terms.` : "No license detected from GitHub metadata.",
    repo.archived ? "Repository is archived." : null,
    repo.score.fit < 45 ? "Fit is weak or adjacent; treat as reference until repo inspection proves otherwise." : null,
    setupFit.tone === "caution" ? setupFit.detail : null,
    kind.kind === "directory" ? "This is a directory/list, not a runnable product foundation." : null
  ], 7);
  const unknowns = unique([
    repo.structure?.fetchStatus === "ok"
      ? null
      : "Exact file paths for reusable components are not known until the repo tree is inspected.",
    repo.structure?.truncated ? "GitHub returned a truncated file tree; inspect the full repository before committing." : null,
    "Install, build, and test commands must be confirmed from package files.",
    "License and attribution obligations require checking the actual repo files.",
    repo.readme?.evidence?.fetchStatus !== "ok" ? "README evidence was incomplete or unavailable." : null
  ], 6);

  return {
    repo: {
      fullName: repo.fullName,
      url: repo.url,
      owner: repo.owner,
      name: repo.name,
      description: cleanText(repo.description),
      language: repo.language,
      topics: repo.topics.map(cleanText).filter(Boolean),
      homepage: repo.homepage
    },
    publicSignals: {
      stars: repo.stars,
      forks: repo.forks,
      openIssues: repo.openIssues,
      pushedAt: repo.pushedAt,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
      archived: repo.archived,
      license: repo.license
    },
    classification: {
      category: repo.category,
      kind,
      score: repo.score,
      setupFit,
      foundationMode: mode
    },
    readme: {
      status: evidence?.fetchStatus ?? "unknown",
      url: repo.readme?.url ?? null,
      qualityScore: repo.readme?.qualityScore ?? null,
      signals: readmeSignals(repo),
      excerpt: cleanText(repo.readme?.excerpt) || null,
      evidence: {
        setup: (evidence?.setupSnippets ?? []).map(cleanText).filter(Boolean),
        commands: (evidence?.commandSnippets ?? []).map(cleanText).filter(Boolean),
        features: (evidence?.featureSnippets ?? []).map(cleanText).filter(Boolean),
        integrations: (evidence?.integrationSnippets ?? []).map(cleanText).filter(Boolean),
        license: (evidence?.licenseSnippets ?? []).map(cleanText).filter(Boolean)
      }
    },
    structure: {
      status: repo.structure?.fetchStatus ?? "unknown",
      truncated: Boolean(repo.structure?.truncated),
      fileCount: repo.structure?.fileCount ?? 0,
      rootFiles: (repo.structure?.rootFiles ?? []).map(cleanText).filter(Boolean),
      appDirectories: (repo.structure?.appDirectories ?? []).map(cleanText).filter(Boolean),
      packageManagers: (repo.structure?.packageManagers ?? []).map(cleanText).filter(Boolean),
      frameworks: (repo.structure?.frameworks ?? []).map(cleanText).filter(Boolean),
      dataLayers: (repo.structure?.dataLayers ?? []).map(cleanText).filter(Boolean),
      inspectionTargets: (repo.structure?.inspectionTargets ?? []).map(cleanText).filter(Boolean),
      signals: (repo.structure?.reasons ?? []).map(cleanText).filter(Boolean)
    },
    buildPack: {
      recommendedUse: recommendedUse(repo, mode),
      evidenceSummary: evidenceSummary(repo),
      firstInspectionFiles: inspectionFiles(repo, setupFit),
      reuseRisks: risks,
      unknowns
    }
  };
}

export function buildRepoInspections(repos: ClassifiedRepo[], limit = 3): RepoInspection[] {
  return repos.slice(0, limit).map(inspectRepoForBuildPack);
}

function evidenceText(inspection: RepoInspection | undefined): string {
  if (!inspection) return "";
  return [
    inspection.repo.description,
    inspection.readme.excerpt,
    ...inspection.buildPack.evidenceSummary,
    ...inspection.readme.evidence.features,
    ...inspection.readme.evidence.integrations
  ].join(" ").toLowerCase();
}

function productNeedCovered(need: string, haystack: string): boolean {
  const terms = need
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 4 && !INTENT_STOP_WORDS.has(term));
  return terms.some((term) => haystack.includes(term));
}

function evidenceForItem(item: string, inspection: RepoInspection | undefined): string[] {
  if (!inspection) return [];
  const candidates = [
    ...inspection.buildPack.evidenceSummary,
    ...inspection.readme.evidence.features,
    ...inspection.readme.evidence.integrations,
    ...inspection.readme.evidence.setup,
    ...inspection.readme.evidence.commands
  ];
  return candidates.filter((line) => productNeedCovered(item, line.toLowerCase())).slice(0, 3);
}

export function buildMergePlan(intent: ProductIntent, inspection?: RepoInspection | null): MergePlan {
  const haystack = evidenceText(inspection ?? undefined);
  const missingObjects = intent.dataObjects.filter((item) => !productNeedCovered(item, haystack));
  const missingActions = intent.actions.filter((item) => !productNeedCovered(item, haystack));
  const missingScreens = intent.screens.filter((item) => !productNeedCovered(item, haystack));
  const foundationMode = inspection?.classification.foundationMode ?? "none";
  const repoName = inspection?.repo.fullName ?? null;
  const evidenceMatches = unique([...intent.actions, ...intent.dataObjects, ...intent.screens]
    .map((item) => evidenceForItem(item, inspection ?? undefined)[0])
    .filter(Boolean), 5);
  const coveredNeeds = unique([...intent.actions, ...intent.dataObjects, ...intent.screens]
    .filter((item) => productNeedCovered(item, haystack)), 6);
  const keepBase = coveredNeeds.length
    ? coveredNeeds.map((item) => `adapt confirmed ${item} support from the repo`).concat(
        inspection?.classification.setupFit.id === "docker-friendly" ? ["keep the Docker/local setup path if it runs cleanly"] : []
      )
    : evidenceMatches.length
      ? evidenceMatches.map((item) => `inspect and reuse this confirmed capability: ${item}`)
      : inspection
        ? ["working setup, project structure, and any reusable patterns confirmed during inspection"]
        : ["no repo foundation selected yet"];
  const addNeeds = unique([
    ...missingScreens.map((screen) => `${screen} surface`),
    ...missingObjects.map((objectName) => `${objectName} data model`),
    ...missingActions.map((action) => `${action} action`),
    "save/export path for the first workflow"
  ], 8);

  return {
    repoFullName: repoName,
    foundationMode,
    fitSummary: repoName
      ? `${repoName} should be treated as a ${foundationMode === "clone" ? "candidate foundation" : "reference to inspect"} for ${intent.productPhrase}, not as the finished product.`
      : `No repo has been selected yet; the builder should use this as a no-foundation plan for ${intent.productPhrase}.`,
    keep: keepBase.map((item) => ({ item, evidence: evidenceForItem(item, inspection ?? undefined) })),
    replace: unique([
      repoName ? `${repoName} product identity, sample data, navigation labels, demo records, screenshots, and domain assumptions` : "placeholder starter branding and generic sample data",
      "copy that belongs to the starter project instead of the user's idea",
      "colors, logo, iconography, and onboarding until they match the desired product"
    ], 6),
    add: addNeeds,
    remove: unique([
      ...intent.nonGoals.slice(0, 4),
      "unrelated starter routes, demo workflows, admin/team/payment surfaces, and broad features outside the first milestone"
    ], 7),
    inspect: unique([
      ...(inspection?.buildPack.firstInspectionFiles ?? ["README.md", "LICENSE", "package files / lockfiles", "app entrypoints"]),
      "issues, release history, dependency health, and documented setup commands"
    ], 9),
    missingProductNeeds: unique([...missingScreens, ...missingObjects, ...missingActions], 10),
    warnings: unique([
      ...(inspection?.buildPack.reuseRisks ?? []),
      "GitHub metadata is evidence, not proof; verify setup, license, architecture, and fit before copying code."
    ], 8)
  };
}

export function productIntentToBlueprint(intent: ProductIntent, fallback: HandoffBlueprint): HandoffBlueprint {
  return {
    ...fallback,
    confidence: Math.max(fallback.confidence, intent.confidence),
    productThesis: intent.coreGoal,
    targetUserSegment: intent.targetUser,
    jobToBeDone: intent.jobToBeDone,
    differentiatedWedge: intent.differentiatedWedge,
    primaryWorkflow: intent.primaryWorkflow,
    keyScreens: intent.screens,
    coreDataObjects: intent.dataObjects,
    userActions: intent.actions,
    mvpRequirements: intent.mustHaveFeatures,
    explicitNonGoals: intent.nonGoals,
    trustPrivacySafety: intent.constraints,
    firstMilestone: intent.firstMilestone,
    successMetrics: intent.successMetrics,
    inferredFrom: unique([...fallback.inferredFrom, ...intent.inferredFrom], 10)
  };
}
