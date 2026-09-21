import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Partnerships",
  description:
    "LENS partnerships with universities, media organizations, civil society, and international institutions to strengthen Bangladesh's narrative ecosystem.",
};

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

export default function PartnershipsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-navy-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
              Partnerships
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Our Partners
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
              LENS collaborates with universities, media organizations, civil
              society groups, and international institutions to amplify impact.
            </p>
          </div>
        </section>

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
      <Footer />
    </>
  );
}
