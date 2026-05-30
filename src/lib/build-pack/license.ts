import type { IdeaCheckResult } from "@/types/idea-check";

type BuildPackRepo = IdeaCheckResult["repos"][number];

export type LicenseFamily =
  | "permissive"
  | "weak-copyleft"
  | "strong-copyleft"
  | "network-copyleft"
  | "public-domain"
  | "proprietary-or-unknown"
  | "missing";

export type LicenseProfile = {
  spdx: string | null;
  family: LicenseFamily;
  displayName: string;
  oneLineSummary: string;
  permissions: string[];
  conditions: string[];
  limitations: string[];
  mustDoBeforeShipping: string[];
  forbidden: string[];
  attributionRequired: boolean;
  shareAlikeRequired: boolean;
};

const PROFILES: Array<{ test: RegExp; build: (spdx: string) => LicenseProfile }> = [
  {
    test: /^(mit|mit-0|expat)$/i,
    build: (spdx) => ({
      spdx,
      family: "permissive",
      displayName: spdx,
      oneLineSummary: "Permissive. You can use, modify, and ship in commercial or closed products as long as you keep the copyright notice.",
      permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
      conditions: ["Include the original LICENSE and copyright notice in copies or substantial portions of the code you reuse."],
      limitations: ["No warranty.", "No trademark grant."],
      mustDoBeforeShipping: [
        "Copy the upstream LICENSE file into your repo.",
        "Keep the original copyright line; add your own copyright above it for new code.",
        "Credit the source repo in your README (use the attribution snippet below)."
      ],
      forbidden: [
        "Do not strip the LICENSE or copyright header.",
        "Do not imply endorsement by the original author."
      ],
      attributionRequired: true,
      shareAlikeRequired: false
    })
  },
  {
    test: /^(apache-2\.0|apache2|apache 2|apache)$/i,
    build: (spdx) => ({
      spdx,
      family: "permissive",
      displayName: "Apache-2.0",
      oneLineSummary: "Permissive with an explicit patent grant. Commercial use allowed; you must preserve notices and document significant changes.",
      permissions: ["Commercial use", "Modification", "Distribution", "Patent use", "Private use"],
      conditions: [
        "Include the original LICENSE and NOTICE files.",
        "State significant changes you made to the original files.",
        "Keep copyright, patent, trademark, and attribution notices intact."
      ],
      limitations: ["No trademark use.", "No warranty.", "No liability."],
      mustDoBeforeShipping: [
        "Copy LICENSE and NOTICE files into your repo.",
        "Mark files you modified (a comment header noting the change is enough).",
        "Credit the source repo in your README (use the attribution snippet below)."
      ],
      forbidden: [
        "Do not use the original project's name, logo, or trademarks to brand your fork.",
        "Do not remove the NOTICE file or patent grant language."
      ],
      attributionRequired: true,
      shareAlikeRequired: false
    })
  },
  {
    test: /^(bsd-2-clause|bsd-3-clause|bsd|isc)$/i,
    build: (spdx) => ({
      spdx,
      family: "permissive",
      displayName: spdx,
      oneLineSummary: "Permissive. Use freely in commercial or closed work; keep the copyright notice and the license text.",
      permissions: ["Commercial use", "Modification", "Distribution", "Private use"],
      conditions: ["Preserve the copyright notice and license text in distributed source and binaries."],
      limitations: ["No warranty.", /3/.test(spdx) ? "No endorsement using author or contributor names." : "No trademark grant."],
      mustDoBeforeShipping: [
        "Copy the upstream LICENSE file into your repo.",
        "Credit the source repo in your README (use the attribution snippet below)."
      ],
      forbidden: [
        "Do not use the original author's name to endorse or promote your fork without permission."
      ],
      attributionRequired: true,
      shareAlikeRequired: false
    })
  },
  {
    test: /^(mpl-2\.0|mpl2|mozilla public)$/i,
    build: (spdx) => ({
      spdx,
      family: "weak-copyleft",
      displayName: "MPL-2.0",
      oneLineSummary: "Weak copyleft per-file. You can mix MPL files with closed code, but modified MPL files themselves must stay MPL-licensed and source-available.",
      permissions: ["Commercial use", "Modification", "Distribution", "Patent use", "Private use"],
      conditions: [
        "Modifications to MPL-licensed source files must remain under MPL-2.0 and be available as source.",
        "Include the MPL notice in modified files."
      ],
      limitations: ["No trademark grant.", "No warranty."],
      mustDoBeforeShipping: [
        "Keep MPL-licensed files MPL-licensed in your fork.",
        "Publish source for any modified MPL files.",
        "Credit the source repo in your README (use the attribution snippet below)."
      ],
      forbidden: [
        "Do not relicense modified MPL files as MIT/proprietary.",
        "Do not strip MPL headers from files you touched."
      ],
      attributionRequired: true,
      shareAlikeRequired: true
    })
  },
  {
    test: /^(lgpl(-[\d.]+)?(-only|-or-later)?|lgplv\d)$/i,
    build: (spdx) => ({
      spdx,
      family: "weak-copyleft",
      displayName: spdx,
      oneLineSummary: "Weak copyleft. You can dynamically link from closed code, but modifications to the LGPL library itself must stay LGPL and be source-available.",
      permissions: ["Commercial use", "Modification", "Distribution", "Patent use (LGPL-3 only)", "Private use"],
      conditions: [
        "Source for modifications to the LGPL library must be made available.",
        "Allow end users to swap in a modified version of the library (dynamic linking is the safe path).",
        "Preserve license and copyright notices."
      ],
      limitations: ["No warranty.", "Static-linking adds source-disclosure obligations to your whole binary."],
      mustDoBeforeShipping: [
        "Confirm you are dynamic-linking, not statically pulling LGPL code into a closed binary.",
        "Publish source for any modifications to the LGPL library.",
        "Credit the source repo in your README (use the attribution snippet below)."
      ],
      forbidden: [
        "Do not statically bundle LGPL code into a closed-source binary without legal review.",
        "Do not relicense the LGPL library."
      ],
      attributionRequired: true,
      shareAlikeRequired: true
    })
  },
  {
    test: /^(gpl(-[\d.]+)?(-only|-or-later)?|gplv\d)$/i,
    build: (spdx) => ({
      spdx,
      family: "strong-copyleft",
      displayName: spdx,
      oneLineSummary: "Strong copyleft. If you distribute a product built from this code, the whole product's source must be released under a GPL-compatible license.",
      permissions: ["Commercial use", "Modification", "Distribution", "Patent use (GPL-3 only)", "Private use"],
      conditions: [
        "Any distributed work that includes GPL code must itself be released under GPL.",
        "Source must be made available to recipients.",
        "License and copyright notices must be preserved.",
        "State significant changes."
      ],
      limitations: ["No warranty.", "Cannot be sublicensed under more permissive terms.", "Closed-source distribution is not compatible."],
      mustDoBeforeShipping: [
        "Decide upfront whether your product will be open-source under a GPL-compatible license.",
        "If not, treat this repo as a reference only — do not copy code into your product.",
        "If yes, ship your full source under GPL, keep the LICENSE, and credit the source."
      ],
      forbidden: [
        "Do not ship GPL-derived code in a closed-source or differently licensed product.",
        "Do not strip GPL notices or change the license header."
      ],
      attributionRequired: true,
      shareAlikeRequired: true
    })
  },
  {
    test: /^(agpl(-[\d.]+)?(-only|-or-later)?|agplv\d)$/i,
    build: (spdx) => ({
      spdx,
      family: "network-copyleft",
      displayName: spdx,
      oneLineSummary: "Network copyleft. Even if you only host the app over a network (SaaS), users have the right to your full modified source under AGPL.",
      permissions: ["Commercial use", "Modification", "Distribution", "Patent use", "Private use"],
      conditions: [
        "Network use counts as distribution: hosted users must be able to obtain the full source.",
        "Any distributed or hosted product built from this code must be released under AGPL.",
        "Preserve license, copyright, and significant-change notices."
      ],
      limitations: ["No warranty.", "Incompatible with closed-source or non-AGPL hosted products."],
      mustDoBeforeShipping: [
        "Decide upfront: will your hosted product be AGPL with full source available to users? If not, do not copy this code into your product.",
        "If yes, expose a clearly linked 'Source code' page in the hosted UI pointing to your AGPL source.",
        "Keep the LICENSE file and the AGPL headers intact."
      ],
      forbidden: [
        "Do not ship an AGPL-derived hosted product as closed-source SaaS.",
        "Do not strip AGPL notices or pretend the network-use clause does not apply because nothing is downloaded."
      ],
      attributionRequired: true,
      shareAlikeRequired: true
    })
  },
  {
    test: /^(unlicense|cc0(-[\d.]+)?|wtfpl|0bsd)$/i,
    build: (spdx) => ({
      spdx,
      family: "public-domain",
      displayName: spdx,
      oneLineSummary: "Effectively public domain. No attribution legally required, but crediting the source is still the respectful default and protects you reputationally.",
      permissions: ["Commercial use", "Modification", "Distribution", "Private use", "No attribution legally required"],
      conditions: [],
      limitations: ["No warranty.", "No trademark grant."],
      mustDoBeforeShipping: [
        "Credit the source repo in your README anyway — it costs nothing and protects you from accusations of stripping credit."
      ],
      forbidden: [
        "Do not claim original authorship of code you did not write."
      ],
      attributionRequired: false,
      shareAlikeRequired: false
    })
  },
  {
    test: /^(noassertion|no[-_]?license|none|null)$/i,
    build: () => ({
      spdx: null,
      family: "proprietary-or-unknown",
      displayName: "NOASSERTION / unspecified",
      oneLineSummary: "No clear license. Default copyright applies — that means 'all rights reserved' and you have no legal right to reuse the code without the owner's permission.",
      permissions: [],
      conditions: ["You need explicit written permission from the owner before copying any code."],
      limitations: ["Default copyright blocks reuse, modification, and redistribution."],
      mustDoBeforeShipping: [
        "Treat the repo as reference only — read it, learn from it, do not copy code.",
        "If you want to fork, open an issue or email the owner and request a license addition or written reuse permission.",
        "Document the conversation in REPO_STARTER_NOTES.md before any code is copied."
      ],
      forbidden: [
        "Do not copy code without written permission.",
        "Do not assume 'public on GitHub' means 'free to reuse' — it does not."
      ],
      attributionRequired: true,
      shareAlikeRequired: false
    })
  }
];

