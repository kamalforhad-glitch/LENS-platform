// Controlled resource taxonomy (Phase B).
//
// Named buckets map to dedicated views; "Other" is the overflow bucket
// for every published Resource whose category has no dedicated view.
// Nothing here renames or migrates stored data — views only filter.
//
// Dedicated views in scope:
//   Election     -> /resources/election  (Resource.category = "Election")
//   Publications -> /resources/publications (Publication model)
//   Media        -> /resources/media (MediaItem model)
//   Other        -> /resources/other (Resource overflow)
//
// Planned buckets without a dedicated view yet (Datasets, Tools,
// Guides) keep rendering inside "Other" so no published resource is
// orphaned from the taxonomy.
export const RESOURCE_ELECTION_CATEGORY = "Election";

export const RESOURCE_TAXONOMY_VIEWS = [
  {
    slug: "election",
    name: "Election",
    href: "/resources/election",
    description: "Election-related resources, guides and reference materials.",
  },
  {
    slug: "publications",
    name: "Publications",
    href: "/resources/publications",
    description: "Policy briefs, working papers and research reports.",
  },
  {
    slug: "media",
    name: "Media",
    href: "/resources/media",
    description: "Press releases, interviews, statements and media coverage.",
  },
  {
    slug: "other",
    name: "Other Resources",
    href: "/resources/other",
    description: "Datasets, tools, guides and materials outside the named collections.",
  },
] as const;

/** Overflow rule: everything except the Election bucket (which owns its view). */
export function isOverflowResource(category: string): boolean {
  return category !== RESOURCE_ELECTION_CATEGORY;
}
