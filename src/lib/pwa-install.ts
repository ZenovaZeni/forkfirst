export interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const INSTALL_DISMISSED_KEY = "forkfirst:install-dismissed";
export const LEGACY_INSTALL_DISMISSED_KEY = "open-repo:install-dismissed";
export const INSTALL_EVENT_NAME = "forkfirst:pwa-install-ready";
const INSTALL_SNOOZE_MS = 24 * 60 * 60 * 1000;

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function wasInstallDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const value =
    window.localStorage.getItem(INSTALL_DISMISSED_KEY) ??
    window.localStorage.getItem(LEGACY_INSTALL_DISMISSED_KEY);

  if (!value) return false;

  const dismissedAt = Number(value);
  if (!Number.isFinite(dismissedAt)) {
    restoreInstallPrompt();
    return false;
  }

  if (Date.now() - dismissedAt > INSTALL_SNOOZE_MS) {
    restoreInstallPrompt();
    return false;
  }

  return true;
}

export function dismissInstallPrompt(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
}

export function restoreInstallPrompt(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(INSTALL_DISMISSED_KEY);
  window.localStorage.removeItem(LEGACY_INSTALL_DISMISSED_KEY);
}

export function setDeferredInstallPrompt(event: BeforeInstallPromptEvent | null): void {
  deferredInstallPrompt = event;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INSTALL_EVENT_NAME));
  }
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredInstallPrompt;
}

export async function requestPwaInstall(): Promise<"accepted" | "dismissed" | "ios" | "unavailable" | "installed"> {
  if (typeof window === "undefined") return "unavailable";
  if (isStandalonePwa()) return "installed";
  if (isIOSDevice()) return "ios";
  if (!deferredInstallPrompt) return "unavailable";

  const prompt = deferredInstallPrompt;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  deferredInstallPrompt = null;
  window.dispatchEvent(new Event(INSTALL_EVENT_NAME));
  return outcome;
}
