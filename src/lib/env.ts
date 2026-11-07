// ============================================================
// Environment validation — fail fast on missing/insecure config.
// Imported by server modules (auth, backup, email) to guarantee
// production never runs with dev fallbacks or missing secrets.
// ============================================================

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production" && !isBuildPhase();
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Allow `next build` to collect static pages without a secret;
    // any runtime call outside the build phase must fail closed.
    if (isBuildPhase()) return "build-phase-placeholder-secret-do-not-use";
    throw new Error("JWT_SECRET environment variable is required");
  }
  if (isProduction() && secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  // Never allow a build-phase placeholder to be used at runtime.
  if (isProduction() && secret === "build-phase-placeholder-secret-do-not-use") {
    throw new Error("JWT_SECRET build-phase placeholder must not be used in production");
  }
  return secret;
}

export function getCronSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (isBuildPhase()) return "build-phase-placeholder-cron-secret";
    throw new Error("CRON_SECRET environment variable is required");
  }
  if (isProduction() && secret === "build-phase-placeholder-cron-secret") {
    throw new Error("CRON_SECRET build-phase placeholder must not be used in production");
  }
  return secret;
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (isBuildPhase()) return "postgresql://build:build@localhost:5432/build?schema=public";
    throw new Error("DATABASE_URL environment variable is required");
  }
  if (isProduction() && url === "postgresql://build:build@localhost:5432/build?schema=public") {
    throw new Error("DATABASE_URL build-phase placeholder must not be used in production");
  }
  return url;
}

/**
 * Returns the media R2 bucket name. Required in production for media uploads.
 * Never falls back to the backup bucket.
 */
export function requireMediaBucket(): string {
  const bucket = process.env.R2_MEDIA_BUCKET;
  if (!bucket) {
    if (isBuildPhase()) return "build-phase-media-bucket";
    if (isProduction()) {
      throw new Error("R2_MEDIA_BUCKET environment variable is required in production");
    }
    return "";
  }
  if (isProduction() && bucket === "build-phase-media-bucket") {
    throw new Error("R2_MEDIA_BUCKET build-phase placeholder must not be used in production");
  }
  return bucket;
}

/**
 * Returns the backup R2 bucket name. Required in production for backup uploads.
 * Never falls back to the media bucket.
 */
export function requireBackupBucket(): string {
  const bucket = process.env.R2_BACKUP_BUCKET;
  if (!bucket) {
    if (isBuildPhase()) return "build-phase-backup-bucket";
    if (isProduction()) {
      throw new Error("R2_BACKUP_BUCKET environment variable is required in production");
    }
    return "";
  }
  if (isProduction() && bucket === "build-phase-backup-bucket") {
    throw new Error("R2_BACKUP_BUCKET build-phase placeholder must not be used in production");
  }
  return bucket;
}

/**
 * Ensures media and backup buckets are never the same value in production.
 * Prevents accidental co-mingling of media objects and backup artifacts.
 */
export function assertBucketsDistinct(): void {
  if (!isProduction()) return;
  const media = process.env.R2_MEDIA_BUCKET;
  const backup = process.env.R2_BACKUP_BUCKET;
  if (media && backup && media === backup) {
    throw new Error(
      "R2_MEDIA_BUCKET and R2_BACKUP_BUCKET must not be the same bucket in production"
    );
  }
}
