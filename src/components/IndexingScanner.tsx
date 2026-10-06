// ============================================================
// IndexingScanner — Press Freedom Index live-radar section.
//
// A full-width homepage section (replacing the earlier compact
// scanner band) with a large, continuously animated radar:
// concentric rings, rotating sweep beam with tip, pulsing nodes,
// slow ripple. Pure CSS animation (transform / opacity only);
// no Three.js, no GSAP, no data fetching, no fabricated index data.
//
// Modes:
//   ambient — always-on subtle animation while the section exists
//   active  — brighter glow, faster sweep, "LIVE INDEX SCAN" status
//             after the Press Freedom Index card is clicked
// The radar never auto-settles: it stays alive while mounted, and
// pauses off-screen via IntersectionObserver to save CPU.
//
// Activation: a single `lens:index-scan` window event (dispatched by
// the Press Freedom Index focus card). Re-clicks only re-scroll and
// re-assert active state; the listener registers once with cleanup.
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

// Fixed node field — decorative positions inside the radar disc.
const NODES = [
  { x: 28, y: 32, gold: false, delay: "0s", duration: "3.2s" },
  { x: 64, y: 26, gold: true, delay: "0.8s", duration: "3.8s" },
  { x: 72, y: 58, gold: false, delay: "1.6s", duration: "3.4s" },
  { x: 44, y: 70, gold: false, delay: "2.1s", duration: "4.1s" },
  { x: 56, y: 46, gold: true, delay: "0.4s", duration: "3s" },
  { x: 22, y: 60, gold: false, delay: "2.8s", duration: "3.6s" },
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
      className="relative overflow-hidden bg-navy-950"
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(8,145,178,0.14)_0%,transparent_55%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_110%,rgba(212,168,67,0.05)_0%,transparent_40%)]"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 relative z-10 text-center">
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-teal-400 mb-4">
          {t("indexScan.kicker")}
        </p>
        <h2 id="pfi-title" className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
          {t("sitenav.pressFreedomIndex")}
        </h2>
        <p className="text-slate-300/80 leading-relaxed max-w-xl mx-auto mb-10">
          {t("indexScan.lead")}
        </p>

        <div
          className={`pfi-radar ${active ? "is-active" : "is-ambient"} ${inView ? "" : "is-paused"}`}
          role="img"
          aria-label={t("indexScan.scanner_label")}
        >
          <div className="pfi-orbit" aria-hidden="true" />
          <div className="pfi-rotor" aria-hidden="true">
            <div className="pfi-beam" />
            <div className="pfi-beam-tip" />
          </div>
          {NODES.map((node, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`pfi-node ${node.gold ? "is-gold" : ""}`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                animationDelay: node.delay,
                animationDuration: node.duration,
              }}
            />
          ))}
          <div className="pfi-core" aria-hidden="true" />
          <div className="pfi-ripple" aria-hidden="true" />
        </div>

        <p
          role="status"
          className={`mt-8 min-h-6 text-sm font-semibold tracking-[0.2em] uppercase text-teal-300 transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0"}`}
        >
          {active ? t("indexScan.live") : ""}
        </p>

        <div className="mt-6">
          <Link
            href="/indexing/press-freedom-index"
            className="inline-flex items-center px-6 py-3 border border-white/20 text-white text-sm font-semibold rounded-full hover:border-teal-400 hover:text-teal-300 transition-colors"
          >
            {t("indexScan.open")}
          </Link>
        </div>
      </div>
    </section>
  );
}
