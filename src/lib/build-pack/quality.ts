export type BuildPackQualityIssue = {
  id: string;
  severity: "warning" | "blocker";
  title: string;
  detail: string;
};

export type BuildPackQualityAudit = {
  passed: boolean;
  issues: BuildPackQualityIssue[];
};

export type BuildPackQualityInput = {
  idea?: string | null;
  markdown: string;
};

const REQUIRED_MARKERS = [
  "# STARTER_REPO",
  "# PRD",
  "# BUILD_PLAN",
  "# REPO_STARTER_NOTES",
  "## License And Reuse"
];

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function includesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function pushIssue(issues: BuildPackQualityIssue[], issue: BuildPackQualityIssue): void {
  if (!issues.some((existing) => existing.id === issue.id)) issues.push(issue);
}

export function auditBuildPackQuality({ idea, markdown }: BuildPackQualityInput): BuildPackQualityAudit {
  const issues: BuildPackQualityIssue[] = [];
  const normalizedMarkdown = normalize(markdown);
  const intent = normalize(`${idea ?? ""} ${markdown}`);

  const missingMarkers = REQUIRED_MARKERS.filter((marker) => !markdown.includes(marker));
  if (missingMarkers.length > 0) {
    pushIssue(issues, {
      id: "missing-sections",
      severity: "blocker",
      title: "Build Pack is missing core sections",
      detail: `Missing: ${missingMarkers.join(", ")}.`
    });
  }

  if (/\bi don'?t know\b/i.test(markdown) || /\bkeep whatever you need\b/i.test(markdown) || /turn the selected repo into the user's product idea/i.test(markdown)) {
    pushIssue(issues, {
      id: "generic-filler",
      severity: "warning",
      title: "Generic wizard filler leaked into the handoff",
      detail: "Replace vague filler with concrete keep, replace, add, and first-milestone instructions before export."
    });
  }

  if (/<\/?(a|img|picture|source|div|span|h1|h2|p|br)\b/i.test(markdown) || /UNTRUSTED_REPO_CONTENT/i.test(markdown)) {
    pushIssue(issues, {
      id: "raw-html",
      severity: "warning",
      title: "Raw repo markup leaked into the handoff",
      detail: "Clean README HTML, badge markup, and untrusted-content markers so the builder receives readable evidence."
    });
  }

  const wantsGrocerySavings =
    includesAny(intent, [/\bgrocer(?:y|ies)\b/, /\bshopping list\b/, /\bsupermarket\b/]) &&
    includesAny(intent, [/\bcheap(?:er|est)?\b/, /\bprice\b/, /\bprices\b/, /\bdeal\b/, /\bdeals\b/, /\bcoupon\b/, /\bbudget\b/, /\bsav(?:e|ing|ings) money\b/, /\bcost\b/]);
  if (wantsGrocerySavings) {
    const hasSavingsModel = includesAny(normalizedMarkdown, [/\bprice snapshot\b/, /\bpricesnapshot\b/, /\bstore plan\b/, /\bprice\/deal\b/, /\bdeal\b/, /\bdeals\b/, /\bcompare store prices\b/]);
    const recipeDominant = includesAny(normalizedMarkdown, [/\bsave recipe links\b/, /\brecipe url\b/, /\brecipe bookmark\b/]);
    if (!hasSavingsModel || recipeDominant) {
      pushIssue(issues, {
        id: "grocery-price-drift",
        severity: "blocker",
        title: "Grocery savings goal drifted into recipe planning",
        detail: "The user intent mentions cheaper groceries, so the PRD needs price/deal, store-plan, source/date, and manual-price fallback language."
      });
    }
  }

  const wantsCollectorValues =
    includesAny(intent, [/\bpokemon\b/, /\bpok(?:e|\u00e9)mon\b/, /\btcg\b/, /\bcard collection\b/, /\bcollector'?s album\b/]) &&
    includesAny(intent, [/\bworth\b/, /\bvalue\b/, /\bprice\b/, /\bprices\b/]);
  if (wantsCollectorValues) {
    const hasCollectorSafety = includesAny(normalizedMarkdown, [/\bestimated value\b/, /\bprice snapshot\b/, /\bsource\/date\b/, /\bsource and date\b/, /\bvalues as estimates\b/]);
    if (!hasCollectorSafety) {
      pushIssue(issues, {
        id: "collector-value-safety",
        severity: "blocker",
        title: "Collector value handoff needs estimate/source language",
        detail: "Card-value products should label prices as estimates and name source/date expectations before a builder implements pricing."
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues
  };
}
