import { describe, it, expect, beforeEach } from "vitest";
import {
  RESERVED_SLUGS,
  validateSlug,
  sanitizeUrl,
  parseJsonSafe,
  clampText,
  isValidSectionType,
  normalizeSlug,
} from "@/lib/cms-validation";

describe("validateSlug", () => {
  it("accepts simple lowercase slugs", () => {
    expect(validateSlug("about-us")).toEqual({ valid: true });
    expect(validateSlug("research2")).toEqual({ valid: true });
    expect(validateSlug("a")).toEqual({ valid: true });
  });

  it("rejects reserved application slugs", () => {
    for (const reserved of ["home", "admin", "api", "about", "research", "blog", "contact", "media"]) {
      expect(validateSlug(reserved).valid, reserved).toBe(false);
    }
  });

  it("rejects malformed slugs", () => {
    expect(validateSlug("").valid).toBe(false);
    expect(validateSlug("Hello World").valid).toBe(false);
    expect(validateSlug("UPPER").valid).toBe(false);
    expect(validateSlug("-leading").valid).toBe(false);
    expect(validateSlug("trailing-").valid).toBe(false);
    expect(validateSlug("double--hyphen").valid).toBe(false);
    expect(validateSlug("12345").valid).toBe(false);
    expect(validateSlug("a".repeat(81)).valid).toBe(false);
  });

  it("reserved list contains every static top-level app route", () => {
    // Every real static route folder in src/app/ must be protected.
    const appRoutes = [
      "about", "blog", "careers", "clubs", "contact", "courses", "donate",
      "events", "impact", "indexing", "library", "media", "partnerships",
      "privacy", "programs", "publications", "research", "researchers",
      "resources", "terms", "theme",
    ];
    for (const route of appRoutes) {
      expect(RESERVED_SLUGS.has(route), route).toBe(true);
    }
  });

  it("normalizeSlug lowercases and collapses separators", () => {
    expect(normalizeSlug("  About   Us  ")).toBe("about-us");
  });
});

describe("sanitizeUrl", () => {
  it("allows same-origin relative paths", () => {
    expect(sanitizeUrl("/research").ok).toBe(true);
    expect(sanitizeUrl("/").ok).toBe(true);
    expect(sanitizeUrl("").ok).toBe(true);
    expect(sanitizeUrl("#section").ok).toBe(true);
  });

  it("allows http(s), mailto, tel", () => {
    expect(sanitizeUrl("https://lensbd.org/x").ok).toBe(true);
    expect(sanitizeUrl("http://example.com").ok).toBe(true);
    expect(sanitizeUrl("mailto:info@lensbd.org").ok).toBe(true);
    expect(sanitizeUrl("tel:+8801000000000").ok).toBe(true);
  });

  it("blocks javascript, data, and other dangerous schemes", () => {
    expect(sanitizeUrl("javascript:alert(1)").ok).toBe(false);
    expect(sanitizeUrl("data:text/html,<script>x</script>").ok).toBe(false);
    expect(sanitizeUrl("vbscript:x").ok).toBe(false);
    expect(sanitizeUrl("file:///etc/passwd").ok).toBe(false);
  });

  it("blocks protocol-relative URLs", () => {
    expect(sanitizeUrl("//evil.example.com/x").ok).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(sanitizeUrl(null).ok).toBe(false);
    expect(sanitizeUrl(12345).ok).toBe(false);
  });
});

describe("parseJsonSafe", () => {
  it("returns fallback on invalid JSON", () => {
    expect(parseJsonSafe("{not json", { a: 1 })).toEqual({ a: 1 });
    expect(parseJsonSafe(null, [])).toEqual([]);
  });

  it("parses valid JSON", () => {
    expect(parseJsonSafe('{"x":2}', {})).toEqual({ x: 2 });
  });
});

describe("clampText", () => {
  it("clamps long strings and passes through non-strings as empty", () => {
    expect(clampText("abcdefgh", 4)).toBe("abcd");
    expect(clampText(undefined, 10)).toBe("");
  });
});

describe("isValidSectionType", () => {
  it("accepts defined types and rejects unknown", () => {
    expect(isValidSectionType("hero")).toBe(true);
    expect(isValidSectionType("cards")).toBe(true);
    expect(isValidSectionType("events_newsletter")).toBe(true);
    expect(isValidSectionType("custom_script")).toBe(false);
    expect(isValidSectionType(undefined)).toBe(false);
  });
});
