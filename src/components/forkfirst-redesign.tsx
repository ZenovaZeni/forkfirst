"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode, type TouchEvent } from "react";
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  GitFork,
  Mic,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings as SettingsIcon,
  Star,
  Sun,
  X
} from "lucide-react";
import { KeySettings, type UserKeys } from "@/components/key-settings";
import { PromptPacksPanel } from "@/components/prompt-packs-panel";
import { SavedRepoModal } from "@/components/saved-repo-modal";
import { TestimonialsColumn, type TestimonialItem } from "@/components/ui/testimonials-columns-1";
import { buildRepoNarrative } from "@/lib/analysis/human-answer";
import { buildSearchRecovery } from "@/lib/analysis/search-recovery";
import type { ClassifiedRepo } from "@/lib/analysis/types";
import { buildProjectBuildPack, type BuildPackPreferences, type BuildTarget } from "@/lib/build-pack/generator";
import { decodeHandoff } from "@/lib/handoff/share-url";
import { getSavedKeyState, type KeyVerificationState } from "@/lib/keys/key-status";
import { buildConversationalRepoFallback } from "@/lib/research-chat/fallback";
import { defaultBoard, repoBoards } from "@/lib/repos/boards";
import {
  buildIdeaCheckRequestBody,
  buildKeyVerificationRequestBody,
  buildResearchChatRequestBody,
  clearFeatureStorage,
  DEFAULT_REDESIGN_USER_KEYS,
  LEGACY_REDESIGN_STORAGE_KEYS,
  readFeatureStorage,
  readJsonValue,
  REDESIGN_STORAGE_KEYS,
  type RedesignAccent,
  type SavedBuildPack,
  type SavedBuildPackVersion,
  type SavedBuildPackWorkspaceSnapshot,
  writeFeatureStorage
} from "@/lib/redesign/feature-model";
import { applyPromptPackRecommendations, recommendPromptPacks, type PromptPackRecommendation } from "@/lib/prompt-packs/recommendations";
import { enabledPackMarkdown, type PromptPackState } from "@/lib/prompt-packs/storage";
import {
  getDeferredInstallPrompt,
  INSTALL_EVENT_NAME,
  isIOSDevice,
  isStandalonePwa,
  requestPwaInstall,
  restoreInstallPrompt
} from "@/lib/pwa-install";
import { TRENDING_CATEGORIES, type TrendingCategory } from "@/lib/trending/categories";
import { createUsageEntry, formatEstimatedCost, summarizeUsage, type UsageEntry } from "@/lib/usage/costs";
import { estimateHandoffTokens, formatTokensShort, loadSavings, logHandoffGenerated, type SavingsLog } from "@/lib/usage/savings";
import {
  browserVoiceInputCopy,
  getBrowserSpeechRecognition,
  mergeSpeechTranscript,
  type BrowserSpeechRecognitionConstructor,
  type SpeechRecognitionLike
} from "@/lib/voice-input";
import type { TrendingRepo } from "@/app/api/trending/route";
import type { IdeaCheckResult } from "@/types/idea-check";
import type { ResearchChat } from "@/types/research-chat";
import type { ChatIntent, ChatUiAction } from "@/lib/research-chat/types";
import { trackForkFirstEvent } from "@/lib/analytics/events";

type Screen = "landing" | "app" | "loading" | "results" | "more" | "branding" | "generating" | "ready" | "handoff" | "library" | "settings" | "trending" | "packs";
type GoOptions = { scroll?: "top" | "preserve" };
type Theme = "light" | "dark";
type ChatTurn = { role: "user" | "assistant"; content: string; ui?: ChatUiAction[]; result?: IdeaCheckResult; intent?: ChatIntent };
type SettingsTab = "appearance" | "keys" | "usage" | "install";
const THEME_STORAGE_KEY = "forkfirst:theme";
const LEGACY_THEME_STORAGE_KEY = "open-repo:theme";
const ACTIVE_SCREEN_SESSION_KEY = "forkfirst:active-screen";
const ACTIVE_CHAT_SESSION_KEY = "forkfirst:active-chat";
const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL ?? "https://github.com/ZenovaZeni/forkfirst#support-forkfirst";

const SCREENS: Screen[] = ["landing", "app", "loading", "results", "more", "branding", "generating", "ready", "handoff", "library", "settings", "trending", "packs"];

const LANDING_TESTIMONIALS: TestimonialItem[] = [
  {
    text: "This made the starting point obvious. ForkFirst helped me find a working foundation instead of asking AI to build everything from scratch. I still made the app my own, but I started with something real instead of a blank screen.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80",
    name: "Marcus Reed",
    role: "Indie Builder"
  },
  {
    text: "Saved me hours of repo hunting. I usually waste a ton of time searching GitHub, comparing repos, and figuring out what's usable. ForkFirst narrowed it down and gave me a clean handoff I could actually use in Cursor.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
    name: "Talia Morgan",
    role: "No-Code Founder"
  },
  {
    text: "It helped me think like a builder, not just a prompter. The biggest win wasn't just finding a repo. It helped me understand what parts of the foundation I could keep, what to remove, and how to refocus it into my own product.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&h=96&q=80",
    name: "Derrick Lane",
    role: "AI Automation Consultant"
  },
  {
    text: "Perfect for AI-assisted app builds. ForkFirst gave me a better way to start. Instead of generating auth, dashboards, and basic app structure from zero, I found a foundation and used AI to redesign and customize it.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&h=96&q=80",
    name: "Sofia Bennett",
    role: "Product Designer"
  },
  {
    text: "This is exactly how people should be building with AI. AI builders are powerful, but starting from a blank prompt can get messy fast. ForkFirst gives you a stronger foundation before you ever open Claude Code or Cursor.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=96&h=96&q=80",
    name: "Evan Brooks",
    role: "Full-Stack Developer"
  },
  {
    text: "It turned open source into a launch shortcut. I found a project that already had several pieces I needed, then used the handoff to rebrand, redesign, and shape it into something new. That workflow just makes sense.",
    image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?auto=format&fit=crop&w=96&h=96&q=80",
    name: "Nina Patel",
    role: "SaaS Builder"
  },
  {
    text: "Great for validating app ideas faster. ForkFirst helped me see what already exists before committing to a build. That alone saved me from overbuilding and gave me a clearer path for my MVP.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80",
    name: "Caleb Wright",
    role: "Startup Founder"
  },
  {
    text: "The handoff is the underrated part. Finding repos is helpful, but the real value is the builder-ready handoff. It gave me a much cleaner starting prompt for what to keep, change, remove, and improve.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&h=96&q=80",
    name: "Amara Collins",
    role: "AI Tools Creator"
  },
  {
    text: "It makes GitHub less overwhelming. I'm not a senior developer, so open-source repos can feel intimidating. ForkFirst made it easier to understand which foundation actually matched my app idea.",
    image: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=96&h=96&q=80",
    name: "Jordan Miles",
    role: "Solo Founder"
  },
  {
    text: "A smarter way to fork first and build second. ForkFirst helped me avoid rebuilding common features from scratch. I could start with a working base, then focus my energy on the actual product idea.",
    image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=96&h=96&q=80",
    name: "Leo Hartman",
    role: "Indie Hacker"
  }
];

const LANDING_FOUNDATION_TYPES = [
  {
    title: "SaaS Dashboard",
    body: "Find foundations with auth, billing, settings, dashboard layouts, and admin basics.",
    prompt: "I want to build a SaaS dashboard. Find open-source foundations with auth, settings, dashboard layouts, billing or subscription structure, and clean UI patterns that an AI builder can customize."
  },
  {
    title: "Client Portal",
    body: "Find foundations with login, file sharing, user dashboards, messages, and admin controls.",
    prompt: "I want to build a client portal. Find open-source foundations with login, file sharing, user dashboards, messaging or notifications, admin controls, and a structure an AI builder can customize."
  },
  {
    title: "AI Tool",
    body: "Find foundations with chat UI, API routes, prompt flows, usage handling, and settings.",
    prompt: "I want to build an AI tool. Find open-source foundations with chat UI, API routes, prompt flows, usage tracking or key settings, and clean app structure that an AI builder can customize."
  },
  {
    title: "Directory",
    body: "Find foundations with listings, filters, search, profiles, and submission flows.",
    prompt: "I want to build a directory app. Find open-source foundations with listings, filters, search, profiles, submissions, admin review, and a clean layout an AI builder can customize."
  },
  {
    title: "Booking App",
    body: "Find foundations with calendars, forms, scheduling, confirmations, and user flows.",
    prompt: "I want to build a booking app. Find open-source foundations with calendars, scheduling, forms, confirmation flows, availability logic, and user/admin views an AI builder can customize."
  },
  {
    title: "Marketplace",
    body: "Find foundations with users, listings, payments, buyer/seller flows, and admin views.",
    prompt: "I want to build a marketplace. Find open-source foundations with users, listings, buyer and seller flows, payments or checkout patterns, admin tools, and a structure an AI builder can customize."
  }
] as const;

function isScreen(value: unknown): value is Screen {
  return typeof value === "string" && SCREENS.includes(value as Screen);
}

type RestorableChatScreen = Exclude<NonNullable<ResearchChat["workspace"]>["screen"], undefined>;
const RESTORABLE_CHAT_SCREENS: RestorableChatScreen[] = ["results", "more", "branding", "ready"];

function isRestorableChatScreen(value: unknown): value is RestorableChatScreen {
  return typeof value === "string" && RESTORABLE_CHAT_SCREENS.includes(value as RestorableChatScreen);
}

function themeFromStorage(value: string | null): Theme {
  return value === "ink" || value === "dark" ? "dark" : "light";
}

function themeToStorage(value: Theme) {
  return value === "dark" ? "ink" : "paper";
}

function initialTheme() {
  if (typeof window === "undefined") return "light";
  return themeFromStorage(window.localStorage.getItem(THEME_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY));
}

function initialAccent(): RedesignAccent {
  if (typeof window === "undefined") return "cobalt";
  const stored =
    readJsonValue<string | null>(window.localStorage, REDESIGN_STORAGE_KEYS.accent, null) ??
    readJsonValue<string | null>(window.localStorage, LEGACY_REDESIGN_STORAGE_KEYS.accent, null);
  return ACCENT_OPTIONS.some((item) => item.id === stored) ? stored as RedesignAccent : "cobalt";
}

function applyDocumentVisualPrefs(theme: Theme, accent: RedesignAccent) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-accent", accent);
  document.documentElement.classList.toggle("theme-ink", theme === "dark");
  document.documentElement.classList.toggle("theme-paper", theme !== "dark");
}

const ACCENT_OPTIONS: Array<{ id: RedesignAccent; label: string; color: string }> = [
  { id: "cobalt", label: "Cobalt", color: "#2647F0" },
  { id: "ember", label: "Ember", color: "#D8412F" },
  { id: "forest", label: "Forest", color: "#0F8060" },
  { id: "violet", label: "Violet", color: "#5B3DD8" }
];

const BUILDER_LOGOS = [
  { name: "Claude Code", logo: "/logos/anthropic.svg" },
  { name: "Codex", logo: "/logos/openai.svg" },
  { name: "Cursor", logo: "/logos/cursor.svg" },
  { name: "Replit", logo: "/logos/replit.svg" },
  { name: "Lovable", logo: "/logos/lovable.svg" },
  { name: "v0", logo: "/logos/v0.svg" },
  { name: "Gemini CLI", logo: "/logos/gemini.svg" },
  { name: "Antigravity", logo: "/logos/antigravity.svg" }
];

type BrandAnswers = {
  name: string;
  audience: string;
  productGoal: string;
  firstMilestone: string;
  keepFromRepo: string;
  replaceFromRepo: string;
  addToRepo: string;
  designNotes: string;
  vibe: string;
  color: string;
  notList: string[];
};

const DEFAULT_BRAND_ANSWERS: BrandAnswers = {
  name: "",
  audience: "",
  productGoal: "",
  firstMilestone: "",
  keepFromRepo: "",
  replaceFromRepo: "",
  addToRepo: "",
  designNotes: "",
  vibe: "calm",
  color: "#2647F0",
  notList: []
};

function normalizeBrandAnswers(brand: Partial<BrandAnswers> | null | undefined): BrandAnswers | null {
  if (!brand) return null;
  return {
    ...DEFAULT_BRAND_ANSWERS,
    ...brand,
    notList: Array.isArray(brand.notList) ? brand.notList : DEFAULT_BRAND_ANSWERS.notList
  };
}

function buildPackPreferences(brand: BrandAnswers | null, followUps: ChatTurn[] = []): BuildPackPreferences | undefined {
  const chatContext = followUps
    .slice(-6)
    .map((turn) => `${turn.role}: ${turn.content}`)
    .join("\n")
    .trim();
  if (!brand && !chatContext) return undefined;
  return {
    productName: brand?.name,
    audience: brand?.audience,
    productGoal: brand?.productGoal,
    firstMilestone: brand?.firstMilestone,
    keepFromRepo: brand?.keepFromRepo,
    replaceFromRepo: brand?.replaceFromRepo,
    addToRepo: brand?.addToRepo,
    vibe: brand?.vibe,
    accentColor: brand?.color,
    designNotes: brand?.designNotes,
    skipInV1: brand?.notList,
    chatContext: chatContext || undefined
  };
}

const DEFAULT_PROMPT = "";
const IDEA_PLACEHOLDER = "What are you about to build? Say it like you'd say it to a friend.";
const LEGACY_EXAMPLE_PROMPTS = new Set([
  "A local-first app that checks whether my product idea already exists on GitHub and finds the best repo to fork or study."
]);

function isLegacyExamplePrompt(value: string) {
  return LEGACY_EXAMPLE_PROMPTS.has(value.trim());
}

const HANDOFF_DOC_TABS = ["STARTER_REPO.md", "PRD.md", "BUILD_PLAN.md", "REPO_STARTER_NOTES.md", "AGENTS.md", "CLAUDE.md"] as const;
type HandoffDocTab = (typeof HANDOFF_DOC_TABS)[number];
type HandoffDocuments = Record<HandoffDocTab, string>;

const HANDOFF_DOC_TAB_LABELS: Record<HandoffDocTab, string> = {
  "STARTER_REPO.md": "STARTER.md",
  "PRD.md": "PRD.md",
  "BUILD_PLAN.md": "PLAN.md",
  "REPO_STARTER_NOTES.md": "REPO_NOTES.md",
  "AGENTS.md": "AGENTS.md",
  "CLAUDE.md": "CLAUDE.md"
};

const BUILD_TARGETS: Array<{ id: BuildTarget; label: string; sub: string; logo?: string }> = [
  { id: "claude-code", label: "Claude Code", sub: "CLAUDE.md + AGENTS.md", logo: "/logos/anthropic.svg" },
  { id: "codex", label: "Codex", sub: "AGENTS.md", logo: "/logos/openai.svg" },
  { id: "cursor", label: "Cursor", sub: "rules + docs", logo: "/logos/cursor.svg" },
  { id: "replit", label: "Replit", sub: "workspace import", logo: "/logos/replit.svg" },
  { id: "lovable", label: "Lovable", sub: "screens + flows", logo: "/logos/lovable.svg" },
  { id: "v0", label: "v0", sub: "UI generation", logo: "/logos/v0.svg" },
  { id: "gemini-cli", label: "Gemini CLI", sub: "repo-aware CLI", logo: "/logos/gemini.svg" },
  { id: "antigravity", label: "Antigravity", sub: "agent workspace", logo: "/logos/antigravity.svg" },
  { id: "generic", label: "Any builder", sub: "Markdown pack" }
];

const READY_FILE_DEFS: Array<{ kind: string; file: HandoffDocTab }> = [
  { kind: "STR", file: "STARTER_REPO.md" },
  { kind: "PRD", file: "PRD.md" },
  { kind: "AGT", file: "AGENTS.md" },
  { kind: "PLN", file: "BUILD_PLAN.md" },
  { kind: "CLD", file: "CLAUDE.md" },
  { kind: "RPO", file: "REPO_STARTER_NOTES.md" }
];

function BuilderLogo({ target, className = "" }: { target: (typeof BUILD_TARGETS)[number]; className?: string }) {
  if (!target.logo) {
    return <span className={`builder-logo fallback ${className}`.trim()}>{target.label.slice(0, 2).toUpperCase()}</span>;
  }
  return (
    <span className={`builder-logo ${className}`.trim()}>
      <Image src={target.logo} alt="" width={18} height={18} />
    </span>
  );
}