export function profileForLicense(rawLicense: string | null | undefined): LicenseProfile {
  if (rawLicense == null || !rawLicense.toString().trim()) {
    return {
      spdx: null,
      family: "missing",
      displayName: "no license detected",
      oneLineSummary: "GitHub did not report a license for this repo. Default copyright applies — you have no automatic right to reuse the code.",
      permissions: [],
      conditions: ["You need explicit written permission from the owner before copying any code."],
      limitations: ["Default copyright blocks reuse, modification, and redistribution."],
      mustDoBeforeShipping: [
        "Check the repo for a LICENSE file that GitHub may have missed.",
        "If still no license, treat as reference only and request written permission before any code is copied.",
        "Document the license check in REPO_STARTER_NOTES.md."
      ],
      forbidden: [
        "Do not copy code from an unlicensed public repo.",
        "Do not assume 'public on GitHub' means 'free to reuse'."
      ],
      attributionRequired: true,
      shareAlikeRequired: false
    };
  }
  const spdx = rawLicense.toString().trim();
  for (const entry of PROFILES) {
    if (entry.test.test(spdx)) return entry.build(spdx);
  }
  return {
    spdx,
    family: "proprietary-or-unknown",
    displayName: spdx,
    oneLineSummary: `Detected license string "${spdx}" is not in the common set. Open the LICENSE file and confirm what it requires before copying code.`,
    permissions: [],
    conditions: ["Read the actual LICENSE file before reuse — the SPDX label alone is not enough."],
    limitations: ["Unknown obligations until the LICENSE text is read."],
    mustDoBeforeShipping: [
      "Open the LICENSE file in the repo and read every paragraph.",
      "Summarize what it allows, requires, and forbids in REPO_STARTER_NOTES.md.",
      "If anything is unclear, treat the repo as reference only until a human-readable answer is documented."
    ],
    forbidden: [
      "Do not copy code while obligations are unclear.",
      "Do not strip the LICENSE file from your fork."
    ],
    attributionRequired: true,
    shareAlikeRequired: false
  };
}

