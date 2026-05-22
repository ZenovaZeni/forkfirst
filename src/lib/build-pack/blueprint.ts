import type { IdeaCheckResult } from "@/types/idea-check";
import { isLikelyReceiptScannerTypo, normalizeLikelyReceiptScannerTypo } from "../intent/normalize";
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
  | "receipt-expense"
  | "grocery-shopping"
  | "appointment-booking"
  | "prompt-library"
  | "sports-schedule"
  | "pet-identification"
  | "service-business-crm"
  | "real-estate-leads"
  | "ecommerce-dashboard"
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
  /^i don'?t know\b/i,
  /\bkeep whatever you need\b/i,
  /^whatever you need$/i,
  /^your app$/i,
  /^untitled app$/i
];

function preferenceText(preferences: BuildPackPreferences | undefined): string {
  if (!preferences) return "";
  return Object.values(preferences)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value): value is string => typeof value === "string" && !isGenericBuildPackPreference(value))
    .join(" ");
}

function directTextFrom(input: HandoffSignalInput): string {
  return [
    input.originalIdea,
    input.researchContext,
    input.chatContext,
    preferenceText(input.preferences),
    ...input.queries
  ]
    .filter(Boolean)
    .map((value) => normalizeLikelyReceiptScannerTypo(String(value)))
    .join(" ")
    .toLowerCase();
}

function textFrom(input: HandoffSignalInput): string {
  const repo = input.selectedRepo;
  return [
    input.originalIdea,
    input.researchContext,
    input.chatContext,
    preferenceText(input.preferences),
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
    .map((value) => normalizeLikelyReceiptScannerTypo(String(value)))
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

function receiptExpenseBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  const repo = input.selectedRepo;
  return {
    productKind: "receipt-expense",
    confidence: 86,
    productThesis: `${name || "The app"} should help people capture receipts, review parsed expense details, keep a local-first expense record, and export a clean CSV for tax prep.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? "People organizing receipts and expenses for tax prep without wanting a heavy accounting suite.",
    jobToBeDone: "When I have receipts to organize, I want to capture or upload them, review the parsed merchant/date/amount/category fields, save corrected expense records, and export a predictable CSV for taxes.",
    currentAlternatives: ["paper receipts", "camera roll albums", "spreadsheet trackers", "bank exports", "full accounting apps"],
    differentiatedWedge: `Use ${repo?.fullName ?? "the selected repo"} as foundation evidence for receipt analysis, expense data, import/export, setup, or app structure, then narrow the final product around one trustworthy receipt review and CSV export loop.`,
    primaryWorkflow: [
      "User captures, uploads, or manually adds a receipt.",
      "System extracts merchant, date, total, tax, category, notes, and optional raw OCR/AI output.",
      "User reviews the parsed receipt fields, fixes mistakes, and marks the expense as ready.",
      "User sees saved expenses in a searchable local ledger with filters for date, category, merchant, and tax status.",
      "User exports selected expenses to CSV with documented headers for tax prep or spreadsheet review."
    ],
    keyScreens: ["Receipt capture", "Parsed receipt review", "Expense ledger", "Expense detail", "CSV export", "Local data and backup settings"],
    coreDataObjects: ["Receipt", "ReceiptImage", "ParsedReceipt", "ExpenseRecord", "Merchant", "ExpenseCategory", "CsvExport", "LocalBackup"],
    userActions: ["capture or upload receipts", "review parsed receipt fields", "edit merchant, date, total, tax, and category", "save corrected expenses", "filter the expense ledger", "export selected expenses to CSV"],
    systemStates: {
      empty: "No receipts yet; show upload/capture/manual-entry options and a sample CSV preview.",
      loading: "Parsing receipt data; keep the original image/file visible and show progress.",
      error: "Receipt parsing failed; preserve the upload and offer retry plus manual expense entry.",
      noResult: "No expenses match the current filters; offer filter reset and CSV export guidance.",
      partialSuccess: "Some receipt fields were parsed; flag missing merchant/date/amount/category fields for manual review."
    },
    mvpRequirements: [
      "Receipt capture/upload/manual-entry flow.",
      "Parsed receipt review before anything is saved as final.",
      "ExpenseRecord model with merchant, date, total, tax, category, notes, source receipt, and reviewed status.",
      "Local-first persistence with backup, export, and clear-data controls.",
      "Expense ledger with search/filter by date, merchant, category, reviewed status, and tax status.",
      "CSV export with stable documented headers and selected-date-range support.",
      "Clear empty/loading/error/partial-success states for parsing and export."
    ],
    explicitNonGoals: [
      "No full accounting, payroll, invoicing, or business tax filing in v1.",
      "No claim that OCR/AI parsing is always correct; user review is required.",
      "No cloud sync before local storage, backup, and clear-data behavior is reliable.",
      "No hidden export fields or undocumented CSV format.",
      "No private receipt image uploads to third-party services unless the user explicitly configures that provider."
    ],
    trustPrivacySafety: [
      "Document where receipt images, parsed text, and expense records are stored.",
      "Make local-first behavior, backup, export, and clear-data controls visible.",
      "Treat OCR/AI results as drafts until reviewed by the user.",
      "Never include API keys, raw provider responses, or hidden fields in CSV exports.",
      repo?.license ? `Confirm ${repo.fullName}'s ${repo.license} license, notices, assets, and dependency terms before copying code.` : "Confirm license, notices, assets, and dependency terms before copying code."
    ],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the receipt-to-CSV loop: add one receipt, parse or manually enter fields, review and correct the expense, save it locally, filter it in the ledger, and export a CSV.",
    successMetrics: [
      "A user can add and review one receipt in under two minutes.",
      "Saved expense records survive refresh and can be backed up or cleared.",
      "CSV export contains stable headers and only the selected expense fields.",
      "The UI makes parsed data feel reviewable, not magically guaranteed."
    ],
    wowDemoScript: [
      "Start with an empty local receipt workspace.",
      "Upload or manually add a sample receipt.",
      "Show parsed fields and correct one mistake.",
      "Save the reviewed expense and find it in the ledger.",
      "Export a CSV and show the headers."
    ],
    inferredFrom: ["user idea", repo ? "selected repo metadata" : "receipt/expense blueprint", "search queries"]
  };
}

function groceryShoppingBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  const signal = directTextFrom(input);
  const priceFocused = /\b(cheap|cheaper|cheapest|price|prices|deal|deals|coupon|coupons|sale|sales|discount|compare|comparison|budget|save money|savings|cost)\b/i.test(signal);
  return {
    productKind: "grocery-shopping",
    confidence: priceFocused ? 82 : 70,
    productThesis: priceFocused
      ? `${name || "The app"} should help shoppers build a grocery list, compare store prices or deals with source/date context, and keep a reusable record of what saves money.`
      : `${name || "The app"} should help shoppers plan groceries, manage a reusable shopping list, track pantry or favorite items, and get through the store with less friction.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? (priceFocused ? "A household shopper trying to keep grocery costs down across stores without juggling notes, ads, and spreadsheets." : "A household shopper who wants one practical place to plan, reuse, and finish grocery trips."),
    jobToBeDone: priceFocused
      ? "When I need groceries, I want to build a list, compare realistic prices or deals, decide where to shop, and save what I learned for next time."
      : "When I need groceries, I want to build a list quickly, reuse common items, check what I already have, and leave with a clean shopping plan.",
    currentAlternatives: priceFocused
      ? ["store apps", "weekly ads", "coupon sites", "notes apps", "spreadsheets", "manual price comparison"]
      : ["paper lists", "notes apps", "store apps", "recipe apps", "shared family chats"],
    differentiatedWedge: priceFocused
      ? "Start from the grocery-list foundation, then add price/deal comparison, source/date labels, and local history so the product is about cheaper shopping, not just recipes."
      : "Start from the grocery-list foundation, then simplify around one fast planning loop with persistent lists, reusable items, and clean export/share.",
    primaryWorkflow: priceFocused
      ? [
          "User creates or reuses a grocery list.",
          "User enters items, quantities, preferred stores, and optional budget.",
          "System shows price/deal entries with source, date, confidence, and manual-entry fallback.",
          "User chooses a store plan or split-by-store list.",
          "User saves the trip, exports the list, and reuses price history next time."
        ]
      : [
          "User creates or reuses a grocery list.",
          "User adds items, quantities, categories, and notes.",
          "User checks pantry/favorites or recurring items.",
          "User organizes the list by aisle, store section, or priority.",
          "User saves, copies, or exports the list for the shopping trip."
        ],
    keyScreens: priceFocused
      ? ["Shopping list", "Price/deal comparison", "Store plan", "Item detail/history", "Saved trips", "Import/export", "Settings/data sources"]
      : ["Shopping list", "Pantry/favorites", "Item detail", "Store/aisle view", "Saved lists", "Import/export"],
    coreDataObjects: priceFocused
      ? ["GroceryItem", "ShoppingList", "Store", "PriceSnapshot", "Deal", "Budget", "SavedTrip", "Export"]
      : ["GroceryItem", "ShoppingList", "PantryItem", "FavoriteItem", "StoreSection", "SavedTrip", "Export"],
    userActions: priceFocused
      ? ["create grocery list", "add item and quantity", "compare price/deal options", "choose store plan", "save trip", "export list"]
      : ["create grocery list", "add item and quantity", "reuse favorites", "organize by aisle", "save trip", "export list"],
    systemStates: {
      empty: "No list yet; show one clear list starter and optional common grocery suggestions.",
      loading: priceFocused ? "Fetching or calculating price/deal options; keep the list visible." : "Preparing list suggestions or saved items; keep the list editable.",
      error: priceFocused ? "Price/deal lookup failed; preserve the list and allow manual price entry." : "List action failed; preserve the user's items and offer retry.",
      noResult: priceFocused ? "No price found for an item; let the user save it with unknown price or manual entry." : "No saved item matches; let the user add it as a new item.",
      partialSuccess: priceFocused ? "Some item prices were found; clearly mark missing or stale prices." : "Some list data saved; clearly mark anything still unsynced or missing."
    },
    mvpRequirements: priceFocused
      ? ["Persistent grocery list", "Store/item price or deal entries with source/date", "Manual price fallback", "Best-store or split-store plan", "Save/export list and trip history"]
      : ["Persistent grocery list", "Reusable favorite items", "Pantry or saved-list support", "Store/aisle grouping", "Copy/export list"],
    explicitNonGoals: priceFocused
      ? ["No automated scraping claims until store terms and data sources are verified", "No guaranteed cheapest-price claims", "No checkout, delivery, or payment flow in v1", "No account sync before local persistence/export works"]
      : ["No recipe social network", "No delivery checkout or payments in v1", "No complex meal-planning engine before the list loop works", "No account sync before local persistence/export works"],
    trustPrivacySafety: priceFocused
      ? ["Label prices as estimates with source/date when possible", "Respect store and coupon source terms", "Keep shopping history exportable", "Do not claim every store or item is covered"]
      : ["Keep list data exportable", "Document whether data is local or synced", "Do not claim pantry accuracy without user confirmation", "Respect source terms for any imported data"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? (priceFocused ? "Build the grocery savings loop: create a list, add three items, enter or fetch price options for two stores, choose a shopping plan, save it, and export/copy the list." : "Build the grocery list loop: create a list, add recurring items, organize by section, save it, and export/copy it."),
    successMetrics: priceFocused
      ? ["A shopper can create a list and compare prices for three items in under two minutes.", "Saved lists and price entries survive refresh.", "The UI clearly labels prices as estimates with source/date or manual-entry status."]
      : ["A shopper can create and reuse a list in under one minute.", "Saved lists survive refresh.", "The list can be copied or exported for a real shopping trip."],
    wowDemoScript: priceFocused
      ? ["Create a grocery list with three common items.", "Show price/deal options for at least two stores or manual sample sources.", "Choose a cheaper store plan.", "Save the trip and export/copy the list."]
      : ["Create a grocery list.", "Add favorite or recurring items.", "Group by section.", "Save and export/copy the list."],
    inferredFrom: ["user idea", input.selectedRepo ? "selected repo metadata" : "fallback blueprint"]
  };
}

function isReceiptExpenseIntent(signal: string, recipeScannerMeansReceipt: boolean): boolean {
  const hasReceiptOrExpense = /\b(receipts?|receipt scanner|expenses?|expense tracker|bookkeeping|reimbursement)\b/i.test(signal);
  const hasReceiptWorkflow = /\b(receipts?|receipt scanner|scanner|scan|ocr|parsed|parse|expenses?|expense tracker|csv|export|tax(?:es)?|bookkeeping|reimbursement)\b/i.test(signal);
  return recipeScannerMeansReceipt || (hasReceiptOrExpense && hasReceiptWorkflow);
}

function appointmentBookingBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  const salonFocused = /\b(salon|spa|barber|barbershop)\b/i.test(directTextFrom(input));
  return {
    productKind: "appointment-booking",
    confidence: salonFocused ? 78 : 72,
    productThesis: `${name || "The app"} should help ${salonFocused ? "a small salon or service business" : "a service business"} publish availability, let clients book appointments, and keep staff, services, confirmations, and rescheduling in one simple flow.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? (salonFocused ? "A small salon owner or stylist who needs simple booking without a heavy scheduling platform." : "A small service-business owner who needs clients to book time without back-and-forth messages."),
    jobToBeDone: "When a client wants an appointment, they should see real availability, choose a service and time, share contact details, and get a clear confirmation the business can manage.",
    currentAlternatives: ["phone calls", "text messages", "Google Calendar", "Calendly-style links", "salon management apps", "paper schedules"],
    differentiatedWedge: "Use the appointment foundation for scheduling mechanics, then specialize the product around services, staff, client-friendly booking, confirmations, and rescheduling.",
    primaryWorkflow: [
      "Owner creates services with duration, price, and assigned staff.",
      "Owner defines staff availability, blocked time, and booking rules.",
      "Client chooses a service, staff member, date, and available time.",
      "Client enters contact details and confirms the appointment.",
      "Owner and client can view, cancel, or reschedule the appointment."
    ],
    keyScreens: ["Service setup", "Staff availability", "Booking calendar", "Client booking form", "Appointment detail", "Owner schedule", "Confirmation/reschedule"],
    coreDataObjects: ["Service", "StaffMember", "AvailabilityWindow", "BlockedTime", "Appointment", "Client", "Confirmation", "Reminder"],
    userActions: ["create service", "set availability", "book appointment", "confirm contact details", "reschedule appointment", "cancel appointment", "view daily schedule"],
    systemStates: {
      empty: "No services or availability yet; guide the owner to add the first service and staff schedule.",
      loading: "Loading available times; keep selected service and date visible.",
      error: "Booking failed; preserve the client's choices and explain how to retry.",
      noResult: "No times are available; offer another date, staff member, or waitlist/manual contact fallback.",
      partialSuccess: "Appointment saved but reminder/notification was not sent; mark it clearly for the owner."
    },
    mvpRequirements: ["Service catalog", "Staff availability", "Client booking flow", "Appointment confirmation", "Owner schedule view", "Cancel/reschedule path"],
    explicitNonGoals: ["No payroll, POS, inventory, or full CRM in v1", "No marketplace of salons", "No payments until booking flow is reliable", "No SMS/email automation without provider setup and limits"],
    trustPrivacySafety: ["Document where client contact details are stored", "Avoid exposing private calendars", "Keep confirmation messages clear about pending vs confirmed status", "Do not promise reminders unless they are wired and tested"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the booking loop: owner creates one service and staff availability, client books a time, owner sees the appointment, and the appointment can be cancelled or rescheduled.",
    successMetrics: ["A client can book a valid appointment without back-and-forth.", "Owner can see the day's appointments at a glance.", "Double-booking is prevented or clearly flagged."],
    wowDemoScript: ["Create a haircut or service appointment type.", "Add staff availability for the week.", "Book an appointment as a client.", "Show it on the owner schedule.", "Reschedule or cancel it."],
    inferredFrom: ["user idea", input.selectedRepo ? "selected repo metadata" : "fallback blueprint"]
  };
}

function promptLibraryBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  return {
    productKind: "prompt-library",
    confidence: 76,
    productThesis: `${name || "The app"} should help creators save, tag, search, compare, and reuse AI image prompts without turning into an image generator itself.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? "A creator who experiments with image prompts and wants a private library of reusable prompt ideas, outputs, tags, and notes.",
    jobToBeDone: "When I find or write a useful image prompt, I want to save it with context, find it later, reuse variations, and copy it into my image tool quickly.",
    currentAlternatives: ["notes apps", "spreadsheets", "Discord messages", "prompt marketplaces", "image generator history"],
    differentiatedWedge: "Focus on prompt organization and reuse first: tags, examples, notes, favorites, variants, and copy/export instead of trying to generate images in v1.",
    primaryWorkflow: [
      "User saves a prompt with title, prompt text, model/tool, tags, and optional output image reference.",
      "User groups prompts by project, style, subject, or client.",
      "User searches and filters prompts by tags, model, style, or favorite status.",
      "User opens a prompt, edits variants and notes, then copies it to another AI tool.",
      "User exports or backs up the prompt library."
    ],
    keyScreens: ["Prompt capture", "Prompt library", "Prompt detail", "Tag/style filters", "Favorites", "Variant editor", "Export/backup"],
    coreDataObjects: ["Prompt", "PromptVariant", "Tag", "Project", "ModelTool", "OutputReference", "Favorite", "Export"],
    userActions: ["save prompt", "tag prompt", "search prompts", "edit variant", "copy prompt", "favorite prompt", "export library"],
    systemStates: {
      empty: "No prompts saved; show a simple prompt capture form and sample tag suggestions.",
      loading: "Searching or saving prompt data; keep the current prompt visible.",
      error: "Save/search failed; preserve the prompt text and allow retry/export fallback.",
      noResult: "No prompts match filters; offer filter reset and new prompt capture.",
      partialSuccess: "Prompt saved but image/reference metadata missing; let the user add it later."
    },
    mvpRequirements: ["Prompt save/edit", "Tagging and project grouping", "Search/filter library", "Copy prompt action", "Favorites", "Export/backup"],
    explicitNonGoals: ["No image generation engine in v1", "No paid prompt marketplace", "No public social feed", "No claims about prompt ownership or model output rights without review"],
    trustPrivacySafety: ["Keep prompts exportable", "Document whether prompts stay local", "Avoid storing API keys in prompt metadata", "Do not assume generated images are licensed for reuse"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the prompt-library loop: save an image prompt, tag it, find it with search/filter, copy a variant, and export the library.",
    successMetrics: ["A user can save and retrieve a prompt in under one minute.", "Prompt copy works from detail and list views.", "Saved prompt data survives refresh and exports cleanly."],
    wowDemoScript: ["Save a cinematic image prompt.", "Tag it by style and subject.", "Find it through filters.", "Create a variant.", "Copy and export it."],
    inferredFrom: ["user idea", input.selectedRepo ? "selected repo metadata" : "fallback blueprint"]
  };
}

function sportsScheduleBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  return {
    productKind: "sports-schedule",
    confidence: 74,
    productThesis: `${name || "The app"} should help parents keep kids' sports practices, games, locations, teams, and reminders organized in one practical schedule.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? "Parents juggling multiple kids, teams, practices, games, locations, and last-minute schedule changes.",
    jobToBeDone: "When a sports schedule changes, I want to know where each kid needs to be, when to leave, what to bring, and whether anything conflicts.",
    currentAlternatives: ["team emails", "group chats", "paper calendars", "Google Calendar", "TeamSnap-style apps", "school/league websites"],
    differentiatedWedge: "Focus on the parent dashboard: all kids, teams, games, practices, locations, reminders, conflicts, and export/share from one calm view.",
    primaryWorkflow: [
      "Parent creates child, team, and season records.",
      "Parent adds games, practices, locations, uniforms, and notes.",
      "App shows a combined calendar and flags conflicts.",
      "Parent sets reminders and marks what to bring.",
      "Parent exports or shares the weekly schedule."
    ],
    keyScreens: ["Family dashboard", "Calendar", "Add event", "Child/team profile", "Conflict view", "Reminder checklist", "Export/share"],
    coreDataObjects: ["Child", "Team", "Season", "SportsEvent", "Location", "Reminder", "GearChecklist", "ScheduleExport"],
    userActions: ["add child", "add team", "add practice", "add game", "set reminder", "check conflict", "share schedule"],
    systemStates: {
      empty: "No teams or events yet; guide parent to add one child and one upcoming game.",
      loading: "Loading schedule; keep the week visible.",
      error: "Event save failed; preserve details and offer retry.",
      noResult: "No events for this filter; show the next empty week and add-event action.",
      partialSuccess: "Event saved but reminder/export failed; keep schedule accurate and mark reminder status."
    },
    mvpRequirements: ["Child/team setup", "Practice/game event creation", "Combined family calendar", "Conflict detection", "Reminder/checklist notes", "Export/share weekly schedule"],
    explicitNonGoals: ["No league-wide management system", "No payments or registration", "No public roster with children's private details", "No real-time chat in v1"],
    trustPrivacySafety: ["Keep children's personal details minimal", "Make export/share intentional", "Avoid public URLs for private family schedules by default", "Document local vs synced storage"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the family schedule loop: add two kids, two teams, practices/games, conflict detection, reminders, and a share/export weekly view.",
    successMetrics: ["Parent can see the next seven days across all kids.", "Conflicts are visible before saving or sharing.", "Schedule data survives refresh and exports cleanly."],
    wowDemoScript: ["Add two kids and teams.", "Add a practice and game with locations.", "Show a conflict or reminder.", "Export/share the weekly schedule."],
    inferredFrom: ["user idea", input.selectedRepo ? "selected repo metadata" : "fallback blueprint"]
  };
}

function petIdentificationBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  return {
    productKind: "pet-identification",
    confidence: 68,
    productThesis: `${name || "The app"} should help cat owners or cat-loving clients identify a cat or breed, save a pet profile, and keep useful notes without confusing the product with Unix cat tools.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? "Cat owners, rescues, or pet lovers who want a friendly way to identify cats and save pet details.",
    jobToBeDone: "When I see or add a cat, I want to capture a photo or details, get an identification or breed estimate, and save the result with notes I can revisit.",
    currentAlternatives: ["image search", "breed guides", "vet/rescue records", "notes apps", "pet profile apps"],
    differentiatedWedge: "Use image-recognition or pet-profile foundations only where they help, then build a clear identify-save-profile loop with estimate language.",
    primaryWorkflow: ["User adds a cat photo or description.", "App returns breed/identity suggestions with confidence/estimate wording.", "User saves a cat profile with name, notes, traits, and photos.", "User reviews saved cats and exports or shares a profile."],
    keyScreens: ["Identify cat", "Result/detail", "Cat profile", "Saved cats", "Notes/photos", "Export/share"],
    coreDataObjects: ["CatProfile", "Photo", "IdentificationResult", "BreedEstimate", "Trait", "Note", "Export"],
    userActions: ["upload photo", "enter cat details", "review estimate", "save profile", "edit notes", "export profile"],
    systemStates: {
      empty: "No cats saved; show photo upload/manual profile actions.",
      loading: "Identifying cat details; keep the photo visible.",
      error: "Identification failed; allow manual profile creation.",
      noResult: "No confident breed match; label as unknown and let the user save notes.",
      partialSuccess: "Profile saved but breed estimate missing; mark estimate as unavailable."
    },
    mvpRequirements: ["Photo/manual profile input", "Identification result with estimate wording", "Saved cat profiles", "Notes and traits", "Export/share profile"],
    explicitNonGoals: ["No medical diagnosis", "No guaranteed breed claims", "No public lost-pet network in v1", "No protected dataset/image use without checking terms"],
    trustPrivacySafety: ["Label breed results as estimates", "Do not claim medical accuracy", "Document image storage", "Make sharing/export intentional"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the cat ID loop: add a cat photo or details, show estimated identification, save a cat profile, edit notes, and export/share it.",
    successMetrics: ["A user can create and save a cat profile in under one minute.", "Estimate wording is clear.", "Saved profiles survive refresh and export correctly."],
    wowDemoScript: ["Add a cat photo/details.", "Show breed/identity estimate language.", "Save the profile.", "Edit notes.", "Export/share the profile."],
    inferredFrom: ["user idea", input.selectedRepo ? "selected repo metadata" : "fallback blueprint"]
  };
}

function serviceBusinessCrmBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  const directSignal = directTextFrom(input);
  const roofingFocused = /\b(roofing|roofer|roofers)\b/i.test(directSignal);
  const cleaningFocused = /\b(cleaning|cleaner|cleaners|janitorial|maid|maids|housekeeping|house cleaner|commercial cleaning|residential cleaning)\b/i.test(directSignal);
  const trade = roofingFocused ? "roofing" : cleaningFocused ? "cleaning" : "service";
  if (cleaningFocused) {
    return {
      productKind: "service-business-crm",
      confidence: 80,
      productThesis: `${name || "The app"} should help a cleaning company manage quote requests, accepted jobs, crew assignments, job notes, and follow-ups without becoming a generic CRM or invoice-only tool.`,
      targetUserSegment: stringPreference(input.preferences, "audience") ?? "A cleaning company owner, dispatcher, office manager, or crew lead who needs quotes, scheduled jobs, crews, and follow-ups in one practical workflow.",
      jobToBeDone: "When a cleaning request comes in, the business should capture the customer/property, create a quote, turn accepted work into scheduled jobs, assign the right crew, and know which follow-up is due next.",
      currentAlternatives: ["spreadsheets", "paper schedules", "shared calendars", "phone notes", "generic CRMs", "field-service platforms", "invoice-only apps"],
      differentiatedWedge: "Use invoice or CRM foundations only for contacts, quotes, status, and persistence, then specialize the product around cleaning jobs, crew scheduling, service checklists, and follow-up discipline.",
      primaryWorkflow: [
        "Office adds a customer/property and quote request with service type, location, frequency, access notes, and requested date.",
        "Estimator creates a cleaning quote with scope, rooms/areas, checklist items, price, and quote status.",
        "Dispatcher converts an accepted quote into one-time or recurring jobs and assigns a crew, date/time window, and supplies/checklist.",
        "Crew lead updates job status, completion notes, photos or issues, and any follow-up needed.",
        "Owner reviews quote follow-ups, upcoming jobs, completed work, and exportable customer/job history."
      ],
      keyScreens: ["Quote intake", "Customer/property detail", "Quote builder", "Job schedule", "Crew dispatch", "Crew job view", "Follow-up queue", "Export/report"],
      coreDataObjects: ["Customer", "Property", "Quote", "Job", "Crew", "CrewMember", "ServiceChecklist", "FollowUpTask", "JobNote", "Attachment"],
      userActions: ["add customer/property", "create quote", "convert quote to job", "assign crew", "update job status", "record job notes", "schedule follow-up", "export jobs"],
      systemStates: {
        empty: "No customers, quotes, or jobs yet; guide the user to create the first quote request.",
        loading: "Loading schedule, crew assignments, and follow-ups; keep the current day/week visible.",
        error: "Save or scheduling action failed; preserve quote/job details and explain retry.",
        noResult: "No jobs or quotes match the filter; offer reset and create-quote actions.",
        partialSuccess: "Quote or job saved but crew assignment, attachment, or follow-up failed; flag what still needs attention."
      },
      mvpRequirements: ["Customer/property intake", "Quote builder", "Job scheduling", "Crew assignment", "Crew job checklist/notes", "Follow-up queue", "CSV/JSON export or report"],
      explicitNonGoals: ["No full accounting, payroll, or tax workflow in v1", "No automated SMS/email follow-ups before consent and provider limits are designed", "No route optimization before crew scheduling works", "No multi-branch enterprise permissions before the owner/dispatcher workflow is proven"],
      trustPrivacySafety: ["Protect customer addresses, phone numbers, access notes, and job photos", "Do not log private customer/job notes", "Label exported customer/job data clearly", "Document where attachments and local backups are stored"],
      firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the cleaning ops loop: add a customer/property, create a quote, convert it into a scheduled job, assign a crew, update job status, and show the follow-up queue.",
      successMetrics: ["A dispatcher can create a quote and schedule a crew in under two minutes.", "Every scheduled job shows customer, property, crew, checklist, and next follow-up.", "Customer/job data survives refresh and exports cleanly."],
      wowDemoScript: ["Add a cleaning quote request.", "Convert the accepted quote into a scheduled job.", "Assign a crew and checklist.", "Mark the job complete with notes.", "Show the follow-up queue and export/report."],
      inferredFrom: ["user idea", input.selectedRepo ? "selected repo metadata" : "fallback blueprint"]
    };
  }
  return {
    productKind: "service-business-crm",
    confidence: roofingFocused ? 78 : 72,
    productThesis: `${name || "The app"} should help a small ${trade} business track customers, leads, estimates, jobs, notes, and follow-ups without turning into a heavy generic CRM.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? (roofingFocused ? "A small roofing company owner, office manager, or estimator who needs to keep leads, estimates, jobs, and follow-ups organized." : "A small contractor or service-business team that needs customer, job, estimate, and follow-up tracking."),
    jobToBeDone: "When a new lead or customer calls, the business should capture the job context, create or update an estimate, track status, and know exactly who needs the next follow-up.",
    currentAlternatives: ["spreadsheets", "paper job folders", "phone notes", "generic CRMs", "field-service platforms", "shared calendars"],
    differentiatedWedge: "Use CRM foundations for contacts, notes, tasks, and status history, then specialize around service-business jobs, estimates, follow-ups, and owner-friendly daily views.",
    primaryWorkflow: [
      "Office or owner adds a lead/customer with contact details and job type.",
      "Estimator records property/job notes, photos or attachments, and estimate status.",
      "Team moves the opportunity through lead, estimate sent, won/lost, scheduled, in progress, and completed.",
      "App shows follow-ups due today and stale leads that need attention.",
      "Owner exports or reviews the pipeline by job status, estimate value, and next action."
    ],
    keyScreens: ["Lead capture", "Customer detail", "Estimate/job detail", "Pipeline board", "Follow-up queue", "Daily schedule", "Export/report"],
    coreDataObjects: ["Customer", "Lead", "Property", "Estimate", "Job", "FollowUpTask", "Note", "Attachment", "PipelineStage"],
    userActions: ["add lead", "update customer", "create estimate", "move job stage", "schedule follow-up", "record note", "export pipeline"],
    systemStates: {
      empty: "No customers or leads yet; guide the user to add the first lead.",
      loading: "Loading pipeline and follow-ups; keep the current board visible.",
      error: "Save failed; preserve lead/customer input and allow retry.",
      noResult: "No leads match the filter; offer reset and add-lead actions.",
      partialSuccess: "Lead saved but attachment/report/follow-up failed; mark what still needs attention."
    },
    mvpRequirements: ["Lead/customer capture", "Estimate and job status tracking", "Follow-up task queue", "Customer/job notes", "Simple pipeline board", "Export/report"],
    explicitNonGoals: ["No full accounting or payroll", "No insurance-claim automation in v1", "No multi-branch enterprise CRM", "No automated SMS/email outreach before consent and provider limits are designed"],
    trustPrivacySafety: ["Protect customer contact details", "Label exported data clearly", "Do not log private customer notes", "Document where attachments and customer data are stored"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the service CRM loop: add a lead, create an estimate/job, move it through stages, add a follow-up, and show today's follow-up queue.",
    successMetrics: ["A user can add a lead and schedule a follow-up in under one minute.", "The pipeline shows each job's next action.", "Customer/job notes survive refresh and export cleanly."],
    wowDemoScript: ["Add a roofing lead.", "Create an estimate/job record.", "Move it to estimate sent.", "Add a follow-up due today.", "Show the pipeline and export/report."],
    inferredFrom: ["user idea", input.selectedRepo ? "selected repo metadata" : "fallback blueprint"]
  };
}

function realEstateLeadsBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  return {
    productKind: "real-estate-leads",
    confidence: 74,
    productThesis: `${name || "The app"} should help realtors collect compliant lead sources, qualify prospects, organize follow-ups, and turn research into a next-action list.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? "A realtor, broker, or real-estate operator who wants practical lead research and follow-up support without a bloated CRM.",
    jobToBeDone: "When a realtor finds a possible lead source, they need to save the source, qualify the contact or business, add context, and know the next follow-up action.",
    currentAlternatives: ["spreadsheets", "generic CRMs", "Google Maps/manual search", "property portals", "notes apps", "marketing automation tools"],
    differentiatedWedge: "Keep the first version focused on lead research, source notes, qualification, and follow-up organization while making compliance and data-source limits explicit.",
    primaryWorkflow: [
      "User defines a target niche, area, or source type.",
      "App captures or imports lead/source details with clear source notes.",
      "User qualifies the lead with status, value, tags, and next action.",
      "User schedules follow-up and sees a prioritized follow-up queue.",
      "User exports a small campaign or follow-up brief."
    ],
    keyScreens: ["Lead/source search", "Lead detail", "Qualification board", "Follow-up queue", "Source/compliance notes", "Export brief"],
    coreDataObjects: ["Lead", "LeadSource", "PropertyArea", "Qualification", "FollowUpTask", "ContactMethod", "ComplianceNote", "Export"],
    userActions: ["add lead source", "save prospect", "qualify lead", "schedule follow-up", "tag area", "export follow-up brief"],
    systemStates: {
      empty: "No leads or sources yet; guide the user to define a target area or import a small sample.",
      loading: "Loading lead/source results; keep source and filter context visible.",
      error: "Lead/source action failed; preserve input and explain retry.",
      noResult: "No leads match; suggest a different area, niche, or manual source entry.",
      partialSuccess: "Lead saved but follow-up/export failed; keep the saved lead and flag the missing action."
    },
    mvpRequirements: ["Lead/source capture", "Qualification fields", "Follow-up queue", "Saved notes/tags", "Compliance/source notes", "Export follow-up brief"],
    explicitNonGoals: ["No bulk scraping that violates MLS, Zillow, Realtor.com, Google Maps, or other source terms", "No cold-call, SMS, or email automation without consent flows", "No full brokerage CRM in v1", "No hidden enrichment or background scraping"],
    trustPrivacySafety: ["Show source and consent notes", "Do not imply all scraping is allowed", "Keep contact data export intentional", "Document where lead data is stored"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the realtor lead loop: add or import a lead source, qualify one lead, schedule a follow-up, and export a follow-up brief with source/compliance notes.",
    successMetrics: ["A realtor can save and qualify a lead/source in one flow.", "Every lead has a visible next action.", "Source and compliance notes are present before export."],
    wowDemoScript: ["Define a target area.", "Save a lead source.", "Qualify one lead.", "Schedule a follow-up.", "Export the follow-up brief."],
    inferredFrom: ["user idea", input.selectedRepo ? "selected repo metadata" : "fallback blueprint"]
  };
}

function ecommerceDashboardBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  return {
    productKind: "ecommerce-dashboard",
    confidence: 76,
    productThesis: `${name || "The app"} should help a Shopify or ecommerce operator see profit, ad spend, inventory, orders, and margin signals in one decision dashboard.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? "A Shopify store owner or ecommerce operator who needs practical daily visibility into profit, ads, inventory, and order health.",
    jobToBeDone: "When I check the store, I want to see whether today's sales are profitable, which ad spend is working, what inventory needs attention, and what to do next.",
    currentAlternatives: ["Shopify admin", "ad platform dashboards", "spreadsheets", "inventory tools", "analytics apps", "manual reports"],
    differentiatedWedge: "Start with a clean owner dashboard that combines orders, costs, ad spend, inventory, and margin assumptions before adding deep integrations.",
    primaryWorkflow: [
      "User connects or imports Shopify order data, ad spend, product costs, and inventory counts.",
      "App normalizes the data into daily revenue, cost, ad spend, inventory, and margin views.",
      "User sees profit, ROAS/CAC-style ad signals, low-stock items, and order trends.",
      "User filters by date range, channel, product, or campaign.",
      "User exports a daily or weekly store-health report."
    ],
    keyScreens: ["Dashboard overview", "Profit and margin", "Ad spend", "Inventory health", "Orders/products", "Import/connect settings", "Export report"],
    coreDataObjects: ["Order", "Product", "InventoryItem", "AdSpend", "CostOfGoods", "ProfitMetric", "Campaign", "StoreReport"],
    userActions: ["import orders", "enter product cost", "import ad spend", "review inventory", "filter dashboard", "export report"],
    systemStates: {
      empty: "No store data yet; offer sample data and import/connect actions.",
      loading: "Syncing or calculating metrics; show last-known dashboard state.",
      error: "Import/sync failed; explain which source failed and preserve existing metrics.",
      noResult: "No data for this filter; suggest a wider date range or sample data.",
      partialSuccess: "Orders loaded but ad spend/cost/inventory is missing; label estimated metrics clearly."
    },
    mvpRequirements: ["Orders/import path", "Product cost input", "Ad spend input/import", "Inventory status", "Profit/margin dashboard", "Date/product filters", "Export report"],
    explicitNonGoals: ["No full ERP or warehouse system in v1", "No automatic financial/tax claims", "No multi-store agency dashboard before one-store workflow works", "No paid ad platform automation before read-only reporting is stable"],
    trustPrivacySafety: ["Label estimated profit clearly", "Separate missing costs from real zero costs", "Document API keys/import storage", "Do not expose store/customer data in logs"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the ecommerce dashboard loop: import/sample orders, enter costs and ad spend, show profit and inventory status, filter by date/product, and export a store-health report.",
    successMetrics: ["Owner can see profit, ad spend, and inventory in one view.", "Missing data is clearly labeled.", "Dashboard exports a useful daily/weekly summary."],
    wowDemoScript: ["Load sample Shopify orders.", "Add product costs and ad spend.", "Show profit and low-stock items.", "Filter by product/date.", "Export a store-health report."],
    inferredFrom: ["user idea", input.selectedRepo ? "selected repo metadata" : "fallback blueprint"]
  };
}

const SYNTHESIS_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "already",
  "also",
  "and",
  "app",
  "application",
  "apps",
  "build",
  "building",
  "can",
  "could",
  "every",
  "for",
  "from",
  "have",
  "help",
  "helps",
  "into",
  "just",
  "lets",
  "like",
  "make",
  "need",
  "needs",
  "one",
  "own",
  "repo",
  "repos",
  "show",
  "something",
  "stuff",
  "that",
  "their",
  "them",
  "then",
  "thing",
  "this",
  "through",
  "turn",
  "use",
  "user",
  "users",
  "want",
  "whatever",
  "where",
  "with",
  "without",
  "would",
  "your"
]);

const PRODUCT_WORDS = new Set([
  "assistant",
  "board",
  "builder",
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
  "tool",
  "workflow"
]);

const ACTION_WORDS = new Set([
  "add",
  "analyze",
  "book",
  "capture",
  "categorize",
  "clone",
  "compare",
  "create",
  "edit",
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
  "sort",
  "sync",
  "track",
  "upload"
]);

const FEATURE_OBJECT_MAP: Array<[RegExp, string]> = [
  [/\breceipts?\b/, "Receipt"],
  [/\bexpenses?\b/, "ExpenseRecord"],
  [/\bcsv\b|\bspreadsheet\b/, "CsvExport"],
  [/\bocr\b|\bparse[dr]?\b|\bscanner?\b/, "ParsedReceipt"],
  [/\blocal[-\s]?first\b|\blocal\b|\bbackup\b/, "LocalBackup"],
  [/\bphotos?\b|\bimages?\b|\bupload\b/, "UploadedFile"],
  [/\btranscripts?\b/, "Transcript"],
  [/\bclips?\b/, "Clip"],
  [/\bpodcasts?\b/, "Podcast"],
  [/\binvoices?\b/, "Invoice"],
  [/\bmessages?\b|\bmessaging\b/, "Message"],
  [/\breminders?\b|\bnotifications?\b/, "Reminder"],
  [/\bappointments?\b|\bbookings?\b/, "Appointment"],
  [/\bcustomers?\b|\bclients?\b/, "Customer"],
  [/\bwork[-\s]?orders?\b|\brepair requests?\b|\bmaintenance requests?\b/, "WorkOrder"],
  [/\btenants?\b/, "Tenant"],
  [/\blandlords?\b/, "Landlord"],
  [/\bvendors?\b/, "Vendor"],
  [/\binventory\b|\bstock\b/, "InventoryItem"],
  [/\breports?\b|\banalytics?\b|\bdashboard\b/, "Report"]
];

type SynthesizedIngredients = {
  ideaText: string;
  signalText: string;
  terms: string[];
  objectTerms: string[];
  productPhrase: string;
  objectLabel: string;
  primaryObject: string;
  dataObjects: string[];
  actions: {
    capture: boolean;
    parse: boolean;
    create: boolean;
    search: boolean;
    organize: boolean;
    schedule: boolean;
    track: boolean;
    analyze: boolean;
    review: boolean;
    save: boolean;
    export: boolean;
    notify: boolean;
    localFirst: boolean;
    ai: boolean;
  };
};

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function cleanForSynthesis(text: string): string {
  return normalizeLikelyReceiptScannerTypo(text)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/in:name,description,readme|in:name,description|github|open source/g, " ")
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularTerm(term: string): string {
  if (term === "taxes") return "tax";
  if (term === "parsed" || term === "parsing") return "parse";
  if (term === "tracks" || term === "tracking") return "track";
  if (term === "exports" || term === "exporting") return "export";
  if (term === "scans" || term === "scanning") return "scan";
  if (term === "saves" || term === "saving") return "save";
  if (term === "organizes" || term === "organizing") return "organize";
  if (term === "expenses") return "expense";
  if (term === "receipts") return "receipt";
  if (term.endsWith("ies") && term.length > 4) return `${term.slice(0, -3)}y`;
  if (term.endsWith("s") && term.length > 4 && !term.endsWith("ss")) return term.slice(0, -1);
  return term;
}

