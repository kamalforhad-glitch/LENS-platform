import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type SectionWithResolved } from "@/components/page/PageSectionsView";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { RESERVED_SLUGS } from "@/lib/cms-validation";
import CmsPageView from "@/components/page/CmsPageView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug.toLowerCase())) return {};
  const page = await getPublicPage(slug);
  if (!page) return { title: "Page Not Found" };

  // Use Bangla metadata when available and usable, otherwise English.
  const bnValue = page.titleBn && page.titleBn.trim() ? page.titleBn : null;
  const enValue = page.metaTitle || page.title;
  const title = bnValue || enValue;

  const descBnValue = page.descriptionBn && page.descriptionBn.trim() ? page.descriptionBn : null;
  const descEnValue = page.metaDescription || page.description;
  const description = descBnValue || descEnValue;

  // Prefer Bangla OG image, fall back to English OG image, validated as absolute URL.
  const ogImageBn = page.ogImage && /^https?:\/\//i.test(page.ogImage) ? page.ogImage : null;
  const ogImage = ogImageBn; // Use the validated image (no separate BN image field in Page model)

  return {
    title: title || page.slug,
    description: description || undefined,
    openGraph: {
      title: title || undefined,
      description: description || undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      title: title || undefined,
      description: description || undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: { canonical: `/${page.slug}` },
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

  return <CmsPageView page={{ id: page.id, slug: page.slug, title: page.title, sections }} />;
}
