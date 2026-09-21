"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BarChart3,
  Megaphone,
  FileText,
  Database,
  Shield,
  Users,
  Lock,
  ArrowRight,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const focusAreaKeys = [
  { key: "research_insights", icon: BarChart3, glowColor: "rgba(59, 130, 246, 0.12)", accentColor: "#3b82f6" },
  { key: "media_literacy", icon: Users, glowColor: "rgba(16, 185, 129, 0.12)", accentColor: "#10b981" },
  { key: "strategic_comm", icon: Megaphone, glowColor: "rgba(20, 184, 166, 0.12)", accentColor: "#14b8a6" },
  { key: "policy_advocacy", icon: FileText, glowColor: "rgba(245, 158, 11, 0.12)", accentColor: "#f59e0b" },
  { key: "media_indexing", icon: Database, glowColor: "rgba(16, 185, 129, 0.12)", accentColor: "#10b981" },
  { key: "press_freedom", icon: Shield, glowColor: "rgba(59, 130, 246, 0.12)", accentColor: "#3b82f6" },
  { key: "journalist_protection", icon: Users, glowColor: "rgba(20, 184, 166, 0.12)", accentColor: "#14b8a6" },
  { key: "cybersecurity", icon: Lock, glowColor: "rgba(245, 158, 11, 0.12)", accentColor: "#f59e0b" },
];

function FocusCard({ area, t }: { area: typeof focusAreaKeys[0]; t: (key: string) => string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const isExpanded = useRef(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const tiltX = ((y - 50) / 50) * -6;
    const tiltY = ((x - 50) / 50) * 6;

    gsap.to(card, {
      rotateX: tiltX,
      rotateY: tiltY,
      transformPerspective: 800,
      duration: 0.3,
      ease: "power2.out",
    });

    gsap.to(glow, {
      opacity: 1,
      background: `radial-gradient(circle at ${x}% ${y}%, ${area.glowColor} 0%, transparent 55%)`,
      duration: 0.3,
    });
  }, [area.glowColor]);

  const handleMouseEnter = useCallback(() => {
    const card = cardRef.current;
    const detail = detailRef.current;
    if (!card) return;

    gsap.to(card, {
      scale: 1.02,
      boxShadow: `0 20px 60px -12px ${area.glowColor}`,
      duration: 0.4,
      ease: "power2.out",
    });

    if (detail) {
      gsap.to(detail, {
        height: "auto",
        opacity: 1,
        marginTop: 12,
        duration: 0.4,
        ease: "power2.out",
      });
    }
    isExpanded.current = true;
  }, [area.glowColor]);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    const detail = detailRef.current;

    if (card) {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        boxShadow: "0 0 0 0 transparent",
        duration: 0.5,
        ease: "power2.out",
      });
    }

    if (glow) {
      gsap.to(glow, { opacity: 0, duration: 0.3 });
    }

    if (detail) {
      gsap.to(detail, {
        height: 0,
        opacity: 0,
        marginTop: 0,
        duration: 0.3,
        ease: "power2.in",
      });
    }
    isExpanded.current = false;
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-colors duration-300 cursor-pointer overflow-hidden"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        ref={glowRef}
        className="absolute inset-0 opacity-0 pointer-events-none rounded-2xl z-0"
      />

      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${area.accentColor}, transparent)` }}
      />

      <div className="relative z-10 p-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-slate-100 flex items-center justify-center mb-4 transition-colors duration-300">
          <area.icon
            className="w-6 h-6 transition-all duration-500 group-hover:scale-110"
            style={{ color: area.accentColor }}
            strokeWidth={1.5}
          />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-slate-950 transition-colors">
          {t(`focus.${area.key}.title`)}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-3">
          {t(`focus.${area.key}.description`)}
        </p>

        <div
          ref={detailRef}
          className="overflow-hidden"
          style={{ height: 0, opacity: 0, marginTop: 0 }}
        >
          <p className="text-xs text-slate-400 leading-relaxed">
            {t(`focus.${area.key}.detail`)}
          </p>
        </div>

        <span className="text-sm font-semibold text-teal-600 group-hover:text-teal-500 transition-colors inline-flex items-center gap-1">
          {t("focus.learn_more")}
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </div>
  );
}

export default function FocusAreas() {
  const sectionRef = useRef<HTMLElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".focus-label",
        { opacity: 0, y: 15, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );

      gsap.fromTo(
        ".focus-title",
        { opacity: 0, y: 25, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );

      gsap.fromTo(
        ".focus-desc",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
        }
      );

      gsap.fromTo(
        ".focus-link",
        { opacity: 0, x: -10 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 60%" },
        }
      );

      const cards = gsap.utils.toArray<HTMLElement>(".focus-card-wrap");
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 60, rotateX: -15, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%" },
            delay: i * 0.06,
          }
        );
      });

      gsap.fromTo(
        ".focus-grid-line",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: ".focus-grid", start: "top 80%" },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-white relative overflow-hidden" id="about">
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #0891b2 1px, transparent 0)`,
        backgroundSize: "40px 40px"
      }} />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-teal-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-[340px_1fr] gap-12 lg:gap-16">
          <div>
            <span className="focus-label text-xs font-semibold tracking-[0.2em] uppercase text-teal-600 mb-3 block opacity-0">
              {t("focus.section_label")}
            </span>
            <h2 className="focus-title text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-5 opacity-0">
              {t("focus.section_title")}
            </h2>
            <p className="focus-desc text-slate-500 leading-relaxed mb-6 opacity-0">
              {t("focus.section_description")}
            </p>
            <a
              href="/about"
              className="focus-link inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-500 transition-colors group opacity-0"
            >
              {t("focus.about_lens")}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>

          <div className="focus-grid grid sm:grid-cols-2 gap-5 relative">
            <div className="focus-grid-line absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/10 to-transparent -translate-y-1/2 origin-left pointer-events-none hidden lg:block" />

            {focusAreaKeys.map((area) => (
              <div key={area.key} className="focus-card-wrap" style={{ perspective: "800px" }}>
                <FocusCard area={area} t={t} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
