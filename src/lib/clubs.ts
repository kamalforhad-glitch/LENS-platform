// Approved club catalogue (static configuration).
//
// The five names below are the ONLY verified club information (provided
// from the official planning reference). No descriptions, coordinators,
// schedules, or activities exist yet — club pages therefore render an
// explicit editorial placeholder until verified content is supplied.
// Club names are intentionally NOT localised: the exact English names
// are the approved identifiers.
export interface Club {
  slug: string;
  name: string;
}

export const CLUBS: Club[] = [
  { slug: "tuesday-club", name: "Tuesday Club" },
  { slug: "lens-language-club", name: "LENS Language Club" },
  { slug: "lens-data-journalism-club", name: "LENS Data Journalism Club" },
  { slug: "lens-photography-club", name: "LENS Photography Club" },
  { slug: "lens-multimedia-new-media-club", name: "LENS Multimedia & New Media Club" },
];

export function getClub(slug: string): Club | undefined {
  return CLUBS.find((c) => c.slug === slug);
}
