import type { ChatUiAction, ResearchChatContext, ResearchChatPlan, ResearchChatResponseV2 } from "./types";
import { cleanChatText, projectLinks, repoDescription, repoUseLabel, repoWatchOut, suggestedPromptsForIdea, topRepos } from "./tools";

function reposForPlan(plan: ResearchChatPlan, context: ResearchChatContext) {
  if (plan.targetRepoFullNames.length === 0) return topRepos(context.repos, 3);
  const planned = plan.targetRepoFullNames
    .map((name) => context.repos.find((repo) => repo.fullName === name))
    .filter((repo): repo is NonNullable<typeof repo> => Boolean(repo));
  return planned.length ? planned : topRepos(context.repos, 3);
}

function repoCardsAction(repos: ReturnType<typeof reposForPlan>, title: string): ChatUiAction | null {
  if (!repos.length) return null;
  return {
    type: "repo_cards",
    title,
    repoFullNames: repos.map((repo) => repo.fullName)
  };
}

function suggestedPromptsAction(prompts: string[]): ChatUiAction {
  return {
    type: "suggested_prompts",
    prompts
  };
}

function compareTableAction(repos: ReturnType<typeof reposForPlan>): ChatUiAction | null {
  if (repos.length < 2) return null;
  return {
    type: "compare_table",
    rows: repos.map((repo) => ({
      repoFullName: repo.fullName,
      score: repo.score.total,
      category: repo.category,
      language: repo.language,
      license: repo.license,
      projectSite: repo.homepage,
      bestFor: repoUseLabel(repo),
      watchOut: repoWatchOut(repo)
    }))
  };
}

function projectLinksAction(context: ResearchChatContext): ChatUiAction | null {
  const links = projectLinks(context.repos);
  return links.length ? { type: "project_links", links } : null;
}

function actionList(actions: Array<ChatUiAction | null>) {
  return actions.filter((action): action is ChatUiAction => Boolean(action));
}

function conversationalAnswer(plan: ResearchChatPlan, context: ResearchChatContext) {
  const [best, second] = reposForPlan(plan, context);
  if (!best) {
    return plan.clarificationQuestion ?? "Tell me what you want to build and I will turn it into a repo-aware search plan.";
  }

  const idea = context.idea ? ` for ${cleanChatText(context.idea, 120)}` : "";
  const description = repoDescription(best);
  const secondLine = second ? ` I would compare it against ${second.fullName}, but I would not make you reread the whole report just to get to the next move.` : "";

  return `Yes. I would keep ${best.fullName} in the center${idea} because it looks like ${repoUseLabel(best)}.${description ? ` GitHub describes it as ${description}.` : ""}${secondLine}\n\nThe practical move is not to copy it blindly. Inspect setup, license, and recent issues, then decide what your builder should keep, replace, and ignore.`;
}

function searchReply(plan: ResearchChatPlan, context: ResearchChatContext) {
  const query = plan.searchPrompt ?? cleanChatText(context.idea || context.prompt, 180);
  return plan.intent === "new_search"
    ? `I would start a repo search for "${query}". That gives us evidence before we decide what to build.`
    : `Yes, this calls for another search pass. I would use "${query}" and look for options that cover the hard part better than the current leads.`;
}

function compareReply(plan: ResearchChatPlan, context: ResearchChatContext) {
  const repos = reposForPlan(plan, context);
  if (repos.length < 2) return "I need at least two repo leads to compare fairly, so I would run a targeted search for comparable options first.";
  const [best, second] = repos;
  return `I would compare ${best.fullName} and ${second.fullName} on fit, setup friction, docs, license, and whether they save the hard part of the build. Right now ${best.fullName} has the stronger score, but that is still a prompt to inspect rather than a license or quality guarantee.`;
}

function explainReply(plan: ResearchChatPlan, context: ResearchChatContext) {
  const [best] = reposForPlan(plan, context);
  if (!best) return "I can explain the repo once there is a repo in the current research context.";
  const description = repoDescription(best);
  return `${best.fullName} looks like ${repoUseLabel(best)}.${description ? ` The short version: ${description}.` : ""}\n\nI would treat it as useful if it already solves part of the workflow you need. I would slow down if the README, license, or setup path does not hold up when you inspect it.`;
}

