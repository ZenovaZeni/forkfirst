import type { ClassifiedRepo } from "../analysis/types";
import { buildHandoffBlueprint, type HandoffBlueprint, type ProductKind } from "./blueprint";
import type { BuildPackPreferences } from "./generator";

export type AlignmentDecisionType = "keep" | "replace" | "add" | "remove" | "defer" | "inspect";

export type AlignmentDecision = {
  decision: AlignmentDecisionType;
  productNeed: string;
  repoCapability: string;
  evidenceRefs: string[];
  rationale: string;
  confidence: number;
  blockingQuestions: string[];
};

export type BuildPackProductIR = {
  kind: ProductKind;
  thesis: string;
  targetUser: string;
  jobToBeDone: string;
  firstMilestone: string;
  primaryWorkflow: string[];
  keyScreens: string[];
  coreDataObjects: string[];
  userActions: string[];
};

export type BuildPackIR = {
  idea: {
    originalIdea: string;
    researchContext: string | null;
    chatContext: string | null;
    queries: string[];
  };
  repo: {
    selected: ClassifiedRepo | undefined;
    candidates: ClassifiedRepo[];
  };
  blueprint: HandoffBlueprint;
  product: BuildPackProductIR;
  alignment: {
    summary: string;
    decisions: AlignmentDecision[];
  };
  risks: string[];
  verification: string[];
};

export type BuildPackIRInput = {
  originalIdea: string;
  researchContext?: string | null;
  chatContext?: string | null;
  queries: string[];
  selectedRepo?: ClassifiedRepo;
  candidateRepos: ClassifiedRepo[];
  preferences?: BuildPackPreferences;
  blueprint?: HandoffBlueprint;
};

function cleanEvidence(text: string | null | undefined): string | null {
  if (!text) return null;
  const cleaned = text
    .replace(/<\/?UNTRUSTED_REPO_CONTENT>/gi, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/<\/?[a-z][a-z0-9-]*\b[^<>\n|]*/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned.slice(0, 220) : null;
}

function repoEvidence(repo: ClassifiedRepo | undefined): string[] {
  if (!repo) return [];
  const evidence = repo.readme?.evidence;
  return [
    cleanEvidence(repo.description),
    cleanEvidence(repo.readme?.excerpt),
    ...(evidence?.featureSnippets ?? []).map(cleanEvidence),
    ...(evidence?.integrationSnippets ?? []).map(cleanEvidence),
    ...(evidence?.setupSnippets ?? []).map(cleanEvidence),
    ...(evidence?.commandSnippets ?? []).map(cleanEvidence),
    ...repo.score.reasons.map(cleanEvidence)
  ].filter((item): item is string => Boolean(item));
}

function containsAny(text: string, values: string[]): boolean {
  const lower = text.toLowerCase();
  return values.some((value) => lower.includes(value.toLowerCase()));
}

function evidenceForNeed(repo: ClassifiedRepo | undefined, need: string): string[] {
  const terms = need
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 4)
    .filter((term) => !["with", "that", "from", "this", "user", "users", "system", "primary"].includes(term));
  const matches = repoEvidence(repo).filter((line) => containsAny(line, terms));
  return matches.slice(0, 3);
}

function repoCapability(repo: ClassifiedRepo | undefined, evidence: string[]): string {
  if (!repo) return "No selected repo capability yet.";
  if (evidence.length > 0) return evidence[0];
  return `${repo.fullName} needs inspection; this capability was not confirmed in the available metadata.`;
}

function productNeedLabel(items: string[], fallback: string): string {
  const unique = Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
  return unique.length > 0 ? unique.slice(0, 4).join(", ") : fallback;
}

function keepDecision(repo: ClassifiedRepo | undefined, blueprint: HandoffBlueprint): AlignmentDecision {
  const need = blueprint.primaryWorkflow[0] ?? blueprint.firstMilestone;
  const evidence = evidenceForNeed(repo, `${need} ${blueprint.coreDataObjects.join(" ")}`);
  const fallbackEvidence = repoEvidence(repo).slice(0, 2);
  const refs = evidence.length > 0 ? evidence : fallbackEvidence;
  return {
    decision: "keep",
    productNeed: need,
    repoCapability: repoCapability(repo, refs),
    evidenceRefs: refs,
    rationale: "Keep only the setup, app structure, data patterns, or product flow that directly supports the user's first workflow.",
    confidence: refs.length > 0 ? 78 : 42,
    blockingQuestions: ["Which exact files/components implement this capability in the starter repo?"]
  };
}

function replaceDecision(repo: ClassifiedRepo | undefined, blueprint: HandoffBlueprint): AlignmentDecision {
  return {
    decision: "replace",
    productNeed: `Original product identity for ${blueprint.targetUserSegment}`,
    repoCapability: repo ? `${repo.fullName} may provide reusable structure, but its copy, branding, sample data, and assumptions belong to the starter.` : "No starter branding to replace yet.",
    evidenceRefs: repo ? [repo.fullName] : [],
    rationale: "The final product should inherit useful mechanics, not another app's brand, examples, screenshots, or domain assumptions.",
    confidence: 86,
    blockingQuestions: ["Which starter screens, labels, icons, sample records, or assets need replacement before demo?"]
  };
}

