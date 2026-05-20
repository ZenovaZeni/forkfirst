export type SetupFitTone = "good" | "caution" | "neutral";

export type SetupFit = {
  id:
    | "web-hosted"
    | "docker-friendly"
    | "windows-friendly"
    | "mac-linux-focused"
    | "mobile-native"
    | "desktop-native"
    | "unknown";
  label: string;
  detail: string;
  tone: SetupFitTone;
};

export type SetupPreference = "any" | "web" | "docker" | "windows" | "mac" | "linux" | "mobile";

export type SetupFitRepo = {
  fullName: string;
  description?: string | null;
  language?: string | null;
  topics?: string[];
  homepage?: string | null;
  readme?: {
    excerpt?: string;
    reasons?: string[];
    hasLocalDevelopment?: boolean;
  };
};

const WEB_TERMS = /\b(next\.?js|react|vite|svelte|remix|astro|web app|saas|dashboard|admin|frontend|fullstack|vercel|netlify|railway|supabase|pwa)\b/i;
const DOCKER_TERMS = /\b(docker|dockerfile|docker-compose|compose\.ya?ml|devcontainer|container)\b/i;
const WINDOWS_TERMS = /\b(windows|win32|powershell|\.exe|msi|visual studio|wsl)\b/i;
const MAC_LINUX_TERMS = /\b(mac ?os|darwin|linux|unix|bash|shell|brew install|apt install|makefile)\b/i;
const MOBILE_TERMS = /\b(android|ios|iphone|ipad|mobile app|react native|flutter|kotlin|swift|dart)\b/i;
const DESKTOP_TERMS = /\b(electron|tauri|desktop app|native app)\b/i;

function repoSearchText(repo: SetupFitRepo) {
  return [
    repo.fullName,
    repo.description ?? "",
    repo.language ?? "",
    repo.homepage ?? "",
    ...(repo.topics ?? []),
    repo.readme?.excerpt ?? "",
    ...(repo.readme?.reasons ?? [])
  ].join(" ");
}

export function inferRepoSetupFit(repo: SetupFitRepo): SetupFit {
  const text = repoSearchText(repo);
  const language = (repo.language ?? "").toLowerCase();

  if (DOCKER_TERMS.test(text)) {
    return {
      id: "docker-friendly",
      label: "Docker-friendly",
      detail: "Likely easier to run across Windows, macOS, Linux, or a hosted container.",
      tone: "good"
    };
  }

  if (MOBILE_TERMS.test(text) || ["kotlin", "swift", "dart"].includes(language)) {
    return {
      id: "mobile-native",
      label: "Mobile-focused",
      detail: "Looks aimed at iOS, Android, Flutter, or React Native rather than a normal web starter.",
      tone: "caution"
    };
  }

  if (DESKTOP_TERMS.test(text)) {
    return {
      id: "desktop-native",
      label: "Desktop app",
      detail: "Likely has desktop-specific setup. Good if you want native desktop, heavier for a web app.",
      tone: "caution"
    };
  }

  if (WINDOWS_TERMS.test(text)) {
    return {
      id: "windows-friendly",
      label: "Windows signals",
      detail: "Docs or metadata mention Windows, PowerShell, WSL, or Windows packaging.",
      tone: "good"
    };
  }

  if (MAC_LINUX_TERMS.test(text)) {
    return {
      id: "mac-linux-focused",
      label: "macOS/Linux docs",
      detail: "Setup language leans shell, brew, apt, Makefile, or Unix-style tooling.",
      tone: "caution"
    };
  }

  if (WEB_TERMS.test(text) || ["typescript", "javascript", "html", "css"].includes(language) || Boolean(repo.homepage)) {
    return {
      id: "web-hosted",
      label: "Web/hosted",
      detail: "OS should matter less if the app runs through a web dev server or hosted platform.",
      tone: "good"
    };
  }

  if (repo.readme?.hasLocalDevelopment) {
    return {
      id: "unknown",
      label: "Local setup likely",
      detail: "README mentions local development, but OS compatibility still needs inspection.",
      tone: "neutral"
    };
  }

  return {
    id: "unknown",
    label: "Setup unclear",
    detail: "GitHub metadata is not enough to tell which OS or setup path this favors.",
    tone: "neutral"
  };
}

export function setupPreferenceScore(fit: SetupFit, preference: SetupPreference) {
  if (preference === "any") return 0;
  if (fit.id === "docker-friendly") return preference === "docker" ? 5 : 3;
  if (preference === "web") return fit.id === "web-hosted" ? 5 : fit.id === "desktop-native" || fit.id === "mobile-native" ? -3 : 0;
  if (preference === "windows") return fit.id === "windows-friendly" || fit.id === "web-hosted" ? 4 : fit.id === "mac-linux-focused" ? -2 : 0;
  if (preference === "mac" || preference === "linux") return fit.id === "mac-linux-focused" || fit.id === "web-hosted" ? 4 : 0;
  if (preference === "mobile") return fit.id === "mobile-native" ? 5 : fit.id === "web-hosted" ? 1 : -1;
  return 0;
}
