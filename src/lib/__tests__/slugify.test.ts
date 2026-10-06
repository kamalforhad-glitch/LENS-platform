import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/db";

describe("slugify (auth/search/upload shared helper)", () => {
  it("slugifies ASCII titles", () => {
    expect(slugify("Media Index Bangladesh 2025")).toBe("media-index-bangladesh-2025");
  });

  it("preserves Bengali letters instead of returning empty", () => {
    const slug = slugify("গণমাধ্যম সাক্ষরতা");
    expect(slug.length).toBeGreaterThan(0);
    expect(slug).not.toBe("-");
  });

  it("falls back to a non-empty id for symbols-only titles", () => {
    const slug = slugify("!!! ???");
    expect(slug.length).toBeGreaterThan(0);
  });

  it("trims and collapses hyphens", () => {
    expect(slugify("  Hello   World  ")).toBe("hello-world");
  });
});
