import type { NormalizedRepo } from "@/lib/github/types";

export type RepoKind =
  | "directory"
  | "plugin_pack"
  | "game_engine"
  | "framework_sdk"
  | "app"
  | "starter_template"
  | "research_resource"
  | "library"
  | "unknown";

export type RepoKindInsight = {
  kind: RepoKind;
  label: string;
  plainEnglish: string;
  goodFor: string;
  notFor: string;
  reuseAdvice: string;
};

function includesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function repoText(repo: NormalizedRepo): string {
  return [
    repo.fullName,
    repo.name,
    repo.description,
    repo.language ?? "",
    repo.topics.join(" "),
    repo.readme?.excerpt ?? ""
  ]
    .join(" ")
    .toLowerCase();
}

export function getRepoKindInsight(repo: NormalizedRepo): RepoKindInsight {
  const text = repoText(repo);
  const name = `${repo.owner}/${repo.name}`.toLowerCase();

  if (
    /^awesome[-_]/.test(repo.name.toLowerCase()) ||
    includesAny(text, [
      /\bawesome[-_\s]?list\b/,
      /\bcurated list\b/,
      /\bcollection of\b/,
      /\blist of\b/,
      /\bdirectory of\b/
    ])
  ) {
    return {
      kind: "directory",
      label: "Directory / List",
      plainEnglish: "This is a curated list of links and projects, not a single app or codebase to run.",
      goodFor: "Research, market scanning, finding tools, and seeing what already exists.",
      notFor: "Copying as your product foundation unless it contains a specific linked repo you choose.",
      reuseAdvice: "Use it as a map. Open the links inside it, then save the specific projects that match your idea."
    };
  }

  if (includesAny(text, [/\bgame engine\b/, /\bgamedev\b/, /\bgame development\b/, /\b2d\b.*\b3d\b/, /\becs\b/])) {
    return {
      kind: "game_engine",
      label: "Game Engine / Framework",
      plainEnglish: "This is a game engine or game-development framework you may be able to build with.",
      goodFor: "Building games, prototypes, editors, rendering systems, or game-specific workflows.",
      notFor: "General app development or non-game products unless you only need a rendering/gameplay layer.",
      reuseAdvice: "Check the examples, editor/tooling, export targets, and license before choosing it as your game foundation."
    };
  }

  if (includesAny(text, [/\bsdk\b/, /\bframework\b/, /\btoolkit\b/, /\bclient library\b/, /\bapi library\b/])) {
    return {
      kind: "framework_sdk",
      label: "Framework / SDK",
      plainEnglish: "This is a reusable developer library or framework, not a complete product.",
      goodFor: "Building a feature or app on top of a proven technical layer.",
      notFor: "Replacing the product design, UX, auth, billing, and workflow decisions you still need.",
      reuseAdvice: "Use it as an ingredient if it solves the hard technical part of your idea."
    };
  }

  if (
    includesAny(text, [
      /\bclaude code\b/,
      /\bgemini cli\b/,
      /\bagent skills?\b/,
      /\bagents?\b.*\bplugins?\b/,
      /\bplugins?\b.*\bagents?\b/,
      /\bslash commands?\b/,
      /\bworkflow orchestrators?\b/,
      /\bmcp\b/,
      /\bmodel context protocol\b/
    ]) ||
    name.includes("/agents") ||
    name.includes("plugin") ||
    name.includes("-mcp") ||
    name.includes("_mcp")
  ) {
    return {
      kind: "plugin_pack",
      label: "Plugin / Agent Pack",
      plainEnglish: "This is a pack of agents, commands, plugins, or workflow helpers for developer automation.",
      goodFor: "Improving a coding workflow, learning agent patterns, or adding tools to Claude Code/Gemini-style setups.",
      notFor: "A normal customer-facing web app, chatbot, or business tool that non-developers can use directly.",
      reuseAdvice: "Study the structure if you are building developer tooling. Do not treat it as a ready-made app."
    };
  }

  if (
    includesAny(text, [
      /\bstarter\b/,
      /\btemplate\b/,
      /\bboilerplate\b/,
      /\bscaffold\b/,
      /\bcreate[-_\s]/
    ])
  ) {
    return {
      kind: "starter_template",
      label: "Starter / Template",
      plainEnglish: "This is meant to be copied and customized as a starting project.",
      goodFor: "Starting faster when the stack and license fit your plan.",
      notFor: "Understanding the whole market by itself.",
      reuseAdvice: "Copy or clone it, run the setup, and verify the code quality before committing."
    };
  }

  if (includesAny(text, [/\bresearch\b/, /\bbenchmark\b/, /\bdataset\b/, /\bpaper\b/, /\bevaluation\b/])) {
    return {
      kind: "research_resource",
      label: "Research Resource",
      plainEnglish: "This is mainly research material, data, benchmarks, or experiments.",
      goodFor: "Learning the space and validating technical direction.",
      notFor: "A polished app to fork or ship quickly.",
      reuseAdvice: "Read it for context, then look for an implementation or starter repo."
    };
  }

  if (includesAny(text, [/\bapp\b/, /\bplatform\b/, /\bdashboard\b/, /\bservice\b/, /\bsaas\b/, /\bweb app\b/])) {
    return {
      kind: "app",
      label: "App / Product",
      plainEnglish: "This looks like an application or product repo with user-facing behavior.",
      goodFor: "Comparing features, testing a similar product, or possibly copying if setup and license are clean.",
      notFor: "Blind copying without checking install steps, issues, and license constraints.",
      reuseAdvice: "Run it locally first, then decide whether to use it, copy it, or differentiate from it."
    };
  }

  if (includesAny(text, [/\blibrary\b/, /\bmodule\b/, /\bengine\b/, /\btool\b/, /\bcli\b/])) {
    return {
      kind: "library",
      label: "Library / Tool",
      plainEnglish: "This is a reusable tool or library that may solve part of the problem.",
      goodFor: "Borrowing a capability, pattern, or technical component.",
      notFor: "A complete product foundation unless the repo includes a full app layer.",
      reuseAdvice: "Inspect examples and APIs, then decide if it belongs in your stack."
    };
  }

  return {
    kind: "unknown",
    label: "Needs Inspection",
    plainEnglish: "GitHub metadata is not clear enough to tell what kind of repo this is yet.",
    goodFor: "A lead to inspect manually.",
    notFor: "Making a copy/build decision from metadata alone.",
    reuseAdvice: "Open the README and examples before saving it as a real candidate."
  };
}
