// ============================================================
// Site navigation model — Phase A (new IA chrome)
//
// Pure module: no database, no Next.js, no React imports, so it is
// safe to import from Server Components, Client Components and
// unit tests alike.
//
// Two data sources, in priority order:
//   1. MenuItem CMS rows (location "header"/"footer") via site-menus.ts.
//   2. SITE_NAV_FALLBACK / SITE_FOOTER_FALLBACK below.
//
// Ambiguous IA terms (Mojo, BPFI, Indexing, Press Freedom Index,
// Clubs, Other Resources, Election, Literature) are NOT given
// invented meanings here: items without a verified live route are
// marked `status: "soon"` with a `plannedHref` and NO `href`, so
// renderers must show them as non-links (never 404, never imply
// a definition). Phase B turns them into live links.
// ============================================================

export type NavStatus = "live" | "soon";

/** Localised label: an i18n key, or a literal en/bn pair (CMS rows). */
export type NavLabel =
  | { kind: "key"; key: string }
  | { kind: "text"; en: string; bn: string };

export interface NavChild {
  id: string;
  label: NavLabel;
  /** Live destination. Absent when status is "soon". */
  href?: string;
  /** Planned Phase-B destination for "soon" items (never rendered as a link). */
  plannedHref?: string;
  status: NavStatus;
  target?: "_self" | "_blank";
}

export interface NavEntry extends NavChild {
  children?: NavChild[];
}

export interface FooterColumn {
  id: string;
  heading: NavLabel;
  links: NavChild[];
}

/** Minimal shape of a Prisma MenuItem row needed to build navigation. */
export interface FlatMenuItem {
  id: string;
  label: string;
  labelBn: string;
  url: string;
  target: string;
  parentId: string | null;
  sortOrder: number;
  visible: boolean;
}

export interface MenuNode extends FlatMenuItem {
  children: MenuNode[];
}

// ------------------------------------------------------------
// Donate CTA (Phase B): informational /donate page exists; still NO
// payment processing — supporters are directed to contact the team
// until a provider decision lands in a later phase.
// ------------------------------------------------------------
export const DONATE_CTA = {
  id: "donate",
  label: { kind: "key", key: "nav.donate" } as NavLabel,
  href: "/donate",
} as const;

// Planned (Phase B) top-level order for the new information
// architecture. Used by tests to guard IA compliance.
export const NAV_TOP_LEVEL_IDS = [
  "home",
  "about",
  "theme",
  "courses",
  "resources",
  "indexing",
  "clubs",
  "events",
  "blog",
  "contact",
] as const;

// ------------------------------------------------------------
// Static fallback navigation (used when the CMS has no visible
// MenuItems for a location, or the database is unreachable).
// Only verified live routes get `href`. Everything else is
// `status: "soon"` with a `plannedHref` and no link.
// ------------------------------------------------------------
const key = (k: string): NavLabel => ({ kind: "key", key: k });

export function getFallbackHeaderNav(): NavEntry[] {
  return [
    { id: "home", label: key("nav.home"), href: "/", status: "live" },
    {
      id: "about",
      label: key("nav.about"),
      href: "/about",
      status: "live",
      children: [
        // Planned: /about/vision (Phase B)
        { id: "vision", label: key("sitenav.vision"), status: "soon", plannedHref: "/about/vision" },
        // Planned: /about/governance (Phase B)
        { id: "governance", label: key("sitenav.governance"), status: "soon", plannedHref: "/about/governance" },
        // Planned: /about/team on the existing TeamMember model (Phase B)
        { id: "team", label: key("nav.team"), status: "soon", plannedHref: "/about/team" },
        { id: "partnerships", label: key("nav.partnerships"), href: "/about/partnerships", status: "live" },
      ],
    },
    {
      id: "theme",
      label: key("sitenav.theme"),
      href: "/theme",
      status: "live",
      children: [
        { id: "research", label: key("nav.research"), href: "/research", status: "live" },
        // "Literature" meaning pending user clarification (Phase B).
        { id: "literature", label: key("sitenav.literature"), status: "soon", plannedHref: "/theme/literature" },
      ],
    },
    {
      id: "courses",
      label: key("sitenav.courses"),
      href: "/courses",
      status: "live",
      children: [
        { id: "photography", label: key("sitenav.photography"), status: "soon", plannedHref: "/courses/photography" },
        // "Mojo" meaning pending user clarification — label kept verbatim.
        { id: "mojo", label: key("sitenav.mojo"), status: "soon", plannedHref: "/courses/mojo" },
        { id: "fact-check", label: key("sitenav.factCheck"), status: "soon", plannedHref: "/courses/fact-check" },
        { id: "data-journalism", label: key("sitenav.dataJournalism"), status: "soon", plannedHref: "/courses/data-journalism" },
        { id: "new-media", label: key("sitenav.newMedia"), status: "soon", plannedHref: "/courses/new-media" },
        // Interim: the current course catalog lives at /programs until Phase B.
        { id: "programs", label: key("nav.programs"), href: "/programs", status: "live" },
      ],
    },
    {
      id: "resources",
      label: key("nav.resources"),
      href: "/resources",
      status: "live",
      children: [
        // "Election" scope pending user clarification (Phase B).
        { id: "election", label: key("sitenav.election"), status: "soon", plannedHref: "/resources/election" },
        { id: "publications", label: key("nav.publications"), href: "/publications", status: "live" },
        { id: "media", label: key("nav.media"), href: "/media", status: "live" },
        // "Other Resources" taxonomy pending user clarification (Phase B).
        { id: "other", label: key("sitenav.otherResources"), status: "soon", plannedHref: "/resources/other" },
      ],
    },
    {
      id: "indexing",
      label: key("sitenav.indexing"),
      href: "/indexing",
      status: "live",
      children: [
        { id: "press-freedom-index", label: key("sitenav.pressFreedomIndex"), status: "soon", plannedHref: "/indexing/press-freedom-index" },
        // "BPFI" kept verbatim — expansion pending user clarification.
        { id: "bpfi", label: key("sitenav.bpfi"), status: "soon", plannedHref: "/indexing/bpfi" },
      ],
    },
    // Clubs hub (live route). Individual clubs are NOT in the primary
    // navigation — they are reached via the /clubs hub cards.
    { id: "clubs", label: key("sitenav.clubs"), href: "/clubs", status: "live" },
    { id: "events", label: key("nav.events"), href: "/events", status: "live" },
    { id: "blog", label: key("nav.blog"), href: "/blog", status: "live" },
    { id: "contact", label: key("nav.contact"), href: "/contact", status: "live" },
  ];
}

