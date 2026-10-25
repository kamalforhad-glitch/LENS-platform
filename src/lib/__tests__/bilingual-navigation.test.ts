import { describe, expect, it } from "vitest";
import {
  buildMenuTree,
  buildFullMenuTree,
  menuTreeToNavEntries,
  type FlatMenuItem,
} from "@/lib/site-navigation";
import { sanitizeUrl } from "@/lib/cms-validation";
import { resolveCmsValue } from "@/lib/cms-content";
import { DEFAULT_HEADER_NAVIGATION } from "@/lib/cms-navigation-defaults";

function makeRow(overrides: Partial<FlatMenuItem> & { id: string }): FlatMenuItem {
  return {
    label: `Label ${overrides.id}`,
    labelBn: `লেবেল ${overrides.id}`,
    url: `/${overrides.id}`,
    target: "_self",
    parentId: null,
    sortOrder: 0,
    visible: true,
    status: "active",
    isClickable: true,
    openSubmenu: true,
    desktopVisible: true,
    mobileVisible: true,
    ...overrides,
  };
}

describe("Bilingual Navigation Tree & CMS Hierarchy", () => {
  it("builds multi-level hierarchy with nested children up to arbitrary depth", () => {
    const rows: FlatMenuItem[] = [
      makeRow({ id: "courses", label: "Courses", labelBn: "কোর্স", sortOrder: 0 }),
      makeRow({ id: "journalism", label: "Journalism", labelBn: "সাংবাদিকতা", parentId: "courses", sortOrder: 0 }),
      makeRow({ id: "data-journalism", label: "Data Journalism", labelBn: "ডেটা সাংবাদিকতা", parentId: "journalism", sortOrder: 0 }),
      makeRow({ id: "advanced-data", label: "Advanced Visuals", labelBn: "উন্নত ভিজ্যুয়াল", parentId: "data-journalism", sortOrder: 0 }),
    ];

    const tree = buildFullMenuTree(rows);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe("courses");
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe("journalism");
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].id).toBe("data-journalism");
    expect(tree[0].children[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].children[0].id).toBe("advanced-data");
  });

  it("saves English and Bangla values independently without overwriting", () => {
    const itemEn = makeRow({
      id: "about",
      label: "About LENS",
      labelBn: "আমাদের সম্পর্কে",
      description: "Learn about our vision and research",
      descriptionBn: "আমাদের লক্ষ্য ও গবেষণা সম্পর্কে জানুন",
    });

    // Updating English does not touch Bangla
    const updatedEn = {
      ...itemEn,
      label: "About Our Think Tank",
    };
    expect(updatedEn.label).toBe("About Our Think Tank");
    expect(updatedEn.labelBn).toBe("আমাদের সম্পর্কে");

    // Updating Bangla does not touch English
    const updatedBn = {
      ...updatedEn,
      labelBn: "আমাদের থিংক ট্যাংক সম্পর্কে",
    };
    expect(updatedBn.label).toBe("About Our Think Tank");
    expect(updatedBn.labelBn).toBe("আমাদের থিংক ট্যাংক সম্পর্কে");
  });

  it("handles status transitions between Active and Soon dynamically", () => {
    // 1. Item starts as soon
    const soonItem = makeRow({
      id: "vision",
      label: "Vision",
      labelBn: "রূপকল্প",
      url: "/about/vision",
      status: "soon",
      isClickable: false,
      badgeText: "SOON",
      badgeTextBn: "শীঘ্রই",
    });

    const soonEntries = menuTreeToNavEntries(buildMenuTree([soonItem]));
    expect(soonEntries[0].status).toBe("soon");
    expect(soonEntries[0].href).toBeUndefined(); // non-clickable link
    expect(soonEntries[0].plannedHref).toBe("/about/vision");
    expect(soonEntries[0].badgeText).toBe("SOON");

    // 2. Administrator switches item to Active without code changes
    const activeItem: FlatMenuItem = {
      ...soonItem,
      status: "active",
      isClickable: true,
      badgeText: null,
    };

    const activeEntries = menuTreeToNavEntries(buildMenuTree([activeItem]));
    expect(activeEntries[0].status).toBe("live");
    expect(activeEntries[0].href).toBe("/about/vision"); // live clickable link
  });

  it("excludes draft and disabled items from public navigation", () => {
    const rows: FlatMenuItem[] = [
      makeRow({ id: "live1", label: "Public 1", status: "active", visible: true }),
      makeRow({ id: "draft1", label: "Draft Menu", status: "draft", visible: true }),
      makeRow({ id: "disabled1", label: "Disabled Menu", status: "disabled", visible: true }),
      makeRow({ id: "hidden1", label: "Hidden Menu", status: "active", visible: false }),
    ];

    const publicTree = buildMenuTree(rows);
    expect(publicTree.map((n) => n.id)).toEqual(["live1"]);

    const fullTree = buildFullMenuTree(rows);
    expect(fullTree.map((n) => n.id)).toEqual(["live1", "draft1", "disabled1", "hidden1"]);
  });

  it("respects sortOrder across siblings and reorders reliably", () => {
    const rows: FlatMenuItem[] = [
      makeRow({ id: "third", sortOrder: 2 }),
      makeRow({ id: "first", sortOrder: 0 }),
      makeRow({ id: "second", sortOrder: 1 }),
    ];

    const tree = buildMenuTree(rows);
    expect(tree.map((n) => n.id)).toEqual(["first", "second", "third"]);
  });

  it("maps recursive nested children to NavEntries properly", () => {
    const parent = makeRow({ id: "p", label: "Parent", sortOrder: 0 });
    const child = makeRow({ id: "c", label: "Child", parentId: "p", sortOrder: 0 });
    const grandChild = makeRow({ id: "gc", label: "Grandchild", parentId: "c", sortOrder: 0 });

    const entries = menuTreeToNavEntries(buildMenuTree([parent, child, grandChild]));
    expect(entries).toHaveLength(1);
    expect(entries[0].children).toHaveLength(1);
    expect(entries[0].children![0].children).toHaveLength(1);
    expect(entries[0].children![0].children![0].id).toBe("gc");
  });

  it("preserves complete default header navigation structure", () => {
    expect(DEFAULT_HEADER_NAVIGATION.length).toBeGreaterThanOrEqual(10);
    const labels = DEFAULT_HEADER_NAVIGATION.map((i) => i.label);
    expect(labels).toContain("Home");
    expect(labels).toContain("About");
    expect(labels).toContain("Theme");
    expect(labels).toContain("Courses");
    expect(labels).toContain("Resources");
    expect(labels).toContain("Indexing");
    expect(labels).toContain("Clubs");
    expect(labels).toContain("Events");
    expect(labels).toContain("Blog");
    expect(labels).toContain("Contact");

    const about = DEFAULT_HEADER_NAVIGATION.find((i) => i.label === "About");
    expect(about?.children?.map((c) => c.label)).toEqual([
      "Vision",
      "Governance",
      "Team",
      "Partnerships",
    ]);

    const soonItems = about?.children?.filter((c) => c.status === "soon");
    expect(soonItems).toHaveLength(3);
  });
});

