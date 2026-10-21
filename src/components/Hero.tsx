"use client";

import { useEffect, useRef, Suspense } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MagneticButton from "./MagneticButton";
import dynamic from "next/dynamic";
import { resolveCmsValue } from "@/lib/cms-content";

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asWordList(v: unknown): string[] {
  if (typeof v === "string") return v.trim() ? v.trim().split(/\s+/) : [];
  if (Array.isArray(v)) return v.filter((w): w is string => typeof w === "string" && w.trim() !== "");
  return [];
}

gsap.registerPlugin(ScrollTrigger);

const GlobeNetwork = dynamic(() => import("./GlobeNetwork"), { ssr: false, loading: () => <div className="w-full h-full" /> });
const MediaIntelligenceMap = dynamic(() => import("./MediaIntelligenceMap"), { ssr: false });

// ============================================================
// Kinetic Typography — Word-level for Bangla, character-level for English
// ============================================================
function KineticText({
  text,
  className = "",
  delay = 0,
  stagger = 0.04,
  gradient = false,
  isBn = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  gradient?: boolean;
  isBn?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const items = ref.current.querySelectorAll(isBn ? ".word" : ".char");
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        items,
        { opacity: 0, y: isBn ? 15 : 20, filter: isBn ? "blur(4px)" : "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: isBn ? 0.5 : 0.6,
          stagger,
          ease: "power3.out",
          delay,
        }
      );
    });
    return () => mm.revert();
  }, [delay, stagger, isBn]);

  // Bangla: word-level animation
  if (isBn) {
    return (
      <span ref={ref} className={`inline-block ${className}`}>
        {text.split(" ").map((word, i) => (
          <span
            key={i}
            className={`word inline-block mr-[0.3em] ${gradient ? "gradient-text" : ""}`}
          >
            {word}
          </span>
        ))}
      </span>
    );
  }

  // English: character-level animation
  return (
    <span ref={ref} className={`inline-block ${className}`} style={{ perspective: "600px" }}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className={`char inline-block ${gradient ? "gradient-text" : ""}`}
          style={{ transformOrigin: "bottom", whiteSpace: char === " " ? "pre" : undefined }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

// ============================================================
// Hero Component
// ============================================================
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

function HeroContent({ cmsData }: { cmsData?: CmsSectionData }) {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
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
  const taglineBetterText = asString(resolveCmsValue(isBn, cEn, cBn, ["taglineBetter", "tagline_better"])) || t("hero.tagline_better");
  const taglineStrongerText = asString(resolveCmsValue(isBn, cEn, cBn, ["taglineStronger", "tagline_stronger"])) || t("hero.tagline_stronger");
  const announcementText = asString(resolveCmsValue(isBn, cEn, cBn, ["announcementText"]));
  const announcementLink = asString(resolveCmsValue(false, cEn, cBn, ["announcementLink"]));
  const scrollText = asString(resolveCmsValue(isBn, cEn, cBn, ["scrollText"])) || t("hero.scroll");

  // Media & Background Settings
  const backgroundImage = asString(cEn.backgroundImage || cEn.heroBgImage || sSettings.backgroundImage);
  const backgroundImageMobile = asString(cEn.backgroundImageMobile || sSettings.backgroundImageMobile);
  const backgroundVideo = asString(cEn.backgroundVideo || cEn.heroBgVideo || sSettings.backgroundVideo);
  const backgroundVideoMobile = asString(cEn.backgroundVideoMobile || sSettings.backgroundVideoMobile);
  const posterImage = asString(cEn.posterImage || sSettings.posterImage || backgroundImage);
  const foregroundImage = asString(cEn.foregroundImage || sSettings.foregroundImage);
  const imageAlt = asString(cEn.imageAlt || cEn.alt || "Hero visual background");
  const videoAlt = asString(cEn.videoAlt || "Hero background video");
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
  const showGlobe = sSettings.showBackgroundGlobe !== false && cEn.showBackgroundGlobe !== false;
  const showMap = sSettings.showIntelligenceMap !== false && cEn.showIntelligenceMap !== false;

  const headlineFromArray = asWordList(resolveCmsValue(isBn, cEn, cBn, ["headlineWords"]));
  const headlineFromString = asString(resolveCmsValue(isBn, cEn, cBn, ["headline"]));
  const headlineWords: string[] = headlineFromArray.length > 0
    ? headlineFromArray
    : headlineFromString.trim()
      ? headlineFromString.trim().split(/\s+/)
      : ((t("hero.headline_words", { returnObjects: true }) as string[]) || []);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Badge entrance
      gsap.fromTo(
        ".hero-badge",
        { opacity: 0, scale: 0.8, filter: "blur(4px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.8, ease: "back.out(1.7)", delay: 0.3 }
      );

      // Brand entity line (LENS — Lighthouse for Evolving Narrative Systems)
      gsap.fromTo(
        ".hero-brand",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.45 }
      );

      // Word-by-word kinetic headline
      const words = wordsRef.current.filter(Boolean);
      gsap.fromTo(
        words,
        { opacity: 0, y: isBn ? 25 : 40, filter: isBn ? "blur(5px)" : "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: isBn ? 0.7 : 0.9,
          stagger: isBn ? 0.1 : 0.07,
          ease: "power3.out",
          delay: 0.6,
        }
      );

      // Description
      gsap.fromTo(
        ".hero-desc",
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out", delay: 1.5 }
      );

      // CTA buttons
      gsap.fromTo(
        ".hero-cta",
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.15, ease: "back.out(1.4)", delay: 1.9 }
      );

      // Right tagline with vertical line
      gsap.fromTo(
        ".hero-tagline-line",
        { scaleY: 0 },
        { scaleY: 1, duration: 1.2, ease: "power3.out", delay: 2.0 }
      );
      gsap.fromTo(
        ".hero-tagline-text",
        { opacity: 0, x: 30, filter: "blur(4px)" },
        { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.2, ease: "power3.out", delay: 2.2 }
      );

      // Scroll indicator
      gsap.fromTo(
        ".scroll-indicator",
        { opacity: 0, y: 10 },
        { opacity: 0.7, y: 0, duration: 0.8, ease: "power2.out", delay: 2.8 }
      );

      // Scroll-driven parallax
      if (sectionRef.current) {
        gsap.to(".hero-content", {
          y: -100,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "60% top",
            scrub: 1.5,
          },
        });

        gsap.to(".hero-bg-gradient", {
          opacity: 0.8,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });

        gsap.to(".scroll-indicator", {
          opacity: 0,
          y: -20,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "5% top",
            end: "15% top",
            scrub: 1,
          },
        });
      }
    });

    return () => mm.revert();
  }, [isBn]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100vh] flex items-center overflow-x-clip"
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

      {/* Media Intelligence Map - subtle ambient overlay */}
      {showMap && (
        <div className="absolute left-0 top-0 w-[10%] h-full pointer-events-none opacity-20 hidden lg:block z-[2]">
          <Suspense fallback={null}>
            <MediaIntelligenceMap />
          </Suspense>
        </div>
      )}

      {/* Gradient fade-outs */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#030810] to-transparent pointer-events-none z-[3]" />
      <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-[#030810]/70 to-transparent pointer-events-none z-[3]" />

      {/* Responsive Content Grid */}
      <div className="hero-content relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-20 pb-10 sm:pt-24 sm:pb-16 lg:py-20 w-full z-10">
        <div className={`grid grid-cols-1 ${isCentered ? "lg:grid-cols-12 justify-center" : "lg:grid-cols-12"} gap-6 sm:gap-8 lg:gap-8 xl:gap-12 items-center`}>
          {/* Editorial Column */}
          <div className={`${isCentered ? "lg:col-span-12 max-w-4xl mx-auto text-center items-center" : "lg:col-span-7 xl:col-span-6"} min-w-0 z-10 flex flex-col justify-center`}>
            
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
            <div className={`hero-badge inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4 sm:mb-6 lg:mb-8 w-fit ${isCentered ? "mx-auto" : ""}`}>
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
              style={{ perspective: "600px" }}
            >
              {headlineWords.map((word: string, i: number) => {
                const isGradient = !isBn && (word === "Digital" || word === "World.");
                return (
                  <span
                    key={i}
                    ref={(el) => { wordsRef.current[i] = el; }}
                    className="inline-block mr-[0.3em]"
                    style={{ transformOrigin: "bottom" }}
                  >
                    {isGradient ? (
                      <KineticText text={word} gradient delay={0.6 + i * 0.07} isBn={isBn} />
                    ) : (
                      <KineticText text={word} delay={0.6 + i * 0.07} isBn={isBn} />
                    )}
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

          {/* Visual Column: Foreground illustration OR 3D Earth Globe */}
          {!isCentered && (
            <div className="lg:col-span-5 xl:col-span-6 min-w-0 relative flex flex-col items-center justify-center mt-4 lg:mt-0">
              {foregroundImage ? (
                <div className="relative w-full max-w-lg aspect-4/3 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={foregroundImage} alt={imageAlt} className="w-full h-full object-cover" />
                </div>
              ) : showGlobe ? (
                <div className="globe-container relative w-full aspect-square max-w-[240px] xs:max-w-[270px] sm:max-w-[340px] md:max-w-[420px] lg:max-w-[460px] xl:max-w-[560px] 2xl:max-w-[650px] mx-auto flex items-center justify-center pointer-events-auto">
                  <Suspense fallback={<div className="w-full h-full" />}>
                    <GlobeNetwork />
                  </Suspense>

                  {/* Tagline Card — glass backdrop */}
                  {(taglineBetterText || taglineStrongerText) && (
                    <div className="hidden xl:block absolute -bottom-2 -right-4 pointer-events-none" style={{ zIndex: 10 }}>
                      <div className="relative px-6 py-4 rounded-xl bg-navy-950/75 backdrop-blur-md border border-white/10 shadow-2xl shadow-teal-500/10 pointer-events-auto">
                        <div className="hero-tagline-line absolute -left-3 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-teal-400/50 to-transparent origin-top" />
                        <div>
                          {taglineBetterText && (
                            <p className={`hero-tagline-text font-bold text-white/90 leading-snug whitespace-pre-line ${
                              isBn ? "text-xl" : "text-2xl"
                            }`}>
                              {taglineBetterText}
                            </p>
                          )}
                          {taglineStrongerText && (
                            <p className={`hero-tagline-text font-bold text-teal-400 leading-snug mt-1 whitespace-pre-line ${
                              isBn ? "text-xl" : "text-2xl"
                            }`}>
                              {taglineStrongerText}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator — desktop only */}
      <div className="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 opacity-0 z-10">
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

export default function Hero({ cmsData }: { cmsData?: CmsSectionData }) {
  return <HeroContent cmsData={cmsData} />;
}
