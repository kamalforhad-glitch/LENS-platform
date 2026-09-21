"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FileText, Users, Globe, Handshake } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const statConfig = [
  { key: "stat_research_briefs", icon: FileText, value: 12, suffix: "+", color: "#22d3ee" },
  { key: "stat_trained", icon: Users, value: 500, suffix: "+", color: "#0891b2" },
  { key: "stat_digital_reach", icon: Globe, value: 50000, suffix: "+", color: "#d4a843" },
  { key: "stat_partners", icon: Handshake, value: 25, suffix: "+", color: "#14b8a6" },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setCount(value);
            return;
          }
          const duration = 2200;
          const startTime = Date.now();

          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-4xl lg:text-5xl font-bold text-white mb-2 tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

function StatItem({ stat, index, t }: { stat: typeof statConfig[0]; index: number; t: (key: string) => string }) {
  const ref = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    const icon = iconRef.current;
    if (!el || !icon) return;

    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    gsap.to(icon, {
      background: `radial-gradient(circle at ${x}% ${y}%, ${stat.color}15 0%, transparent 50%)`,
      duration: 0.3,
    });
  }, [stat.color]);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className="stat-item text-center px-4 group relative"
    >
      {index < statConfig.length - 1 && (
        <div className="absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-teal-400/20 to-transparent hidden lg:block" />
      )}

      <div className="relative inline-block mb-4">
        <div
          ref={iconRef}
          className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto relative z-10 transition-colors duration-300"
        >
          <stat.icon className="w-7 h-7" style={{ color: stat.color }} />
        </div>
        <svg
          className="absolute inset-0 w-16 h-16 mx-auto -translate-x-[1px] -translate-y-[1px]"
          viewBox="0 0 64 64"
        >
          <circle
            cx="32" cy="32" r="30" fill="none" stroke={stat.color}
            strokeWidth="1" strokeDasharray="188" strokeDashoffset="188"
            className="stat-pulse-ring" style={{ opacity: 0.3 }}
          />
        </svg>
      </div>

      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
      <div className="text-sm text-slate-300/60 whitespace-pre-line leading-snug">
        {t(`impact.${stat.key}`)}
      </div>
    </div>
  );
}

export default function ImpactStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".stats-bg-orb-1",
        { y: 50, opacity: 0 },
        {
          y: -50, opacity: 0.08, ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 2 },
        }
      );

      gsap.fromTo(
        ".stats-bg-orb-2",
        { y: -30, opacity: 0 },
        {
          y: 60, opacity: 0.06, ease: "none",
          scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 2.5 },
        }
      );

      gsap.fromTo(
        ".stats-label",
        { opacity: 0, y: 15, filter: "blur(4px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
        }
      );

      gsap.fromTo(
        ".stats-title",
        { opacity: 0, y: 25, filter: "blur(6px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
        }
      );

      gsap.fromTo(
        ".stats-desc",
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, delay: 0.2,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 60%" },
        }
      );

      const items = gsap.utils.toArray<HTMLElement>(".stat-item");
      items.forEach((item, i) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 50, rotateX: -10, scale: 0.9 },
          {
            opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: ".stats-grid", start: "top 80%" },
            delay: i * 0.1,
          }
        );
      });

      gsap.fromTo(
        ".stat-pulse-ring",
        { strokeDashoffset: 188 },
        {
          strokeDashoffset: 0, duration: 2, stagger: 0.3,
          ease: "power2.out",
          scrollTrigger: { trigger: ".stats-grid", start: "top 75%" },
        }
      );

      gsap.fromTo(
        ".stats-line",
        { scaleX: 0 },
        {
          scaleX: 1, duration: 1.5, stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 60%" },
        }
      );

      gsap.fromTo(
        ".stats-network",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 0.04, scale: 1, duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-navy-900 relative overflow-hidden">
      <div className="stats-bg-orb-1 absolute top-0 left-1/4 w-96 h-96 bg-teal-400 rounded-full blur-3xl opacity-0" />
      <div className="stats-bg-orb-2 absolute bottom-0 right-1/4 w-96 h-96 bg-gold-500 rounded-full blur-3xl opacity-0" />

      <svg className="stats-network absolute inset-0 w-full h-full opacity-0 pointer-events-none" viewBox="0 0 800 400">
        <defs>
          <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        {[...Array(20)].map((_, i) => (
          <g key={i}>
            <circle
              cx={40 + (i % 5) * 180 + Math.sin(i) * 30}
              cy={60 + Math.floor(i / 5) * 90 + Math.cos(i) * 20}
              r="20" fill="url(#node-glow)"
            />
            <circle
              cx={40 + (i % 5) * 180 + Math.sin(i) * 30}
              cy={60 + Math.floor(i / 5) * 90 + Math.cos(i) * 20}
              r="2" fill="#22d3ee" opacity="0.5"
            />
          </g>
        ))}
        {[...Array(15)].map((_, i) => (
          <line
            key={i}
            x1={40 + (i % 5) * 180 + Math.sin(i) * 30}
            y1={60 + Math.floor(i / 5) * 90 + Math.cos(i) * 20}
            x2={40 + ((i + 1) % 5) * 180 + Math.sin(i + 1) * 30}
            y2={60 + Math.floor((i + 1) / 5) * 90 + Math.cos(i + 1) * 20}
            stroke="#22d3ee" strokeWidth="0.5" opacity="0.3"
          />
        ))}
      </svg>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="stats-line absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/10 to-transparent origin-left" />
        <div className="stats-line absolute top-2/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/5 to-transparent origin-left" />
        <div className="stats-line absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/10 to-transparent origin-left" />
      </div>

      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise2)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-center">
          <div>
            <span className="stats-label text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-3 block opacity-0">
              {t("impact.section_label")}
            </span>
            <h2 className="stats-title text-3xl lg:text-4xl font-bold text-white leading-tight mb-4 opacity-0">
              {t("impact.section_title")}
            </h2>
            <p className="stats-desc text-slate-300/70 leading-relaxed opacity-0">
              {t("impact.section_description")}
            </p>
          </div>

          <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-8">
            {statConfig.map((stat, i) => (
              <StatItem key={stat.key} stat={stat} index={i} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
