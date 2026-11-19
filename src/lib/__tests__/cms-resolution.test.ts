// Homepage editor ↔ renderer key-contract tests.
//
// The Landing Page Editor saves one key family (brandLine,
// primaryCtaText/Link, sectionTitle, stats[], newsletterTitle, …) while
// older renderers read another (brand, cta_research, label,
// stat_*_value, newsletter_title, …). lib/cms-content.ts resolves the
// two families with editor-first precedence; these tests pin that
// contract so future editor or renderer changes cannot silently
// re-break it (an admin edit that never appeared on the site held one
// of these mismatch pairs before).
import { describe, expect, it } from "vitest";
import {
  firstUsable,
  resolveCmsValue,
  hasUsableContent,
  pickLocale,
  syncImpactStatsSharedValues,
} from "@/lib/cms-content";
import { DEFAULT_HOME_SECTIONS } from "@/lib/cms-defaults";

const EN = {
  brand: "legacy brand",
  brandLine: "editor brand",
  hero_cta: undefined,
  cta_research: "legacy cta",
  primaryCtaText: "editor cta",
};
const BN = { brand: "বাংলা ব্র্যান্ড" };

describe("firstUsable", () => {
  it("returns the first candidate key with usable content, in array order", () => {
    expect(firstUsable(EN, ["brandLine", "brand"])).toBe("editor brand");
    expect(firstUsable(EN, ["primaryCtaText", "cta_research"])).toBe("editor cta");
  });

  it("falls back to a later key when the first is missing or empty", () => {
    expect(firstUsable(EN, ["hero_cta", "cta_research"])).toBe("legacy cta");
    expect(firstUsable({ x: "" }, ["x", "y"])).toBeUndefined();
  });

  it("returns undefined for non-object sources", () => {
    expect(firstUsable(null, ["brand"])).toBeUndefined();
    expect(firstUsable("text", ["brand"])).toBeUndefined();
    expect(firstUsable([1], ["brand"])).toBeUndefined();
  });

  it("skips empty strings so saved-empty editor fields never mask legacy values", () => {
    expect(firstUsable({ brandLine: "", brand: "legacy brand" }, ["brandLine", "brand"])).toBe("legacy brand");
  });
});

describe("resolveCmsValue", () => {
  it("prefers the Bengali payload for bn=true when it has usable content", () => {
    expect(resolveCmsValue(true, EN, BN, ["brandLine", "brand"])).toBe("বাংলা ব্র্যান্ড");
  });

  it("falls back bn → en for missing Bengali values, mirroring legacy renderers", () => {
    expect(resolveCmsValue(true, EN, {}, ["brandLine", "brand"])).toBe("editor brand");
    expect(resolveCmsValue(true, EN, undefined, ["brandLine", "brand"])).toBe("editor brand");
  });

  it("reads only the English payload for bn=false", () => {
    expect(resolveCmsValue(false, EN, BN, ["brandLine", "brand"])).toBe("editor brand");
  });

  it("returns undefined when every candidate key is unusable", () => {
    expect(resolveCmsValue(true, {}, {}, ["brandLine", "brand"])).toBeUndefined();
  });
});

