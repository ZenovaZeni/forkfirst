import type { IdeaCheckResult } from "@/types/idea-check";
import type { BuildPackPreferences } from "./generator";

type BuildPackRepo = IdeaCheckResult["repos"][number];

export type ProductKind =
  | "card-collector"
  | "repo-discovery"
  | "real-estate-tool"
  | "voice-tool"
  | "project-management"
  | "knowledge-base"
  | "developer-tool"
  | "recipe-bookmark"
  | "workflow-app"
  | "marketplace"
  | "unknown-app";

export type HandoffBlueprint = {
  productKind: ProductKind;
  confidence: number;
  productThesis: string;
  targetUserSegment: string;
  jobToBeDone: string;
  currentAlternatives: string[];
  differentiatedWedge: string;
  primaryWorkflow: string[];
  keyScreens: string[];
  coreDataObjects: string[];
  userActions: string[];
  systemStates: {
    empty: string;
    loading: string;
    error: string;
    noResult: string;
    partialSuccess: string;
  };
  mvpRequirements: string[];
  explicitNonGoals: string[];
  trustPrivacySafety: string[];
  firstMilestone: string;
  successMetrics: string[];
  wowDemoScript: string[];
  inferredFrom: string[];
};

export type HandoffSignalInput = {
  originalIdea: string;
  researchContext?: string | null;
  chatContext?: string | null;
  queries: string[];
  selectedRepo?: BuildPackRepo;
  candidateRepos: BuildPackRepo[];
  preferences?: BuildPackPreferences;
};

const GENERIC_WIZARD_COPY = [
  /turn the selected repo into the user'?s product idea/i,
  /clone the repo, inspect the core flows/i,
  /target user from the idea/i,
  /^your app$/i,
  /^untitled app$/i
];

