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

export const INDEX_SCAN_EVENT = "lens:index-scan";

export function requestIndexScan() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INDEX_SCAN_EVENT));
  }
}

// 24 perimeter degree tick marks around the 360-degree circumference
const RADAR_TICKS = Array.from({ length: 24 }).map((_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  const isMajor = i % 6 === 0; // 0, 90, 180, 270 deg
  const isMedium = i % 2 === 0;
  const tickLen = isMajor ? 10 : isMedium ? 6 : 4;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x1: 220 + 200 * cos,
    y1: 220 + 200 * sin,
    x2: 220 + (200 - tickLen) * cos,
    y2: 220 + (200 - tickLen) * sin,
    isMajor,
  };
});

// Strategic information signal points distributed around the concentric rings.
// Delay is synchronized so each node pulses with phosphorescent afterglow as the beam sweeps over it.
const RADAR_NODES = [
  { id: 1, x: 359.5, y: 294.2, angle: 28, gold: false },
  { id: 2, x: 255.8, y: 330.3, angle: 72, gold: true },
  { id: 3, x: 107.5, y: 354.1, angle: 130, gold: false },
  { id: 4, x: 146.3, y: 226.4, angle: 175, gold: false },
  { id: 5, x: 124.5, y: 124.5, angle: 225, gold: true },
  { id: 6, x: 247.4, y: 64.4, angle: 280, gold: false },
  { id: 7, x: 287.2, y: 152.8, angle: 315, gold: false },
  { id: 8, x: 397.3, y: 188.7, angle: 350, gold: false },
];