function markdownSection(markdown: string, heading: string) {
  const headings = Array.from(markdown.matchAll(/^# (STARTER_REPO|PRD|BUILD_PLAN|REPO_STARTER_NOTES|AGENTS|CLAUDE|AI_BUILDER_NOTES)\s*$/gm));
  const start = headings.find((match) => match[0].trim() === `# ${heading}`);
  if (!start || start.index === undefined) return "";
  const next = headings.find((match) => (match.index ?? 0) > start.index);
  return markdown.slice(start.index, next?.index).trim();
}

function handoffIntro(markdown: string) {
  const firstSection = markdown.search(/^# STARTER_REPO\s*$/m);
  return firstSection >= 0 ? markdown.slice(0, firstSection).trim() : "# ForkFirst Builder Handoff";
}

function createFallbackAgentDoc(markdown: string, file: "AGENTS.md" | "CLAUDE.md") {
  const heading = file.replace(".md", "");
  const reader = file === "AGENTS.md" ? "Codex or another repo-aware coding agent" : "Claude Code";
  const companion = file === "AGENTS.md" ? "CLAUDE.md" : "AGENTS.md";
  return [
    `# ${heading}`,
    "",
    `Use this file as the entrypoint for ${reader}. Read STARTER_REPO.md, PRD.md, BUILD_PLAN.md, REPO_STARTER_NOTES.md, and ${companion} before editing.`,
    "",
    "## Shared Builder Rules",
    "- Start by cloning or opening the repo named in STARTER_REPO.md.",
    "- Inspect README, setup scripts, app entrypoints, tests, license, and environment handling before editing.",
    "- Build the product described in PRD.md, not ForkFirst itself.",
    "- Keep the starter repo working while replacing domain-specific copy, sample data, and product behavior.",
    "- Update BUILD_PLAN.md and REPO_STARTER_NOTES.md as evidence changes.",
    "- Run the verification checklist before claiming the work is done."
  ].join("\n").trim();
}

function createHandoffDocuments(markdown: string): HandoffDocuments {
  return {
    "STARTER_REPO.md": markdownSection(markdown, "STARTER_REPO") || "# STARTER_REPO\n\nRun an idea check first.",
    "PRD.md": markdownSection(markdown, "PRD") || "# PRD\n\nRun an idea check first.",
    "BUILD_PLAN.md": markdownSection(markdown, "BUILD_PLAN") || "# BUILD_PLAN\n\nRun an idea check first.",
    "REPO_STARTER_NOTES.md": markdownSection(markdown, "REPO_STARTER_NOTES") || "# REPO_STARTER_NOTES\n\nRun an idea check first.",
    "AGENTS.md": markdownSection(markdown, "AGENTS") || createFallbackAgentDoc(markdown, "AGENTS.md"),
    "CLAUDE.md": markdownSection(markdown, "CLAUDE") || createFallbackAgentDoc(markdown, "CLAUDE.md")
  };
}

function composeHandoffMarkdown(intro: string, docs: HandoffDocuments) {
  return [intro, docs["STARTER_REPO.md"], docs["PRD.md"], docs["BUILD_PLAN.md"], docs["REPO_STARTER_NOTES.md"], docs["AGENTS.md"], docs["CLAUDE.md"]]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function buildPackTitle(result: IdeaCheckResult | null, brand: BrandAnswers | null, pack?: SavedBuildPack | null) {
  if (brand?.name) return brand.name;
  if (pack?.title) return pack.title;
  return result ? titleFromPrompt(result.prompt) : "Untitled Build Pack";
}

function buildPackId(result: IdeaCheckResult | null, pack?: SavedBuildPack | null) {
  if (pack?.id) return pack.id;
  return result ? `pack-${result.id}` : `pack-${Date.now()}`;
}

function isMeaningfulBuildPack(pack: SavedBuildPack) {
  const hasWorkspace = !!pack.workspace?.result;
  const hasIdea = pack.idea.trim().length > 0;
  const hasStarter = pack.starterRepo !== "No starter selected";
  const hasRealMarkdown = pack.markdown.trim().length > 120 && !/Run an idea check first/i.test(pack.markdown);
  return hasRealMarkdown && (hasWorkspace || hasIdea || hasStarter);
}

function buildPackWorkspaceSnapshot({
  result,
  brand,
  selectedStarterRepo,
  followUps,
  promptPackState,
  prompt,
  activeChatId
}: {
  result: IdeaCheckResult | null;
  brand: BrandAnswers | null;
  selectedStarterRepo: ClassifiedRepo | null;
  followUps: ChatTurn[];
  promptPackState: PromptPackState;
  prompt: string;
  activeChatId: string | null;
}): SavedBuildPackWorkspaceSnapshot {
  return {
    result,
    brand,
    selectedStarterRepo,
    followUps,
    promptPackState,
    prompt,
    activeChatId
  };
}

function makeBuildPackVersion(pack: SavedBuildPack, label: string): SavedBuildPackVersion {
  return {
    id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    markdown: pack.markdown,
    tokenEstimate: pack.tokenEstimate,
    qualityScore: pack.qualityScore,
    createdAt: new Date().toISOString()
  };
}

function withBuildPackVersion(pack: SavedBuildPack, label: string): SavedBuildPack {
  const version = makeBuildPackVersion(pack, label);
  const existing = pack.versions ?? [];
  return {
    ...pack,
    versions: [version, ...existing].slice(0, 12)
  };
}

function qualityItems({
  result,
  brand,
  starterRepo,
  followUps,
  promptPackState,
  docs
}: {
  result: IdeaCheckResult | null;
  brand: BrandAnswers | null;
  starterRepo: ClassifiedRepo | null;
  followUps: ChatTurn[];
  promptPackState: PromptPackState;
  docs: HandoffDocuments;
}) {
  return [
    { label: "Starter repo selected", done: !!starterRepo || !!result?.repos[0] },
    { label: "Product direction captured", done: !!brand?.name && !!brand?.audience },
    { label: "Brand and UX notes included", done: !!brand?.vibe || !!brand?.color },
    { label: "Follow-up context captured", done: followUps.length > 0 },
    { label: "Prompt packs selected", done: promptPackState.enabledIds.length > 0 },
    { label: "Build plan has milestones", done: /milestone|phase|acceptance|checklist/i.test(docs["BUILD_PLAN.md"]) },
    { label: "Repo notes include reuse risks", done: /license|risk|watch|inspect|avoid/i.test(docs["REPO_STARTER_NOTES.md"]) },
    { label: "Agent rules included", done: docs["AGENTS.md"].trim().length > 120 && docs["CLAUDE.md"].trim().length > 120 }
  ];
}

function qualityScore(items: Array<{ done: boolean }>) {
  return Math.round((items.filter((item) => item.done).length / Math.max(1, items.length)) * 100);
}

function buildPackTargetLabel(pack: SavedBuildPack) {
  return BUILD_TARGETS.find((item) => item.id === pack.target)?.label ?? pack.target;
}

function buildPackDocCount(pack: SavedBuildPack) {
  const docs = createHandoffDocuments(pack.markdown);
  return HANDOFF_DOC_TABS.filter((file) => docs[file]?.trim()).length;
}

function buildPackUpdatedLabel(pack: SavedBuildPack) {
  return relativeChatTime(pack.updatedAt || pack.createdAt);
}

function formatByteSize(value: string) {
  const bytes = new Blob([value]).size;
  return bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}K`;
}

function parseGitHubRepoInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const withoutHost = withoutProtocol.replace(/^github\.com\//i, "");
  const match = withoutHost.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:[/?#].*)?$/);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

function titleFromPrompt(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Untitled idea check";
  const title = cleaned.length > 42 ? `${cleaned.slice(0, 39)}...` : cleaned;
  return capitalizeFirstTitle(title);
}

function capitalizeFirstTitle(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
}

function displayChatTitle(value: string) {
  const acronymMap: Record<string, string> = {
    ai: "AI",
    api: "API",
    byok: "BYOK",
    github: "GitHub",
    llm: "LLM",
    mcp: "MCP",
    pwa: "PWA",
    repo: "Repo",
    repos: "Repos",
    ui: "UI",
    ux: "UX",
    url: "URL"
  };
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      const parts = word.match(/^([^A-Za-z0-9]*)([A-Za-z0-9][A-Za-z0-9'-]*)([^A-Za-z0-9]*)$/);
      if (!parts) return word;
      const [, prefix, core, suffix] = parts;
      const lower = core.toLowerCase();
      const formatted = acronymMap[lower] ?? `${core.charAt(0).toUpperCase()}${core.slice(1).toLowerCase()}`;
      return `${prefix}${formatted}${suffix}`;
    })
    .join(" ");
}

function relativeChatTime(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "";
  const diff = Date.now() - time;
  if (diff < 60_000) return "now";
  if (diff < 60 * 60_000) return `${Math.max(1, Math.floor(diff / 60_000))}m`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h`;
  if (diff < 48 * 60 * 60_000) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function messageId(prefix: string) {
  return `${prefix}:${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}:${Math.random().toString(36).slice(2)}`}`;
}

function renderChatInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={`${part}-${index}`}>{part.slice(1, -1)}</code>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function cleanChatLine(line: string) {
  return line.replace(/^#{1,4}\s+/, "").trim();
}

function FormattedChatMessage({ content }: { content: string }) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return null;

  return (
    <div className="chat-answer">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const first = lines[0] ?? "";
        const headingMatch = first.match(/^#{2,4}\s+(.+)$/);
        const contentLines = headingMatch ? lines.slice(1) : lines;
        const bulletLines = contentLines.filter((line) => /^[-*]\s+/.test(line));
        const numberedLines = contentLines.filter((line) => /^\d+[.)]\s+/.test(line));

        if (headingMatch) {
          return (
            <section className="chat-answer-section" key={`${blockIndex}-${first}`}>
              <h4>{cleanChatLine(first)}</h4>
              {bulletLines.length === contentLines.length && bulletLines.length > 0 ? (
                <ul>
                  {bulletLines.map((line, index) => <li key={`${line}-${index}`}>{renderChatInline(line.replace(/^[-*]\s+/, ""))}</li>)}
                </ul>
              ) : numberedLines.length === contentLines.length && numberedLines.length > 0 ? (
                <ol>
                  {numberedLines.map((line, index) => <li key={`${line}-${index}`}>{renderChatInline(line.replace(/^\d+[.)]\s+/, ""))}</li>)}
                </ol>
              ) : contentLines.length ? (
                contentLines.map((line, index) => <p key={`${line}-${index}`}>{renderChatInline(cleanChatLine(line))}</p>)
              ) : null}
            </section>
          );
        }

        if (bulletLines.length === lines.length && bulletLines.length > 0) {
          return (
            <ul key={`${blockIndex}-bullets`}>
              {bulletLines.map((line, index) => <li key={`${line}-${index}`}>{renderChatInline(line.replace(/^[-*]\s+/, ""))}</li>)}
            </ul>
          );
        }

        if (numberedLines.length === lines.length && numberedLines.length > 0) {
          return (
            <ol key={`${blockIndex}-numbered`}>
              {numberedLines.map((line, index) => <li key={`${line}-${index}`}>{renderChatInline(line.replace(/^\d+[.)]\s+/, ""))}</li>)}
            </ol>
          );
        }

        return <p key={`${blockIndex}-${first}`}>{renderChatInline(lines.map(cleanChatLine).join(" "))}</p>;
      })}
    </div>
  );
}

function formatChatFallback(title: string, sections: Array<{ heading: string; items: string[] }>, next?: string, intro?: string) {
  const body = sections
    .filter((section) => section.items.some((item) => item.trim().length > 0))
    .map((section) => {
      const items = section.items.map((item) => item.trim()).filter(Boolean).map((item) => `- ${item}`).join("\n");
      return `### ${section.heading}\n${items}`;
    })
    .join("\n\n");
  return [`## ${title}`, intro, body, next ? `### Best next move\n- ${next}` : null].filter(Boolean).join("\n\n");
}

const ADD_ON_INTENT_RE = /\b(anything else|what else|recommend|suggest|add on|add-on|add to|could i add|should i add|features?|differentiator|next feature)\b/;

function clientChatFallbackReply(message: string, result: IdeaCheckResult, messages: Array<{ role: "user" | "assistant"; content: string }> = []) {
  const repos = result.repos.slice(0, 3);
  if (repos.length === 0) {
    return formatChatFallback("I need a repo report first", [
      { heading: "What I can do after lookup", items: ["Compare repo options.", "Pick a starter foundation.", "Outline a repo-backed MVP.", "Create the AI-builder handoff."] }
    ], "Run a GitHub lookup, then keep chatting here.");
  }

  const lower = message.toLowerCase();
  const repoNames = repos.map((repo) => repo.fullName).join(", ");
  const best = repos[0];
  const projectSites = repos
    .map((repo) => ({ name: repo.fullName, url: safeExternalUrl(repo.homepage) }))
    .filter((item): item is { name: string; url: string } => Boolean(item.url));

  if (lower.includes("opportunity gap")) {
    return formatChatFallback("The real opportunity gap", [
      { heading: "What the repos prove", items: [`There is real prior work here: ${repoNames}. That means you should build from evidence, not a blank page.`] },
      { heading: "Where the gap usually is", items: ["The starter code can save time, but the product still needs a sharper user, workflow, onboarding, brand, and first milestone."] },
      { heading: "What to build", items: ["A small version for one clear user.", "One must-have workflow.", "A branded experience around the repo foundation.", "A Build Pack that tells the AI builder exactly what to clone, keep, replace, and build first."] }
    ], `Inspect ${best.fullName}, then use it as the foundation only if setup, license, and architecture make sense.`);
  }

  if (/\b(advice|feedback|critique|review this|what do you think|does this sound|is this good|look what|what i wrote|what it said|what they said|how should i respond|how would you respond)\b/.test(lower)) {
    const exactTextHint = /\b(look what|what i wrote|what it said|what they said|review this|critique)\b/.test(lower);
    return formatChatFallback("Yes - here is my read", [
      {
        heading: "My advice",
        items: [
          "Use the repo as leverage, not as the whole answer. The point is to save build time and give the AI builder a real foundation.",
          `${best.fullName} is the strongest current lead, but inspect setup, license, docs, and recent activity before building on it.`,
          "The best version of this flow should help you decide what to keep, replace, and ignore."
        ]
      },
      {
        heading: exactTextHint ? "About the wording you mentioned" : "How I would think about it",
        items: exactTextHint
          ? [
            "Paste the exact text you want me to react to and I will critique the tone, clarity, and next move directly.",
            "If it came from another AI or a user, keep the parts that sharpen the first build and ignore anything that adds vague scope."
          ]
          : [
            "Ask whether the repo solves the hard part or only gives inspiration.",
            "Decide the one user outcome the first prototype has to prove.",
            "Then make the handoff tell your AI builder exactly what to clone, keep, replace, and build first."
          ]
      },
      { heading: "Project sites found", items: projectSites.length ? projectSites.map((site) => `${site.name}: ${site.url}`) : ["No project website links are in the current top repo metadata."] }
    ], "If you want my most practical next step: inspect the best repo, decide what it saves you, then create the AI-builder handoff.", "Yeah. I would treat this like a normal product conversation first, then use the repo report as the evidence underneath it.");
  }

  if (lower.includes("compare") || lower.includes("why these") || lower.includes("which")) {
    return formatChatFallback("Here is the plain-English repo comparison", repos.map((repo, index) => ({
      heading: `${index + 1}. ${repo.fullName}`,
      items: [
        `What it is: ${repo.summary || repo.description || "A GitHub lead from the current search."}`,
        `Why it showed up: ${repo.score.reasons.slice(0, 2).join("; ") || "It matched the idea and repo signals."}`,
        `Fit: ${repo.score.total}%`,
        `Watch out: Confirm setup, license, docs, and recent issues before building on it.`
      ]
    })), `If one looks close, choose it as the foundation and then tell ForkFirst what you want to build from it.`);
  }

  if (ADD_ON_INTENT_RE.test(lower)) {
    const priorAddOnCount = messages.filter((turn) => turn.role === "user" && ADD_ON_INTENT_RE.test(turn.content.toLowerCase())).length;
    return buildConversationalRepoFallback(message, repos, {
      idea: result.prompt,
      repeated: priorAddOnCount > 0
    });
  }

  if (lower.includes("build") || lower.includes("mvp") || lower.includes("handoff")) {
    return formatChatFallback("How I would turn this into a first build", [
      { heading: "Start with", items: [`Use ${best.fullName} as the main foundation candidate, not as the whole finished product.`] },
      { heading: "Keep small", items: ["One target user.", "One core workflow.", "One saved output or next action.", "A clear brand direction.", "A short first build phase."] },
      { heading: "Tell the AI builder", items: ["Clone/open the selected repo.", "Inspect README, setup, license, and app entry points.", "Create the Build Pack files in the repo root.", "Build Phase 1 only before expanding scope."] }
    ], "Create the AI-builder handoff and answer a few product details so the packet becomes specific.");
  }

  return buildConversationalRepoFallback(message, repos, { idea: result.prompt });
}

type TrendingApiState =
  | { status: "loading"; repos: TrendingRepo[] }
  | { status: "ok"; repos: TrendingRepo[] }
  | { status: "error"; repos: TrendingRepo[] };

type FoundationDraft = {
  fullName: string;
  htmlUrl?: string;
  description?: string | null;
  stars?: number;
  language?: string | null;
  license?: string | null;
};

function formatStars(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function GitHubStarIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      className="github-star-icon"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.969.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.979a.75.75 0 0 1-1.088-.79l.72-4.193L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}

function foundationFromTrendingRepo(repo: TrendingRepo): FoundationDraft {
  return {
    fullName: repo.fullName,
    htmlUrl: repo.htmlUrl,
    description: repo.description,
    stars: repo.stars,
    language: repo.language,
    license: repo.license
  };
}

function RepoSiteLink({ url, className = "btn ghost" }: { url: string | null | undefined; className?: string }) {
  const safeUrl = safeExternalUrl(url);
  if (!safeUrl) return null;
  return (
    <a className={className} href={safeUrl} target="_blank" rel="noreferrer">
      <ExternalLink size={13} /> Site
    </a>
  );
}

function cloneCommandForRepo(repo: Pick<ClassifiedRepo, "url" | "fullName">) {
  const safeUrl = safeExternalUrl(repo.url);
  return `git clone ${safeUrl ?? `https://github.com/${repo.fullName}`}`;
}

function classifiedFromTrendingRepo(repo: TrendingRepo, category?: TrendingCategory): ClassifiedRepo {
  const [owner = "", name = repo.fullName] = repo.fullName.split("/");
  return {
    id: Math.abs(repo.fullName.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)),
    owner,
    name,
    fullName: repo.fullName,
    url: repo.htmlUrl,
    description: repo.description || trendingRepoWhat(repo),
    language: repo.language,
    topics: repo.topics,
    stars: repo.stars,
    forks: 0,
    openIssues: 0,
    license: repo.license,
    pushedAt: repo.updatedAt,
    createdAt: repo.createdAt,
    updatedAt: repo.updatedAt,
    archived: false,
    homepage: repo.homepage ?? null,
    category: "reference",
    summary: trendingRepoUse(repo, category),
    score: {
      total: 0,
      fit: 0,
      activity: repo.updatedAt ? 65 : 35,
      popularity: Math.min(100, Math.round(Math.log10(Math.max(1, repo.stars)) * 25)),
      license: repo.license ? 70 : 30,
      docs: 40,
      reasons: [
        "Saved from live trending repos.",
        category ? `Category: ${category.label}.` : "Category: trending.",
        "Treat as a research lead until you inspect docs, setup, and license."
      ]
    }
  };
}

function trendingRepoWhat(repo: TrendingRepo) {
  const desc = repo.description?.trim();
  if (desc) return desc.replace(/\s+/g, " ");
  return `${repo.fullName} is a public GitHub repo in this category. GitHub did not provide a description, so inspect it before treating it as a foundation.`;
}

function trendingRepoUse(repo: TrendingRepo, category?: TrendingCategory) {
  const categoryText = category ? ` It appeared under ${category.label}, so treat it as a live lead for ${category.blurb.toLowerCase()}` : "";
  return `${repo.fullName} may be useful as a foundation, reference, or pattern source.${categoryText} Start by checking the README, setup steps, license, and whether its product direction matches what you want to build.`;
}

function trendingRepoWatch(repo: TrendingRepo) {
  const parts = [
    repo.license ? `License is reported as ${repo.license}, but you still need to confirm reuse rights.` : "No license was reported by GitHub, so do not fork until you inspect license terms.",
    repo.updatedAt ? `Last updated ${new Date(repo.updatedAt).toLocaleDateString()}.` : "Recent activity was not available from GitHub.",
    "High stars do not guarantee idea fit, code quality, or that the architecture matches your product."
  ];
  return parts.join(" ");
}

function trendingRepoNext(repo: TrendingRepo) {
  return `If this looks close, click Use. ForkFirst will attach ${repo.fullName} to a new chat and ask what you want to build from it before generating the handoff.`;
}

function foundationFromRepoPath(fullName: string): FoundationDraft {
  return {
    fullName,
    htmlUrl: `https://github.com/${fullName}`
  };
}

function foundationFromClassifiedRepo(repo: ClassifiedRepo): FoundationDraft {
  return {
    fullName: repo.fullName,
    htmlUrl: repo.url,
    description: repo.description || repo.summary,
    stars: repo.stars,
    language: repo.language,
    license: repo.license
  };
}

function buildFoundationIdeaPrompt(foundation: FoundationDraft | null, idea: string) {
  const trimmed = idea.trim();
  if (!foundation) return trimmed;
  const repoNotes = [
    `I want to use ${foundation.fullName} as the repo foundation/context.`,
    foundation.htmlUrl ? `GitHub URL: ${foundation.htmlUrl}.` : null,
    foundation.description ? `Repo description: ${foundation.description}.` : null,
    foundation.language ? `Primary language: ${foundation.language}.` : null,
    foundation.license ? `License reported by GitHub: ${foundation.license}.` : null,
    foundation.stars ? `Stars: ${formatStars(foundation.stars)}.` : null,
    `What I want to build: ${trimmed}`,
    "Please inspect whether this repo is a practical foundation for that product, compare alternatives only when useful, and keep the builder handoff focused on adapting this foundation rather than starting from a blank page."
  ].filter(Boolean);
  return repoNotes.join("\n");
}

