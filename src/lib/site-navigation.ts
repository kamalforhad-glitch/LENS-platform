// ============================================================
// Site navigation model — Complete Bilingual Navigation
//
// Pure module: no database, no Next.js, no React imports, so it is
// safe to import from Server Components, Client Components and
// unit tests alike.
//
// Two data sources, in priority order:
//   1. MenuItem CMS rows (location "header"/"footer") via site-menus.ts.
//   2. SITE_NAV_FALLBACK / SITE_FOOTER_FALLBACK below.
// ============================================================

export type NavStatus = "live" | "soon" | "draft" | "disabled";

/** Localised label: an i18n key, or a literal en/bn pair (CMS rows). */
export type NavLabel =
  | { kind: "key"; key: string }
  | { kind: "text"; en: string; bn: string };

export interface NavChild {
  id: string;
  label: NavLabel;
  /** Live destination. Absent when status is "soon" and isClickable is false. */
  href?: string;
  /** Planned destination for "soon" items. */
  plannedHref?: string;
  status: NavStatus;
  target?: "_self" | "_blank";
  description?: string;
  descriptionBn?: string;
  badgeText?: string;
  badgeTextBn?: string;
  badgeStyle?: string;
  icon?: string;
  isClickable?: boolean;
  openSubmenu?: boolean;
  desktopVisible?: boolean;
  mobileVisible?: boolean;
  children?: NavChild[];
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
  location?: string;
  status?: string;
  description?: string;
  descriptionBn?: string;
  externalUrl?: string | null;
  isClickable?: boolean;
  openSubmenu?: boolean;
  badgeText?: string | null;
  badgeTextBn?: string | null;
  badgeStyle?: string | null;
  icon?: string | null;
  desktopVisible?: boolean;
  mobileVisible?: boolean;
  roles?: string | null;
}

export interface MenuNode extends FlatMenuItem {
  children: MenuNode[];
}

// ------------------------------------------------------------
// Donate CTA: informational /donate page; configurable in CMS
// ------------------------------------------------------------
export const DONATE_CTA = {
  id: "donate",
  label: { kind: "key", key: "nav.donate" } as NavLabel,
  href: "/donate",
} as const;

// Planned top-level order for the information architecture.
// Used by tests to guard IA compliance.
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
        { id: "vision", label: key("sitenav.vision"), status: "soon", plannedHref: "/about/vision", badgeText: "SOON" },
        { id: "governance", label: key("sitenav.governance"), status: "soon", plannedHref: "/about/governance", badgeText: "SOON" },
        { id: "team", label: key("nav.team"), status: "soon", plannedHref: "/about/team", badgeText: "SOON" },
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
        { id: "literature", label: key("sitenav.literature"), status: "soon", plannedHref: "/theme/literature", badgeText: "SOON" },
      ],
    },
    {
      id: "courses",
      label: key("sitenav.courses"),
      href: "/courses",
      status: "live",
      children: [
        { id: "photography", label: key("sitenav.photography"), status: "soon", plannedHref: "/courses/photography", badgeText: "SOON" },
        { id: "mojo", label: key("sitenav.mojo"), status: "soon", plannedHref: "/courses/mojo", badgeText: "SOON" },
        { id: "fact-check", label: key("sitenav.factCheck"), status: "soon", plannedHref: "/courses/fact-check", badgeText: "SOON" },
        { id: "data-journalism", label: key("sitenav.dataJournalism"), status: "soon", plannedHref: "/courses/data-journalism", badgeText: "SOON" },
        { id: "new-media", label: key("sitenav.newMedia"), status: "soon", plannedHref: "/courses/new-media", badgeText: "SOON" },
        { id: "programs", label: key("nav.programs"), href: "/programs", status: "live" },
      ],
    },
    {
      id: "resources",
      label: key("nav.resources"),
      href: "/resources",
      status: "live",
      children: [
        { id: "election", label: key("sitenav.election"), status: "soon", plannedHref: "/resources/election", badgeText: "SOON" },
        { id: "publications", label: key("nav.publications"), href: "/publications", status: "live" },
        { id: "media", label: key("nav.media"), href: "/media", status: "live" },
        { id: "other", label: key("sitenav.otherResources"), status: "soon", plannedHref: "/resources/other", badgeText: "SOON" },
      ],
    },
    {
      id: "indexing",
      label: key("sitenav.indexing"),
      href: "/indexing",
      status: "live",
      children: [
        { id: "press-freedom-index", label: key("sitenav.pressFreedomIndex"), status: "soon", plannedHref: "/indexing/press-freedom-index", badgeText: "SOON" },
        { id: "bpfi", label: key("sitenav.bpfi"), status: "soon", plannedHref: "/indexing/bpfi", badgeText: "SOON" },
      ],
    },
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
// Hidden and draft/disabled rows are dropped from public view;
// siblings ordered by sortOrder.
// ------------------------------------------------------------
export function buildMenuTree(items: FlatMenuItem[]): MenuNode[] {
  const byId = new Map<string, MenuNode>();
  for (const item of items) {
    if (item.visible === false) continue;
    if (item.status === "draft" || item.status === "disabled") continue;
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
  const byOrder = (a: MenuNode, b: MenuNode) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  for (const node of byId.values()) node.children.sort(byOrder);
  roots.sort(byOrder);
  return roots;
}

/** Full tree for CMS admin navigation manager (includes draft, disabled, and hidden items) */
export function buildFullMenuTree(items: FlatMenuItem[]): MenuNode[] {
  const byId = new Map<string, MenuNode>();
  for (const item of items) {
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
  const byOrder = (a: MenuNode, b: MenuNode) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  for (const node of byId.values()) node.children.sort(byOrder);
  roots.sort(byOrder);
  return roots;
}

function cmsLabel(node: MenuNode): NavLabel {
  return { kind: "text", en: node.label, bn: node.labelBn || node.label };
}

function cmsTarget(target?: string): "_self" | "_blank" {
  return target === "_blank" ? "_blank" : "_self";
}

function nodeToNavEntry(node: MenuNode): NavEntry {
  const isSoon = node.status === "soon";
  const isClickable = node.isClickable !== false;
  // If status is soon, only set href if explicitly configured as clickable:
  const href = isSoon ? (isClickable ? node.url : undefined) : node.url;
  return {
    id: node.id,
    label: cmsLabel(node),
    href,
    plannedHref: node.url,
    status: isSoon ? "soon" : "live",
    target: cmsTarget(node.target),
    description: node.description || undefined,
    descriptionBn: node.descriptionBn || undefined,
    badgeText: node.badgeText ?? undefined,
    badgeTextBn: node.badgeTextBn ?? undefined,
    badgeStyle: node.badgeStyle || "gold",
    icon: node.icon ?? undefined,
    isClickable,
    openSubmenu: node.openSubmenu !== false,
    desktopVisible: node.desktopVisible !== false,
    mobileVisible: node.mobileVisible !== false,
    children: node.children.length > 0 ? node.children.map(nodeToNavEntry) : undefined,
  };
}

export function menuTreeToNavEntries(nodes: MenuNode[]): NavEntry[] {
  return nodes.map(nodeToNavEntry);
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
        links: node.children.map(nodeToNavEntry),
      });
    } else {
      loose.push(nodeToNavEntry(node));
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
