"use client";

import { useEffect, useRef, Suspense } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MagneticButton from "./MagneticButton";
import dynamic from "next/dynamic";

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
  }, [delay, stagger, isBn]);

  // Bangla: word-level animation
  if (isBn) {
    return (
      <span ref={ref} className={`inline-block ${className}`}>
        {text.split(" ").map((word, i) => (
          <span
            key={i}
            className={`word inline-block opacity-0 mr-[0.3em] ${gradient ? "gradient-text" : ""}`}
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
          className={`char inline-block opacity-0 ${gradient ? "gradient-text" : ""}`}
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
function HeroContent() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  useEffect(() => {
    const ctx = gsap.context(() => {
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

    return () => ctx.revert();
  }, [isBn]);

  const headlineWords = t("hero.headline_words", { returnObjects: true }) as string[];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100vh] flex items-center overflow-x-clip"
      aria-label="Hero"
    >
      {/* Deep layered background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#030810] via-navy-950 to-[#061224]" />
      <div className="hero-bg-gradient absolute inset-0 bg-[radial-gradient(ellipse_at_15%_50%,rgba(8,145,178,0.1)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_45%,rgba(8,145,178,0.12)_0%,transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(212,168,67,0.05)_0%,transparent_35%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(8,145,178,0.03)_0%,transparent_30%)]" />

      {/* Media Intelligence Map - subtle left ambient overlay */}
      <div className="absolute left-0 top-0 w-[10%] h-full pointer-events-none opacity-20 hidden lg:block">
        <Suspense fallback={null}>
          <MediaIntelligenceMap />
        </Suspense>
      </div>

      {/* Gradient fade-outs */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#030810] to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-[#030810]/70 to-transparent pointer-events-none" />

      {/* Responsive Content Grid */}
      <div className="hero-content relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-20 pb-10 sm:pt-24 sm:pb-16 lg:py-20 w-full" style={{ zIndex: 5 }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-8 xl:gap-12 items-center">
          {/* LEFT COLUMN: Editorial Information */}
          <div className="lg:col-span-7 xl:col-span-6 min-w-0 z-10 flex flex-col justify-center">
            <div className="hero-badge inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-4 sm:mb-6 lg:mb-8 opacity-0 w-fit">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-teal-300 text-xs font-medium tracking-wide uppercase">
                {t("hero.badge")}
              </span>
            </div>

            <p className="hero-brand text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-teal-200/70 mb-3 sm:mb-4 lg:mb-6 opacity-0">
              LENS — Lighthouse for Evolving Narrative Systems
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
                    className="inline-block opacity-0 mr-[0.3em]"
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

            <p className={`hero-desc text-slate-300/80 max-w-xl mb-6 sm:mb-8 lg:mb-10 leading-relaxed opacity-0 ${
              isBn ? "text-sm sm:text-base" : "text-sm sm:text-base md:text-lg"
            }`}>
              {t("hero.description")}
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4">
              <MagneticButton
                href="/research"
                className="hero-cta px-5 sm:px-7 py-2.5 sm:py-3.5 bg-teal-500 hover:bg-teal-400 text-white text-sm sm:text-base font-semibold rounded-full transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-400/40 opacity-0"
                data-cursor="Explore"
              >
                {t("hero.cta_research")}
                <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </MagneticButton>
              <MagneticButton
                href="/programs"
                className="hero-cta px-5 sm:px-7 py-2.5 sm:py-3.5 border border-white/20 text-white text-sm sm:text-base font-semibold rounded-full hover:border-teal-400 hover:text-teal-300 transition-all opacity-0"
              >
                {t("hero.cta_network")}
              </MagneticButton>
            </div>
          </div>

          {/* RIGHT COLUMN: Realistic Cinematic Rotating 3D Earth Globe */}
          <div className="lg:col-span-5 xl:col-span-6 min-w-0 relative flex flex-col items-center justify-center mt-4 lg:mt-0">
            <div className="globe-container relative w-full aspect-square max-w-[240px] xs:max-w-[270px] sm:max-w-[340px] md:max-w-[420px] lg:max-w-[460px] xl:max-w-[560px] 2xl:max-w-[650px] mx-auto flex items-center justify-center pointer-events-auto">
              <Suspense fallback={<div className="w-full h-full" />}>
                <GlobeNetwork />
              </Suspense>

              {/* Tagline Card — glass backdrop, floating elegantly in lower right on larger viewports */}
              <div className="hidden xl:block absolute -bottom-2 -right-4 pointer-events-none" style={{ zIndex: 10 }}>
                <div className="relative px-6 py-4 rounded-xl bg-navy-950/75 backdrop-blur-md border border-white/10 shadow-2xl shadow-teal-500/10 pointer-events-auto">
                  <div className="hero-tagline-line absolute -left-3 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-teal-400/50 to-transparent origin-top" />
                  <div>
                    <p className={`hero-tagline-text font-bold text-white/90 leading-snug opacity-0 ${
                      isBn ? "text-xl" : "text-2xl"
                    }`}>
                      {t("hero.tagline_better")}
                    </p>
                    <p className={`hero-tagline-text font-bold text-teal-400 leading-snug mt-1 opacity-0 ${
                      isBn ? "text-xl" : "text-2xl"
                    }`}>
                      {t("hero.tagline_stronger")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator — desktop only */}
      <div className="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 opacity-0">
        <span className="text-slate-400 text-[10px] tracking-[0.3em] uppercase font-medium">
          {t("hero.scroll")}
        </span>
        <div className="w-5 h-8 border-2 border-white/20 rounded-full flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-teal-400 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}

export default function Hero() {
  return <HeroContent />;
}
