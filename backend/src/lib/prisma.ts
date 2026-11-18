import { PrismaClient } from "@prisma/client";
import { env, requireDatabaseEnv } from "./env";
import { sanitizeError } from "./error";

// Lazy singleton: creating the client only happens on the first DB-backed
// request. /api/v1/health therefore remains a database-independent liveness
// probe.
const globalForPrisma = globalThis as unknown as {
  lensBackendPrisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  requireDatabaseEnv();

  const client =
    globalForPrisma.lensBackendPrisma ??
    new PrismaClient({
      log: env.nodeEnv === "development" ? ["error", "warn"] : ["error"],
    });

  globalForPrisma.lensBackendPrisma = client;

  if (env.isProduction) {
    console.log(
      "[lens-backend] Prisma Client initialized for configured database host:",
      safeDatabaseTarget()
    );
  }

  return client;
}

export function getDb(): PrismaClient {
  return createPrismaClient();
}

export async function disconnectPrisma(): Promise<void> {
  const client = globalForPrisma.lensBackendPrisma;
  if (!client) return;

  delete globalForPrisma.lensBackendPrisma;
  await client.$disconnect();
}

/**
 * Returns only the non-secret host portion of DATABASE_URL. Never logs
 * userinfo, passwords, query strings, or the full connection string.
 */
export function safeDatabaseTarget(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) return "DATABASE_URL not set";

  try {
    return new URL(raw).host || "DATABASE_URL set";
  } catch {
    return "DATABASE_URL set";
  }
}

export function logDatabaseError(context: string, error: unknown): void {
  console.error(
    `[Prisma] ${context} failed (target: ${safeDatabaseTarget()}): ${sanitizeError(error)}`
  );
}
