import type { ClassifiedRepo } from "@/lib/analysis/types";

type ChatFallbackOptions = {
  idea?: string | null;
  repeated?: boolean;
};

function cleanRepoText(value: string | null | undefined, max = 220) {
  const cleaned = (value ?? "")
    .replaceAll("<UNTRUSTED_REPO_CONTENT>", "")
    .replaceAll("</UNTRUSTED_REPO_CONTENT>", "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned.length > max ? `${cleaned.slice(0, Math.max(0, max - 3)).trim()}...` : cleaned;
}

function repoShortDescription(repo: ClassifiedRepo) {
  return cleanRepoText(repo.description || repo.summary || repo.readme?.excerpt, 180);
}

function repoRole(repo: ClassifiedRepo) {
  if (repo.category === "forkable") return "a possible starting point";
  if (repo.category === "already_exists") return "evidence that someone has built close to this already";
  if (repo.category === "reference") return "a reference to study";
  if (repo.category === "gap") return "a signal about the open space";
  return "a lead to inspect carefully";
}

export function buildConversationalRepoFallback(
  message: string,
  repos: ClassifiedRepo[],
  options: ChatFallbackOptions = {}
) {
  const [best, second, third] = repos;
  if (!best) {
    return "I can help, but I need a repo lookup first so I am not guessing. Run the search, then ask this again and I will give you a real read from the results.";
  }

  const lower = message.toLowerCase();
  const asksForSuggestions = /\b(any suggestions?|anything else|what else|recommend|suggest|could i add|should i add|features?|differentiator|next feature)\b/.test(lower);
  const description = repoShortDescription(best);
  const ideaPhrase = options.idea ? ` for "${cleanRepoText(options.idea, 120)}"` : "";
  const opener = asksForSuggestions
    ? `Yes. I would use ${best.fullName} as ${repoRole(best)}${ideaPhrase}, then design around the gap it does not solve.`
    : `I would keep ${best.fullName} in the center of this conversation${ideaPhrase}, but I would treat it as evidence to inspect rather than a finished decision.`;
  const evidence = description ? ` GitHub describes it as ${description}.` : "";
  const compare = second
    ? ` ${second.fullName}${third ? ` and ${third.fullName}` : ""} are worth comparing, but I would not make the user read the whole repo report again just to get advice.`
    : "";

  const bullets = options.repeated
    ? [
        `Pressure-test ${best.fullName}: does it save the hard part of the build, or only give inspiration?`,
        "Add one decision moment: clone it, study it, or keep searching.",
        "Keep the next handoff focused on what to keep, replace, and verify."
      ]
    : [
        `Start with one concrete user outcome, then check whether ${best.fullName} actually supports it.`,
        "Inspect README, setup, license, and recent issues before telling an AI builder to build on it.",
        "Ask for more options only if the top repo does not cover the hard technical part."
      ];

  return `${opener}${evidence}${compare}\n\n${bullets.map((item) => `- ${item}`).join("\n")}`;
}