describe("URL Sanitization & Security", () => {
  it("rejects malicious javascript: URLs", () => {
    const bad1 = sanitizeUrl("javascript:alert(1)");
    expect(bad1.ok).toBe(false);

    const bad2 = sanitizeUrl("JAVASCRIPT:document.cookie");
    expect(bad2.ok).toBe(false);

    const bad3 = sanitizeUrl("data:text/html,<script>alert(1)</script>");
    expect(bad3.ok).toBe(false);

    const bad4 = sanitizeUrl("vbscript:msgbox(1)");
    expect(bad4.ok).toBe(false);
  });

  it("accepts valid relative and absolute HTTPS URLs", () => {
    const good1 = sanitizeUrl("/about/vision");
    expect(good1.ok).toBe(true);
    expect(good1.url).toBe("/about/vision");

    const good2 = sanitizeUrl("https://lensbd.org/research");
    expect(good2.ok).toBe(true);
    expect(good2.url).toBe("https://lensbd.org/research");
  });
});

describe("Homepage Hero CMS Bilingual Resolution", () => {
  it("resolves headline words and custom gradient word highlight sets", () => {
    const cEn = {
      headline: "Guiding the Future of Narratives in a Digital World.",
      gradientWords: "Digital, World.",
      taglineBetter: "Better\nInformation.",
      taglineStronger: "Stronger\nDemocracies.",
    };
    const cBn = {
      headline: "ডিজিটাল বিশ্বে বর্ণনার ভবিষ্যতকে পথ নির্দেশনা।",
      gradientWords: "ডিজিটাল, বিশ্বে",
      taglineBetter: "উন্নত\nতথ্য।",
      taglineStronger: "শক্তিশালী\nগণতন্ত্র।",
    };

    // English resolution
    const enHeadline = resolveCmsValue(false, cEn, cBn, ["headline"]);
    expect(enHeadline).toBe("Guiding the Future of Narratives in a Digital World.");

    const enBetter = resolveCmsValue(false, cEn, cBn, ["taglineBetter"]);
    expect(enBetter).toBe("Better\nInformation.");

    // Bangla resolution
    const bnHeadline = resolveCmsValue(true, cEn, cBn, ["headline"]);
    expect(bnHeadline).toBe("ডিজিটাল বিশ্বে বর্ণনার ভবিষ্যতকে পথ নির্দেশনা।");

    const bnBetter = resolveCmsValue(true, cEn, cBn, ["taglineBetter"]);
    expect(bnBetter).toBe("উন্নত\nতথ্য।");
  });
});
