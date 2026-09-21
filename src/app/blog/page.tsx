import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "LENS blog - insights, analysis, and commentary on Bangladesh's media landscape, digital rights, narrative ecosystems, and press freedom.",
};

const blogPosts = [
  {
    title: "Understanding Media Narratives in the Age of Social Media",
    excerpt: "How social media platforms are reshaping the way narratives form and spread in Bangladesh.",
    date: "September 15, 2025",
    readTime: "5 min read",
    category: "Analysis",
    author: "LENS Research Team",
  },
  {
    title: "The State of Press Freedom in Bangladesh: 2025 Review",
    excerpt: "A comprehensive look at press freedom indicators and challenges facing independent journalism.",
    date: "September 10, 2025",
    readTime: "8 min read",
    category: "Research",
    author: "LENS Editorial",
  },
  {
    title: "Digital Literacy: Building Resilience Against Misinformation",
    excerpt: "Practical approaches to building digital literacy skills among youth and educators.",
    date: "September 5, 2025",
    readTime: "4 min read",
    category: "Education",
    author: "LENS Programs",
  },
  {
    title: "Policy Brief: Strengthening Digital Rights Frameworks",
    excerpt: "Recommendations for policymakers on protecting digital rights in Bangladesh.",
    date: "August 28, 2025",
    readTime: "6 min read",
    category: "Policy",
    author: "LENS Policy Team",
  },
  {
    title: "Youth Voices: How Young Bangladeshis Consume News",
    excerpt: "Findings from our national survey on youth media consumption habits and trust.",
    date: "August 20, 2025",
    readTime: "7 min read",
    category: "Research",
    author: "LENS Youth Division",
  },
  {
    title: "The Role of Community Media in Rural Bangladesh",
    excerpt: "Exploring how community-based media initiatives are bridging information gaps.",
    date: "August 15, 2025",
    readTime: "5 min read",
    category: "Analysis",
    author: "LENS Field Team",
  },
];

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <section className="py-20 bg-navy-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
              Blog
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Insights & Analysis
            </h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
              Research insights, expert commentary, and analysis on Bangladesh&apos;s
              media landscape and narrative ecosystems.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <article
                  key={post.title}
                  className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                      {post.category}
                    </span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] text-slate-400">{post.readTime}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{post.author}</span>
                    <span>{post.date}</span>
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
