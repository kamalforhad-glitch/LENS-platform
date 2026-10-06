import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Governance",
  description:
    "How LENS is governed — leadership and oversight structures guiding our research independence.",
};

// NOTE: No governance roster exists in the repository (no board/advisory
// data in any model, seed, or page). This page is an explicitly marked
// CMS-ready placeholder: no names, roles, or structures are stated.
export default function GovernancePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="About LENS"
          title="Governance"
          description="The leadership and oversight structures that protect our research independence."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Governance" },
          ]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 lg:p-10 text-center"
              aria-label="Governance content placeholder"
            >
              <span className="inline-block text-[11px] font-bold tracking-[0.2em] uppercase text-gold-600 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 mb-5">
                Editorial placeholder
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Governance information forthcoming</h2>
              <p className="text-slate-500 leading-relaxed max-w-2xl mx-auto mb-8">
                Details of the LENS board, advisors, and oversight structures
                will be published here once approved. Our operating principle
                in the meantime is stated in our values: we maintain editorial
                and research independence from all stakeholders, and our
                methodology, funding and findings are openly shared.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/about"
                  className="inline-flex items-center px-6 py-3 bg-navy-950 text-white text-sm font-semibold rounded-full hover:bg-navy-800 transition-colors"
                >
                  Our Values
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 border border-slate-200 text-slate-700 text-sm font-semibold rounded-full hover:border-teal-500 hover:text-teal-600 transition-colors"
                >
                  Contact Us
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
