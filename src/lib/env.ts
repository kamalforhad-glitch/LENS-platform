// ============================================================
// Environment validation — fail fast on missing/insecure config.
// Imported by server modules (auth, backup, email) to guarantee
// production never runs with dev fallbacks or missing secrets.
// ============================================================

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Allow `next build` to collect static pages without a secret;
    // any runtime call outside the build phase must fail closed.
    if (isBuildPhase()) return "build-phase-placeholder-secret-do-not-use";
    throw new Error("JWT_SECRET environment variable is required");
  }
  if (secret.length < 32 && process.env.NODE_ENV === "production" && !isBuildPhase()) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  return secret;
}

export function getCronSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (isBuildPhase()) return "build-phase-placeholder-cron-secret";
    throw new Error("CRON_SECRET environment variable is required");
  }
  return secret;
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (isBuildPhase()) return "postgresql://build:build@localhost:5432/build?schema=public";
    throw new Error("DATABASE_URL environment variable is required");
  }
  return url;
}

/** Warn (once) about optional integrations running in stub mode. */
let warned = false;
export function warnOptionalIntegrations(): void {
  if (warned || isBuildPhase()) return;
  warned = true;
  if (!process.env.RESEND_API_KEY) {
    console.warn("[env] RESEND_API_KEY missing — emails will log as dev-mode and NOT deliver.");
  }
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[env] OPENAI_API_KEY missing — AI uses retrieval fallback without LLM answers.");
  }
  if (!process.env.S3_ACCESS_KEY_ID) {
    console.warn("[env] S3 keys missing — uploads use local public/uploads (ephemeral on serverless).");
  }
}
