import { buildRepoNarrative } from "../analysis/human-answer";
import type { IdeaCheckResult } from "../../types/idea-check";
import { buildHandoffBlueprint, isGenericBuildPackPreference, type HandoffBlueprint, type ProductKind } from "./blueprint";

type BuildPackRepo = IdeaCheckResult["repos"][number];

export const buildTargets = ["codex", "claude-code", "cursor", "replit", "lovable", "v0", "gemini-cli", "antigravity", "generic"] as const;

export type BuildTarget = (typeof buildTargets)[number];

export type BuildPackPreferences = Record<string, string | string[] | undefined>;

export const buildTargetLabels: Record<BuildTarget, string> = {
  codex: "Codex",
  "claude-code": "Claude Code",
  cursor: "Cursor",
  replit: "Replit",
  lovable: "Lovable",
  v0: "v0",
  "gemini-cli": "Gemini CLI",
  antigravity: "Antigravity",
  generic: "Generic AI builder"
};

function targetInstructions(target: BuildTarget): string {
  if (target === "codex") {
    return "Treat this handoff as the source of truth. If the user pasted one combined Markdown file, split it into STARTER_REPO.md, PRD.md, BUILD_PLAN.md, REPO_STARTER_NOTES.md, and AGENTS.md inside the chosen repo. Clone/open the selected starter repo first, inspect it before editing, keep changes scoped to the current phase, preserve unrelated work, and run the verification checklist before expanding scope.";
  }
  if (target === "claude-code") {
    return "Treat this handoff as the source of truth. If the user pasted one combined Markdown file, split it into STARTER_REPO.md, PRD.md, BUILD_PLAN.md, REPO_STARTER_NOTES.md, AGENTS.md, and CLAUDE.md inside the chosen repo. Clone/open the selected starter repo first, summarize the architecture before edits, implement one phase at a time, and maintain a running checklist of files changed, tests run, and open questions.";
  }
  if (target === "cursor") {
    return "Treat this handoff as the source of truth. If the user pasted one combined Markdown file, split it into project notes/rules and the main Markdown files as needed. Clone/open the selected starter repo first, explain which existing components or patterns you will reuse before generating code, then implement the first milestone only.";
  }
  if (target === "replit") {
    return "Treat this handoff as the source of truth. Import or clone the selected starter repo first, add the Markdown files to the repo root, inspect setup and run commands before editing, then build only Phase 1 with clear run/test notes for the Replit workspace.";
  }
  if (target === "lovable") {
    return "Treat this handoff as the source of truth. Convert it into screens, user flows, lightweight data models, and the first build milestone. Use the selected repo as foundation/context when the environment supports it; otherwise preserve the repo lessons, brand, scope, and not-in-v1 rules.";
  }
  if (target === "v0") {
    return "Treat this handoff as the source of truth for UI generation. Read the selected repo notes, product brief, brand, and build plan before creating screens. Preserve the repo foundation decision, generate only the Phase 1 interface, and avoid inventing backend scope not listed in PRD.md.";
  }
  if (target === "gemini-cli") {
    return "Treat this handoff as the source of truth. Clone/open the selected starter repo first, split the packet into the named Markdown files, inspect architecture and setup before edits, then implement the first milestone with a concise verification summary.";
  }
  if (target === "antigravity") {
    return "Treat this handoff as the source of truth. Open the selected starter repo as the workspace foundation, add the handoff Markdown files, inspect repo structure and dependencies first, then plan and execute the first build phase without expanding scope.";
  }
  return "Treat this handoff as the source of truth. If it arrives as one combined Markdown file, split it into the project files the builder needs. Use the selected repo as the foundation/context, inspect before edits, build the first phase only, and verify before expanding scope.";
}

