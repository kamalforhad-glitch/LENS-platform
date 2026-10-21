// Locale content selection: Bangla fallback for untranslated sections.
//
// Writers default a section's `contentBn` to "{}" whenever an editor
// supplies no Bengali translation (see createSection / restorePageRevision
// in lib/actions/cms), so an empty object must be treated as "no
// translation" rather than as content. Otherwise Bangla readers get a
// blank body while the English text is one fallback away.
import { describe, expect, it } from "vitest";
import { hasUsableContent, pickLocale } from "@/lib/cms-content";

const EN = { paragraphs: ["English body"], title: "English title" };
const BN = { paragraphs: ["বাংলা বডি"], title: "বাংলা শিরোনাম" };

describe("hasUsableContent", () => {
  it("treats null, undefined and empty string as unusable", () => {
    expect(hasUsableContent(null)).toBe(false);
    expect(hasUsableContent(undefined)).toBe(false);
    expect(hasUsableContent("")).toBe(false);
  });

  it("treats an empty object as unusable (the '{}' default payload)", () => {
    expect(hasUsableContent({})).toBe(false);
  });

  it("treats an empty array as unusable", () => {
    expect(hasUsableContent([])).toBe(false);
  });

  it("treats non-empty objects and arrays as usable", () => {
    expect(hasUsableContent(BN)).toBe(true);
    expect(hasUsableContent({ a: 1 })).toBe(true);
    expect(hasUsableContent(["প্যারা"])).toBe(true);
    expect(hasUsableContent({ paragraphs: [] })).toBe(true);
  });

  it("treats non-empty scalars as usable and only '' as empty", () => {
    expect(hasUsableContent("বাংলা")).toBe(true);
    // Intentionally usable: the previous implementation only rejected the
    // exact empty string, and whitespace-only strings are rendered as-is.
    expect(hasUsableContent("   ")).toBe(true);
    expect(hasUsableContent(0)).toBe(true);
    expect(hasUsableContent(false)).toBe(true);
  });
});

describe("pickLocale — Bangla locale", () => {
  it("returns the Bengali content when it is a valid non-empty object", () => {
    expect(pickLocale(true, EN, BN)).toBe(BN);
  });

  it("returns the Bengali content when it is a valid non-empty array", () => {
    expect(pickLocale(true, EN, ["প্যারা ১"])).toEqual(["প্যারা ১"]);
  });

  it("falls back to English when Bengali is an empty object", () => {
    expect(pickLocale(true, EN, {})).toBe(EN);
  });

  it("falls back to English when Bengali is an empty array", () => {
    expect(pickLocale(true, EN, [])).toBe(EN);
  });

  it("falls back to English for missing Bengali values", () => {
    expect(pickLocale(true, EN, undefined)).toBe(EN);
    expect(pickLocale(true, EN, null)).toBe(EN);
    expect(pickLocale(true, EN, "")).toBe(EN);
  });

  it("mirrors the real '{}' payload produced by safeParse on the stored default", () => {
    // createSection stores contentBn as the string "{}"; getPublicPage
    // parses it into {}. The renderer must not treat that as content.
    const parsedDefaultBn: unknown = JSON.parse("{}");
    expect(pickLocale(true, EN, parsedDefaultBn)).toBe(EN);
  });

  it("preserves a partially translated object (English keys survive alongside)", () => {
    const partialBn = { paragraphs: ["বাংলা"], title: "English title" };
    expect(pickLocale(true, EN, partialBn)).toBe(partialBn);
  });
});

describe("pickLocale — English locale", () => {
  it("returns English even when Bengali content is valid", () => {
    expect(pickLocale(false, EN, BN)).toBe(EN);
  });

  it("returns English when Bengali is empty too", () => {
    expect(pickLocale(false, EN, {})).toBe(EN);
  });

  it("passes through the English value unchanged when no Bengali exists", () => {
    expect(pickLocale(false, EN, undefined)).toBe(EN);
  });
});

describe("pickLocale — string call sites (section title / description)", () => {
  it("returns the Bengali string when it is non-empty", () => {
    expect(pickLocale(true, "English title", "বাংলা শিরোনাম")).toBe("বাংলা শিরোনাম");
  });

  it("falls back to English for an empty Bengali string", () => {
    expect(pickLocale(true, "English title", "")).toBe("English title");
  });

  it("falls back to English when the Bengali string is missing", () => {
    expect(pickLocale(true, "English title", undefined)).toBe("English title");
    expect(pickLocale(true, "English title", null)).toBe("English title");
  });
});

describe("pickLocale — empty or missing English side", () => {
  it("returns the English value when both sides are empty objects", () => {
    expect(pickLocale(true, {}, {})).toEqual({});
  });

  it("returns the English value even if it is empty (no invented content)", () => {
    expect(pickLocale(true, "", {})).toBe("");
    expect(pickLocale(false, undefined, BN)).toBeUndefined();
  });
});
