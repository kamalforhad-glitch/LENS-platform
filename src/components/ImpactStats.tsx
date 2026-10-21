"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FileText, Users, Globe, Handshake } from "lucide-react";
import { resolveCmsValue } from "@/lib/cms-content";

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

gsap.registerPlugin(ScrollTrigger);

const statConfig = [
  { key: "stat_research_briefs", icon: FileText, value: 12, suffix: "+", color: "#22d3ee" },
  { key: "stat_trained", icon: Users, value: 500, suffix: "+", color: "#0891b2" },
  { key: "stat_digital_reach", icon: Globe, value: 50000, suffix: "+", color: "#d4a843" },
  { key: "stat_partners", icon: Handshake, value: 25, suffix: "+", color: "#14b8a6" },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const render = (n: number) => {
      if (numRef.current) numRef.current.textContent = n.toLocaleString();
    };
    render(0);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            render(value);
            return;
          }
          const duration = 2200;
          const startTime = Date.now();

          // Direct DOM text update (same easing/duration/output) instead of
          // setState per frame — avoids ~130 re-renders per counter.
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            render(Math.floor(eased * value));
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
      <span ref={numRef}>0</span>
      {suffix}
    </div>
  );
}

export interface CmsSectionData {
  id?: string;
  type?: string;
  title?: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  sortOrder?: number;
  visible?: boolean;
  settings?: string | Record<string, unknown>;
  content?: string | Record<string, unknown>;
  contentBn?: string | Record<string, unknown>;
}

function parseJsonSafe(val: unknown): Record<string, any> {
  if (!val) return {};
  if (typeof val === "object") return val as Record<string, any>;
  try { return JSON.parse(val as string); } catch { return {}; }
}

function StatItem({
  stat,
  index,
  t,
  overrideLabel,
  overrideValue,
}: {
  stat: typeof statConfig[0];
  index: number;
  t: (key: string) => string;
  overrideLabel?: string;
  overrideValue?: number;
}) {
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

      <AnimatedCounter value={overrideValue !== undefined ? overrideValue : stat.value} suffix={stat.suffix} />
      <div className="text-sm text-slate-300/60 whitespace-pre-line leading-snug">
        {overrideLabel || t(`impact.${stat.key}`)}
      </div>
    </div>
  );
}

export default function ImpactStats({ cmsData }: { cmsData?: CmsSectionData }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const cEn = parseJsonSafe(cmsData?.content);
  const cBn = parseJsonSafe(cmsData?.contentBn);

  // Key-compatibility resolution (see lib/cms-content.ts): the Landing
  // Page Editor writes `sectionLabel`/`sectionTitle`/`sectionDescription`
  // and a `stats[]` array; older saved sections used the legacy keys
  // `badge`, `title`, `description` and flat `stat_*_value` /
  // `stat_*_label` overrides. Editor keys take precedence; legacy keys
  // keep previously saved content rendering; section row then i18n.
  const sectionLabel = asString(resolveCmsValue(isBn, cEn, cBn, ["sectionLabel", "badge"])) || t("impact.section_label");

  const rowTitle = asString(isBn ? (cmsData?.titleBn || cmsData?.title) : cmsData?.title);
  const sectionTitle =
    asString(resolveCmsValue(isBn, cEn, cBn, ["sectionTitle", "title"])) || rowTitle || t("impact.section_title");

  const rowDesc = asString(isBn ? (cmsData?.descriptionBn || cmsData?.description) : cmsData?.description);
  const sectionDesc =
    asString(resolveCmsValue(isBn, cEn, cBn, ["sectionDescription", "description"])) || rowDesc || t("impact.section_description");

  // Editor's stats[] overrides, keyed by stat key (EN payload carries
  // value/suffix/label-EN; the BN payload carries label-BN).
  const statsByKey = new Map<string, { value?: number; suffix?: string; labelEn?: string; labelBn?: string }>();
  const ingestStats = (list: unknown, labelField: "labelEn" | "labelBn") => {
    if (!Array.isArray(list)) return;
    list.forEach((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
      const st = entry as Record<string, unknown>;
      const k = asString(st.key);
      if (!k) return;
      const agg = statsByKey.get(k) ?? {};
      if (typeof st.value === "number" && Number.isFinite(st.value)) agg.value = st.value;
      if (asString(st.suffix)) agg.suffix = asString(st.suffix);
      if (asString(st.label)) agg[labelField] = asString(st.label);
      statsByKey.set(k, agg);
    });
  };
  ingestStats(cEn.stats, "labelEn");
  ingestStats(cBn.stats, "labelBn");

  // Resolve one stat's override triple: editor stats[] first, then the
  // legacy flat keys (`stat_<key>_value` / `stat_<key>` /
  // `stat_<key>_label`), then the hardcoded config/i18n.
  const statOverride = (key: string): { value?: number; suffix?: string; label?: string } => {
    const legacyValue = cEn[key + "_value"];
    const legacyLabel = isBn ? (cBn[key] || cBn[key + "_label"]) : (cEn[key] || cEn[key + "_label"]);
    const ov = statsByKey.get(key) ?? undefined;
    return {
      value:
        ov?.value !== undefined ? ov.value : typeof legacyValue === "number" && Number.isFinite(legacyValue) ? legacyValue : undefined,
      suffix: ov?.suffix,
      label: (isBn ? ov?.labelBn : ov?.labelEn) || (asString(legacyLabel) || undefined),
    };
  };

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
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

    return () => mm.revert();
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
            <span className="stats-label text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-3 block">
              {sectionLabel}
            </span>
            <h2 className="stats-title text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
              {sectionTitle}
            </h2>
            <p className="stats-desc text-slate-300/70 leading-relaxed">
              {sectionDesc}
            </p>
          </div>

          <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-8">
            {statConfig.map((stat, i) => {
              const ov = statOverride(stat.key);
              return (
                <StatItem
                  key={stat.key}
                  stat={{ ...stat, suffix: ov.suffix ?? stat.suffix }}
                  index={i}
                  t={t}
                  overrideValue={ov.value}
                  overrideLabel={ov.label}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