describe("homepage default content satisfies the renderer contract", () => {
  const section = (type: string) => {
    const s = DEFAULT_HOME_SECTIONS.find((d) => d.type === type);
    if (!s) throw new Error(`missing default section: ${type}`);
    return s;
  };

  it("hero: brandLine and primaryCtaText resolve (editor keys win)", () => {
    const hero = section("hero");
    const brandEn = firstUsable(hero.content, ["brandLine", "brand"]);
    const brandBn = firstUsable(hero.contentBn, ["brandLine", "brand"]);
    expect(brandEn).toBe(hero.content.brandLine);
    expect(brandBn).toBe(hero.contentBn.brandLine);
    const ctaEn = firstUsable(hero.content, ["primaryCtaText", "cta_research"]);
    expect(ctaEn).toBe("Explore Our Research");
    expect(firstUsable(hero.content, ["primaryCtaLink"])).toBe("/research");
  });

  it("hero: headlineWords is a non-empty string array (drives the kinetic headline)", () => {
    const hero = section("hero");
    const words = hero.content.headlineWords;
    expect(Array.isArray(words)).toBe(true);
    expect((words as string[]).length).toBeGreaterThan(0);
    expect((words as string[]).every((w) => typeof w === "string")).toBe(true);
  });

  it("focus: sectionLabel/sectionTitle/sectionDescription resolve before legacy keys", () => {
    const focus = section("focus");
    expect(firstUsable(focus.content, ["sectionLabel", "label"])).toBe("Our Focus");
    expect(firstUsable(focus.contentBn, ["sectionLabel", "label"])).toBe("আমাদের লক্ষ্য");
    expect(firstUsable(focus.content, ["sectionTitle", "title"])).toBe(
      "A Safer, More Informed Narrative Ecosystem"
    );
    expect(firstUsable(focus.content, ["sectionDescription", "description"])).toBe(
      focus.content.sectionDescription
    );
  });

  it("impact: stats[] carries key/value/suffix and a Bengali label in contentBn", () => {
    const impact = section("impact");
    const stats = impact.content.stats as Array<Record<string, unknown>>;
    const statsBn = impact.contentBn.stats as Array<Record<string, unknown>>;
    expect(stats.length).toBe(4);
    expect(statsBn.length).toBe(4);
    for (const st of stats) {
      expect(typeof st.key).toBe("string");
      expect(typeof st.value).toBe("number");
      expect(hasUsableContent(st.suffix)).toBe(true);
    }
    // The BN payload supplies the Bengali labels (editor form "Label (Bengali)").
    expect(statsBn.every((st) => hasUsableContent(st.label))).toBe(true);
    expect(statsBn[0].label).not.toBe(stats[0].label);
  });

  it("featured_research: sectionLabel/latestPublicationsHeading resolve (editor keys were dead before)", () => {
    const featured = section("featured_research");
    expect(firstUsable(featured.content, ["sectionLabel", "badge"])).toBe("Featured Research");
    expect(firstUsable(featured.content, ["latestPublicationsHeading"])).toBe("LATEST PUBLICATIONS");
    // featuredCard object must resolve and carry the card copy per locale.
    const cardEn = firstUsable(featured.content, ["featuredCard"]) as Record<string, unknown>;
    const cardBn = firstUsable(featured.contentBn, ["featuredCard"]) as Record<string, unknown>;
    expect(cardEn.title).toBe("Narratives in the Digital Age");
    expect(cardBn.title).toBe("ডিজিটাল যুগের বর্ণনা");
    expect(cardEn.tag1).toBe("Research Report");
    expect(cardBn.tag1).toBe("গবেষণা রিপোর্ট");
  });

  it("events_newsletter: newsletterTitle/Description resolve before legacy snake_case keys", () => {
    const ev = section("events_newsletter");
    expect(firstUsable(ev.content, ["newsletterTitle", "newsletter_title"])).toBe("Stay Informed");
    expect(firstUsable(ev.contentBn, ["newsletterTitle", "newsletter_title"])).toBe("যুক্ত থাকুন");
    expect(firstUsable(ev.content, ["sectionTitle", "title"])).toBe("Join Our Events");
    expect(firstUsable(ev.content, ["viewAllUrl"])).toBe("/events");
    expect(firstUsable(ev.content, ["newsletterDescription", "newsletter_subtitle"])).toBe(
      ev.content.newsletterDescription
    );
  });

  it("legacy payload still resolves (backwards compatibility)", () => {
    const legacyEn = {
      brand: "Old brand line",
      cta_research: "Old CTA",
      title: "Old section title",
      label: "Old label",
      newsletter_title: "Old newsletter",
    };
    expect(firstUsable(legacyEn, ["brandLine", "brand"])).toBe("Old brand line");
    expect(firstUsable(legacyEn, ["primaryCtaText", "cta_research"])).toBe("Old CTA");
    expect(firstUsable(legacyEn, ["sectionTitle", "title"])).toBe("Old section title");
    expect(firstUsable(legacyEn, ["sectionLabel", "label"])).toBe("Old label");
    expect(firstUsable(legacyEn, ["newsletterTitle", "newsletter_title"])).toBe("Old newsletter");
  });
});

describe("step-1 helpers remain intact", () => {
  it("hasUsableContent and pickLocale keep their documented behaviour", () => {
    expect(hasUsableContent({})).toBe(false);
    expect(hasUsableContent({ a: 1 })).toBe(true);
    expect(pickLocale(true, EN, {})).toBe(EN);
    expect(pickLocale(true, EN, BN)).toBe(BN);
  });
});

