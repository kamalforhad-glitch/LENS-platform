import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type SectionWithResolved } from "@/components/page/PageSectionsView";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { PROTECTED_ROOT_PREFIXES } from "@/lib/cms-validation";
import { parseKeywords, safeMetadataUrl } from "@/lib/page-seo";
import CmsPageView from "@/components/page/CmsPageView";

export const dynamic = "force-dynamic";

interface NestedParams {
  slug: string;
  subslug: string[];
}

function resolveFullSlug(slug: string, subslug: string[]): string {
  const parts = [slug, ...(Array.isArray(subslug) ? subslug : [subslug])].filter(Boolean);
  return parts.join("/").toLowerCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<NestedParams>;
}): Promise<Metadata> {
  const { slug, subslug } = await params;
  if (!slug || !subslug || subslug.length === 0) return { title: "Page Not Found" };

  const rootPrefix = (slug || "").toLowerCase();
  if (PROTECTED_ROOT_PREFIXES.has(rootPrefix)) return {};

  const fullSlug = resolveFullSlug(slug, subslug);
  const page = await getPublicPage(fullSlug);
  if (!page) return { title: "Page Not Found" };

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

export default async function NestedCmsPage({
  params,
}: {
  params: Promise<NestedParams>;
}) {
  const { slug, subslug } = await params;
  if (!slug || !subslug || subslug.length === 0) notFound();

  const rootPrefix = (slug || "").toLowerCase();
  if (PROTECTED_ROOT_PREFIXES.has(rootPrefix)) notFound();

  const fullSlug = resolveFullSlug(slug, subslug);
  const page = await getPublicPage(fullSlug);
  if (!page) notFound();

  // Resolve DB-driven collections server-side
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
