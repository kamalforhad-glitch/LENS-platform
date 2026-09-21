"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const researchAreas = [
  {
    title: "Narratives in the Digital Age",
    description: "Mapping trends, risks and opportunities in Bangladesh's information ecosystem.",
    category: "Research Report",
    date: "May 2025",
    slug: "narratives-digital-age",
  },
  {
    title: "Media Index Bangladesh 2025",
    description: "Trends, risks and emerging narratives in the local media landscape.",
    category: "Research Report",
    date: "February 2025",
    slug: "media-index-bangladesh-2025",
  },
  {
    title: "Youth, Narratives and Civic Engagement",
    description: "Insights from a national study on young people's media consumption and trust.",
    category: "Working Paper",
    date: "March 2025",
    slug: "youth-narratives-civic-engagement",
  },
  {
    title: "Media Literacy for a Resilient Democracy",
    description: "Recommendations for a safer and more informed digital public sphere.",
    category: "Policy Brief",
    date: "April 2025",
    slug: "media-literacy-resilient-democracy",
  },
];

export default function ResearchContent() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".research-hero-label", { opacity: 0, y: 20, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out", delay: 0.2 });
      gsap.fromTo(".research-hero-title", { opacity: 0, y: 30, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out", delay: 0.4 });
      gsap.fromTo(".research-hero-desc", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.6 });

      const cards = gsap.utils.toArray<HTMLElement>(".research-card");
      cards.forEach((card, i) => {
        gsap.fromTo(card, { opacity: 0, y: 40, rotateX: -10 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 85%" }, delay: i * 0.1 });
      });

      gsap.fromTo(".research-bg-orb", { y: 60, opacity: 0 }, { y: -60, opacity: 0.06, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 2 } });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef}>
      <section className="relative py-20 bg-navy-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />
        <div className="research-bg-orb absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-teal-400 rounded-full blur-3xl opacity-0 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="research-hero-label text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block opacity-0">
            Research & Insights
          </span>
          <h1 className="research-hero-title text-4xl lg:text-5xl font-bold text-white mb-6 opacity-0">
            Evidence-Based Analysis
          </h1>
          <p className="research-hero-desc text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto opacity-0">
            Our research covers media literacy, press freedom, narrative
            analysis, policy advocacy and cybersecurity - providing actionable
            insights for Bangladesh&apos;s information ecosystem.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6">
            {researchAreas.map((area) => (
              <a
                key={area.title}
                href={`/research/${area.slug}`}
                className="research-card group p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer opacity-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                      {area.category}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1 mb-2 group-hover:text-teal-600 transition-colors">
                      {area.title}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                      {area.description}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{area.date}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
