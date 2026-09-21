"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let raf: number;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const pct = total > 0 ? (scrolled / total) * 100 : 0;
        setVisible(scrolled > 400);
        setScrollPercent(pct);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (btnRef.current) {
      if (visible) {
        gsap.fromTo(
          btnRef.current,
          { opacity: 0, scale: 0.8, y: 20, rotate: -90 },
          { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 0.5, ease: "back.out(1.7)" }
        );
      } else {
        gsap.to(btnRef.current, { opacity: 0, scale: 0.8, y: 20, duration: 0.3 });
      }
    }
  }, [visible]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // SVG circle progress
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (scrollPercent / 100) * circumference;

  return (
    <button
      ref={btnRef}
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-navy-900/90 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-lg shadow-navy-950/30 hover:bg-teal-500/90 hover:border-teal-400/30 transition-all duration-300 opacity-0 group"
      aria-label="Back to top"
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      {/* Progress ring */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 44 44"
      >
        <circle
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2"
        />
        <circle
          ref={circleRef}
          cx="22"
          cy="22"
          r="18"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-150 ease-out"
        />
      </svg>
      <svg className="w-4 h-4 relative z-10 group-hover:-translate-y-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
