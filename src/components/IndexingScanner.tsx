// ============================================================
// IndexingScanner — Press Freedom Index live-radar hero section.
//
// Desktop: Balanced two-column layout with editorial content on the
// left and an interactive rotating torchlight radar on the right.
// Mobile / Tablet: Fluid stacked layout with responsive radar scaling.
//
// Radar Visualization:
// - Multiple thin concentric circular rings with subtle cyan/teal outlines
// - Dark atmospheric center with precision crosshairs and degree ticks
// - Rotating search beam with directional torchlight-style spotlight head
// - Soft translucent light cone fading smoothly into surrounding darkness
// - Phosphorescent information points illuminated as the beam sweeps over them
// - Central optics origin emitter and ambient ripple
// - Pure CSS keyframe animations running on GPU compositor thread
// - Pauses off-screen via IntersectionObserver; honors prefers-reduced-motion
// ============================================================
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { resolveCmsValue } from "@/lib/cms-content";
import { sanitizeUrl } from "@/lib/cms-validation";

export const INDEX_SCAN_EVENT = "lens:index-scan";

export function requestIndexScan() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INDEX_SCAN_EVENT));
  }
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// Round trig output so the serialized coordinates are deterministic across
// JS engines (prevents float-formatting differences in SVG attributes).
const roundCoord = (value: number) => Math.round(value * 1000) / 1000;

// 24 perimeter degree tick marks around the 360-degree circumference
const RADAR_TICKS = Array.from({ length: 24 }).map((_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  const isMajor = i % 6 === 0; // 0, 90, 180, 270 deg
  const isMedium = i % 2 === 0;
  const tickLen = isMajor ? 10 : isMedium ? 6 : 4;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x1: roundCoord(220 + 200 * cos),
    y1: roundCoord(220 + 200 * sin),
    x2: roundCoord(220 + (200 - tickLen) * cos),
    y2: roundCoord(220 + (200 - tickLen) * sin),
    isMajor,
  };
});

// Strategic information signal points distributed around the concentric rings.
// Implements Journalism Color Psychology:
// - CYAN (#00D9F5): Truth, transparency, fact-checking & investigative journalism
// - BLUE (#267BFF): Credibility, trust, journalistic integrity & verified information
// - YELLOW (#FFD43B): Yellow Journalism – sensational headlines, exaggeration, misinformation
// - RED (#FF304F): Breaking news, urgency, public attention & important events
// - WHITE (#FFFFFF): Objectivity, clarity, fairness & unbiased reporting
export interface RadarJournalismNode {
  id: number;
  angle: number;
  r: number;
  x: number;
  y: number;
  type: "cyan" | "blue" | "yellow" | "red" | "white";
  category: string;
  description: string;
  color: string;
}

