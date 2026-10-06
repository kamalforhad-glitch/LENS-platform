import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import ContentListState from "@/components/ContentListState";
import { CLUBS, getClub } from "@/lib/clubs";

export function generateStaticParams() {
  return CLUBS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const club = getClub(slug);
  if (!club) return { title: "Club Not Found" };
  return {
    title: club.name,
    description: `Information about ${club.name} will be published here.`,
  };
}

// Editorial placeholder page: no verified club content exists yet, so
// nothing is stated beyond the approved name. No descriptions, people,
// events, forms, images, or contact details are included.
export default async function ClubDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