function useTrendingRepos(categoryId: TrendingCategory["id"]) {
  const [state, setState] = useState<TrendingApiState>({ status: "loading", repos: [] });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", repos: [] });
    fetch("/api/trending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId })
    })
      .then((response) => response.json())
      .then((data: { repos?: TrendingRepo[] }) => {
        if (cancelled) return;
        setState(Array.isArray(data.repos) ? { status: "ok", repos: data.repos } : { status: "error", repos: [] });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", repos: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  return state;
}

function Logo({ big = false }: { big?: boolean }) {
  return (
    <span
      className={`forkfirst-logo ${big ? "is-big" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" focusable="false">
        <rect width="64" height="64" rx="14" />
        <path d="M14 12 L32 36 L32 54" />
        <path className="forkfirst-logo-accent" d="M50 12 L33 35" />
      </svg>
    </span>
  );
}

function Wordmark() {
  return (
    <span className="brand-name" aria-hidden="true">
      <span>Fork</span>
      <span className="brand-name-accent">First</span>
    </span>
  );
}

function repoCategoryLabel(repo: ClassifiedRepo) {
  if (repo.category === "forkable") return "Best to fork";
  if (repo.category === "reference") return "Worth reading";
  if (repo.category === "already_exists") return "Already exists";
  if (repo.category === "gap") return "Opportunity gap";
  return "Needs caution";
}

function stripRepoContent(value: string | null | undefined) {
  return (value ?? "")
    .replaceAll("<UNTRUSTED_REPO_CONTENT>", "")
    .replaceAll("</UNTRUSTED_REPO_CONTENT>", "")
    .trim();
}

function safeExternalUrl(value: string | null | undefined) {
  const trimmed = stripRepoContent(value);
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function cleanReadmeText(value: string | null | undefined) {
  return stripRepoContent(value)
    .replace(/<img[^>]*>/gi, "")
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/#+\s*/g, "")
    .replace(/[*_`|>]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeScoreOnlySummary(value: string | null | undefined) {
  const text = cleanReadmeText(value).toLowerCase();
  if (!text) return true;
  return /^(weak|partial|strong) idea fit\b/.test(text) ||
    text === "recently active" ||
    text === "has a license" ||
    /^(weak|partial|strong) idea fit\. recently active\. has a license\.?$/.test(text);
}

function repoReadableDescription(repo: ClassifiedRepo) {
  const description = cleanReadmeText(repo.description);
  if (description && !looksLikeScoreOnlySummary(description)) return description;

  const readme = cleanReadmeText(repo.readme?.excerpt);
  if (readme && !looksLikeScoreOnlySummary(readme)) return readme.split(". ").slice(0, 2).join(". ").slice(0, 260);

  return "";
}

function repoSummary(repo: ClassifiedRepo) {
  const description = repoReadableDescription(repo);
  if (description) return description;

  const narrative = buildRepoNarrative(repo);
  if (narrative.kindLabel) return `${narrative.kindLabel}. ${narrative.goodFor}`;

  return "A public GitHub project worth inspecting for this build.";
}

const IDEA_STOPWORDS = new Set([
  "about", "after", "again", "already", "also", "and", "any", "app", "build", "builder", "but", "can", "for", "from", "give",
  "have", "into", "like", "make", "need", "needs", "one", "product", "project", "repo", "simple", "that", "the",
  "their", "this", "tool", "want", "with", "would", "your"
]);

function ideaKeywords(value: string) {
  const seen = new Set<string>();
  return cleanReadmeText(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !IDEA_STOPWORDS.has(word))
    .filter((word) => {
      if (seen.has(word)) return false;
      seen.add(word);
      return true;
    })
    .slice(0, 8);
}

function repoHaystack(repo: ClassifiedRepo) {
  return `${repo.fullName} ${repo.name} ${repo.description} ${repo.topics.join(" ")} ${repo.language ?? ""} ${repo.readme?.excerpt ?? ""}`.toLowerCase();
}

function matchedIdeaTerms(repo: ClassifiedRepo, idea: string) {
  const haystack = repoHaystack(repo);
  return ideaKeywords(idea).filter((term) => haystack.includes(term)).slice(0, 4);
}

function formatTerms(terms: string[]) {
  if (terms.length === 0) return "";
  if (terms.length === 1) return terms[0];
  if (terms.length === 2) return `${terms[0]} and ${terms[1]}`;
  return `${terms.slice(0, -1).join(", ")}, and ${terms[terms.length - 1]}`;
}

function repoSignals(repo: ClassifiedRepo, limit = 2) {
  return repo.score.reasons
    .filter((reason) => !looksLikeScoreOnlySummary(reason))
    .slice(0, limit);
}

function repoIdeaReason(repo: ClassifiedRepo, idea: string) {
  const terms = matchedIdeaTerms(repo, idea);
  const summary = repoSummary(repo);
  const signals = repoSignals(repo, 2);
  const termText = terms.length ? `It matches your idea around ${formatTerms(terms)}` : "It is the closest GitHub lead from this search";
  const signalText = signals.length ? ` The strongest signals are ${signals.join(" and ").toLowerCase()}.` : "";
  return `${termText}, and the repo description gives your builder concrete code to inspect: ${summary}.${signalText}`;
}

function repoPlainEnglish(repo: ClassifiedRepo) {
  return buildRepoNarrative(repo).overview || repoSummary(repo);
}

function repoReadmeBullets(repo: ClassifiedRepo) {
  const readme = repo.readme;
  return [
    readme?.hasSetup ? "Setup instructions were found." : "Setup instructions are not obvious yet.",
    readme?.hasExamples ? "Examples or usage notes were found." : "Examples are not obvious yet.",
    readme?.hasLocalDevelopment ? "Local development notes were found." : "Local development steps may need inspection.",
    repo.license ? `License reported as ${repo.license}; still inspect it before reuse.` : "License is unknown, so inspect before reuse."
  ];
}

function repoWhy(repo: ClassifiedRepo, idea: string) {
  const terms = matchedIdeaTerms(repo, idea);
  const narrative = buildRepoNarrative(repo);
  const base = narrative.why || "It gives your AI builder real code, docs, or product patterns to inspect before starting from scratch.";
  if (!terms.length) return base;
  return `For this idea, the useful overlap is ${formatTerms(terms)}. ${base}`;
}

function repoWhat(repo: ClassifiedRepo) {
  const narrative = buildRepoNarrative(repo);
  const description = repoReadableDescription(repo);
  if (description) return `${narrative.kindLabel}. ${description}`;
  return `${narrative.kindLabel}. ${narrative.goodFor}`;
}

function repoWhyShown(repo: ClassifiedRepo, idea: string) {
  const terms = matchedIdeaTerms(repo, idea);
  const signals = repoSignals(repo, 2);
  const fit =
    repo.score.fit >= 70
      ? "It overlaps strongly with what you asked for."
      : repo.score.fit >= 40
        ? "It overlaps with part of what you asked for."
        : "It is adjacent, so treat it as a research lead instead of a ready-made answer.";
  const termText = terms.length ? ` Matched idea terms: ${formatTerms(terms)}.` : "";
  const signalText = signals.length > 0 ? ` Signals: ${signals.join(", ")}.` : "";
  return `${fit}${termText}${signalText}`;
}

function repoBestUse(repo: ClassifiedRepo, idea: string) {
  const narrative = buildRepoNarrative(repo);
  const terms = matchedIdeaTerms(repo, idea);
  const context = terms.length ? ` for the ${formatTerms(terms)} parts of your idea` : "";
  if (repo.category === "forkable") return `Best use: test whether this can be the starting codebase${context}. ${narrative.goodFor}`;
  if (repo.category === "reference") return `Best use: study the patterns, screens, data model, or architecture${context}. ${narrative.goodFor}`;
  if (repo.category === "already_exists") return `Best use: compare features${context} so you do not rebuild the same thing blindly. ${narrative.goodFor}`;
  if (repo.category === "gap") return `Best use: understand what is missing${context} and what adjacent projects already cover. ${narrative.goodFor}`;
  return `Best use: inspect carefully before relying on it${context}. ${narrative.goodFor}`;
}

function repoWatch(repo: ClassifiedRepo) {
  return buildRepoNarrative(repo).caution || "Confirm license details, maintenance health, and whether the architecture still fits your product.";
}

function repoTagClass(repo: ClassifiedRepo) {
  if (repo.category === "reference") return "ref";
  if (repo.category === "already_exists" || repo.category === "risk") return "warn";
  return "";
}

function isSavedRepo(repo: ClassifiedRepo, savedRepos: ClassifiedRepo[]) {
  return savedRepos.some((saved) => saved.fullName === repo.fullName);
}

function includesSmartSearch(value: string, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return normalized
    .split(/\s+/)
    .every((part) => value.toLowerCase().includes(part));
}

function repoBoardLabel(repo: ClassifiedRepo, savedRepoBoards: Record<string, string>) {
  return savedRepoBoards[repo.fullName] ?? defaultBoard(repo);
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function buildZipBlob(files: Array<{ path: string; content: string }>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const { time, day } = dosDateTime();

  for (const file of files) {
    const nameBytes = encoder.encode(file.path.replace(/^\/+/, ""));
    const contentBytes = encoder.encode(file.content);
    const checksum = crc32(contentBytes);
    const localHeader: number[] = [];

    writeUint32(localHeader, 0x04034b50);
    writeUint16(localHeader, 20);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, time);
    writeUint16(localHeader, day);
    writeUint32(localHeader, checksum);
    writeUint32(localHeader, contentBytes.length);
    writeUint32(localHeader, contentBytes.length);
    writeUint16(localHeader, nameBytes.length);
    writeUint16(localHeader, 0);
    localParts.push(new Uint8Array(localHeader), nameBytes, contentBytes);

    const centralHeader: number[] = [];
    writeUint32(centralHeader, 0x02014b50);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, time);
    writeUint16(centralHeader, day);
    writeUint32(centralHeader, checksum);
    writeUint32(centralHeader, contentBytes.length);
    writeUint32(centralHeader, contentBytes.length);
    writeUint16(centralHeader, nameBytes.length);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint32(centralHeader, 0);
    writeUint32(centralHeader, offset);
    centralParts.push(new Uint8Array(centralHeader), nameBytes);

    offset += localHeader.length + nameBytes.length + contentBytes.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end: number[] = [];
  writeUint32(end, 0x06054b50);
  writeUint16(end, 0);
  writeUint16(end, 0);
  writeUint16(end, files.length);
  writeUint16(end, files.length);
  writeUint32(end, centralSize);
  writeUint32(end, offset);
  writeUint16(end, 0);

  const zipParts: BlobPart[] = [...localParts, ...centralParts, new Uint8Array(end)]
    .map((part) => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer);
  return new Blob(zipParts, { type: "application/zip" });
}

function repoNext(repo: ClassifiedRepo, idea = "") {
  const terms = matchedIdeaTerms(repo, idea);
  const next = buildRepoNarrative(repo).next;
  if (!terms.length) return next;
  return `${next} Focus the first inspection on ${formatTerms(terms)} so the handoff explains exactly what to keep, replace, or ignore.`;
}

function TopNav({ go }: { go: (screen: Screen) => void }) {
  return (
    <header className="top-nav" data-screen-label="00 Landing nav">
      <button className="brand-row brand-home" type="button" onClick={() => go("landing")} aria-label="Go to ForkFirst landing page">
        <Logo />
        <Wordmark />
      </button>
      <nav className="nav-links">
          <a href="#how">How it works</a>
          <a href="#why">Why use it</a>
          <a href="#builders">Builders</a>
          <a href="#trust">Your keys, your data</a>
        </nav>
      <button className="nav-cta" type="button" onClick={() => {
        trackForkFirstEvent("landing_try_free_clicked", { source: "nav" });
        go("app");
      }}>
        Start free <ArrowRight size={14} />
      </button>
    </header>
  );
}

function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-scrim about-scrim" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={onClose}>
      <div className="about-modal" onClick={(event) => event.stopPropagation()}>
        <div className="about-top">
          <div>
            <span className="eyebrow">About ForkFirst</span>
            <h2 id="about-title">Start with a working foundation.</h2>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close about ForkFirst">
            <X size={18} />
          </button>
        </div>
        <p>
          ForkFirst is a free open-source tool by Josh Douglas, powered by Zenova AI. It helps AI builders find a
          working open-source foundation for an app idea, then turn it into a clean handoff for Cursor, Claude Code,
          Codex, Replit, v0, Lovable, Gemini CLI, Antigravity, and other AI builders.
        </p>
        <div className="about-grid">
          <div>
            <strong>What it is</strong>
            <span>A repo-first research and handoff workflow before your AI builder starts coding.</span>
          </div>
          <div>
            <strong>What it is not</strong>
            <span>Not a cloning tool, license scanner, hosted SaaS, or promise that any repo is safe to reuse.</span>
          </div>
        </div>
        <p className="about-note">
          The goal is to rebrand, redesign, refocus, and build your own product faster with real code as context.
        </p>
        <div className="about-actions">
          <a className="btn accent" href="https://github.com/ZenovaZeni/forkfirst" target="_blank" rel="noreferrer">
            GitHub <ExternalLink size={14} />
          </a>
          <a className="btn ghost" href={SUPPORT_URL} target="_blank" rel="noreferrer">
            Support development
          </a>
        </div>
      </div>
    </div>
  );
}

function Landing({ go, onStartWithPrompt }: { go: (screen: Screen) => void; onStartWithPrompt: (prompt: string) => void }) {
  const [showAbout, setShowAbout] = useState(false);

  function startApp(source: string) {
    trackForkFirstEvent("landing_try_free_clicked", { source });
    go("app");
  }

  function startFoundationType(title: string, prompt: string) {
    trackForkFirstEvent("landing_foundation_type_clicked", { title });
    onStartWithPrompt(prompt);
  }
  const packetTabs = [
    {
      kind: "STR",
      title: "Starter repo",
      filename: "STARTER_REPO.md",
      lines: [
        { text: "git clone https://github.com/ganainy/VibeHired-ai jobshelf", tone: "command" },
        { text: "Foundation mode: clone/fork candidate" },
        { text: "Keep: Kanban board, job status model, resume workflow" },
        { text: "First move: inspect setup, license, data model, and app routes", tone: "accent" }
      ]
    },
    {
      kind: "PRD",
      title: "Product brief",
      filename: "PRD.md",
      lines: [
        { text: "Product: JobShelf" },
        { text: "Audience: solo job seekers who want local-first tracking" },
        { text: "Core promise: remember every application without another SaaS account" },
        { text: "MVP: pipeline board, notes, reminders, CSV export", tone: "accent" }
      ]
    },
    {
      kind: "PLN",
      title: "Build plan",
      filename: "BUILD_PLAN.md",
      lines: [
        { text: "Phase 0: run the starter repo and map existing flows" },
        { text: "Phase 1: replace sample data with job application entities" },
        { text: "Phase 2: add reminders, search, export, and empty states" },
        { text: "Verify: lint, typecheck, smoke test, mobile pass", tone: "accent" }
      ]
    },
    {
      kind: "RPO",
      title: "Repo notes",
      filename: "REPO_STARTER_NOTES.md",
      lines: [
        { text: "Reuse: board shell, drag/drop rhythm, local persistence pattern" },
        { text: "Replace: sample copy, colors, onboarding, export flow" },
        { text: "Watch out: confirm license and remove unrelated demo screens" },
        { text: "Decision: good foundation, but product direction must change", tone: "accent" }
      ]
    },
    {
      kind: "AGT",
      title: "Agent rules",
      filename: "AGENTS.md",
      lines: [
        { text: "Read STARTER_REPO.md before editing any code" },
        { text: "Do not rebuild from scratch; preserve working repo patterns" },
        { text: "Ask only if repo setup, license, or data model blocks progress" },
        { text: "Build Phase 1 first, then stop for verification", tone: "accent" }
      ]
    },
    {
      kind: "CLD",
      title: "Claude rules",
      filename: "CLAUDE.md",
      lines: [
        { text: "Open the cloned repo and inspect README/package files first" },
        { text: "Place the handoff files in the repo root if needed" },
        { text: "Keep scope tight: no auth, no billing, no extra frameworks in v1" },
        { text: "Report changed files, checks run, and remaining risks", tone: "accent" }
      ]
    }
  ] as const;
  const [activePacketTab, setActivePacketTab] = useState<(typeof packetTabs)[number]["filename"]>("STARTER_REPO.md");
  const activePacket = packetTabs.find((tab) => tab.filename === activePacketTab) ?? packetTabs[0];

  return (
    <div className="landing" data-screen-label="01 Landing">
      <TopNav go={go} />

      <section className="hero">
        <p className="hero-eyebrow">Chat first. Build from something real.</p>
        <h1>
          Don&apos;t make your <span className="accent-word">AI builder</span>
          <br />
          <span className="muted-word">start from zero.</span>
        </h1>
        <p className="hero-sub">
          Talk through your app idea like you would with ChatGPT. ForkFirst finds real GitHub projects that can become
          your foundation, then creates the repo, prompt, and handoff files your AI builder needs to clone, customize,
          and build your version faster.
        </p>
        <div className="hero-cta-row">
          <button className="btn accent xl" type="button" onClick={() => startApp("hero")}>
            Check my idea <ArrowRight size={18} />
          </button>
          <button
            className="btn ghost lg"
            type="button"
            onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
          >
            See sample handoff
          </button>
          <a
            className="github-star-pill"
            href="https://github.com/ZenovaZeni/forkfirst"
            target="_blank"
            rel="noreferrer"
            onClick={() => trackForkFirstEvent("github_star_clicked", { source: "landing_hero" })}
          >
            <Star size={15} />
            <span>Open Source · Star on GitHub</span>
            <ArrowRight size={14} />
          </a>
        </div>
        <div className="hero-meta">
          <span>Save tokens</span>
          <span>Avoid blank-page builds</span>
          <span>Start from code that already works</span>
        </div>
      </section>

      <div className="hero-stage">
        <div className="hero-mock">
          <div className="hero-mock-bar">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="url">forkfirst.vercel.app / new idea</span>
          </div>
          <div className="hero-mock-body">
            <p className="hero-mock-prompt">
              &quot;I want a simple job tracker for founders applying to 20+ roles.&quot;<span className="cursor" />
            </p>
            <div className="hero-mock-results">
              <div className="hero-mock-result">
                <span className="label">Foundation found / 87%</span>
                <span className="repo-name">ganainy/VibeHired-ai</span>
                <span className="repo-desc">Already has job tracking, Kanban flow, resumes, and useful app structure.</span>
                <span className="fit-bar"><i style={{ width: "87%" }} /></span>
              </div>
              <div className="hero-mock-result">
                <span className="label warn">ForkFirst handoff</span>
                <span className="repo-name">Repo + prompt + build files</span>
                <span className="repo-desc">Clone this foundation, keep the working parts, replace the brand and workflow, then build your version first.</span>
                <span className="fit-bar"><i style={{ width: "71%" }} /></span>
              </div>
              <div className="hero-mock-result">
                <span className="label ref">Ready for your AI builder</span>
                <span className="repo-name">Claude Code · Codex · Cursor · Replit · Lovable · v0</span>
                <span className="repo-desc">Give the packet to the builder you like, then come back to a prototype built from a working foundation.</span>
                <span className="fit-bar"><i style={{ width: "58%" }} /></span>
              </div>
              <div className="hero-mock-result handoff-ready">
                <span className="label">Also works with</span>
                <span className="repo-name">STARTER_REPO.md + PRD + BUILD_PLAN + AGENTS.md</span>
                <span className="repo-desc">Gemini CLI, Antigravity, and other AI builders can use the same clear build packet.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section" id="how">
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2>From <span className="accent-word">rough idea</span> to repo-backed AI build.</h2>
          <p>
            ForkFirst is the step before your AI builder starts coding. It helps you discover what already exists,
            choose a working foundation, and package the instructions your builder needs to customize it.
          </p>
        </div>
        <div className="flow-lineup" aria-label="ForkFirst flow">
          {[
            ["01", "Chat through the idea", "Talk to ForkFirst like ChatGPT so it understands what you want to build."],
            ["02", "Find what already exists", "ForkFirst searches GitHub for real projects most people would never know to search for."],
            ["03", "Pick a working foundation", "See what can become your starting point, what is only a reference, and what to avoid."],
            ["04", "Give your AI direction", "Get the repo, prompt, and files your builder needs to clone, customize, and build your version."]
          ].map(([step, title, body]) => (
            <div key={step} className="flow-step">
              <span>{step}</span>
              <strong>{title}</strong>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section foundation-types-section" id="foundation-types">
        <div className="section-head">
          <span className="eyebrow">Popular foundation types</span>
          <h2>Not sure what to search for? Start with a <span className="accent-word">common build shape.</span></h2>
          <p>
            Pick a familiar app type and ForkFirst will start the chat with a stronger prompt. You can still edit it
            before checking GitHub.
          </p>
        </div>
        <div className="foundation-type-grid" aria-label="Popular foundation types">
          {LANDING_FOUNDATION_TYPES.map((item) => (
            <button
              key={item.title}
              className="foundation-type-card"
              type="button"
              onClick={() => startFoundationType(item.title, item.prompt)}
            >
              <strong>{item.title}</strong>
              <span>{item.body}</span>
              <em>
                Find foundations like this <ArrowRight size={14} />
              </em>
            </button>
          ))}
        </div>
      </section>

      <section className="section" id="why">
        <div className="section-head">
          <span className="eyebrow">Why use it</span>
          <h2>Stop asking your AI builder to <span className="accent-word">guess the starting point.</span></h2>
          <p>
            Blank-page AI builds burn tokens and drift fast. ForkFirst gives your builder a working codebase, a clear
            first move, and instructions for turning someone else&apos;s useful foundation into your product.
          </p>
        </div>
        <div className="token-row">
          <div className="token-cell lead">
            <h3>Less guessing.<br />More shipping.</h3>
            <p>Free tool, built to help your AI customize a working foundation instead of inventing everything.</p>
          </div>
          <div className="token-cell">
            <span className="big accent">Context</span>
            <span className="lbl">Repo, prompt, and build files before your AI starts writing code.</span>
          </div>
          <div className="token-cell">
            <span className="big">60s</span>
            <span className="lbl">From a half-formed idea to a clear first build path.</span>
          </div>
          <div className="token-cell">
            <span className="big">3</span>
            <span className="lbl">Real starting points, ranked. Not 50 links to skim.</span>
          </div>
        </div>
      </section>

      <section className="section testimonials-section" aria-labelledby="testimonials-title">
        <div className="section-head">
          <span className="eyebrow">Builder proof</span>
          <h2 id="testimonials-title">People start faster when they <span className="accent-word">fork first.</span></h2>
          <p>
            Builders use ForkFirst to make GitHub less overwhelming, find useful foundations, and give their AI builder
            clearer instructions before code starts changing.
          </p>
        </div>
        <div className="testimonials-columns" aria-label="ForkFirst testimonials">
          <TestimonialsColumn testimonials={LANDING_TESTIMONIALS.slice(0, 4)} duration={24} />
          <TestimonialsColumn testimonials={LANDING_TESTIMONIALS.slice(4, 7)} className="testimonials-column-mid" duration={29} />
          <TestimonialsColumn testimonials={LANDING_TESTIMONIALS.slice(7, 10)} className="testimonials-column-last" duration={26} />
        </div>
      </section>

      <section className="section builder-section" id="builders">
        <div className="section-head">
          <span className="eyebrow">Use your favorite AI builder</span>
          <h2>One handoff. Any <span className="accent-word">AI builder you like.</span></h2>
          <p>
            ForkFirst creates a <span className="accent-key">repo-first build packet</span>, so Claude Code, Codex, Cursor, Replit, Lovable, v0,
            Gemini CLI, Antigravity, and most AI builders know what to clone, what to keep, what to replace, and what
            to build first.
          </p>
        </div>
        <div className="builder-logo-cloud" aria-label="Supported AI builders">
          {BUILDER_LOGOS.map((builder) => (
            <div key={builder.name} className="builder-logo-card">
              <span className="builder-logo-mark" aria-hidden="true">
                <Image className="builder-logo-img" src={builder.logo} alt="" width={112} height={34} />
              </span>
              <strong>{builder.name}</strong>
            </div>
          ))}
        </div>
        <p className="builder-fineprint">If your builder can read a prompt and files, it can use a ForkFirst handoff.</p>
      </section>

      <section className="section structure-section">
        <div className="packet-showcase">
          <div className="packet-copy">
            <span className="eyebrow">The foundation packet</span>
            <h2>A <span className="accent-word">working foundation</span> your AI builder can build from.</h2>
            <p>
              ForkFirst names the <span className="accent-key">starter repo</span>, gives <span className="accent-key">clone/open instructions</span>, and packages the prompt, product brief,
              build plan, brand direction, and builder rules. Your builder starts with <span className="accent-key">working code, not a blank page.</span>
            </p>
          </div>
          <div className="foundation-visual" aria-label="Foundation packet and example builder outcome">
            <div className="product-mock">
              <div className="product-top">
                <strong>JobShelf</strong>
                <span>Example builder outcome</span>
              </div>
              <div className="kanban-preview">
                {["Applied", "Interview", "Offer"].map((column) => (
                  <div key={column} className="kanban-col">
                    <span>{column}</span>
                    <i />
                    <i />
                  </div>
                ))}
              </div>
              <div className="product-actions">
                <span>CSV export</span>
                <span>Reminders</span>
                <span>Local data</span>
              </div>
            </div>
            <div className="foundation-arrow">first build ← repo + prompt + files</div>
            <div className="packet-window">
              <div className="packet-files" role="tablist" aria-label="Sample Build Pack files">
                {packetTabs.map(({ kind, title, filename }) => (
                  <button
                    key={filename}
                    className={`packet-file ${activePacketTab === filename ? "is-active" : ""}`}
                    type="button"
                    role="tab"
                    aria-selected={activePacketTab === filename}
                    aria-controls="landing-packet-preview"
                    onClick={() => setActivePacketTab(filename)}
                  >
                    <span>{kind}</span>
                    <div>
                      <strong>{title}</strong>
                      <em>{filename}</em>
                    </div>
                  </button>
                ))}
              </div>
              <div className="packet-preview" id="landing-packet-preview" role="tabpanel" aria-label={`${activePacket.title} sample`}>
                <div className="packet-preview-label">{activePacket.filename}</div>
                {activePacket.lines.map((line) => (
                  <div
                    key={line.text}
                    className={`code-line ${"tone" in line && line.tone === "command" ? "is-command" : ""} ${"tone" in line && line.tone === "accent" ? "is-accent" : ""}`}
                  >
                    {line.text}
                  </div>
                ))}
              </div>
            </div>
            <p className="foundation-note">ForkFirst prepares the foundation and directions. Your AI builder customizes and implements.</p>
          </div>
        </div>
      </section>

      <section id="trust">
        <div className="trust">
          <div className="tcell">
            <span className="ticon"><SettingsIcon size={18} /></span>
            <h4>Your keys stay under your control.</h4>
            <p>Keys are sent only for <span className="trust-key">requests you trigger</span>, then forwarded to GitHub or your chosen AI provider. Persistent storage is <span className="trust-key">opt-in</span>.</p>
          </div>
          <div className="tcell">
            <span className="ticon"><Search size={18} /></span>
            <h4>No account. No server-side key storage.</h4>
            <p>ForkFirst does not tie keys, searches, or handoffs to a <span className="trust-key">user account</span>. Demo mode works without any AI key.</p>
          </div>
          <div className="tcell">
            <span className="ticon"><GitFork size={18} /></span>
            <h4>Public code and verifiable.</h4>
            <p>Read the code, run it locally, inspect the request flow, and <span className="trust-key">verify exactly</span> where provider keys are sent.</p>
          </div>
        </div>
      </section>

      <section className="section service-section" id="audit">
        <div className="section-head">
          <span className="eyebrow">Done-for-you option</span>
          <h2>Want a human-reviewed <span className="accent-word">AI Builder Handoff?</span></h2>
          <p>
            ForkFirst is the public tool. For founders who want a sharper decision, Zenova can turn your idea into a
            working-foundation audit, reuse-risk notes, and a Cursor/Codex/Claude-ready build packet.
          </p>
        </div>
        <div className="service-grid" aria-label="AI Builder Handoff Audit options">
          {[
            ["Quick Handoff", "$297", "Best for one idea, one recommended foundation, and a clear first build prompt."],
            ["Deep Repo Audit", "$497", "Best for comparing several working foundations, risks, docs, activity, and first milestones."],
            ["Build Plan + Setup", "$997+", "Best when you want the handoff plus initial repo setup direction for your AI builder."]
          ].map(([title, price, body]) => (
            <article className="service-card" key={title}>
              <strong>{title}</strong>
              <span>{price}</span>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="cta-strip">
        <div>
          <h2>What are you <span className="accent-word">about to build?</span></h2>
          <p>Chat through the idea, find a working foundation, then hand your AI builder the repo, prompt, and files it needs.</p>
        </div>
        <div className="actions">
          <button className="btn accent xl" type="button" onClick={() => startApp("footer_cta")}>
            Try it free <ArrowRight size={18} />
          </button>
          <span className="meta">No signup. Free forever. Bring your own key.</span>
        </div>
      </div>

      <footer className="footer">
        <button className="left brand-home" type="button" onClick={() => go("landing")} aria-label="Go to ForkFirst landing page">
          <Logo />
          <Wordmark />
          <span className="footer-meta">Built by Josh Douglas · Powered by Zenova AI · MIT</span>
        </button>
        <div className="right">
          <button type="button" onClick={() => setShowAbout(true)}>About</button>
          <a href="https://github.com/ZenovaZeni/forkfirst" target="_blank" rel="noreferrer">GitHub</a>
          <a href={SUPPORT_URL} target="_blank" rel="noreferrer">Support</a>
          <a href="/security">Security</a>
          <a href="/privacy">Privacy</a>
          <a href="https://github.com/ZenovaZeni/forkfirst/security/advisories/new" target="_blank" rel="noreferrer">Report security issue</a>
          <a href="https://github.com/ZenovaZeni/forkfirst" target="_blank" rel="noreferrer">Contributing</a>
        </div>
      </footer>
      {showAbout ? <AboutModal onClose={() => setShowAbout(false)} /> : null}
    </div>
  );
}

function Sidebar({
  active,
  go,
  savedBuildPackCount,
  savedRepoCount,
  recentChats,
  activeChatId,
  onOpenChat,
  onRenameChat,
  onDeleteChat
}: {
  active: Screen;
  go: (screen: Screen, options?: GoOptions) => void;
  savedBuildPackCount: number;
  savedRepoCount: number;
  recentChats: ResearchChat[];
  activeChatId: string | null;
  onOpenChat: (chat: ResearchChat) => void;
  onRenameChat: (chatId: string, title: string) => void;
  onDeleteChat: (chatId: string) => void;
}) {
  const firstRecentIsActive = ["app", "loading", "results", "more", "branding", "generating", "ready"].includes(active);
  const visibleChats = recentChats.slice(0, 6);
  const handoffLabel = `${savedBuildPackCount.toLocaleString()} saved handoff${savedBuildPackCount === 1 ? "" : "s"}`;
  const repoLabel = `${savedRepoCount.toLocaleString()} repo${savedRepoCount === 1 ? "" : "s"} saved for later`;
  const [menuChatId, setMenuChatId] = useState<string | null>(null);
  const [renameChat, setRenameChat] = useState<ResearchChat | null>(null);
  const [deleteChat, setDeleteChat] = useState<ResearchChat | null>(null);
  const [renameValue, setRenameValue] = useState("");
  useEffect(() => {
    if (!menuChatId) return;
    const close = () => setMenuChatId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuChatId]);
  return (
    <aside className="sidebar" data-screen-label="App sidebar">
      <button className="brand-row brand-home" type="button" onClick={() => go("landing")} aria-label="Go to ForkFirst landing page">
        <Logo />
        <Wordmark />
      </button>
      <button className="new-btn" type="button" onClick={() => go("app")}>
        <span className="plus"><Plus size={14} /></span>
        New idea check
      </button>
      <div className="rail-label">Recent</div>
      {visibleChats.length ? visibleChats.map((item) => (
        <div key={item.id} className={`rail-item recent-chat-row ${activeChatId === item.id && firstRecentIsActive ? "active" : ""}`}>
          <button className="recent-open" type="button" onClick={() => onOpenChat(item)} title={displayChatTitle(item.title)}>
            <span className="ttl">{displayChatTitle(item.title)}</span>
            <span className="when">{relativeChatTime(item.updatedAt)}</span>
          </button>
          <div className="recent-menu-wrap">
            <button
              className="recent-action"
              type="button"
              title="Chat options"
              aria-haspopup="menu"
              aria-expanded={menuChatId === item.id}
              onClick={(event) => {
                event.stopPropagation();
                setMenuChatId((current) => current === item.id ? null : item.id);
              }}
            >
              <MoreHorizontal size={14} />
            </button>
            {menuChatId === item.id ? (
              <div className="recent-menu" role="menu" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setRenameChat(item);
                    setRenameValue(item.title);
                    setMenuChatId(null);
                  }}
                >
                  Rename
                </button>
                <button
                  className="danger"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDeleteChat(item);
                    setMenuChatId(null);
                  }}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )) : (
        <div className="rail-empty">Your idea checks will appear here.</div>
      )}
      <div className="nav-foot">
        <div className="tokens-card build-progress-card">
          <div className="lbl">Build progress</div>
          <div className="num">{handoffLabel}</div>
          <div className="sub">{savedBuildPackCount || savedRepoCount ? repoLabel : "Save a repo or create a handoff and it will show here."}</div>
        </div>
        <button className={`rail-item ${active === "trending" ? "active" : ""}`} type="button" onClick={() => go("trending")}>
          <Star size={16} /><span className="ttl">Trending</span>
        </button>
        <button className={`rail-item ${active === "packs" ? "active" : ""}`} type="button" onClick={() => go("packs")}>
          <Copy size={16} /><span className="ttl">Prompt Packs</span>
        </button>
        <button className={`rail-item ${active === "library" ? "active" : ""}`} type="button" onClick={() => go("library")}>
          <Bookmark size={16} /><span className="ttl">Repos</span>
        </button>
        <button className={`rail-item ${active === "handoff" ? "active" : ""}`} type="button" onClick={() => go("handoff")}>
          <Download size={16} /><span className="ttl">Handoffs</span>
        </button>
        <button className={`rail-item ${active === "settings" ? "active" : ""}`} type="button" onClick={() => go("settings")}>
          <SettingsIcon size={16} /><span className="ttl">Settings</span>
        </button>
      </div>
      {renameChat ? (
        <div className="branded-dialog-backdrop" role="presentation" onMouseDown={() => setRenameChat(null)}>
          <form
            className="branded-dialog chat-rename-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = renameValue.trim();
              if (!trimmed) return;
              onRenameChat(renameChat.id, trimmed);
              setRenameChat(null);
            }}
          >
            <div className="dialog-head">
              <Logo />
              <div>
                <strong>Rename chat</strong>
                <span>Keep recent checks easy to scan.</span>
              </div>
              <button className="icon-btn" type="button" onClick={() => setRenameChat(null)} aria-label="Close rename dialog">
                <X size={15} />
              </button>
            </div>
            <label className="dialog-field">
              <span>Chat name</span>
              <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
            </label>
            <div className="dialog-actions">
              <button className="btn ghost" type="button" onClick={() => setRenameChat(null)}>Cancel</button>
              <button className="btn accent" type="submit" disabled={!renameValue.trim()}>Save name</button>
            </div>
          </form>
        </div>
      ) : null}
      {deleteChat ? (
        <div className="branded-dialog-backdrop" role="presentation" onMouseDown={() => setDeleteChat(null)}>
          <div className="branded-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-chat-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-head">
              <Logo />
              <div>
                <strong id="delete-chat-title">Delete chat?</strong>
                <span>This only removes it from this browser.</span>
              </div>
              <button className="icon-btn" type="button" onClick={() => setDeleteChat(null)} aria-label="Close delete dialog">
                <X size={15} />
              </button>
            </div>
            <p className="dialog-copy">{deleteChat.title}</p>
            <div className="dialog-actions">
              <button className="btn ghost" type="button" onClick={() => setDeleteChat(null)}>Cancel</button>
              <button className="btn danger" type="button" onClick={() => {
                onDeleteChat(deleteChat.id);
                setDeleteChat(null);
              }}>Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function SavingsRing({ savedBuildPackCount, savedRepoCount }: { savedBuildPackCount: number; savedRepoCount: number }) {
  return (
    <div className="savings-ring build-progress-pill" style={{ "--ring-pct": savedBuildPackCount ? 0.72 : savedRepoCount ? 0.36 : 0 } as React.CSSProperties} title="Build progress">
      <div className="ring-circle">
        <span className="ring-inner">B</span>
      </div>
      <div className="ring-text">
        <span className="big">{savedBuildPackCount} handoff{savedBuildPackCount === 1 ? "" : "s"}</span>
        <span className="lbl">{savedRepoCount} repo{savedRepoCount === 1 ? "" : "s"} saved</span>
      </div>
    </div>
  );
}

function useLongPress(onLongPress: () => void, delay = 380) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    startPointRef.current = null;
  }, []);

  const startAt = useCallback((x: number, y: number) => {
    firedRef.current = false;
    clear();
    startPointRef.current = { x, y };
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, delay);
  }, [clear, delay, onLongPress]);

  const startPointer = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startAt(event.clientX, event.clientY);
  }, [startAt]);

  const startTouch = useCallback((event: TouchEvent<HTMLElement>) => {
    if (window.PointerEvent) return;
    const touch = event.touches[0];
    if (!touch) return;
    startAt(touch.clientX, touch.clientY);
  }, [startAt]);

  const move = useCallback((x: number, y: number) => {
    const start = startPointRef.current;
    if (!start) return;
    if (Math.hypot(x - start.x, y - start.y) > 18) clear();
  }, [clear]);

  const movePointer = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse") return;
    move(event.clientX, event.clientY);
  }, [move]);

  const moveTouch = useCallback((event: TouchEvent<HTMLElement>) => {
    if (window.PointerEvent) return;
    const touch = event.touches[0];
    if (!touch) return;
    move(touch.clientX, touch.clientY);
  }, [move]);

  const wasLongPress = useCallback(() => firedRef.current, []);
  const preventContextMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  return {
    bind: {
      onPointerDown: startPointer,
      onPointerMove: movePointer,
      onPointerUp: clear,
      onPointerCancel: clear,
      onTouchStart: startTouch,
      onTouchMove: moveTouch,
      onTouchEnd: clear,
      onTouchCancel: clear,
      onContextMenu: preventContextMenu
    },
    wasLongPress
  };
}

