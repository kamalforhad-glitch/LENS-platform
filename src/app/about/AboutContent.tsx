"use client";

import { useEffect, useRef } from "react";
import { OrganizationSchema } from "@/components/SchemaOrg";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AboutContent() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text reveal
      gsap.fromTo(
        ".about-hero-label",
        { opacity: 0, y: 20, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out", delay: 0.2 }
      );
      gsap.fromTo(
        ".about-hero-title",
        { opacity: 0, y: 30, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out", delay: 0.4 }
      );
      gsap.fromTo(
        ".about-hero-desc",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.6 }
      );

      // Mission section
      gsap.fromTo(
        ".about-mission-title",
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".about-mission", start: "top 70%" } }
      );
      gsap.fromTo(
        ".about-mission-text",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: "power2.out", scrollTrigger: { trigger: ".about-mission", start: "top 65%" } }
      );

      // Values stagger
      const valueCards = gsap.utils.toArray<HTMLElement>(".about-value-card");
      valueCards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40, rotateX: -10, scale: 0.95 },
          { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 85%" }, delay: i * 0.08 }
        );
      });

      // Team section
      gsap.fromTo(
        ".about-team-title",
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".about-team", start: "top 70%" } }
      );
      gsap.fromTo(
        ".about-team-desc",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", scrollTrigger: { trigger: ".about-team", start: "top 65%" } }
      );

      // Background orb parallax
      gsap.fromTo(
        ".about-bg-orb",
        { y: 60, opacity: 0 },
        { y: -60, opacity: 0.06, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 2 } }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const values = [
    { title: "Evidence-Based", desc: "All our work is grounded in rigorous research and data analysis." },
    { title: "Independence", desc: "We maintain editorial and research independence from all stakeholders." },
    { title: "Transparency", desc: "Our methodology, funding and findings are openly shared." },
    { title: "Impact-Driven", desc: "We measure success by real-world change in Bangladesh's narrative landscape." },
  ];

  const timeline = [
    { year: "2024", title: "LENS Founded", desc: "Established as a research-driven think tank in Dhaka, Bangladesh." },
    { year: "2024", title: "First Research Report", desc: "Published inaugural media literacy research report." },
    { year: "2025", title: "Media Index Launch", desc: "Launched the Bangladesh Media Index project." },
    { year: "2025", title: "AI Research Assistant", desc: "Deployed AI-powered research assistant for public use." },
  ];

  return (
    <div ref={sectionRef}>
      <OrganizationSchema />

      {/* Hero */}
      <section className="relative py-24 bg-navy-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />
        <div className="about-bg-orb absolute top-0 right-0 w-[400px] h-[400px] bg-teal-400 rounded-full blur-3xl opacity-0 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="about-hero-label text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block opacity-0">
            About LENS
          </span>
          <h1 className="about-hero-title text-4xl lg:text-5xl font-bold text-white mb-6 opacity-0">
            Lighthouse for Evolving Narrative Systems
          </h1>
          <p className="about-hero-desc text-lg text-slate-300/80 leading-relaxed opacity-0">
            A research-driven think tank working to strengthen Bangladesh&apos;s
            narrative ecosystem through evidence, media literacy, strategic
            communication and policy engagement.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="about-mission py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="about-mission-title text-3xl font-bold text-slate-900 mb-6 opacity-0">Our Mission</h2>
          <p className="about-mission-text text-slate-600 leading-relaxed mb-6 opacity-0">
            LENS exists at the intersection of research, capacity building,
            communication and policy. We work to build a more informed, inclusive
            and resilient public sphere in Bangladesh through rigorous evidence
            and strategic engagement.
          </p>
          <p className="about-mission-text text-slate-600 leading-relaxed opacity-0">
            Our team of researchers, media professionals and policy analysts
            collaborate to produce high-quality research, train journalists
            and youth, advocate for press freedom, and engage with policymakers
            on critical issues affecting Bangladesh&apos;s information ecosystem.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">Our Journey</h2>
          <div className="space-y-8 relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-teal-400/30 to-transparent" />
            {timeline.map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="shrink-0 w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-teal-500/20 z-10">
                  {item.year.slice(2)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-10">Our Values</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {values.map((v) => (
              <div key={v.title} className="about-value-card p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 opacity-0" style={{ perspective: "600px" }}>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="about-team py-20 bg-navy-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="about-team-title text-3xl font-bold text-white mb-6 opacity-0">Our Team</h2>
          <p className="about-team-desc text-slate-300/70 leading-relaxed mb-8 max-w-2xl mx-auto opacity-0">
            LENS brings together researchers, journalists, policy analysts and
            media professionals with deep expertise in Bangladesh&apos;s
            information ecosystem.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-colors shadow-lg shadow-teal-500/25"
          >
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
}
