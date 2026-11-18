import "dotenv/config";

const DATABASE_ENV_KEYS = ["DATABASE_URL", "DIRECT_URL"] as const;
const LOCAL_CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"] as const;

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

function parsePort(raw: string | undefined): number {
  if (!raw) return 3001;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw new Error("Invalid PORT: expected an integer between 1 and 65535");
  }
  return value;
}

function normalizeOrigin(raw: string): string {
  const value = raw.trim().replace(/\/+$/, "");

  if (!value || value === "*") {
    throw new Error(
      "Invalid CORS_ORIGIN: use explicit http(s) origins, not a wildcard"
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      "Invalid CORS_ORIGIN: expected an absolute http(s) origin such as https://example.com"
    );
  }

  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") || parsed.origin !== value) {
    throw new Error(
      "Invalid CORS_ORIGIN: expected scheme://host[:port] with no path, query, or fragment"
    );
  }

  if (isProduction && /^(http:\/\/)?(localhost|127\.0\.0\.1)(:|\/|$)/i.test(value)) {
    throw new Error(
      "Invalid CORS_ORIGIN: localhost origins are not allowed when NODE_ENV=production"
    );
  }

  return value;
}

function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw || !raw.trim()) {
    if (isProduction) {
      throw new Error(
        "CORS_ORIGIN is required in production and must contain the frontend origin"
      );
    }
    return [...LOCAL_CORS_ORIGINS];
  }

  const origins = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  if (origins.length === 0) {
    throw new Error("CORS_ORIGIN must contain at least one origin");
  }

  return [...new Set(origins)];
}

function validateServerEnv(): void {
  parsePort(process.env.PORT);
  parseCorsOrigins(process.env.CORS_ORIGIN);
}

/**
 * Database variables are required for DB-backed routes, but are intentionally
 * not required for /api/v1/health so liveness checks do not depend on DB
 * configuration or connectivity.
 */
export function requireDatabaseEnv(): void {
  const missing = DATABASE_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return !value || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(", ")}`
    );
  }
}

validateServerEnv();

export const env = Object.freeze({
  nodeEnv,
  isProduction,
  port: parsePort(process.env.PORT),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
});
