import { describe, expect, it } from "vitest";
import { chunkText } from "@/lib/ai";

describe("AI RAG chunking", () => {
  it("returns no chunks for empty docs", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("splits long docs with overlap and drops tiny tails", () => {
    const chunks = chunkText("a".repeat(2500));
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.trim().length > 50)).toBe(true);
  });
});

describe("AI conversation ownership rule", () => {
  // Mirrors ownsConversation() in src/app/api/ai/chat/route.ts (route module
  // itself can't be imported here — it pulls next/headers + Prisma).
  // ownerKey = `user-<id>` when signed in, else `session-<ip>`.
  const owns = (sessionId: string, ownerKey: string, ip: string) =>
    sessionId.startsWith(`${ownerKey}-`) || sessionId.startsWith(`session-${ip}-`);
  it("binds authenticated conversations to the user id, not the IP", () => {
    expect(owns("user-uuid-1-123", "user-uuid-1", "1.2.3.4")).toBe(true);
    expect(owns("user-uuid-1-123", "user-uuid-1", "9.9.9.9")).toBe(true);
    expect(owns("user-uuid-2-123", "user-uuid-1", "1.2.3.4")).toBe(false);
  });
  it("keeps legacy anonymous rows IP-checked", () => {
    expect(owns("session-1.2.3.4-123", "session-1.2.3.4", "1.2.3.4")).toBe(true);
    expect(owns("session-1.2.3.4-123", "session-9.9.9.9", "9.9.9.9")).toBe(false);
  });
});
