// Menu reorder ownership validation + menu-parent integrity.
//
// reorderMenuItems previously updated the sort order of ANY item id
// passed in, regardless of the requested location — an editor could
// rewrite the order of menus they were not asked to reorder. The fix
// requires every id to already belong to that location. The parent
// validation closes the other MenuItem integrity gap (parent_id is a
// plain string column without a foreign key).
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  return {
    db: {
      menuItem: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      $transaction: vi.fn(async (calls: Promise<unknown>[]) => Promise.all(calls)),
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/auth", () => {
  // requireAuth passes through the current user when role >= editor.
  const requireAuth = (user: unknown) => {
    if (!user) throw new Error("Unauthorized");
    return user;
  };
  const requireEditor = requireAuth;
  const requireAdmin = requireAuth;
  return {
    getCurrentUser: vi.fn(),
    requireAuth,
    requireEditor,
    requireAdmin,
  };
});

vi.mock("@/lib/audit", () => ({
  AUDIT_ACTIONS: {
    MENU_CREATED: "menu.create",
    MENU_UPDATED: "menu.update",
    MENU_DELETED: "menu.delete",
    MENU_REORDERED: "menu.reorder",
  },
  logAudit: vi.fn(),
}));

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { reorderMenuItems } from "@/lib/actions/cms";
import { assertValidMenuParent, assertValidMenuParentInput } from "@/lib/menu-validation";

const mockedDb = vi.mocked(db, true);

describe("reorderMenuItems — location ownership validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1", role: "editor" } as never);
    mockedDb.menuItem.update.mockResolvedValue({} as never);
  });

  it("reorders every item that belongs to the given location", async () => {
    mockedDb.menuItem.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }] as never);
    await reorderMenuItems("header", ["b", "a"]);
    expect(mockedDb.menuItem.findMany).toHaveBeenCalledWith({
      where: { location: "header", id: { in: ["b", "a"] } },
      select: { id: true },
    });
    expect(mockedDb.menuItem.update).toHaveBeenCalledTimes(2);
  });

  it("rejects ids from another location without touching the database writes", async () => {
    mockedDb.menuItem.findMany.mockResolvedValue([{ id: "a" }] as never);
    await expect(reorderMenuItems("header", ["a", "foreign-id"])).rejects.toThrow(
      "Menu items must belong to the location being reordered"
    );
    expect(mockedDb.menuItem.update).not.toHaveBeenCalled();
    expect(mockedDb.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an unknown location", async () => {
    await expect(reorderMenuItems("sidebar", ["a"])).rejects.toThrow("Invalid menu location");
    expect(mockedDb.menuItem.findMany).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(reorderMenuItems("header", ["a"])).rejects.toThrow("Unauthorized");
    expect(mockedDb.menuItem.findMany).not.toHaveBeenCalled();
  });

  it("filters out empty and non-string ids and caps the batch", async () => {
    mockedDb.menuItem.findMany.mockResolvedValue([] as never);
    await expect(reorderMenuItems("header", ["" as string, 42 as unknown as string])).rejects.toThrow(
      "No menu items to reorder"
    );
    expect(mockedDb.menuItem.findMany).not.toHaveBeenCalled();
  });
});

describe("assertValidMenuParent — dangling, cross-location and cyclic parents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts a parent that exists in the same location", async () => {
    mockedDb.menuItem.findUnique.mockResolvedValueOnce({ id: "p", parentId: null, location: "header" } as never);
    await expect(assertValidMenuParent("p", "header", "c")).resolves.toBeUndefined();
  });

  it("rejects a parent that does not exist", async () => {
    mockedDb.menuItem.findUnique.mockResolvedValueOnce(null as never);
    await expect(assertValidMenuParent("ghost", "header")).rejects.toThrow(
      "Parent menu item does not exist"
    );
  });

  it("rejects a parent in another location", async () => {
    mockedDb.menuItem.findUnique.mockResolvedValueOnce({ id: "p", parentId: null, location: "footer" } as never);
    await expect(assertValidMenuParent("p", "header")).rejects.toThrow(
      "A menu item can only be nested under an item in the same location"
    );
  });

  it("rejects a parent whose ancestor chain contains the item itself (cycle)", async () => {
    // Candidate parent B sits under A; making A the child of B would
    // produce the cycle A → B → A. The ancestry check fires before any
    // ancestor lookup, so a single findUnique (the parent) happens.
    mockedDb.menuItem.findUnique.mockResolvedValue({ id: "b", parentId: "a", location: "header" } as never);
    await expect(assertValidMenuParent("b", "header", "a")).rejects.toThrow(
      "This parent would create a menu cycle"
    );
  });

  it("assertValidMenuParentInput normalizes empty parents", () => {
    expect(assertValidMenuParentInput(undefined)).toBeNull();
    expect(assertValidMenuParentInput(null)).toBeNull();
    expect(assertValidMenuParentInput("")).toBeNull();
    expect(assertValidMenuParentInput("p")).toBe("p");
    expect(() => assertValidMenuParentInput("self", "self")).toThrow("A menu item cannot be its own parent");
  });
});
