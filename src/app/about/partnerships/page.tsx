import type { Metadata } from "next";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Partnerships",
  description:
    "LENS partnerships with universities, media organizations, civil society, and international institutions to strengthen Bangladesh's narrative ecosystem.",
};

// Content moved verbatim from the legacy /partnerships route so the
// canonical location becomes /about/partnerships. The legacy route file
// is preserved until the 308 redirect is verified (Phase B step 6).
const partners = [
  {
    name: "University of Dhaka",
    type: "Academic",
    description: "Collaborative research on media studies and communication.",
  },
  {
    name: "Bangladesh Journalists Safety Institute",
    type: "Media",
    description: "Joint programs on journalist safety and digital security.",
  },
  {
    name: "Transparency International Bangladesh",
    type: "Civil Society",
    description: "Policy research on transparency and accountability in media.",
  },
  {
    name: "UNESCO Bangladesh",
    type: "International",
    description: "Media literacy and press freedom initiatives.",
  },
  {
    name: "Internet Society Bangladesh",
    type: "Technology",
    description: "Digital rights and internet governance research.",
  },
  {
    name: "Centre for Policy Dialogue",
    type: "Think Tank",
    description: "Joint policy advocacy on information ecosystem reforms.",
  },
];

const partnershipTypes = [
  { type: "Academic", count: 5 },
  { type: "Media", count: 8 },
  { type: "Civil Society", count: 12 },
  { type: "International", count: 6 },
  { type: "Technology", count: 4 },
];

export default function AboutPartnershipsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="About LENS"
          title="Our Partners"
          description="LENS collaborates with universities, media organizations, civil society groups, and international institutions to amplify impact."
          breadcrumbItems={[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Partnerships" },
          ]}
        />

        {/* Partnership Stats */}
        <section className="py-12 bg-slate-50 border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-8">
              {partnershipTypes.map((pt) => (
                <div key={pt.type} className="text-center">
                  <div className="text-2xl font-bold text-teal-600">{pt.count}+</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">{pt.type}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners.map((partner) => (
                <article
                  key={partner.name}
                  className="group p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                    {partner.type}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1 mb-2 group-hover:text-teal-600 transition-colors">
                    {partner.name}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {partner.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
