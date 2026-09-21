import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Training programs, workshops, and capacity building initiatives by LENS for media literacy, digital rights, and narrative research in Bangladesh.",
};

const programs = [
  {
    title: "Media Literacy Academy",
    category: "Education",
    duration: "12 weeks",
    description:
      "Comprehensive media literacy program equipping journalists and civil society with critical skills to analyze and counter misinformation.",
  },
  {
    title: "Digital Rights Fellowship",
    category: "Fellowship",
    duration: "6 months",
    description:
      "Intensive fellowship for early-career researchers focusing on digital rights, cybersecurity, and internet governance in South Asia.",
  },
  {
    title: "Narrative Analysis Workshop",
    category: "Workshop",
    duration: "5 days",
    description:
      "Hands-on training in narrative mapping, framing analysis, and strategic communication for policy advocates.",
  },
  {
    title: "Youth Media Champions",
    category: "Youth Program",
    duration: "8 weeks",
    description:
      "Empowering young Bangladeshis to become responsible media consumers and creators through peer-led workshops.",
  },
  {
    title: "Journalist Safety Training",
    category: "Safety",
    duration: "3 days",
    description:
      "Practical safety protocols and digital security training for journalists operating in high-risk environments.",
  },
  {
    title: "Policy Communication Lab",
    category: "Policy",
    duration: "4 weeks",
    description:
      "Bridging the gap between research and policy through effective communication strategies for researchers and advocates.",
  },
];

export default function ProgramsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-navy-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
              Programs
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Training & Capacity Building
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
              Equipping journalists, researchers, and civil society with the
              skills to navigate Bangladesh&apos;s evolving narrative landscape.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <article
                  key={program.title}
                  className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                      {program.category}
                    </span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] text-slate-400">
                      {program.duration}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                    {program.title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">
                    {program.description}
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
