import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero, { type HeroAccent } from "@/components/site/PageHero";
import SectionSubnav, { type SectionType, type DynamicSubnavItem } from "@/components/site/SectionSubnav";
import SectionSubsections, { type DynamicSubsectionCard } from "./SectionSubsections";
import InstitutionalCta from "./InstitutionalCta";
import PageSectionsView, { type SectionWithResolved } from "./PageSectionsView";
import type { CmsBreadcrumbItem, CmsPageHierarchy } from "@/lib/actions/cms";
import type { Crumb } from "@/components/site/Breadcrumbs";
import {
  Users,
  Layers,
  GraduationCap,
  FolderKanban,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

export interface CmsPageViewProps {
  page: {
    id: string;
    slug: string;
    title: string;
    titleBn?: string;
    description?: string;
    descriptionBn?: string;
    sections: SectionWithResolved[];
    hierarchy?: CmsPageHierarchy;
    breadcrumbs?: CmsBreadcrumbItem[];
    subnavItems?: DynamicSubnavItem[];
    childCards?: DynamicSubsectionCard[];
  };
}

interface SectionMeta {
  section: SectionType | null;
  accent: HeroAccent;
  eyebrow: string;
  badgeLabel: string;
  badgeIcon: LucideIcon;
}

function resolveSectionMeta(slug: string): SectionMeta {
  const cleanSlug = slug.toLowerCase().replace(/^\/+|\/+$/g, "");
  const firstSegment = cleanSlug.split("/")[0] || "";

  if (firstSegment === "about") {
    return {
      section: "about",
      accent: "indigo",
      eyebrow: "About LENS",
      badgeLabel: "Civil Society & Think Tank",
      badgeIcon: Users,
    };
  }
  if (firstSegment === "theme" || firstSegment === "library") {
    return {
      section: "theme",
      accent: "teal",
      eyebrow: "Thematic Framework",
      badgeLabel: "Knowledge Architecture",
      badgeIcon: Layers,
    };
  }
  if (firstSegment === "courses" || firstSegment === "programs") {
    return {
      section: "courses",
      accent: "violet",
      eyebrow: "Academy & Training",
      badgeLabel: "Educational Academy",
      badgeIcon: GraduationCap,
    };
  }
  if (firstSegment === "resources") {
    return {
      section: "resources",
      accent: "emerald",
      eyebrow: "Open Knowledge & Datasets",
      badgeLabel: "Open Knowledge Base",
      badgeIcon: FolderKanban,
    };
  }

  return {
    section: null,
    accent: "gold",
    eyebrow: "LENS Bangladesh",
    badgeLabel: "Research & Policy",
    badgeIcon: Sparkles,
  };
}

function buildCrumbs(
  slug: string,
  title: string,
  providedCrumbs?: CmsBreadcrumbItem[],
  section?: SectionType | null
): Crumb[] {
  if (providedCrumbs && providedCrumbs.length > 0) {
    return providedCrumbs.map((b) => ({
      label: b.label,
      href: b.href,
    }));
  }

  const cleanSlug = slug.toLowerCase().replace(/^\/+|\/+$/g, "");
  const parts = cleanSlug.split("/").filter(Boolean);

  if (parts.length <= 1) {
    return [{ label: "Home", href: "/" }, { label: title }];
  }

  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];

  if (section === "about") {
    crumbs.push({ label: "About", href: "/about" });
  } else if (section === "theme") {
    crumbs.push({ label: "Theme", href: "/theme" });
  } else if (section === "courses") {
    crumbs.push({ label: "Courses", href: "/courses" });
  } else if (section === "resources") {
    crumbs.push({ label: "Resources", href: "/resources" });
  } else {
    const parentSlug = parts.slice(0, -1).join("/");
    const parentLabel = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    crumbs.push({ label: parentLabel, href: `/${parentSlug}` });
  }

  crumbs.push({ label: title });
  return crumbs;
}

