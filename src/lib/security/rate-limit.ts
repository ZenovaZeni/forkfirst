type RateLimitEntry = {
  count: number;
  windowStart: number;
};

type RateLimitOptions = {
  max: number;
  windowMs: number;
  staleMs?: number;
  scope?: string;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function checkRateLimit(
  bucket: Map<string, RateLimitEntry>,
  key: string,
  {
    max,
    windowMs,
    staleMs = windowMs * 5
  }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();

  for (const [entryKey, entry] of bucket.entries()) {
    if (now - entry.windowStart > staleMs) bucket.delete(entryKey);
  }

  const entry = bucket.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    bucket.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count < max) {
    entry.count++;
    return { allowed: true };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.ceil((windowMs - (now - entry.windowStart)) / 1000)
  };
}

function upstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

function safeRateLimitPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9:._-]/g, "_").slice(0, 180);
}

async function checkUpstashRateLimit(key: string, { max, windowMs, scope = "global" }: RateLimitOptions): Promise<RateLimitResult | null> {
  const config = upstashConfig();
  if (!config) return null;

  const now = Date.now();
  const windowId = Math.floor(now / windowMs);
  const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now % windowMs)) / 1000));
  const redisKey = `forkfirst:ratelimit:${safeRateLimitPart(scope)}:${safeRateLimitPart(key)}:${windowId}`;

  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, Math.ceil(windowMs / 1000) + 5]
      ]),
      cache: "no-store"
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as Array<{ result?: unknown; error?: string }>;
    const count = Number(payload[0]?.result ?? 0);
    if (!Number.isFinite(count) || count <= max) return { allowed: true };
    return { allowed: false, retryAfterSeconds };
  } catch {
    return null;
  }
}

export async function checkRateLimitForRequest(
  request: Request,
  bucket: Map<string, RateLimitEntry>,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const clientIp = getClientIp(request);
  const durable = await checkUpstashRateLimit(clientIp, options);
  return durable ?? checkRateLimit(bucket, clientIp, options);
}
