import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPublicPublications, getPublicResearch } from "@/lib/public-content";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";

const mockDb = vi.hoisted(() => ({
  publication: {
    findMany: vi.fn(),
  },
  researchArticle: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

describe("Publication CMS Sync & Decoupling Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicPublications Data Source & Limits", () => {
    it("queries Prisma publication model and respects the take parameter", async () => {
      mockDb.publication.findMany.mockResolvedValue([
        {
          slug: "media-literacy-resilient-democracy",
          title: "Media Literacy for a Resilient Democracy",
          titleBn: "স্থিতিশীল গণতন্ত্রের জন্য গণমাধ্যম সচেতনতা",
          description: "Recommendations for a safer digital sphere.",
          descriptionBn: "ডিজিটাল ক্ষেত্রের জন্য সুপারিশমালা।",
          type: "Policy Brief",
          datePublished: new Date("2025-04-01"),
        },
      ]);

      const result = await getPublicPublications(6);

      expect(result.error).toBe(false);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].slug).toBe("media-literacy-resilient-democracy");
      expect(result.items[0].dateLabel).toBe("April 2025");
      expect(mockDb.publication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "published" },
          take: 6,
          orderBy: { datePublished: "desc" },
        })
      );
    });

    it("clamps take parameter to safe boundaries (between 1 and 100)", async () => {
      mockDb.publication.findMany.mockResolvedValue([]);

      await getPublicPublications(0);
      expect(mockDb.publication.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ take: 1 })
      );

      await getPublicPublications(999);
      expect(mockDb.publication.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });

    it("verifies researchArticle model is NOT queried when loading publications", async () => {
      mockDb.publication.findMany.mockResolvedValue([]);
      await getPublicPublications(6);

      expect(mockDb.researchArticle.findMany).not.toHaveBeenCalled();
    });

    it("verifies getPublicResearch queries researchArticle model separately", async () => {
      mockDb.researchArticle.findMany.mockResolvedValue([
        {
          slug: "narratives-in-the-digital-age",
          title: "Narratives in the Digital Age",
          titleBn: "",
          description: "Research description",
          descriptionBn: "",
          category: "Research Report",
          datePublished: new Date("2025-05-01"),
        },
      ]);

      const result = await getPublicResearch(6);

      expect(result.error).toBe(false);
      expect(result.items[0].title).toBe("Narratives in the Digital Age");
      expect(mockDb.researchArticle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "published" },
          take: 6,
        })
      );
    });
  });

  describe("resolveSectionItems — Collection and Section Type Decoupling", () => {
    it("resolves `publication_list` using getPublicPublications", async () => {
      mockDb.publication.findMany.mockResolvedValue([
        {
          slug: "pub-1",
          title: "Publication 1",
          titleBn: "প্রকাশনা ১",
          description: "Description 1",
          descriptionBn: "বিবরণ ১",
          type: "Policy Brief",
          datePublished: new Date("2025-01-01"),
        },
      ]);

      const result = await resolveSectionItems("publication_list", { limit: 3 });

      expect(result.error).toBeFalsy();
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        title: "Publication 1",
        titleBn: "প্রকাশনা ১",
        href: "/publications/pub-1",
        meta: "Policy Brief",
      });
      expect(mockDb.publication.findMany).toHaveBeenCalledTimes(1);
      expect(mockDb.researchArticle.findMany).not.toHaveBeenCalled();
    });

    it("resolves `featured` with collection='publications' using getPublicPublications", async () => {
      mockDb.publication.findMany.mockResolvedValue([
        {
          slug: "featured-pub",
          title: "Featured Pub",
          titleBn: "",
          description: "Featured Desc",
          descriptionBn: "",
          type: "Working Paper",
          datePublished: new Date("2025-02-01"),
        },
      ]);

      const result = await resolveSectionItems("featured", {
        collection: "publications",
        limit: 2,
      });

      expect(result.error).toBeFalsy();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].href).toBe("/publications/featured-pub");
      expect(mockDb.publication.findMany).toHaveBeenCalledTimes(1);
      expect(mockDb.researchArticle.findMany).not.toHaveBeenCalled();
    });

    it("resolves `research_list` using getPublicResearch without querying publications", async () => {
      mockDb.researchArticle.findMany.mockResolvedValue([
        {
          slug: "research-1",
          title: "Research Paper 1",
          titleBn: "",
          description: "Paper 1 Desc",
          descriptionBn: "",
          category: "Research Report",
          datePublished: new Date("2025-03-01"),
        },
      ]);

      const result = await resolveSectionItems("research_list", { limit: 3 });

      expect(result.error).toBeFalsy();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].href).toBe("/research/research-1");
      expect(mockDb.researchArticle.findMany).toHaveBeenCalledTimes(1);
      expect(mockDb.publication.findMany).not.toHaveBeenCalled();
    });
  });

  describe("Publication URL Routing Integrity", () => {
    it("ensures publication items map to canonical `/publications/${slug}` URLs", async () => {
      mockDb.publication.findMany.mockResolvedValue([
        {
          slug: "media-index-bangladesh-2025",
          title: "Media Index Bangladesh 2025",
          titleBn: "মিডিয়া ইন্ডেক্স বাংলাদেশ ২০২৫",
          description: "Annual index report",
          descriptionBn: "বার্ষিক সূচক প্রতিবেদন",
          type: "Research Report",
          datePublished: new Date("2025-02-01"),
        },
      ]);

      const pubRes = await getPublicPublications(1);
      expect(pubRes.items[0].slug).toBe("media-index-bangladesh-2025");
      // Canonical detail route contract
      const canonicalUrl = `/publications/${pubRes.items[0].slug}`;
      expect(canonicalUrl).toBe("/publications/media-index-bangladesh-2025");
    });
  });
});
