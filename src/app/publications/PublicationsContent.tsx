"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const publications = [
  {
    type: "POLICY BRIEF",
    title: "Media Literacy for a Resilient Democracy",
    description: "Recommendations for a safer and more informed digital public sphere.",
    date: "April 2025",
    slug: "media-literacy-resilient-democracy",
  },
  {
    type: "WORKING PAPER",
    title: "Youth, Narratives and Civic Engagement",
    description: "Insights from a national study on young people's media consumption and trust.",
    date: "March 2025",
    slug: "youth-narratives-civic-engagement",
  },
  {
    type: "RESEARCH REPORT",
    title: "Media Index Bangladesh 2025",
    description: "Trends, risks and emerging narratives in the local media landscape.",
    date: "February 2025",
    slug: "media-index-bangladesh-2025",
  },
  {
    type: "POLICY BRIEF",
    title: "Cybersecurity Landscape in South Asia",
    description: "An assessment of digital threats and protection frameworks.",
    date: "January 2025",
    slug: "cybersecurity-landscape-south-asia",
  },
];

export default function PublicationsContent() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".pub-hero-label", { opacity: 0, y: 20, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out", delay: 0.2 });
      gsap.fromTo(".pub-hero-title", { opacity: 0, y: 30, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out", delay: 0.4 });
      gsap.fromTo(".pub-hero-desc", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.6 });

      const cards = gsap.utils.toArray<HTMLElement>(".pub-card");
      cards.forEach((card, i) => {
        gsap.fromTo(card, { opacity: 0, y: 40, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 85%" }, delay: i * 0.1 });
      });

      gsap.fromTo(".pub-bg-orb", { y: 40, opacity: 0 }, { y: -40, opacity: 0.05, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 2 } });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef}>
      <section className="relative py-20 bg-navy-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(212,168,67,0.06)_0%,transparent_40%)]" />
        <div className="pub-bg-orb absolute top-0 right-1/4 w-[400px] h-[400px] bg-gold-500 rounded-full blur-3xl opacity-0 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="pub-hero-label text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block opacity-0">
            Publications
          </span>
          <h1 className="pub-hero-title text-4xl lg:text-5xl font-bold text-white mb-6 opacity-0">
            Our Publications
          </h1>
          <p className="pub-hero-desc text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto opacity-0">
            Policy briefs, working papers, research reports and analysis from
            the LENS research team.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-6">
            {publications.map((pub) => (
              <a
                key={pub.title}
                href={`/publications/${pub.slug}`}
                className="pub-card group p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer opacity-0"
              >
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">
                  {pub.type}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1 mb-2 group-hover:text-teal-600 transition-colors">
                  {pub.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-3">
                  {pub.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{pub.date}</span>
                  <span className="text-xs font-medium text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read More
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