function tokenizeForSynthesis(text: string): string[] {
  return uniqueStrings(
    cleanForSynthesis(text)
      .split(/\s+/)
      .map(singularTerm)
      .filter((term) => term.length >= 3)
      .filter((term) => !SYNTHESIS_STOP_WORDS.has(term))
  );
}

function phraseCandidates(text: string): string[] {
  const words = cleanForSynthesis(text)
    .split(/\s+/)
    .map(singularTerm)
    .filter((term) => term.length >= 3)
    .filter((term) => !SYNTHESIS_STOP_WORDS.has(term));
  const phrases: string[] = [];
  for (let index = 0; index < words.length - 1; index += 1) {
    const pair = `${words[index]} ${words[index + 1]}`;
    const triple = words[index + 2] ? `${pair} ${words[index + 2]}` : "";
    if (PRODUCT_WORDS.has(words[index + 1]) || ACTION_WORDS.has(words[index + 1])) phrases.push(pair);
    if (triple && (PRODUCT_WORDS.has(words[index + 2]) || ACTION_WORDS.has(words[index + 2]))) phrases.push(triple);
  }
  return uniqueStrings(phrases);
}

function humanList(items: string[], fallback: string): string {
  if (items.length === 0) return fallback;
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function titleCaseTerm(term: string): string {
  return term
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function pascalCaseTerm(term: string): string {
  const special = term.toLowerCase();
  if (special === "csv") return "Csv";
  if (special === "ocr") return "Ocr";
  if (special === "api") return "Api";
  if (special === "crm") return "Crm";
  return titleCaseTerm(singularTerm(term)).replace(/\s+/g, "");
}

function objectNameFromTerm(term: string): string | null {
  const normalized = cleanForSynthesis(term);
  if (!normalized || SYNTHESIS_STOP_WORDS.has(normalized) || PRODUCT_WORDS.has(normalized) || ACTION_WORDS.has(normalized)) return null;
  if (["csv", "ocr", "tax", "taxes", "taxe", "receipt", "expense"].includes(normalized)) return null;
  if (normalized === "csv") return "CsvExport";
  if (normalized === "ocr") return "ParsedReceipt";
  if (normalized === "local" || normalized === "local-first") return "LocalBackup";
  return pascalCaseTerm(normalized);
}

function detectActions(text: string): SynthesizedIngredients["actions"] {
  return {
    capture: /\b(scan|scanner|capture|upload|photo|image|file|record)\b/i.test(text),
    parse: /\b(ocr|parse|extract|scan|scanner|transcribe|read)\b/i.test(text),
    create: /\b(create|build|add|new|make|generate)\b/i.test(text),
    search: /\b(search|find|lookup|discover|browse)\b/i.test(text),
    organize: /\b(organize|categorize|category|tag|sort|filter|album|binder|folder|library)\b/i.test(text),
    schedule: /\b(schedule|calendar|booking|appointment|reminder|availability)\b/i.test(text),
    track: /\b(track|tracking|log|monitor|history|status|progress)\b/i.test(text),
    analyze: /\b(analyze|summary|summarize|score|rank|insight|analytics|dashboard|report)\b/i.test(text),
    review: /\b(review|edit|approve|confirm|correct|adjust)\b/i.test(text),
    save: /\b(save|saved|store|storage|local|collection|library|vault|backup)\b/i.test(text),
    export: /\b(export|download|csv|pdf|json|share|copy)\b/i.test(text),
    notify: /\b(notify|notification|reminder|alert|email|message)\b/i.test(text),
    localFirst: /\b(local[-\s]?first|local|offline|browser|device|csv|backup)\b/i.test(text),
    ai: /\b(ai|ocr|llm|model|generate|classif|recognition|transcribe)\b/i.test(text)
  };
}

function productPhraseFrom(text: string, terms: string[], phrases: string[]): string {
  const explicitPhrase = phrases.find((phrase) => /\b(scanner|tracker|dashboard|portal|manager|generator|scheduler|organizer|crm|library|album|vault|board)\b/i.test(phrase));
  if (explicitPhrase) return explicitPhrase;
  const productWord = terms.find((term) => PRODUCT_WORDS.has(term));
  const objectTerm = terms.find((term) => !PRODUCT_WORDS.has(term) && !ACTION_WORDS.has(term));
  if (objectTerm && productWord) return `${objectTerm} ${productWord}`;
  const appLike = text.match(/\b(?:for|about|with)\s+(?:a|an|the)?\s*([a-z0-9+#.\s-]{4,60}?)(?:\s+that|\s+with|\s+where|,|\.|$)/i)?.[1]?.trim();
  return appLike || humanList(terms.slice(0, 2), "product workflow");
}

function extractTargetUser(text: string, objectLabel: string): string {
  if (/\bfor\s+tax(?:es)?\b/i.test(text)) return "people organizing receipts for tax prep";
  const forMatch = text.match(/\bfor\s+(?:a|an|the)?\s*([a-z0-9+#.\s-]{4,70}?)(?:\s+who|\s+that|\s+where|\s+to\s+|\s+with\s+|,|\.|$)/i);
  const candidate = forMatch?.[1]?.trim();
  if (candidate && !/\b(track|scan|export|manage|build|make|create)\b/i.test(candidate)) {
    return `${candidate.replace(/\s+/g, " ")} who needs a focused ${objectLabel} workflow`;
  }
  return `Someone who needs to manage ${objectLabel} without fighting a generic starter app`;
}

function deriveDataObjects(signalText: string, objectTerms: string[], actions: SynthesizedIngredients["actions"]): string[] {
  const mapped = FEATURE_OBJECT_MAP.flatMap(([pattern, objectName]) => pattern.test(signalText) ? [objectName] : []);
  const fromTerms = objectTerms.map(objectNameFromTerm).filter((item): item is string => Boolean(item));
  const actionObjects = [
    actions.review ? "ReviewState" : null,
    actions.search ? "SearchFilter" : null,
    actions.organize ? "CategoryOrTag" : null,
    actions.notify ? "Reminder" : null,
    actions.export ? "ExportJob" : null,
    actions.save ? "SavedRecord" : null
  ].filter((item): item is string => Boolean(item));
  return uniqueStrings([...mapped, ...fromTerms, ...actionObjects]).slice(0, 9);
}

function synthesizeIngredients(input: HandoffSignalInput): SynthesizedIngredients {
  const ideaText = [
    input.originalIdea,
    input.researchContext,
    input.chatContext,
    preferenceText(input.preferences)
  ].filter(Boolean).join(" ");
  const signalText = cleanForSynthesis([
    ideaText,
    ...input.queries,
    input.selectedRepo?.description,
    input.selectedRepo?.topics.join(" "),
    input.selectedRepo?.readme?.excerpt
  ].filter(Boolean).join(" "));
  const ideaSignalText = cleanForSynthesis(ideaText || input.originalIdea);
  const terms = tokenizeForSynthesis(ideaText || input.originalIdea);
  const phrases = phraseCandidates(ideaText || input.originalIdea);
  const actions = detectActions(signalText);
  const productPhrase = productPhraseFrom(ideaText, terms, phrases);
  const objectTerms = uniqueStrings(
    terms
      .filter((term) => !PRODUCT_WORDS.has(term))
      .filter((term) => !ACTION_WORDS.has(term))
      .filter((term) => !["local", "local-first", "first", "source", "github", "starter", "template", "csv", "ocr", "tax", "taxes"].includes(term))
  ).slice(0, 6);
  const primaryObject = titleCaseTerm(productPhrase);
  const objectLabel = /\breceipts?\b/i.test(ideaSignalText) && /\bexpenses?\b/i.test(ideaSignalText)
    ? "receipts and expenses"
    : humanList(objectTerms.slice(0, 3), productPhrase || "the core records");
  const dataObjects = deriveDataObjects(signalText, objectTerms, actions);
  return { ideaText, signalText, terms, objectTerms, productPhrase, objectLabel, primaryObject, dataObjects, actions };
}

function workflowFor(ingredients: SynthesizedIngredients): string[] {
  const { actions, objectLabel, primaryObject } = ingredients;
  const steps: string[] = [];
  if (actions.capture) {
    steps.push(`User captures, uploads, or manually adds ${objectLabel}.`);
  } else if (actions.search) {
    steps.push(`User searches or enters the ${objectLabel} they want to work with.`);
  } else if (actions.schedule) {
    steps.push(`User creates or selects the ${objectLabel} schedule item.`);
  } else {
    steps.push(`User creates the first ${objectLabel} record from a clear entry screen.`);
  }
  if (actions.parse || actions.analyze) {
    steps.push(`App extracts, analyzes, or summarizes the important ${objectLabel} details and shows what it inferred.`);
  } else {
    steps.push(`App records the important ${objectLabel} fields and keeps the workflow focused on the user's requested outcome.`);
  }
  steps.push(`User reviews and edits the ${objectLabel} details before treating them as final.`);
  if (actions.organize || actions.track || actions.save) {
    steps.push(`User saves, tracks, and organizes ${objectLabel} in a ${primaryObject} library or list.`);
  }
  if (actions.search || actions.organize || actions.analyze) {
    steps.push(`User filters, searches, or reviews saved ${objectLabel} to make the product useful after the first entry.`);
  }
  if (actions.export || actions.notify) {
    steps.push(`User exports, copies, shares, or sends the useful ${objectLabel} output in the format the idea requires.`);
  }
  return uniqueStrings(steps).slice(0, 6);
}

function screensFor(ingredients: SynthesizedIngredients): string[] {
  const { actions, objectLabel, primaryObject } = ingredients;
  return uniqueStrings([
    actions.capture || actions.create ? `Add/import ${objectLabel}` : `Start ${objectLabel}`,
    actions.parse || actions.review ? `Review ${objectLabel} details` : `${primaryObject} detail`,
    `${primaryObject} list/library`,
    actions.search || actions.organize ? `Search and filters` : `${primaryObject} status`,
    actions.analyze ? `Insights/report` : null,
    actions.export ? `Export/share` : null,
    actions.notify ? `Reminders/notifications` : null,
    actions.localFirst ? `Backup and local data settings` : `Settings/data sources`
  ].filter((item): item is string => Boolean(item))).slice(0, 8);
}

function actionsFor(ingredients: SynthesizedIngredients): string[] {
  const { actions, objectLabel } = ingredients;
  return uniqueStrings([
    actions.capture ? `capture or upload ${objectLabel}` : `create ${objectLabel}`,
    actions.parse ? `extract ${objectLabel} details` : null,
    actions.search ? `search ${objectLabel}` : null,
    actions.organize ? `categorize and filter ${objectLabel}` : null,
    actions.review ? `review and edit ${objectLabel}` : `review ${objectLabel}`,
    actions.track ? `track ${objectLabel} history` : null,
    actions.save ? `save ${objectLabel}` : `save the record`,
    actions.export ? `export ${objectLabel}` : null,
    actions.notify ? `send reminders or alerts` : null
  ].filter((item): item is string => Boolean(item))).slice(0, 8);
}

function requirementsFor(ingredients: SynthesizedIngredients): string[] {
  const { actions, dataObjects, objectLabel } = ingredients;
  return uniqueStrings([
    `A focused ${objectLabel} entry flow.`,
    actions.capture ? `Capture/upload/manual-entry fallback for ${objectLabel}.` : null,
    actions.parse ? `Parsing or AI/OCR result review with manual correction before save.` : null,
    `Data model for ${dataObjects.slice(0, 5).join(", ")}.`,
    `List/detail surfaces for saved ${objectLabel}.`,
    actions.search || actions.organize ? `Search, filters, categories, or tags for finding saved ${objectLabel}.` : null,
    dataObjects.includes("CsvExport") ? `CSV export with predictable headers and selected fields.` : actions.export ? `Export/copy/download path with predictable fields and clear file format.` : null,
    actions.localFirst ? `Local-first persistence plus backup/restore or clear-data controls.` : null,
    `Empty, loading, error, no-result, and partial-success states for the main workflow.`
  ].filter((item): item is string => Boolean(item))).slice(0, 8);
}

function nonGoalsFor(ingredients: SynthesizedIngredients): string[] {
  const { actions, objectLabel } = ingredients;
  return uniqueStrings([
    "No broad admin, team, billing, or account system unless the user explicitly asked for it.",
    "No unrelated starter repo features that distract from the first product workflow.",
    actions.ai || actions.parse ? "No claims that AI/OCR/parsing is always correct; keep manual review and correction in the loop." : null,
    actions.export ? "No hidden or lossy export behavior; exported fields should be documented and predictable." : null,
    actions.localFirst ? "No cloud sync before the local-first storage, backup, and clear-data behavior works." : "No hosted sync or multi-device complexity before one user's saved workflow works.",
    `No copying the starter repo's brand, sample data, screenshots, or product assumptions instead of making the ${objectLabel} product.`
  ].filter((item): item is string => Boolean(item))).slice(0, 7);
}

function safetyFor(ingredients: SynthesizedIngredients, repo: BuildPackRepo | undefined): string[] {
  const { actions, objectLabel } = ingredients;
  return uniqueStrings([
    repo?.license ? `Confirm ${repo.fullName}'s ${repo.license} license, notices, assets, and dependency terms before copying code.` : "Confirm license, notices, assets, and dependency terms before copying code.",
    actions.localFirst ? `Document where ${objectLabel} data is stored locally and how users can export, back up, and clear it.` : `Document what ${objectLabel} data is stored and where.`,
    actions.ai || actions.parse ? "Treat generated or parsed output as a draft until the user reviews it." : null,
    actions.export ? "Make export behavior intentional; do not include hidden fields or secrets in downloads." : null,
    "Keep API keys, private data, and repo inspection notes out of logs and generated sample data."
  ].filter((item): item is string => Boolean(item))).slice(0, 6);
}

function currentAlternativesFor(ingredients: SynthesizedIngredients): string[] {
  const { actions } = ingredients;
  return uniqueStrings([
    "spreadsheets",
    "notes apps",
    actions.capture ? "camera roll or file folders" : null,
    actions.schedule ? "shared calendars" : null,
    actions.export ? "manual CSV/JSON exports" : null,
    "generic SaaS tools",
    "the selected repo's original product"
  ].filter((item): item is string => Boolean(item))).slice(0, 6);
}

function synthesizedWorkflowBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  const repo = input.selectedRepo;
  const ingredients = synthesizeIngredients(input);
  const targetUser = stringPreference(input.preferences, "audience") ?? extractTargetUser(ingredients.ideaText, ingredients.objectLabel);
  const workflow = workflowFor(ingredients);
  const screens = screensFor(ingredients);
  const actions = actionsFor(ingredients);
  const requirements = requirementsFor(ingredients);
  const nonGoals = nonGoalsFor(ingredients);
  const safety = safetyFor(ingredients, repo);
  const productName = name || "The app";
  const actionSummary = humanList(actions.slice(0, 4), `manage ${ingredients.objectLabel}`);
  const firstMilestone = stringPreference(input.preferences, "firstMilestone") ??
    `Build the ${ingredients.productPhrase} loop: ${workflow.slice(0, 4).map((step) => step.replace(/^User\s+|^App\s+/i, "").replace(/\.$/, "")).join("; ")}.`;

  return {
    productKind: "workflow-app",
    confidence: ingredients.objectTerms.length >= 2 ? 68 : 56,
    productThesis: `${productName} should help ${targetUser} ${actionSummary}, using ${repo?.fullName ?? "the selected repo"} only as a foundation for reusable setup, structure, or patterns.`,
    targetUserSegment: targetUser,
    jobToBeDone: `When I need to work with ${ingredients.objectLabel}, I want to ${actionSummary} in one focused flow without rebuilding unrelated starter features.`,
    currentAlternatives: currentAlternativesFor(ingredients),
    differentiatedWedge: `Start from working code, keep the parts that support ${ingredients.objectLabel}, replace the starter's brand and assumptions, and add the missing ${ingredients.dataObjects.slice(0, 4).join(", ")} behavior that makes this the user's product.`,
    primaryWorkflow: workflow,
    keyScreens: screens,
    coreDataObjects: ingredients.dataObjects.length >= 4
      ? ingredients.dataObjects
      : uniqueStrings([...ingredients.dataObjects, `${pascalCaseTerm(ingredients.productPhrase)}Record`, "SavedRecord", "ExportJob"]).slice(0, 7),
    userActions: actions,
    systemStates: {
      empty: `No ${ingredients.objectLabel} yet; show the fastest way to add the first one plus a sample/demo path.`,
      loading: `Processing ${ingredients.objectLabel}; keep the user's input visible and explain progress.`,
      error: `The ${ingredients.objectLabel} workflow failed; preserve input and offer retry or manual fallback.`,
      noResult: `No matching ${ingredients.objectLabel}; offer filter reset, broader search, or manual entry.`,
      partialSuccess: `Some ${ingredients.objectLabel} data was saved or inferred; flag missing fields and let the user finish manually.`
    },
    mvpRequirements: requirements,
    explicitNonGoals: nonGoals,
    trustPrivacySafety: safety,
    firstMilestone,
    successMetrics: [
      `A user can complete the first ${ingredients.objectLabel} workflow without setup help.`,
      `Saved ${ingredients.objectLabel} data survives refresh or has an explicit export/backup path.`,
      "The UI makes keep, replace, add, and remove decisions clear before a builder edits the repo.",
      "The product feels like the user's app, not a lightly renamed starter repo."
    ],
    wowDemoScript: [
      `Start from an empty ${ingredients.primaryObject} workspace.`,
      workflow[0] ?? `Add realistic ${ingredients.objectLabel}.`,
      workflow[2] ?? `Review and edit the ${ingredients.objectLabel} details.`,
      workflow.find((step) => /save|track|organize|filter|search/i.test(step)) ?? `Save the ${ingredients.objectLabel} record.`,
      workflow.find((step) => /export|share|copy|send/i.test(step)) ?? "Show the reusable output or saved state."
    ],
    inferredFrom: ["user idea", "general synthesis", repo ? "selected repo metadata" : "search result"]
  };
}

function genericWorkflowBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const name = stringPreference(input.preferences, "productName");
  const repo = input.selectedRepo;
  return {
    productKind: "workflow-app",
    confidence: 45,
    productThesis: stringPreference(input.preferences, "productGoal") ?? `${name || "The app"} should turn the user's idea into a focused workflow with useful saved or exported output, using ${repo?.fullName ?? "the selected repo"} only where its setup, data model, routes, or UI patterns genuinely help.`,
    targetUserSegment: stringPreference(input.preferences, "audience") ?? "The most specific user implied by the idea; refine this during repo inspection instead of building for everyone.",
    jobToBeDone: "Complete one painful workflow from input to useful saved output.",
    currentAlternatives: ["manual spreadsheets", "generic SaaS tools", "custom scripts", "existing apps found during repo research"],
    differentiatedWedge: "Start from working code, remove unrelated assumptions, and ship the user's narrow workflow faster than a blank scaffold.",
    primaryWorkflow: [
      "User begins from a clear intake screen.",
      "User enters or selects the minimum information required.",
      "System produces the useful result, record, or decision.",
      "User reviews and edits the result.",
      "User saves, exports, or revisits the result."
    ],
    keyScreens: ["Intake", "Review/detail", "Saved records", "Settings/data", "Export/share"],
    coreDataObjects: ["WorkflowRecord", "CapturedEntry", "WorkflowResult", "SavedRecord", "ExportJob"],
    userActions: ["create", "review", "edit", "save", "export", "delete"],
    systemStates: {
      empty: "No saved items; guide the user into the first task.",
      loading: "Primary task is running; show clear progress.",
      error: "Task failed; preserve input and explain retry/recovery.",
      noResult: "No useful result; suggest narrower input or alternate path.",
      partialSuccess: "Some useful data exists; let the user save it and continue."
    },
    mvpRequirements: ["Focused entry flow", "Review/detail surface", "Save/revisit", "Export/backup", "Empty/loading/error/no-result states"],
    explicitNonGoals: ["No broad admin system", "No team/billing unless the idea requires it", "No unrelated starter features", "No copied assets or license-unclear code"],
    trustPrivacySafety: ["Document what data is stored", "Check license before reuse", "Keep secrets out of client/logs", "Avoid claims that were not verified"],
    firstMilestone: stringPreference(input.preferences, "firstMilestone") ?? "Build the smallest vertical slice: create the main item, produce the useful result, save it, and export it.",
    successMetrics: ["A new user completes the primary workflow without setup help", "The result survives refresh", "The repo reuse decision is documented"],
    wowDemoScript: ["Start from empty state", "Complete primary workflow", "Save result", "Export or revisit result"],
    inferredFrom: ["fallback blueprint", repo ? "selected repo metadata" : "user idea"]
  };
}

export function buildHandoffBlueprint(input: HandoffSignalInput): HandoffBlueprint {
  const directSignal = directTextFrom(input);
  const signal = textFrom(input);
  const recipeScannerMeansReceipt = isLikelyReceiptScannerTypo(input.originalIdea);
  if (/\b(pokemon|pok[eé]mon|tcg|trading[-\s]?card|card collector|card collection|collector album|card binder|card value|tcgdex|tcgplayer|cardmarket)\b/i.test(signal)) {
    return cardCollectorBlueprint(input);
  }
  if (isReceiptExpenseIntent(directSignal, recipeScannerMeansReceipt)) {
    return receiptExpenseBlueprint(input);
  }
  if (!recipeScannerMeansReceipt && /\b(recipe|recipes|meal plan|meal planning|ingredients?|cookbook|cooking|recipe bookmark|bookmark manager)\b/i.test(directSignal)) {
    return recipeBookmarkBlueprint(input);
  }
  if (/\b(grocery|groceries|supermarket|shopping list|shopping lists|food shopping)\b/i.test(directSignal)) {
    return groceryShoppingBlueprint(input);
  }
  if (/\b(roofing|roofer|roofers|contractor|contractors|field service|home service|trade|trades|plumbing|hvac|landscap(?:e|ing)|cleaning|cleaner|cleaners|janitorial|maid|maids|housekeeping|commercial cleaning|residential cleaning)\b/i.test(directSignal) && /\b(crm|customer|customers|lead|leads|job|jobs|estimate|estimates|quote|quotes|invoice|crew|crews|schedule|scheduling|follow[-\s]?up)\b/i.test(directSignal)) {
    return serviceBusinessCrmBlueprint(input);
  }
  if (/\bcrm\b/i.test(directSignal) && !/\b(realtors?|real estate|realty|broker|mls|property|properties)\b/i.test(directSignal)) {
    return serviceBusinessCrmBlueprint(input);
  }
  if (/\b(kids?|children|parents?|family|families|team|teams|youth)\b.*\b(sports?|practice|game|games|schedule|schedules|calendar|coach|coaches)\b|\b(sports?|practice|game|games|schedule|schedules|calendar|coach|coaches)\b.*\b(kids?|children|parents?|family|families|team|teams|youth)\b/i.test(directSignal)) {
    return sportsScheduleBlueprint(input);
  }
  if (/\b(salon|spa|barber|barbershop|booking|appointment|appointments|scheduling|scheduler)\b/i.test(directSignal)) {
    return appointmentBookingBlueprint(input);
  }
  if (/\b(prompt organizer|prompt manager|prompt library|prompt collection|prompt database|prompt gallery|image prompt organizer|ai prompt organizer|save prompts?|organize prompts?)\b/i.test(directSignal)) {
    return promptLibraryBlueprint(input);
  }
  if (/\b(cat id|cat identifier|cat identification|cat breed|cat scanner|identify cat|identify cats|pet id|pet identification|pet identifier|animal identification|animal image recognition)\b/i.test(directSignal)) {
    return petIdentificationBlueprint(input);
  }
  if (
    /\b(realtors?|real estate|realty|broker|mls|property|properties)\b/i.test(directSignal) &&
    /\b(lead|leads|lead gen|prospecting|scrape|scraper|source|sources|follow[-\s]?up)\b/i.test(directSignal) &&
    !/\b(image|images|photo|photos|visual|creative|generator|generate|listing media|social post)\b/i.test(directSignal)
  ) {
    return realEstateLeadsBlueprint(input);
  }
  if (/\b(shopify|ecommerce|e-commerce|retail|store|storefront|merchant)\b/i.test(directSignal) && /\b(dashboard|analytics|profit|profits|margin|margins|ad spend|ads?|inventory|orders?|metrics?)\b/i.test(directSignal)) {
    return ecommerceDashboardBlueprint(input);
  }
  if (!recipeScannerMeansReceipt && /\b(recipe|recipes|grocery list|meal plan|ingredients?|cookbook|cooking|bookmark manager)\b/i.test(signal)) {
    return recipeBookmarkBlueprint(input);
  }
  const synthesized = synthesizedWorkflowBlueprint(input);
  return synthesized.coreDataObjects.some((objectName) => /PrimaryItem|UserInput/i.test(objectName))
    ? genericWorkflowBlueprint(input)
    : synthesized;
}