function cleanResearchContext(text: string | undefined): string | null {
  if (!text) return null;
  const cleaned = text
    .replace(/find more github repos and alternatives for this idea\.?/gi, "")
    .replace(/avoid repeating the same top three when possible\.?/gi, "")
    .replace(/original idea:[\s\S]*$/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length >= 12 ? cleaned : null;
}

function cleanIdeaPrompt(prompt: string): { originalIdea: string; researchContext: string | null } {
  const originalIdeaMatch = prompt.match(/Original idea:\s*([\s\S]*?)(?:\n\n|$)/i);
  const followUpMatch = prompt.match(/Follow-up refinement:\s*([\s\S]*?)(?:\n\nOriginal idea:|\n\n|$)/i);

  if (originalIdeaMatch?.[1]) {
    const originalIdea = originalIdeaMatch[1]
      .replace(/Follow-up refinement:[\s\S]*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
    return {
      originalIdea,
      researchContext: cleanResearchContext(followUpMatch?.[1])
    };
  }

  const cleaned = prompt
    .replace(/^Find more GitHub repos and alternatives for this idea\.[\s\S]*?Original idea:\s*/i, "")
    .trim();

  return {
    originalIdea: cleaned || prompt.trim(),
    researchContext: cleanResearchContext(followUpMatch?.[1])
  };
}

type ProductProfile = {
  goal: string;
  primaryUser: string;
  problem: string;
  promise: string;
  coreWorkflow: string[];
  stories: string[];
  mustHave: string[];
  notInFirstVersion: string[];
  firstMilestone: string;
  successMetrics: string[];
};

function profileFromBlueprint(blueprint: HandoffBlueprint): ProductProfile {
  return {
    goal: blueprint.productThesis,
    primaryUser: blueprint.targetUserSegment,
    problem: blueprint.jobToBeDone,
    promise: blueprint.differentiatedWedge,
    coreWorkflow: blueprint.primaryWorkflow,
    stories: blueprint.userActions.map((action) => `As a user, I can ${action}.`),
    mustHave: blueprint.mvpRequirements,
    notInFirstVersion: blueprint.explicitNonGoals,
    firstMilestone: blueprint.firstMilestone,
    successMetrics: blueprint.successMetrics
  };
}

function isGenericProductProfile(profile: ProductProfile): boolean {
  return profile.goal === "Turn the idea into one narrow workflow that saves the target user time immediately.";
}

function blueprintFromProfile(profile: ProductProfile, productKind: ProductKind, inferredFrom: string[]): HandoffBlueprint {
  return {
    productKind,
    confidence: isGenericProductProfile(profile) ? 45 : 72,
    productThesis: profile.goal,
    targetUserSegment: profile.primaryUser,
    jobToBeDone: profile.problem,
    currentAlternatives: ["existing apps found during repo research", "manual workflows", "generic SaaS tools", "spreadsheets or notes"],
    differentiatedWedge: profile.promise,
    primaryWorkflow: profile.coreWorkflow,
    keyScreens: ["Start/new item", "Primary workflow", "Result/detail", "Saved library", "Export/share"],
    coreDataObjects: ["PrimaryItem", "UserInput", "Result", "SavedItem", "Export"],
    userActions: profile.stories.map((story) => story.replace(/^As a user, I can\s*/i, "").replace(/^As a builder, I can\s*/i, "inspect and ").replace(/\.$/, "")),
    systemStates: {
      empty: "No saved work yet; guide the user into the first workflow.",
      loading: "Show clear progress while preserving the user's input.",
      error: "Explain what failed, preserve input, and offer a retry or manual fallback.",
      noResult: "Explain that nothing matched and suggest a narrower input or alternate route.",
      partialSuccess: "Keep the useful result and clearly label what still needs verification."
    },
    mvpRequirements: profile.mustHave,
    explicitNonGoals: profile.notInFirstVersion,
    trustPrivacySafety: ["Document what data is stored and where.", "Confirm license and attribution before copying starter code.", "Keep secrets out of client code, logs, telemetry, and generated docs."],
    firstMilestone: profile.firstMilestone,
    successMetrics: profile.successMetrics,
    wowDemoScript: [
      profile.firstMilestone,
      "Show the saved or exported output.",
      "Call out the repo reuse decision and any honest limitation."
    ],
    inferredFrom
  };
}

function productProfileFor(idea: string): ProductProfile {
  const lower = idea.toLowerCase();
  const isRealEstate = /\b(realtors?|real estate|realty|broker|mls|property|listing|agents?)\b/i.test(idea);
  const isImageTool = /\b(image|images|photo|photos|visual|creative|generator|generate|listing media|social post)\b/i.test(idea);
  const isLeadTool = /\b(lead|leads|prospecting|outreach|crm|sales)\b/i.test(idea);
  const isVoiceTool = /\b(voice|whisper|whisperflow|speech|dictation|transcription|audio|stt)\b/i.test(idea);
  const isRepoTool = lower.includes("github") && (lower.includes("repo") || lower.includes("repository"));
  const isProjectTool = /\b(clickup|asana|trello|notion|monday|linear|jira|kanban|project management|task management|team collaboration|productivity suite|workspace tool|todo app)\b/i.test(idea);
  const isNotebookTool = /\b(obsidian|roam|logseq|notion notes|second brain|note[-\s]?taking|notebook app|markdown editor|wiki app|knowledge base|knowledge graph|personal knowledge|pkm|zettelkasten)\b/i.test(idea);
  const isCodeEditor = /\b(cursor|vs ?code|vscode|copilot|code editor|ide alternative|ai coding|coding assistant|developer ide|programming editor|ai pair programmer)\b/i.test(idea);
  const isPokemonCardCollector = /\b(pokemon|pokémon|tcgdex)\b/i.test(idea);
  const isGenericCardCollector =
    !isPokemonCardCollector &&
    /\b(tcg|trading[-\s]?card|collectibles?|card collector|card collection|collector album|card binder|card value|tcgplayer|cardmarket|sports[-\s]?cards?|magic the gathering|mtg|yu-gi-oh|yugioh)\b/i.test(idea);

  if (isPokemonCardCollector) {
    return {
      goal: "Help collectors track a personal trading-card collection with fast card search, card detail/value views, and a trustworthy collection vault.",
      primaryUser: "A Pokemon TCG or trading-card collector who wants a simple album, binder, or vault for owned cards, wishlist cards, and estimated collection value.",
      problem: "Collectors often split card lookup, condition notes, purchase history, pricing, and backup exports across apps or spreadsheets. The first version needs one reliable collection loop without copying Pokemon Collector's branding or product UI.",
      promise: "Let the collector search for cards, open a detail/value view, add cards to a collection vault, and track condition, quantity, purchase price, notes, and total estimated value with original branding.",
      coreWorkflow: [
        "User searches a card catalog by name, set, number, rarity, or type.",
        "User opens a card detail/value view with image, set details, owned status, and estimated market value.",
        "User adds the card to a collection vault, album, or binder.",
        "User records condition, quantity, purchase price, purchase date, and collector notes.",
        "User reviews total estimated collection value and exports or backs up the collection."
      ],
      stories: [
        "As a collector, I can search cards quickly and open a detail page with useful value context.",
        "As a collector, I can add cards to my vault, album, or binder and group cards by set, wishlist, or custom list.",
        "As a collector, I can track condition, quantity, purchase price, and notes for each owned card.",
        "As a collector, I can see total estimated value and export or back up my collection data.",
        "As a builder, I can reuse starter patterns without copying Pokemon Collector's brand, logos, layout, or protected assets."
      ],
      mustHave: [
        "Card search/catalog with filters for name, set, number, rarity, and type.",
        "Card detail/value view that labels prices as estimates and shows source/date when available.",
        "Collection vault, album, or binder with owned cards, wishlist, and custom grouping.",
        "Owned-card fields for condition, quantity, purchase price, purchase date, and notes.",
        "Total estimated value for the collection, plus backup/export to CSV or JSON.",
        "Original branding, names, icons, and UI copy; do not copy Pokemon Collector."
      ],
      notInFirstVersion: [
        "Marketplace buying/selling, escrow, trades, or payments.",
        "Official Pokemon logos, copied product UI, scraped card images, or protected assets without permission.",
        "Automated valuation claims that present estimates as guaranteed prices.",
        "Bulk card scanning before manual search and entry works.",
        "Account sync or social collection sharing before local backup/export is solid."
      ],
      firstMilestone: "Build the collector loop: search a realistic card catalog, open a detail/value view, add a card to a vault or binder with condition, quantity, purchase price, and notes, then show total estimated value and export the collection.",
      successMetrics: [
        "A collector can search and add a card to their vault in under one minute.",
        "The collection shows condition, quantity, purchase price, notes, and total estimated value clearly.",
        "Export or backup works without an account.",
        "The product uses original branding and labels card values as estimates."
      ]
    };
  }
  if (isGenericCardCollector) {
    return {
      goal: "Help collectors track a personal trading-card or collectibles collection with fast item search, detail/value views, and a trustworthy vault.",
      primaryUser: "A trading-card, sports-card, or collectibles collector who wants a simple album, binder, or vault for owned items, wishlist items, and estimated collection value.",
      problem: "Collectors often split lookup, condition notes, purchase history, pricing, and backup exports across apps or spreadsheets. The first version needs one reliable collection loop with original branding and clear value-estimate language.",
      promise: "Let the collector search a catalog, open a detail/value view, add items to a collection vault, and track condition, quantity, purchase price, notes, and total estimated value with original branding.",
      coreWorkflow: [
        "User searches a card or collectible catalog by name, set, number, category, rarity, or keyword.",
        "User opens a detail/value view with image, set/category details, owned status, and estimated market value.",
        "User adds the item to a collection vault, album, or binder.",
        "User records condition, quantity, purchase price, purchase date, and collector notes.",
        "User reviews total estimated collection value and exports or backs up the collection."
      ],
      stories: [
        "As a collector, I can search cards or collectibles quickly and open a detail page with useful value context.",
        "As a collector, I can add items to my vault, album, or binder and group them by set, wishlist, or custom list.",
        "As a collector, I can track condition, quantity, purchase price, and notes for each owned item.",
        "As a collector, I can see total estimated value and export or back up my collection data.",
        "As a builder, I can reuse starter patterns without copying another app's brand, logos, layout, or protected assets."
      ],
      mustHave: [
        "Catalog search with filters for name, set/category, number, rarity, and type.",
        "Detail/value view that labels prices as estimates and shows source/date when available.",
        "Collection vault, album, or binder with owned items, wishlist, and custom grouping.",
        "Owned-item fields for condition, quantity, purchase price, purchase date, and notes.",
        "Total estimated value for the collection, plus backup/export to CSV or JSON.",
        "Original branding, names, icons, and UI copy."
      ],
      notInFirstVersion: [
        "Marketplace buying/selling, escrow, trades, or payments.",
        "Official league, game, brand, logo, scraped image, or protected asset usage without permission.",
        "Automated valuation claims that present estimates as guaranteed prices.",
        "Bulk scanning before manual search and entry works.",
        "Account sync or social collection sharing before local backup/export is solid."
      ],
      firstMilestone: "Build the collector loop: search a realistic catalog, open a detail/value view, add an item to a vault or binder with condition, quantity, purchase price, and notes, then show total estimated value and export the collection.",
      successMetrics: [
        "A collector can search and add an item to their vault in under one minute.",
        "The collection shows condition, quantity, purchase price, notes, and total estimated value clearly.",
        "Export or backup works without an account.",
        "The product uses original branding and labels values as estimates."
      ]
    };
  }

  if (isRealEstate && isImageTool) {
    return {
      goal: "Help realtors turn a listing, property photo, or marketing prompt into usable branded visuals for listings, ads, and social posts.",
      primaryUser: "A realtor, real-estate marketer, or solo agent who needs listing visuals quickly without hiring a designer for every campaign.",
      problem: "Realtors need attractive listing and lead-gen visuals, but existing image tools are generic, require prompt skill, and rarely understand real-estate use cases like listing photos, property types, neighborhoods, disclosures, and brand consistency.",
      promise: "Give the user a simple real-estate image workflow: describe the listing or campaign, generate usable visual options, save/export the best ones, and keep enough context to improve the next prompt.",
      coreWorkflow: [
        "User describes the property, audience, and visual goal in plain English.",
        "User picks an output type such as listing hero, Instagram post, ad creative, or flyer.",
        "App generates a small set of tailored image prompts or visual concepts with plain-English notes.",
        "User saves favorites and edits brand or property context for the next run.",
        "User exports the best result as an image, prompt, or campaign brief."
      ],
      stories: [
        "As a realtor, I can enter a listing or campaign idea and get image prompts or generated visual concepts tailored to real estate.",
        "As a realtor, I can choose a format such as listing hero, Instagram post, ad creative, flyer, or open-house promo.",
        "As a realtor, I can save the best outputs and reuse the property, brand, and audience details later.",
        "As a builder, I can inspect related repos for useful UI, prompt, image-generation, or real-estate workflow patterns before building."
      ],
      mustHave: [
        "One primary prompt input for the property, audience, and visual goal.",
        "A small set of real-estate output types such as listing image, social post, ad creative, and flyer concept.",
        "Generated prompt/output cards with plain-English notes on what each option is for.",
        "Save/export actions for useful prompts, images, or campaign ideas.",
        "Clear safety/reuse notes for any starter repo, asset, model, or template used."
      ],
      notInFirstVersion: [
        "Direct MLS data ingestion or paid listing-API integrations.",
        "Multi-agent teams, brokerage roles, or shared brand libraries.",
        "Automated posting to Instagram, Facebook, or ad platforms.",
        "Custom-trained image models or fine-tunes on private listing data."
      ],
      firstMilestone: "Build the realtor image workflow with sample data first: user enters a property/campaign prompt, chooses an output type, receives three tailored visual concepts or image prompts, saves one, and exports the result.",
      successMetrics: [
        "A realtor can understand the workflow in under 30 seconds.",
        "A realistic listing prompt produces three useful real-estate visual concepts or image prompts.",
        "The user can save and export a result without needing technical setup."
      ]
    };
  }
  if (isRealEstate && isLeadTool) {
    return {
      goal: "Help realtors find, qualify, and act on better real-estate leads with less manual research.",
      primaryUser: "A realtor, broker, or real-estate operator who wants practical lead research and follow-up support.",
      problem: "Real-estate lead workflows are scattered across CRMs, property data, spreadsheets, and manual outreach. The first version needs one narrow workflow that saves time immediately.",
      promise: "Turn a niche, area, or campaign idea into a short list of useful leads, saved context, and a clear next action.",
      coreWorkflow: [
        "User describes the lead niche, area, or campaign in plain English.",
        "App returns three explainable lead or source ideas with why each one matters.",
        "User saves the promising ones to a local shortlist.",
        "User refines or filters the list by area, price range, or property type.",
        "User exports a follow-up plan or outreach brief in Markdown."
      ],
      stories: [
        "As a realtor, I can describe a lead niche or area and get a short, explainable list of next actions.",
        "As a realtor, I can save promising leads or sources for later.",
        "As a realtor, I can export a follow-up plan or campaign brief.",
        "As a builder, I can compare adjacent CRM, prospecting, or property-data repos before building."
      ],
      mustHave: [
        "One input for the lead niche, location, or campaign.",
        "A result view that explains why each lead/source matters.",
        "A save action for useful sources or prospects.",
        "A simple export for follow-up planning.",
        "Repo reuse notes for any CRM, scraper, property-data, or outreach component."
      ],
      notInFirstVersion: [
        "Bulk scraping that violates MLS, Zillow, or Realtor.com terms of service.",
        "Cold-call dialer, SMS blasting, or automated outreach without consent flows.",
        "Full CRM replacement with pipelines, automations, and team seats.",
        "Paid third-party data syncs before a manual research loop works."
      ],
      firstMilestone: "Build the lead research loop: user enters a niche/location, sees three qualified lead/source ideas with why they matter, saves one, and exports a follow-up list.",
      successMetrics: [
        "A realtor can complete the lead research loop without setup help.",
        "Each result explains why it is useful and what to do next.",
        "Saved lead/source notes survive refresh locally."
      ]
    };
  }
  if (isRepoTool) {
    return {
      goal: "Help builders describe an idea, discover relevant open-source repos, understand whether to fork/reference/build fresh, and leave with a clear next step.",
      primaryUser: "A practical builder evaluating whether to reuse open-source work, fork a repo, or build a differentiated first version without losing days to unfocused research.",
      problem: "The user has a product idea, but the overlap with existing GitHub projects is unclear. They need a fast decision about what already exists, what is reusable, and what to build first.",
      promise: "Give the user a clear reuse decision, repo evidence, and a build-ready plan that another AI coding tool can continue without redoing the discovery work.",
      coreWorkflow: [
        "User enters a rough idea in plain English.",
        "App refines the idea into search queries and runs them against GitHub.",
        "App returns a verdict plus three repo leads with fit, activity, docs, license, and reuse notes.",
        "User saves promising repos to a local shortlist or board.",
        "User exports a Markdown handoff that another AI builder can pick up without redoing research."
      ],
      stories: [
        "As a builder, I can enter a rough idea and see a direct verdict about existing GitHub overlap.",
        "As a builder, I can compare the top repo leads by fit, activity, docs, license, and reuse risk.",
        "As a builder, I can save the best leads and export the decision so another tool can continue the work.",
        "As a builder, I can see what not to copy or fork until licensing and maintenance are confirmed."
      ],
      mustHave: [
        "One primary input for the idea or workflow being researched.",
        "A verdict with confidence, summary, and the reason the next build path is recommended.",
        "Repo cards or rows that explain fit, docs, activity, license, good use cases, and cautions.",
        "A save or shortlist action for useful repos.",
        "An exportable Markdown handoff with PRD, repo notes, build plan, and AI builder instructions."
      ],
      notInFirstVersion: [
        "Multi-user logins or team features.",
        "Any kind of marketplace publishing or paid tiers.",
        "Automated scraping beyond the documented GitHub search API."
      ],
      firstMilestone: "Build the end-to-end idea check: user enters an idea, the app refines it into searches, shows three explained repo leads, lets the user save one, and exports a short Markdown report.",
      successMetrics: [
        "A builder can tell in one minute whether their idea already has strong open-source overlap.",
        "Each repo result explains what it does, why it matched, what it is good for, and what to do next.",
        "Saved repos and exported reports survive refresh locally."
      ]
    };
  }
  if (isLeadTool) {
    return {
      goal: "Help users find, qualify, and act on better leads with less manual research.",
      primaryUser: "A solo operator or small team that needs a simple lead workflow before investing in a full CRM.",
      problem: "Lead research often turns into scattered tabs, spreadsheets, and unclear next actions.",
      promise: "Turn a target customer idea into qualified lead/source notes and a practical follow-up plan.",
      coreWorkflow: [
        "User describes the target customer or niche.",
        "App returns three explainable lead or lead-source ideas.",
        "User saves the relevant ones and adds short notes.",
        "User refines or repeats the search with a tighter prompt.",
        "User exports a follow-up plan or outreach brief."
      ],
      stories: [
        "As a user, I can describe who I want to find and get a short list of useful leads or lead sources.",
        "As a user, I can see why each result matters.",
        "As a user, I can save and export the useful leads.",
        "As a builder, I can inspect adjacent repos before implementing."
      ],
      mustHave: [
        "One input for target customer or niche.",
        "Three explained lead/source results.",
        "Save and export actions.",
        "Basic status states for empty, loading, no-result, and error.",
        "Repo notes for any useful starter or reference project."
      ],
      notInFirstVersion: [
        "Full CRM features such as pipelines, deal stages, team seats, or reporting.",
        "Automated outreach, dialers, or mass email sequences before consent flows exist.",
        "Paid data-enrichment integrations before a manual loop works.",
        "Multi-tenant SaaS billing or admin/role permissions."
      ],
      firstMilestone: "Build the lead search loop: user enters a niche, sees three qualified leads or sources with why they matter, saves one, and exports a follow-up list.",
      successMetrics: [
        "The user gets a useful lead/source list from one realistic prompt.",
        "Each result has a clear reason and next action.",
        "Saved/exported results are easy to reuse."
      ]
    };
  }
  if (isVoiceTool) {
    return {
      goal: "Help users capture, transform, and reuse spoken input with a smooth voice-first workflow similar to WhisperFlow-style dictation tools.",
      primaryUser: "A user who thinks faster by speaking and wants clean text, notes, or prompts injected into the tool they are already working in.",
      problem: "Voice notes are fast to create but often messy, hard to reuse, and disconnected from the tool where the user is working. Open-source voice assistants exist but most are heavy, require model setup, or skip the cleanup step.",
      promise: "Capture or paste speech, apply one useful transform (clean, summarize, or rewrite as a prompt), and make the result easy to copy or save with one click.",
      coreWorkflow: [
        "User records audio in the browser or pastes an existing transcript.",
        "App transcribes using a configurable Whisper-compatible backend.",
        "User picks one transform such as clean grammar, summarize, or rewrite as a prompt.",
        "App shows the cleaned output with a one-click copy and save action.",
        "Saved outputs stay in local storage for re-use the next session."
      ],
      stories: [
        "As a user, I can capture audio or paste a transcript without setup friction.",
        "As a user, I can polish, summarize, or prompt-engineer the text with one click.",
        "As a user, I can save and copy the final version into any other tool.",
        "As a builder, I can inspect voice/transcription repos before choosing a stack."
      ],
      mustHave: [
        "Browser audio capture and a paste-transcript fallback.",
        "A configurable speech-to-text backend (Whisper local, OpenAI, Groq, or self-hosted).",
        "A small set of transforms (clean, summarize, rewrite-as-prompt).",
        "A clear output area with copy and save.",
        "Local persistence for recent outputs and chosen transforms.",
        "Repo notes for any voice, Whisper, or text-transform starter."
      ],
      notInFirstVersion: [
        "System-wide global hotkey or OS-level dictation overlay.",
        "Real-time live captioning with multi-speaker diarization.",
        "Custom voice training or speaker-recognition models.",
        "Cloud sync, team accounts, or shared transcript libraries."
      ],
      firstMilestone: "Build the voice capture loop: record or paste a transcript, polish it with one transform, save the output, and copy it into another tool.",
      successMetrics: [
        "The user can transform a realistic transcript in one flow.",
        "The output is easy to copy or save.",
        "The app explains any model/API requirement clearly."
      ]
    };
  }
  if (isCodeEditor) {
    return {
      goal: "Help a developer try an AI-assisted code editor without locking into a closed Cursor-style ecosystem.",
      primaryUser: "A developer who wants AI coding help inside an editor they trust, with their own API keys and no vendor lock-in.",
      problem: "Closed AI editors hide prompts, route code through proprietary backends, and tie the experience to one provider. Builders need an open alternative that respects their stack, keys, and editing habits.",
      promise: "Give the developer a working AI-coding loop in a familiar editor: inline completions, chat about a file, and one safe edit action — all with their own model keys.",
      coreWorkflow: [
        "Developer installs the editor or extension into their existing setup.",
        "Developer connects their own model provider (OpenAI, Anthropic, Groq, local).",
        "Developer asks a question about an open file or selection.",
        "Editor proposes an inline edit or diff that the developer can accept or reject.",
        "History of prompts and edits stays local so the developer can audit what changed."
      ],
      stories: [
        "As a developer, I can install the editor and use my own model key in under five minutes.",
        "As a developer, I can chat about the file I have open without sending unrelated code.",
        "As a developer, I can review a suggested diff before it lands.",
        "As a builder, I can study how Cursor-alternative repos handle context windows, diffs, and provider routing."
      ],
      mustHave: [
        "Editor or extension surface with chat, inline completion, and diff-style edits.",
        "Bring-your-own-key support for at least one model provider.",
        "Per-file or per-selection context so prompts stay scoped.",
        "Visible prompt and diff so the developer can audit what the AI did.",
        "Local-only history of recent prompts and edits.",
        "Repo notes for any Cursor-alternative, Continue-style, or AI-coding starter inspected."
      ],
      notInFirstVersion: [
        "Multi-file agentic refactors that touch unrelated parts of the repo.",
        "Hosted accounts, team collaboration, or shared prompt libraries.",
        "Built-in indexing of private repos beyond the local working directory.",
        "Any kind of marketplace for custom rulesets, prompts, or models."
      ],
      firstMilestone: "Build the smallest AI-coding loop: developer adds their own API key, opens a file, asks a question about a selection, and accepts or rejects a suggested edit as a visible diff.",
      successMetrics: [
        "A developer can go from install to first accepted AI edit in under five minutes.",
        "Prompts and diffs are visible and auditable, not hidden behind the UI.",
        "The editor stays usable without network access for non-AI editing."
      ]
    };
  }
  if (isNotebookTool) {
    return {
      goal: "Help a knowledge worker capture, link, and revisit personal notes in plain Markdown — an open alternative to Obsidian-style note apps.",
      primaryUser: "A note-taker, researcher, or builder who wants a local-first knowledge base that they own and can leave at any time.",
      problem: "Knowledge tools either lock notes inside proprietary apps or force complex setup before the user can write anything. The first version must let a user open a folder of Markdown files and start writing in seconds.",
      promise: "Give the user a fast, local-first note editor with backlinks and search over a plain Markdown folder — no account, no sync server, no vendor lock-in.",
      coreWorkflow: [
        "User opens or creates a folder of Markdown files.",
        "User writes notes in a fast editor with live preview.",
        "User links notes with `[[wiki-link]]` syntax and sees backlinks appear automatically.",
        "User searches notes by title, tag, or full text.",
        "User exports or syncs the folder using their own tools (git, Dropbox, iCloud)."
      ],
      stories: [
        "As a user, I can point the app at a folder and start writing notes immediately.",
        "As a user, I can link notes together and see backlinks update without manual work.",
        "As a user, I can search across every note in under a second.",
        "As a builder, I can study Obsidian-alternative repos for editor, parser, and graph patterns."
      ],
      mustHave: [
        "Open-folder workflow over a local Markdown directory.",
        "Fast Markdown editor with live preview.",
        "Wiki-link parsing and automatic backlinks.",
        "Search across titles, tags, and full text.",
        "Local persistence — notes are just files on disk.",
        "Repo notes for any Obsidian-alternative, Logseq, or local-first editor inspected."
      ],
      notInFirstVersion: [
        "Cloud sync, end-to-end encryption, or hosted accounts.",
        "Mobile apps, real-time collaboration, or sharing links.",
        "Plugin marketplace or custom theme distribution.",
        "AI-powered note generation or auto-summarization."
      ],
      firstMilestone: "Build the smallest knowledge-base loop: open a folder, write a note, link it with `[[wiki-link]]`, see the backlink, and search across notes.",
      successMetrics: [
        "A new user can create and link two notes within two minutes.",
        "Notes remain plain Markdown files on disk that any other editor can open.",
        "Search returns results across hundreds of notes in under a second."
      ]
    };
  }
  if (isProjectTool) {
    return {
      goal: "Help a small team plan, track, and finish work in one place — an open-source alternative to ClickUp, Asana, or Notion-style task tools.",
      primaryUser: "A solo founder, small team, or freelancer who wants a simple task and project tracker without paying per seat or accepting vendor lock-in.",
      problem: "Closed project tools either over-charge per seat, hide data behind APIs, or bury simple task-tracking under enterprise features. The first version needs one team, one project, and one usable board.",
      promise: "Give a small team a working task board with tasks, lists, and status changes — locally hosted or self-hosted, with their data in a file format they can take with them.",
      coreWorkflow: [
        "User creates a project workspace (local or self-hosted).",
        "User adds tasks with title, description, status, and assignee.",
        "User organizes tasks into lists, columns, or a simple board view.",
        "User updates status by dragging, clicking, or keyboard shortcut.",
        "User exports tasks as Markdown, JSON, or CSV for backup or migration."
      ],
      stories: [
        "As a user, I can create a project and add tasks in under a minute.",
        "As a user, I can move tasks across statuses on a board.",
        "As a user, I can export or back up my data without contacting support.",
        "As a builder, I can study ClickUp-alternative repos for data models, board UX, and self-hosting patterns."
      ],
      mustHave: [
        "Project, task, and status data model.",
        "Board or list view with drag-to-move or click-to-update.",
        "Local persistence or self-hosted storage (SQLite, Postgres, or files).",
        "Single-user or single-team scope before adding accounts.",
        "Export to Markdown, JSON, or CSV.",
        "Repo notes for any ClickUp/Asana/Trello-alternative or self-hosted project tool inspected."
      ],
      notInFirstVersion: [
        "Multi-tenant SaaS billing, seats, or organization admin.",
        "Real-time collaboration, presence, or live cursors.",
        "Native mobile apps or push notification infrastructure.",
        "Built-in chat, video, or document editor — link out instead."
      ],
      firstMilestone: "Build the smallest task-board loop: create a project, add three tasks, move one across statuses on a board, and export the project to Markdown.",
      successMetrics: [
        "A new user can create a project and add their first task in under one minute.",
        "Tasks persist locally and survive a refresh.",
        "Exported data round-trips back into the app without loss."
      ]
    };
  }
  return {
    goal: "Turn the idea into one narrow workflow that saves the target user time immediately.",
    primaryUser: "A practical user with a specific job to get done, not a technical evaluator browsing features.",
    problem: "The idea is still broad. The first version needs one painful workflow, one target user, and one useful output before adding complexity.",
    promise: "Give the user a small, working product loop that proves the idea with realistic data and a clear next action.",
    coreWorkflow: [
      "User enters the main thing they need help with.",
      "App returns one useful result tailored to that input.",
      "User reviews, refines, or repeats with adjusted context.",
      "User saves or copies the useful output for re-use.",
      "User exports the result so other tools can continue the work."
    ],
    stories: [
      "As a user, I can enter the main thing I need help with.",
      "As a user, I can get one useful result without setup confusion.",
      "As a user, I can save, copy, or export the useful output.",
      "As a builder, I can inspect related repos before deciding what to reuse."
    ],
    mustHave: [
      "One primary input.",
      "One useful result view.",
      "One save/copy/export action.",
      "Empty, loading, error, and no-result states.",
      "Repo notes for any starter or reference project."
    ],
    notInFirstVersion: [
      "Multiple user personas, secondary workflows, or admin tooling.",
      "Hosted accounts, billing, or team permissions.",
      "Heavy integrations before the local loop is proven.",
      "Anything that depends on copying third-party code before licensing is confirmed."
    ],
    firstMilestone: "Build the smallest clickable workflow: input, useful result, saved decision, and one export/share action.",
    successMetrics: [
      "A new user understands the product promise in under 30 seconds.",
      "The primary workflow produces a useful result from realistic sample input.",
      "The user can save or export the result without needing setup help."
    ]
  };
}

function checkItems(items: string[]): string[] {
  return items.map((item) => `- [ ] ${item}`);
}

function bulletItems(items: string[]): string[] {
  return items.map((item) => `- ${item}`);
}

function formatScoreBreakdown(repo: BuildPackRepo): string {
  return `total ${repo.score.total}%, fit ${repo.score.fit}%, activity ${repo.score.activity}%, popularity ${repo.score.popularity}%, license ${repo.score.license}%, docs ${repo.score.docs}%`;
}

function repoActivityNote(repo: BuildPackRepo): string {
  const details = [
    `${repo.stars.toLocaleString("en-US")} stars`,
    `${repo.forks.toLocaleString("en-US")} forks`,
    `${repo.openIssues.toLocaleString("en-US")} open issues`,
    repo.pushedAt ? `last pushed ${repo.pushedAt.slice(0, 10)}` : "last push date unknown"
  ];
  if (repo.archived) details.push("archived");
  return details.join(", ");
}

function readmeSignals(repo: BuildPackRepo): string {
  if (!repo.readme) return "README details were not available from the search result.";
  const signals = [
    repo.readme.hasSetup ? "setup docs" : "setup docs not confirmed",
    repo.readme.hasExamples ? "examples" : "examples not confirmed",
    repo.readme.hasLocalDevelopment ? "local development notes" : "local development notes not confirmed",
    repo.readme.hasApiDetails ? "API details" : "API details not confirmed",
    repo.readme.hasLicenseText ? "license text" : "license text not confirmed"
  ];
  return `${signals.join(", ")}. README quality score: ${repo.readme.qualityScore}%.`;
}

function cleanRepoContent(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<\/?UNTRUSTED_REPO_CONTENT>/gi, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<\/?(?:a|img|picture|source|div|span|h1|h2|p|br)\b[^<>\n|]*/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanRepo(repo: BuildPackRepo): BuildPackRepo {
  return {
    ...repo,
    description: cleanRepoContent(repo.description),
    topics: repo.topics.map((topic) => cleanRepoContent(topic)).filter(Boolean),
    readme: repo.readme
      ? {
          ...repo.readme,
          excerpt: cleanRepoContent(repo.readme.excerpt)
        }
      : undefined
  };
}

function repoHaystack(repo: BuildPackRepo | undefined): string {
  if (!repo) return "";
  return [
    repo.fullName,
    repo.name,
    cleanRepoContent(repo.description),
    ...repo.topics.map(cleanRepoContent),
    cleanRepoContent(repo.readme?.excerpt)
  ].join(" ").toLowerCase();
}

type FoundationFeature = {
  label: string;
  pattern: RegExp;
};

const foundationFeatures: FoundationFeature[] = [
  { label: "card search/catalog", pattern: /\b(card catalog|catalogue|card search|search cards?|card database|tcg api|pok[eé]mon tcg|sets?|rarity)\b/i },
  { label: "collection/vault", pattern: /\b(collection|collector|owned cards?|vault|inventory|portfolio)\b/i },
  { label: "binder/wishlist/grouping", pattern: /\b(binder|album|wishlist|wish list|groups?|tags?)\b/i },
  { label: "pricing/value estimates", pattern: /\b(price|pricing|value|valuation|market|tcgplayer|cardmarket|estimate|worth)\b/i },
  { label: "export/backup", pattern: /\b(export|backup|csv|json|download|import|restore)\b/i },
  { label: "scanner/image-assisted entry", pattern: /\b(scan|scanner|image[-\s]?assisted|camera|ocr|photo|recognition)\b/i },
  { label: "analytics/dashboard", pattern: /\b(analytics|dashboard|chart|stats?|insights?|total value|portfolio)\b/i },
  { label: "frontend shell", pattern: /\b(frontend|front-end|react|next\.?js|vue|svelte|ui|components?|routes?|pages?)\b/i },
  { label: "backend/API", pattern: /\b(api|backend|back-end|server|routes?|endpoints?|graphql|rest)\b/i },
  { label: "database/persistence", pattern: /\b(database|db|sqlite|postgres|mysql|mongodb|prisma|drizzle|persistence|storage|localstorage|indexeddb)\b/i },
  { label: "Docker/local setup", pattern: /\b(docker|dockerfile|compose|local setup|localhost|dev server|install|self-host)\b/i }
];

const cardSpecificFoundationLabels = new Set([
  "card search/catalog",
  "collection/vault",
  "binder/wishlist/grouping",
  "pricing/value estimates",
  "export/backup",
  "scanner/image-assisted entry"
]);

function foundationCoverageMap(repo: BuildPackRepo | undefined, profile: ProductProfile, originalIdea: string): string[] {
  if (!repo) return ["- Already detected: no starter repo selected yet."];
  const haystack = repoHaystack(repo);
  const isCardProduct =
    /\b(pokemon|pokémon|tcgdex|tcg|trading[-\s]?card|collectibles?|card collection|card collector|collector album|card binder|card value|tcgplayer|cardmarket|sports[-\s]?cards?|magic the gathering|mtg|yu-gi-oh|yugioh)\b/i.test(originalIdea);
  const features = isCardProduct ? foundationFeatures : foundationFeatures.filter((feature) => !cardSpecificFoundationLabels.has(feature.label));
  const detected = features.filter((feature) => feature.pattern.test(haystack)).map((feature) => feature.label);
  const missing = features.filter((feature) => !detected.includes(feature.label)).map((feature) => feature.label);

  return [
    `- Already detected: ${detected.length ? detected.join(", ") : "no strong feature coverage from description, topics, or README excerpt."}`,
    `- Keep first: ${detected.length ? detected.slice(0, 5).join(", ") : "working setup and any generic app shell that runs locally."}`,
    `- Replace/rebrand: product name, navigation, sample data, screenshots, demo copy, and any branding that belongs to ${repo.fullName}.`,
    `- Add/customize: ${missing.length ? missing.slice(0, 5).join(", ") : `the product-specific workflow from the PRD: ${profile.firstMilestone}`}.`,
    "- Remove/defer: unrelated demo pages, marketplace/social/admin features, and anything listed in Skip In v1.",
    `- Risk checks: verify license, attribution, data/image terms, and setup health before copying code${isCardProduct ? "; use original branding, avoid official logos or copied product UI, confirm card-image/pricing API terms, and label card values as estimates." : "."}`
  ];
}

function verdictDirection(result: IdeaCheckResult): string {
  const best = result.repos[0];
  if (best && best.score.fit < 25) {
    return "Treat this as a weak research pass, not a fork decision. Inspect the listed repos for patterns, then run a narrower search before choosing a foundation.";
  }
  if (result.verdict === "already_exists") {
    return "Assume overlap is real. Start by comparing the top repo with the intended user promise, then decide whether to use, fork, or differentiate.";
  }
  if (result.verdict === "use_existing") {
    return "Assume an existing project may satisfy much of the need. Validate whether wrapping, extending, or contributing is better than building a separate product.";
  }
  if (result.verdict === "fork_candidate_found") {
    return "Treat the best repo as a candidate foundation, but inspect install friction, licensing, and maintainability before committing to a fork.";
  }
  if (result.verdict === "build_differentiated") {
    return "Build only where the product promise is meaningfully different from the repos found. Use existing repos as reference, not as the whole product.";
  }
  if (result.verdict === "open_gap") {
    return "The search suggests room for a focused build. Reuse patterns from adjacent repos, then validate the narrow workflow quickly.";
  }
  return "Research is not strong enough yet. Narrow the user, workflow, and search terms before choosing a starter repo.";
}

function decisionChecklist(result: IdeaCheckResult): string[] {
  const best = result.repos[0];
  const verdict = best && best.score.fit < 25 ? "weak research pass" : `${result.verdictLabel} (${result.confidence}% confidence)`;
  return [
    `Confirm the product direction still matches the evidence: ${verdict}.`,
    "Pick one primary user and one painful workflow; defer adjacent personas.",
    "Inspect the top repo before copying architecture, code, assets, models, or data.",
    "Decide whether the first build is a fork, reference implementation, or fresh app with borrowed patterns.",
    "Write down the license decision and any attribution obligations before implementation."
  ];
}

function slugFromIdea(idea: string, fallback = "forkfirst-build"): string {
  const slug = idea
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42)
    .replace(/-+$/g, "");
  return slug || fallback;
}

function preferredProjectName(originalIdea: string, preferences?: BuildPackPreferences): string {
  const raw = preferences?.productName ?? preferences?.name;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return slugFromIdea(originalIdea, "new-product");
}

function preferenceLines(preferences?: BuildPackPreferences): string[] {
  if (!preferences) return [];
  const labels: Record<string, string> = {
    productName: "Product name",
    name: "Product name",
    productGoal: "Product goal",
    audience: "Audience",
    firstMilestone: "First working milestone",
    keepFromRepo: "Keep from repo",
    replaceFromRepo: "Replace from repo",
    addToRepo: "Add on top",
    vibe: "Brand vibe",
    accentColor: "Accent color",
    designNotes: "Design notes",
    chatContext: "Conversation context",
    skipInV1: "Skip in v1"
  };
  return Object.entries(preferences)
    .filter(([, value]) => Array.isArray(value) ? value.some((item) => !isGenericBuildPackPreference(item)) : typeof value === "string" && !isGenericBuildPackPreference(value))
    .map(([key, value]) => {
      const label = labels[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " ");
      const cleaned = Array.isArray(value) ? value.filter((item) => !isGenericBuildPackPreference(item)).join(", ") : value;
      return `- ${label}: ${cleaned}`;
    });
}

function preferenceSkipList(preferences?: BuildPackPreferences): string[] {
  const raw = preferences?.skipInV1;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string" && raw.trim()) return raw.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function stringPreference(preferences: BuildPackPreferences | undefined, key: string): string | null {
  const value = preferences?.[key];
  if (isGenericBuildPackPreference(value)) return null;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function profileWithPreferences(profile: ProductProfile, preferences?: BuildPackPreferences): ProductProfile {
  return {
    ...profile,
    goal: stringPreference(preferences, "productGoal") ?? profile.goal,
    primaryUser: stringPreference(preferences, "audience") ?? profile.primaryUser,
    firstMilestone: stringPreference(preferences, "firstMilestone") ?? profile.firstMilestone
  };
}

function foundationMode(repo: BuildPackRepo | undefined): "clone" | "inspect" | "none" {
  if (!repo) return "none";
  if (repo.score.fit >= 45 && (repo.category === "forkable" || repo.category === "already_exists")) return "clone";
  return "inspect";
}

function foundationDecision(repo: BuildPackRepo | undefined): string {
  if (!repo) return "No starter repo was selected. Run another search or paste a known repo before asking an AI builder to implement.";
  const label = recommendedRepoLabel(repo).toLowerCase();
  if (foundationMode(repo) === "clone") {
    return `${repo.fullName} is the selected ${label}. Clone or fork it as the candidate foundation, then validate setup, license, and architecture before editing. If inspection reveals a blocker, stop and record the blocker instead of forcing the repo.`;
  }
  return `${repo.fullName} is only a ${label}. Inspect it for patterns first; do not treat it as the code foundation unless setup, license, and architecture prove it is a strong fit.`;
}

function foundationCommands(repo: BuildPackRepo | undefined, projectName: string): string[] {
  if (!repo) return ["# No starter repo selected yet.", "# Paste a repo into ForkFirst or rerun the search before building."];
  const folder = slugFromIdea(projectName, repo.name);
  return [
    `git clone ${repo.url} ${folder}`,
    `cd ${folder}`,
    `git remote -v`,
    "# Read README, package files, license, and app entrypoints before editing.",
    "# Install with the repo's documented package manager, then run its documented dev/test commands."
  ];
}

function adaptationMap(repo: BuildPackRepo | undefined, profile: ProductProfile, preferences?: BuildPackPreferences): string[] {
  if (!repo) return ["- No repo foundation selected yet."];
  const keep = stringPreference(preferences, "keepFromRepo");
  const replace = stringPreference(preferences, "replaceFromRepo");
  const add = stringPreference(preferences, "addToRepo");
  const designLine = [
    preferences?.vibe ? `brand vibe: ${preferences.vibe}` : null,
    preferences?.accentColor ? `accent: ${preferences.accentColor}` : null,
    preferences?.audience ? `audience: ${preferences.audience}` : null
  ].filter(Boolean).join("; ");
  return [
    `- Keep: ${keep || `working setup, app shell, routing, persistence/data patterns, tests, and components that directly support: ${profile.coreWorkflow[0]}`}`,
    `- Replace: ${replace || "product copy, brand, sample data, navigation labels, onboarding, and any domain assumptions that do not match this idea."}`,
    `- Add: ${add || "the smallest product loop from the PRD, plus save/export behavior if it is not already present."}`,
    `- Remove or defer: anything listed in Skip In v1, paid/team/admin surfaces, and unrelated demo features from ${repo.fullName}.`,
    `- Design direction: ${designLine || "derive a clear design pass from the Product Promise and Primary User before polishing UI."}`
  ];
}

function fileInspectionChecklist(repo: BuildPackRepo | undefined): string[] {
  const repoLabel = repo?.fullName ?? "the selected repo";
  return [
    `README and setup docs for ${repoLabel}.`,
    "Package manager files such as package.json, pnpm-lock.yaml, yarn.lock, package-lock.json, pyproject.toml, requirements.txt, Cargo.toml, or go.mod.",
    "App entrypoints, route files, components, data models, API handlers, and persistence layer.",
    "Existing tests, lint/typecheck scripts, CI config, and manual QA notes.",
    "Environment variable examples, secret-handling paths, telemetry/logging, and any hosted-service assumptions.",
    "LICENSE, NOTICE, asset licenses, model/data licenses, and attribution requirements."
  ];
}

function brandDesignBrief(profile: ProductProfile, preferences?: BuildPackPreferences): string[] {
  const lines: string[] = [
    `- Product promise to express in the UI: ${profile.promise}`,
    `- Primary user to design for: ${profile.primaryUser}`,
    "- First impression: the user should immediately understand the main job, the selected starter repo, and the next action.",
    "- Interaction feel: practical, fast, and evidence-driven; avoid decorative screens that slow down the first successful workflow.",
    "- Design reuse rule: keep useful layout/component patterns from the starter repo, but replace copy, sample data, colors, and domain assumptions to match this product."
  ];
  if (preferences?.productName || preferences?.name) lines.push(`- Product name: ${preferences.productName ?? preferences.name}`);
  if (preferences?.vibe) lines.push(`- Brand vibe: ${preferences.vibe}`);
  if (preferences?.accentColor) lines.push(`- Accent color: ${preferences.accentColor}`);
  if (preferences?.designNotes) lines.push(`- Design notes: ${preferences.designNotes}`);
  return lines;
}

function reuseMatrixLines(repo: BuildPackRepo | undefined, blueprint: HandoffBlueprint): string[] {
  const firstFeature = cleanEvidenceSnippet(repo?.readme?.evidence?.featureSnippets?.[0]) ?? "Inspect README/app files";
  const firstIntegration = cleanEvidenceSnippet(repo?.readme?.evidence?.integrationSnippets?.[0]) ?? "Inspect models/schemas";
  const firstCommand = cleanEvidenceSnippet(repo?.readme?.evidence?.commandSnippets?.[0]) ?? "Inspect package files";
  const uiEvidence = cleanEvidenceSnippet(repo?.readme?.excerpt) ?? "Inspect components";
  return [
    "| Area | Keep | Replace | Build Fresh | Avoid | Evidence |",
    "|---|---|---|---|---|---|",
    `| Product workflow | Starter flows that support ${blueprint.primaryWorkflow[0]} | Copy, labels, sample data | Missing steps from the primary workflow | Unrelated starter features | ${firstFeature} |`,
    `| Data model | Entities matching ${blueprint.coreDataObjects.slice(0, 3).join(", ")} | Domain-specific assumptions | Missing product entities | License-unclear data | ${firstIntegration} |`,
    `| UI | Useful shells, lists, cards, forms | Branding, layout that feels copied | Screens listed in PRD | Protected logos/assets | ${uiEvidence} |`,
    `| Setup/tests | Documented commands | Broken scripts | Missing QA for first milestone | Invented commands | ${firstCommand} |`
  ];
}

function filesLikelyToInspect(repo: BuildPackRepo | undefined, blueprint: HandoffBlueprint): string[] {
  const text = `${repo?.readme?.excerpt ?? ""} ${repo?.description ?? ""}`.toLowerCase();
  const files = ["README.md", "LICENSE", "package files / lockfiles", "app entrypoints"];
  if (/react|vite|next|frontend/.test(text)) files.push("frontend routes/components");
  if (/fastapi|express|backend|api/.test(text)) files.push("backend API routes/services");
  if (/postgres|sqlite|database|model|schema/.test(text)) files.push("database models/schemas");
  if (blueprint.productKind === "card-collector") files.push("card search, owned collection, pricing, export, and backup modules");
  return files;
}

function architectureEvidenceLines(repo: BuildPackRepo | undefined): string[] {
  const evidence = repo?.readme?.evidence;
  const lines = [
    evidence?.fetchStatus
      ? `- README fetch status: ${evidence.fetchStatus}${evidence.fetchedAt ? ` at ${evidence.fetchedAt}` : ""}`
      : "- README fetch status: unknown"
  ];
  for (const line of evidence?.setupSnippets ?? []) pushEvidenceLine(lines, "Setup", line);
  for (const line of evidence?.commandSnippets ?? []) pushEvidenceLine(lines, "Command/setup note", line);
  for (const line of evidence?.featureSnippets ?? []) pushEvidenceLine(lines, "Feature", line);
  for (const line of evidence?.integrationSnippets ?? []) pushEvidenceLine(lines, "Integration", line);
  if (lines.length === 1 && repo?.readme?.excerpt) lines.push(`- README excerpt: ${repo.readme.excerpt.slice(0, 260)}`);
  return lines;
}

function cleanEvidenceSnippet(line: string | null | undefined): string | null {
  if (!line) return null;
  const cleaned = cleanRepoContent(line)
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length < 4) return null;
  if (/shields\.io|github\/stars|github\/license|docker pulls/i.test(cleaned)) return null;
  return cleaned.slice(0, 220);
}

function pushEvidenceLine(lines: string[], label: string, raw: string): void {
  const cleaned = cleanEvidenceSnippet(raw);
  if (cleaned) lines.push(`- ${label}: ${cleaned}`);
}

function wowDemoScript(blueprint: HandoffBlueprint, repo: BuildPackRepo | undefined): string[] {
  const scripted = blueprint.wowDemoScript.map((step) => `- ${step}`);
  return [
    "- Start from a blank or realistic sample state, not a mocked marketing page.",
    `- Complete this milestone on screen: ${blueprint.firstMilestone}`,
    ...scripted,
    repo ? `- Show where ${repo.fullName} helped: reused setup, component pattern, data model, workflow, or implementation idea.` : "- Show the repo decision or explain why no foundation was selected.",
    "- End with a saved, copied, exported, or revisitable output that proves the product did useful work.",
    "- Call out any honest limitation, missing key, mocked data, or license question before the user asks."
  ];
}

function phasePlan(firstMilestone: string, agentFile: string, repo: BuildPackRepo | undefined, projectName: string, blueprint?: HandoffBlueprint): Array<{ title: string; tasks: string[]; acceptance: string[] }> {
  const commands = foundationCommands(repo, projectName);
  const productTasks = blueprint
    ? [
        `Data: model or adapt ${blueprint.coreDataObjects.slice(0, 5).join(", ")}.`,
        `Screens: build ${blueprint.keyScreens.slice(0, 5).join(", ")}.`,
        `Core actions: support ${blueprint.userActions.slice(0, 6).join(", ")}.`,
        `States: implement empty/loading/error/no-result/partial-success behavior from PRD.md.`,
        "Export/share/save path: make the first workflow revisitable or portable."
      ]
    : [
        firstMilestone,
        "Use realistic sample data when external integrations are not ready.",
        "Keep persistence local unless the PRD requires accounts or collaboration."
      ];
  return [
    {
      title: "Phase 0 - Clone Foundation And Add Handoff Files",
      tasks: [
        repo ? `Clone or fork the selected starter repo: ${repo.fullName}.` : "Choose a starter repo before implementation.",
        ...commands.map((command) => `Run or adapt: ${command}`),
        `Create STARTER_REPO.md, PRD.md, BUILD_PLAN.md, REPO_STARTER_NOTES.md, and ${agentFile} in the cloned repo root from this combined handoff packet.`,
        "Copy/split the relevant sections yourself without asking the user to manually arrange the Markdown.",
        "Mark unknowns as open questions instead of filling them with assumptions."
      ],
      acceptance: [
        "The cloned repo opens locally or the setup blocker is documented.",
        "The repo has the handoff files at the root.",
        "Each file contains editable checklists and a clear next action.",
        "Open questions are explicitly listed."
      ]
    },
    {
      title: "Phase 1 - Repo Inspection",
      tasks: [
        "Open the recommended repo and read README, examples, license, issues, and recent commits.",
        "Inspect package scripts, app entrypoints, data/persistence layers, API routes, components, and tests.",
        "Run the documented setup in a clean checkout if reuse is still likely.",
        "Record what to reuse, what to avoid, and whether a fork is justified."
      ],
      acceptance: [
        "REPO_STARTER_NOTES.md says fork, reference, or avoid with a reason.",
        "License and attribution notes are documented.",
        "A working setup path or blocker is recorded."
      ]
    },
    {
      title: "Phase 2 - Smallest Product Loop",
      tasks: productTasks,
      acceptance: [
        firstMilestone,
        "A user can complete the main workflow from input to useful output.",
        "The result can be saved, copied, exported, or revisited.",
        "Empty, loading, error, and no-result states are handled."
      ]
    },
    {
      title: "Phase 3 - Quality Bar",
      tasks: [
        "Add focused tests or a manual QA checklist for the primary workflow.",
        "Run the starter repo's documented verification commands and record any missing lint/typecheck/test scripts.",
        "Update the build plan with completed items and remaining risks."
      ],
      acceptance: [
        "Verification commands pass or documented failures include root cause and next action.",
        "The product still matches the PRD after implementation.",
        "The next phase is small enough for another AI builder to pick up safely."
      ]
    }
  ];
}

function licenseReuseNote(repo: BuildPackRepo): string {
  if (!repo.license) return "No license was detected. Treat this as research only until a human confirms reuse rights.";
  const license = repo.license.toUpperCase();
  if (license.includes("AGPL")) {
    return `${repo.license} may add reciprocal obligations, including network use and source-sharing requirements for users who interact with a modified hosted version. Confirm compatibility, notice, source-offer, and deployment obligations before copying code into a closed or differently licensed project.`;
  }
  if (license.includes("GPL") || license.includes("AGPL") || license.includes("LGPL")) {
    return `${repo.license} may add reciprocal obligations. Confirm compatibility before copying code into a closed or differently licensed project.`;
  }
  return `${repo.license} was detected. Still confirm the LICENSE file, notices, assets, dependencies, and README reuse guidance before copying code.`;
}

function inspectionSteps(repo: BuildPackRepo): string[] {
  return [
    `Open ${repo.url} and read README setup, examples, and recent release notes.`,
    "Run the documented local setup in a clean checkout before relying on it.",
    "Check issue age, recent commits, dependency health, and whether maintainers answer bug reports.",
    "Confirm the LICENSE file and any asset/model/data licenses before copying implementation details."
  ];
}

function relevantTerms(text: string): Set<string> {
  const terms = new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length >= 4)
      .filter((term) => !["with", "that", "this", "from", "more", "github", "repos", "repo", "find", "make", "build", "want"].includes(term))
  );
  const lower = text.toLowerCase();
  if (/\b(realtors?|real estate|realty|broker|mls|property|listing)\b/i.test(lower)) {
    ["real", "estate", "realtor", "property", "listing", "mls"].forEach((term) => terms.add(term));
  }
  if (/\b(image|images|photo|photos|visual|creative|generator|generate)\b/i.test(lower)) {
    ["image", "photo", "visual", "generator", "creative"].forEach((term) => terms.add(term));
  }
  return terms;
}