/**
 * Shared Rich Page Shell:
 * Header -> PageHero (Navy + Glow) -> SectionSubnav (if in track) ->
 * Custom CMS Sections -> Subsections Card Grid -> Institutional CTA -> Footer
 */
export default function CmsPageView({ page }: CmsPageViewProps) {
  const meta = resolveSectionMeta(page.slug);
  const crumbs = buildCrumbs(page.slug, page.title, page.breadcrumbs, meta.section);
  const BadgeIcon = meta.badgeIcon;

  // Check if first section is a CMS hero to avoid duplicating hero elements
  let heroEyebrow = meta.eyebrow;
  let heroTitle = page.title;
  let heroDescription = page.description || "";
  let heroActions: React.ReactNode = null;
  let contentSections = page.sections;

  const firstSection = page.sections[0];
  if (firstSection && (firstSection.type === "hero" || firstSection.type === "banner")) {
    const content = (firstSection.content || {}) as Record<string, unknown>;
    if (content.eyebrow && typeof content.eyebrow === "string") {
      heroEyebrow = content.eyebrow;
    }
    if (content.title && typeof content.title === "string") {
      heroTitle = content.title;
    }
    if (content.subtitle && typeof content.subtitle === "string") {
      heroDescription = content.subtitle;
    } else if (firstSection.description) {
      heroDescription = firstSection.description;
    }

    const ctaLabel = typeof content.ctaLabel === "string" ? content.ctaLabel : "";
    const ctaUrl = typeof content.ctaUrl === "string" ? content.ctaUrl : "";
    const cta2Label = typeof content.ctaLabel2 === "string" ? content.ctaLabel2 : "";
    const cta2Url = typeof content.ctaUrl2 === "string" ? content.ctaUrl2 : "";

    if ((ctaLabel && ctaUrl) || (cta2Label && cta2Url)) {
      heroActions = (
        <div className="flex flex-wrap gap-3 mt-4">
          {ctaLabel && ctaUrl && (
            <Link
              href={ctaUrl}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-white transition-colors shadow-xs"
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
          {cta2Label && cta2Url && (
            <Link
              href={cta2Url}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
            >
              <span>{cta2Label}</span>
            </Link>
          )}
        </div>
      );
    }

    // Merge hero data into PageHero and exclude the raw first section
    contentSections = page.sections.slice(1);
  }

  // Check if page already has custom CTA section
  const hasCustomCta = contentSections.some((s) => s.type === "cta");

  // Determine active subnav href
  const activeSubnavHref = page.slug.startsWith("/") ? page.slug : `/${page.slug}`;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1 pt-20 sm:pt-24">
        {/* Rich Institutional Hero */}
        <PageHero
          accent={meta.accent}
          eyebrow={heroEyebrow}
          title={heroTitle}
          description={heroDescription || undefined}
          actions={heroActions}
          badge={
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                meta.accent === "indigo"
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                  : meta.accent === "teal"
                  ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                  : meta.accent === "violet"
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                  : meta.accent === "emerald"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}
            >
              <BadgeIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{meta.badgeLabel}</span>
            </span>
          }
          breadcrumbItems={crumbs}
        />

        {/* Section Subnav if page belongs to a primary section */}
        {meta.section && (
          <SectionSubnav
            section={meta.section}
            activeHref={activeSubnavHref}
            customItems={page.subnavItems}
          />
        )}

        {/* Structured CMS Page Sections */}
        {contentSections.length > 0 && (
          <PageSectionsView sections={contentSections} />
        )}

        {/* Subsection Cards for discovery within section hierarchy */}
        {meta.section && (
          <SectionSubsections
            section={meta.section}
            currentSlug={page.slug}
            customCards={page.childCards}
          />
        )}

        {/* Institutional Closing Call to Action */}
        {!hasCustomCta && (
          <InstitutionalCta section={meta.section} accentOverride={meta.accent} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
