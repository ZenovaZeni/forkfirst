const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export function serverKeyFallbacksEnabled(): boolean {
  return TRUE_VALUES.has((process.env.FORKFIRST_ALLOW_SERVER_KEYS ?? process.env.OPEN_REPO_ALLOW_SERVER_KEYS ?? "").toLowerCase());
}

export function optionalServerKey(name: "OPENAI_API_KEY" | "GITHUB_TOKEN"): string | undefined {
  if (!serverKeyFallbacksEnabled()) return undefined;
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function optionalServerModel(): string | undefined {
  if (!serverKeyFallbacksEnabled()) return undefined;
  return process.env.OPENAI_MODEL?.trim() || undefined;
}
