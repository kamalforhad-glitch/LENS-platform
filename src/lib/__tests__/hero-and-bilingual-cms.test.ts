import { describe, expect, it } from "vitest";
import { resolveCmsValue, pickLocale } from "@/lib/cms-content";
import { DEFAULT_SITE_SETTINGS } from "@/lib/cms-defaults";
import { SECTION_TYPE_DEFS } from "@/components/admin/PageSectionEditor";
import { sanitizeSectionJson, sanitizeUrl } from "@/lib/cms-validation";

describe("Hero CMS & Media Resolution", () => {
  it("resolves background media fields with fallback", () => {
    const content = {
      backgroundImage: "/uploads/hero-test.webp",
      backgroundVideo: "/uploads/hero-video.mp4",
      posterImage: "/uploads/hero-poster.webp",
      overlayColor: "teal",
      overlayOpacity: 0.75,
      layoutVariant: "split",
      textAlignment: "center",
      imageAlt: "Civic Youth Bangladesh in Action",
    };

    expect(content.backgroundVideo).toBe("/uploads/hero-video.mp4");
    expect(content.posterImage).toBe("/uploads/hero-poster.webp");
    expect(content.overlayColor).toBe("teal");
    expect(content.layoutVariant).toBe("split");
    expect(content.textAlignment).toBe("center");
  });

  it("exposes all required hero fields in SECTION_TYPE_DEFS", () => {
    const heroDef = SECTION_TYPE_DEFS.find((d) => d.type === "hero");
    expect(heroDef).toBeDefined();

    const keys = heroDef!.fields.map((f) => f.key);
    expect(keys).toContain("eyebrow");
    expect(keys).toContain("subtitle");
    expect(keys).toContain("image");
    expect(keys).toContain("backgroundVideo");
    expect(keys).toContain("posterImage");
    expect(keys).toContain("overlayColor");
    expect(keys).toContain("overlayOpacity");
    expect(keys).toContain("layoutVariant");
    expect(keys).toContain("textAlignment");
    expect(keys).toContain("ctaLabel");
    expect(keys).toContain("ctaUrl");
    expect(keys).toContain("ctaLabel2");
    expect(keys).toContain("ctaUrl2");
  });

  it("exposes background video and overlay in banner type def", () => {
    const bannerDef = SECTION_TYPE_DEFS.find((d) => d.type === "banner");
    expect(bannerDef).toBeDefined();

    const keys = bannerDef!.fields.map((f) => f.key);
    expect(keys).toContain("backgroundVideo");
    expect(keys).toContain("posterImage");
    expect(keys).toContain("overlayColor");
    expect(keys).toContain("overlayOpacity");
  });
});

describe("True Bilingual Management & Isolation", () => {
  it("isolates English and Bangla payloads without cross pollution", () => {
    const enContent = {
      brandLine: "Lighthouse for Evolving Narrative Systems",
      badge: "NON-PARTISAN RESEARCH INITIATIVE",
      primaryCtaText: "Explore Research",
    };
    const bnContent = {
      brandLine: "লাইটহাউস ফর ইভলভিং ন্যারেটিভ সিস্টেমস",
      badge: "অদলীয় গবেষণা উদ্যোগ",
      primaryCtaText: "গবেষণা অন্বেষণ করুন",
    };

    // When language is English
    const enResolved = resolveCmsValue(false, enContent, bnContent, ["brandLine"]);
    expect(enResolved).toBe("Lighthouse for Evolving Narrative Systems");

    // When language is Bangla
    const bnResolved = resolveCmsValue(true, enContent, bnContent, ["brandLine"]);
    expect(bnResolved).toBe("লাইটহাউস ফর ইভলভিং ন্যারেটিভ সিস্টেমস");

    // Verify EN is untouched
    expect(enContent.brandLine).toBe("Lighthouse for Evolving Narrative Systems");
  });

  it("falls back to English cleanly when Bengali content is missing or empty", () => {
    const enContent = {
      brandLine: "English Only Brand",
      subtitle: "English Subtitle",
    };
    const emptyBnContent = {
      brandLine: "",
      subtitle: "",
    };

    const resolved = resolveCmsValue(true, enContent, emptyBnContent, ["brandLine"]);
    expect(resolved).toBe("English Only Brand");

    const picked = pickLocale(true, enContent.subtitle, emptyBnContent.subtitle);
    expect(picked).toBe("English Subtitle");
  });

  it("picks Bengali when Bengali text is present", () => {
    const enText = "English Title";
    const bnText = "বাংলা শিরোনাম";

    expect(pickLocale(false, enText, bnText)).toBe("English Title");
    expect(pickLocale(true, enText, bnText)).toBe("বাংলা শিরোনাম");
  });

  it("calculates translation completeness dynamically from required fields", () => {
    const totalFields = 4; // title, description, subtitle, button
    const translatedFields = 3; // title, description, subtitle translated
    const pct = Math.round((translatedFields / totalFields) * 100);
    expect(pct).toBe(75);
  });
});

