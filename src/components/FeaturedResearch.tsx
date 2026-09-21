"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Download, ArrowRight, ExternalLink } from "lucide-react";
import MagneticButton from "./MagneticButton";
import { formatReadingTime } from "@/lib/i18n/format";

gsap.registerPlugin(ScrollTrigger);

interface PubItem {
  typeKey: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  date: string;
  readMinutes: number;
  color: string;
  accent: string;
}

function PublicationCard({ pub, t, locale }: { pub: PubItem; t: (key: string) => string; locale: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const card = cardRef.current;
    const image = imageRef.current;
    if (!card || !image) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(image, {
      x: (x - rect.width / 2) * 0.05,
      y: (y - rect.height / 2) * 0.05,
      duration: 0.3,
      ease: "power2.out",
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const image = imageRef.current;
    if (image) {
      gsap.to(image, { x: 0, y: 0, duration: 0.5, ease: "power2.out" });
    }
  }, []);

  const title = locale === "bn" ? pub.titleBn : pub.titleEn;
  const desc = locale === "bn" ? pub.descBn : pub.descEn;
  const readTime = formatReadingTime(pub.readMinutes, locale);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group flex gap-5 p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5"
    >
      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 shrink-0 overflow-hidden relative">
        <div
          ref={imageRef}
          className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-navy-800/5 group-hover:scale-110 transition-transform duration-500"
        />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(135deg, ${pub.accent}20 0%, transparent 60%)` }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold tracking-[0.15em] uppercase ${pub.color}`}>
            {t(`research.${pub.typeKey}`)}
          </span>
          {readTime && (
            <>
              <span className="text-[10px] text-slate-300">·</span>
              <span className="text-[10px] text-slate-400">{readTime}</span>
            </>
          )}
        </div>
        <h4 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-2 group-hover:text-teal-600 transition-colors">
          {title}
        </h4>
        <p className="text-xs text-slate-500 line-clamp-2 mb-2">
          {desc}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{pub.date}</span>
          <span className="text-xs font-medium text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 inline-flex items-center gap-1">
            {t("research.read_more")} <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedResearch() {
  const sectionRef = useRef<HTMLElement>(null);
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const publications: PubItem[] = [
    {
      typeKey: "type_policy_brief",
      titleEn: "Media Literacy for a Resilient Democracy",
      titleBn: "স্থিতিশীল গণতন্ত্রের জন্য গণমাধ্যম সচেতনতা",
      descEn: "Recommendations for a safer and more informed digital public sphere.",
      descBn: "একটি নিরাপদ এবং আরও অবহিত ডিজিটাল পাবলিক স্ফেরারের জন্য সুপারিশ।",
      date: "April 2025",
      readMinutes: 8,
      color: "text-teal-600",
      accent: "#0891b2",
    },
    {
      typeKey: "type_working_paper",
      titleEn: "Youth, Narratives and Civic Engagement",
      titleBn: "যুব, বর্ণনা এবং নাগরিক সম্পৃক্ততা",
      descEn: "Insights from a national study on young people's media consumption and trust.",
      descBn: "তরুণদের মিডিয়া খপ্পর এবং বিশ্বাস সম্পর্কে একটি জাতীয় গবেষণা থেকে অন্তর্দৃষ্টি।",
      date: "March 2025",
      readMinutes: 15,
      color: "text-blue-600",
      accent: "#3b82f6",
    },
    {
      typeKey: "type_report",
      titleEn: "Media Index Bangladesh 2025",
      titleBn: "মিডিয়া ইন্ডেক্স বাংলাদেশ ২০২৫",
      descEn: "Trends, risks and emerging narratives in the local media landscape.",
      descBn: "স্থানীয় মিডিয়া ল্যান্ডস্কেপে প্রবণতা, ঝুঁকি এবং উদীয়মান বর্ণনা।",
      date: "February 2025",
      readMinutes: 20,
      color: "text-emerald-600",
      accent: "#10b981",
    },
  ];

  const featuredTitle = locale === "bn" ? "ডিজিটাল যুগের বর্ণনা" : "Narratives in the Digital Age";
  const featuredDesc = locale === "bn"
    ? "বাংলাদেশের তথ্য বাস্তবতায় প্রবণতা, ঝুঁকি এবং সুযোগ ম্যাপিং।"
    : "Mapping trends, risks and opportunities in Bangladesh's information ecosystem.";
  const featuredTag1 = locale === "bn" ? "গবেষণা রিপোর্ট" : "Research Report";
  const featuredTag2 = locale === "bn" ? "মিডিয়া ও সমাজ" : "Media & Society";

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".featured-card",
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 1.2,
          ease: "power3.inOut",
          scrollTrigger: { trigger: ".featured-card", start: "top 70%" },
        }
      );

      gsap.fromTo(
        ".featured-tag",
        { opacity: 0, y: 10, filter: "blur(4px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, delay: 0.5,
          ease: "power2.out",
          scrollTrigger: { trigger: ".featured-card", start: "top 70%" },
        }
      );

      gsap.fromTo(
        ".featured-title",
        { opacity: 0, y: 20, filter: "blur(6px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, delay: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: ".featured-card", start: "top 70%" },
        }
      );

      gsap.fromTo(
        ".featured-desc",
        { opacity: 0, y: 15 },
        {
          opacity: 1, y: 0, duration: 0.6, delay: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: ".featured-card", start: "top 70%" },
        }
      );

      gsap.fromTo(
        ".featured-meta",
        { opacity: 0, y: 10 },
        {
          opacity: 1, y: 0, duration: 0.5, delay: 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: ".featured-card", start: "top 70%" },
        }
      );

      gsap.fromTo(
        ".pub-header",
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.6,
          ease: "power2.out",
          scrollTrigger: { trigger: ".pub-list", start: "top 80%" },
        }
      );

      const cards = gsap.utils.toArray<HTMLElement>(".pub-card-wrap");
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, x: 50, rotateY: -5 },
          {
            opacity: 1, x: 0, rotateY: 0, duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%" },
            delay: i * 0.12,
          }
        );
      });

      gsap.fromTo(
        ".research-bg-orb",
        { y: 40, opacity: 0 },
        {
          y: -40, opacity: 0.06, ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden" id="research">
      <div className="research-bg-orb absolute top-0 right-0 w-[500px] h-[500px] bg-teal-400 rounded-full blur-3xl opacity-0 pointer-events-none" />

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Featured Research */}
          <div className="featured-card relative rounded-3xl overflow-hidden bg-navy-900 p-8 lg:p-10 flex flex-col justify-between min-h-[420px]">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-gold-500/10" />
              <svg className="absolute inset-0 w-full h-full animate-rotate-slow" viewBox="0 0 400 400">
                <defs>
                  <pattern id="grid-research" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="400" height="400" fill="url(#grid-research)" />
              </svg>
            </div>

            <div className="absolute top-10 right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl animate-float" />
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-gold-500/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "1s" }} />

            <div className="relative z-10">
              <div className="featured-tag flex items-center gap-3 mb-4 opacity-0">
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400">
                  {t("research.featured_label")}
                </span>
                <span className="text-[10px] text-slate-400">·</span>
                <span className="text-[10px] text-slate-400">{formatReadingTime(12, locale)}</span>
              </div>
              <h3 className="featured-title text-2xl lg:text-3xl font-bold text-white leading-tight mb-4 opacity-0">
                {featuredTitle}
              </h3>
              <p className="featured-desc text-slate-300/80 mb-6 max-w-md opacity-0">
                {featuredDesc}
              </p>
              <div className="featured-meta flex flex-wrap gap-2 mb-6 opacity-0">
                <span className="px-3 py-1 text-xs font-medium bg-white/10 text-white/80 rounded-full border border-white/10 backdrop-blur-sm">
                  {featuredTag1}
                </span>
                <span className="px-3 py-1 text-xs font-medium bg-white/10 text-white/80 rounded-full border border-white/10 backdrop-blur-sm">
                  {featuredTag2}
                </span>
              </div>
            </div>

            <div className="featured-meta relative z-10 flex items-center justify-between opacity-0">
              <span className="text-sm text-slate-400">May 2025</span>
              <div className="flex gap-2">
                <MagneticButton className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-full border border-white/10 transition-all backdrop-blur-sm">
                  {t("research.pdf_download")}
                  <Download className="w-4 h-4 ml-2" />
                </MagneticButton>
                <MagneticButton className="px-4 py-2.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-sm font-medium rounded-full border border-teal-400/20 transition-all backdrop-blur-sm">
                  <ExternalLink className="w-4 h-4" />
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* Right: Publications List */}
          <div className="flex flex-col">
            <div className="pub-header flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">
                {t("research.latest_publications")}
              </h3>
              <a
                href="/publications"
                className="text-sm font-semibold text-teal-600 hover:text-teal-500 transition-colors inline-flex items-center gap-1 group"
              >
                {t("research.view_all")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="pub-list flex flex-col gap-4">
              {publications.map((pub) => (
                <div key={pub.titleEn} className="pub-card-wrap" style={{ perspective: "600px" }}>
                  <PublicationCard pub={pub} t={t} locale={locale} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
