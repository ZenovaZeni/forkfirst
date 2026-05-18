import type { UserKeys } from "@/components/key-settings";

export type KeyCheckStatus = "missing" | "saved" | "verified" | "failed";

export type KeyVerificationState = {
  github: KeyCheckStatus;
  ai: KeyCheckStatus;
  message: string;
  checkedAt: string | null;
};

export function getSavedKeyState(keys: UserKeys): KeyVerificationState {
  return {
    github: keys.githubToken.trim() ? "saved" : "missing",
    ai: keys.aiApiKey.trim() ? "saved" : "missing",
    message: keys.githubToken.trim() || keys.aiApiKey.trim() ? "Keys are configured in this browser. Verify them to confirm they work." : "No keys configured yet.",
    checkedAt: null
  };
}

export function keyStatusLabel(status: KeyCheckStatus): string {
  if (status === "verified") return "Verified";
  if (status === "failed") return "Failed";
  if (status === "saved") return "Configured";
  return "Missing";
}
