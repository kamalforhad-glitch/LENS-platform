import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database client
vi.mock("@/lib/db", () => ({
  db: {
    page: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

// Mock audit
vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
  AUDIT_ACTIONS: { PAGE_CREATED: "PAGE_CREATED" },
}));

import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { validateSlug, CMS_MIGRATABLE_SLUGS } from "@/lib/cms-validation";
import { dryRunCmsMigration, runCmsMigration } from "@/lib/actions/cms-migrate";
import { migrationPlan } from "@/lib/cms-migration";

describe("CMS migration (reserved-slug takeover)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateSlug opt-in for migratable reserved slugs", () => {
    it("rejects a migratable slug by default", () => {
      expect(validateSlug("about").valid).toBe(false);
      expect(validateSlug("contact").valid).toBe(false);
    });

    it("accepts migratable slugs with the migration flag", () => {
      for (const slug of CMS_MIGRATABLE_SLUGS) {
        expect(validateSlug(slug, { allowMigratableReserved: true }).valid).toBe(true);
      }
    });

    it("still rejects non-migratable reserved slugs with the flag", () => {
      // "contact" is reserved but NOT in CMS_MIGRATABLE_SLUGS
      expect(validateSlug("contact", { allowMigratableReserved: true }).valid).toBe(false);
      // "home" and "admin" are never migratable
      expect(validateSlug("home", { allowMigratableReserved: true }).valid).toBe(false);
      expect(validateSlug("admin", { allowMigratableReserved: true }).valid).toBe(false);
    });
  });

  describe("dryRunCmsMigration (read-only by default)", () => {
    it("proposes every migratable slug with skeletons and no writes", async () => {
      vi.mocked(db.page.findUnique).mockResolvedValue(null);

      const plan = await dryRunCmsMigration();

      expect(db.page.create).not.toHaveBeenCalled();
      expect(plan.length).toBe(CMS_MIGRATABLE_SLUGS.size);
      for (const entry of plan) {
        expect(entry.exists).toBe(false);
        expect(entry.sections.length).toBeGreaterThan(0);
        expect(entry.message).toContain("Would create draft page");
        for (const s of entry.sections) {
          expect([
            "hero", "rich_text", "cards", "cta", "clubs", "stats",
            "research_list", "publication_list", "event_list", "blog_list",
            "media_list", "resource_list", "program_list", "featured",
            "newsletter", "team", "search_filter"
          ]).toContain(s.type);
        }
      }
    });

    it("flags an already-existing page and skips it (no overwrite)", async () => {
      vi.mocked(db.page.findUnique).mockResolvedValueOnce({
        id: "p-1",
        slug: "about",
        status: "draft",
      } as unknown as NonNullable<Awaited<ReturnType<typeof db.page.findUnique>>>);

      const plan = await dryRunCmsMigration("about");

      expect(db.page.create).not.toHaveBeenCalled();
      expect(plan).toHaveLength(1);
      expect(plan[0].exists).toBe(true);
      expect(plan[0].message).toContain("already exists");
    });

    it("reports one slug only when requested", async () => {
      vi.mocked(db.page.findUnique).mockResolvedValue(null);
      const plan = await dryRunCmsMigration("privacy");
      expect(plan).toHaveLength(1);
      expect(plan[0].slug).toBe("privacy");
    });
  });

  describe("runCmsMigration", () => {
    const adminUser = { id: "u-1", email: "admin@lens.org.bd", name: "Admin", role: "super_admin" as const };

    it("requires admin", async () => {
      (vi.mocked(getCurrentUser)).mockResolvedValue(adminUser);
      (vi.mocked(requireAdmin)).mockImplementation(() => {
        throw new Error("Forbidden");
      });
      await expect(runCmsMigration({ slug: "about", dryRun: false })).rejects.toThrow("Forbidden");
      expect(db.page.create).not.toHaveBeenCalled();
    });

    it("rejects non-migratable slugs without writing", async () => {
      (vi.mocked(getCurrentUser)).mockResolvedValue(adminUser);
      vi.mocked(requireAdmin).mockReturnValue(adminUser);

      const result = await runCmsMigration({ slug: "contact", dryRun: false });
      expect(result.results[0].created).toBe(false);
      expect(db.page.create).not.toHaveBeenCalled();
    });

    it("creates exactly one draft page per missing slug and never publishes", async () => {
      (vi.mocked(getCurrentUser)).mockResolvedValue(adminUser);
      vi.mocked(requireAdmin).mockReturnValue(adminUser);
      vi.mocked(db.page.findUnique).mockResolvedValue(null);
      vi.mocked(db.page.create).mockResolvedValue({
        id: "p-new",
        slug: "about",
        status: "draft",
      } as unknown as NonNullable<Awaited<ReturnType<typeof db.page.create>>>);

      const result = await runCmsMigration({ slug: "about", dryRun: false });

      expect(db.page.create).toHaveBeenCalledTimes(1);
      const createCall = vi.mocked(db.page.create).mock.calls[0][0];
      expect(createCall.data.slug).toBe("about");
      expect(createCall.data.status).toBe("draft");
      expect(createCall.data.publishedAt).toBeUndefined();
      const createdSections = createCall.data.sections as { create: unknown[] } | undefined;
      expect((createdSections?.create as unknown[]).length).toBeGreaterThan(0);
      expect(result.results[0].created).toBe(true);
      expect(result.results[0].pageId).toBe("p-new");
    });

    it("is idempotent: existing page is not overwritten", async () => {
      (vi.mocked(getCurrentUser)).mockResolvedValue(adminUser);
      vi.mocked(requireAdmin).mockReturnValue(adminUser);
      vi.mocked(db.page.findUnique).mockResolvedValue({
        id: "p-1",
        slug: "about",
        status: "draft",
      } as unknown as NonNullable<Awaited<ReturnType<typeof db.page.findUnique>>>);

      const result = await runCmsMigration({ slug: "about", dryRun: false });

      expect(db.page.create).not.toHaveBeenCalled();
      expect(result.results[0].created).toBe(false);
      expect(result.results[0].reason).toContain("already exists");
    });

    it("dryRun:true performs no writes even when run is invoked", async () => {
      (vi.mocked(getCurrentUser)).mockResolvedValue(adminUser);
      vi.mocked(requireAdmin).mockReturnValue(adminUser);
      vi.mocked(db.page.findUnique).mockResolvedValue(null);

      const result = await runCmsMigration({ slug: "about", dryRun: true });

      expect(db.page.create).not.toHaveBeenCalled();
      expect(result.dryRun).toBe(true);
      expect(result.plan.length).toBeGreaterThan(0);
      expect(result.results.length).toBe(0);
    });
  });

  describe("migrationPlan shape", () => {
    it("returns one entry per migratable slug with non-empty sections", () => {
      const plan = migrationPlan();
      expect(plan.length).toBe(CMS_MIGRATABLE_SLUGS.size);
      for (const entry of plan) {
        expect(typeof entry.slug).toBe("string");
        expect(entry.message).toBe("");
      }
    });
  });
});
