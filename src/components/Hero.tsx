"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import MagneticButton from "./MagneticButton";

// Decorative canvas telemetry is below the hero copy and not needed for the
// first paint. It keeps its fixed-ratio container so deferring it causes no CLS.
const LensWorldTelemetry = dynamic(() => import("./LensWorldTelemetry"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-950/40" aria-hidden="true" />,
});
import { resolveCmsValue } from "@/lib/cms-content";

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asWordList(v: unknown): string[] {
  if (typeof v === "string") return v.trim() ? v.trim().split(/\s+/) : [];
  if (Array.isArray(v)) return v.filter((w): w is string => typeof w === "string" && w.trim() !== "");
  return [];
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

export default function Hero({ cmsData }: { cmsData?: CmsSectionData }) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const cEn = parseJsonSafe(cmsData?.content);
  const cBn = parseJsonSafe(cmsData?.contentBn);
  const sSettings = parseJsonSafe(cmsData?.settings);

  // Key-compatibility resolution (see lib/cms-content.ts)
  const badgeText = asString(resolveCmsValue(isBn, cEn, cBn, ["badge"])) || t("hero.badge");
  const brandText = asString(resolveCmsValue(isBn, cEn, cBn, ["brandLine", "brand"])) || "LENS — Lighthouse for Evolving Narrative Systems";
  const descText = asString(resolveCmsValue(isBn, cEn, cBn, ["description"])) || t("hero.description");
  const ctaResearchText = asString(resolveCmsValue(isBn, cEn, cBn, ["primaryCtaText", "cta_research"])) || t("hero.cta_research");
  const ctaNetworkText = asString(resolveCmsValue(isBn, cEn, cBn, ["secondaryCtaText", "cta_network"])) || t("hero.cta_network");
  const ctaResearchLink = asString(resolveCmsValue(false, cEn, cBn, ["primaryCtaLink"])) || "/research";
  const ctaNetworkLink = asString(resolveCmsValue(false, cEn, cBn, ["secondaryCtaLink"])) || "/contact";
  const announcementText = asString(resolveCmsValue(isBn, cEn, cBn, ["announcementText"]));
  const announcementLink = asString(resolveCmsValue(false, cEn, cBn, ["announcementLink"]));
  const scrollText = asString(resolveCmsValue(isBn, cEn, cBn, ["scrollText"])) || t("hero.scroll");
  const scrollAriaLabel = asString(resolveCmsValue(isBn, cEn, cBn, ["scrollAriaLabel"])) || scrollText || "Scroll to explore";

  const rawGradientWords = resolveCmsValue(isBn, cEn, cBn, ["gradientWords"]);
  const customGradientList = asWordList(rawGradientWords);
  const gradientWordSet = new Set(
    customGradientList.length > 0
      ? customGradientList.map((w) => w.toLowerCase().replace(/^[^\w\u0980-\u09FF]+|[^\w\u0980-\u09FF]+$/g, ""))
      : !isBn ? ["digital", "world"] : []
  );

  // Media & Background Settings
  const backgroundImage = asString(cEn.backgroundImage || cEn.heroBgImage || sSettings.backgroundImage);
  const backgroundImageMobile = asString(cEn.backgroundImageMobile || sSettings.backgroundImageMobile);
  const backgroundVideo = asString(cEn.backgroundVideo || cEn.heroBgVideo || sSettings.backgroundVideo);
  const backgroundVideoMobile = asString(cEn.backgroundVideoMobile || sSettings.backgroundVideoMobile);
  const posterImage = asString(cEn.posterImage || sSettings.posterImage || backgroundImage);
  const foregroundImage = asString(cEn.foregroundImage || sSettings.foregroundImage);
  const imageAlt = asString(resolveCmsValue(isBn, cEn, cBn, ["imageAlt", "alt"])) || "Hero visual background";
  const videoAlt = asString(resolveCmsValue(isBn, cEn, cBn, ["videoAlt"])) || "Hero background video";
  const overlayColor = asString(cEn.overlayColor || sSettings.overlayColor || "#030810");
  const overlayOpacity = typeof cEn.overlayOpacity === "number"
    ? cEn.overlayOpacity
    : typeof sSettings.overlayOpacity === "number"
      ? sSettings.overlayOpacity
      : (backgroundImage || backgroundVideo ? 0.75 : 1);
  const showGradients = cEn.overlayGradient !== false && sSettings.overlayGradient !== false;
  const layoutVariant = asString(cEn.layoutVariant || sSettings.layoutVariant || "split");
  const textAlignment = asString(cEn.textAlignment || sSettings.textAlignment || "left");
  const isCentered = layoutVariant === "centered" || textAlignment === "center";
  // Legacy CMS flag (`showBackgroundGlobe`) now toggles the world
  // telemetry interface that replaced the 3D globe / bento board.
  const showInsightBoard = sSettings.showBackgroundGlobe !== false && cEn.showBackgroundGlobe !== false;

  const headlineFromArray = asWordList(resolveCmsValue(isBn, cEn, cBn, ["headlineWords"]));
  const headlineFromString = asString(resolveCmsValue(isBn, cEn, cBn, ["headline"]));
  const fallbackTranslation = t("hero.headline_words", { returnObjects: true });
  const headlineWords: string[] = headlineFromArray.length > 0
    ? headlineFromArray
    : headlineFromString.trim()
      ? headlineFromString.trim().split(/\s+/)
      : asWordList(fallbackTranslation);

  // Left column enters with a single gentle opacity fade at FCP —
  // zero translateY / position changes so nothing can climb or overlap.
  const [fadeIn, setFadeIn] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    if (mq?.matches) {
      setReduceMotion(true);
      setFadeIn(true);
      return;
    }
    const raf = requestAnimationFrame(() => setFadeIn(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const fadeStyle = {
    opacity: fadeIn ? 1 : 0,
    ...(reduceMotion || fadeIn ? {} : { transition: "opacity 900ms cubic-bezier(0.22, 1, 0.36, 1)" }),
  };

  return (
    <section
      className="relative min-h-[100vh] overflow-x-clip"
      aria-label="Hero"
    >
      {/* Background Media: Video (WebM/MP4) with Poster and Reduced Motion Fallback */}
      {backgroundVideo && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={posterImage || backgroundImage}
            aria-label={videoAlt}
            aria-hidden="true"
            className="w-full h-full object-cover motion-reduce:hidden"
          >
            {backgroundVideoMobile && (
              <source src={backgroundVideoMobile} media="(max-width: 640px)" type={backgroundVideoMobile.endsWith(".webm") ? "video/webm" : "video/mp4"} />
            )}
            <source src={backgroundVideo} type={backgroundVideo.endsWith(".webm") ? "video/webm" : "video/mp4"} />
            {posterImage && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={posterImage} alt={imageAlt} className="w-full h-full object-cover" />
            )}
          </video>
          {/* Static poster fallback shown when prefers-reduced-motion is active */}
          {(posterImage || backgroundImage) && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={posterImage || backgroundImage}
              alt={imageAlt}
              className="w-full h-full object-cover hidden motion-reduce:block"
            />
          )}
        </div>
      )}

      {/* Background Media: Static Image (WebP/PNG/JPEG) with responsive mobile support */}
      {!backgroundVideo && backgroundImage && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {backgroundImageMobile ? (
            <picture className="w-full h-full">
              <source media="(max-width: 640px)" srcSet={backgroundImageMobile} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backgroundImage} alt={imageAlt} className="w-full h-full object-cover" />
            </picture>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={backgroundImage} alt={imageAlt} className="w-full h-full object-cover" />
          )}
        </div>
      )}

      {/* Configurable Contrast Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
      />

      {/* Deep layered gradient backgrounds (preserves original LENS atmosphere) */}
      {showGradients && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#030810]/90 via-navy-950/80 to-[#061224]/90 pointer-events-none z-[2]" />
          <div className="hero-bg-gradient absolute inset-0 bg-[radial-gradient(ellipse_at_15%_50%,rgba(8,145,178,0.12)_0%,transparent_50%)] pointer-events-none z-[2]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_45%,rgba(8,145,178,0.14)_0%,transparent_40%)] pointer-events-none z-[2]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(212,168,67,0.06)_0%,transparent_35%)] pointer-events-none z-[2]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(8,145,178,0.04)_0%,transparent_30%)] pointer-events-none z-[2]" />
        </>
      )}

      {/* Gradient fade-outs */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#030810] to-transparent pointer-events-none z-[3]" />
      <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-[#030810]/70 to-transparent pointer-events-none z-[3]" />

      {/* Responsive Content Grid — vertically centered, zero CLS layout */}
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[calc(100vh-80px)] py-12 lg:py-20">
          {/* Editorial Column — statically anchored on the Y axis; fade-in only */}
          <div
            className={`${isCentered ? "lg:col-span-12 max-w-4xl mx-auto text-center items-center" : "col-span-1 lg:col-span-6 xl:col-span-5 lg:pr-8 min-w-0 z-10 flex flex-col justify-center"}`}
            style={fadeStyle}
          >
            {/* Optional Announcement Banner Badge */}
            {announcementText && (
              <div className={`mb-3 sm:mb-4 ${isCentered ? "flex justify-center" : ""}`}>
                {announcementLink ? (
                  <a
                    href={announcementLink}
                    className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 hover:border-gold-400 text-gold-300 text-xs font-medium tracking-wide transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-ping" />
                    <span>{announcementText}</span>
                    <svg className="w-3.5 h-3.5 ml-0.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-300 text-xs font-medium tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                    {announcementText}
                  </span>
                )}
              </div>
            )}

            {/* Hero Main Badge */}
            <div className="hero-badge inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4 sm:mb-6 lg:mb-8 w-fit">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-teal-300 text-xs font-medium tracking-wide uppercase">
                {badgeText}
              </span>
            </div>

            <p className="hero-brand text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-teal-200/70 mb-3 sm:mb-4 lg:mb-6">
              {brandText}
            </p>

            <h1
              className={`font-bold text-white leading-[1.15] mb-5 sm:mb-6 lg:mb-8 ${
                isBn
                  ? "text-3xl sm:text-4xl lg:text-[clamp(2.2rem,3.8vw,3.2rem)] leading-[1.25]"
                  : "text-2xl sm:text-4xl md:text-5xl lg:text-[clamp(2.5rem,4vw,3.5rem)] leading-[1.1]"
              }`}
            >
              {headlineWords.map((word: string, i: number) => {
                const cleanWord = word.toLowerCase().replace(/^[^\w\u0980-\u09FF]+|[^\w\u0980-\u09FF]+$/g, "");
                const isGradient = gradientWordSet.has(cleanWord) || gradientWordSet.has(word.toLowerCase());
                return (
                  <span key={`${word}-${i}`} className="inline-block mr-[0.3em]">
                    {isGradient ? <span className="gradient-text">{word}</span> : word}
                  </span>
                );
              })}
            </h1>

            <p className={`hero-desc text-slate-300/80 max-w-xl mb-6 sm:mb-8 lg:mb-10 leading-relaxed ${
              isBn ? "text-sm sm:text-base" : "text-sm sm:text-base md:text-lg"
            } ${isCentered ? "mx-auto" : ""}`}>
              {descText}
            </p>

            {/* Call to Action Buttons */}
            <div className={`flex flex-wrap gap-3 sm:gap-4 ${isCentered ? "justify-center" : ""}`}>
              {ctaResearchText && (
                <MagneticButton
                  href={ctaResearchLink}
                  className="hero-cta px-5 sm:px-7 py-2.5 sm:py-3.5 bg-teal-500 hover:bg-teal-400 text-white text-sm sm:text-base font-semibold rounded-full transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-400/40"
                  data-cursor="Explore"
                >
                  {ctaResearchText}
                  <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </MagneticButton>
              )}
              {ctaNetworkText && (
                <MagneticButton
                  href={ctaNetworkLink}
                  className="hero-cta px-5 sm:px-7 py-2.5 sm:py-3.5 border border-white/20 text-white text-sm sm:text-base font-semibold rounded-full hover:border-teal-400 hover:text-teal-300 transition-all"
                >
                  {ctaNetworkText}
                </MagneticButton>
              )}
            </div>
          </div>

          {/* Visual Column: foreground photograph OR editorial insight board */}
          {!isCentered && showInsightBoard && (
            <div className="col-span-1 lg:col-span-6 xl:col-span-7 flex justify-center items-center w-full">
              <div className="relative w-full max-w-2xl xl:max-w-3xl aspect-[4/3] max-h-[520px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40 backdrop-blur-sm shadow-2xl">
                {foregroundImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={foregroundImage} alt={imageAlt} className="w-full h-full object-cover" />
                ) : (
                  <LensWorldTelemetry />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator — desktop only */}
      <div
        role="button"
        tabIndex={0}
        aria-label={scrollAriaLabel}
        className="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 opacity-70 z-10 cursor-pointer"
        onClick={() => {
          window.scrollTo({ top: window.innerHeight * 0.9, behavior: "smooth" });
        }}
      >
        <span className="text-slate-400 text-[10px] tracking-[0.3em] uppercase font-medium">
          {scrollText}
        </span>
        <div className="w-5 h-8 border-2 border-white/20 rounded-full flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-teal-400 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
