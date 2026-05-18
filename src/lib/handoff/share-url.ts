/**
 * share-url.ts — encode/decode Builder Handoff packs into URL-safe hash payloads.
 *
 * Format: v1.<idea-slug-32chars>.<base64url-gzipped-markdown>
 *
 * The hash fragment is never sent to any server — full client-side privacy.
 */

const VERSION = "v1";
const MAX_PAYLOAD_LENGTH = 6000;

// ─── base64url helpers ────────────────────────────────────────────────────────

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const full = pad ? padded + "=".repeat(4 - pad) : padded;
  const binary = atob(full);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── gzip via CompressionStream (browser) or zlib (Node) ─────────────────────

async function gzipBytes(input: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream !== "undefined") {
    const cs = new CompressionStream("gzip");
    const writer = cs.writable.getWriter();
    writer.write(input as unknown as Uint8Array<ArrayBuffer>);
    writer.close();
    const chunks: Uint8Array[] = [];
    const reader = cs.readable.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
  // Node fallback
  const zlib = await import("zlib");
  return new Promise<Uint8Array>((resolve, reject) => {
    zlib.gzip(Buffer.from(input), (err, result) => {
      if (err) reject(err);
      else resolve(new Uint8Array(result));
    });
  });
}

async function gunzipBytes(input: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== "undefined") {
    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    writer.write(input as unknown as Uint8Array<ArrayBuffer>);
    writer.close();
    const chunks: Uint8Array[] = [];
    const reader = ds.readable.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
  // Node fallback
  const zlib = await import("zlib");
  return new Promise<Uint8Array>((resolve, reject) => {
    zlib.gunzip(Buffer.from(input), (err, result) => {
      if (err) reject(err);
      else resolve(new Uint8Array(result));
    });
  });
}

// ─── idea slug ───────────────────────────────────────────────────────────────

export function ideaSlug(idea: string): string {
  return idea
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "handoff";
}

// ─── public API ───────────────────────────────────────────────────────────────

/**
 * Compress markdown + idea into a URL-safe hash payload.
 * Throws if the resulting payload exceeds MAX_PAYLOAD_LENGTH.
 */
export async function encodeHandoff(markdown: string, idea: string): Promise<string> {
  const encoder = new TextEncoder();
  const payload = JSON.stringify({ markdown, idea });
  const compressed = await gzipBytes(encoder.encode(payload));
  const b64 = toBase64Url(compressed);
  const slug = ideaSlug(idea);
  const result = `${VERSION}.${slug}.${b64}`;

  if (result.length > MAX_PAYLOAD_LENGTH) {
    throw new Error(
      `Handoff too long to share — copy markdown instead. (${result.length} chars, limit ${MAX_PAYLOAD_LENGTH})`
    );
  }

  return result;
}

/**
 * Decode a hash payload back to { markdown, idea }.
 * Returns null if the payload is malformed or cannot be decompressed.
 */
export async function decodeHandoff(payload: string): Promise<{ markdown: string; idea: string } | null> {
  try {
    const parts = payload.split(".");
    // Must start with version prefix and have at least 3 parts
    if (parts.length < 3 || parts[0] !== VERSION) return null;

    // The b64 data is everything after "v1.<slug>."
    const b64 = parts.slice(2).join(".");
    if (!b64) return null;

    const compressed = fromBase64Url(b64);
    const decompressed = await gunzipBytes(compressed);
    const text = new TextDecoder().decode(decompressed);
    const parsed = JSON.parse(text) as unknown;

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).markdown !== "string" ||
      typeof (parsed as Record<string, unknown>).idea !== "string"
    ) {
      return null;
    }

    return parsed as { markdown: string; idea: string };
  } catch {
    return null;
  }
}
