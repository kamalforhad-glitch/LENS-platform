import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "LENS resources - research tools, datasets, media literacy guides, and educational materials for journalists, researchers, and civil society.",
};

const resources = [
  {
    category: "Research Tools",
    items: [
      { title: "Media Monitoring Methodology Guide", description: "Step-by-step guide to our media monitoring approach and methodology." },
      { title: "Narrative Analysis Framework", description: "Framework for analyzing narratives across media platforms." },
      { title: "Data Visualization Templates", description: "Templates for presenting research findings effectively." },
    ],
  },
  {
    category: "Educational Materials",
    items: [
      { title: "Media Literacy Curriculum", description: "Complete curriculum for teaching media literacy in schools and universities." },
      { title: "Digital Safety Handbook", description: "Practical guide for online safety and digital security." },
      { title: "Fact-Checking Guide", description: "Methodology for verifying information and identifying misinformation." },
    ],
  },
  {
    category: "Datasets",
    items: [
      { title: "Bangladesh Media Index Dataset", description: "Annual media landscape data and indicators." },
      { title: "Press Freedom Statistics", description: "Historical data on press freedom in Bangladesh." },
      { title: "Youth Media Consumption Survey", description: "National survey data on youth media habits." },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-navy-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
              Resources
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Research & Resources
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
              Access our research tools, datasets, educational materials, and
              methodological guides for media studies and policy analysis.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-12">
              {resources.map((category) => (
                <div key={category.category}>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">{category.category}</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.items.map((item) => (
                      <article
                        key={item.title}
                        className="group p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      >
                        <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {item.description}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
