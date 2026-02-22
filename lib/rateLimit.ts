interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Module-level store — resets on server restart (adequate for this project)
const store = new Map<string, RateLimitEntry>();

/**
 * Checks and increments the rate limit counter for the given IP + endpoint.
 * Returns true if the request is allowed; false if the limit is exceeded.
 */
export function rateLimit(
  ip: string,
  endpoint: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  const key = `${endpoint}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count++;
  return true;
}
