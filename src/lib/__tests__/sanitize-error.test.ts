import { describe, expect, it } from "vitest";
import { sanitizeError } from "@/lib/sanitize-error";

describe("sanitizeError", () => {
  it("redacts postgresql connection strings", () => {
    const err = new Error("failed: postgresql://user:pass@host:5432/db");
    const result = sanitizeError(err);
    expect(result).toContain("[REDACTED_CONNECTION_STRING]");
    expect(result).not.toContain("postgresql://");
    expect(result).not.toContain("user:pass");
  });

  it("redacts postgres connection strings", () => {
    const err = new Error("failed: postgres://user:pass@host:5432/db");
    const result = sanitizeError(err);
    expect(result).toContain("[REDACTED_CONNECTION_STRING]");
    expect(result).not.toContain("postgres://");
  });

  it("redacts Supabase pooler hosts", () => {
    const err = new Error("failed: aws-0-ap-northeast-2.pooler.supabase.com");
    const result = sanitizeError(err);
    expect(result).toContain("[REDACTED_HOST]");
    expect(result).not.toContain("pooler.supabase.com");
  });

  it("redacts R2 hosts", () => {
    const err = new Error("failed: account.r2.cloudflarestorage.com");
    const result = sanitizeError(err);
    expect(result).toContain("[REDACTED_HOST]");
    expect(result).not.toContain("r2.cloudflarestorage.com");
  });

  it("redacts AWS access keys", () => {
    const err = new Error("failed with AKIAIOSFODNN7EXAMPLE");
    const result = sanitizeError(err);
    expect(result).toContain("[REDACTED_ACCESS_KEY]");
    expect(result).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });

  it("redacts AWS secret keys", () => {
    const err = new Error("failed with deadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
    const result = sanitizeError(err);
    expect(result).toContain("[REDACTED_SECRET_KEY]");
    expect(result).not.toContain("deadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
  });

  it("redacts authorization headers", () => {
    const err = new Error("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9");
    const result = sanitizeError(err);
    expect(result).toContain("[REDACTED_TOKEN]");
    expect(result).not.toContain("eyJhbGciOiJIUzI1NiJ9");
  });

  it("redacts nested error causes", () => {
    const cause = new Error("postgresql://user:pass@host:5432/db");
    const err = new Error("outer error", { cause });
    const result = sanitizeError(err);
    expect(result).toContain("[REDACTED_CONNECTION_STRING]");
    expect(result).not.toContain("postgresql://");
    expect(result).toContain("caused by:");
  });

  it("returns generic message for unknown errors", () => {
    expect(sanitizeError("something went wrong")).toBe("Operation failed");
    expect(sanitizeError(null)).toBe("Operation failed");
    expect(sanitizeError(undefined)).toBe("Operation failed");
    expect(sanitizeError({})).toBe("Operation failed");
  });

  it("preserves non-sensitive error messages", () => {
    const err = new Error("pg_dump binary not found");
    expect(sanitizeError(err)).toBe("pg_dump binary not found");
  });

  it("does not false-positive on ordinary words", () => {
    const err = new Error("HELLO WORLD test file upload completed");
    const result = sanitizeError(err);
    expect(result).toBe("HELLO WORLD test file upload completed");
  });
});