const RADAR_NODES: RadarJournalismNode[] = [
  // CYAN (#00D9F5) — Truth & Investigation
  {
    id: 1,
    angle: 25,
    r: 158,
    x: 363.2,
    y: 286.8,
    type: "cyan",
    category: "TRUTH & INVESTIGATION",
    description: "Investigating facts, verifying information, and uncovering hidden realities.",
    color: "#00D9F5",
  },
  // BLUE (#267BFF) — Trust & Credibility
  {
    id: 2,
    angle: 60,
    r: 116,
    x: 278.0,
    y: 320.5,
    type: "blue",
    category: "TRUST & CREDIBILITY",
    description: "Reliable sources, journalistic integrity, and verified reporting.",
    color: "#267BFF",
  },
  // YELLOW (#FFD43B) — Yellow Journalism
  {
    id: 3,
    angle: 95,
    r: 200,
    x: 202.6,
    y: 419.2,
    type: "yellow",
    category: "YELLOW JOURNALISM",
    description: "Sensational headlines, exaggeration, manipulation, and misleading narratives.",
    color: "#FFD43B",
  },
  // RED (#FF304F) — Breaking Alert
  {
    id: 4,
    angle: 130,
    r: 158,
    x: 118.4,
    y: 341.0,
    type: "red",
    category: "BREAKING ALERT",
    description: "Urgent developments, important public events, and breaking news.",
    color: "#FF304F",
  },
  // WHITE (#FFFFFF) — Objectivity & Clarity
  {
    id: 5,
    angle: 165,
    r: 74,
    x: 148.5,
    y: 239.2,
    type: "white",
    category: "OBJECTIVITY & CLARITY",
    description: "Fair reporting, balanced perspectives, and unbiased presentation.",
    color: "#FFFFFF",
  },
  // CYAN (#00D9F5) — Truth & Investigation (Second quadrant)
  {
    id: 6,
    angle: 205,
    r: 116,
    x: 114.9,
    y: 171.0,
    type: "cyan",
    category: "TRUTH & INVESTIGATION",
    description: "Investigating facts, verifying information, and uncovering hidden realities.",
    color: "#00D9F5",
  },
  // BLUE (#267BFF) — Trust & Credibility
  {
    id: 7,
    angle: 240,
    r: 200,
    x: 120.0,
    y: 46.8,
    type: "blue",
    category: "TRUST & CREDIBILITY",
    description: "Reliable sources, journalistic integrity, and verified reporting.",
    color: "#267BFF",
  },
  // YELLOW (#FFD43B) — Yellow Journalism
  {
    id: 8,
    angle: 275,
    r: 158,
    x: 233.8,
    y: 62.6,
    type: "yellow",
    category: "YELLOW JOURNALISM",
    description: "Sensational headlines, exaggeration, manipulation, and misleading narratives.",
    color: "#FFD43B",
  },
  // RED (#FF304F) — Breaking Alert
  {
    id: 9,
    angle: 310,
    r: 116,
    x: 294.6,
    y: 131.1,
    type: "red",
    category: "BREAKING ALERT",
    description: "Urgent developments, important public events, and breaking news.",
    color: "#FF304F",
  },
  // WHITE (#FFFFFF) — Objectivity & Clarity
  {
    id: 10,
    angle: 345,
    r: 74,
    x: 291.5,
    y: 200.8,
    type: "white",
    category: "OBJECTIVITY & CLARITY",
    description: "Fair reporting, balanced perspectives, and unbiased presentation.",
    color: "#FFFFFF",
  },
];

