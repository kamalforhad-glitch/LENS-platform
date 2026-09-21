"use client";

import { useEffect, useRef, useCallback } from "react";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const update = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / scrollHeight) * 100;
    if (barRef.current) {
      barRef.current.style.width = `${scrolled}%`;
    }
    if (glowRef.current) {
      glowRef.current.style.left = `${scrolled}%`;
      glowRef.current.style.opacity = scrolled > 0 ? "1" : "0";
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [update]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[40] h-[3px]"
      role="progressbar"
      aria-label="Page scroll progress"
    >
      {/* Background track */}
      <div className="absolute inset-0 bg-white/5" />

      {/* Progress bar */}
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-teal-500 via-teal-400 to-gold-500 relative"
        style={{ width: "0%", willChange: "width" }}
      >
        {/* Leading glow */}
        <div
          ref={glowRef}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-teal-400/40 rounded-full blur-md pointer-events-none"
          style={{ opacity: 0 }}
        />
      </div>

      {/* Section markers */}
      <div className="absolute inset-0 pointer-events-none">
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 h-full w-px bg-white/10"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>
    </div>
  );
}
