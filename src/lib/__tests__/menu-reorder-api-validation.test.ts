import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/menus/route";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    menuItem: {
      findMany: mocks.findMany,
      update: mocks.update,
    },
    $transaction: mocks.transaction,
  },
}));

let mockUser: { id: string; email: string; role: string } | null = {
  id: "user-1",
  email: "admin@lens.org.bd",
  role: "admin",
};

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(async () => mockUser),
  requireAuth: vi.fn((user) => {
    if (!user) throw new Error("Unauthorized");
  }),
  requireAdmin: vi.fn((user) => {
    if (!user) throw new Error("Unauthorized");
    if (user.role !== "admin" && user.role !== "super_admin") throw new Error("Forbidden");
  }),
  requireEditor: vi.fn((user) => {
    if (!user) throw new Error("Unauthorized");
    if (!["admin", "super_admin", "editor"].includes(user.role)) throw new Error("Forbidden");
  }),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
  AUDIT_ACTIONS: {
    MENU_REORDERED: "MENU_REORDERED",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
}));

function reorderReq(body: unknown) {
  return new NextRequest("http://localhost/api/admin/menus", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/admin/menus reorder validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-1", email: "admin@lens.org.bd", role: "admin" };
  });

  it("rejects items that do not belong to the reordered location", async () => {
    mocks.findMany.mockResolvedValueOnce([
      { id: "a", parentId: null },
      { id: "b", parentId: null },
    ]);

    const res = await POST(
      reorderReq({
        action: "reorder",
        location: "header",
        items: [
          { id: "a", sortOrder: 0 },
          { id: "foreign", sortOrder: 1 },
        ],
      })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Menu items must belong to the location being reordered" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a parent outside the same location", async () => {
    mocks.findMany.mockResolvedValueOnce([
      { id: "a", parentId: null },
      { id: "b", parentId: null },
    ]);

    const res = await POST(
      reorderReq({
        action: "reorder",
        location: "header",
        items: [
          { id: "a", sortOrder: 0, parentId: "footer-item" },
          { id: "b", sortOrder: 1 },
        ],
      })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "A menu item can only be nested under an item in the same location",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects self-parenting", async () => {
    mocks.findMany.mockResolvedValueOnce([
      { id: "a", parentId: null },
      { id: "b", parentId: null },
    ]);

    const res = await POST(
      reorderReq({
        action: "reorder",
        location: "header",
        items: [
          { id: "a", sortOrder: 0, parentId: "a" },
          { id: "b", sortOrder: 1 },
        ],
      })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "A menu item cannot be its own parent" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a cycle created by proposed parent changes", async () => {
    mocks.findMany.mockResolvedValueOnce([
      { id: "a", parentId: null },
      { id: "b", parentId: "a" },
      { id: "c", parentId: "b" },
    ]);

    const res = await POST(
      reorderReq({
        action: "reorder",
        location: "header",
        items: [
          { id: "a", sortOrder: 0, parentId: "c" },
          { id: "b", sortOrder: 1, parentId: "a" },
          { id: "c", sortOrder: 2, parentId: "b" },
        ],
      })
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "This parent would create a menu cycle" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("accepts a valid reorder in the same location", async () => {
    mocks.findMany.mockResolvedValueOnce([
      { id: "a", parentId: null },
      { id: "b", parentId: null },
    ]);
    mocks.transaction.mockResolvedValueOnce([]);

    const res = await POST(
      reorderReq({
        action: "reorder",
        location: "header",
        items: [
          { id: "b", sortOrder: 0, parentId: null },
          { id: "a", sortOrder: 1, parentId: "b" },
        ],
      })
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