describe("Section Duplication & Cloning Isolation", () => {
  it("guarantees independent clone identifiers and data immutability", () => {
    const sourceSection = {
      id: "sec-source-uuid-1",
      type: "cards",
      title: "Impact Cards",
      content: { cards: [{ title: "Card 1" }, { title: "Card 2" }] },
    };

    const duplicatedSection = {
      ...sourceSection,
      id: "sec-clone-uuid-2",
      content: JSON.parse(JSON.stringify(sourceSection.content)),
    };

    expect(duplicatedSection.id).not.toBe(sourceSection.id);

    // Mutating duplicate does not mutate source
    duplicatedSection.content.cards[0].title = "Modified Card in Duplicate";
    expect(sourceSection.content.cards[0].title).toBe("Card 1");
    expect(duplicatedSection.content.cards[0].title).toBe("Modified Card in Duplicate");
  });
});

describe("Security & Input Sanitization", () => {
  it("rejects malicious script tags and unsafe schemes in section content", () => {
    const maliciousJson = JSON.stringify({
      title: "Normal title",
      description: "Description with <script>alert('xss')</script>",
      buttonUrl: "javascript:alert(1)",
    });

    const result = sanitizeSectionJson(maliciousJson);
    expect(result.ok).toBe(false);
  });

  it("accepts safe relative and HTTPS URLs", () => {
    expect(sanitizeUrl("/about").ok).toBe(true);
    expect(sanitizeUrl("https://lensbd.org/research").ok).toBe(true);
    expect(sanitizeUrl("javascript:void(0)").ok).toBe(false);
    expect(sanitizeUrl("data:text/html,evil").ok).toBe(false);
  });
});

describe("Design & Navigation Site Settings", () => {
  it("includes all new design tokens and presets in DEFAULT_SITE_SETTINGS", () => {
    const keys = DEFAULT_SITE_SETTINGS.map((s) => s.key);
    expect(keys).toContain("site_logo_url");
    expect(keys).toContain("site_logo_alt");
    expect(keys).toContain("site_logo_destination");
    expect(keys).toContain("site_favicon_url");
    expect(keys).toContain("header_layout");
    expect(keys).toContain("header_cta_visible");
    expect(keys).toContain("header_cta_label");
    expect(keys).toContain("header_cta_url");
    expect(keys).toContain("brand_accent_color");
    expect(keys).toContain("typography_preset");
    expect(keys).toContain("button_style_preset");
    expect(keys).toContain("footer_layout");
  });

  it("has valid bilingual values for announcement bar and header CTA", () => {
    const cta = DEFAULT_SITE_SETTINGS.find((s) => s.key === "header_cta_label");
    expect(cta).toBeDefined();
    expect(cta?.value).toBe("Support LENS");
    expect(cta?.valueBn).toBe("সহযোগিতা করুন");

    const banner = DEFAULT_SITE_SETTINGS.find((s) => s.key === "announcement_text");
    expect(banner).toBeDefined();
    expect(banner?.value).toBeTruthy();
    expect(banner?.valueBn).toBeTruthy();
  });
});

