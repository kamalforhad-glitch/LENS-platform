// Approved clubs catalogue tests: exact names/slugs, no extras.
import { describe, expect, it } from "vitest";
import { CLUBS, getClub } from "@/lib/clubs";

describe("approved clubs catalogue", () => {
  it("contains exactly the five approved clubs with exact names and slugs", () => {
    expect(CLUBS).toEqual([
      { slug: "tuesday-club", name: "Tuesday Club" },
      { slug: "lens-language-club", name: "LENS Language Club" },
      { slug: "lens-data-journalism-club", name: "LENS Data Journalism Club" },
      { slug: "lens-photography-club", name: "LENS Photography Club" },
      { slug: "lens-multimedia-new-media-club", name: "LENS Multimedia & New Media Club" },
    ]);
  });

  it("resolves every slug and rejects unknown slugs", () => {
    for (const club of CLUBS) {
      expect(getClub(club.slug)).toEqual(club);
    }
    expect(getClub("unknown-club")).toBeUndefined();
    expect(getClub("")).toBeUndefined();
  });
});
