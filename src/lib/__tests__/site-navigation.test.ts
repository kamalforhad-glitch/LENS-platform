// Phase A navigation model tests: CMS mapping + IA fallback integrity.
import { describe, expect, it } from "vitest";
import {
  buildMenuTree,
  DONATE_CTA,
  getFallbackFooterColumns,
  getFallbackHeaderNav,
  menuTreeToFooterColumns,
  menuTreeToNavEntries,
  NAV_TOP_LEVEL_IDS,
  type FlatMenuItem,
  type NavChild,
  type NavEntry,
} from "@/lib/site-navigation";
import en from "@/locales/en/common.json";
import bn from "@/locales/bn/common.json";

function resolveKey(dict: unknown, dotted: string): unknown {
  return dotted
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc !== null && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      dict,
    );
}

function collectKeyLabels(entries: (NavEntry | NavChild)[]): string[] {
  const keys: string[] = [];
  for (const entry of entries) {
    if (entry.label.kind === "key") keys.push(entry.label.key);
    if ("children" in entry && entry.children) keys.push(...collectKeyLabels(entry.children));
  }
  return keys;
}

function menuRow(overrides: Partial<FlatMenuItem> & { id: string }): FlatMenuItem {
  return {
    label: `Label ${overrides.id}`,
    labelBn: "",
    url: `/${overrides.id}`,
    target: "_self",
    parentId: null,
    sortOrder: 0,
    visible: true,
    ...overrides,
  };
}

describe("fallback header navigation (new IA)", () => {
  it("keeps the approved top-level order", () => {
    const ids = getFallbackHeaderNav().map((entry) => entry.id);
    expect(ids).toEqual([...NAV_TOP_LEVEL_IDS]);
  });

  it("gives live links only to verified routes; soon items carry plannedHref and no href", () => {
    const walk = (entries: (NavEntry | NavChild)[]) => {
      for (const entry of entries) {
        if (entry.status === "live") {
          expect(entry.href, `${entry.id} must link somewhere`).toMatch(/^\//);
        } else {
          expect(entry.href, `${entry.id} must not link anywhere yet`).toBeUndefined();
          expect(entry.plannedHref, `${entry.id} must record its planned URL`).toMatch(/^\//);
        }
        if ("children" in entry && entry.children) walk(entry.children);
      }
    };
    walk(getFallbackHeaderNav());
  });

  it("resolves every label key in both en and bn dictionaries", () => {
    const keys = collectKeyLabels(getFallbackHeaderNav());
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      expect(typeof resolveKey(en, k), `en:${k}`).toBe("string");
      expect(typeof resolveKey(bn, k), `bn:${k}`).toBe("string");
    }
  });

  it("keeps ambiguous terms verbatim (no invented meanings)", () => {
    const enMojo = resolveKey(en, "sitenav.mojo");
    const bnMojo = resolveKey(bn, "sitenav.mojo");
    const enBpfi = resolveKey(en, "sitenav.bpfi");
    const bnBpfi = resolveKey(bn, "sitenav.bpfi");
    expect(enMojo).toBe("Mojo");
    expect(bnMojo).toBe("Mojo");
    expect(enBpfi).toBe("BPFI");
    expect(bnBpfi).toBe("BPFI");
  });

  it("points the Donate CTA at the informational /donate page (no payment processing)", () => {
    expect(DONATE_CTA.href).toBe("/donate");
  });
});

describe("fallback footer navigation", () => {
  it("links only verified live routes and resolves all label keys", () => {
    const columns = getFallbackFooterColumns();
    expect(columns.length).toBeGreaterThan(0);
    for (const column of columns) {
      for (const link of column.links) {
        expect(link.status).toBe("live");
        expect(link.href).toMatch(/^\//);
      }
    }
    const keys = columns.flatMap((c) => [
      ...(c.heading.kind === "key" ? [c.heading.key] : []),
      ...collectKeyLabels(c.links),
    ]);
    for (const k of keys) {
      expect(typeof resolveKey(en, k), `en:${k}`).toBe("string");
      expect(typeof resolveKey(bn, k), `bn:${k}`).toBe("string");
    }
  });
});

describe("buildMenuTree (MenuItem CMS rows)", () => {
  it("nests children under parents, drops hidden rows, sorts by sortOrder", () => {
    const tree = buildMenuTree([
      menuRow({ id: "b", sortOrder: 2 }),
      menuRow({ id: "a", sortOrder: 1 }),
      menuRow({ id: "a1", parentId: "a", sortOrder: 2 }),
      menuRow({ id: "a2", parentId: "a", sortOrder: 1 }),
      menuRow({ id: "hidden", visible: false }),
      menuRow({ id: "orphan-child", parentId: "missing-parent", sortOrder: 3 }),
    ]);
    expect(tree.map((n) => n.id)).toEqual(["a", "b", "orphan-child"]);
    const a = tree[0];
    expect(a.children.map((c) => c.id)).toEqual(["a2", "a1"]);
  });

  it("maps CMS trees to live nav entries preserving bn labels and targets", () => {
    const entries = menuTreeToNavEntries(
      buildMenuTree([
        menuRow({ id: "about", label: "About", labelBn: "সম্পর্কে", url: "/about" }),
        menuRow({ id: "team", label: "Team", labelBn: "দল", url: "/about/team", parentId: "about", target: "_blank" }),
      ]),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].href).toBe("/about");
    expect(entries[0].label).toEqual({ kind: "text", en: "About", bn: "সম্পর্কে" });
    expect(entries[0].children?.[0]).toMatchObject({
      href: "/about/team",
      status: "live",
      target: "_blank",
    });
  });

  it("groups footer rows into columns with a Links column for loose items", () => {
    const columns = menuTreeToFooterColumns(
      buildMenuTree([
        menuRow({ id: "loose", label: "Loose", url: "/loose" }),
        menuRow({ id: "group", label: "Group", url: "#" }),
        menuRow({ id: "g1", label: "G1", url: "/g1", parentId: "group" }),
      ]),
    );
    expect(columns.map((c) => c.id)).toEqual(["links", "group"]);
    expect(columns[0].links.map((l) => l.id)).toEqual(["loose"]);
    expect(columns[1].links.map((l) => l.id)).toEqual(["g1"]);
  });
});
