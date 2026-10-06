import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";
import ContentListState from "@/components/ContentListState";
import { getPublicTeamMembers } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Team",
  description:
    "Researchers, journalists, policy analysts and media professionals behind LENS.",
};

export default async function TeamPage() {
  const { items: members, error } = await getPublicTeamMembers();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="About LENS"
          title="Our Team"
          description="LENS brings together researchers, journalists, policy analysts and media professionals with deep expertise in Bangladesh's information ecosystem."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Team" },
          ]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {members.length === 0 ? (
              <ContentListState
                variant={error ? "error" : "empty"}
                emptyMessage="Team profiles are being prepared and will appear here once published."
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <article
                    key={member.slug}
                    className="flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                  >
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600 mb-2">
                      {member.department}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h2>
                    <p className="text-sm font-medium text-slate-500 mb-3">{member.role}</p>
                    {member.bio && (
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-4">{member.bio}</p>
                    )}
                  </article>
                ))}
              </div>
            )}

            <div className="mt-12 text-center">
              <p className="text-sm text-slate-500 mb-4">
                Interested in working with us?
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/careers"
                  className="inline-flex items-center px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-colors"
                >
                  Open Positions
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 border border-slate-200 text-slate-700 text-sm font-semibold rounded-full hover:border-teal-500 hover:text-teal-600 transition-colors"
                >
                  Get in Touch
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
