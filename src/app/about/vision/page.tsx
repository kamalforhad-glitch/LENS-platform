import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Our Vision",
  description:
    "The LENS vision for Bangladesh's narrative ecosystem, alongside our verified mission and values.",
};

// NOTE: No approved vision statement exists in the repository (verified
// during the Phase B evidence review). The panel below is an explicitly
// marked editorial placeholder — it must be replaced with approved
// organizational copy, never presented as an official statement.
export default function VisionPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="About LENS"
          title="Our Vision"
          description="Where LENS is headed — and the mission and values that guide us there."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Vision" },
          ]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 lg:p-10 text-center"
              aria-label="Vision statement placeholder"
            >
              <span className="inline-block text-[11px] font-bold tracking-[0.2em] uppercase text-gold-600 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 mb-5">
                Editorial placeholder
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Vision statement forthcoming</h2>
              <p className="text-slate-500 leading-relaxed max-w-2xl mx-auto">
                The official LENS vision statement will be published here once
                approved. What follows below is our verified mission — the
                work we do every day toward that future.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              LENS exists at the intersection of research, capacity building,
              communication and policy. We work to build a more informed, inclusive
              and resilient public sphere in Bangladesh through rigorous evidence
              and strategic engagement.
            </p>
            <p className="text-slate-600 leading-relaxed mb-10">
              Our team of researchers, media professionals and policy analysts
              collaborate to produce high-quality research, train journalists
              and youth, advocate for press freedom, and engage with policymakers
              on critical issues affecting Bangladesh&apos;s information ecosystem.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex items-center px-6 py-3 bg-navy-950 text-white text-sm font-semibold rounded-full hover:bg-navy-800 transition-colors"
              >
                About LENS
              </Link>
              <Link
                href="/about/team"
                className="inline-flex items-center px-6 py-3 border border-slate-200 text-slate-700 text-sm font-semibold rounded-full hover:border-teal-500 hover:text-teal-600 transition-colors"
              >
                Meet the Team
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
