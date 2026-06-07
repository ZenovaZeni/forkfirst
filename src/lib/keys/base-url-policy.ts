export const KNOWN_PROVIDER_HOSTS = [
  "api.openai.com",
  "api.groq.com",
  "api.deepseek.com",
  "openrouter.ai",
  "api.anthropic.com"
];

export type BaseUrlClassification =
  | { ok: true; trusted: true; host: string; privateHost: false }
  | { ok: true; trusted: false; host: string; privateHost: boolean }
  | { ok: false; reason: "invalid" | "bad-scheme" | "empty" };

export function privateBaseUrlsEnabled(): boolean {
  const value = typeof process !== "undefined" ? process.env.FORKFIRST_ALLOW_PRIVATE_BASE_URLS ?? process.env.OPEN_REPO_ALLOW_PRIVATE_BASE_URLS : undefined;
  return new Set(["1", "true", "yes", "on"]).has((value ?? "").toLowerCase());
}

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [first, second] = parts;

  if (first === 0 || first === 10 || first === 127) return true;
  if (first === 169 && second === 254) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const normalized = host.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:")) return true;
  if (normalized.startsWith("::ffff:")) return true;
  return false;
}

export function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost") return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return isPrivateIpv4(host);
  if (host.includes(":")) return isPrivateIpv6(host);
  return false;
}

export function classifyBaseUrl(url: string | undefined | null): BaseUrlClassification {
  if (!url || url.trim() === "") {
    return { ok: false, reason: "empty" };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "bad-scheme" };
  }

  const host = parsed.host.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();
  const privateHost = isPrivateHost(hostname);

  for (const entry of KNOWN_PROVIDER_HOSTS) {
    if (hostname === entry || hostname.endsWith(`.${entry}`)) {
      return { ok: true, trusted: true, host, privateHost: false };
    }
  }

  return { ok: true, trusted: false, host, privateHost };
}

export function requireSafeBaseUrl(
  url: string | undefined | null,
  { allowUntrusted }: { allowUntrusted: boolean }
): { host: string } {
  const classification = classifyBaseUrl(url);

  if (!classification.ok) {
    if (classification.reason === "bad-scheme") {
      throw new Error("Disallowed scheme - only http(s) is supported");
    }
    throw new Error("Invalid base URL");
  }

  if (!classification.trusted && !allowUntrusted) {
    throw new Error(`Untrusted base URL - host '${classification.host}' is not on the known-provider list`);
  }

  if (classification.privateHost && !privateBaseUrlsEnabled()) {
    throw new Error("Private or local base URLs are disabled by default for hosted safety");
  }

  return { host: classification.host };
}
