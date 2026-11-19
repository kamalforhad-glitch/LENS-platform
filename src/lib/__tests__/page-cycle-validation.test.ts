import { describe, it, expect, vi, beforeEach } from "vitest";
import { assertValidPageParent, assertValidPageParentInput } from "@/lib/page-validation";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    page: {
      findUnique: vi.fn(),
    },
  },
}));

describe("assertValidPageParentInput", () => {
  it("returns null for undefined, null, or empty string", () => {
    expect(assertValidPageParentInput(undefined)).toBeNull();
    expect(assertValidPageParentInput(null)).toBeNull();
    expect(assertValidPageParentInput("")).toBeNull();
    expect(assertValidPageParentInput("   ")).toBeNull();
  });

  it("throws when parentId equals selfId", () => {
    expect(() => assertValidPageParentInput("page-1", "page-1")).toThrow(
      "A page cannot be its own parent"
    );
  });

  it("returns trimmed parentId for valid input", () => {
    expect(assertValidPageParentInput("  page-2  ", "page-1")).toBe("page-2");
  });
});

describe("assertValidPageParent Cycle Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when assigning self as parent", async () => {
    await expect(assertValidPageParent("page-a", "page-a")).rejects.toThrow(
      "A page cannot be its own parent"
    );
  });

  it("throws when target parent page does not exist in database", async () => {
    (db.page.findUnique as any).mockResolvedValueOnce(null);
    await expect(assertValidPageParent("nonexistent", "page-a")).rejects.toThrow(
      "Parent page does not exist"
    );
  });

  it("allows valid hierarchy assignment without cycles (C -> B -> A)", async () => {
    // Parent B has parent A; A has parent null
    (db.page.findUnique as any)
      .mockResolvedValueOnce({ id: "page-b", parentId: "page-a" })
      .mockResolvedValueOnce({ id: "page-a", parentId: null });

    // Assigning B as parent of C (selfId: page-c)
    await expect(assertValidPageParent("page-b", "page-c")).resolves.toBeUndefined();
  });

  it("rejects direct cycle: A -> B and then updating A's parent to B (B -> A)", async () => {
    // Updating page A: user tries to set parent to B
    // In DB, B already has parentId: "page-a"
    (db.page.findUnique as any).mockResolvedValueOnce({
      id: "page-b",
      parentId: "page-a",
    });

    await expect(assertValidPageParent("page-b", "page-a")).rejects.toThrow(
      "This parent assignment would create a circular page hierarchy"
    );
  });

  it("rejects multi-level cycle: A -> B -> C and then updating A's parent to C (C -> B -> A)", async () => {
    // Updating page A: user tries to set parent to C
    // In DB, C has parent B, B has parent A
    (db.page.findUnique as any)
      .mockResolvedValueOnce({ id: "page-c", parentId: "page-b" })
      .mockResolvedValueOnce({ id: "page-b", parentId: "page-a" });

    await expect(assertValidPageParent("page-c", "page-a")).rejects.toThrow(
      "This parent assignment would create a circular page hierarchy"
    );
  });
});
