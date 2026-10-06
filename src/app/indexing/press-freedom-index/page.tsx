import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Press Freedom Index",
  description:
    "The LENS Press Freedom Index — tracking independent journalism and press freedom advocacy in Bangladesh.",
};

// Concept/methodology/advocacy page. Copy is limited to verified
// repository statements (focus area + mission). No scores, rankings,
// methodology details, or index editions are invented here.
const advocacyAreas = [
  {
    title: "Independent Journalism",
    description: "Tracking the conditions independent journalists work under across Bangladesh.",
  },
  {
    title: "Press Freedom Advocacy",
    description: "Evidence-led advocacy for a freer, safer press.",
  },
  {
    title: "Legal Support",
    description: "Defending press freedom through advocacy and legal support for media professionals.",
  },
];

export default function PressFreedomIndexPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Indexing"
          title="Press Freedom Index"
          description="Tracking independent journalism and press freedom advocacy in Bangladesh — and defending it through advocacy and legal support."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "Indexing", href: "/indexing" },
            { label: "Press Freedom Index" },
          ]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">What It Covers</h2>
            <p className="text-sm text-slate-500 mb-8">
              The dimensions of press freedom LENS monitors and advocates for.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-16">
              {advocacyAreas.map((area) => (
                <div
                  key={area.title}
                  className="p-6 rounded-2xl border border-slate-100 bg-slate-50"
                >
                  <h3 className="text-base font-bold text-slate-900 mb-2">{area.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{area.description}</p>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-3xl bg-navy-950 text-center">
              <h2 className="text-xl font-bold text-white mb-3">Bangladesh Edition</h2>
              <p className="text-sm text-slate-300/80 leading-relaxed max-w-2xl mx-auto mb-6">
                Country-level findings are published through BPFI — the
                Bangladesh Press Freedom Index report series.
              </p>
              <Link
                href="/indexing/bpfi"
                className="inline-flex items-center px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-colors"
              >
                View BPFI
              </Link>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/theme/research"
                className="inline-flex items-center px-6 py-3 border border-slate-200 text-slate-700 text-sm font-semibold rounded-full hover:border-teal-500 hover:text-teal-600 transition-colors"
              >
                Related Research
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