function filterRelevantQueries(queries: string[], originalIdea: string, researchContext: string | null): string[] {
  const originalTerms = relevantTerms(originalIdea);
  const contextTerms = relevantTerms(researchContext ?? "");
  const terms = originalTerms.size > 0 ? originalTerms : contextTerms;
  if (terms.size === 0) return queries.slice(0, 8);
  const relevant = queries.filter((query) => {
    const lower = query.toLowerCase();
    return Array.from(terms).some((term) => lower.includes(term));
  });
  return (relevant.length ? relevant : queries).slice(0, 8);
}

function displayVerdict(result: IdeaCheckResult): { label: string; confidence: number } {
  const best = result.repos[0];
  if (best && best.score.fit < 25) return { label: "Needs more focused research", confidence: Math.min(result.confidence, 55) };
  return { label: result.verdictLabel, confidence: result.confidence };
}

function recommendedRepoLabel(repo: BuildPackRepo): string {
  if (repo.score.fit < 25) return "Research lead only";
  if (repo.score.fit < 45) return "Reference candidate";
  if (repo.category === "forkable") return "Fork candidate";
  if (repo.category === "already_exists") return "Existing product to compare";
  return "Repo to inspect";
}

function normalizeForDedup(text: string): string {
  return text
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[^a-z0-9]/g, "");
}

