import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "BPFI — Bangladesh Press Freedom Index",
  description:
    "BPFI, the Bangladesh Press Freedom Index report series — including the verified 2025 edition launch.",
};

// BPFI = Bangladesh Press Freedom Index (Bangladesh edition report
// series). ONLY the 2025 material below is verified repository content
// (legacy static event record: "BPFI 2025 Launch Event — Launch of the
// Bangladesh Press Freedom Index 2025 report", 10 September 2025,
// Dhaka Press Club, Launch). No scores, rankings, methodology, or
// additional editions are stated. Future editions render an explicitly
// marked placeholder, never invented reports.
export default function BpfiPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Indexing"
          title="BPFI — Bangladesh Press Freedom Index"
          description="The Bangladesh edition of press freedom indexing — country-level findings published as an annual report series."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Indexing", href: "/indexing" },
            { label: "BPFI" },
          ]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="inline-block text-[11px] font-bold tracking-[0.2em] uppercase text-teal-700 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 mb-5">
              Verified 2025 edition
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">BPFI 2025</h2>

            <article className="p-6 lg:p-8 rounded-3xl border border-slate-100 bg-slate-50 mb-10">
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                Launch event
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-2 mb-3">
                BPFI 2025 Launch Event
              </h3>
              <p className="text-slate-600 leading-relaxed mb-5">
                Launch of the Bangladesh Press Freedom Index 2025 report.
              </p>
              <dl className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Date</dt>
                  <dd className="text-slate-900 font-medium">10 September 2025</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Venue</dt>
                  <dd className="text-slate-900 font-medium">Dhaka Press Club</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500 uppercase tracking-wide text-xs mb-1">Format</dt>
                  <dd className="text-slate-900 font-medium">Report launch</dd>
                </div>
              </dl>
            </article>

            <div
              className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center"
              aria-label="Future editions placeholder"
            >
              <span className="inline-block text-[11px] font-bold tracking-[0.2em] uppercase text-gold-600 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 mb-4">
                Editorial placeholder
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Future editions</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
                Subsequent BPFI editions will be listed here once published.
                No additional editions are currently announced on this page.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap gap-3">
              <Link
                href="/indexing/press-freedom-index"
                className="inline-flex items-center px-6 py-3 bg-navy-950 text-white text-sm font-semibold rounded-full hover:bg-navy-800 transition-colors"
              >
                Press Freedom Index
              </Link>
              <Link
                href="/indexing"
                className="inline-flex items-center px-6 py-3 border border-slate-200 text-slate-700 text-sm font-semibold rounded-full hover:border-teal-500 hover:text-teal-600 transition-colors"
              >
                Indexing Hub
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
