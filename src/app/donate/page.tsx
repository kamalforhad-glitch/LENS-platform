import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support LENS — a research-driven think tank strengthening Bangladesh's narrative ecosystem. Online donation processing is not yet available.",
};

// Informational page ONLY: no payment processing, no provider
// integration, no donor records, and — per the approved Phase B brief —
// no payment instructions, bank details, bKash numbers, or donation
// claims. Supporters are directed to contact the team. This page stays
// ready for a future provider decision.
const workAreas = [
  {
    title: "Research & Insights",
    description: "Evidence-based analysis, trend monitoring and narrative research.",
  },
  {
    title: "Media Literacy & Training",
    description: "Skills for journalists, youth and civil society.",
  },
  {
    title: "Policy Advocacy",
    description: "Evidence-based reforms and multi-stakeholder dialogue.",
  },
];

export default function DonatePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Support"
          title="Support LENS"
          description="LENS is a research-driven think tank working to strengthen Bangladesh's narrative ecosystem through evidence, media literacy, strategic communication and policy engagement."
          breadcrumbItems={[{ label: "Home", href: "/" }, { label: "Donate" }]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">What Your Support Sustains</h2>
            <p className="text-sm text-slate-500 mb-8">
              The established areas of LENS work.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-14">
              {workAreas.map((area) => (
                <div key={area.title} className="p-6 rounded-2xl border border-slate-100 bg-slate-50">
                  <h3 className="text-base font-bold text-slate-900 mb-2">{area.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{area.description}</p>
                </div>
              ))}
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 text-center mb-14">
              <h2 className="text-xl font-bold text-slate-900 mb-3">Our Transparency Commitment</h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-2xl mx-auto">
                Our methodology, funding and findings are openly shared. We
                maintain editorial and research independence from all stakeholders.
              </p>
            </div>

            <div
              className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center"
              aria-label="Donation processing notice"
            >
              <span className="inline-block text-[11px] font-bold tracking-[0.2em] uppercase text-gold-600 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 mb-4">
                Coming soon
              </span>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Online donations are not yet available</h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto mb-6">
                We are preparing a secure way to receive online donations. In
                the meantime, please contact our team directly to discuss
                supporting our work.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-colors"
                >
                  Contact Us
                </Link>
                <Link
                  href="/about/partnerships"
                  className="inline-flex items-center px-6 py-3 border border-slate-200 text-slate-700 text-sm font-semibold rounded-full hover:border-teal-500 hover:text-teal-600 transition-colors"
                >
                  Partnerships
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
