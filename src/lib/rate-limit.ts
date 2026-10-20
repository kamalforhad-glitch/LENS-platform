// ============================================================
// In-memory sliding-window rate limiter.
// Suitable for single-instance deployments; serverless cold starts
// reset counters — acceptable as a first line against credential
// stuffing on server actions (DB-backed sessions still gate access).
// Pure module so unit tests can inject/advance the clock.
// ============================================================

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
  attemptsLeft: number;
}

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();
let bucketClock: () => number = () => Date.now();

/** Test-only: replace the clock source. */
export function __setRateLimitClock(clock: () => number): void {
  bucketClock = clock;
}

/** Test-only: clear all buckets. */
export function __resetRateLimits(): void {
  buckets.clear();
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = bucketClock();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  // Drop timestamps outside the window.
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    const retryAfterMs = windowMs - (now - oldest);
    buckets.set(key, bucket);
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs), attemptsLeft: 0 };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  // Opportunistic cleanup: drop empty buckets occasionally to bound memory.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      const live = v.timestamps.filter((t) => now - t < windowMs);
      if (live.length === 0) buckets.delete(k);
      else v.timestamps = live;
    }
  }

  return { allowed: true, retryAfterMs: 0, attemptsLeft: limit - bucket.timestamps.length };
}

/** Clear a key's bucket (e.g. successful login). */
export function clearRateLimit(key: string): void {
  buckets.delete(key);
}

// ============================================================
// Authentication-specific limiter presets
// ============================================================

export const LOGIN_LIMIT = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** Sliding-window failure counter for login attempts. */
export function loginRateLimit(ip: string, email: string): RateLimitResult {
  const normalizedEmail = (email || "").trim().toLowerCase();
  return consumeRateLimit(`login:${ip}:${normalizedEmail}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
}

export function clearLoginRateLimit(ip: string, email: string): void {
  buckets.delete(`login:${ip}:${(email || "").trim().toLowerCase()}`);
}