export type AttributionSnippet = {
  markdownReadme: string;
  codeHeaderComment: string;
  packageJsonField: string;
};

export function buildAttributionSnippet(repo: BuildPackRepo, profile: LicenseProfile): AttributionSnippet {
  const owner = repo.owner || repo.fullName.split("/")[0] || "the original author";
  const projectLabel = repo.fullName || repo.name || repo.url;
  const url = repo.url || `https://github.com/${repo.fullName}`;
  const licenseLabel = profile.displayName || "see upstream LICENSE";
  const markdownReadme = [
    "## Built on open source",
    "",
    `This project started from [\`${projectLabel}\`](${url}) by ${owner} (${licenseLabel}).`,
    "Original code and design ideas remain credited to upstream authors.",
    "Modifications by this project are subject to this repository's LICENSE."
  ].join("\n");
  const codeHeaderComment = [
    "/*",
    ` * Adapted from ${projectLabel} (${url})`,
    ` * Original author: ${owner}`,
    ` * Original license: ${licenseLabel}`,
    " * Modifications under this project's LICENSE.",
    " */"
  ].join("\n");
  const packageJsonField = `"acknowledgements": "Built on ${projectLabel} (${url}) — ${licenseLabel}. Thank you to ${owner}."`;
  return { markdownReadme, codeHeaderComment, packageJsonField };
}

