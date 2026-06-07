import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { classifyBaseUrl, isPrivateHost, privateBaseUrlsEnabled } from "./base-url-policy";

async function hostnameResolvesToPrivateAddress(hostname: string): Promise<boolean> {
  if (isIP(hostname) || hostname.toLowerCase() === "localhost") return isPrivateHost(hostname);

  let result: { address: string; family: number } | Array<{ address: string; family: number }>;
  try {
    result = await lookup(hostname, { all: true, verbatim: false });
  } catch {
    throw new Error("Unable to verify base URL host");
  }

  const addresses = Array.isArray(result) ? result : [result];
  return addresses.some((entry) => isPrivateHost(entry.address));
}

export async function requireSafeBaseUrl(
  url: string | undefined | null,
  { allowUntrusted }: { allowUntrusted: boolean }
): Promise<{ host: string }> {
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

  if (!classification.trusted) {
    const parsed = new URL(url!);
    const resolvesToPrivate = await hostnameResolvesToPrivateAddress(parsed.hostname);
    if (resolvesToPrivate && !privateBaseUrlsEnabled()) {
      throw new Error("Private or local base URLs are disabled by default for hosted safety");
    }
  }

  return { host: classification.host };
}