export default function IndexingScanner() {
  const { t } = useTranslation();
  const [active, setActive] = useState(false);
  const [inView, setInView] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

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
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-start text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-[0.25em] uppercase mb-5 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.12)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
              {t("indexScan.kicker")}
            </div>

            {/* Main Heading */}
            <h2
              id="pfi-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.12] tracking-tight mb-5"
            >
              {t("sitenav.pressFreedomIndex")}
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300/85 leading-relaxed max-w-xl mb-8">
              {t("indexScan.lead")}
            </p>

            {/* Primary CTA and Live Scan Status */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/indexing/press-freedom-index"
                className="group inline-flex items-center gap-2.5 px-6 sm:px-7 py-3.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-navy-950 text-sm font-semibold transition-all duration-300 shadow-[0_0_24px_rgba(6,182,212,0.32)] hover:shadow-[0_0_32px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-navy-950"
              >
                <span>{t("indexScan.open")}</span>
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

          {/* RIGHT COLUMN — Realistic Cinematic Flashlight Radar */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end w-full">
            <div
              className={`pfi-radar ${active ? "is-active" : "is-ambient"} ${inView ? "" : "is-paused"}`}
              role="img"
              aria-label={t("indexScan.scanner_label")}
            >
              {/* Layer 1: Static Base in Nighttime Darkness (Subtle rings, crosshairs, degree ticks, nodes) */}
              <svg
                viewBox="0 0 440 440"
                className="w-full h-full pointer-events-none"
                aria-hidden="true"
              >
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

                {/* Information signal points (Nodes) with synchronized flashlight illumination and local surface spill */}
                {RADAR_NODES.map((node) => (
                  <g
                    key={node.id}
                    className="pfi-node-group"
                    style={{
                      animationDelay: `${-(10 - (node.angle / 360) * 10).toFixed(2)}s`,
                    }}
                  >
                    {/* Local light spill reflecting on dark surface */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={16}
                      className={node.gold ? "pfi-node-spill is-gold" : "pfi-node-spill"}
                    />
                    {/* Phosphor halo */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.gold ? 8.5 : 7}
                      className={node.gold ? "pfi-node-halo is-gold" : "pfi-node-halo"}
                    />
                    {/* Luminous core signal dot */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.gold ? 4 : 3.5}
                      className={node.gold ? "pfi-node-dot is-gold" : "pfi-node-dot"}
                    />
                    {/* Specular pinhole */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={1.5}
                      fill="#ffffff"
                      opacity="0.95"
                    />
                  </g>
                ))}
              </svg>

              {/* Layer 2: Rotating Realistic Flashlight Beam Assembly */}
              <div className="pfi-rotor" aria-hidden="true">
                <svg
                  viewBox="0 0 440 440"
                  className="w-full h-full overflow-visible pointer-events-none"
                  aria-hidden="true"
                >
                  <defs>
                    {/* SVG Filters with wide boundaries to prevent edge clipping */}
                    <filter id="pfiWideSpillBlur" x="-80%" y="-80%" width="260%" height="260%">
                      <feGaussianBlur stdDeviation="20" />
                    </filter>
                    <filter id="pfiMidConeBlur" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="9" />
                    </filter>
                    <filter id="pfiInnerConeBlur" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" />
                    </filter>
                    <filter id="pfiShaftBlur" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="2.5" />
                    </filter>
                    <filter id="pfiHotspotHaloBlur" x="-90%" y="-90%" width="280%" height="280%">
                      <feGaussianBlur stdDeviation="16" />
                    </filter>
                    <filter id="pfiHotspotMidBlur" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="6" />
                    </filter>
                    <filter id="pfiHotspotCoreBlur" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" />
                    </filter>
                    <filter id="pfiGridGlowBlur" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="2" />
                    </filter>

                    {/* Volumetric Gradients for the Light Cones */}
                    <linearGradient id="pfiWideSpillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0891b2" stopOpacity="0" />
                      <stop offset="25%" stopColor="#0891b2" stopOpacity="0.14" />
                      <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.38" />
                      <stop offset="75%" stopColor="#0891b2" stopOpacity="0.14" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                    </linearGradient>

                    <linearGradient id="pfiMidConeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0891b2" stopOpacity="0" />
                      <stop offset="20%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#a5f3fc" stopOpacity="0.65" />
                      <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                    </linearGradient>

                    <linearGradient id="pfiInnerConeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
                      <stop offset="18%" stopColor="#67e8f9" stopOpacity="0.6" />
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
                      <stop offset="82%" stopColor="#67e8f9" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </linearGradient>

                    {/* Gradient along the Tapered Central Beam Shaft */}
                    <linearGradient id="pfiShaftGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
                      <stop offset="40%" stopColor="#ffffff" stopOpacity="0.95" />
                      <stop offset="80%" stopColor="#ecfeff" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#a5f3fc" stopOpacity="0.92" />
                    </linearGradient>

                    {/* Hotspot Impact Gradients */}
                    <radialGradient id="pfiHotspotHaloGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.5" />
                      <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.28" />
                      <stop offset="75%" stopColor="#0891b2" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="pfiHotspotMidGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="35%" stopColor="#e0f2fe" stopOpacity="0.9" />
                      <stop offset="65%" stopColor="#67e8f9" stopOpacity="0.55" />
                      <stop offset="90%" stopColor="#0891b2" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="pfiHotspotCoreGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="45%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="75%" stopColor="#cffafe" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
                    </radialGradient>

                    {/* Torch Emitter Bulb Gradient */}
                    <radialGradient id="pfiEmitterBulbGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="40%" stopColor="#e0f2fe" stopOpacity="0.95" />
                      <stop offset="80%" stopColor="#22d3ee" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
                    </radialGradient>

                    {/* Illuminated Grid Arcs Gradient */}
                    <linearGradient id="pfiLitRingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                      <stop offset="25%" stopColor="#a5f3fc" stopOpacity="0.65" />
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
                      <stop offset="75%" stopColor="#a5f3fc" stopOpacity="0.65" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* 1. Broad Volumetric Flood Spill (spanning 80 degrees) */}
                  <path
                    d="M 220 220 L 380.9 85 A 210 210 0 0 1 380.9 355 Z"
                    fill="url(#pfiWideSpillGrad)"
                    filter="url(#pfiWideSpillBlur)"
                  />

                  {/* 2. Mid Volumetric Light Cone (spanning 48 degrees) */}
                  <path
                    d="M 220 220 L 407.3 136.6 A 205 205 0 0 1 407.3 303.4 Z"
                    fill="url(#pfiMidConeGrad)"
                    filter="url(#pfiMidConeBlur)"
                  />

                  {/* 3. Inner High-Intensity Cone (spanning 24 degrees) */}
                  <path
                    d="M 220 220 L 415.6 178.4 A 200 200 0 0 1 415.6 261.6 Z"
                    fill="url(#pfiInnerConeGrad)"
                    filter="url(#pfiInnerConeBlur)"
                  />

                  {/* 4. Environmental Illumination: Concentric rings gleaming under the flashlight beam */}
                  <g filter="url(#pfiGridGlowBlur)">
                    <path
                      d="M 396.6 126.1 A 200 200 0 0 1 396.6 313.9"
                      fill="none"
                      stroke="url(#pfiLitRingsGrad)"
                      strokeWidth="1.75"
                    />
                    <path
                      d="M 359.5 145.8 A 158 158 0 0 1 359.5 294.2"
                      fill="none"
                      stroke="url(#pfiLitRingsGrad)"
                      strokeWidth="1.5"
                      strokeDasharray="4 6"
                    />
                    <path
                      d="M 322.4 165.5 A 116 116 0 0 1 322.4 274.5"
                      fill="none"
                      stroke="url(#pfiLitRingsGrad)"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 285.3 185.3 A 74 74 0 0 1 285.3 254.7"
                      fill="none"
                      stroke="url(#pfiLitRingsGrad)"
                      strokeWidth="1.5"
                      strokeDasharray="3 5"
                    />
                    <path
                      d="M 248.3 205.0 A 32 32 0 0 1 248.3 235.0"
                      fill="none"
                      stroke="url(#pfiLitRingsGrad)"
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* 5. Tapered Central Beam Shaft (narrow at emitter, expanding to hotspot) */}
                  <polygon
                    points="220,216 385,201 402,220 385,239 220,224"
                    fill="url(#pfiShaftGrad)"
                    filter="url(#pfiShaftBlur)"
                  />

                  {/* 6. High-Intensity White Core Beam Spine */}
                  <line
                    x1="220"
                    y1="220"
                    x2="388"
                    y2="220"
                    stroke="#a5f3fc"
                    strokeWidth="8"
                    strokeOpacity="0.75"
                    filter="url(#pfiShaftBlur)"
                  />
                  <line
                    x1="220"
                    y1="220"
                    x2="388"
                    y2="220"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* 7. Flashlight Hotspot (Target Impact Pool) */}
                  {/* Soft Outer Halo */}
                  <ellipse
                    cx="384"
                    cy="220"
                    rx="56"
                    ry="44"
                    fill="url(#pfiHotspotHaloGrad)"
                    filter="url(#pfiHotspotHaloBlur)"
                  />
                  {/* Mid Illumination Pool */}
                  <ellipse
                    cx="386"
                    cy="220"
                    rx="34"
                    ry="26"
                    fill="url(#pfiHotspotMidGrad)"
                    filter="url(#pfiHotspotMidBlur)"
                  />
                  {/* Blinding White Core */}
                  <ellipse
                    cx="388"
                    cy="220"
                    rx="18"
                    ry="14"
                    fill="url(#pfiHotspotCoreGrad)"
                    filter="url(#pfiHotspotCoreBlur)"
                  />
                  {/* Hotspot Specular Center Dot */}
                  <circle
                    cx="389"
                    cy="220"
                    r="5.5"
                    fill="#ffffff"
                  />

                  {/* 8. Handheld Torch Lens Emitter Assembly */}
                  <circle
                    cx="220"
                    cy="220"
                    r="15"
                    fill="#020817"
                    stroke="rgba(34, 211, 238, 0.5)"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="220"
                    cy="220"
                    r="10"
                    fill="#081e36"
                    stroke="rgba(103, 232, 249, 0.7)"
                    strokeWidth="1"
                  />
                  <circle
                    cx="220"
                    cy="220"
                    r="6"
                    fill="url(#pfiEmitterBulbGrad)"
                  />
                  <circle
                    cx="220"
                    cy="220"
                    r="2.5"
                    fill="#ffffff"
                  />
                </svg>
              </div>

              {/* Layer 3: Central origin emitter core and ambient ripple */}
              <div className="pfi-origin-core" aria-hidden="true" />
              <div className="pfi-ripple" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
