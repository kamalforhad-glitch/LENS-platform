import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import ContentListState from "@/components/ContentListState";
import { CLUBS, getClub } from "@/lib/clubs";
import { getPublicPage, type PublicSectionData } from "@/lib/actions/cms";
import { resolveSectionItems } from "@/components/page/resolveSectionItems";
import type { SectionWithResolved } from "@/components/page/PageSectionsView";
import CmsPageView from "@/components/page/CmsPageView";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return CLUBS.map((c) => ({ slug: c.slug }));
}

async function resolveCmsSections(sections: PublicSectionData[]) {
  return Promise.all(
    sections.map(async (s) => ({
      ...s,
      resolved: await resolveSectionItems(s.type, s.content).catch(() => ({ items: [] })),
    }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cms = await getPublicPage(`clubs/${slug}`);
  if (cms) {
    return {
      title: cms.metaTitle || cms.title,
      description: cms.metaDescription || cms.description || undefined,
    };
  }
  const club = getClub(slug);
  if (!club) return { title: "Club Not Found" };
  return {
    title: club.name,
    description: `Information about ${club.name} will be published here.`,
  };
}

export default async function ClubDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cms = await getPublicPage(`clubs/${slug}`);
  if (cms) {
    const sections: SectionWithResolved[] = await resolveCmsSections(cms.sections);
    return <CmsPageView page={{ id: cms.id, slug: cms.slug, title: cms.title, sections }} />;
  }

  const club = getClub(slug);
  if (!club) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Clubs"
          title={club.name}
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Clubs", href: "/clubs" },
            { label: club.name },
          ]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ContentListState
              variant="empty"
              emptyMessage={`Information about ${club.name} will be published soon.`}
            />

            <div className="mt-10 text-center">
              <Link
                href="/clubs"
                className="inline-flex items-center px-6 py-3 bg-navy-950 text-white text-sm font-semibold rounded-full hover:bg-navy-800 transition-colors"
              >
                All Clubs
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
