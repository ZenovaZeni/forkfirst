const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export function serverDbEnabled(): boolean {
  return TRUE_VALUES.has((process.env.FORKFIRST_ENABLE_SERVER_DB ?? process.env.OPEN_REPO_ENABLE_SERVER_DB ?? "").toLowerCase());
}