function gapReply(plan: ResearchChatPlan, context: ResearchChatContext) {
  const repos = reposForPlan(plan, context);
  if (!repos.length) return "The opportunity gap needs repo evidence first, otherwise I would just be guessing.";
  const names = repos.map((repo) => repo.fullName).join(", ");
  return `The opportunity gap is probably not "nobody built anything." The current evidence says there are leads to study: ${names}. The opening is to make one clearer product for one user, with tighter onboarding and a build handoff that avoids blindly copying any repo.`;
}

function sitesReply(context: ResearchChatContext) {
  const links = projectLinks(context.repos);
  if (!links.length) return "I do not see project-site links in the current repo metadata. I would inspect README screenshots and demos next, or run a narrower search for repos with live demos.";
  return `I found ${links.length === 1 ? "one project site" : `${links.length} project sites`}. Open these before choosing a foundation, because the live product often reveals whether the repo is polished, stale, or only useful as reference.`;
}

function handoffReply(plan: ResearchChatPlan, context: ResearchChatContext) {
  const [best] = reposForPlan(plan, context);
  const target = best?.fullName ?? "the best current repo";
  return `I can start the builder handoff around ${target}, but I would confirm first. The handoff should stay advisory: inspect setup, confirm license terms, and tell the builder what to keep, replace, and ignore.`;
}

function saveReply(plan: ResearchChatPlan, context: ResearchChatContext) {
  const [best] = reposForPlan(plan, context);
  if (!best) return "Pick a repo first and I can queue it for saving.";
  return `I would save ${best.fullName} as a lead to inspect, not as a final decision. Add notes about setup, license, and why it might help your build.`;
}

function replyForPlan(plan: ResearchChatPlan, context: ResearchChatContext) {
  if (plan.intent === "refine_search" || plan.intent === "new_search") return searchReply(plan, context);
  if (plan.intent === "compare_repos") return compareReply(plan, context);
  if (plan.intent === "explain_repo") return explainReply(plan, context);
  if (plan.intent === "opportunity_gap") return gapReply(plan, context);
  if (plan.intent === "show_project_sites") return sitesReply(context);
  if (plan.intent === "start_handoff") return handoffReply(plan, context);
  if (plan.intent === "save_repo") return saveReply(plan, context);
  if (plan.intent === "ask_clarifying_question") return plan.clarificationQuestion ?? "What are you trying to build, and who is it for?";
  return conversationalAnswer(plan, context);
}

function actionsForPlan(plan: ResearchChatPlan, context: ResearchChatContext): ChatUiAction[] {
  const repos = reposForPlan(plan, context);
  const prompts = plan.suggestedPrompts.length ? plan.suggestedPrompts : suggestedPromptsForIdea(context.idea);
  const suggestions = suggestedPromptsAction(prompts);

  if (plan.intent === "refine_search" || plan.intent === "new_search") {
    return actionList([
      plan.searchPrompt ? { type: "search_query", query: plan.searchPrompt, label: "Search GitHub" } : null,
      suggestions
    ]);
  }

  if (plan.intent === "compare_repos") {
    return actionList([compareTableAction(repos), repoCardsAction(repos, "Repos to compare"), suggestions]);
  }

  if (plan.intent === "show_project_sites") {
    return actionList([projectLinksAction(context), suggestions]);
  }

  if (plan.intent === "start_handoff") {
    return actionList([
      {
        type: "handoff_confirmation",
        repoFullName: repos[0]?.fullName ?? null,
        message: "Confirm before generating the Build Pack handoff."
      },
      repoCardsAction(repos.slice(0, 1), "Handoff foundation")
    ]);
  }

  if (plan.intent === "save_repo" && repos[0]) {
    return actionList([{ type: "save_repo", repoFullName: repos[0].fullName }, repoCardsAction(repos.slice(0, 1), "Repo to save")]);
  }

  if (plan.replyStrategy === "conversational" || plan.intent === "answer_from_context" || plan.intent === "explain_repo" || plan.intent === "opportunity_gap") {
    return actionList([suggestions]);
  }

  return actionList([repoCardsAction(repos, "Relevant repos"), suggestions]);
}

export function composeResearchChatResponse(plan: ResearchChatPlan, context: ResearchChatContext): ResearchChatResponseV2 {
  return {
    version: 2,
    mode: context.mode ?? "demo",
    intent: plan.intent,
    reply: replyForPlan(plan, context),
    actions: actionsForPlan(plan, context),
    plan,
    needsConfirmation: plan.needsConfirmation
  };
}
