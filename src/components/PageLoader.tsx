"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";

export default function PageLoader() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "reveal" | "done">("loading");
  const containerRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate lighthouse beam
    if (beamRef.current) {
      gsap.to(beamRef.current, {
        rotation: 360,
        duration: 3,
        repeat: -1,
        ease: "none",
      });
    }

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setPhase("reveal"), 300);
          setTimeout(() => setPhase("done"), 1400);
          return 100;
        }
        return p + Math.random() * 12 + 4;
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase === "reveal" && containerRef.current) {
      gsap.to(containerRef.current, {
        clipPath: "inset(0 0 100% 0)",
        duration: 1,
        ease: "power3.inOut",
      });
    }
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-navy-950"
      style={{ clipPath: "inset(0 0 0% 0)" }}
    >
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />

      {/* Lighthouse beam */}
      <div className="relative mb-10">
        <div
          ref={beamRef}
          className="absolute -inset-16 opacity-20"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, rgba(212,168,67,0.4) 15deg, transparent 40deg, transparent 360deg)",
            borderRadius: "50%",
          }}
        />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
          <svg
            viewBox="0 0 24 24"
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M12 2L2 19h20L12 2z" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Brand */}
      <h1 className="text-3xl font-bold text-white tracking-[0.2em] mb-2">LENS</h1>
      <p className="text-[10px] text-slate-400 tracking-[0.4em] uppercase mb-10">
        Lighthouse for Evolving Narrative Systems
      </p>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="w-40 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-gold-500 rounded-full transition-all duration-150 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="text-[10px] text-slate-500 font-mono tabular-nums w-8">
          {Math.min(Math.round(progress), 100)}%
        </span>
      </div>
    </div>
  );
}