function addDecision(repo: ClassifiedRepo | undefined, blueprint: HandoffBlueprint): AlignmentDecision {
  const need = productNeedLabel(
    [
      ...blueprint.coreDataObjects.filter((objectName) => evidenceForNeed(repo, objectName).length === 0),
      ...blueprint.userActions.filter((action) => evidenceForNeed(repo, action).length === 0)
    ],
    blueprint.firstMilestone
  );
  return {
    decision: "add",
    productNeed: `${blueprint.firstMilestone} Missing or custom pieces: ${need}`,
    repoCapability: repo ? "Missing, not confirmed, or only partially covered by the selected repo metadata." : "No selected repo; build the product-specific loop fresh.",
    evidenceRefs: repoEvidence(repo).slice(0, 2),
    rationale: "Build the missing product-specific data, actions, states, and export/save behavior that turn the starter into the user's product.",
    confidence: 72,
    blockingQuestions: ["Which product requirements are missing after inspecting the repo tree and README?"]
  };
}

function removeDecision(repo: ClassifiedRepo | undefined, blueprint: HandoffBlueprint): AlignmentDecision {
  return {
    decision: "remove",
    productNeed: "A focused first milestone without unrelated starter features.",
    repoCapability: repo ? `Unrelated demo routes, broad admin areas, sample workflows, paid/team surfaces, or features outside ${blueprint.firstMilestone}.` : "No starter features selected.",
    evidenceRefs: blueprint.explicitNonGoals.slice(0, 3),
    rationale: "Remove or defer anything that makes the AI builder chase the starter repo's product instead of the user's product.",
    confidence: 74,
    blockingQuestions: ["Which starter features are outside the first milestone and should be deleted, hidden, or deferred?"]
  };
}

function inspectDecision(repo: ClassifiedRepo | undefined): AlignmentDecision {
  const evidence = repoEvidence(repo).slice(0, 3);
  return {
    decision: "inspect",
    productNeed: "Verified setup, license, architecture, and reusable file paths.",
    repoCapability: repo ? `${repo.fullName} must be inspected before copying code or relying on its architecture.` : "Run another search or paste a known repo before implementation.",
    evidenceRefs: evidence,
    rationale: "GitHub metadata is a lead, not proof. The builder must inspect README, license, package files, routes, data models, tests, and issues before editing.",
    confidence: 90,
    blockingQuestions: [
      "Does the starter install locally with documented commands?",
      "Does the license allow the intended reuse?",
      "Which files actually support the keep decisions?"
    ]
  };
}

function riskLines(repo: ClassifiedRepo | undefined, blueprint: HandoffBlueprint): string[] {
  return [
    repo?.license ? `Detected license: ${repo.license}; still confirm LICENSE, notices, assets, and dependency terms.` : "No license detected; treat as research only until reuse rights are confirmed.",
    ...blueprint.trustPrivacySafety.slice(0, 4)
  ];
}

function verificationLines(repo: ClassifiedRepo | undefined, blueprint: HandoffBlueprint): string[] {
  return [
    repo ? `Run ${repo.fullName}'s documented install, dev, build, and test commands.` : "Choose or paste a repo before implementation.",
    `Manually complete: ${blueprint.firstMilestone}`,
    "Record every keep, replace, add, remove, and inspect decision in repo notes.",
    "Stop and document blockers when setup, license, data terms, or verification fails."
  ];
}

export function buildAlignmentDecisionTable(decisions: AlignmentDecision[]): string[] {
  return [
    "| Decision | Product Need | Repo Capability | Evidence | Builder Instruction |",
    "|---|---|---|---|---|",
    ...decisions.map((decision) => {
      const evidence = decision.evidenceRefs.length > 0 ? decision.evidenceRefs.join("; ") : "Needs repo inspection.";
      const instruction = `${decision.rationale} Confidence: ${decision.confidence}%.`;
      return `| ${decision.decision[0].toUpperCase()}${decision.decision.slice(1)} | ${decision.productNeed} | ${decision.repoCapability} | ${evidence} | ${instruction} |`;
    })
  ];
}

export function buildBuildPackIR(input: BuildPackIRInput): BuildPackIR {
  const blueprint = input.blueprint ?? buildHandoffBlueprint({
    originalIdea: input.originalIdea,
    researchContext: input.researchContext ?? null,
    chatContext: input.chatContext ?? null,
    queries: input.queries,
    selectedRepo: input.selectedRepo,
    candidateRepos: input.candidateRepos,
    preferences: input.preferences
  });
  const decisions = [
    keepDecision(input.selectedRepo, blueprint),
    replaceDecision(input.selectedRepo, blueprint),
    addDecision(input.selectedRepo, blueprint),
    removeDecision(input.selectedRepo, blueprint),
    inspectDecision(input.selectedRepo)
  ];

  return {
    idea: {
      originalIdea: input.originalIdea,
      researchContext: input.researchContext ?? null,
      chatContext: input.chatContext ?? null,
      queries: input.queries
    },
    repo: {
      selected: input.selectedRepo,
      candidates: input.candidateRepos
    },
    blueprint,
    product: {
      kind: blueprint.productKind,
      thesis: blueprint.productThesis,
      targetUser: blueprint.targetUserSegment,
      jobToBeDone: blueprint.jobToBeDone,
      firstMilestone: blueprint.firstMilestone,
      primaryWorkflow: blueprint.primaryWorkflow,
      keyScreens: blueprint.keyScreens,
      coreDataObjects: blueprint.coreDataObjects,
      userActions: blueprint.userActions
    },
    alignment: {
      summary: input.selectedRepo
        ? `${input.selectedRepo.fullName} is evidence to adapt, not a finished product decision. Keep, replace, add, remove, and inspect decisions must be verified in the repo.`
        : "No selected repo yet; build the handoff only after a repo is selected or a no-foundation plan is intentional.",
      decisions
    },
    risks: riskLines(input.selectedRepo, blueprint),
    verification: verificationLines(input.selectedRepo, blueprint)
  };
}
