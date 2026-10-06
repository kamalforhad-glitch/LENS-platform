import { describe, expect, it } from "vitest";
import { validateFileSize, validateFileType } from "@/lib/storage";

describe("upload allowlist (SVG must be rejected)", () => {
  it("allows jpg/png/webp/pdf", () => {
    expect(validateFileType("image/jpeg")).toBe(true);
    expect(validateFileType("image/png")).toBe(true);
    expect(validateFileType("image/webp")).toBe(true);
    expect(validateFileType("application/pdf")).toBe(true);
  });

  it("rejects svg and executables", () => {
    expect(validateFileType("image/svg+xml")).toBe(false);
    expect(validateFileType("application/x-sh")).toBe(false);
    expect(validateFileSize("image/svg+xml", 10).valid).toBe(false);
  });

  it("enforces image size quota", () => {
    expect(validateFileSize("image/jpeg", 11 * 1024 * 1024).valid).toBe(false);
    expect(validateFileSize("image/jpeg", 1024).valid).toBe(true);
  });
});