function useSwipeDownDismiss(onDismiss: () => void, threshold = 72) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse") return;
      startRef.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (dy > threshold && Math.abs(dx) < 80) onDismiss();
    },
    onPointerCancel: () => {
      startRef.current = null;
    }
  };
}

function RecentChatsDrawer({
  recentChats,
  activeChatId,
  onClose,
  onNewChat,
  onOpenChat
}: {
  recentChats: ResearchChat[];
  activeChatId: string | null;
  onClose: () => void;
  onNewChat: () => void;
  onOpenChat: (chat: ResearchChat) => void;
}) {
  const swipeDown = useSwipeDownDismiss(onClose);
  return (
    <>
      <button className="chat-drawer-scrim" type="button" aria-label="Close recent chats" onClick={onClose} />
      <aside className="topbar-chat-drawer" role="dialog" aria-label="Recent chats">
        <div className="mobile-swipe-handle" aria-hidden="true" />
        <div className="topbar-chat-drawer-head" {...swipeDown}>
          <div>
            <span className="eyebrow">Recent</span>
            <strong>Chats</strong>
          </div>
          <button type="button" onClick={onClose} aria-label="Close recent chats">
            <X size={14} />
          </button>
        </div>
        <button type="button" className="topbar-new-chat" onClick={onNewChat}>
          <Plus size={15} />
          New idea check
        </button>
        <div className="topbar-chat-list">
          {recentChats.slice(0, 10).length ? recentChats.slice(0, 10).map((chat) => (
            <button
              key={chat.id}
              type="button"
              className={activeChatId === chat.id ? "active" : ""}
              onClick={() => onOpenChat(chat)}
            >
              <span>{displayChatTitle(chat.title)}</span>
              <small>{relativeChatTime(chat.updatedAt)}</small>
            </button>
          )) : (
            <div className="mobile-chat-empty">Your recent idea checks will show here.</div>
          )}
        </div>
      </aside>
    </>
  );
}

