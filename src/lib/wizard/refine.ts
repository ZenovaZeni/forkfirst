/**
 * Utility functions for the Idea Refinement Wizard.
 * Pure functions with no React/browser deps — safe to import in tests and server code.
 */

export function capitalizeKey(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
}

/**
 * Build a refined idea string from the original idea and the user's wizard answers.
 * Answers that are empty or equal to "Skip" are omitted.
 */
export function buildRefinedIdea(idea: string, answers: Record<string, string>): string {
  const lines = Object.entries(answers)
    .filter(([, v]) => v && v !== "Skip")
    .map(([k, v]) => `- ${capitalizeKey(k)}: ${v}`);

  if (lines.length === 0) return idea;

  return [`Original idea: "${idea}"`, ``, `Builder context:`, ...lines].join("\n");
}
