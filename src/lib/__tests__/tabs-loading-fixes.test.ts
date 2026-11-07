import { describe, it, expect, vi, beforeEach } from "vitest";
import { valuesEqual } from "@/components/admin/TabsHierarchyEditor";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";

// Mock every public data-fetcher so resolveSectionItems can be tested without a
// database. Each fetcher returns { items, error } per the public-content
// contract. `vi.hoisted` runs before `vi.mock` is hoisted to the top of the file.
const mockPublicContent = vi.hoisted(() => ({
  getPublicResearch: vi.fn(),
  getPublicPublications: vi.fn(),
  getPublicEvents: vi.fn(),
  getPublicBlogPosts: vi.fn(),
  getPublicMediaItems: vi.fn(),
  getPublicResources: vi.fn(),
  getPublicPrograms: vi.fn(),
  getPublicResearchers: vi.fn(),
  getPublicTeamMembers: vi.fn(),
  getPublicCareerOpenings: vi.fn(),
}));

vi.mock("@/lib/public-content", () => mockPublicContent);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("valuesEqual — TabsHierarchyEditor prop-change detection", () => {
  it("treats the same reference as equal (no spurious reset on rerender)", () => {
    const tabs = [{ id: "a", label: "A" }];
    expect(valuesEqual(tabs, tabs)).toBe(true);
  });

  it("treats deeply equal but distinct hierarchies as equal", () => {
    const a = [{ id: "a", label: "A", innerTabs: [{ id: "i", label: "I" }] }];
    const b = [{ id: "a", label: "A", innerTabs: [{ id: "i", label: "I" }] }];
    expect(valuesEqual(a, b)).toBe(true);
  });

  it("detects different content as unequal (section switch detected)", () => {
    expect(valuesEqual([{ id: "a" }], [{ id: "b" }])).toBe(false);
  });

  it("detects different array lengths as unequal", () => {
    expect(valuesEqual([{ id: "a" }], [{ id: "a" }, { id: "b" }])).toBe(false);
  });

  it("handles primitives and undefined", () => {
    expect(valuesEqual(undefined, undefined)).toBe(true);
    expect(valuesEqual("x", "x")).toBe(true);
    expect(valuesEqual("x", "y")).toBe(false);
    expect(valuesEqual(5, 5)).toBe(true);
    expect(valuesEqual(5, "5")).toBe(false);
  });
});

describe("resolveSectionItems — public-data failure isolation", () => {
  it("flags a fetch failure instead of fabricating an empty success response", async () => {
    mockPublicContent.getPublicResearch.mockResolvedValue({
      items: [],
      error: true,
    });

    const result = await resolveSectionItems("featured", {
      collection: "research",
      limit: 5,
    });

    expect(result).toEqual({ items: [], error: true });
    expect(mockPublicContent.getPublicResearch).toHaveBeenCalledTimes(1);
  });

  it("returns mapped items and error:false on a successful fetch", async () => {
    mockPublicContent.getPublicResearch.mockResolvedValue({
      items: [
        {
          slug: "s1",
          title: "Research",
          titleBn: "গবেষণা",
          description: "Desc",
          descriptionBn: "বিবরণ",
          category: "C",
          datePublished: null,
          dateLabel: "Jan 2026",
        },
      ],
      error: false,
    });

    const result = await resolveSectionItems("featured", {
      collection: "research",
      limit: 5,
    });

    expect(result.error).not.toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      title: "Research",
      titleBn: "গবেষণা",
      href: "/research/s1",
      meta: "C",
      dateLabel: "Jan 2026",
    });
  });

  it("propagates failures for each data-driven section type", async () => {
    mockPublicContent.getPublicEvents.mockResolvedValue({ items: [], error: true });
    mockPublicContent.getPublicPrograms.mockResolvedValue({ items: [], error: true });
    mockPublicContent.getPublicResources.mockResolvedValue({ items: [], error: true });
    mockPublicContent.getPublicCareerOpenings.mockResolvedValue({
      items: [],
      error: true,
    });

    await expect(
      resolveSectionItems("event_list", { limit: 6 })
    ).resolves.toEqual({ items: [], error: true });
    await expect(
      resolveSectionItems("program_list", { limit: 6 })
    ).resolves.toEqual({ items: [], error: true });
    await expect(
      resolveSectionItems("resource_list", { limit: 6 })
    ).resolves.toEqual({ items: [], error: true });
    await expect(
      resolveSectionItems("career_list", { limit: 6 })
    ).resolves.toEqual({ items: [], error: true });
  });
});
