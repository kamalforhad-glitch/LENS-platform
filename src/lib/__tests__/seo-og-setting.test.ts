import { describe, expect, it } from "vitest";
import {
  LEGACY_OG_IMAGE_KEY,
  SEO_OG_IMAGE_KEY,
  normalizeSeoOgImageSettings,
  resolveSeoOgImageValue,
} from "@/lib/seo-og-setting";

type Setting = {
  id: string;
  key: string;
  value: string;
  valueBn: string;
  type: string;
  group: string;
  label: string;
  sortOrder: number;
};

const base = (overrides: Partial<Setting> & Pick<Setting, "key">): Setting => ({
  id: overrides.id ?? `id-${overrides.key}`,
  key: overrides.key,
  value: overrides.value ?? "",
  valueBn: overrides.valueBn ?? "",
  type: overrides.type ?? "image",
  group: overrides.group ?? "seo",
  label: overrides.label ?? "Default OG Image URL",
  sortOrder: overrides.sortOrder ?? 4,
});

describe("SEO OG image setting normalization", () => {
  it("keeps canonical row and excludes legacy row when both keys exist (canonical precedence, no duplicate control)", () => {
    const settings = [
      base({ key: "seo_meta_title", value: "Title", type: "text", label: "Default Meta Title", sortOrder: 1 }),
      base({ key: LEGACY_OG_IMAGE_KEY, value: "https://legacy.example/og.png", valueBn: "https://legacy.example/og-bn.png" }),
      base({ key: SEO_OG_IMAGE_KEY, value: "https://canonical.example/og.png", valueBn: "https://canonical.example/og-bn.png" }),
    ];

    const normalized = normalizeSeoOgImageSettings(settings);

    expect(normalized.filter((s) => s.key === SEO_OG_IMAGE_KEY || s.key === LEGACY_OG_IMAGE_KEY)).toEqual([
      base({ key: SEO_OG_IMAGE_KEY, value: "https://canonical.example/og.png", valueBn: "https://canonical.example/og-bn.png" }),
    ]);
    expect(normalized.map((s) => s.key)).toEqual(["seo_meta_title", SEO_OG_IMAGE_KEY]);
  });

  it("exposes a legacy-only row as an editable canonical UI entry", () => {
    const settings = [
      base({ key: "seo_meta_title", value: "Title", type: "text", label: "Default Meta Title", sortOrder: 1 }),
      base({ key: LEGACY_OG_IMAGE_KEY, value: "https://legacy.example/og.png", valueBn: "https://legacy.example/og-bn.png", id: "legacy-id", sortOrder: 4 }),
    ];

    const normalized = normalizeSeoOgImageSettings(settings);

    expect(normalized.map((s) => s.key)).toEqual(["seo_meta_title", SEO_OG_IMAGE_KEY]);
    expect(normalized.find((s) => s.key === SEO_OG_IMAGE_KEY)).toMatchObject({
      id: "legacy-id",
      key: SEO_OG_IMAGE_KEY,
      value: "https://legacy.example/og.png",
      valueBn: "https://legacy.example/og-bn.png",
      type: "image",
      group: "seo",
      label: "Default OG Image URL",
      sortOrder: 4,
    });
    expect(normalized.some((s) => s.key === LEGACY_OG_IMAGE_KEY)).toBe(false);
  });

  it("preserves legacy value and valueBn during normalization", () => {
    const legacy = base({
      key: LEGACY_OG_IMAGE_KEY,
      value: "/legacy-og.png",
      valueBn: "/legacy-og-bn.png",
      label: "Legacy OG",
    });

    const [normalized] = normalizeSeoOgImageSettings([legacy]);

    expect(normalized.key).toBe(SEO_OG_IMAGE_KEY);
    expect(normalized.value).toBe("/legacy-og.png");
    expect(normalized.valueBn).toBe("/legacy-og-bn.png");
    expect(normalized.label).toBe("Legacy OG");
  });

  it("leaves settings unchanged when neither OG image key exists", () => {
    const settings = [
      base({ key: "seo_meta_title", value: "Title", type: "text", label: "Default Meta Title", sortOrder: 1 }),
    ];
    expect(normalizeSeoOgImageSettings(settings)).toEqual(settings);
  });
});

describe("resolveSeoOgImageValue", () => {
  it("prefers canonical value, then legacy, then fallback", () => {
    const values: Record<string, string> = {
      [SEO_OG_IMAGE_KEY]: "https://canonical.example/og.png",
      [LEGACY_OG_IMAGE_KEY]: "https://legacy.example/og.png",
    };
    const getVal = (key: string) => values[key] || "";
    expect(resolveSeoOgImageValue(getVal)).toBe("https://canonical.example/og.png");

    expect(
      resolveSeoOgImageValue((key) => (key === LEGACY_OG_IMAGE_KEY ? "https://legacy.example/og.png" : ""))
    ).toBe("https://legacy.example/og.png");

    expect(resolveSeoOgImageValue(() => "", "/fallback.png")).toBe("/fallback.png");
  });
});