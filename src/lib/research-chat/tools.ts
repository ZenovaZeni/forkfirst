import type { ClassifiedRepo } from "@/lib/analysis/types";
import { safeProjectSiteUrl } from "../url/project-site";

export function cleanChatText(value: string | null | undefined, max = 220) {
  const cleaned = (value ?? "")
    .replaceAll("<UNTRUSTED_REPO_CONTENT>", "")
    .replaceAll("</UNTRUSTED_REPO_CONTENT>", "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned.length > max ? `${cleaned.slice(0, Math.max(0, max - 3)).trim()}...` : cleaned;
}

export function topRepos(repos: ClassifiedRepo[], count = 3) {
  return repos.slice(0, count);
}

export function repoDescription(repo: ClassifiedRepo, max = 180) {
  return cleanChatText(repo.description || repo.summary || repo.readme?.excerpt, max);
}

export function repoUseLabel(repo: ClassifiedRepo) {
  if (repo.category === "forkable") return "a possible starter foundation";
  if (repo.category === "already_exists") return "proof that something close exists";
  if (repo.category === "reference") return "a reference to study";
  if (repo.category === "gap") return "a signal about the open space";
  return "a lead to inspect carefully";
}

export function repoWatchOut(repo: ClassifiedRepo) {
  if (repo.archived) return "It is archived, so treat it as reference material.";
  if (!repo.license) return "No license was detected, so confirm reuse terms before building on it.";
  if (!repo.readme || repo.score.docs < 55) return "Docs look thin, so verify setup before committing to it.";
  return "Confirm setup, license, and recent issues before reuse.";
}

export function projectLinks(repos: ClassifiedRepo[]) {
  return repos
    .map((repo) => ({ repo, url: safeProjectSiteUrl(repo.homepage, { repoUrl: repo.url, fullName: repo.fullName }) }))
    .filter((item): item is { repo: ClassifiedRepo; url: string } => Boolean(item.url))
    .slice(0, 5)
    .map(({ repo, url }) => ({
      repoFullName: repo.fullName,
      url,
      label: repo.fullName
    }));
}

export function findRepoByPrompt(repos: ClassifiedRepo[], prompt: string) {
  const lower = prompt.toLowerCase();
  return repos.find((repo) => {
    const candidates = [repo.fullName, repo.name, repo.owner].map((value) => value.toLowerCase());
    return candidates.some((value) => value.length > 2 && lower.includes(value));
  });
}

export function suggestedPromptsForIdea(idea: string | null | undefined) {
  const subject = cleanChatText(idea, 90) || "this idea";
  return [
    `Compare these repos for ${subject}`,
    "Show project sites",
    "What is the opportunity gap?",
    "Start the builder handoff"
  ];
}
