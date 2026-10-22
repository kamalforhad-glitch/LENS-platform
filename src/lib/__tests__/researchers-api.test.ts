import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  GET,
  isSchemaColumnMissingError,
  isDatabaseConnectionError,
} from "@/app/api/researchers/route";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    researcherProfile: {
      findMany: mocks.findMany,
      findFirst: mocks.findFirst,
    },
    $queryRaw: mocks.queryRaw,
  },
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
  requireEditor: vi.fn(),
}));

vi.mock("@/lib/validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/validation")>();
  return {
    ...actual,
    isRateLimited: vi.fn().mockReturnValue(false),
  };
});

describe("GET /api/researchers regression & resilience tests", () => {
  beforeEach(() => {
    mocks.findMany.mockReset();
    mocks.findFirst.mockReset();
    mocks.queryRaw.mockReset();
  });

  describe("Error Classification Helpers", () => {
    it("identifies Prisma and PostgreSQL column missing errors", () => {
      expect(isSchemaColumnMissingError({ code: "P2022", message: "Column name_bn does not exist" })).toBe(true);
      expect(isSchemaColumnMissingError({ code: "42703", message: "column name_bn does not exist" })).toBe(true);
      expect(isSchemaColumnMissingError(new Error('column "affiliation_bn" of relation "researcher_profiles" does not exist'))).toBe(true);
      expect(isSchemaColumnMissingError(new Error("Generic query error"))).toBe(false);
      expect(isSchemaColumnMissingError(null)).toBe(false);
    });

    it("identifies genuine database connection errors", () => {
      expect(isDatabaseConnectionError({ name: "PrismaClientInitializationError", message: "Can't reach database" })).toBe(true);
      expect(isDatabaseConnectionError({ code: "P1001", message: "Can't reach database server" })).toBe(true);
      expect(isDatabaseConnectionError({ code: "P1017", message: "Server closed the connection" })).toBe(true);
      expect(isDatabaseConnectionError(new Error("Connection terminated unexpectedly"))).toBe(true);
      expect(isDatabaseConnectionError(new Error("Syntax error in query"))).toBe(false);
    });
  });

  describe("List Query: GET /api/researchers", () => {
    it("returns 200 with researchers when all columns exist in database", async () => {
      const mockList = [
        {
          id: "r1",
          slug: "dr-kamal",
          name: "Dr. Kamal",
          nameBn: "ড. কামাল",
          affiliation: "LENS",
          affiliationBn: "লেন্স",
          position: "Lead Researcher",
          positionBn: "প্রধান গবেষক",
          bio: "Bio in English",
          bioBn: "বাংলা বায়ো",
          featured: true,
          totalDownloads: 120,
        },
      ];
      mocks.findMany.mockResolvedValueOnce(mockList);

      const req = new NextRequest("https://www.lensbd.org/api/researchers");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ researchers: mockList });
      expect(mocks.findMany).toHaveBeenCalledTimes(1);
      expect(mocks.queryRaw).not.toHaveBeenCalled();
    });

    it("falls back to base columns when localized columns are missing (schema drift)", async () => {
      const schemaError = {
        code: "P2022",
        message: 'The column `researcher_profiles.name_bn` does not exist in the current database',
      };
      mocks.findMany.mockRejectedValueOnce(schemaError);

      const fallbackRecords = [
        {
          id: "r1",
          slug: "dr-kamal",
          name: "Dr. Kamal",
          nameBn: "Dr. Kamal",
          affiliation: "LENS",
          affiliationBn: "LENS",
          position: "Lead Researcher",
          positionBn: "Lead Researcher",
          bio: "Bio in English",
          bioBn: "Bio in English",
          researchAreas: "[]",
          researchAreasBn: "[]",
          featured: true,
          totalDownloads: 120,
        },
      ];
      mocks.queryRaw.mockResolvedValueOnce(fallbackRecords);

      const req = new NextRequest("https://www.lensbd.org/api/researchers");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.researchers).toHaveLength(1);
      expect(json.researchers[0].slug).toBe("dr-kamal");
      expect(mocks.findMany).toHaveBeenCalledTimes(1);
      expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
    });

    it("does NOT return an empty list when the database connection fails (returns 503)", async () => {
      const connectionError = {
        name: "PrismaClientInitializationError",
        code: "P1001",
        message: "Can't reach database server at db.supabase.co:5432",
      };
      mocks.findMany.mockRejectedValueOnce(connectionError);

      const req = new NextRequest("https://www.lensbd.org/api/researchers");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(503);
      expect(json).toEqual({ error: "Database connection unavailable" });
      expect(mocks.queryRaw).not.toHaveBeenCalled();
    });

    it("returns 500 when an unexpected query error occurs", async () => {
      mocks.findMany.mockRejectedValueOnce(new Error("Deadlock detected"));

      const req = new NextRequest("https://www.lensbd.org/api/researchers");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json).toEqual({ error: "Failed to fetch researchers" });
    });
  });

  describe("Single Profile Query: GET /api/researchers?slug=...", () => {
    it("returns 200 with researcher profile and article count", async () => {
      const mockProfile = {
        id: "r1",
        slug: "dr-kamal",
        name: "Dr. Kamal",
        articleLinks: [{ article: { id: "a1", slug: "art-1", title: "Test" } }],
      };
      mocks.findFirst.mockResolvedValueOnce(mockProfile);

      const req = new NextRequest("https://www.lensbd.org/api/researchers?slug=dr-kamal");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.researcher).toBeDefined();
      expect(json.researcher.articleCount).toBe(1);
      expect(mocks.findFirst).toHaveBeenCalledTimes(1);
    });

    it("falls back to base columns for slug when localized columns are missing", async () => {
      const schemaError = {
        code: "42703",
        message: 'column "name_bn" does not exist',
      };
      mocks.findFirst.mockRejectedValueOnce(schemaError);

      const fallbackRecord = [
        {
          id: "r1",
          slug: "dr-kamal",
          name: "Dr. Kamal",
          nameBn: "Dr. Kamal",
          affiliation: "LENS",
          position: "Lead",
        },
      ];
      mocks.queryRaw.mockResolvedValueOnce(fallbackRecord);

      const req = new NextRequest("https://www.lensbd.org/api/researchers?slug=dr-kamal");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.researcher.slug).toBe("dr-kamal");
      expect(json.researcher.articleCount).toBe(0);
      expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
    });

    it("returns 503 when single lookup encounters database connection failure", async () => {
      const connectionError = {
        name: "PrismaClientInitializationError",
        code: "P1001",
        message: "Can't reach database server",
      };
      mocks.findFirst.mockRejectedValueOnce(connectionError);

      const req = new NextRequest("https://www.lensbd.org/api/researchers?slug=dr-kamal");
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(503);
      expect(json).toEqual({ error: "Database connection unavailable" });
    });
  });
});
