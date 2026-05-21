const EMPTY_URL_VALUES = new Set(["", "#", "-", "none", "null", "undefined", "n/a", "na"]);
const PLACEHOLDER_HOSTS = new Set(["example.com", "example.org", "example.net"]);

export function stripUntrustedRepoContent(value: string | null | undefined) {
  return (value ?? "")
    .replaceAll("<UNTRUSTED_REPO_CONTENT>", "")
    .replaceAll("</UNTRUSTED_REPO_CONTENT>", "")
    .trim();
}

export function safeExternalUrl(value: string | null | undefined) {
  const trimmed = stripUntrustedRepoContent(value);
  if (!trimmed || EMPTY_URL_VALUES.has(trimmed.toLowerCase())) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeRepoPath(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
  const parts = trimmed.split("/").filter(Boolean);
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
}

function isLocalOrPlaceholderHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const private172 = host.match(/^172\.(\d{1,2})\./);
  const private172Octet = private172 ? Number(private172[1]) : null;
  return (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::" ||
    host === "::1" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    (private172Octet !== null && private172Octet >= 16 && private172Octet <= 31) ||
    host.startsWith("fc") ||
    host.startsWith("fd") ||
    host.startsWith("fe80:") ||
    host.startsWith("::ffff:") ||
    host.endsWith(".local") ||
    PLACEHOLDER_HOSTS.has(host) ||
    host.endsWith(".example.com") ||
    host.endsWith(".example.org") ||
    host.endsWith(".example.net")
  );
}

export function safeProjectSiteUrl(
  value: string | null | undefined,
  context: { repoUrl?: string | null; fullName?: string | null } = {}
) {
  const safeUrl = safeExternalUrl(value);
  if (!safeUrl) return null;

  const url = new URL(safeUrl);
  const host = url.hostname.toLowerCase();
  if (isLocalOrPlaceholderHost(host)) return null;

  const repoUrl = safeExternalUrl(context.repoUrl);
  if (repoUrl && url.toString().replace(/\/$/, "") === repoUrl.replace(/\/$/, "")) return null;

  if (host === "github.com" || host === "www.github.com") {
    const homepageRepoPath = normalizeRepoPath(url.pathname);
    const contextRepoPath = normalizeRepoPath(context.fullName) ?? (repoUrl ? normalizeRepoPath(new URL(repoUrl).pathname) : null);
    if (!contextRepoPath || homepageRepoPath === contextRepoPath) return null;
  }

  return url.toString();
}