function mergedSkipList(profileList: string[], derivedList: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const item of [...profileList, ...derivedList]) {
    const key = normalizeForDedup(item);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged.slice(0, 6);
}

function promptPackSummaries(markdown: string | undefined): string[] {
  if (!markdown?.trim()) return [];
  const sections = markdown
    .split(/\n(?=##\s+)/)
    .map((section) => section.trim())
    .filter(Boolean);

  const rows = sections.slice(0, 6).map((section) => {
    const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
    const title = (lines[0] ?? "Custom rule pack").replace(/^#+\s*/, "").replace(/\|/g, "/").slice(0, 60);
    const rules = lines
      .slice(1)
      .filter((line) => /^[-*]\s+/.test(line))
      .map((line) => line.replace(/^[-*]\s*/, "").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const mustFollow = (rules[0] ?? "Apply this pack only where it improves the first milestone.").replace(/\|/g, "/").slice(0, 120);
    const verification = (rules.find((rule) => /test|verify|check|run|confirm|inspect/i.test(rule)) ?? "Verify the first milestone still matches the PRD.").replace(/\|/g, "/").slice(0, 120);
    return `| ${title} | The user enabled this build-rule pack. | ${mustFollow} | ${verification} |`;
  });

  return [
    "The user enabled these build-rule packs. Apply the intent, but keep PRD.md focused on the actual product.",
    "Full prompt pack text is omitted from the PRD to keep the handoff concise.",
    "| Pack | Why Included | Must Follow | Verification |",
    "|---|---|---|---|",
    ...rows
  ];
}

function ideaRiskChecks(originalIdea: string): string[] {
  const isPokemonProduct = /\b(pokemon|pokémon|tcgdex)\b/i.test(originalIdea);
  const isGenericCardProduct = /\b(tcg|trading[-\s]?card|collectibles?|card collection|card collector|sports[-\s]?cards?|magic the gathering|mtg|yu-gi-oh|yugioh)\b/i.test(originalIdea);
  if (!isPokemonProduct && !isGenericCardProduct) return [];

  const brandRisk = isPokemonProduct
    ? "Use original branding; do not copy Pokemon Collector's product name, layout, iconography, screenshots, or UI copy."
    : "Use original branding; do not copy another collector app's product name, layout, iconography, screenshots, or UI copy.";
  const assetRisk = isPokemonProduct
    ? "Avoid official Pokemon logos, protected card images, and copied product UI unless rights and terms explicitly allow the intended use."
    : "Avoid official league, game, brand, logo, scraped image, and copied product UI unless rights and terms explicitly allow the intended use.";

  return [
    brandRisk,
    assetRisk,
    "Confirm card-image and pricing API terms before integrating or caching external data.",
    "Label card values as estimates, show source/date when possible, and avoid implying guaranteed resale value."
  ];
}

function verificationChecklist(repo: BuildPackRepo | undefined): string[] {
  const repoName = repo?.fullName ?? "the starter repo";
  return [
    `Run the starter repo's documented install, build, dev, and test commands from README/package files (${repoName}).`,
    "If lint, typecheck, or test scripts are missing, record that instead of inventing commands.",
    "Manually run the first milestone end to end before claiming it works.",
    "Add focused automated tests or a manual QA checklist for the primary workflow and any data/export behavior.",
    "Update BUILD_PLAN.md checkboxes with what is actually done, what failed, and what remains unverified."
  ];
}

function isRelevantAlsoWorthChecking(repo: BuildPackRepo, focusRepo: BuildPackRepo, originalIdea: string): boolean {
  if (repo.fullName === focusRepo.fullName) return false;
  if (repo.score.fit < 25) return false;

  const terms = relevantTerms(originalIdea);
  const haystack = repoHaystack(repo);
  return Array.from(terms).some((term) => haystack.includes(term));
}

// TODO: LLM-driven PRD prose upgrade (planned, not yet implemented).
// Add an async function llmPrdSection(result, keys) that POSTs to
// /api/handoff-prd/route.ts running the LLM with a tight prompt and returns
// the PRD section markdown. Call it optionally from buildProjectBuildPack.
// Requires careful design: timeout, fallback, cost estimate, error states.

export function notToBuildInV1(result: IdeaCheckResult): string[] {
  const generic = [
    "Multi-user logins or team features before the solo workflow is proven.",
    "Hosted cloud sync or real-time collaboration before local persistence is solid.",
    "Pretty UI before the core flow works end to end.",
    "Fancy integrations before the basic version works manually.",
    "Analytics or dashboards before you have any users."
  ];

  const fromGaps: string[] = result.gaps.map(cleanRepoContent).filter(Boolean).slice(0, 2).flatMap((gap) => {
    const lower = gap.toLowerCase();
    if (lower.includes("auth") || lower.includes("account") || lower.includes("login")) {
      return ["Full authentication and account management — start with local-only or single-user mode."];
    }
    if (lower.includes("api") || lower.includes("integrat")) {
      return ["Third-party API integrations before you've validated the core workflow manually."];
    }
    if (lower.includes("mobile") || lower.includes("native")) {
      return ["Native mobile apps — ship the web version first and validate demand."];
    }
    // Gap doesn't map to a recognizable category — skip it, rely on generic list
    return [];
  });

  return [...fromGaps, ...generic].slice(0, 6);
}

export function buildProjectBuildPack(result: IdeaCheckResult, target: BuildTarget, focusRepo?: BuildPackRepo, wizardAnswers?: BuildPackPreferences, promptPackMarkdown?: string): string {
  const { originalIdea, researchContext } = cleanIdeaPrompt(result.prompt);
  const sanitizedRepos = result.repos.map(cleanRepo);
  const topRepos = sanitizedRepos.slice(0, 3);
  const sanitizedFocusRepo = focusRepo ? cleanRepo(focusRepo) : undefined;
  const bestRepo = sanitizedFocusRepo ?? topRepos[0];
  const bestNarrative = bestRepo ? buildRepoNarrative(bestRepo) : null;
  const alsoWorthChecking = sanitizedFocusRepo
    ? topRepos.filter((repo) => isRelevantAlsoWorthChecking(repo, sanitizedFocusRepo, originalIdea)).slice(0, 2)
    : [];
  const chatContext = typeof wizardAnswers?.chatContext === "string" ? wizardAnswers.chatContext : null;
  const blueprintSignal = [
    originalIdea,
    researchContext,
    chatContext,
    bestRepo?.fullName,
    bestRepo?.description,
    ...(bestRepo?.topics ?? []),
    bestRepo?.readme?.excerpt,
    ...result.queries
  ].filter(Boolean).join(" ");
  const inferredBlueprint = buildHandoffBlueprint({
    originalIdea,
    researchContext,
    chatContext,
    queries: result.queries,
    selectedRepo: bestRepo,
    candidateRepos: topRepos,
    preferences: wizardAnswers
  });
  const legacyProfile = profileWithPreferences(productProfileFor(blueprintSignal || originalIdea), wizardAnswers);
  const blueprint = inferredBlueprint.productKind === "workflow-app" && !isGenericProductProfile(legacyProfile)
    ? blueprintFromProfile(legacyProfile, "workflow-app", ["user idea", "legacy product profile", bestRepo ? "selected repo metadata" : "search result"])
    : inferredBlueprint;
  const profile = profileFromBlueprint(blueprint);
  const projectName = preferredProjectName(originalIdea, wizardAnswers);
  const preferenceBullets = preferenceLines(wizardAnswers);
  const skipPreferences = preferenceSkipList(wizardAnswers);
  const relevantQueries = filterRelevantQueries(result.queries, originalIdea, researchContext);
  const visibleVerdict = displayVerdict(result);
  const sanitizedGaps = result.gaps.map(cleanRepoContent).filter(Boolean);
  const gaps = [...(sanitizedGaps.length ? sanitizedGaps : ["No explicit gaps were returned. Validate differentiation during repo inspection."]), ...ideaRiskChecks(originalIdea)];
  const builderRulePackLines = promptPackSummaries(promptPackMarkdown);
  const phaseLines = phasePlan(profile.firstMilestone, target === "codex" ? "AGENTS.md" : target === "claude-code" ? "CLAUDE.md" : "AI_BUILDER_NOTES.md", bestRepo, projectName, blueprint).flatMap(
    (phase) => [
      `### ${phase.title}`,
      `Tasks`,
      ...checkItems(phase.tasks),
      `Acceptance`,
      ...checkItems(phase.acceptance),
      ``
    ]
  );
  const primaryRepoLines = bestRepo ? (() => {
    const narrative = buildRepoNarrative(bestRepo);
    return [
      `### 1. ${bestRepo.fullName}${focusRepo ? " (primary focus)" : ""}`,
      `- URL: ${bestRepo.url}`,
      `- Type: ${narrative.kindLabel}`,
      `- Score: ${formatScoreBreakdown(bestRepo)}`,
      `- Activity snapshot: ${repoActivityNote(bestRepo)}`,
      `- README signals: ${readmeSignals(bestRepo)}`,
      `- What it does: ${narrative.overview}`,
      `- Why it matched: ${narrative.why}`,
      `- Good for: ${narrative.goodFor}`,
      `- Not good for: ${narrative.notFor}`,
      `- Reuse caution: ${narrative.caution}`,
      `- Next step: ${narrative.next}`,
      `- License/reuse: ${licenseReuseNote(bestRepo)}`,
      ``
    ];
  })() : [];

  const alsoWorthCheckingLines = alsoWorthChecking.flatMap((repo, index) => {
    const narrative = buildRepoNarrative(repo);
    return [
      `### ${index + 2}. ${repo.fullName} (also worth checking)`,
      `- URL: ${repo.url}`,
      `- Score: ${formatScoreBreakdown(repo)}`,
      `- What it does: ${narrative.overview}`,
      `- Good for: ${narrative.goodFor}`,
      `- License/reuse: ${licenseReuseNote(repo)}`,
      ``
    ];
  });

  const otherTopRepos = focusRepo ? [] : topRepos.slice(1);
  const otherRepoLines = otherTopRepos.flatMap((repo, index) => {
    const narrative = buildRepoNarrative(repo);
    return [
      `### ${index + 2}. ${repo.fullName}`,
      `- URL: ${repo.url}`,
      `- Type: ${narrative.kindLabel}`,
      `- Score: ${formatScoreBreakdown(repo)}`,
      `- Activity snapshot: ${repoActivityNote(repo)}`,
      `- README signals: ${readmeSignals(repo)}`,
      `- What it does: ${narrative.overview}`,
      `- Why it matched: ${narrative.why}`,
      `- Good for: ${narrative.goodFor}`,
      `- Not good for: ${narrative.notFor}`,
      `- Reuse caution: ${narrative.caution}`,
      `- Next step: ${narrative.next}`,
      `- License/reuse: ${licenseReuseNote(repo)}`,
      ``
    ];
  });

  const repoLines = [...primaryRepoLines, ...alsoWorthCheckingLines, ...otherRepoLines];
  const agentFile = target === "codex" ? "AGENTS.md" : target === "claude-code" ? "CLAUDE.md" : "AI_BUILDER_NOTES.md";
  const agentHeading = target === "codex" ? "AGENTS" : target === "claude-code" ? "CLAUDE" : "AI_BUILDER_NOTES";
  const cloneCommands = foundationCommands(bestRepo, projectName);
  const foundationModeLabel = foundationMode(bestRepo);

  const notToBuild = notToBuildInV1(result);

  return [
    `# ForkFirst Builder Handoff`,
    ``,
    `Target builder: ${buildTargetLabels[target]}`,
    `Generated by ForkFirst.`,
    ...(focusRepo ? [`Focused on: ${focusRepo.fullName}`] : []),
    ``,
    `How to use this: the user may paste this whole file, upload it, or provide it as a download. The AI builder should handle cloning/opening the selected repo, splitting this packet into STARTER_REPO.md, PRD.md, BUILD_PLAN.md, REPO_STARTER_NOTES.md, and ${agentFile}, then building from those instructions.`,
    `Do not make the user manually sort the Markdown files. Treat this combined packet as the source of truth, create the files you need, keep the checkboxes, delete sections that stop being true, and replace unknowns with evidence as you inspect the repo.`,
    ``,
    `# STARTER_REPO`,
    ``,
    `## Selected Foundation`,
    bestRepo ? `- Repo: ${bestRepo.fullName}` : "- Repo: none selected",
    bestRepo ? `- URL: ${bestRepo.url}` : "- URL: n/a",
    `- Foundation mode: ${foundationModeLabel === "clone" ? "clone/fork candidate" : foundationModeLabel === "inspect" ? "inspect before using as foundation" : "no foundation selected"}`,
    `- Decision: ${foundationDecision(bestRepo)}`,
    ``,
    `## Clone Or Fork Commands`,
    "```bash",
    ...cloneCommands,
    "```",
    ``,
    `## Repo-To-Product Adaptation Map`,
    ...adaptationMap(bestRepo, profile, wizardAnswers),
    ``,
    `## Foundation Coverage Map`,
    ...foundationCoverageMap(bestRepo, profile, originalIdea),
    ``,
    `## Reuse Matrix`,
    ...reuseMatrixLines(bestRepo, blueprint),
    ``,
    `## Foundation Guardrails`,
    ...checkItems([
      "Do not scaffold a brand-new app unless repo inspection proves the starter is unusable.",
      "Do not copy third-party code into a different project until license and attribution notes are documented.",
      "Keep the starter repo's working setup intact while replacing product-specific behavior.",
      "Document every major keep, replace, remove, and build-fresh decision in REPO_STARTER_NOTES.md."
    ]),
    ``,
    `## File Inspection Checklist`,
    ...checkItems(fileInspectionChecklist(bestRepo)),
    ``,
    `# PRD`,
    ``,
    `## Snapshot`,
    `- Verdict: ${visibleVerdict.label} (${visibleVerdict.confidence}% confidence)`,
    `- Summary: ${bestRepo ? `${recommendedRepoLabel(bestRepo)}: ${bestRepo.fullName} is the first repo to inspect from this pass. Fit score: ${bestRepo.score.fit}%.` : "No repo leads were returned yet."}`,
    `- Build direction: ${verdictDirection(result)}`,
    ``,
    `## Original Idea`,
    originalIdea,
    ...(preferenceBullets.length > 0
      ? [
          ``,
          `## Builder Preferences`,
          ...preferenceBullets
        ]
      : []),
    ...(researchContext ? [``, `## Research Context`, researchContext] : []),
    ...(relevantQueries.length ? [``, `## Search Queries Used`, ...bulletItems(relevantQueries)] : []),
    ``,
    `## Product Thesis`,
    blueprint.productThesis,
    ``,
    `## Brand And Design Brief`,
    ...brandDesignBrief(profile, wizardAnswers),
    ``,
    `## Target User Segment`,
    blueprint.targetUserSegment,
    ``,
    `## Job To Be Done`,
    blueprint.jobToBeDone,
    ``,
    `## Current Alternatives`,
    ...bulletItems(blueprint.currentAlternatives),
    ``,
    `## Differentiated Wedge`,
    blueprint.differentiatedWedge,
    ``,
    `## Primary Workflow`,
    ...blueprint.primaryWorkflow.map((step, index) => `${index + 1}. ${step}`),
    ``,
    `## Key Screens / Surfaces`,
    ...bulletItems(blueprint.keyScreens),
    ``,
    `## Core Data Objects`,
    ...bulletItems(blueprint.coreDataObjects),
    ``,
    `## User Actions`,
    ...bulletItems(blueprint.userActions),
    ``,
    `## System States`,
    `- Empty: ${blueprint.systemStates.empty}`,
    `- Loading: ${blueprint.systemStates.loading}`,
    `- Error: ${blueprint.systemStates.error}`,
    `- No result: ${blueprint.systemStates.noResult}`,
    `- Partial success: ${blueprint.systemStates.partialSuccess}`,
    ``,
    `## MVP Requirements`,
    ...checkItems(blueprint.mvpRequirements),
    ``,
    `## Skip In v1`,
    ...bulletItems(mergedSkipList([...blueprint.explicitNonGoals, ...skipPreferences], notToBuild)),
    ``,
    `## Trust, Privacy, And Safety`,
    ...bulletItems(blueprint.trustPrivacySafety),
    ``,
    `## Differentiation And Risks`,
    ...checkItems(gaps),
    ``,
    `## Success Metrics`,
    ...checkItems(blueprint.successMetrics),
    ``,
    `## Acceptance Criteria`,
    ...checkItems([
      ...blueprint.successMetrics,
      "The chosen repo dependency or reference is documented with license, attribution, and reuse notes.",
      "The main workflow has focused automated tests or a written manual QA path.",
      "The generated handoff is editable Markdown with no hidden state required to continue."
    ]),
    ``,
    `# BUILD_PLAN`,
    ``,
    `## Pre-Build Decision Checklist`,
    ...checkItems(decisionChecklist(result)),
    ``,
    `## First Milestone`,
    profile.firstMilestone,
    ``,
    `## Wow Demo Script`,
    ...wowDemoScript(blueprint, bestRepo),
    ``,
    `## Implementation Phases`,
    ...phaseLines,
    `## Verification Checklist`,
    ...checkItems(verificationChecklist(bestRepo)),
    ``,
    `# REPO_STARTER_NOTES`,
    ``,
    `## Recommended Starting Point`,
    bestRepo && bestNarrative
      ? `${bestRepo.fullName} is a ${recommendedRepoLabel(bestRepo).toLowerCase()}. ${foundationDecision(bestRepo)} ${bestNarrative.overview} Use it for: ${bestNarrative.goodFor} Watch out: ${bestNarrative.notFor}`
      : "No strong starting repo was found yet. Run a narrower search before building.",
    ...(bestRepo ? [``, `## Recommended Repo Decision`, ...checkItems([`Use STARTER_REPO.md as the source of truth for cloning or inspecting ${bestRepo.fullName}.`, "Record setup, license, and architecture evidence in REPO_STARTER_NOTES.md before implementation.", "If the repo is not a fit, inspect the next ranked repo instead of forcing it."])] : []),
    ``,
    `## Architecture Evidence`,
    ...architectureEvidenceLines(bestRepo),
    ``,
    `## Files Likely To Inspect First`,
    ...bulletItems(filesLikelyToInspect(bestRepo, blueprint)),
    ``,
    `## Repo Research Notes`,
    ...(repoLines.length ? repoLines : [`No repo leads were available.`, ``]),
    `## First Inspection Steps`,
    ...(bestRepo ? checkItems(inspectionSteps(bestRepo)) : ["- [ ] Run a narrower repo search and inspect README, activity, docs, and license before choosing a base."]),
    ``,
    `## License And Reuse`,
    bestRepo ? licenseReuseNote(bestRepo) : "No starter repo was selected, so no reuse rights have been confirmed.",
    ``,
    `## Open Questions For The Builder`,
    ...checkItems([
      "Which exact files, APIs, components, or patterns from the starter repo are worth reusing?",
      "What must be built fresh to satisfy the differentiated product promise?",
      "What setup, dependency, license, or maintenance issue could block reuse?",
      "What is the smallest demo that proves the chosen workflow works?"
    ]),
    ``,
    `# ${agentHeading}`,
    ``,
    `## Builder Instructions`,
    targetInstructions(target),
    ``,
    `## Operating Rules`,
    ...checkItems([
      "Start inside the cloned starter repo unless STARTER_REPO.md says no foundation was selected.",
      "Inspect the current repo before editing and summarize what already exists.",
      "Do not copy third-party code until license and attribution are documented.",
      "Implement one phase at a time and update checkboxes as evidence changes.",
      "Keep unrelated files and user edits intact.",
      "Stop and record blockers when verification fails instead of hiding them."
    ]),
    ``,
    ...(builderRulePackLines.length
      ? [
          `## Builder Rule Packs`,
          ...builderRulePackLines,
          ``
        ]
      : []),
    `## Prompt To Start`,
    `You are building the product described in Original Idea, not ForkFirst itself. The user may have pasted or uploaded this single ForkFirst Builder Handoff. Treat it as the source of truth. Start by cloning or opening the selected starter repo in STARTER_REPO.md, then split this packet into STARTER_REPO.md, PRD.md, BUILD_PLAN.md, REPO_STARTER_NOTES.md, and ${agentFile} in that repo without asking the user to do manual setup. Inspect the repo before edits, summarize architecture and setup evidence, then adapt the existing foundation toward the PRD, brand, and MVP workflow. Implement Phase 0 and Phase 1, then build the first milestone only. Keep the checklist current, document reuse decisions, preserve unrelated work, and run the verification commands before expanding scope.`
  ].join("\n");
}
