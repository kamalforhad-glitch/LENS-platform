import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import { CLUBS } from "@/lib/clubs";

export const metadata: Metadata = {
  title: "Clubs",
  description:
    "LENS clubs. Club information will be published here as it becomes available.",
};

// Hub lists the five approved clubs by name only — no descriptions,
// imagery, or claims are stated. Card CTAs are plain navigation links
// (keyboard-accessible, visible focus via the global focus ring).
export default function ClubsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          title="Clubs"
          breadcrumbItems={[{ label: "Home", href: "/" }, { label: "Clubs" }]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {CLUBS.map((club) => (
                <Link
                  key={club.slug}
                  href={`/clubs/${club.slug}`}
                  className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                >
                  <h2 className="text-lg font-bold text-slate-900 mb-4 group-hover:text-teal-600 transition-colors flex-1">
                    {club.name}
                  </h2>
                  <span className="text-sm font-semibold text-teal-600">View Club →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
