import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join LENS - explore career opportunities in research, policy analysis, media literacy, and digital rights in Bangladesh.",
};

const openings = [
  {
    title: "Research Analyst",
    department: "Research",
    location: "Dhaka, Bangladesh",
    type: "Full-time",
    description: "Conduct research on Bangladesh's information ecosystem, media narratives, and policy issues.",
  },
  {
    title: "Media Literacy Trainer",
    department: "Programs",
    location: "Dhaka, Bangladesh",
    type: "Full-time",
    description: "Design and deliver media literacy training programs for journalists, youth, and civil society.",
  },
  {
    title: "Policy Research Associate",
    department: "Policy",
    location: "Dhaka, Bangladesh",
    type: "Full-time",
    description: "Support policy research and advocacy on digital rights, press freedom, and information governance.",
  },
  {
    title: "Communications Officer",
    department: "Communications",
    location: "Dhaka, Bangladesh",
    type: "Full-time",
    description: "Manage LENS communications, social media, and public outreach initiatives.",
  },
];

export default function CareersPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-navy-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
              Careers
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Join Our Team
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
              LENS is growing. We&apos;re looking for passionate researchers,
              analysts, and communicators to join our mission of strengthening
              Bangladesh&apos;s narrative ecosystem.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {openings.map((job) => (
                <article
                  key={job.title}
                  className="group flex flex-col sm:flex-row gap-4 sm:items-center justify-between p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                        {job.department}
                      </span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400">{job.type}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-teal-600 transition-colors">
                      {job.title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed mb-2">
                      {job.description}
                    </p>
                    <span className="text-xs text-slate-400">{job.location}</span>
                  </div>
                  <div className="shrink-0">
                    <span className="inline-flex items-center px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-colors">
                      Apply
                    </span>
                  </div>
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