function MobileNav({
  active,
  go,
  recentChats,
  activeChatId,
  onOpenChat
}: {
  active: Screen;
  go: (screen: Screen, options?: GoOptions) => void;
  recentChats: ResearchChat[];
  activeChatId: string | null;
  onOpenChat: (chat: ResearchChat) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const longPressNew = useLongPress(() => {
    setMoreOpen(false);
    setChatDrawerOpen(true);
  });
  const primary: Array<{ screen: Screen; label: string; icon: ReactNode }> = [
    { screen: "trending", label: "Trends", icon: <Star size={15} /> },
    { screen: "handoff", label: "Handoffs", icon: <Download size={15} /> },
    { screen: "library", label: "Repos", icon: <Bookmark size={15} /> }
  ];
  const secondary: Array<{ screen: Screen; label: string; icon: ReactNode }> = [
    { screen: "packs", label: "Prompt Packs", icon: <Copy size={15} /> },
    { screen: "settings", label: "Settings", icon: <SettingsIcon size={15} /> }
  ];
  const moreIsActive = secondary.some((item) => item.screen === active);
  const navigate = (screen: Screen) => {
    setMoreOpen(false);
    setChatDrawerOpen(false);
    go(screen);
  };
  const openChatFromDrawer = (chat: ResearchChat) => {
    setChatDrawerOpen(false);
    onOpenChat(chat);
  };
  return (
    <>
      {chatDrawerOpen ? (
        <RecentChatsDrawer
          recentChats={recentChats}
          activeChatId={activeChatId}
          onClose={() => setChatDrawerOpen(false)}
          onNewChat={() => navigate("app")}
          onOpenChat={openChatFromDrawer}
        />
      ) : null}
      {moreOpen ? (
        <div className="mobile-more-menu" role="menu" aria-label="More navigation">
          {secondary.map((item) => (
            <button key={item.screen} type="button" role="menuitem" className={active === item.screen ? "active" : ""} onClick={() => navigate(item.screen)}>
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      <nav className="mobile-nav" aria-label="Mobile app navigation">
        {primary.slice(0, 2).map((item) => (
          <button
            key={item.screen}
            type="button"
            className={active === item.screen ? "active" : ""}
            onClick={() => navigate(item.screen)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
        <button
          type="button"
          className={`mobile-new-fab ${active === "app" ? "active" : ""}`}
          onClick={(event) => {
            if (longPressNew.wasLongPress()) {
              event.preventDefault();
              return;
            }
            navigate("app");
          }}
          {...longPressNew.bind}
          aria-label="Start a new idea chat"
          title="Tap for new chat. Hold for recent chats."
        >
          <span className="fab-icon"><Plus size={22} /></span>
        </button>
        {primary.slice(2).map((item) => (
          <button
            key={item.screen}
            type="button"
            className={active === item.screen ? "active" : ""}
            onClick={() => navigate(item.screen)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
        <button
          type="button"
          className={moreIsActive || moreOpen ? "active" : ""}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          onClick={() => {
            setMoreOpen((open) => !open);
          }}
        >
          <MoreHorizontal size={15} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

function Topbar({
  title,
  theme,
  onToggleTheme,
  go,
  screen
}: {
  title: string;
  theme: Theme;
  onToggleTheme: () => void;
  go: (screen: Screen) => void;
  screen: Screen;
}) {
  const inChat = ["results", "more", "branding", "generating", "ready"].includes(screen);
  return (
    <header className="ws-topbar">
      <div className="crumbs">
        <button className="crumb-home crumb-wordmark" type="button" onClick={() => go("landing")} aria-label="Go to ForkFirst landing page">
          <span>Fork</span>
          <span className="crumb-wordmark-accent">First</span>
        </button>
        <span>/</span>
        <strong>{title}</strong>
      </div>
      <div className="actions">
        {inChat ? (
          <button className="icon-btn" type="button" onClick={() => go("handoff")} title="Open handoff">
            <ExternalLink size={16} />
          </button>
        ) : null}
        <button className="icon-btn" type="button" onClick={onToggleTheme} title="Toggle theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="icon-btn" type="button" onClick={() => go("settings")} title="Settings">
          <SettingsIcon size={16} />
        </button>
      </div>
    </header>
  );
}

function useBrowserVoiceInput(value: string, onChange: (value: string) => void, onUnsupported?: () => void) {
  const valueRef = useRef(value);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const constructorRef = useRef<BrowserSpeechRecognitionConstructor | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState<string>(browserVoiceInputCopy.privacy);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const SpeechRecognition = getBrowserSpeechRecognition(window as unknown as Parameters<typeof getBrowserSpeechRecognition>[0]);
    constructorRef.current = SpeechRecognition;
    setSupported(Boolean(SpeechRecognition));
    if (!SpeechRecognition) setMessage(browserVoiceInputCopy.unsupported);
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setMessage(browserVoiceInputCopy.privacy);
      return;
    }

    const SpeechRecognition = constructorRef.current;
    if (!SpeechRecognition) {
      setMessage(browserVoiceInputCopy.unsupported);
      onUnsupported?.();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      const transcriptParts: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript;
        if (transcript) transcriptParts.push(transcript);
      }
      const transcript = transcriptParts.join(" ");
      if (transcript.trim()) {
        onChange(mergeSpeechTranscript(valueRef.current, transcript));
      }
    };
    recognition.onerror = (event) => {
      setMessage(event.error === "not-allowed"
        ? "Microphone permission was blocked. You can still type your idea."
        : "Voice input stopped before a transcript was captured. You can try again or type.");
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      setMessage(browserVoiceInputCopy.privacy);
    };

    recognitionRef.current = recognition;
    setListening(true);
    setMessage(browserVoiceInputCopy.listening);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setMessage(browserVoiceInputCopy.unsupported);
      onUnsupported?.();
    }
  }, [listening, onChange, onUnsupported]);

  return { supported, listening, message, toggle };
}

function VoiceInputButton({
  disabled,
  listening,
  supported,
  onToggle
}: {
  disabled?: boolean;
  listening: boolean;
  supported: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`voice-btn ${listening ? "is-listening" : ""}`}
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={listening ? "Stop browser voice input" : "Start browser voice input"}
      title={supported ? browserVoiceInputCopy.idle : browserVoiceInputCopy.unsupported}
    >
      <Mic size={16} />
    </button>
  );
}

function Composer({
  value,
  loading,
  compact = false,
  placeholder,
  submitLabel,
  onChange,
  onSubmit
}: {
  value: string;
  loading?: boolean;
  compact?: boolean;
  placeholder?: string;
  submitLabel?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const focusIdeaInput = useCallback(() => {
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);
  const voice = useBrowserVoiceInput(value, onChange, focusIdeaInput);
  return (
    <div className="composer">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (isLegacyExamplePrompt(value)) onChange("");
        }}
        placeholder={placeholder ?? IDEA_PLACEHOLDER}
        rows={compact ? 2 : 4}
        aria-label="Idea prompt"
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) onSubmit();
        }}
      />
      <div className="composer-row">
        <div className="composer-chips">
          <span className="chip is-active">Public GitHub</span>
          <span className="chip">Rank by fit</span>
          <span className="chip">Save results</span>
        </div>
        <div className="composer-actions">
          <VoiceInputButton
            disabled={loading}
            listening={voice.listening}
            supported={voice.supported}
            onToggle={voice.toggle}
          />
          <button className="composer-send" type="button" disabled={loading} onClick={() => onSubmit()}>
            {loading ? "Checking..." : submitLabel ?? "Check it"} <Send size={14} />
          </button>
        </div>
      </div>
      <p className={`voice-status ${voice.listening ? "is-listening" : ""}`} title={browserVoiceInputCopy.privacy}>{voice.message}</p>
    </div>
  );
}

function EmptyApp({
  prompt,
  loading,
  foundationDraft,
  setPrompt,
  savedRepos,
  onSelectFoundation,
  onSaveRepo,
  onClearFoundation,
  onSubmit,
  onViewTrending
}: {
  prompt: string;
  loading: boolean;
  foundationDraft: FoundationDraft | null;
  setPrompt: (value: string) => void;
  savedRepos: ClassifiedRepo[];
  onSelectFoundation: (repo: FoundationDraft) => void;
  onSaveRepo: (repo: ClassifiedRepo) => void;
  onClearFoundation: () => void;
  onSubmit: (promptOverride?: string) => void;
  onViewTrending: () => void;
}) {
  const [pasteUrl, setPasteUrl] = useState("");
  const [detailsRepo, setDetailsRepo] = useState<TrendingRepo | null>(null);
  const trending = useTrendingRepos("ai-agents");
  const trendingCategory = TRENDING_CATEGORIES.find((item) => item.id === "ai-agents");
  const repoPath = parseGitHubRepoInput(pasteUrl);
  const showRepoHint = pasteUrl.trim().length > 0 && !repoPath;
  return (
    <>
      <section className="ws-empty" data-screen-label="02 App empty">
        <h1 className="greeting">
          What are you <span className="accent-word">about to build?</span>
        </h1>
        <p className="sub">
          {foundationDraft
            ? "Tell ForkFirst what you want to build from this repo. We will inspect it before the handoff."
            : "Tell ForkFirst what you want to build. We will find a strong repo foundation and prep the handoff."}
        </p>
        {foundationDraft ? (
          <div className="foundation-attach" aria-label="Selected foundation repo">
            <div>
              <span className="fa-kicker">Foundation attached</span>
              <strong>{foundationDraft.fullName}</strong>
              <p>
                {foundationDraft.description || "ForkFirst will treat this as the repo to inspect first, then ask whether it should be cloned, studied, or avoided for your idea."}
              </p>
              <div className="fa-meta">
                {foundationDraft.stars ? <span>{formatStars(foundationDraft.stars)} stars</span> : null}
                {foundationDraft.language ? <span>{foundationDraft.language}</span> : null}
                {foundationDraft.license ? <span>{foundationDraft.license}</span> : null}
              </div>
            </div>
            <button className="icon-btn" type="button" onClick={onClearFoundation} aria-label="Remove attached foundation repo">
              <X size={15} />
            </button>
          </div>
        ) : null}
        <Composer
          value={prompt}
          loading={loading}
          onChange={setPrompt}
          placeholder={foundationDraft ? `What are you trying to build with ${foundationDraft.fullName}?` : undefined}
          submitLabel={foundationDraft ? "Inspect foundation" : undefined}
          onSubmit={() => onSubmit()}
        />
        <div className="paste-shortcut">
          <span className="pico">
            <GitFork size={13} /> Already know the repo?
          </span>
          <input
            value={pasteUrl}
            onChange={(event) => setPasteUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && repoPath && !loading) {
                onSelectFoundation(foundationFromRepoPath(repoPath));
                setPasteUrl("");
              }
            }}
            aria-invalid={showRepoHint}
            placeholder="paste github.com/owner/repo or owner/repo"
          />
          <button
            className="go-btn"
            type="button"
            disabled={!repoPath || loading}
            onClick={() => {
              if (!repoPath) return;
              onSelectFoundation(foundationFromRepoPath(repoPath));
              setPasteUrl("");
            }}
          >
            Use
          </button>
        </div>
        {showRepoHint ? <p className="paste-hint">Use owner/repo or github.com/owner/repo.</p> : null}
        <div className="starters-trending">
          <div className="row-label">
            <span className="pulse" />
            <span>Fresh GitHub starting points</span>
            <button className="row-label-more" type="button" onClick={onViewTrending}>
              View more
            </button>
          </div>
          <div className="starter-grid">
            {trending.status === "loading" ? [1, 2, 3].map((item) => (
              <div key={item} className="starter-rich">
                <span className="badge">Loading</span>
                <div className="who">
                  <span className="dot" />
                  GitHub Search API
                </div>
                <div className="ttl-rich">Fetching live repos...</div>
                <div className="desc-rich">No placeholder trend metrics shown.</div>
              </div>
            )) : null}
            {trending.status === "error" ? (
              <div className="starter-rich">
                <span className="badge">GitHub</span>
                <div className="who">
                  <span className="dot" />
                  Live data unavailable
                </div>
                <div className="ttl-rich">Could not load live repos</div>
                <div className="desc-rich">Try again later or paste a repo above.</div>
              </div>
            ) : null}
            {trending.status === "ok" ? trending.repos.slice(0, 3).map((repo) => (
              <article
                key={repo.fullName}
                className="starter-rich"
                role="button"
                tabIndex={0}
                onClick={() => setDetailsRepo(repo)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setDetailsRepo(repo);
                  }
                }}
              >
                <div className="starter-card-top">
                  <div className="who">
                    <span className="dot" />
                    {formatStars(repo.stars)} stars{repo.language ? ` - ${repo.language}` : ""}{repo.license ? ` - ${repo.license}` : ""}
                  </div>
                  <span className="badge">GitHub</span>
                </div>
                <div className="ttl-rich">{repo.fullName}</div>
                <div className="desc-rich">{repo.description || "No GitHub description provided."}</div>
                {repo.topics.length ? (
                  <div className="starter-topics" aria-label={`${repo.fullName} topics`}>
                    {repo.topics.slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}
                  </div>
                ) : null}
                <div className="meta-rich">
                  <span className="mono" style={{ fontSize: 11 }}>Top trending lead</span>
                  <button
                    className="foundation-cta"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectFoundation(foundationFromTrendingRepo(repo));
                    }}
                  >
                    Use
                  </button>
                </div>
              </article>
            )) : null}
          </div>
        </div>
      </section>
      <TrendingRepoDrawer
        repo={detailsRepo}
        category={trendingCategory}
        saved={detailsRepo ? isSavedRepo(classifiedFromTrendingRepo(detailsRepo, trendingCategory), savedRepos) : false}
        onClose={() => setDetailsRepo(null)}
        onSave={(repo) => onSaveRepo(classifiedFromTrendingRepo(repo, trendingCategory))}
        onUse={(repo) => {
          setDetailsRepo(null);
          onSelectFoundation(foundationFromTrendingRepo(repo));
        }}
      />
    </>
  );
}

function LoadingView({ prompt }: { prompt: string }) {
  return (
    <section className="results" data-screen-label="03 App loading">
      <div className="results-head">
        <h2 className="results-question">{prompt}</h2>
      </div>
      <div className="loading-card">
        <div className="v-eyebrow">Checking your idea</div>
        <h3>Looking at what&apos;s already out there...</h3>
        <div className="steps-loading">
          {["Reading your idea", "Searching public GitHub", "Ranking 47 candidates", "Writing your handoff"].map((step, index) => (
            <div key={step} className={`ls ${index < 2 ? "done" : ""}`}>
              <span className="ind" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Mark() {
  return (
    <span aria-hidden="true" className="forkfirst-logo mark">
      <svg viewBox="0 0 64 64" focusable="false">
        <rect width="64" height="64" rx="14" />
        <path d="M14 12 L32 36 L32 54" />
        <path className="forkfirst-logo-accent" d="M50 12 L33 35" />
      </svg>
    </span>
  );
}

function FeaturedRepo({
  repo,
  idea,
  saved,
  cautious = false,
  onOpen,
  onSave,
  onUse
}: {
  repo: ClassifiedRepo;
  idea: string;
  saved: boolean;
  cautious?: boolean;
  onOpen: (repo: ClassifiedRepo) => void;
  onSave: (repo: ClassifiedRepo) => void;
  onUse: (repo: ClassifiedRepo) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <article className="repo-card featured">
      <div className="rc-head">
        <div>
          <div className="rc-tag-row">
            <span className="rc-tag featured-tag">{cautious ? "Best lead so far" : "Start here"}</span>
            <span className={`rc-tag ${repoTagClass(repo)}`}>
              {repoCategoryLabel(repo)}
            </span>
          </div>
          <button className="rc-name" type="button" onClick={() => onOpen(repo)}>
            {repo.fullName}
          </button>
          <p className="rc-tagline">{repoSummary(repo)}</p>
          <p className="rc-user-hint"><strong>Why start here:</strong> {repoIdeaReason(repo, idea)}</p>
        </div>
        <div className="rc-fit">
          <span className="num">{repo.score.total}%</span>
          <span className="lbl">Fit</span>
        </div>
      </div>

      <div className="rc-meta">
        <span>
          <Star size={13} /> <strong>{repo.stars.toLocaleString()}</strong>
        </span>
        <span>
          <GitFork size={13} /> {repo.forks.toLocaleString()}
        </span>
        <span>{repo.language ?? "Mixed"}</span>
        <span>{repo.license ?? "License unknown"}</span>
      </div>

      <div className="rc-notes">
        <div className="rc-note">
          <div className="nlabel">What it is</div>
          <div className="nbody">{repoWhat(repo)}</div>
        </div>
        <div className="rc-note">
          <div className="nlabel">Why it showed up</div>
          <div className="nbody">{repoWhyShown(repo, idea)}</div>
        </div>
        <div className="rc-note warn">
          <div className="nlabel">Watch out</div>
          <div className="nbody">{repoWatch(repo)}</div>
        </div>
        <div className="rc-note next">
          <div className="nlabel">Next move</div>
          <div className="nbody">{repoNext(repo, idea)}</div>
        </div>
      </div>

      <div className="rc-actions">
        <button className="btn accent" type="button" onClick={() => onUse(repo)}>
          Use
        </button>
        <button className="btn ghost" type="button" onClick={() => onOpen(repo)}>
          Details
        </button>
        <a className="btn ghost" href={repo.url} target="_blank" rel="noreferrer">
          <ExternalLink size={13} /> Open on GitHub
        </a>
        <RepoSiteLink url={repo.homepage} />
        <button className="icon-btn" title={saved ? "Saved" : "Save"} type="button" onClick={() => onSave(repo)}>
          {saved ? <Check size={15} /> : <Bookmark size={15} />}
        </button>
        <div className="repo-action-menu">
          <button
            className="icon-btn"
            title="More actions"
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen ? (
            <div className="repo-menu-popover" role="menu">
              <button type="button" role="menuitem" onClick={() => {
                setMenuOpen(false);
                onOpen(repo);
              }}>
                View details
              </button>
              <button type="button" role="menuitem" onClick={() => {
                setMenuOpen(false);
                onSave(repo);
              }}>
                {saved ? "Remove from library" : "Save to library"}
              </button>
              <button type="button" role="menuitem" onClick={() => {
                setMenuOpen(false);
                navigator.clipboard.writeText(repo.fullName).catch(() => undefined);
              }}>
                Copy repo name
              </button>
              {safeExternalUrl(repo.homepage) ? (
                <a role="menuitem" href={safeExternalUrl(repo.homepage) ?? "#"} target="_blank" rel="noreferrer">
                  Open project site
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function CompactRepo({
  repo,
  idea,
  onOpen,
  onUse
}: {
  repo: ClassifiedRepo;
  idea: string;
  onOpen: (repo: ClassifiedRepo) => void;
  onUse: (repo: ClassifiedRepo) => void;
}) {
  return (
    <article className="repo-card compact">
      <div className="left">
        <div className="rc-tag-row">
          <span className={`rc-tag ${repoTagClass(repo)}`}>{repoCategoryLabel(repo)}</span>
        </div>
        <button className="rc-name" type="button" onClick={() => onOpen(repo)}>
          {repo.fullName}
        </button>
        <p className="rc-tagline">{repoSummary(repo)}</p>
        <p className="rc-user-hint"><strong>Why it showed up:</strong> {repoWhyShown(repo, idea)}</p>
      </div>
      <div className="right">
        <div className="rc-fit">
          <span className="num">{repo.score.total}%</span>
          <span className="lbl">Fit</span>
        </div>
        <button className="btn ghost" type="button" onClick={() => onOpen(repo)}>Details</button>
        <RepoSiteLink url={repo.homepage} />
        <button className="btn ghost" type="button" onClick={() => onUse(repo)}>Use</button>
      </div>
    </article>
  );
}

function reposByName(result: IdeaCheckResult | null | undefined) {
  return new Map((result?.repos ?? []).map((repo) => [repo.fullName, repo]));
}

function InlineChatActions({
  actions,
  actionResult,
  currentResult,
  savedRepos,
  idea,
  onOpenRepo,
  onSaveRepo,
  onSelectStarter,
  onStartBranding,
  onFollowUp
}: {
  actions?: ChatUiAction[];
  actionResult?: IdeaCheckResult;
  currentResult: IdeaCheckResult;
  savedRepos: ClassifiedRepo[];
  idea: string;
  onOpenRepo: (repo: ClassifiedRepo) => void;
  onSaveRepo: (repo: ClassifiedRepo) => void;
  onSelectStarter: (repo: ClassifiedRepo) => void;
  onStartBranding: () => void;
  onFollowUp: (message: string) => void;
}) {
  if (!actions?.length) return null;

  const lookup = reposByName(actionResult ?? currentResult);
  const findRepo = (name: string | null | undefined) => (name ? lookup.get(name) : undefined);

  return (
    <div className="chat-actions">
      {actions.map((action, index) => {
        if (action.type === "repo_cards") {
          const repos = action.repoFullNames.map(findRepo).filter((repo): repo is ClassifiedRepo => Boolean(repo));
          if (!repos.length) return null;
          return (
            <div className="chat-action-block" key={`${action.type}-${index}`}>
              {action.title ? <div className="others-label"><span>{action.title}</span></div> : null}
              {repos.slice(0, 3).map((repo) => (
                <CompactRepo
                  key={repo.fullName}
                  repo={repo}
                  idea={idea}
                  onOpen={onOpenRepo}
                  onUse={(chosen) => {
                    onSelectStarter(chosen);
                    onStartBranding();
                  }}
                />
              ))}
            </div>
          );
        }

        if (action.type === "compare_table") {
          return (
            <div className="chat-action-block compare-action" key={`${action.type}-${index}`}>
              <div className="others-label"><span>Comparison</span></div>
              <div className="mini-compare">
                {action.rows.slice(0, 4).map((row) => (
                  <div className="mini-compare-row" key={row.repoFullName}>
                    <strong>{row.repoFullName}</strong>
                    <span>{row.score}% fit</span>
                    <span>{row.license ? `License: ${row.license}` : "License needs checking"}</span>
                    <span>{row.bestFor}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (action.type === "project_links") {
          return (
            <div className="chat-action-block project-link-action" key={`${action.type}-${index}`}>
              <div className="others-label"><span>Project links</span></div>
              <div className="suggest-row">
                {action.links.map((link) => (
                  <a className="suggest-chip" key={`${link.repoFullName}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
                    <ExternalLink size={13} /> {link.label}
                  </a>
                ))}
              </div>
            </div>
          );
        }

        if (action.type === "search_query") {
          return (
            <div className="chat-action-block" key={`${action.type}-${index}`}>
              <button className="suggest-chip" type="button" onClick={() => onFollowUp(action.query)}>
                <Search size={13} /> {action.label}
              </button>
            </div>
          );
        }

        if (action.type === "suggested_prompts") {
          return (
            <div className="suggest-row" key={`${action.type}-${index}`}>
              {action.prompts.slice(0, 4).map((suggestion) => (
                <button className="suggest-chip" type="button" key={suggestion} onClick={() => onFollowUp(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          );
        }

        if (action.type === "handoff_confirmation") {
          const repo = findRepo(action.repoFullName);
          return (
            <div className="next-step-card chat-action-block" key={`${action.type}-${index}`}>
              <div>
                <div className="nlbl">Builder handoff</div>
                <h4>{repo ? `Start from ${repo.fullName}` : "Start the handoff"}</h4>
                <p>{action.message}</p>
              </div>
              <button
                className="btn accent"
                type="button"
                onClick={() => {
                  if (repo) onSelectStarter(repo);
                  onStartBranding();
                }}
              >
                Create handoff <ArrowRight size={14} />
              </button>
            </div>
          );
        }

        if (action.type === "save_repo") {
          const repo = findRepo(action.repoFullName);
          if (!repo) return null;
          const saved = isSavedRepo(repo, savedRepos);
          return (
            <div className="chat-action-block" key={`${action.type}-${index}`}>
              <button className="suggest-chip" type="button" onClick={() => !saved && onSaveRepo(repo)} disabled={saved}>
                <Bookmark size={13} /> {saved ? `Saved ${repo.fullName}` : `Save ${repo.fullName}`}
              </button>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

function ChatResults({
  prompt,
  result,
  phase,
  brand,
  selectedStarterRepo,
  savedRepos,
  followUps,
  sending,
  onOpenRepo,
  onSaveRepo,
  onSelectStarter,
  onCopyHandoff,
  onDownloadHandoff,
  onDownloadHandoffZip,
  onBuilderSelect,
  onFollowUp,
  onStartBranding,
  onGenerate,
  onReady,
  readyDocs,
  go
}: {
  prompt: string;
  result: IdeaCheckResult;
  phase: Screen;
  brand: BrandAnswers | null;
  selectedStarterRepo: ClassifiedRepo | null;
  savedRepos: ClassifiedRepo[];
  followUps: ChatTurn[];
  sending: boolean;
  onOpenRepo: (repo: ClassifiedRepo) => void;
  onSaveRepo: (repo: ClassifiedRepo) => void;
  onSelectStarter: (repo: ClassifiedRepo) => void;
  onCopyHandoff: () => void;
  onDownloadHandoff: () => void;
  onDownloadHandoffZip: () => void;
  onBuilderSelect: (target: BuildTarget, source: string) => void;
  onFollowUp: (message: string) => void;
  onStartBranding: () => void;
  onGenerate: (brand: BrandAnswers) => void;
  onReady: () => void;
  readyDocs: HandoffDocuments;
  go: (screen: Screen, options?: GoOptions) => void;
}) {
  const repos = phase === "more" ? result.repos.slice(0, 6) : result.repos.slice(0, 3);
  const best = repos[0];
  const recovery = result.recovery ?? buildSearchRecovery({ prompt: result.prompt, repos: result.repos, warnings: result.warnings });
  const isWeakSearch = recovery.state !== "ok";
  const closeMatchCount = recovery.closeMatchCount;
  const chatTailRef = useRef<HTMLDivElement | null>(null);
  const previousFollowUpCountRef = useRef(followUps.length);

  useEffect(() => {
    const countGrew = followUps.length > previousFollowUpCountRef.current;
    previousFollowUpCountRef.current = followUps.length;

    const phaseShouldFollow = phase === "branding" || phase === "generating" || phase === "ready";
    if (!countGrew && !sending && !phaseShouldFollow) return;

    const frame = window.requestAnimationFrame(() => {
      chatTailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [followUps.length, phase, sending]);

  return (
    <section className="chat" data-screen-label={`04 Chat / ${phase}`} data-clarity-mask="true">
      <div className="t t-user">
        <div className="bubble">{prompt}</div>
      </div>
      <div className="t t-assist">
        <div className="who">
          <Mark />
          <strong>ForkFirst</strong>
          <time>- just now</time>
        </div>
        <div className="verdict-ribbon">
          <span className="vdot" />
          <strong>{isWeakSearch ? recovery.headline : result.verdictLabel}.</strong>
          <span>
            {isWeakSearch ? (
              recovery.explanation
            ) : closeMatchCount > 0 ? (
              <>
                You&apos;re in luck - <em>{closeMatchCount} close match{closeMatchCount === 1 ? "" : "es"}</em>{" "}
                {closeMatchCount === 1 ? "already exists" : "already exist"} on GitHub.
              </>
            ) : (
              "No obvious fork target yet. We can widen the search or inspect a repo you already know."
            )}
          </span>
        </div>
        <p className="say">
          {isWeakSearch ? (
            recovery.reassurance
          ) : best ? (
            <>
              I&apos;d start with <strong>{best.fullName}</strong>. Why: {repoIdeaReason(best, prompt)}
            </>
          ) : (
            "I did not find a strong repo yet. Try a more specific product shape or name a repo you expected to see."
          )}
        </p>
        {best ? (
          <FeaturedRepo
            repo={best}
            idea={prompt}
            saved={isSavedRepo(best, savedRepos)}
            cautious={isWeakSearch}
            onOpen={onOpenRepo}
            onSave={onSaveRepo}
            onUse={(repo) => {
              onSelectStarter(repo);
              onStartBranding();
            }}
          />
        ) : null}
        {repos.length > 1 ? (
          <>
            <div className="others-label">
              <span>Other options</span>
            </div>
            {repos.slice(1, 3).map((repo) => (
              <CompactRepo key={repo.fullName} repo={repo} idea={prompt} onOpen={onOpenRepo} onUse={(chosen) => {
                onSelectStarter(chosen);
                onStartBranding();
              }} />
            ))}
          </>
        ) : null}
        {isWeakSearch ? (
          <div className="recovery-card">
            <div>
              <div className="nlbl">Recovery options</div>
              <h4>Try a cleaner search path</h4>
              <p>These options keep weak evidence labeled as weak while giving you a next move.</p>
            </div>
            <div className="recovery-actions">
              {recovery.actions.map((action) => (
                <button
                  className="suggest-chip"
                  key={action.kind}
                  type="button"
                  onClick={() => {
                    if (action.kind === "trending") go("trending");
                    else onFollowUp(action.prompt);
                  }}
                >
                  {action.kind === "known_repo" ? <Search size={13} /> : null}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {phase === "more" && repos.length > 3 ? (
          <>
            <div className="more-options-banner" style={{ marginTop: 14 }}>
              <span className="b-ico"><Check size={14} /></span>
              <div>Pulled <strong>{repos.length - 3} more</strong> repos from a wider GitHub scan. Quality can drop here, so treat these as lower-ranked options.</div>
            </div>
            {repos.slice(3).map((repo) => (
              <CompactRepo key={repo.fullName} repo={repo} idea={prompt} onOpen={onOpenRepo} onUse={(chosen) => {
                onSelectStarter(chosen);
                onStartBranding();
              }} />
            ))}
          </>
        ) : null}
        {!isWeakSearch && (phase === "results" || phase === "more") ? (
          <>
            <div className="next-step-card">
              <div>
                <div className="nlbl">Next step</div>
                <h4>This is the repo your AI should start from.</h4>
                <p>Next, ForkFirst turns it into a simple handoff: what to clone, what to keep, what to replace, and what to build first.</p>
              </div>
              <button className="btn accent" type="button" onClick={onStartBranding}>
                Create handoff <ArrowRight size={14} />
              </button>
            </div>
            <div className="suggest-row">
              {phase === "results" ? <button className="suggest-chip" type="button" onClick={() => go("more")}>Find more options</button> : null}
              <button className="suggest-chip" type="button" onClick={() => onFollowUp("Compare the top 3 side-by-side")}>Compare the top 3 side-by-side</button>
              <button className="suggest-chip" type="button" onClick={() => onFollowUp("What is the real opportunity gap?")}>What&apos;s the real opportunity gap?</button>
              <button className="suggest-chip" type="button" onClick={() => onFollowUp("Why these three?")}>Why these three?</button>
            </div>
          </>
        ) : null}
      </div>
      {phase === "branding" ? <BrandingInterview onComplete={onGenerate} onCancel={() => go("results", { scroll: "preserve" })} /> : null}
      {phase === "generating" ? <Generating brand={brand} result={result} selectedStarterRepo={selectedStarterRepo} onReady={onReady} /> : null}
      {phase === "ready" ? (
        <ReadyCard
          brand={brand}
          docs={readyDocs}
          onHandoff={() => go("handoff")}
          onCopy={onCopyHandoff}
          onDownload={onDownloadHandoff}
          onDownloadZip={onDownloadHandoffZip}
          onBuilderSelect={(target) => onBuilderSelect(target, "ready_card")}
        />
      ) : null}
      {followUps.map((turn, index) => (
        <div key={`${turn.role}-${index}-${turn.content.slice(0, 12)}`} className={`t ${turn.role === "user" ? "t-user" : "t-assist"}`}>
          {turn.role === "user" ? (
            <div className="bubble">{turn.content}</div>
          ) : (
            <>
              <div className="who">
                <Mark />
                <strong>ForkFirst</strong>
                <time>- now</time>
              </div>
              <FormattedChatMessage content={turn.content} />
              <InlineChatActions
                actions={turn.ui}
                actionResult={turn.result}
                currentResult={result}
                savedRepos={savedRepos}
                idea={turn.result?.prompt ?? prompt}
                onOpenRepo={onOpenRepo}
                onSaveRepo={onSaveRepo}
                onSelectStarter={onSelectStarter}
                onStartBranding={onStartBranding}
                onFollowUp={onFollowUp}
              />
            </>
          )}
        </div>
      ))}
      {sending ? (
        <div className="t t-assist">
          <div className="who">
            <Mark />
            <strong>ForkFirst</strong>
            <time>- thinking</time>
          </div>
          <div className="chat-thinking" aria-live="polite">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}
      <div ref={chatTailRef} className="chat-scroll-anchor" aria-hidden="true" />
    </section>
  );
}

function BrandingInterview({
  onComplete,
  onCancel
}: {
  onComplete: (brand: BrandAnswers) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState<BrandAnswers>({ ...DEFAULT_BRAND_ANSWERS, notList: [] });

  function done() {
    onComplete({ ...brand, name: brand.name.trim() || "Untitled app" });
  }

  return (
    <>
      <div className="t t-assist">
        <div className="who">
          <Mark />
          <strong>ForkFirst</strong>
          <time>- now</time>
        </div>
        <p className="say">
          Good. I&apos;ll turn this repo into a builder brief, not just a clone. These five quick answers tell your AI what product you actually want, what to keep from the foundation, and what to build first.
        </p>
        <div className="brand-question">
          <span className="bq-step">Step {step} of 5</span>
          {step === 1 ? (
            <>
              <h4>What are we turning this into?</h4>
              <p className="help">Give the builder the product name and the plain-English outcome, so it does not just re-skin the repo.</p>
              <input className="bq-input" autoFocus value={brand.name} onChange={(event) => setBrand({ ...brand, name: event.target.value })} placeholder="Product name, e.g. ClientNest" />
              <textarea className="bq-input bq-textarea" value={brand.productGoal} onChange={(event) => setBrand({ ...brand, productGoal: event.target.value })} placeholder="What should this become? e.g. A simple client portal where small agencies can share files, messages, approvals, and project updates." />
            </>
          ) : null}
          {step === 2 ? (
            <>
              <h4>Who is it for, and what pain should it solve?</h4>
              <p className="help">This makes the handoff speak to the user, not just the tech stack.</p>
              <textarea className="bq-input bq-textarea" autoFocus value={brand.audience} onChange={(event) => setBrand({ ...brand, audience: event.target.value })} placeholder="e.g. Solo consultants who need one place for clients to see deliverables, upload assets, and approve work without hunting through email." />
            </>
          ) : null}
          {step === 3 ? (
            <>
              <h4>What should work when you come back?</h4>
              <p className="help">Describe the first useful prototype moment. This becomes the first milestone your AI builder works toward.</p>
              <textarea className="bq-input bq-textarea" autoFocus value={brand.firstMilestone} onChange={(event) => setBrand({ ...brand, firstMilestone: event.target.value })} placeholder="e.g. A client can log in, open a project, view three shared files, leave a comment, and mark one item approved." />
            </>
          ) : null}
          {step === 4 ? (
            <>
              <h4>What should the builder keep, change, and add?</h4>
              <p className="help">This is the repo-to-your-product map. Short phrases are fine.</p>
              <textarea className="bq-input bq-textarea compact" autoFocus value={brand.keepFromRepo} onChange={(event) => setBrand({ ...brand, keepFromRepo: event.target.value })} placeholder="Keep from the repo: auth, dashboard layout, file upload flow, data model..." />
              <textarea className="bq-input bq-textarea compact" value={brand.replaceFromRepo} onChange={(event) => setBrand({ ...brand, replaceFromRepo: event.target.value })} placeholder="Replace: sample data, wording, colors, navigation, domain-specific assumptions..." />
              <textarea className="bq-input bq-textarea compact" value={brand.addToRepo} onChange={(event) => setBrand({ ...brand, addToRepo: event.target.value })} placeholder="Add: the one thing your idea needs that the repo does not already do..." />
            </>
          ) : null}
          {step === 5 ? (
            <>
              <h4>How should it feel, and what should it avoid?</h4>
              <p className="help">This gives the builder a design direction and guardrails so it does not overbuild.</p>
              <div className="vibe-row">
                {[
                  { id: "calm and trustworthy", name: "Calm + trustworthy", sub: "Clear, focused, low-noise" },
                  { id: "bold and modern", name: "Bold + modern", sub: "Confident, crisp, high contrast" },
                  { id: "friendly and simple", name: "Friendly + simple", sub: "Warm, approachable, non-techy" }
                ].map((vibe) => (
                  <button key={vibe.id} className={`vibe-card ${brand.vibe === vibe.id ? "selected" : ""}`} type="button" onClick={() => setBrand({ ...brand, vibe: vibe.id })}>
                    <strong>{vibe.name}</strong>
                    <span>{vibe.sub}</span>
                  </button>
                ))}
              </div>
              <textarea className="bq-input bq-textarea compact" value={brand.designNotes} onChange={(event) => setBrand({ ...brand, designNotes: event.target.value })} placeholder="Optional design notes: colors, tone, examples, or anything that should feel different from the starter repo." />
              <p className="help">Optional: tap only the things your first version should avoid.</p>
              <div className="not-grid">
                {["Billing", "Team accounts", "Admin dashboard", "Native app", "Browser extension", "Complex automations", "Public marketplace", "Analytics", "Email/SMS", "AI agents"].map((item) => {
                  const selected = brand.notList.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      className={selected ? "selected" : ""}
                      onClick={() =>
                        setBrand({
                          ...brand,
                          notList: selected ? brand.notList.filter((value) => value !== item) : [...brand.notList, item]
                        })
                      }
                    >
                      {selected ? <Check size={13} /> : null}
                      {item}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
          <div className="bq-foot">
            <button className="btn ghost compact" type="button" onClick={onCancel}>Back</button>
            <button className="bq-link" type="button" onClick={done}>Skip and create simple handoff</button>
            <button className="btn accent" type="button" onClick={() => (step < 5 ? setStep(step + 1) : done())}>
              {step < 5 ? "Next" : "Create handoff"} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function BrandRecap({ brand }: { brand: BrandAnswers | null }) {
  if (!brand) return null;
  return (
    <div className="t t-user">
      <div className="brand-summary" style={{ background: "var(--accent-soft)", borderColor: "color-mix(in srgb, var(--accent) 30%, var(--line))" }}>
        <div className="bs-row"><span className="k">Name</span><span className="v">{brand.name || "-"}</span></div>
        {brand.productGoal ? <div className="bs-row"><span className="k">Goal</span><span className="v">{brand.productGoal}</span></div> : null}
        {brand.audience ? <div className="bs-row"><span className="k">For</span><span className="v">{brand.audience}</span></div> : null}
        {brand.firstMilestone ? <div className="bs-row"><span className="k">First win</span><span className="v">{brand.firstMilestone}</span></div> : null}
        {brand.keepFromRepo || brand.replaceFromRepo || brand.addToRepo ? (
          <div className="bs-row"><span className="k">Repo map</span><span className="v">{[brand.keepFromRepo && `Keep: ${brand.keepFromRepo}`, brand.replaceFromRepo && `Change: ${brand.replaceFromRepo}`, brand.addToRepo && `Add: ${brand.addToRepo}`].filter(Boolean).join(" | ")}</span></div>
        ) : null}
        <div className="bs-row"><span className="k">Vibe</span><span className="v">{brand.vibe}</span></div>
        <div className="bs-row"><span className="k">Color</span><span className="v"><span className="sw" style={{ background: brand.color }} />{brand.color}</span></div>
        {brand.designNotes ? <div className="bs-row"><span className="k">Design</span><span className="v">{brand.designNotes}</span></div> : null}
        {brand.notList.length > 0 ? <div className="bs-row"><span className="k">Skip in v1</span><span className="v">{brand.notList.join(", ")}</span></div> : null}
      </div>
    </div>
  );
}

function StreamingDoc({ step, brand, result, selectedStarterRepo }: { step: number; brand: BrandAnswers | null; result?: IdeaCheckResult; selectedStarterRepo?: ClassifiedRepo | null }) {
  const starter = selectedStarterRepo?.fullName ?? result?.repos[0]?.fullName ?? "the recommended starter repo";
  const sections = [
    { h: "## STARTER_REPO", body: `**Foundation** - ${starter}\n**First move** - clone it, inspect setup and license, then write the handoff files in the repo root.` },
    { h: "## PRD", body: `**Name** - ${brand?.name || "Your app"}\n**Goal** - ${brand?.productGoal || "Turn the selected repo into the user's product idea."}\n**For** - ${brand?.audience || "the target user from the idea"}\n**Verdict** - ${result?.verdictLabel || "Strong fit"}. Start from ${starter}.` },
    { h: "## Build plan", body: `Phase 1 - ${brand?.firstMilestone || "Clone the repo, inspect the core flows, and ship the smallest useful workflow."}\nPhase 2 - Replace repo-specific assumptions with the user's product direction.\nPhase 3 - Add differentiators only after phase 1 works.` },
    { h: "## Brand", body: `**Vibe** - ${brand?.vibe || "calm"}.\n**Color** - ${brand?.color || "#2647F0"}.\n**Design notes** - ${brand?.designNotes || "Keep it simple, clear, and built around the first useful workflow."}` },
    { h: "## Don't build in v1", body: (brand?.notList.length ? brand.notList : ["User accounts", "Email digests"]).map((item) => `- ${item}`).join("\n") },
    { h: "## Agent rules", body: "Inspect before editing. Match existing code style. Keep the phase checklist current. Run verification before expanding scope." }
  ];
  const visible = Math.min(step + 1, sections.length);
  if (visible <= 0) return null;
  return (
    <div className="streaming-doc">
      {sections.slice(0, visible).map((section, index) => (
        <div key={section.h} className="sd-section">
          <div className="sd-h">{section.h}</div>
          <div style={{ whiteSpace: "pre-wrap" }}>
            {index === visible - 1 ? section.body.slice(0, Math.max(12, Math.floor((section.body.length * Math.min(step + 1, 5)) / 5))) : section.body}
            {index === visible - 1 ? <span className="caret" /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function Generating({
  brand,
  result,
  selectedStarterRepo,
  onReady
}: {
  brand: BrandAnswers | null;
  result: IdeaCheckResult;
  selectedStarterRepo: ClassifiedRepo | null;
  onReady: () => void;
}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [700, 1400, 2100, 2800, 3600].map((delay, index) => window.setTimeout(() => setStep(index + 1), delay));
    const done = window.setTimeout(onReady, 4400);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(done);
    };
  }, [onReady]);
  return (
    <>
      <BrandRecap brand={brand} />
      <div className="t t-assist">
        <div className="who">
          <Mark />
          <strong>ForkFirst</strong>
          <time>- now</time>
        </div>
        <p className="say">Got it. Turning the foundation into your AI-builder handoff.</p>
        <div className="generating-card">
          <div className="gc-eyebrow">Creating the AI handoff</div>
          <h4>{brand?.name || "Your app"} / {selectedStarterRepo?.fullName ?? result.repos[0]?.fullName ?? "starter repo"}</h4>
          <div className="gc-steps">
            {["Naming the starting repo", "Writing the product brief", "Writing the first build plan", "Adding builder instructions", "Packaging the handoff"].map((label, index) => (
              <div key={label} className={`gcs ${index < step ? "done" : ""}`}>
                <span className="gci" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <StreamingDoc step={step} brand={brand} result={result} selectedStarterRepo={selectedStarterRepo} />
      </div>
    </>
  );
}

function ReadyCard({
  brand,
  docs,
  onHandoff,
  onCopy,
  onDownload,
  onDownloadZip,
  onBuilderSelect
}: {
  brand: BrandAnswers | null;
  docs: HandoffDocuments;
  onHandoff: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDownloadZip: () => void;
  onBuilderSelect: (target: BuildTarget) => void;
}) {
  const [previewFile, setPreviewFile] = useState<HandoffDocTab | null>(null);
  const previewText = previewFile ? docs[previewFile] : "";
  const previewSwipeDown = useSwipeDownDismiss(() => setPreviewFile(null));
  return (
    <div className="t t-assist">
      <div className="who">
        <Mark />
        <strong>ForkFirst</strong>
        <time>- now</time>
      </div>
      <p className="say">Done. Download the zip, copy the prompt, then drop both into your AI builder and tell it to follow the handoff.</p>
      <div className="ready-card">
        <div className="ready-head">
          <span className="ready-ico">
            <Check size={18} />
          </span>
          <h4>{brand?.name || "Your app"} / AI-builder handoff</h4>
        </div>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13.5, lineHeight: 1.5 }}>
          This package tells your builder which repo to start from, what to keep, what to change, and what to build first.
        </p>
        <div className="handoff-next-steps" aria-label="Next steps for using this handoff">
          <span><strong>1</strong> Download the zip</span>
          <span><strong>2</strong> Copy the prompt</span>
          <span><strong>3</strong> Drop both into your AI builder</span>
        </div>
        <div className="handoff-builder-script">
          <strong>What to say next:</strong> Use this zip as the project handoff. Read the prompt first, inspect the starter repo, then follow the handoff and build Phase 1.
        </div>
        <div className="ready-files">
          {READY_FILE_DEFS.map(({ kind, file }) => (
            <button key={file} className="rf" type="button" onClick={() => setPreviewFile(file)}>
              <span className="ico">{kind}</span>
              <span>{file}</span>
              <span>open</span>
            </button>
          ))}
        </div>
        <div className="ready-actions">
          <button className="btn accent" type="button" onClick={onDownloadZip}>
            <Download size={14} /> Download zip
          </button>
          <button className="btn ghost" type="button" onClick={onCopy}>
            <Copy size={14} /> Copy prompt
          </button>
          <button className="btn ghost" type="button" onClick={onHandoff}>
            Preview/edit <ArrowRight size={14} />
          </button>
          <button className="btn ghost" type="button" onClick={onDownload}>
            <Download size={14} /> Download .md
          </button>
        </div>
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 16, marginTop: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>
            Send to your AI builder
          </div>
          <div className="send-to-row">
            {BUILD_TARGETS.filter((target) => target.id !== "generic").map((target) => (
              <button
                className="send-btn"
                type="button"
                onClick={() => {
                  onBuilderSelect(target.id);
                  if (target.id === "replit" || target.id === "lovable" || target.id === "v0") onDownload();
                  else onCopy();
                }}
                key={target.id}
              >
                <div className="send-row1">
                  <BuilderLogo target={target} />
                  {target.label}
                </div>
                <div className="send-sub">{target.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {previewFile ? (
        <div className="file-preview-layer" role="dialog" aria-modal="true" aria-label={`${previewFile} preview`}>
          <button className="file-preview-backdrop" type="button" aria-label="Close file preview" onClick={() => setPreviewFile(null)} />
          <div className="file-preview-modal">
            <div className="mobile-swipe-handle" aria-hidden="true" />
            <div className="file-preview-head" {...previewSwipeDown}>
              <div>
                <span>Build Pack file</span>
                <h3>{previewFile}</h3>
              </div>
              <button className="icon-btn" type="button" onClick={() => setPreviewFile(null)} aria-label="Close file preview">
                <X size={16} />
              </button>
            </div>
            <pre data-clarity-mask="true">{previewText}</pre>
            <div className="file-preview-foot">
              <button className="btn ghost" type="button" onClick={() => navigator.clipboard.writeText(previewText)}>
                <Copy size={14} /> Copy this file
              </button>
              <button className="btn accent" type="button" onClick={onHandoff}>
                Open full preview <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RepoDrawer({
  repo,
  idea,
  saved,
  onClose,
  onSave,
  onUse
}: {
  repo: ClassifiedRepo | null;
  idea: string;
  saved: boolean;
  onClose: () => void;
  onSave: (repo: ClassifiedRepo) => void;
  onUse: (repo: ClassifiedRepo) => void;
}) {
  const [tab, setTab] = useState("overview");
  const swipeDown = useSwipeDownDismiss(onClose);
  useEffect(() => {
    if (repo) setTab("overview");
  }, [repo]);
  if (!repo) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer">
        <div className="mobile-swipe-handle" aria-hidden="true" />
        <div className="drawer-head" {...swipeDown}>
          <button className="close" type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
          <div className="title">
            <div className="name">{repo.fullName}</div>
            <div className="sub">{repoCategoryLabel(repo)} / {repo.license ?? "Inspect license"} / {repo.language ?? "Mixed"}</div>
          </div>
          <button className="icon-btn" title={saved ? "Saved" : "Save"} type="button" onClick={() => onSave(repo)}>
            {saved ? <Check size={15} /> : <Bookmark size={15} />}
          </button>
        </div>
        <div className="drawer-body">
          <div className="repo-hero">
            <div>
              <span className={`tag ${repoTagClass(repo)}`}>{repoCategoryLabel(repo)}</span>
              <h2>{repo.fullName}</h2>
            </div>
            <div>
              <div className="score-big">{repo.score.total}%</div>
              <div className="score-lbl">Fit for your idea</div>
            </div>
          </div>
          <div className="repo-tabs">
            {["overview", "readme", "why this fits", "stats"].map((item) => (
              <button key={item} className={`repo-tab ${tab === item ? "is-active" : ""}`} type="button" onClick={() => setTab(item)}>
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          {tab === "overview" ? (
            <>
              <div className="readme-plain repo-explain-card">
                <strong>Non-technical read</strong>
                <p>{repoWhat(repo)}</p>
                <p>{repoBestUse(repo, idea)}</p>
              </div>
              <div className="repo-section"><h3>Why this showed up</h3><p>{repoWhyShown(repo, idea)}</p></div>
              <div className="repo-section"><h3>Why this might help</h3><p>{repoWhy(repo, idea)}</p></div>
              <div className="repo-section"><h3>Watch out for</h3><p>{repoWatch(repo)}</p></div>
              <div className="repo-section"><h3>Your next move</h3><p>{repoNext(repo, idea)}</p></div>
            </>
          ) : null}
          {tab === "readme" ? (
            <div className="repo-section">
              <h3>README, translated</h3>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>A plain-English read of the repo docs, plus the cleaned excerpt below for verification.</p>
              <div className="readme-plain">
                <strong>What a non-technical user should know</strong>
                <p>{repoPlainEnglish(repo)}</p>
                <div className="readme-signals">
                  {repoReadmeBullets(repo).map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
              <div className="repo-readme" data-clarity-mask="true">{cleanReadmeText(repo.readme?.excerpt) || repoSummary(repo)}</div>
            </div>
          ) : null}
          {tab === "why this fits" ? (
            <div className="repo-section">
              <h3>Fit reasoning</h3>
              <p>{repoIdeaReason(repo, idea)}</p>
              <div className="fit-reason-grid">
                <div><span>Idea overlap</span><strong>{matchedIdeaTerms(repo, idea).length ? formatTerms(matchedIdeaTerms(repo, idea)) : "Closest search lead"}</strong></div>
                <div><span>Fit score</span><strong>{repo.score.fit}%</strong></div>
                <div><span>Docs score</span><strong>{repo.score.docs}%</strong></div>
                <div><span>Reuse type</span><strong>{repoCategoryLabel(repo)}</strong></div>
              </div>
              {repoSignals(repo, 4).map((reason) => (
                <p key={reason} style={{ marginBottom: 8 }}>{reason}</p>
              ))}
              <p style={{ marginBottom: 8 }}><strong style={{ color: "var(--ink)" }}>Risk:</strong> {repoWatch(repo)}</p>
            </div>
          ) : null}
          {tab === "stats" ? (
            <div className="repo-section">
              <h3>Repository stats</h3>
              <div className="kv"><span className="k">Stars</span><span className="v">{repo.stars.toLocaleString()}</span></div>
              <div className="kv"><span className="k">Forks</span><span className="v">{repo.forks.toLocaleString()}</span></div>
              <div className="kv"><span className="k">Language</span><span className="v">{repo.language ?? "Mixed"}</span></div>
              <div className="kv"><span className="k">License</span><span className="v">{repo.license ?? "Inspect"}</span></div>
              {safeExternalUrl(repo.homepage) ? <div className="kv"><span className="k">Project site</span><span className="v"><a href={safeExternalUrl(repo.homepage) ?? "#"} target="_blank" rel="noreferrer">{safeExternalUrl(repo.homepage)}</a></span></div> : null}
              <div className="kv"><span className="k">Last commit</span><span className="v">{repo.pushedAt ? new Date(repo.pushedAt).toLocaleDateString() : "Inspect"}</span></div>
            </div>
          ) : null}
        </div>
        <div className="drawer-foot">
          <button className="btn accent" type="button" onClick={() => onUse(repo)}>Use</button>
          <RepoSiteLink url={repo.homepage} />
          <a className="btn ghost" href={repo.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open on GitHub</a>
          <button className="btn ghost" type="button" onClick={() => onSave(repo)}>{saved ? <Check size={14} /> : <Bookmark size={14} />} {saved ? "Saved" : "Save"}</button>
        </div>
      </aside>
    </>
  );
}

function HandoffView({
  result,
  brand,
  selectedStarterRepo,
  followUps,
  promptPackState,
  prompt,
  activeChatId,
  activeBuildPack,
  onCopy,
  onDownloadZip,
  onSaveBuildPack
}: {
  result: IdeaCheckResult | null;
  brand: BrandAnswers | null;
  selectedStarterRepo: ClassifiedRepo | null;
  followUps: ChatTurn[];
  promptPackState: PromptPackState;
  prompt: string;
  activeChatId: string | null;
  activeBuildPack: SavedBuildPack | null;
  onCopy: (text: string) => void;
  onDownloadZip: (filename: string, docs: HandoffDocuments, markdown: string) => void;
  onSaveBuildPack: (pack: SavedBuildPack) => void;
}) {
  const [tab, setTab] = useState<HandoffDocTab>("PRD.md");
  const [target, setTarget] = useState<BuildTarget>((activeBuildPack?.target as BuildTarget) || "claude-code");
  const [localVersions, setLocalVersions] = useState<SavedBuildPackVersion[]>(activeBuildPack?.versions ?? []);
  useEffect(() => {
    if (activeBuildPack?.target) setTarget(activeBuildPack.target as BuildTarget);
  }, [activeBuildPack?.id, activeBuildPack?.target]);
  useEffect(() => {
    setLocalVersions(activeBuildPack?.versions ?? []);
  }, [activeBuildPack?.id, activeBuildPack?.versions]);
  const generatedMarkdown = useMemo(() => {
    if (!result) return "# Builder Handoff\n\nRun an idea check first.";
    return buildProjectBuildPack(result, target, selectedStarterRepo ?? result.repos[0], buildPackPreferences(brand, followUps), enabledPackMarkdown(promptPackState));
  }, [brand, followUps, promptPackState, result, selectedStarterRepo, target]);
  const sourceMarkdown = activeBuildPack?.markdown || generatedMarkdown;
  const generatedIntro = useMemo(() => handoffIntro(sourceMarkdown), [sourceMarkdown]);
  const generatedDocs = useMemo(() => createHandoffDocuments(sourceMarkdown), [sourceMarkdown]);
  const [docs, setDocs] = useState<HandoffDocuments>(generatedDocs);
  useEffect(() => {
    setDocs(generatedDocs);
    setTab("STARTER_REPO.md");
  }, [activeBuildPack?.id, generatedDocs, target]);
  const markdown = useMemo(() => composeHandoffMarkdown(generatedIntro, docs), [docs, generatedIntro]);
  const handoffTokens = estimateHandoffTokens(markdown);
  const activeDoc = docs[tab] ?? "";
  const starterRepo = selectedStarterRepo ?? result?.repos[0] ?? null;
  const starterName = activeBuildPack?.starterRepo || starterRepo?.fullName || "No starter selected";
  const checks = qualityItems({ result, brand, starterRepo, followUps, promptPackState, docs });
  const score = qualityScore(checks);
  const packTitle = buildPackTitle(result, brand, activeBuildPack);
  const pack = useMemo<SavedBuildPack>(() => ({
    id: buildPackId(result, activeBuildPack),
    title: packTitle,
    idea: result?.prompt || activeBuildPack?.idea || "",
    starterRepo: starterName,
    target,
    markdown,
    tokenEstimate: handoffTokens,
    qualityScore: score,
    status: activeBuildPack?.status ?? "draft",
    createdAt: activeBuildPack?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workspace: buildPackWorkspaceSnapshot({
      result,
      brand,
      selectedStarterRepo,
      followUps,
      promptPackState,
      prompt: result?.prompt || prompt || activeBuildPack?.idea || "",
      activeChatId
    }),
    versions: localVersions
  }), [activeBuildPack, activeChatId, brand, followUps, handoffTokens, localVersions, markdown, packTitle, prompt, promptPackState, result, score, selectedStarterRepo, starterName, target]);
  const canExport = isMeaningfulBuildPack(pack);
  const restoreVersion = useCallback((version: SavedBuildPackVersion) => {
    setDocs(createHandoffDocuments(version.markdown));
    setTab("STARTER_REPO.md");
  }, []);
  const saveWithVersion = useCallback((label: string, status: SavedBuildPack["status"]) => {
    const next = withBuildPackVersion({ ...pack, status }, label);
    setLocalVersions(next.versions ?? []);
    onSaveBuildPack(next);
    return next;
  }, [onSaveBuildPack, pack]);
  useEffect(() => {
    if (!canExport) return;
    if (markdown.trim().length < 60) return;
    const timer = window.setTimeout(() => onSaveBuildPack({ ...pack, status: "draft" }), 500);
    return () => window.clearTimeout(timer);
  }, [canExport, markdown, onSaveBuildPack, pack]);
  return (
    <section className="handoff" data-screen-label="05 Handoff">
      <div className="handoff-head">
        <div>
          <h2>
            Builder <span>Handoff</span>
            <small>One packet for {BUILD_TARGETS.find((item) => item.id === target)?.label ?? "your AI builder"}. Drop it in and let it read from the top.</small>
          </h2>
          <p className="handoff-subline">{starterName} to {packTitle}. Repo, prompt, and build files your AI builder can follow.</p>
        </div>
        <div className="handoff-actions">
          <div className="handoff-token-pill" title="Estimated tokens in this handoff">
            ~{formatTokensShort(handoffTokens)} tokens
          </div>
          <div className="handoff-actions-main">
            <button className="btn ghost" type="button" onClick={() => onCopy(markdown)}>
              <Copy size={14} /> Copy
            </button>
            <button className="btn accent" type="button" disabled={!canExport} onClick={() => {
              saveWithVersion("Exported .zip", "exported");
              onDownloadZip("forkfirst-build-pack.zip", docs, markdown);
            }}>
              <Download size={14} /> Download .zip
            </button>
          </div>
        </div>
      </div>
      <div className="handoff-grid">
        <div className="handoff-utility">
          <div className="handoff-side">
            <div className="card">
              <h3>Send to</h3>
              <p>Pick your builder. ForkFirst tunes the handoff for how that tool likes to be talked to.</p>
              <div className="target-row">
                {BUILD_TARGETS.map((item) => (
                  <button
                    key={item.id}
                    className={`target ${target === item.id ? "is-active" : ""}`}
                    type="button"
                    onClick={() => {
                      trackForkFirstEvent("builder_selected", { target: item.id, source: "handoff_view" });
                      setTarget(item.id);
                    }}
                  >
                    <BuilderLogo target={item} />
                    <span>{item.label}</span>
                    <small>{item.sub}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="card">
              <h3>What&apos;s in the folder</h3>
              <p>Six handoff files. Put them in the cloned starter repo root so your AI builder reads the foundation, product, brand, plan, and rules together.</p>
              <div className="file-list">
                {[
                  ["STR", "STARTER_REPO.md", formatByteSize(docs["STARTER_REPO.md"]), "accent"],
                  ["PRD", "PRD.md", formatByteSize(docs["PRD.md"]), ""],
                  ["AGT", "AGENTS.md", formatByteSize(docs["AGENTS.md"]), ""],
                  ["PLN", "BUILD_PLAN.md", formatByteSize(docs["BUILD_PLAN.md"]), ""],
                  ["CLD", "CLAUDE.md", formatByteSize(docs["CLAUDE.md"]), ""],
                  ["RPO", "REPO_STARTER_NOTES.md", formatByteSize(docs["REPO_STARTER_NOTES.md"]), ""]
                ].map(([kind, file, size, tone]) => (
                  <button
                    key={file}
                    className={`f ${tone} ${tab === file ? "is-active" : ""}`}
                    type="button"
                    onClick={() => {
                      if (HANDOFF_DOC_TABS.includes(file as HandoffDocTab)) setTab(file as HandoffDocTab);
                    }}
                    disabled={!HANDOFF_DOC_TABS.includes(file as HandoffDocTab)}
                  >
                    <span className="ico">{kind}</span>
                    <span>{file}</span>
                    <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>{size}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="card version-card compact-version-card">
            <h3>Recent versions</h3>
            <div className="version-list">
              {(pack.versions ?? []).length ? (pack.versions ?? []).slice(0, 2).map((version) => (
                <button key={version.id} type="button" onClick={() => restoreVersion(version)}>
                  <strong>{version.label}</strong>
                  <span>{new Date(version.createdAt).toLocaleString()} - ~{formatTokensShort(version.tokenEstimate)}</span>
                </button>
              )) : <span className="empty-note">No manual versions yet.</span>}
            </div>
          </div>
        </div>
        <div className="handoff-doc">
          <div className="tabs">
            {HANDOFF_DOC_TABS.map((item) => (
              <button key={item} className={`tab ${tab === item ? "is-active" : ""}`} type="button" onClick={() => setTab(item)} title={item}>{HANDOFF_DOC_TAB_LABELS[item]}</button>
            ))}
          </div>
          <div className="doc-meta">
            <div className="doc-meta-copy">
              <span>{tab}</span>
              <span>{formatByteSize(activeDoc)}</span>
              <span>Autosaved locally - copy and download use your latest edits.</span>
            </div>
            <button
              className="doc-copy-btn"
              type="button"
              onClick={() => onCopy(activeDoc)}
              aria-label={`Copy ${tab}`}
              title={`Copy ${tab}`}
            >
              <Copy size={14} />
              <span>Copy file</span>
            </button>
          </div>
          <div className="doc-body" data-clarity-mask="true">
            <textarea
              aria-label={`${tab} editable Markdown`}
              spellCheck={false}
              value={activeDoc}
              onChange={(event) => setDocs((current) => ({ ...current, [tab]: event.target.value }))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SavedBuildPackCard({
  pack,
  openLabel = "Open",
  onOpenBuildPack,
  onDeleteBuildPack,
  onDownloadBuildPack
}: {
  pack: SavedBuildPack;
  openLabel?: string;
  onOpenBuildPack: (pack: SavedBuildPack) => void;
  onDeleteBuildPack: (packId: string) => void;
  onDownloadBuildPack: (pack: SavedBuildPack) => void;
}) {
  const fileCount = buildPackDocCount(pack);
  return (
    <article className="build-pack-card saved-handoff-card">
      <div className="top">
        <div>
          <strong>{capitalizeFirstTitle(pack.title)}</strong>
          <span>Foundation: {pack.starterRepo || "No starter selected"}</span>
        </div>
        <span className={`status ${pack.status}`}>{pack.status}</span>
      </div>
      <p>{pack.idea || "Saved builder handoff draft."}</p>
      <div className="pack-next">
        <span>Next</span>
        <strong>Open to review, copy, or download the zip for your AI builder.</strong>
      </div>
      <div className="pack-meta">
        <span>{pack.qualityScore}% ready</span>
        <span>{fileCount} files</span>
        <span>{buildPackTargetLabel(pack)}</span>
        <span>Updated {buildPackUpdatedLabel(pack) || "recently"}</span>
      </div>
      <div className="pack-actions">
        <button className="btn accent" type="button" onClick={() => onOpenBuildPack(pack)}>{openLabel}</button>
        <button className="btn ghost" type="button" onClick={() => onDownloadBuildPack(pack)}><Download size={13} /> .md</button>
        <button className="btn ghost danger" type="button" onClick={() => onDeleteBuildPack(pack.id)}>Delete</button>
      </div>
    </article>
  );
}

function HandoffSavedPacksScreen({
  savedBuildPacks,
  onOpenBuildPack,
  onDeleteBuildPack,
  onDownloadBuildPack,
  onStartNewIdea
}: {
  savedBuildPacks: SavedBuildPack[];
  onOpenBuildPack: (pack: SavedBuildPack) => void;
  onDeleteBuildPack: (packId: string) => void;
  onDownloadBuildPack: (pack: SavedBuildPack) => void;
  onStartNewIdea: () => void;
}) {
  const [query, setQuery] = useState("");
  const filteredPacks = savedBuildPacks.filter((pack) => includesSmartSearch([
    pack.title,
    pack.idea,
    pack.starterRepo,
    pack.target,
    pack.status,
    pack.markdown
  ].join(" "), query));

  return (
    <section className="handoff handoff-library" data-screen-label="05 Handoff library">
      <div className="handoff-library-hero">
        <div>
          <span className="eyebrow">Builder handoffs</span>
          <h2>Saved <span className="accent-word">Handoffs</span></h2>
          <p>
            Your generated handoffs live here as local drafts. Open one to preview, edit,
            export, or restore the full package.
          </p>
        </div>
      </div>
      <div className="smart-search">
        <span aria-hidden="true">Search</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Smart search handoffs by idea, repo, builder, or packet text..."
          aria-label="Search saved handoffs"
        />
        {query ? <button type="button" onClick={() => setQuery("")}>Clear</button> : null}
      </div>
      <div className="library-section-head">
        <div>
          <span className="eyebrow">Saved handoffs</span>
          <h3>Builder handoffs</h3>
        </div>
        <span>{query ? `${filteredPacks.length} of ${savedBuildPacks.length}` : `${savedBuildPacks.length} saved`}</span>
      </div>
      <div className="build-pack-grid handoff-pack-grid">
        {filteredPacks.length ? filteredPacks.map((pack) => (
          <SavedBuildPackCard
            key={pack.id}
            pack={pack}
            openLabel="Open"
            onOpenBuildPack={onOpenBuildPack}
            onDeleteBuildPack={onDeleteBuildPack}
            onDownloadBuildPack={onDownloadBuildPack}
          />
        )) : (
          <article className="build-pack-card empty handoff-empty-pack">
            <strong>{savedBuildPacks.length ? "No matching handoffs" : "No saved handoffs yet"}</strong>
            <p>{savedBuildPacks.length ? "Try a repo name, product phrase, builder, or file name." : "Run an idea check, pick a foundation, and generate the Builder Handoff. ForkFirst will autosave it here."}</p>
            {!savedBuildPacks.length ? (
              <button className="btn accent" type="button" onClick={onStartNewIdea}>
                <Plus size={14} /> Start with an idea
              </button>
            ) : null}
          </article>
        )}
      </div>
    </section>
  );
}

function LibraryScreen({
  savedRepos,
  savedRepoBoards,
  onOpen,
  onUseRepo,
  onSetBoard,
  onCopyClone
}: {
  savedRepos: ClassifiedRepo[];
  savedRepoBoards: Record<string, string>;
  onOpen: (repo: ClassifiedRepo) => void;
  onUseRepo: (repo: ClassifiedRepo) => void;
  onSetBoard: (repo: ClassifiedRepo, board: string) => void;
  onCopyClone: (repo: ClassifiedRepo) => void;
}) {
  const [query, setQuery] = useState("");
  const filteredRepos = savedRepos.filter((repo) => includesSmartSearch([
    repo.fullName,
    repo.description,
    repo.summary,
    repo.language ?? "",
    repo.license ?? "",
    repo.category,
    repoBoardLabel(repo, savedRepoBoards),
    repo.topics.join(" ")
  ].join(" "), query));

  return (
    <section className="library" data-screen-label="06 Saved Repos">
      <h2>Saved <span className="accent-word">Repos</span></h2>
      <p style={{ color: "var(--muted)", margin: "0 0 24px", fontSize: 15 }}>
        Repos you saved from results and trending. None of this is on a server - it lives in your browser.
      </p>
      <div className="smart-search">
        <span aria-hidden="true">Search</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search saved repos by name, board, language, or topic..."
          aria-label="Search saved repos"
        />
        {query ? <button type="button" onClick={() => setQuery("")}>Clear</button> : null}
      </div>
      <div className="lib-grid">
        {filteredRepos.length ? filteredRepos.map((repo) => (
          <article key={repo.fullName} className="lib-card">
            <div className="top">
              <button className="nm" type="button" onClick={() => onOpen(repo)}>{repo.fullName}</button>
              <button
                className="lib-copy-clone"
                type="button"
                onClick={() => onCopyClone(repo)}
                aria-label={`Copy clone command for ${repo.fullName}`}
                title="Copy clone command"
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="d">{repoSummary(repo)}</div>
            <div className="row">
              <span><Star size={12} /> {repo.stars.toLocaleString()}</span>
              <span><GitFork size={12} /> {repo.forks.toLocaleString()}</span>
              <span>{repo.license ?? "Inspect"}</span>
            </div>
            <div className="lib-actions">
              <button className="btn accent" type="button" onClick={() => onUseRepo(repo)}>Use</button>
              <button className="btn ghost" type="button" onClick={() => onOpen(repo)}>Details</button>
              <RepoSiteLink url={repo.homepage} />
              <a className="btn ghost icon-only" href={repo.url} target="_blank" rel="noreferrer" aria-label={`Open ${repo.fullName} on GitHub`}>
                <ExternalLink size={13} />
              </a>
            </div>
            <BoardPicker
              value={repoBoardLabel(repo, savedRepoBoards)}
              onChange={(board) => onSetBoard(repo, board)}
              label={`Board for ${repo.fullName}`}
            />
          </article>
        )) : (
          <article className="lib-card">
            <div className="top"><span className="nm">{savedRepos.length ? "No matching repos" : "No saved repos yet"}</span></div>
            <div className="d">{savedRepos.length ? "Try a repo name, language, board, license, or topic." : "Save a repo from results or trending and it will appear here with board assignment."}</div>
          </article>
        )}
      </div>
    </section>
  );
}

function BoardPicker({ value, onChange, label }: { value: string; onChange: (board: string) => void; label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`board-picker ${open ? "open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="board-picker-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div className="board-picker-menu" role="listbox" aria-label={label}>
          {repoBoards.map((board) => (
            <button
              key={board}
              type="button"
              role="option"
              aria-selected={board === value}
              className={board === value ? "selected" : ""}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(board);
                setOpen(false);
              }}
            >
              <span>{board}</span>
              {board === value ? <Check size={14} aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function usageActionLabel(action: UsageEntry["action"]) {
  if (action === "idea-check") return "Idea check";
  if (action === "verify-keys") return "Key verification";
  if (action === "trending") return "Trending";
  return "Chat follow-up";
}

function UsageSettingsPanel({
  usageEntries,
  savingsLog,
  onResetUsage
}: {
  usageEntries: UsageEntry[];
  savingsLog: SavingsLog;
  onResetUsage: () => void;
}) {
  const usageSummary = summarizeUsage(usageEntries);
  const aiEntries = usageEntries.filter((entry) => entry.estimatedCostUsd > 0);
  const last = usageEntries[0];

  return (
    <section className="settings-group usage-settings" aria-label="Usage and estimated costs">
      <div className="usage-settings-head">
        <div>
          <h3>Usage and estimated costs</h3>
          <p className="help">
            Local estimate only. ForkFirst counts requests from this browser and estimates AI token cost from text length.
            Your provider dashboard is the billing source of truth.
          </p>
        </div>
        <button className="btn ghost" type="button" onClick={onResetUsage} disabled={usageEntries.length === 0}>
          Reset estimate
        </button>
      </div>
      <div className="usage-metrics">
        <div>
          <span>Estimated AI cost</span>
          <strong>{formatEstimatedCost(usageSummary.estimatedCostUsd)}</strong>
        </div>
        <div>
          <span>API calls tracked</span>
          <strong>{usageSummary.entries.toLocaleString()}</strong>
        </div>
        <div>
          <span>Estimated tokens</span>
          <strong>{formatTokensShort(usageSummary.inputTokens + usageSummary.outputTokens)}</strong>
        </div>
        <div>
          <span>Handoff exports</span>
          <strong>{savingsLog.count.toLocaleString()}</strong>
        </div>
      </div>
      <div className="usage-detail-grid">
        <div className="usage-note-card">
          <strong>What gets counted</strong>
          <p>Key verification, idea checks, and chat follow-ups. GitHub/demo calls are tracked as zero-cost estimates; AI calls use preset provider rates.</p>
        </div>
        <div className="usage-note-card">
          <strong>Current estimate</strong>
          <p>{aiEntries.length ? `${aiEntries.length} paid-provider estimate${aiEntries.length === 1 ? "" : "s"} included.` : "No paid-provider AI usage logged in this browser yet."}</p>
        </div>
      </div>
      <div className="usage-history" aria-label="Recent usage estimates">
        {usageEntries.length ? usageEntries.slice(0, 6).map((entry) => (
          <div key={entry.id} className="usage-history-row">
            <div>
              <strong>{usageActionLabel(entry.action)}</strong>
              <span>{entry.provider} / {entry.model}</span>
            </div>
            <div>
              <strong>{formatEstimatedCost(entry.estimatedCostUsd)}</strong>
              <span>{(entry.inputTokens + entry.outputTokens).toLocaleString()} est. tokens</span>
            </div>
          </div>
        )) : (
          <div className="usage-empty">
            <strong>No usage logged yet</strong>
            <span>Run an idea check or chat with a report and estimates will appear here.</span>
          </div>
        )}
      </div>
      {last ? <p className="usage-last">Last estimate used {last.rateLabel}.</p> : null}
    </section>
  );
}

function SettingsScreen({
  keys,
  accent,
  usageEntries,
  savingsLog,
  onAccentChange,
  onChange,
  verification,
  verifying,
  onVerify,
  rememberKeys,
  onRememberKeysChange,
  onClearAllData,
  onShowWelcome,
  onResetUsage
}: {
  keys: UserKeys;
  accent: RedesignAccent;
  usageEntries: UsageEntry[];
  savingsLog: SavingsLog;
  onAccentChange: (accent: RedesignAccent) => void;
  onChange: (keys: UserKeys) => void;
  verification: KeyVerificationState;
  verifying: boolean;
  onVerify: (keys: UserKeys) => void;
  rememberKeys: boolean;
  onRememberKeysChange: (remember: boolean) => void;
  onClearAllData: () => void;
  onShowWelcome: () => void;
  onResetUsage: () => void;
}) {
  const [installStatus, setInstallStatus] = useState<"installed" | "ready" | "ios" | "unavailable">("unavailable");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("appearance");
  const usageSummary = summarizeUsage(usageEntries);
  const settingsTabs: Array<{ id: SettingsTab; label: string; description: string; meta: string }> = [
    { id: "appearance", label: "Appearance", description: "Theme accent and brand color.", meta: ACCENT_OPTIONS.find((option) => option.id === accent)?.label ?? "Accent" },
    { id: "keys", label: "Keys & privacy", description: "BYOK providers and local storage.", meta: verification.github === "verified" || verification.ai === "verified" ? "Verified" : keys.githubToken || keys.aiApiKey ? "Saved" : "Optional" },
    { id: "usage", label: "Usage", description: "API calls, tokens, and cost estimates.", meta: `${usageSummary.entries.toLocaleString()} calls` },
    { id: "install", label: "Install", description: "Optional device shortcut.", meta: installStatus === "installed" ? "Installed" : "Optional" }
  ];

  useEffect(() => {
    const refresh = () => {
      if (isStandalonePwa()) {
        setInstallStatus("installed");
      } else if (isIOSDevice()) {
        setInstallStatus("ios");
      } else if (getDeferredInstallPrompt()) {
        setInstallStatus("ready");
      } else {
        setInstallStatus("unavailable");
      }
    };

    refresh();
    window.addEventListener(INSTALL_EVENT_NAME, refresh);
    return () => window.removeEventListener(INSTALL_EVENT_NAME, refresh);
  }, []);

  const handleInstallFromSettings = async () => {
    restoreInstallPrompt();
    const outcome = await requestPwaInstall();
    if (outcome === "ios") {
      window.alert("Tap the Share button below, then select 'Add to Home Screen'.");
    } else if (outcome === "unavailable") {
      window.alert("Your browser has not made install available yet. Try Chrome/Edge, or use the browser menu to install this app.");
    }
    if (outcome === "accepted" || outcome === "installed") {
      setInstallStatus("installed");
    }
  };

  return (
    <section className="settings" data-screen-label="07 Settings">
      <div className="settings-heading">
        <div>
          <h2>Settings</h2>
          <p className="sub">Session-only by default. Tune the app, providers, privacy, usage, and install options from one place.</p>
        </div>
      </div>
      <div className="settings-layout">
        <nav className="settings-subnav" aria-label="Settings sections">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              className={settingsTab === tab.id ? "active" : ""}
              type="button"
              onClick={() => setSettingsTab(tab.id)}
            >
              <span>
                <strong>{tab.label}</strong>
                <em>{tab.description}</em>
              </span>
              <small>{tab.meta}</small>
            </button>
          ))}
        </nav>
        <div className="settings-panel">
          {settingsTab === "appearance" ? (
            <section className="settings-group accent-settings">
              <div>
                <span className="eyebrow">Appearance</span>
                <h3>Accent color</h3>
                <p className="help">Pick the signature color for buttons, links, highlights, and active states. Light and dark mode keep the same choice.</p>
              </div>
              <div className="accent-picker" role="radiogroup" aria-label="Accent color">
                {ACCENT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    className={`accent-choice ${accent === option.id ? "selected" : ""}`}
                    type="button"
                    role="radio"
                    aria-checked={accent === option.id}
                    onClick={() => onAccentChange(option.id)}
                  >
                    <span className="accent-swatch" style={{ background: option.color }} />
                    <span>{option.label}</span>
                    {accent === option.id ? <Check size={14} /> : null}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          {settingsTab === "keys" ? (
            <div data-clarity-mask="true">
              <KeySettings
                keys={keys}
                onChange={onChange}
                verification={verification}
                verifying={verifying}
                onVerify={onVerify}
                rememberKeys={rememberKeys}
                onRememberKeysChange={onRememberKeysChange}
                onClearAllData={onClearAllData}
                onShowWelcome={onShowWelcome}
              />
            </div>
          ) : null}
          {settingsTab === "usage" ? (
            <UsageSettingsPanel usageEntries={usageEntries} savingsLog={savingsLog} onResetUsage={onResetUsage} />
          ) : null}
          {settingsTab === "install" ? (
            <section className="settings-utility" aria-label="Device shortcut">
              <div>
                <span className="eyebrow">Device shortcut</span>
                <strong>Install ForkFirst app</strong>
                <p>
                  Optional launcher for this device. The website works normally without installing.
                </p>
              </div>
              <button className="btn ghost" type="button" onClick={handleInstallFromSettings} disabled={installStatus === "installed"}>
                {installStatus === "installed" ? "Installed" : installStatus === "ios" ? "Show how" : "Install"}
              </button>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}


function LiveTrendingScreen({
  savedRepos,
  onSaveRepo,
  onSelectFoundation
}: {
  savedRepos: ClassifiedRepo[];
  onSaveRepo: (repo: ClassifiedRepo) => void;
  onSelectFoundation: (repo: FoundationDraft) => void;
}) {
  const [cat, setCat] = useState<TrendingCategory["id"]>("all");
  const [detailsRepo, setDetailsRepo] = useState<TrendingRepo | null>(null);
  const [query, setQuery] = useState("");
  const trending = useTrendingRepos(cat);
  const activeCategory = TRENDING_CATEGORIES.find((item) => item.id === cat);
  const visibleTrendingRepos = trending.repos.filter((repo) => includesSmartSearch([
    repo.fullName,
    repo.description,
    repo.language ?? "",
    repo.license ?? "",
    repo.topics.join(" ")
  ].join(" "), query));

  return (
    <>
      <section className="trending" data-screen-label="09 Trending">
        <div className="trending-hero">
          <div>
            <h2>Pick a repo <span className="accent-word">foundation.</span></h2>
            <p>Fresh GitHub repos updated daily. Browse what builders are starring now, then use one as the starting point for a new ForkFirst chat.</p>
          </div>
          <div className="right"><span className="pulse" /> Daily GitHub Search</div>
        </div>
        <div className="cat-row">
          {TRENDING_CATEGORIES.map((item) => (
            <button key={item.id} className={`cat-pill ${cat === item.id ? "active" : ""}`} type="button" onClick={() => setCat(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="smart-search trending-search">
          <span aria-hidden="true">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Smart search trending by repo, topic, language, or license..."
            aria-label="Search trending repos"
          />
          {query ? <button type="button" onClick={() => setQuery("")}>Clear</button> : null}
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "-10px 0 20px" }}>
          {activeCategory?.blurb} Results come from recently pushed public repos, sorted by stars, and cached for about 24 hours.
        </p>
        <div className="trending-grid">
          {trending.status === "loading" ? [1, 2, 3].map((item) => (
            <article key={item} className="trend-card">
              <span className="stars-up">Loading from GitHub</span>
              <span className="nm">Fetching live repos...</span>
              <p className="desc">No static trend data is displayed here.</p>
            </article>
          )) : null}
          {trending.status === "error" ? (
            <article className="trend-card">
              <span className="stars-up">GitHub unavailable</span>
              <span className="nm">Could not load live trending repos</span>
              <p className="desc">Try again later or paste a repo on the New screen.</p>
            </article>
          ) : null}
          {trending.status === "ok" ? visibleTrendingRepos.map((repo) => {
            const asSavedRepo = classifiedFromTrendingRepo(repo, activeCategory);
            const saved = isSavedRepo(asSavedRepo, savedRepos);
            return (
            <article key={repo.fullName} className="trend-card">
              <button className="nm" type="button" onClick={() => setDetailsRepo(repo)}>
                {repo.fullName}
              </button>
              <p className="desc">{repo.description || "No GitHub description provided."}</p>
              <div className="meta">
                <span><GitHubStarIcon /> <strong>{formatStars(repo.stars)}</strong></span>
                {repo.language ? <span>{repo.language}</span> : null}
                {repo.license ? <span>{repo.license}</span> : null}
              </div>
              <div className="trend-card-mid">
                {repo.topics.length ? (
                  <div className="trend-topics" aria-label={`${repo.fullName} topics`}>
                    {repo.topics.slice(0, 3).map((topic) => <span key={topic}>{topic}</span>)}
                  </div>
                ) : <span />}
                <button className={`btn ghost trend-save ${saved ? "is-saved" : ""}`} type="button" onClick={() => onSaveRepo(asSavedRepo)}>
                  <Bookmark size={12} /> {saved ? "Saved" : "Save"}
                </button>
              </div>
              <div className="actions">
                <button className="btn accent" type="button" onClick={() => onSelectFoundation(foundationFromTrendingRepo(repo))}>Use</button>
                <RepoSiteLink url={repo.homepage} />
                <a className="btn ghost" href={repo.htmlUrl} target="_blank" rel="noreferrer" aria-label={`Open ${repo.fullName} on GitHub`}><ExternalLink size={12} /> GitHub</a>
              </div>
            </article>
            );
          }) : null}
          {trending.status === "ok" && !visibleTrendingRepos.length ? (
            <article className="trend-card">
              <span className="nm">No matching trending repos</span>
              <p className="desc">Try a repo name, language, topic, or license.</p>
            </article>
          ) : null}
        </div>
      </section>
      <TrendingRepoDrawer
        repo={detailsRepo}
        category={activeCategory}
        saved={detailsRepo ? isSavedRepo(classifiedFromTrendingRepo(detailsRepo, activeCategory), savedRepos) : false}
        onClose={() => setDetailsRepo(null)}
        onSave={(repo) => onSaveRepo(classifiedFromTrendingRepo(repo, activeCategory))}
        onUse={(repo) => {
          setDetailsRepo(null);
          onSelectFoundation(foundationFromTrendingRepo(repo));
        }}
      />
    </>
  );
}

function TrendingRepoDrawer({
  repo,
  category,
  saved,
  onClose,
  onSave,
  onUse
}: {
  repo: TrendingRepo | null;
  category?: TrendingCategory;
  saved: boolean;
  onClose: () => void;
  onSave: (repo: TrendingRepo) => void;
  onUse: (repo: TrendingRepo) => void;
}) {
  const swipeDown = useSwipeDownDismiss(onClose);
  if (!repo) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer trending-drawer">
        <div className="mobile-swipe-handle" aria-hidden="true" />
        <div className="drawer-head" {...swipeDown}>
          <button className="close" type="button" onClick={onClose} aria-label="Close trending repo details">
            <X size={16} />
          </button>
          <div className="title">
            <div className="name">{repo.fullName}</div>
            <div className="sub">{category?.label ?? "Trending"} / {repo.license ?? "Inspect license"} / {repo.language ?? "Mixed"}</div>
          </div>
        </div>
        <div className="drawer-body">
          <div className="repo-hero trending-repo-hero">
            <div>
              <span className="tag">Live GitHub lead</span>
              <h2>{repo.fullName}</h2>
            </div>
            <div>
              <div className="score-big">{formatStars(repo.stars)}</div>
              <div className="score-lbl">Stars</div>
            </div>
          </div>
          <div className="readme-plain repo-explain-card">
            <strong>What it is</strong>
            <p>{trendingRepoWhat(repo)}</p>
            <p>{trendingRepoUse(repo, category)}</p>
          </div>
          <div className="repo-section">
            <h3>Why this showed up</h3>
            <p>ForkFirst pulled this from live GitHub Search for {category?.label ?? "this category"}, filtered to recently pushed projects and sorted by stars. This is a lead, not proof it is the right foundation.</p>
          </div>
          <div className="repo-section">
            <h3>Watch out for</h3>
            <p>{trendingRepoWatch(repo)}</p>
          </div>
          <div className="repo-section">
            <h3>Your next move</h3>
            <p>{trendingRepoNext(repo)}</p>
          </div>
          <div className="repo-section">
            <h3>Signals</h3>
            <div className="kv"><span className="k">Stars</span><span className="v">{repo.stars.toLocaleString()}</span></div>
            <div className="kv"><span className="k">Language</span><span className="v">{repo.language ?? "Mixed"}</span></div>
            <div className="kv"><span className="k">License</span><span className="v">{repo.license ?? "Inspect"}</span></div>
            {safeExternalUrl(repo.homepage) ? <div className="kv"><span className="k">Project site</span><span className="v"><a href={safeExternalUrl(repo.homepage) ?? "#"} target="_blank" rel="noreferrer">{safeExternalUrl(repo.homepage)}</a></span></div> : null}
            <div className="kv"><span className="k">Updated</span><span className="v">{repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString() : "Inspect"}</span></div>
            <div className="kv"><span className="k">Created</span><span className="v">{repo.createdAt ? new Date(repo.createdAt).toLocaleDateString() : "Inspect"}</span></div>
          </div>
          {repo.topics.length ? (
            <div className="repo-section">
              <h3>Topics</h3>
              <div className="trend-topics drawer-topics">
                {repo.topics.map((topic) => <span key={topic}>{topic}</span>)}
              </div>
            </div>
          ) : null}
        </div>
        <div className="drawer-foot">
          <button className="btn accent" type="button" onClick={() => onUse(repo)}>Use</button>
          <button className={`btn ghost ${saved ? "is-saved" : ""}`} type="button" onClick={() => onSave(repo)}>
            <Bookmark size={14} /> {saved ? "Saved in library" : "Save to library"}
          </button>
          <RepoSiteLink url={repo.homepage} />
          <a className="btn ghost" href={repo.htmlUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Open on GitHub</a>
        </div>
      </aside>
    </>
  );
}

function PromptPacksScreen({
  state,
  onChange,
  recommendations
}: {
  state: PromptPackState;
  onChange: (state: PromptPackState) => void;
  recommendations: PromptPackRecommendation[];
}) {
  const activeCount = state.enabledIds.length;
  const totalTokens = estimateHandoffTokens(enabledPackMarkdown(state));
  return (
    <section className="packs" data-screen-label="10 Prompt Packs">
      <div className="packs-head">
        <div>
          <span className="eyebrow">Builder behavior</span>
          <h2>Prompt <span>Packs</span></h2>
          <p className="sub">
            Choose the reusable rules that get appended to every Builder Handoff.
            Preview any pack before it becomes part of the package.
          </p>
        </div>
        <div className="packs-summary">
          <div>
            <span className="lbl">Active</span>
            <span className="val">{activeCount}</span>
          </div>
          <div>
            <span className="lbl">Added</span>
            <span className="val accent">~{formatTokensShort(totalTokens)}</span>
          </div>
        </div>
      </div>
      <PromptPacksPanel state={state} onChange={onChange} recommendations={recommendations} />
    </section>
  );
}

function ChatComposerBar({
  disabled,
  onSubmit
}: {
  disabled: boolean;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue("");
    onSubmit(trimmed);
  }
  const focusChatInput = useCallback(() => {
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);
  const voice = useBrowserVoiceInput(value, setValue, focusChatInput);
  return (
    <div className="chat-composer-bar">
      <div className="composer-inner">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={1}
          placeholder="Reply to ForkFirst - or ask 'find more like #1'"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          aria-label="Continue chat"
        />
        <VoiceInputButton
          disabled={disabled}
          listening={voice.listening}
          supported={voice.supported}
          onToggle={voice.toggle}
        />
        <button className="composer-send" type="button" onClick={submit} disabled={!value.trim() || disabled} title="Send message" aria-label="Send message">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

export function ForkFirstRedesignApp() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [accent, setAccent] = useState<RedesignAccent>(initialAccent);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [result, setResult] = useState<IdeaCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundationDraft, setFoundationDraft] = useState<FoundationDraft | null>(null);
  const [drawerRepo, setDrawerRepo] = useState<ClassifiedRepo | null>(null);
  const [savedModalRepo, setSavedModalRepo] = useState<ClassifiedRepo | null>(null);
  const [selectedStarterRepo, setSelectedStarterRepo] = useState<ClassifiedRepo | null>(null);
  const [brand, setBrand] = useState<BrandAnswers | null>(null);
  const [keys, setKeys] = useState<UserKeys>({
    githubToken: "",
    aiProvider: "groq",
    aiApiKey: "",
    aiModel: "llama-3.1-8b-instant",
    aiBaseUrl: "https://api.groq.com/openai/v1",
    aiBaseUrlAcknowledged: false
  });
  const [rememberKeys, setRememberKeys] = useState(false);
  const [verification, setVerification] = useState<KeyVerificationState>(() => getSavedKeyState(keys));
  const [verifying, setVerifying] = useState(false);
  const [savedRepos, setSavedRepos] = useState<ClassifiedRepo[]>([]);
  const [savedRepoBoards, setSavedRepoBoards] = useState<Record<string, string>>({});
  const [savedBuildPacks, setSavedBuildPacks] = useState<SavedBuildPack[]>([]);
  const [activeBuildPack, setActiveBuildPack] = useState<SavedBuildPack | null>(null);
  const [promptPackState, setPromptPackState] = useState<PromptPackState>({ enabledIds: ["karpathy-mvp", "indie-hacker-mvp", "ai-edit-over-generate"], customPacks: [] });
  const [savingsLog, setSavingsLog] = useState<SavingsLog>({ count: 0, totalHandoffTokens: 0 });
  const [usageEntries, setUsageEntries] = useState<UsageEntry[]>([]);
  const [chats, setChats] = useState<ResearchChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<ChatTurn[]>([]);
  const [chatSending, setChatSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const didPersistSessionRef = useRef(false);

  useEffect(() => {
    applyDocumentVisualPrefs(theme, accent);
  }, [accent, theme]);

  useEffect(() => {
    const storage = readFeatureStorage(window.localStorage);
    const sessionKeys = readJsonValue<UserKeys>(window.sessionStorage, REDESIGN_STORAGE_KEYS.keys, DEFAULT_REDESIGN_USER_KEYS);
    const effectiveKeys = storage.rememberKeys ? storage.keys : sessionKeys;
    if (!storage.rememberKeys) {
      window.localStorage.removeItem(REDESIGN_STORAGE_KEYS.keys);
      window.localStorage.removeItem(LEGACY_REDESIGN_STORAGE_KEYS.keys);
    }
    setKeys(effectiveKeys);
    setRememberKeys(storage.rememberKeys);
    setVerification(getSavedKeyState(effectiveKeys));
    setSavedRepos(storage.savedRepos);
    setSavedRepoBoards(storage.savedRepoBoards);
    setSavedBuildPacks(storage.savedBuildPacks);
    setChats(storage.chats);
    setPromptPackState(storage.promptPackState);
    setUsageEntries(storage.usageEntries);
    setSavingsLog(loadSavings());
    setAccent(storage.accent);
    setTheme(themeFromStorage(window.localStorage.getItem(THEME_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY)));

    const handoffPayload = new URLSearchParams(window.location.search).get("handoff");
    if (handoffPayload) {
      decodeHandoff(handoffPayload).then((decoded) => {
        if (!decoded) {
          setToast("Shared handoff could not be opened");
          return;
        }
        const docs = createHandoffDocuments(decoded.markdown);
        const score = qualityScore(qualityItems({
          result: null,
          brand: null,
          starterRepo: null,
          followUps: [],
          promptPackState: storage.promptPackState,
          docs
        }));
        const pack: SavedBuildPack = {
          id: `shared-${handoffPayload.slice(0, 28)}`,
          title: titleFromPrompt(decoded.idea || "Shared Build Pack"),
          idea: decoded.idea,
          starterRepo: "Shared handoff",
          target: "generic",
          markdown: decoded.markdown,
          tokenEstimate: estimateHandoffTokens(decoded.markdown),
          qualityScore: score,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspace: {
            result: null,
            brand: null,
            selectedStarterRepo: null,
            followUps: [],
            promptPackState: storage.promptPackState,
            prompt: decoded.idea,
            activeChatId: null
          },
          versions: []
        };
        setSavedBuildPacks((current) => {
          const next = [pack, ...current.filter((item) => item.id !== pack.id)].slice(0, 50);
          writeFeatureStorage(window.localStorage, { savedBuildPacks: next });
          return next;
        });
        setActiveBuildPack(pack);
        setPrompt(decoded.idea);
        setResult(null);
        setBrand(null);
        setSelectedStarterRepo(null);
        setFollowUps([]);
        setScreen("handoff");
        window.history.replaceState({}, "", window.location.pathname);
        setToast("Shared Build Pack opened");
      });
    } else {
      const storedScreen = window.sessionStorage.getItem(ACTIVE_SCREEN_SESSION_KEY);
      const storedChatId = window.sessionStorage.getItem(ACTIVE_CHAT_SESSION_KEY);
      const restoredChat = storedChatId ? storage.chats.find((chat) => chat.id === storedChatId) : storage.chats[0];
      if (isRestorableChatScreen(storedScreen) && restoredChat?.result && isRestorableChatScreen(restoredChat.workspace?.screen)) {
        const workspace = restoredChat.workspace;
        setActiveChatId(restoredChat.id);
        setResult(restoredChat.result);
        setSelectedStarterRepo(workspace?.selectedStarterRepo ?? restoredChat.result.repos[0] ?? null);
        setPrompt(workspace?.prompt || restoredChat.messages.find((message) => message.role === "user")?.content || restoredChat.result.prompt || "");
        setBrand(normalizeBrandAnswers(workspace?.brand));
        setFollowUps(workspace?.followUps ?? []);
        setScreen(workspace?.screen ?? "results");
      } else if (isScreen(storedScreen) && !["landing", "loading", "results", "more", "branding", "generating", "ready"].includes(storedScreen)) {
        setScreen(storedScreen);
      }
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!didPersistSessionRef.current) {
      didPersistSessionRef.current = true;
      return;
    }
    window.sessionStorage.setItem(ACTIVE_SCREEN_SESSION_KEY, screen);
    if (activeChatId) window.sessionStorage.setItem(ACTIVE_CHAT_SESSION_KEY, activeChatId);
    else window.sessionStorage.removeItem(ACTIVE_CHAT_SESSION_KEY);
  }, [activeChatId, screen]);

  const go = useCallback((next: Screen, options: GoOptions = {}) => {
    if (!isScreen(next)) return;
    if (next === "app") {
      setPrompt("");
      setResult(null);
      setSelectedStarterRepo(null);
      setActiveBuildPack(null);
      setBrand(null);
      setFoundationDraft(null);
      setFollowUps([]);
      setActiveChatId(null);
      setError(null);
      setLoading(false);
    }
    setScreen(next);
    const stayInChatFlow = next === "branding" || next === "generating" || next === "ready";
    if (options.scroll !== "preserve" && !stayInChatFlow) {
      window.scrollTo({ top: 0 });
      document.querySelector(".workspace")?.scrollTo({ top: 0 });
    }
  }, []);

  const persistKeys = useCallback((next: UserKeys) => {
    setKeys(next);
    setVerification(getSavedKeyState(next));
    if (rememberKeys) {
      writeFeatureStorage(window.localStorage, { keys: next });
      window.sessionStorage.removeItem(REDESIGN_STORAGE_KEYS.keys);
      window.sessionStorage.removeItem(LEGACY_REDESIGN_STORAGE_KEYS.keys);
    } else {
      window.sessionStorage.setItem(REDESIGN_STORAGE_KEYS.keys, JSON.stringify(next));
      window.localStorage.removeItem(REDESIGN_STORAGE_KEYS.keys);
      window.localStorage.removeItem(LEGACY_REDESIGN_STORAGE_KEYS.keys);
    }
  }, [rememberKeys]);

  const persistRememberKeys = useCallback((remember: boolean) => {
    setRememberKeys(remember);
    writeFeatureStorage(window.localStorage, { rememberKeys: remember });
    if (!remember) {
      window.localStorage.removeItem(REDESIGN_STORAGE_KEYS.keys);
      window.localStorage.removeItem(LEGACY_REDESIGN_STORAGE_KEYS.keys);
      window.sessionStorage.setItem(REDESIGN_STORAGE_KEYS.keys, JSON.stringify(keys));
    } else {
      writeFeatureStorage(window.localStorage, { keys });
      window.sessionStorage.removeItem(REDESIGN_STORAGE_KEYS.keys);
      window.sessionStorage.removeItem(LEGACY_REDESIGN_STORAGE_KEYS.keys);
    }
  }, [keys]);

  const persistChats = useCallback((next: ResearchChat[]) => {
    setChats(next);
    writeFeatureStorage(window.localStorage, { chats: next });
  }, []);

  const upsertChat = useCallback((chat: ResearchChat) => {
    setChats((current) => {
      const next = [chat, ...current.filter((item) => item.id !== chat.id)]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 30);
      writeFeatureStorage(window.localStorage, { chats: next });
      return next;
    });
  }, []);

  const persistActiveChatWorkspace = useCallback((screenOverride?: RestorableChatScreen) => {
    if (!result || !activeChatId) return;
    const nextScreen = screenOverride ?? (isRestorableChatScreen(screen) ? screen : "results");
    const now = new Date().toISOString();
    setChats((current) => {
      const existing = current.find((chat) => chat.id === activeChatId);
      if (!existing) return current;
      const nextChat: ResearchChat = {
        ...existing,
        updatedAt: now,
        result,
        workspace: {
          ...(existing.workspace ?? {}),
          screen: nextScreen,
          brand,
          selectedStarterRepo,
          followUps,
          prompt: result.prompt || prompt
        }
      };
      const next = [nextChat, ...current.filter((chat) => chat.id !== activeChatId)]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 30);
      writeFeatureStorage(window.localStorage, { chats: next });
      return next;
    });
  }, [activeChatId, brand, followUps, prompt, result, screen, selectedStarterRepo]);

  const openChat = useCallback((chat: ResearchChat) => {
    const workspace = chat.workspace;
    const restoredFollowUps = workspace?.followUps?.length
      ? workspace.followUps
      : chat.messages
        .filter((message) => !(message.role === "user" && message.content === chat.result?.prompt))
        .map((message) => ({ role: message.role, content: message.content, ui: message.ui, result: message.result, intent: message.intent }));
    setActiveChatId(chat.id);
    setResult(chat.result);
    setSelectedStarterRepo(workspace?.selectedStarterRepo ?? chat.result?.repos[0] ?? null);
    setActiveBuildPack(null);
    setFoundationDraft(null);
    setPrompt(workspace?.prompt || chat.messages.find((message) => message.role === "user")?.content || chat.result?.prompt || "");
    setBrand(normalizeBrandAnswers(workspace?.brand));
    setError(null);
    setLoading(false);
    setFollowUps(restoredFollowUps);
    const workspaceScreen = workspace?.screen;
    const restoredScreen: Screen = chat.result
      ? (isRestorableChatScreen(workspaceScreen) ? workspaceScreen : "results")
      : "app";
    setScreen(restoredScreen);
    window.scrollTo({ top: 0 });
    document.querySelector(".workspace")?.scrollTo({ top: 0 });
  }, []);

  const renameChat = useCallback((chatId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const next = chats.map((chat) => chat.id === chatId ? { ...chat, title: trimmed, updatedAt: new Date().toISOString() } : chat);
    persistChats(next);
    setToast("Chat renamed");
  }, [chats, persistChats]);

  const deleteChat = useCallback((chatId: string) => {
    const next = chats.filter((chat) => chat.id !== chatId);
    persistChats(next);
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setResult(null);
      setFollowUps([]);
      setPrompt("");
      setScreen("app");
    }
    setToast("Chat deleted");
  }, [activeChatId, chats, persistChats]);

  const persistAccent = useCallback((next: RedesignAccent) => {
    setAccent(next);
    writeFeatureStorage(window.localStorage, { accent: next });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_STORAGE_KEY, themeToStorage(next));
      window.localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
      return next;
    });
  }, []);

  const recordUsage = useCallback((entry: UsageEntry) => {
    setUsageEntries((current) => {
      const next = [entry, ...current].slice(0, 100);
      writeFeatureStorage(window.localStorage, { usageEntries: next });
      return next;
    });
  }, []);

  const resetUsage = useCallback(() => {
    setUsageEntries([]);
    writeFeatureStorage(window.localStorage, { usageEntries: [] });
    setToast("Usage estimate reset");
  }, []);

  const saveRepo = useCallback((repo: ClassifiedRepo) => {
    setSavedRepos((current) => {
      const exists = current.some((saved) => saved.fullName === repo.fullName);
      const next = exists ? current.filter((saved) => saved.fullName !== repo.fullName) : [repo, ...current];
      writeFeatureStorage(window.localStorage, { savedRepos: next });
      setToast(exists ? "Removed from library" : "Saved to library");
      return next;
    });
    setSavedRepoBoards((current) => {
      if (current[repo.fullName]) return current;
      const next = { ...current, [repo.fullName]: defaultBoard(repo) };
      writeFeatureStorage(window.localStorage, { savedRepoBoards: next });
      return next;
    });
  }, []);

  const setRepoBoard = useCallback((repo: ClassifiedRepo, board: string) => {
    setSavedRepoBoards((current) => {
      const next = { ...current, [repo.fullName]: board };
      writeFeatureStorage(window.localStorage, { savedRepoBoards: next });
      return next;
    });
  }, []);

  const saveBuildPack = useCallback((pack: SavedBuildPack) => {
    if (!isMeaningfulBuildPack(pack)) {
      setToast("Run an idea check before saving a Build Pack");
      return;
    }
    setSavedBuildPacks((current) => {
      const now = new Date().toISOString();
      const existing = current.find((item) => item.id === pack.id);
      const nextPack = {
        ...pack,
        createdAt: existing?.createdAt ?? pack.createdAt ?? now,
        updatedAt: now
      };
      const next = [nextPack, ...current.filter((item) => item.id !== pack.id)]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 50);
      writeFeatureStorage(window.localStorage, { savedBuildPacks: next });
      setActiveBuildPack((active) => active?.id === pack.id ? nextPack : active);
      return next;
    });
  }, []);

  useEffect(() => {
    if (screen === "branding" || screen === "generating" || screen === "ready") return;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      document.querySelector(".workspace")?.scrollTo({ top: 0 });
    });
  }, [screen]);

  useEffect(() => {
    if (!activeChatId || !result || !isRestorableChatScreen(screen)) return;
    persistActiveChatWorkspace(screen);
  }, [activeChatId, brand, followUps, persistActiveChatWorkspace, result, screen, selectedStarterRepo]);

  const openBuildPack = useCallback((pack: SavedBuildPack) => {
    setActiveBuildPack(pack);
    setResult(pack.workspace?.result ?? null);
    setBrand(normalizeBrandAnswers(pack.workspace?.brand));
    setSelectedStarterRepo(pack.workspace?.selectedStarterRepo ?? null);
    setFollowUps(pack.workspace?.followUps ?? []);
    if (pack.workspace?.promptPackState) {
      setPromptPackState(pack.workspace.promptPackState);
      writeFeatureStorage(window.localStorage, { promptPackState: pack.workspace.promptPackState });
    }
    setActiveChatId(pack.workspace?.activeChatId ?? null);
    setPrompt(pack.workspace?.prompt || pack.idea);
    setScreen("handoff");
    window.scrollTo({ top: 0 });
    document.querySelector(".workspace")?.scrollTo({ top: 0 });
  }, []);

  const deleteBuildPack = useCallback((packId: string) => {
    setSavedBuildPacks((current) => {
      const next = current.filter((pack) => pack.id !== packId);
      writeFeatureStorage(window.localStorage, { savedBuildPacks: next });
      return next;
    });
    setActiveBuildPack((current) => current?.id === packId ? null : current);
    setToast("Build Pack deleted");
  }, []);

  const downloadBuildPack = useCallback((pack: SavedBuildPack) => {
    const filename = `${pack.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "forkfirst-build-pack"}.md`;
    try {
      downloadTextFile(filename, pack.markdown);
      saveBuildPack(withBuildPackVersion({ ...pack, status: "exported" }, "Exported .md"));
      setSavingsLog(logHandoffGenerated(pack.markdown));
      setToast("Downloaded");
    } catch {
      setToast("Download failed");
    }
  }, [saveBuildPack]);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setToast("Copied");
    }
  }, []);

  const openRepoDetails = useCallback((repo: ClassifiedRepo) => {
    trackForkFirstEvent("repo_details_opened", {
      category: repo.category,
      score: repo.score.total,
      hasLicense: Boolean(repo.license)
    });
    setDrawerRepo(repo);
  }, []);

  const selectStarterForHandoff = useCallback((repo: ClassifiedRepo, source: string) => {
    trackForkFirstEvent("starter_repo_selected", {
      category: repo.category,
      score: repo.score.total,
      source
    });
    setSelectedStarterRepo(repo);
  }, []);

  const downloadHandoff = useCallback((filename: string, text: string) => {
    try {
      downloadTextFile(filename, text);
      setSavingsLog(logHandoffGenerated(text));
      setToast("Downloaded");
    } catch {
      setToast("Download failed");
    }
  }, []);

  const downloadHandoffZip = useCallback((filename: string, docs: HandoffDocuments, markdown: string) => {
    try {
      const files = [
        { path: "forkfirst-builder-handoff.md", content: markdown },
        ...HANDOFF_DOC_TABS.map((file) => ({ path: file, content: docs[file] }))
      ];
      downloadBlobFile(filename, buildZipBlob(files));
      trackForkFirstEvent("handoff_zip_downloaded", {
        fileCount: files.length
      });
      setSavingsLog(logHandoffGenerated(markdown));
      setToast("Downloaded .zip");
    } catch {
      setToast("Zip export failed");
    }
  }, []);

  const verifyKeys = useCallback(async (draftKeys: UserKeys) => {
    setVerifying(true);
    try {
      const response = await fetch("/api/verify-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildKeyVerificationRequestBody(draftKeys))
      });
      const data = (await response.json()) as KeyVerificationState;
      setVerification(data);
      persistKeys(draftKeys);
      recordUsage(createUsageEntry({
        provider: draftKeys.aiApiKey ? draftKeys.aiProvider : "custom",
        model: draftKeys.aiApiKey ? draftKeys.aiModel : "keys-only",
        action: "verify-keys",
        inputText: draftKeys.githubToken || draftKeys.aiApiKey ? "verify configured provider keys" : "verify no keys",
        outputText: JSON.stringify(data)
      }));
    } catch {
      setVerification({ github: "failed", ai: "failed", checkedAt: new Date().toISOString(), message: "Could not verify keys from this browser." });
    } finally {
      setVerifying(false);
    }
  }, [persistKeys, recordUsage]);

  const clearAllData = useCallback(() => {
    clearFeatureStorage(window.localStorage);
    Object.values(REDESIGN_STORAGE_KEYS).forEach((key) => window.sessionStorage.removeItem(key));
    Object.values(LEGACY_REDESIGN_STORAGE_KEYS).forEach((key) => window.sessionStorage.removeItem(key));
    setKeys({
      githubToken: "",
      aiProvider: "groq",
      aiApiKey: "",
      aiModel: "llama-3.1-8b-instant",
      aiBaseUrl: "https://api.groq.com/openai/v1",
      aiBaseUrlAcknowledged: false
    });
    setRememberKeys(false);
    setVerification(getSavedKeyState({
      githubToken: "",
      aiProvider: "groq",
      aiApiKey: "",
      aiModel: "llama-3.1-8b-instant",
      aiBaseUrl: "https://api.groq.com/openai/v1",
      aiBaseUrlAcknowledged: false
    }));
    setSavedRepos([]);
    setSavedRepoBoards({});
    setSavedBuildPacks([]);
    setActiveBuildPack(null);
    setChats([]);
    setActiveChatId(null);
    setFollowUps([]);
    setResult(null);
    setSelectedStarterRepo(null);
    setPrompt("");
    setUsageEntries([]);
    setSavingsLog({ count: 0, totalHandoffTokens: 0 });
    setToast("Browser data cleared");
  }, []);

  const makeHandoffMarkdown = useCallback(() => {
    if (!result) return "# Builder Handoff\n\nRun an idea check first.";
    return buildProjectBuildPack(result, "codex", selectedStarterRepo ?? result.repos[0], buildPackPreferences(brand, followUps), enabledPackMarkdown(promptPackState));
  }, [brand, followUps, promptPackState, result, selectedStarterRepo]);

  const promptPackRecommendations = useMemo(() => recommendPromptPacks({
    idea: prompt,
    result,
    repo: selectedStarterRepo
  }), [prompt, result, selectedStarterRepo]);

  const selectFoundationDraft = useCallback((repo: FoundationDraft) => {
    setFoundationDraft(repo);
    setPrompt("");
    setResult(null);
    setSelectedStarterRepo(null);
    setActiveBuildPack(null);
    setBrand(null);
    setFollowUps([]);
    setActiveChatId(null);
    setError(null);
    setLoading(false);
    setScreen("app");
    setToast(`${repo.fullName} attached. Tell ForkFirst what you want to build.`);
    window.scrollTo({ top: 0 });
    document.querySelector(".workspace")?.scrollTo({ top: 0 });
  }, []);

  const runSearch = useCallback(async (promptOverride?: string) => {
    const rawPrompt = promptOverride ?? prompt;
    const trimmed = isLegacyExamplePrompt(rawPrompt) ? "" : rawPrompt.trim();
    if (trimmed.length < 8 || loading) return;
    const displayPrompt = trimmed;
    const submittedPrompt = buildFoundationIdeaPrompt(foundationDraft, trimmed);
    if (promptOverride || foundationDraft) setPrompt(displayPrompt);
    setLoading(true);
    setError(null);
    setScreen("loading");
    trackForkFirstEvent("idea_check_submitted", {
      hasFoundation: Boolean(foundationDraft),
      hasGithubToken: Boolean(keys.githubToken),
      hasAiKey: Boolean(keys.aiApiKey)
    });
    try {
      const response = await fetch("/api/idea-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildIdeaCheckRequestBody(submittedPrompt, keys))
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Idea check failed.");
      }
      const data = (await response.json()) as IdeaCheckResult;
      trackForkFirstEvent("results_returned", {
        repoCount: data.repos.length,
        warningCount: data.warnings.length,
        closeMatches: data.recovery?.closeMatchCount ?? 0,
        hasAiKey: Boolean(keys.aiApiKey)
      });
      recordUsage(createUsageEntry({
        provider: "custom",
        model: keys.githubToken ? "GitHub Search API with token" : "GitHub Search API unauthenticated",
        action: "idea-check",
        inputText: submittedPrompt,
        outputText: JSON.stringify({ queries: data.queries, repos: data.repos.map((repo) => repo.fullName), warnings: data.warnings })
      }));
      if (keys.aiApiKey) {
        recordUsage(createUsageEntry({
          provider: keys.aiProvider,
          model: keys.aiModel,
          action: "idea-check",
          inputText: `${submittedPrompt}\n${JSON.stringify(data.repos.slice(0, 8).map((repo) => ({ name: repo.fullName, description: repo.description, score: repo.score.total })))}`,
          outputText: JSON.stringify({ verdict: data.verdict, summary: data.summary, gaps: data.gaps })
        }));
      }
      const recommendedPacks = recommendPromptPacks({ idea: data.prompt, result: data, repo: data.repos[0] ?? null });
      setPromptPackState((current) => {
        const next = applyPromptPackRecommendations(current, recommendedPacks);
        writeFeatureStorage(window.localStorage, { promptPackState: next });
        return next;
      });
      const now = new Date().toISOString();
      const chat: ResearchChat = {
        id: data.id,
        title: titleFromPrompt(displayPrompt),
        createdAt: data.createdAt ?? now,
        updatedAt: now,
        pinnedAt: null,
        folderId: null,
        messages: [{
          id: messageId(data.id),
          role: "user",
          content: displayPrompt,
          createdAt: data.createdAt ?? now,
          result: data
        }],
        result: data,
        workspace: {
          screen: "results",
          brand: null,
          selectedStarterRepo: data.repos[0] ?? null,
          followUps: [],
          prompt: displayPrompt
        }
      };
      setResult(data);
      setSelectedStarterRepo(data.repos[0] ?? null);
      setActiveBuildPack(null);
      setActiveChatId(chat.id);
      upsertChat(chat);
      setFollowUps([]);
      setFoundationDraft(null);
      setScreen("results");
    } catch (err) {
      setError((err as Error).message);
      setScreen("app");
    } finally {
      setLoading(false);
    }
  }, [foundationDraft, keys, loading, prompt, recordUsage, upsertChat]);

  const sendFollowUp = useCallback(async (message: string) => {
    if (!result || chatSending) return;
    const prior = followUps;
    const nextTurns = [...prior, { role: "user" as const, content: message }];
    setFollowUps(nextTurns);
    setChatSending(true);
    let assistantContent = "";
    let assistantUi: ChatUiAction[] | undefined;
    let assistantResult: IdeaCheckResult | undefined;
    let assistantIntent: ChatIntent | undefined;
    try {
      const response = await fetch("/api/research-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildResearchChatRequestBody({
          prompt: message,
          messages: prior,
          result,
          keys,
          context: {
            screen,
            selectedStarterRepoFullName: selectedStarterRepo?.fullName,
            savedRepoNames: savedRepos.map((repo) => repo.fullName)
          },
          allowTools: {
            search: true,
            saveRepo: true,
            handoff: true
          }
        }))
      });
      const raw = await response.text();
      let data: { reply?: string; error?: string; actions?: ChatUiAction[]; result?: IdeaCheckResult | null; intent?: ChatIntent } = {};
      try {
        data = raw ? JSON.parse(raw) as { reply?: string; error?: string; actions?: ChatUiAction[]; result?: IdeaCheckResult | null; intent?: ChatIntent } : {};
      } catch {
        data = {};
      }
      assistantContent = data.reply ?? data.error ?? clientChatFallbackReply(message, result, prior);
      assistantUi = Array.isArray(data.actions) ? data.actions : undefined;
      assistantResult = data.result ?? undefined;
      assistantIntent = data.intent;
      if (assistantResult && assistantResult.id !== result.id) {
        setResult(assistantResult);
        setSelectedStarterRepo(assistantResult.repos[0] ?? null);
        if (screen === "results") setScreen("more");
      }
    } catch {
      assistantContent = clientChatFallbackReply(message, result, prior);
    }

    const finalTurns = [...nextTurns, { role: "assistant" as const, content: assistantContent, ui: assistantUi, result: assistantResult, intent: assistantIntent }];
    setFollowUps(finalTurns);

    try {
      recordUsage(createUsageEntry({
        provider: keys.aiApiKey ? keys.aiProvider : "custom",
        model: keys.aiApiKey ? keys.aiModel : "ForkFirst demo chat",
        action: "chat",
        inputText: `${message}\n${JSON.stringify({ prompt: result.prompt, repos: result.repos.slice(0, 5).map((repo) => repo.fullName), prior })}`,
        outputText: assistantContent
      }));
    } catch {
      // Usage estimates are helpful, but they should never block a chat answer.
    }

    try {
      const now = new Date().toISOString();
      const existing = chats.find((chat) => chat.id === activeChatId);
      const storedResult = assistantResult ?? result;
      const chat: ResearchChat = {
        id: existing?.id ?? storedResult.id,
        title: existing?.title ?? titleFromPrompt(storedResult.prompt),
        createdAt: existing?.createdAt ?? storedResult.createdAt ?? now,
        updatedAt: now,
        pinnedAt: existing?.pinnedAt ?? null,
        folderId: existing?.folderId ?? null,
        messages: [
          {
            id: existing?.messages[0]?.id ?? `${storedResult.id}:prompt`,
            role: "user",
            content: existing?.messages[0]?.content ?? prompt,
            createdAt: storedResult.createdAt ?? now,
            result: storedResult
          },
          ...finalTurns.map((turn, index) => ({
            id: existing?.messages[index + 1]?.id ?? messageId(`${storedResult.id}:turn:${index}`),
            role: turn.role,
            content: turn.content,
            createdAt: existing?.messages[index + 1]?.createdAt ?? now,
            ui: turn.ui,
            result: turn.result,
            intent: turn.intent
          }))
        ],
        result: storedResult,
        workspace: {
          ...(existing?.workspace ?? {}),
          screen: isRestorableChatScreen(screen) ? screen : "results",
          brand,
          selectedStarterRepo: storedResult.id !== result.id ? storedResult.repos[0] ?? null : selectedStarterRepo,
          followUps: finalTurns,
          prompt: storedResult.prompt || prompt
        }
      };
      setActiveChatId(chat.id);
      upsertChat(chat);
    } catch {
      // Local chat history can fail in private/quota-limited browsers; keep the visible answer intact.
    } finally {
      setChatSending(false);
    }
  }, [activeChatId, brand, chatSending, chats, followUps, keys, prompt, recordUsage, result, savedRepos, screen, selectedStarterRepo, upsertChat]);

  const title =
    screen === "app" ? "new idea"
      : screen === "loading" ? "checking..."
      : screen === "handoff" ? "Handoffs"
      : screen === "library" ? "Repos"
      : screen === "settings" ? "Settings"
      : screen === "trending" ? "Trending"
      : screen === "packs" ? "Prompt Packs"
      : "GitHub idea validator";

  if (screen === "landing") {
    return (
      <main className="root" data-theme={theme} data-accent={accent}>
        <Landing
          go={go}
          onStartWithPrompt={(value) => {
            setPrompt(value);
            setResult(null);
            setSelectedStarterRepo(null);
            setActiveBuildPack(null);
            setBrand(null);
            setFoundationDraft(null);
            setFollowUps([]);
            setActiveChatId(null);
            setError(null);
            setLoading(false);
            setScreen("app");
            window.scrollTo({ top: 0 });
            document.querySelector(".workspace")?.scrollTo({ top: 0 });
          }}
        />
      </main>
    );
  }

  return (
    <main className="root" data-theme={theme} data-accent={accent}>
      <div className="screen is-active">
        <div data-accent={accent} className={`app-shell no-right theme-${theme === "dark" ? "ink" : "paper"}`}>
          <Sidebar
            active={screen}
            go={go}
            savedBuildPackCount={savedBuildPacks.length}
            savedRepoCount={savedRepos.length}
            recentChats={chats}
            activeChatId={activeChatId}
            onOpenChat={openChat}
            onRenameChat={renameChat}
            onDeleteChat={deleteChat}
          />
          <main className={`workspace ${screen === "app" ? "start-mode" : "chat-mode"}`}>
            <Topbar
              title={title}
              theme={theme}
              onToggleTheme={toggleTheme}
              go={go}
              screen={screen}
            />
            <div className="ws-route">
              {screen === "app" ? (
                <>
                  <EmptyApp
                    prompt={prompt}
                    loading={loading}
                    foundationDraft={foundationDraft}
                    setPrompt={setPrompt}
                    savedRepos={savedRepos}
                    onSelectFoundation={selectFoundationDraft}
                    onSaveRepo={saveRepo}
                    onClearFoundation={() => setFoundationDraft(null)}
                    onSubmit={runSearch}
                    onViewTrending={() => go("trending")}
                  />
                  {error ? <p className="error-text">{error}</p> : null}
                </>
              ) : null}
              {screen === "loading" ? <LoadingView prompt={prompt} /> : null}
              {(["results", "more", "branding", "generating", "ready"] as Screen[]).includes(screen) && result ? (
                <ChatResults
                  prompt={prompt}
                  result={result}
                  phase={screen}
                  brand={brand}
                  selectedStarterRepo={selectedStarterRepo}
                  savedRepos={savedRepos}
                  followUps={followUps}
                  sending={chatSending}
                  onOpenRepo={openRepoDetails}
                  onSaveRepo={saveRepo}
                  onSelectStarter={(repo) => selectStarterForHandoff(repo, "result_card")}
                  onCopyHandoff={() => {
                    trackForkFirstEvent("handoff_copied", { source: "ready_card" });
                    copyText(makeHandoffMarkdown());
                  }}
                  onDownloadHandoff={() => downloadHandoff("forkfirst-builder-handoff.md", makeHandoffMarkdown())}
                  onDownloadHandoffZip={() => downloadHandoffZip("forkfirst-build-pack.zip", createHandoffDocuments(makeHandoffMarkdown()), makeHandoffMarkdown())}
                  onBuilderSelect={(target, source) => trackForkFirstEvent("builder_selected", { target, source })}
                  onFollowUp={sendFollowUp}
                  readyDocs={createHandoffDocuments(makeHandoffMarkdown())}
                  onStartBranding={() => {
                    const starter = selectedStarterRepo ?? result.repos[0] ?? null;
                    if (starter && !selectedStarterRepo) selectStarterForHandoff(starter, "handoff_start_default");
                    trackForkFirstEvent("handoff_started", {
                      hasStarter: Boolean(starter),
                      repoCount: result.repos.length
                    });
                    setSelectedStarterRepo(starter);
                    go("branding");
                  }}
                  onGenerate={(answers) => {
                    setBrand(answers);
                    go("generating");
                  }}
                  onReady={() => go("ready")}
                  go={go}
                />
              ) : null}
              {screen === "handoff" ? (
                !result && !activeBuildPack ? (
                  <HandoffSavedPacksScreen
                    savedBuildPacks={savedBuildPacks}
                    onOpenBuildPack={openBuildPack}
                    onDeleteBuildPack={deleteBuildPack}
                    onDownloadBuildPack={downloadBuildPack}
                    onStartNewIdea={() => go("app")}
                  />
                ) : (
                  <HandoffView
                    result={result}
                    brand={brand}
                    selectedStarterRepo={selectedStarterRepo}
                    followUps={followUps}
                    promptPackState={promptPackState}
                    prompt={prompt}
                    activeChatId={activeChatId}
                    activeBuildPack={activeBuildPack}
                    onCopy={(text) => {
                      trackForkFirstEvent("handoff_copied", { source: "handoff_view" });
                      copyText(text);
                    }}
                    onDownloadZip={downloadHandoffZip}
                    onSaveBuildPack={saveBuildPack}
                  />
                )
              ) : null}
              {screen === "library" ? (
                <LibraryScreen
                  savedRepos={savedRepos}
                  savedRepoBoards={savedRepoBoards}
                  onOpen={(repo) => {
                    trackForkFirstEvent("repo_details_opened", {
                      category: repo.category,
                      score: repo.score.total,
                      hasLicense: Boolean(repo.license),
                      source: "library"
                    });
                    setSavedModalRepo(repo);
                  }}
                  onUseRepo={(repo) => selectFoundationDraft(foundationFromClassifiedRepo(repo))}
                  onSetBoard={setRepoBoard}
                  onCopyClone={(repo) => copyText(cloneCommandForRepo(repo))}
                />
              ) : null}
              {screen === "settings" ? (
                <SettingsScreen
                  keys={keys}
                  accent={accent}
                  usageEntries={usageEntries}
                  savingsLog={savingsLog}
                  onAccentChange={persistAccent}
                  onChange={persistKeys}
                  verification={verification}
                  verifying={verifying}
                  onVerify={verifyKeys}
                  rememberKeys={rememberKeys}
                  onRememberKeysChange={persistRememberKeys}
                  onClearAllData={clearAllData}
                  onShowWelcome={() => go("landing")}
                  onResetUsage={resetUsage}
                />
              ) : null}
              {screen === "trending" ? (
                <LiveTrendingScreen
                  savedRepos={savedRepos}
                  onSaveRepo={saveRepo}
                  onSelectFoundation={selectFoundationDraft}
                />
              ) : null}
              {screen === "packs" ? <PromptPacksScreen state={promptPackState} recommendations={promptPackRecommendations} onChange={(next) => {
                setPromptPackState(next);
                writeFeatureStorage(window.localStorage, { promptPackState: next });
              }} /> : null}
            </div>
            {(screen === "results" || screen === "more" || screen === "branding" || screen === "ready") ? (
              <ChatComposerBar disabled={chatSending || !result} onSubmit={sendFollowUp} />
            ) : null}
          </main>
          <MobileNav active={screen} go={go} recentChats={chats} activeChatId={activeChatId} onOpenChat={openChat} />
        </div>
        <SavingsRing savedBuildPackCount={savedBuildPacks.length} savedRepoCount={savedRepos.length} />
      </div>
      <RepoDrawer
        repo={drawerRepo}
        idea={result?.prompt ?? prompt}
        saved={drawerRepo ? isSavedRepo(drawerRepo, savedRepos) : false}
        onClose={() => setDrawerRepo(null)}
        onSave={saveRepo}
        onUse={(repo) => {
          selectStarterForHandoff(repo, "details_drawer");
          trackForkFirstEvent("handoff_started", {
            hasStarter: true,
            repoCount: result?.repos.length ?? 0
          });
          setDrawerRepo(null);
          go("branding");
        }}
      />
      {savedModalRepo ? (
        <SavedRepoModal
          repo={savedModalRepo}
          board={repoBoardLabel(savedModalRepo, savedRepoBoards)}
          isSaved
          onClose={() => setSavedModalRepo(null)}
          onBoardChange={setRepoBoard}
          onDelete={(repo) => {
            saveRepo(repo);
            setSavedModalRepo(null);
          }}
        />
      ) : null}
      {toast ? <div className="toast">{toast}</div> : null}
    </main>
  );
}
