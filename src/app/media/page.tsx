import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Media",
  description:
    "LENS media coverage, press mentions, interviews, and media resources for journalists covering Bangladesh's narrative ecosystem.",
};

const mediaItems = [
  {
    type: "Press Release",
    title: "LENS Launches Media Index Bangladesh 2025",
    date: "February 2025",
    description: "Comprehensive analysis of media landscape trends, risks, and emerging narratives in Bangladesh.",
    source: "LENS Press Office",
  },
  {
    type: "Interview",
    title: "Director Discusses Media Literacy at National Conference",
    date: "March 2025",
    description: "LENS leadership speaks on the importance of media literacy education in strengthening democratic discourse.",
    source: "The Daily Star",
  },
  {
    type: "Op-Ed",
    title: "The Future of Digital Rights in Bangladesh",
    date: "April 2025",
    description: "An opinion piece on the evolving landscape of digital rights and online freedoms in Bangladesh.",
    source: "LENS Research Team",
  },
  {
    type: "Report",
    title: "Annual Media Monitoring Report Released",
    date: "January 2025",
    description: "Annual findings from LENS continuous monitoring of media narratives across platforms.",
    source: "LENS",
  },
];

export default function MediaPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-navy-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
              Media
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Media & Press
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
              Press releases, interviews, op-eds, and media resources from LENS.
              Access our media kit and stay updated on our latest coverage.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6">
              {mediaItems.map((item) => (
                <article
                  key={item.title}
                  className="group flex gap-6 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-lg shadow-teal-500/20">
                    <span className="text-[10px] font-medium leading-none">
                      {item.date.split(" ")[0]?.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="text-xs font-medium leading-none mt-0.5">
                      {item.date.split(" ")[1]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                        {item.type}
                      </span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400">{item.source}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-teal-600 transition-colors">
                      {item.title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
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
