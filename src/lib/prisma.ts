import { PrismaClient } from "@prisma/client";
import { sanitizeError } from "./sanitize-error";

// Canonical Prisma client singleton. db.ts re-exports this instance so every
// existing `@/lib/db` import keeps working while the production connection
// check has a single, explicit home.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Returns a non-secret description of the configured database target.
 * Never logs the userinfo portion of DATABASE_URL (which contains the
 * password) or the full connection string.
 */
function safeDatabaseTarget(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) return "DATABASE_URL matches env";

  try {
    const parsed = new URL(raw);
    return parsed.host || "DATABASE_URL matches env";
  } catch {
    return "DATABASE_URL matches env";
  }
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Reuse the client across serverless invocations. Creating a new client per
// request exhausts the Supabase transaction pooler's limited connections.
globalForPrisma.prisma = db;

if (process.env.NODE_ENV === "production") {
  console.log(
    "🌐 Prisma Client initialized for Production database:",
    safeDatabaseTarget()
  );
}

/**
 * Logs database errors with a sanitized message and stack trace. Connection
 * strings, Supabase hostnames and credentials are redacted before logging.
 */
export function logSupabaseDbError(context: string, error: unknown): void {
  console.error(
    `🔴 [DB Mismatch Error] Failed to interact with Supabase client (${context}):`,
    sanitizeError(error)
  );

  const stack = error instanceof Error ? error.stack : undefined;
  if (stack) {
    console.error(
      `🔴 [DB Mismatch Error] Stack trace (${context}):`,
      sanitizeError(new Error(stack))
    );
  }
}
