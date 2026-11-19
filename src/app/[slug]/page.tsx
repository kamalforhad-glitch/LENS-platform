import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type SectionWithResolved } from "@/components/page/PageSectionsView";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { RESERVED_SLUGS } from "@/lib/cms-validation";
import { parseKeywords, safeMetadataUrl } from "@/lib/page-seo";
import CmsPageView from "@/components/page/CmsPageView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = (slug || "").toLowerCase();
  if (RESERVED_SLUGS.has(key)) return {};
  const page = await getPublicPage(key);
  if (!page) return { title: "Page Not Found" };

  // Prefer configured page-level SEO fields, then localized page copy.
  const title =
    page.metaTitleBn ||
    page.metaTitle ||
    (page.titleBn?.trim() ? page.titleBn : null) ||
    page.title;
  const description =
    page.metaDescriptionBn ||
    page.metaDescription ||
    (page.descriptionBn?.trim() ? page.descriptionBn : null) ||
    page.description;
  const keywords = parseKeywords(page.keywords);
  const ogImage = safeMetadataUrl(page.ogImage);
  const canonical =
    safeMetadataUrl(page.canonicalUrl) || `/${page.slug}`;

  return {
    title: title || page.slug,
    description: description || undefined,
    // Omit when unset so the root layout's global `seo_keywords` survives.
    ...(keywords ? { keywords } : {}),
    openGraph: {
      title: title || undefined,
      description: description || undefined,
      url: canonical,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      title: title || undefined,
      description: description || undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    alternates: { canonical },
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = (slug || "").toLowerCase();

  // Defense in depth: reserved routes belong to the app, never to CMS slugs,
  // UNLESS a published CMS page owns that slug (migrated hardcoded route).
  if (RESERVED_SLUGS.has(key)) {
    const reservedPage = await getPublicPage(key);
    if (!reservedPage) notFound();
  }

  const page = await getPublicPage(key);
  if (!page) notFound();

  // Resolve DB-driven collections (featured / team) once, server-side.
  const sections: SectionWithResolved[] = await Promise.all(
    page.sections.map(async (section: PublicSectionData) => {
      try {
        return {
          ...section,
          resolved: await resolveSectionItems(section.type, section.content),
        };
      } catch {
        return { ...section, resolved: { items: [] } };
      }
    })
  );

  return (
    <CmsPageView
      page={{
        id: page.id,
        slug: page.slug,
        title: page.title,
        titleBn: page.titleBn,
        sections,
        hierarchy: page.hierarchy,
        breadcrumbs: page.breadcrumbs,
      }}
    />
  );
}