export interface IndexingScannerCmsData {
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

function parseJsonSafe(val: unknown): Record<string, unknown> {
  if (!val) return {};
  if (typeof val === "object") return val as Record<string, unknown>;
  try { return JSON.parse(val as string); } catch { return {}; }
}

export default function IndexingScanner({ cmsData }: { cmsData?: IndexingScannerCmsData } = {}) {
  const { t, i18n } = useTranslation();
  const [active, setActive] = useState(false);
  const [inView, setInView] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [glowingNodeIds, setGlowingNodeIds] = useState<number[]>([]);
  const [panelNodeId, setPanelNodeId] = useState<number | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const lastIlluminatedTimesRef = useRef<Map<number, number>>(new Map());
  const latestDiscoveredNodeIdRef = useRef<number | null>(null);
  const glowingSetCacheRef = useRef<string>("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Continuous searchlight beam sweep, independent 3.5s node afterglow & panel persistence
  useEffect(() => {
    if (!inView || !isMounted) return;
    const rotor = rotorRef.current;
    if (!rotor) return;

    const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    if (mq?.matches) {
      rotor.style.transform = "rotate(25deg)";
      setGlowingNodeIds([1]);
      setPanelNodeId(1);
      return;
    }

    rotor.setAttribute("data-js-driven", "true");

    let animationFrameId: number;
    const duration = 10000; // 10 seconds per 360-degree sweep
    const startTime = performance.now();
    const TOLERANCE = 15; // Beam half-angle tolerance in degrees
    const AFTERGLOW_DURATION = 3500; // 3.5 seconds persistence after beam leaves

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const beamAngle = ((elapsed % duration) / duration) * 360;

      // Update rotor orientation smoothly on GPU compositor thread
      rotor.style.transform = `rotate(${beamAngle}deg)`;

      // 1. Detect if any node is currently under the searchlight beam
      let beamNodeId: number | null = null;
      for (let i = 0; i < RADAR_NODES.length; i++) {
        const node = RADAR_NODES[i];
        let diff = Math.abs(beamAngle - node.angle);
        if (diff > 180) diff = 360 - diff;
        if (diff <= TOLERANCE) {
          beamNodeId = node.id;
          break;
        }
      }

      // 2. If a node is under the beam, refresh its timestamp
      if (beamNodeId !== null) {
        lastIlluminatedTimesRef.current.set(beamNodeId, now);

        // When a new node is discovered under the beam, update the active panel immediately
        if (beamNodeId !== latestDiscoveredNodeIdRef.current) {
          latestDiscoveredNodeIdRef.current = beamNodeId;
          setPanelNodeId(beamNodeId);
        }
      }

      // 3. Determine which nodes are currently active (under beam OR within 3.5s afterglow)
      const activeIds: number[] = [];
      for (let i = 0; i < RADAR_NODES.length; i++) {
        const node = RADAR_NODES[i];
        if (beamNodeId === node.id) {
          activeIds.push(node.id);
        } else {
          const lastTime = lastIlluminatedTimesRef.current.get(node.id);
          if (lastTime !== undefined && (now - lastTime) < AFTERGLOW_DURATION) {
            activeIds.push(node.id);
          }
        }
      }

      // 4. Update glowingNodeIds state only when the active set changes (avoids per-frame re-renders)
      const glowingKey = activeIds.slice().sort((a, b) => a - b).join(",");
      if (glowingKey !== glowingSetCacheRef.current) {
        glowingSetCacheRef.current = glowingKey;
        setGlowingNodeIds(activeIds);
      }

      // 5. Check if the active panel node has exceeded its 3.5s afterglow period
      if (latestDiscoveredNodeIdRef.current !== null && beamNodeId === null) {
        const panelLastTime = lastIlluminatedTimesRef.current.get(latestDiscoveredNodeIdRef.current);
        if (panelLastTime !== undefined && (now - panelLastTime) >= AFTERGLOW_DURATION) {
          latestDiscoveredNodeIdRef.current = null;
          setPanelNodeId(null);
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [inView, isMounted]);

  const activeNode = RADAR_NODES.find((n) => n.id === panelNodeId) || null;

  const cEn = parseJsonSafe(cmsData?.content);
  const cBn = parseJsonSafe(cmsData?.contentBn);

  const isBn = i18n.language === "bn";
  const kicker = asString(resolveCmsValue(isBn, cEn, cBn, ["indexingKicker", "kicker", "sectionLabel", "badge"])) || t("indexScan.kicker");
  const lead = asString(resolveCmsValue(isBn, cEn, cBn, ["indexingLead", "lead", "sectionDescription", "description"])) || t("indexScan.lead");
  const heading = asString(resolveCmsValue(isBn, cEn, cBn, ["indexingHeading", "heading"])) || t("sitenav.pressFreedomIndex");
  const openText = asString(resolveCmsValue(isBn, cEn, cBn, ["indexingCtaText", "openText", "sectionTitle", "title"])) || t("indexScan.open");
  const ctaCheck = sanitizeUrl(asString(resolveCmsValue(false, cEn, cBn, ["indexingCtaUrl", "ctaUrl"])));
  const ctaUrl = ctaCheck.ok && ctaCheck.url ? ctaCheck.url : "/indexing/press-freedom-index";
  const scannerLabel = asString(resolveCmsValue(isBn, cEn, cBn, ["scannerLabel", "ariaLabel"])) || t("indexScan.scanner_label");

  useEffect(() => {
    const onScan = () => {
      setActive(true);
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      sectionRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    };

    window.addEventListener(INDEX_SCAN_EVENT, onScan);

    const el = sectionRef.current;
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0 }
          )
        : null;
    if (el && observer) observer.observe(el);

    return () => {
      window.removeEventListener(INDEX_SCAN_EVENT, onScan);
      observer?.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="press-freedom-index"
      aria-labelledby="pfi-title"
      className="relative overflow-hidden bg-navy-950 py-16 sm:py-20 lg:py-28"
    >
      {/* Layered dark atmospheric glows */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_50%,rgba(8,145,178,0.15)_0%,transparent_60%)] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(6,182,212,0.10)_0%,transparent_55%)] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(212,168,67,0.04)_0%,transparent_40%)] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 xl:gap-14 items-center">
          
          {/* LEFT COLUMN — Information and Description */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-[0.25em] uppercase mb-5 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.12)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
              {kicker}
            </div>

            {/* Main Heading */}
            <h2
              id="pfi-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.12] tracking-tight mb-5"
            >
              {heading}
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300/85 leading-relaxed max-w-xl mb-8">
              {lead}
            </p>

            {/* Primary CTA and Live Scan Status */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={ctaUrl}
                className="group inline-flex items-center gap-2.5 px-6 sm:px-7 py-3.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-navy-950 text-sm font-semibold transition-all duration-300 shadow-[0_0_24px_rgba(6,182,212,0.32)] hover:shadow-[0_0_32px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-navy-950"
              >
                <span>{openText}</span>
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              {active && (
                <div
                  role="status"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-xs font-semibold tracking-[0.15em] uppercase text-cyan-300 transition-opacity duration-500 animate-fadeIn"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" aria-hidden="true" />
                  {t("indexScan.live")}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — Large Interactive Flashlight Radar & Discovery System */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center lg:items-end w-full">
            {!isMounted ? (
              /* Static, predictable placeholder matching the radar footprint so
                 the server and first client paint are identical (zero CLS). */
              <div className="pfi-radar" aria-hidden="true" />
            ) : (
            <div
              className={`pfi-radar ${active ? "is-active" : "is-ambient"} ${inView ? "" : "is-paused"}`}
              role="img"
              aria-label={scannerLabel}
            >
              {/* Layer 1: Static Base in Nighttime Darkness (Subtle rings, crosshairs, degree ticks, nodes) */}
              <svg
                viewBox="0 0 440 440"
                className="w-full h-full pointer-events-none"
                aria-hidden="true"
              >
                <defs>
                  <filter id="pfiNodeBloomBlur" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="7" />
                  </filter>
                </defs>

                {/* Dark atmospheric disc base */}
                <circle cx="220" cy="220" r="200" fill="#02040b" />

                {/* Concentric rings in deep darkness — barely visible until illuminated */}
                <circle cx="220" cy="220" r="200" fill="none" stroke="rgba(34, 211, 238, 0.12)" strokeWidth="1" />
                <circle cx="220" cy="220" r="158" fill="none" stroke="rgba(34, 211, 238, 0.08)" strokeWidth="1" strokeDasharray="3 6" className="pfi-orbit-ring" />
                <circle cx="220" cy="220" r="116" fill="none" stroke="rgba(34, 211, 238, 0.09)" strokeWidth="1" />
                <circle cx="220" cy="220" r="74" fill="none" stroke="rgba(34, 211, 238, 0.07)" strokeWidth="1" strokeDasharray="2 5" />
                <circle cx="220" cy="220" r="32" fill="none" stroke="rgba(34, 211, 238, 0.11)" strokeWidth="1" />

                {/* Faint crosshair axes */}
                <line x1="20" y1="220" x2="185" y2="220" stroke="rgba(34, 211, 238, 0.06)" strokeWidth="1" strokeDasharray="3 6" />
                <line x1="255" y1="220" x2="420" y2="220" stroke="rgba(34, 211, 238, 0.06)" strokeWidth="1" strokeDasharray="3 6" />
                <line x1="220" y1="20" x2="220" y2="185" stroke="rgba(34, 211, 238, 0.06)" strokeWidth="1" strokeDasharray="3 6" />
                <line x1="220" y1="255" x2="220" y2="420" stroke="rgba(34, 211, 238, 0.06)" strokeWidth="1" strokeDasharray="3 6" />

                {/* Perimeter degree ticks */}
                {RADAR_TICKS.map((tick, i) => (
                  <line
                    key={i}
                    x1={tick.x1}
                    y1={tick.y1}
                    x2={tick.x2}
                    y2={tick.y2}
                    stroke={tick.isMajor ? "rgba(34, 211, 238, 0.22)" : "rgba(34, 211, 238, 0.08)"}
                    strokeWidth={tick.isMajor ? "1.5" : "1"}
                  />
                ))}

                {/* Information signal nodes - persistent illumination with 3.5s independent afterglow */}
                {RADAR_NODES.map((node) => {
                  const isGlowing = glowingNodeIds.includes(node.id);
                  return (
                    <g
                      key={node.id}
                      className={`pfi-node-group ${isGlowing ? "is-illuminated" : "is-dormant"}`}
                    >
                      <title>{`${node.category}: ${node.description}`}</title>
                      
                      {/* Atmospheric bloom spill with smooth fade */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={30}
                        fill={node.color}
                        className="pfi-node-spill"
                        filter="url(#pfiNodeBloomBlur)"
                      />

                      {/* Phosphor halo ring with smooth fade */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={16}
                        fill="none"
                        stroke={node.color}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        className="pfi-node-halo"
                      />

                      {/* Luminous Node Core — enlarged & vivid when glowing, smooth fade to dark blueprint dot */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isGlowing ? 7.5 : 3.5}
                        fill={isGlowing ? node.color : "#060b18"}
                        stroke={isGlowing ? "rgba(255,255,255,0.95)" : "rgba(255, 255, 255, 0.12)"}
                        strokeWidth={isGlowing ? 1.5 : 1}
                        className="pfi-node-core"
                        style={isGlowing ? { filter: `drop-shadow(0 0 12px ${node.color})` } : undefined}
                      />

                      {/* Specular Center Diamond with smooth fade */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={2.5}
                        fill="#ffffff"
                        className="pfi-node-specular"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Layer 2: Rotating Realistic Searchlight Beam Assembly */}
              <div className="pfi-rotor" ref={rotorRef} aria-hidden="true">
                <svg
                  viewBox="0 0 440 440"
                  className="w-full h-full overflow-visible pointer-events-none"
                  aria-hidden="true"
                >
                  <defs>
                    {/* SVG Filters with wide boundaries to prevent edge clipping */}
                    <filter id="pfiWideSpillBlur" x="-80%" y="-80%" width="260%" height="260%">
                      <feGaussianBlur stdDeviation="24" />
                    </filter>
                    <filter id="pfiMidConeBlur" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="11" />
                    </filter>
                    <filter id="pfiInnerConeBlur" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="5" />
                    </filter>
                    <filter id="pfiShaftBlur" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="3" />
                    </filter>
                    <filter id="pfiHotspotHaloBlur" x="-90%" y="-90%" width="280%" height="280%">
                      <feGaussianBlur stdDeviation="22" />
                    </filter>
                    <filter id="pfiHotspotMidBlur" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="8" />
                    </filter>
                    <filter id="pfiHotspotCoreBlur" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.5" />
                    </filter>
                    <filter id="pfiGridGlowBlur" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="2" />
                    </filter>

                    {/* Volumetric Gradients for the Realistic Searchlight */}
                    <linearGradient id="pfiWideSpillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#267BFF" stopOpacity="0" />
                      <stop offset="18%" stopColor="#267BFF" stopOpacity="0.22" />
                      <stop offset="50%" stopColor="#00D9F5" stopOpacity="0.48" />
                      <stop offset="82%" stopColor="#267BFF" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#267BFF" stopOpacity="0" />
                    </linearGradient>

                    <linearGradient id="pfiMidConeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D9F5" stopOpacity="0" />
                      <stop offset="20%" stopColor="#00D9F5" stopOpacity="0.55" />
                      <stop offset="50%" stopColor="#a5f3fc" stopOpacity="0.88" />
                      <stop offset="80%" stopColor="#00D9F5" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#00D9F5" stopOpacity="0" />
                    </linearGradient>

                    <linearGradient id="pfiInnerConeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D9F5" stopOpacity="0" />
                      <stop offset="16%" stopColor="#67e8f9" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="84%" stopColor="#67e8f9" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#00D9F5" stopOpacity="0" />
                    </linearGradient>

                    {/* Gradient along the Tapered Central Beam Shaft */}
                    <linearGradient id="pfiShaftGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="35%" stopColor="#ffffff" stopOpacity="0.98" />
                      <stop offset="75%" stopColor="#cffafe" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#00D9F5" stopOpacity="0.9" />
                    </linearGradient>

                    {/* Hotspot Impact Gradients */}
                    <radialGradient id="pfiHotspotHaloGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#00D9F5" stopOpacity="0.65" />
                      <stop offset="35%" stopColor="#267BFF" stopOpacity="0.4" />
                      <stop offset="70%" stopColor="#0891b2" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="pfiHotspotMidGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="30%" stopColor="#e0f2fe" stopOpacity="0.95" />
                      <stop offset="60%" stopColor="#67e8f9" stopOpacity="0.75" />
                      <stop offset="85%" stopColor="#00D9F5" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="pfiHotspotCoreGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="45%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="75%" stopColor="#cffafe" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
                    </radialGradient>

                    {/* Torch Emitter Bulb Gradient */}
                    <radialGradient id="pfiEmitterBulbGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="40%" stopColor="#e0f2fe" stopOpacity="0.95" />
                      <stop offset="80%" stopColor="#00D9F5" stopOpacity="0.75" />
                      <stop offset="100%" stopColor="#267BFF" stopOpacity="0.3" />
                    </radialGradient>

                    {/* Illuminated Grid Arcs Gradient */}
                    <linearGradient id="pfiLitRingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00D9F5" stopOpacity="0" />
                      <stop offset="18%" stopColor="#00D9F5" stopOpacity="0.75" />
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="82%" stopColor="#00D9F5" stopOpacity="0.75" />
                      <stop offset="100%" stopColor="#00D9F5" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* 1. Broad Volumetric Flood Spill (Atmospheric outer glow with organic searchlight curvature) */}
                  <path
                    d="M 220 214 C 255 190, 310 120, 372 68 A 215 215 0 0 1 372 372 C 310 320, 255 250, 220 226 Z"
                    fill="url(#pfiWideSpillGrad)"
                    filter="url(#pfiWideSpillBlur)"
                  />

                  {/* 2. Mid Volumetric Light Cone with parabolic expansion */}
                  <path
                    d="M 220 216 C 265 195, 335 155, 408.5 132.1 A 208 208 0 0 1 408.5 307.9 C 335 285, 265 245, 220 224 Z"
                    fill="url(#pfiMidConeGrad)"
                    filter="url(#pfiMidConeBlur)"
                  />

                  {/* 3. Inner High-Intensity Cutting Cone */}
                  <path
                    d="M 220 217 C 275 204, 345 186, 416.8 174.5 A 202 202 0 0 1 416.8 265.5 C 345 254, 275 236, 220 223 Z"
                    fill="url(#pfiInnerConeGrad)"
                    filter="url(#pfiInnerConeBlur)"
                  />

                  {/* 4. Environmental Illumination: Concentric rings gleaming under the searchlight beam */}
                  <g filter="url(#pfiGridGlowBlur)">
                    <path
                      d="M 396.6 126.1 A 200 200 0 0 1 396.6 313.9"
                      fill="none"
                      stroke="url(#pfiLitRingsGrad)"
                      strokeWidth="2"
                    />
                    <path
                      d="M 359.5 145.8 A 158 158 0 0 1 359.5 294.2"
                      fill="none"
                      stroke="url(#pfiLitRingsGrad)"
                      strokeWidth="1.75"
                      strokeDasharray="4 6"
                    />
                    <path
                      d="M 322.4 165.5 A 116 116 0 0 1 322.4 274.5"
                      fill="none"
                      stroke="url(#pfiLitRingsGrad)"
                      strokeWidth="1.75"
                    />
                    <path
                      d="M 285.3 185.3 A 74 74 0 0 1 285.3 254.7"
                      fill="none"
                      stroke="url(#pfiLitRingsGrad)"
                      strokeWidth="1.75"
                      strokeDasharray="3 5"
                    />
                    <path
                      d="M 248.3 205.0 A 32 32 0 0 1 248.3 235.0"
                      fill="none"
                      stroke="url(#pfiLitRingsGrad)"
                      strokeWidth="1.75"
                    />
                  </g>

                  {/* 5. Central Searchlight Shaft with parabolic organic taper */}
                  <path
                    d="M 220 218 C 270 214, 330 208, 392 206 L 406 220 L 392 234 C 330 232, 270 226, 220 222 Z"
                    fill="url(#pfiShaftGrad)"
                    filter="url(#pfiShaftBlur)"
                  />

                  {/* 6. High-Intensity White Core Beam Spine with layered luminescence */}
                  <line
                    x1="220"
                    y1="220"
                    x2="400"
                    y2="220"
                    stroke="#00D9F5"
                    strokeWidth="10"
                    strokeOpacity="0.8"
                    filter="url(#pfiShaftBlur)"
                  />
                  <line
                    x1="220"
                    y1="220"
                    x2="400"
                    y2="220"
                    stroke="#a5f3fc"
                    strokeWidth="5"
                    strokeOpacity="0.95"
                    filter="url(#pfiShaftBlur)"
                  />
                  <line
                    x1="220"
                    y1="220"
                    x2="402"
                    y2="220"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* 7. Flashlight Hotspot (Target Impact Pool) */}
                  {/* Soft Outer Atmospheric Halo */}
                  <ellipse
                    cx="390"
                    cy="220"
                    rx="68"
                    ry="52"
                    fill="url(#pfiHotspotHaloGrad)"
                    filter="url(#pfiHotspotHaloBlur)"
                  />
                  {/* Mid Illumination Pool */}
                  <ellipse
                    cx="392"
                    cy="220"
                    rx="42"
                    ry="32"
                    fill="url(#pfiHotspotMidGrad)"
                    filter="url(#pfiHotspotMidBlur)"
                  />
                  {/* Blinding White Core */}
                  <ellipse
                    cx="394"
                    cy="220"
                    rx="22"
                    ry="16"
                    fill="url(#pfiHotspotCoreGrad)"
                    filter="url(#pfiHotspotCoreBlur)"
                  />
                  {/* Anamorphic horizontal lens flare streak */}
                  <line
                    x1="320"
                    y1="220"
                    x2="435"
                    y2="220"
                    stroke="#cffafe"
                    strokeWidth="2.5"
                    strokeOpacity="0.8"
                    filter="url(#pfiShaftBlur)"
                  />
                  {/* Hotspot Specular Center Dot */}
                  <circle
                    cx="395"
                    cy="220"
                    r="6"
                    fill="#ffffff"
                  />

                  {/* 8. Handheld Torch Lens Emitter Assembly */}
                  <circle
                    cx="220"
                    cy="220"
                    r="16"
                    fill="#020817"
                    stroke="rgba(0, 217, 245, 0.7)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="220"
                    cy="220"
                    r="11"
                    fill="#081e36"
                    stroke="rgba(103, 232, 249, 0.85)"
                    strokeWidth="1.2"
                  />
                  <circle
                    cx="220"
                    cy="220"
                    r="6.5"
                    fill="url(#pfiEmitterBulbGrad)"
                  />
                  <circle
                    cx="220"
                    cy="220"
                    r="3"
                    fill="#ffffff"
                  />
                </svg>
              </div>

              {/* Layer 3: Central origin emitter core and ambient ripple */}
              <div className="pfi-origin-core" aria-hidden="true" />
              <div className="pfi-ripple" aria-hidden="true" />
            </div>
            )}

            {/* Dynamic Journalism Information Discovery Panel — illuminates dynamically with beam contact */}
            <div
              className="mt-6 w-full max-w-[480px] min-h-[96px] flex flex-col justify-center"
              aria-live="polite"
            >
              {activeNode ? (
                <div
                  key={activeNode.id}
                  className="p-4 rounded-xl border bg-[#030915]/95 backdrop-blur-md shadow-2xl transition-all duration-300 animate-fadeIn"
                  style={{
                    borderColor: `${activeNode.color}40`,
                    boxShadow: `0 0 25px ${activeNode.color}20`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: activeNode.color,
                          boxShadow: `0 0 10px ${activeNode.color}`,
                        }}
                        aria-hidden="true"
                      />
                      <span
                        className="text-xs font-bold tracking-wider uppercase"
                        style={{ color: activeNode.color }}
                      >
                        {activeNode.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-slate-400/70 uppercase">
                      Signal {activeNode.angle}°
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-200/90 leading-relaxed">
                    {activeNode.description}
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-white/5 bg-[#030915]/30 backdrop-blur-sm flex items-center justify-between text-slate-500/70 text-xs">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/40 animate-ping" />
                    <span className="italic">Scanning narrative spectrum...</span>
                  </span>
                  <span className="font-mono text-[10px] tracking-wider uppercase text-slate-600">Active Radar</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