function textFrom(input: HandoffSignalInput): string {
  const repo = input.selectedRepo;
  return [
    input.originalIdea,
    input.researchContext,
    input.chatContext,
    ...input.queries,
    repo?.fullName,
    repo?.name,
    repo?.description,
    repo?.language,
    repo?.topics.join(" "),
    repo?.readme?.excerpt,
    repo?.readme?.reasons.join(" ")
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function isGenericBuildPackPreference(value: unknown): boolean {
  if (typeof value !== "string") return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return GENERIC_WIZARD_COPY.some((pattern) => pattern.test(trimmed));
}

function stringPreference(preferences: BuildPackPreferences | undefined, key: string): string | null {
  const value = preferences?.[key];
  return isGenericBuildPackPreference(value) ? null : String(value).trim();
}

function cardCollectorBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  const isPokemon = /\b(pokemon|pok[eé]mon|tcgdex)\b/i.test(textFrom(input));
  return {
    productKind: "card-collector",
    confidence: 86,
    productThesis: `${name ? `${name} should` : "The product should"} help collectors search cards, save a personal collection, organize cards into albums or binders, and understand estimated collection value without copying another collector app's brand.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? (isPokemon ? "A casual or serious Pokemon/trading-card collector who wants to know what they own, where it is, and what it may be worth." : "A casual or serious trading-card, sports-card, or collectibles collector who wants to know what they own, where it is, and what it may be worth."),
    jobToBeDone: "When I look through my cards, I want to identify each card, save condition and quantity, see an estimated value, and organize it into a collection I can trust and export.",
    currentAlternatives: isPokemon
      ? ["Pokemon Collector-style apps", "TCGPlayer/Cardmarket lookups", "spreadsheets", "binder checklists", "manual eBay/PriceCharting searches"]
      : ["marketplace price guides", "spreadsheets", "binder checklists", "manual eBay/PriceCharting searches", "game-specific collection apps"],
    differentiatedWedge: "Use the open-source foundation for working collection mechanics, then rebrand and simplify around one private collector loop with clear value-estimate language and strong backup/export.",
    primaryWorkflow: [
      "User searches for a card by name, set, number, or keyword.",
      "User opens a card detail/value view with image, set, rarity, variant, source, and estimated value when available.",
      "User saves the card with condition, quantity, purchase price, notes, and binder or album location.",
      "User views the collection as a searchable vault/album with filters and total estimated value.",
      "User exports or backs up the collection before relying on it for real inventory."
    ],
    keyScreens: ["Search/catalog", "Card detail/value", "Add/edit owned card", "Collection vault/album", "Wishlist", "Export/backup", "Settings/data source"],
    coreDataObjects: ["Card", "Set", "OwnedCard", "Condition", "Variant", "BinderOrAlbum", "WishlistItem", "PriceSnapshot", "BackupExport"],
    userActions: ["search cards", "add to collection", "edit condition/quantity", "group in album", "mark wishlist", "view total value", "export backup"],
    systemStates: {
      empty: "No cards saved yet; show a search-first empty state and sample card guidance.",
      loading: "Searching card data or refreshing prices; keep the current collection visible.",
      error: "Card data or pricing source failed; explain what did not load and allow retry/manual entry.",
      noResult: "No exact card match; offer set/number tips and manual card entry.",
      partialSuccess: "Card saved but value unavailable; keep it in the collection and label price as missing."
    },
    mvpRequirements: [
      "Card search with no-result and manual-entry fallback.",
      "Card detail/value view with estimated-price wording.",
      "Owned-card save flow for condition, quantity, purchase price, notes, and album/binder location.",
      "Collection vault with filters and total estimated value.",
      "CSV/JSON export or backup path."
    ],
    explicitNonGoals: [
      isPokemon ? "Do not copy Pokemon Collector's product UI, name, app icon, screenshots, or store positioning." : "Do not copy another collector app's product UI, name, app icon, screenshots, or store positioning.",
      isPokemon ? "Do not use official Pokemon branding or protected assets unless rights and provider terms allow it." : "Do not use official league, game, brand, logo, or protected assets unless rights and provider terms allow it.",
      "Do not build marketplace selling, trading, escrow, social feeds, or native mobile apps in v1.",
      "Do not present estimated values as guaranteed resale prices."
    ],
    trustPrivacySafety: [
      "Confirm AGPL/license obligations before copying code into a closed or hosted product.",
      isPokemon ? "Confirm TCGdex, TCGPlayer, Cardmarket, image, and pricing data terms before caching or commercial use." : "Confirm image, marketplace, pricing, and game/league data terms before caching or commercial use.",
      "Label all prices as estimates with source/date when possible.",
      "Give users export/backup so local collection data is not trapped."
    ],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the collector loop: search for a card, open details, save it with condition and quantity, see it in a vault/album, show total estimated collection value, and export or back up the data.",
    successMetrics: [
      "A collector can add three real cards in under two minutes.",
      "Saved collection data survives refresh and exports correctly.",
      "The UI clearly distinguishes estimated value from guaranteed sale price.",
      "The product looks original and does not feel like a copied app."
    ],
    wowDemoScript: [
      "Search for a recognizable sample card.",
      "Open the detail/value view and show estimated value with source/date language.",
      "Add the card to a binder with condition and quantity.",
      "Show the collection total update.",
      "Export or back up the collection."
    ],
    inferredFrom: ["user idea", "selected repo metadata", "README evidence", "search queries"]
  };
}

function recipeBookmarkBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  return {
    productKind: "recipe-bookmark",
    confidence: 76,
    productThesis: `${name || "The app"} should help home cooks save recipe links, cleanly organize recipes by tags and meal context, and turn saved recipes into a reusable grocery-list workflow.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? "A home cook who finds recipes across the web and wants one private place to save, tag, revisit, and shop from them.",
    jobToBeDone: "When I find a recipe I may cook later, I want to save it, tag it, find it again, and turn ingredients into a grocery list without keeping dozens of browser tabs open.",
    currentAlternatives: ["browser bookmarks", "notes apps", "Pinterest boards", "recipe screenshots", "meal-planning apps"],
    differentiatedWedge: "Start from a bookmark or CRUD foundation, then specialize it around recipe metadata, tags, ingredients, grocery-list export, and a low-friction save flow.",
    primaryWorkflow: [
      "User saves a recipe URL or manually creates a recipe.",
      "System stores title, source URL, tags, notes, ingredients, and cooking context.",
      "User filters saved recipes by tag, meal type, ingredient, or status.",
      "User selects recipes and generates a grocery list.",
      "User exports or copies the grocery list for shopping."
    ],
    keyScreens: ["Save recipe", "Recipe detail", "Recipe library", "Tag/filter view", "Grocery list", "Import/export"],
    coreDataObjects: ["Recipe", "RecipeSource", "Tag", "Ingredient", "GroceryList", "SavedCollection"],
    userActions: ["save recipe link", "edit recipe notes", "tag recipe", "filter library", "generate grocery list", "copy or export list"],
    systemStates: {
      empty: "No recipes saved; show a URL input and a few useful tag suggestions.",
      loading: "Fetching or parsing a recipe link; keep the URL visible.",
      error: "Recipe parsing failed; let the user save the URL and add details manually.",
      noResult: "No recipes match the filters; offer clear filters reset.",
      partialSuccess: "Recipe saved but ingredients were not parsed; allow manual ingredients."
    },
    mvpRequirements: ["Save recipe URL/manual recipe", "Recipe library with tags", "Recipe detail editing", "Grocery list generation", "Copy/export list"],
    explicitNonGoals: ["No social recipe network", "No nutrition engine", "No meal-plan subscriptions", "No scraping claims without verifying target site terms"],
    trustPrivacySafety: ["Document whether recipe parsing touches a server", "Respect source site terms", "Keep saved recipe data exportable", "Do not claim parsing works on every website"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the recipe loop: save a recipe URL, edit tags/ingredients, find it in the library, generate a grocery list, and copy or export it.",
    successMetrics: ["A user can save and tag a recipe in under one minute.", "Saved recipes survive refresh.", "A grocery list can be copied or exported."],
    wowDemoScript: ["Save a recipe URL.", "Add tags and ingredients.", "Filter the library.", "Generate and copy a grocery list."],
    inferredFrom: ["user idea", input.selectedRepo ? "selected repo metadata" : "fallback blueprint"]
  };
}

function genericWorkflowBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  const repo = input.selectedRepo;
  return {
    productKind: "workflow-app",
    confidence: 45,
    productThesis: stringPreference(input.preferences, "productGoal") ?? `${name || "The app"} should turn the user's idea into one working product loop, using ${repo?.fullName ?? "the selected repo"} only where its setup, data model, routes, or UI patterns genuinely help.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? "The most specific user implied by the idea; refine this during repo inspection instead of building for everyone.",
    jobToBeDone: "Complete one painful workflow from input to useful saved output.",
    currentAlternatives: ["manual spreadsheets", "generic SaaS tools", "custom scripts", "existing apps found during repo research"],
    differentiatedWedge: "Start from working code, remove unrelated assumptions, and ship the user's narrow workflow faster than a blank scaffold.",
    primaryWorkflow: [
      "User starts the primary task from a clear first screen.",
      "User enters or selects the minimum information required.",
      "System produces the useful result, record, or decision.",
      "User reviews and edits the result.",
      "User saves, exports, or revisits the result."
    ],
    keyScreens: ["Start/new item", "Result/detail", "Saved library", "Settings/data", "Export/share"],
    coreDataObjects: ["UserInput", "Result", "SavedItem", "Settings", "Export"],
    userActions: ["create", "review", "edit", "save", "export", "delete"],
    systemStates: {
      empty: "No saved items; guide the user into the first task.",
      loading: "Primary task is running; show clear progress.",
      error: "Task failed; preserve input and explain retry/recovery.",
      noResult: "No useful result; suggest narrower input or alternate path.",
      partialSuccess: "Some useful data exists; let the user save it and continue."
    },
    mvpRequirements: ["One primary task", "One useful result/detail surface", "Save/revisit", "Export/backup", "Empty/loading/error/no-result states"],
    explicitNonGoals: ["No broad admin system", "No team/billing unless the idea requires it", "No unrelated starter features", "No copied assets or license-unclear code"],
    trustPrivacySafety: ["Document what data is stored", "Check license before reuse", "Keep secrets out of client/logs", "Avoid claims that were not verified"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the smallest vertical slice: create the main item, produce the useful result, save it, and export it.",
    successMetrics: ["A new user completes the primary workflow without setup help", "The result survives refresh", "The repo reuse decision is documented"],
    wowDemoScript: ["Start from empty state", "Complete primary workflow", "Save result", "Export or revisit result"],
    inferredFrom: ["fallback blueprint", repo ? "selected repo metadata" : "user idea"]
  };
}

export function buildHandoffBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const signal = textFrom(input);
  if (/\b(pokemon|pok[eé]mon|tcg|trading[-\s]?card|card collector|card collection|collector album|card binder|card value|tcgdex|tcgplayer|cardmarket)\b/i.test(signal)) {
    return cardCollectorBlueprint(input);
  }
  if (/\b(recipe|recipes|grocery list|meal plan|ingredients?|cookbook|cooking|bookmark manager)\b/i.test(signal)) {
    return recipeBookmarkBlueprint(input);
  }
  return genericWorkflowBlueprint(input);
}
