import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageSectionsView, { type SectionWithResolved } from "@/components/page/PageSectionsView";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { RESERVED_SLUGS } from "@/lib/cms-validation";

export const dynamic = "force-dynamic";

// Localized heading above the CMS-rendered content (mirrors the blog hub).
const TITLE_FALLBACK = { en: "Home", bn: "হোম" } as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug.toLowerCase())) return {};
  const page = await getPublicPage(slug);
  if (!page) return { title: "Page Not Found" };

  const title = page.metaTitle || page.title;
  const description = page.metaDescription || page.description;
  // Only propagate an absolute URL (validated at write time) or a same-site path.
  const ogImage =
    page.ogImage && /^https?:\/\//i.test(page.ogImage) ? page.ogImage : undefined;

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

  // Defense in depth: reserved routes belong to the app, never to CMS slugs.
  if (RESERVED_SLUGS.has(key)) notFound();

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
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <div className="pt-24 pb-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="text-sm text-slate-500 mb-2" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-teal-600">
                {TITLE_FALLBACK.en}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-slate-800">{page.title}</span>
            </nav>
          </div>
        </div>
        <PageSectionsView sections={sections} />
      </main>
      <SiteFooter />
    </>
  );
}