describe("syncImpactStatsSharedValues", () => {
  it("synchronizes shared numeric values and suffixes from EN to BN while keeping labels/titles independent", () => {
    const content = {
      sectionLabel: "Our Impact",
      sectionTitle: "In Numbers",
      stats: [
        { key: "stat_research_briefs", value: 6, suffix: "+", label: "Research Briefs", icon: "FileText", color: "#22d3ee" },
        { key: "stat_trained", value: 3, suffix: "+", label: "Trained Professionals", icon: "Users", color: "#0891b2" },
        { key: "stat_digital_reach", value: 0, suffix: "%", label: "Digital Reach", icon: "Globe", color: "#d4a843" },
        { key: "stat_partners", value: 0, suffix: "", label: "Partner Organizations", icon: "Handshake", color: "#14b8a6" },
      ],
    };
    const contentBn = {
      sectionLabel: "আমাদের প্রভাব",
      sectionTitle: "সংখ্যায়",
      stats: [
        { key: "stat_research_briefs", value: 12, suffix: "+", label: "গবেষণা ব্রিফ", icon: "FileText", color: "#22d3ee" },
        { key: "stat_trained", value: 500, suffix: "+", label: "প্রশিক্ষিত পেশাজীবী", icon: "Users", color: "#0891b2" },
        { key: "stat_digital_reach", value: 50000, suffix: "+", label: "ডিজিটাল পৌঁছানো", icon: "Globe", color: "#d4a843" },
        { key: "stat_partners", value: 25, suffix: "+", label: "অংশীদার প্রতিষ্ঠান", icon: "Handshake", color: "#14b8a6" },
      ],
    };

    const synced = syncImpactStatsSharedValues(content, contentBn);

    expect((synced.content.stats as Array<Record<string, unknown>>).map((s) => [s.value, s.suffix])).toEqual([
      [6, "+"],
      [3, "+"],
      [0, "%"],
      [0, ""],
    ]);
    expect((synced.contentBn.stats as Array<Record<string, unknown>>).map((s) => [s.value, s.suffix])).toEqual([
      [6, "+"],
      [3, "+"],
      [0, "%"],
      [0, ""],
    ]);
    expect((synced.content.stats as Array<Record<string, unknown>>).map((s) => s.label)).toEqual([
      "Research Briefs",
      "Trained Professionals",
      "Digital Reach",
      "Partner Organizations",
    ]);
    expect((synced.contentBn.stats as Array<Record<string, unknown>>).map((s) => s.label)).toEqual([
      "গবেষণা ব্রিফ",
      "প্রশিক্ষিত পেশাজীবী",
      "ডিজিটাল পৌঁছানো",
      "অংশীদার প্রতিষ্ঠান",
    ]);
    expect(synced.content.sectionTitle).toBe("In Numbers");
    expect(synced.contentBn.sectionTitle).toBe("সংখ্যায়");
    expect((synced.contentBn.stats as Array<Record<string, unknown>>)[0].icon).toBe("FileText");
    expect((synced.content.stats as Array<Record<string, unknown>>)[2].key).toBe("stat_digital_reach");
  });

  it("normalizes stale stored Bengali values on refresh/load so editor and persisted payloads stay consistent", () => {
    const storedAfterBuggySave = {
      content: {
        sectionLabel: "Our Impact",
        sectionTitle: "Numbers",
        stats: [
          { key: "a", value: 6, suffix: "+", label: "A" },
          { key: "b", value: 3, suffix: "+", label: "B" },
          { key: "c", value: 0, suffix: "+", label: "C" },
          { key: "d", value: 0, suffix: "+", label: "D" },
        ],
      },
      contentBn: {
        sectionLabel: "প্রভাব",
        sectionTitle: "সংখ্যা",
        stats: [
          { key: "a", value: 12, suffix: "+", label: "ক" },
          { key: "b", value: 500, suffix: "+", label: "খ" },
          { key: "c", value: 50000, suffix: "+", label: "গ" },
          { key: "d", value: 25, suffix: "+", label: "ঘ" },
        ],
      },
    };

    const normalized = syncImpactStatsSharedValues(storedAfterBuggySave.content, storedAfterBuggySave.contentBn);

    expect(normalized.contentBn.stats).toEqual([
      { key: "a", value: 6, suffix: "+", label: "ক" },
      { key: "b", value: 3, suffix: "+", label: "খ" },
      { key: "c", value: 0, suffix: "+", label: "গ" },
      { key: "d", value: 0, suffix: "+", label: "ঘ" },
    ]);
    expect(JSON.parse(JSON.stringify(normalized.content.stats))).toEqual(
      JSON.parse(JSON.stringify(normalized.contentBn.stats.map((s, i) => ({
        ...(normalized.content.stats as Array<Record<string, unknown>>)[i],
        label: (normalized.content.stats as Array<Record<string, unknown>>)[i].label,
      })))).map((s: Record<string, unknown>, i: number) => ({
        ...(normalized.content.stats as Array<Record<string, unknown>>)[i],
        value: s.value,
        suffix: s.suffix,
      }))
    );
    const enNums = (normalized.content.stats as Array<Record<string, unknown>>).map((s) => [s.value, s.suffix]);
    const bnNums = (normalized.contentBn.stats as Array<Record<string, unknown>>).map((s) => [s.value, s.suffix]);
    expect(bnNums).toEqual(enNums);
  });

  it("matches by index fallback and preserves unrelated content fields when keys are missing", () => {
    const synced = syncImpactStatsSharedValues(
      { other: "keep", stats: [{ value: 9, suffix: "x", label: "EN" }] },
      { otherBn: "keep-bn", stats: [{ value: 1, suffix: "y", label: "BN" }] }
    );

    expect(synced.content.other).toBe("keep");
    expect(synced.contentBn.otherBn).toBe("keep-bn");
    expect((synced.contentBn.stats as Array<Record<string, unknown>>)[0]).toEqual({
      value: 9,
      suffix: "x",
      label: "BN",
    });
  });
});