export function getFallbackFooterColumns(): FooterColumn[] {
  return [
    {
      id: "explore",
      heading: key("footer.quick_links"),
      links: [
        { id: "about", label: key("nav.about"), href: "/about", status: "live" },
        { id: "research", label: key("nav.research"), href: "/research", status: "live" },
        { id: "programs", label: key("nav.programs"), href: "/programs", status: "live" },
        { id: "publications", label: key("nav.publications"), href: "/publications", status: "live" },
        { id: "media", label: key("nav.media"), href: "/media", status: "live" },
      ],
    },
    {
      id: "discover",
      // Generic heading — resolved via i18n, no invented taxonomy.
      heading: key("sitenav.discover"),
      links: [
        { id: "events", label: key("nav.events"), href: "/events", status: "live" },
        { id: "blog", label: key("nav.blog"), href: "/blog", status: "live" },
        { id: "resources", label: key("nav.resources"), href: "/resources", status: "live" },
        { id: "library", label: key("sitenav.library"), href: "/library", status: "live" },
        { id: "researchers", label: key("nav.researchers"), href: "/researchers", status: "live" },
        { id: "impact", label: key("nav.impact"), href: "/impact", status: "live" },
        { id: "careers", label: key("sitenav.careers"), href: "/careers", status: "live" },
      ],
    },
    {
      id: "support",
      heading: key("footer.support"),
      links: [
        { id: "partnerships", label: key("nav.partnerships"), href: "/about/partnerships", status: "live" },
        { id: "contact", label: key("nav.contact"), href: "/contact", status: "live" },
        { id: "privacy", label: key("footer.privacy_policy"), href: "/privacy", status: "live" },
        { id: "terms", label: key("footer.terms"), href: "/terms", status: "live" },
      ],
    },
  ];
}

// ------------------------------------------------------------
// CMS mapping: flat MenuItem rows -> tree -> NavEntry[].
// Hidden rows are dropped; siblings ordered by sortOrder.
// CMS rows always render as live links (editors own the URLs).
// ------------------------------------------------------------
export function buildMenuTree(items: FlatMenuItem[]): MenuNode[] {
  const byId = new Map<string, MenuNode>();
  for (const item of items) {
    if (!item.visible) continue;
    byId.set(item.id, { ...item, children: [] });
  }
  const roots: MenuNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const byOrder = (a: MenuNode, b: MenuNode) => a.sortOrder - b.sortOrder;
  for (const node of byId.values()) node.children.sort(byOrder);
  roots.sort(byOrder);
  return roots;
}

function cmsLabel(node: MenuNode): NavLabel {
  return { kind: "text", en: node.label, bn: node.labelBn || node.label };
}

function cmsTarget(target: string): "_self" | "_blank" {
  return target === "_blank" ? "_blank" : "_self";
}

export function menuTreeToNavEntries(nodes: MenuNode[]): NavEntry[] {
  return nodes.map((node) => ({
    id: node.id,
    label: cmsLabel(node),
    href: node.url,
    status: "live" as NavStatus,
    target: cmsTarget(node.target),
    children:
      node.children.length > 0
        ? node.children.map((child) => ({
            id: child.id,
            label: cmsLabel(child),
            href: child.url,
            status: "live" as NavStatus,
            target: cmsTarget(child.target),
          }))
        : undefined,
  }));
}

/** Group CMS footer rows into columns: each parent with children
 *  becomes a column; childless top-level rows share a Links column. */
export function menuTreeToFooterColumns(nodes: MenuNode[]): FooterColumn[] {
  const columns: FooterColumn[] = [];
  const loose: NavChild[] = [];
  for (const node of nodes) {
    if (node.children.length > 0) {
      columns.push({
        id: node.id,
        heading: cmsLabel(node),
        links: node.children.map((child) => ({
          id: child.id,
          label: cmsLabel(child),
          href: child.url,
          status: "live" as NavStatus,
          target: cmsTarget(child.target),
        })),
      });
    } else {
      loose.push({
        id: node.id,
        label: cmsLabel(node),
        href: node.url,
        status: "live" as NavStatus,
        target: cmsTarget(node.target),
      });
    }
  }
  if (loose.length > 0) {
    columns.unshift({
      id: "links",
      heading: { kind: "key", key: "sitenav.links" },
      links: loose,
    });
  }
  return columns;
}
