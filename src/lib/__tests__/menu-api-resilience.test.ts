import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  GET,
  POST,
  PUT,
  DELETE,
  isTableMissingError,
  isSchemaColumnMissingError,
  isDatabaseConnectionError,
} from "@/app/api/admin/menus/route";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    menuItem: {
      findMany: mocks.findMany,
      findFirst: mocks.findFirst,
      findUnique: mocks.findUnique,
      create: mocks.create,
      update: mocks.update,
      delete: mocks.delete,
      deleteMany: mocks.deleteMany,
      updateMany: mocks.updateMany,
    },
    $transaction: mocks.transaction,
    $queryRaw: mocks.queryRaw,
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
    if (user.role !== "admin") throw new Error("Forbidden");
  }),
  requireEditor: vi.fn((user) => {
    if (!user) throw new Error("Unauthorized");
    if (user.role !== "admin" && user.role !== "editor") throw new Error("Forbidden");
  }),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
  AUDIT_ACTIONS: {
    MENU_CREATED: "MENU_CREATED",
    MENU_UPDATED: "MENU_UPDATED",
    MENU_DELETED: "MENU_DELETED",
    MENU_REORDERED: "MENU_REORDERED",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Menu API Resilience & Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-1", email: "admin@lens.org.bd", role: "admin" };
  });

  describe("Error Classification Helpers", () => {
    it("identifies missing table errors", () => {
      expect(isTableMissingError({ code: "42P01", message: 'relation "menu_items" does not exist' })).toBe(true);
      expect(isTableMissingError(new Error('table "menu_items" does not exist'))).toBe(true);
      expect(isTableMissingError(new Error("UndefinedTable: relation not found"))).toBe(true);
      expect(isTableMissingError({ code: "P2022", message: "column does not exist" })).toBe(false);
      expect(isTableMissingError(null)).toBe(false);
    });

    it("identifies column missing errors (schema drift)", () => {
      expect(isSchemaColumnMissingError({ code: "P2022", message: "column description does not exist" })).toBe(true);
      expect(isSchemaColumnMissingError({ code: "42703", message: 'column "status" does not exist' })).toBe(true);
      expect(isSchemaColumnMissingError(new Error('column "description" does not exist'))).toBe(true);
      expect(isSchemaColumnMissingError(new Error("Generic error"))).toBe(false);
      expect(isSchemaColumnMissingError(null)).toBe(false);
    });

    it("identifies database connection errors", () => {
      expect(isDatabaseConnectionError({ name: "PrismaClientInitializationError", message: "Can't reach db" })).toBe(true);
      expect(isDatabaseConnectionError({ code: "P1001", message: "Can't reach database server" })).toBe(true);
      expect(isDatabaseConnectionError({ code: "P1017", message: "Server closed the connection" })).toBe(true);
      expect(isDatabaseConnectionError(new Error("Connection terminated"))).toBe(true);
      expect(isDatabaseConnectionError(new Error("Invalid value"))).toBe(false);
    });
  });

  describe("GET /api/admin/menus", () => {
    it("returns 401 when unauthenticated", async () => {
      mockUser = null;
      const req = new NextRequest("http://localhost/api/admin/menus?location=header");
      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("returns items successfully when schema matches", async () => {
      const mockItems = [
        { id: "1", label: "Home", location: "header", sortOrder: 0 },
        { id: "2", label: "About", location: "header", sortOrder: 1 },
      ];
      mocks.findMany.mockResolvedValueOnce(mockItems);

      const req = new NextRequest("http://localhost/api/admin/menus?location=header");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.items).toEqual(mockItems);
      expect(json.warning).toBeUndefined();
    });

    it("falls back to raw base query when schema drift (P2022) is detected", async () => {
      mocks.findMany.mockRejectedValueOnce({
        code: "P2022",
        message: 'The column "MenuItem.description" does not exist in the current database.',
      });
      const rawFallbackItems = [
        { id: "1", label: "Home", location: "header", sortOrder: 0, status: "active" },
      ];
      mocks.queryRaw.mockResolvedValueOnce(rawFallbackItems);

      const req = new NextRequest("http://localhost/api/admin/menus?location=header");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.items).toEqual(rawFallbackItems);
      expect(json.warning).toContain("Database migration pending");
    });

    it("returns 503 error when menu_items table does not exist (not treated as empty menu)", async () => {
      mocks.findMany.mockRejectedValueOnce({
        code: "42P01",
        message: 'relation "menu_items" does not exist',
      });

      const req = new NextRequest("http://localhost/api/admin/menus?location=*");
      const res = await GET(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toContain("Navigation database table is not initialized");
      expect(json.tableMissing).toBe(true);
      expect(json.items).toEqual([]);
    });

    it("returns 503 when findMany triggers column missing and fallback raw query fails with table missing", async () => {
      mocks.findMany.mockRejectedValueOnce({
        code: "P2022",
        message: 'The column "MenuItem.description" does not exist in the current database.',
      });
      mocks.queryRaw.mockRejectedValueOnce({
        code: "42P01",
        message: 'relation "menu_items" does not exist',
      });

      const req = new NextRequest("http://localhost/api/admin/menus?location=*");
      const res = await GET(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toContain("Navigation database table is not initialized");
      expect(json.tableMissing).toBe(true);
    });

    it("returns 503 when database connection is down", async () => {
      mocks.findMany.mockRejectedValueOnce({
        code: "P1001",
        message: "Can't reach database server at postgresql:5432",
      });

      const req = new NextRequest("http://localhost/api/admin/menus?location=header");
      const res = await GET(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toBe("Database connection unavailable");
      expect(json.items).toEqual([]);
    });
  });

  describe("POST /api/admin/menus", () => {
    it("returns 400 when body is invalid JSON", async () => {
      const req = new NextRequest("http://localhost/api/admin/menus", {
        method: "POST",
        body: "invalid-json{",
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("Invalid JSON body");
    });

    it("returns 503 with migration hint when DB throws schema drift error on create", async () => {
      mocks.findFirst.mockResolvedValueOnce({ sortOrder: 5 });
      mocks.create.mockRejectedValueOnce({
        code: "P2022",
        message: 'column "description" does not exist',
      });

      const req = new NextRequest("http://localhost/api/admin/menus", {
        method: "POST",
        body: JSON.stringify({ label: "New Item", url: "/new", location: "header" }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await POST(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toContain("Database migration required");
    });
  });

  describe("PUT /api/admin/menus", () => {
    it("returns 400 if id is missing", async () => {
      const req = new NextRequest("http://localhost/api/admin/menus", {
        method: "PUT",
        body: JSON.stringify({ label: "No Id" }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await PUT(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("id is required");
    });

    it("returns 503 with migration hint when DB throws schema drift error on update", async () => {
      mocks.findUnique.mockResolvedValueOnce({ location: "header" });
      mocks.update.mockRejectedValueOnce({
        code: "P2022",
        message: 'column "status" does not exist',
      });

      const req = new NextRequest("http://localhost/api/admin/menus", {
        method: "PUT",
        body: JSON.stringify({ id: "item-1", status: "soon" }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await PUT(req);
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toContain("Database migration required");
    });
  });

  describe("DELETE /api/admin/menus", () => {
    it("returns 400 if id is missing", async () => {
      const req = new NextRequest("http://localhost/api/admin/menus", {
        method: "DELETE",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      });
      const res = await DELETE(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("id is required");
    });
  });
});