export function renderLicenseAndAttributionBlock(repo: BuildPackRepo): string[] {
  const profile = profileForLicense(repo.license);
  const snippet = buildAttributionSnippet(repo, profile);
  const lines: string[] = [];
  lines.push(`**Detected license:** ${profile.displayName}`);
  lines.push(`**Family:** ${familyLabel(profile.family)}`);
  lines.push("");
  lines.push(`**Plain-English summary:** ${profile.oneLineSummary}`);
  lines.push("");
  if (profile.permissions.length) {
    lines.push(`**Allows:** ${profile.permissions.join(", ")}.`);
  }
  if (profile.conditions.length) {
    lines.push(`**Requires:**`);
    for (const condition of profile.conditions) lines.push(`- ${condition}`);
  }
  if (profile.limitations.length) {
    lines.push(`**Limits:** ${profile.limitations.join(" ")}`);
  }
  lines.push("");
  lines.push(`### Must do before you ship`);
  for (const must of profile.mustDoBeforeShipping) lines.push(`- [ ] ${must}`);
  lines.push("");
  lines.push(`### Do not do`);
  for (const no of profile.forbidden) lines.push(`- ${no}`);
  lines.push("");
  lines.push(`### Attribution snippet — paste into your README`);
  lines.push("");
  lines.push("```markdown");
  lines.push(snippet.markdownReadme);
  lines.push("```");
  lines.push("");
  lines.push(`### Attribution header — paste at the top of any file you copied substantially from upstream`);
  lines.push("");
  lines.push("```");
  lines.push(snippet.codeHeaderComment);
  lines.push("```");
  return lines;
}

export function renderRespectfulUseChecklist(repo: BuildPackRepo | undefined): string[] {
  if (!repo) {
    return [
      "- [ ] No starter repo selected, so this checklist activates once one is.",
      "- [ ] Do not use ForkFirst output to clone a competitor product 1:1 and strip credit. Build ON, not AS."
    ];
  }
  const profile = profileForLicense(repo.license);
  const fullName = repo.fullName || repo.name;
  const ownerOnly = repo.owner || fullName.split("/")[0] || "the original author";
  const lines: string[] = [
    `- [ ] Treat ${fullName} as a *foundation*, not a finished product to repaint. The first build delivers a clearly different user promise than upstream.`,
    `- [ ] Keep ${fullName}'s LICENSE file in your fork unless you have written permission to remove it.`,
    `- [ ] Credit ${ownerOnly} in your README using the attribution snippet above. This is the single highest-leverage reputational protection you have.`,
    `- [ ] Replace upstream branding before any public demo: project name, logo, favicon, sample data, screenshots, marketing copy.`,
    profile.shareAlikeRequired
      ? `- [ ] Confirm your downstream license is compatible with ${profile.displayName} share-alike obligations *before* writing the first line of code.`
      : `- [ ] Pick your own LICENSE for the new code you add; document which files are derived from upstream.`,
    `- [ ] Open one GitHub issue or send one short note to ${ownerOnly} thanking them and pointing at your fork. Costs nothing, defuses 99% of "they ripped me off" posts.`,
    `- [ ] If your fork ships a substantially better experience, consider opening a PR upstream with any non-product-specific improvement (bug fix, doc, perf). Goodwill compounds.`,
    `- [ ] Do not publish a head-to-head comparison page that exists only to dunk on ${fullName}. Build a positive product, not an anti-product.`
  ];
  if (profile.family === "network-copyleft" || profile.family === "strong-copyleft") {
    lines.push(
      `- [ ] **${profile.displayName} is copyleft.** Confirm now — before code is copied — whether you can comply with the share-alike / network-use requirements. If you cannot, treat ${fullName} as reference only and do not copy code.`
    );
  }
  if (profile.family === "proprietary-or-unknown" || profile.family === "missing") {
    lines.push(
      `- [ ] **No clear license detected.** Do not copy any code from ${fullName} until the owner adds a license or grants written permission. Reference and learn — do not paste.`
    );
  }
  return lines;
}

function familyLabel(family: LicenseFamily): string {
  switch (family) {
    case "permissive":
      return "permissive (commercial use OK with attribution)";
    case "weak-copyleft":
      return "weak copyleft (modifications to upstream files stay open)";
    case "strong-copyleft":
      return "strong copyleft (your whole product must be open under a compatible license)";
    case "network-copyleft":
      return "network copyleft (even SaaS hosting triggers source-disclosure)";
    case "public-domain":
      return "public domain / no-rights-reserved";
    case "proprietary-or-unknown":
      return "proprietary or unknown (default copyright = all rights reserved)";
    case "missing":
      return "no license detected (default copyright = all rights reserved)";
  }
}
