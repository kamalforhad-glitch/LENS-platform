"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type CursorVariant = "default" | "link" | "explore" | "read" | "magnetic";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(false);
  const variantRef = useRef<CursorVariant>("default");

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const labelEl = labelRef.current;
    if (!dot || !ring) return;

    const showCursor = () => {
      if (!visibleRef.current) {
        visibleRef.current = true;
        gsap.to(dot, { opacity: 1, duration: 0.15 });
        gsap.to(ring, { opacity: 1, duration: 0.15 });
      }
    };

    const hideCursor = () => {
      visibleRef.current = false;
      gsap.to(dot, { opacity: 0, duration: 0.15 });
      gsap.to(ring, { opacity: 0, duration: 0.15 });
    };

    const move = (e: MouseEvent) => {
      showCursor();
      gsap.to(dot, { x: e.clientX, y: e.clientY, duration: 0.08, ease: "power2.out" });
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.25, ease: "power2.out" });
      if (labelEl) {
        gsap.to(labelEl, { x: e.clientX, y: e.clientY, duration: 0.35, ease: "power2.out" });
      }
    };

    const handleMouseLeave = () => {
      hideCursor();
    };

    const handleMouseEnter = () => {
      showCursor();
    };

    const handleEnterLink = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      const cursorLabel = el.getAttribute("data-cursor");
      if (cursorLabel) {
        variantRef.current = "explore";
        if (labelEl) labelEl.textContent = cursorLabel;
        gsap.to(ring, { scale: 2.5, borderColor: "rgba(212,168,67,0.6)", duration: 0.3 });
        gsap.to(dot, { scale: 0.3, backgroundColor: "#d4a843", duration: 0.3 });
        if (labelEl) gsap.to(labelEl, { opacity: 1, duration: 0.2 });
      } else {
        variantRef.current = "link";
        if (labelEl) labelEl.textContent = "";
        gsap.to(ring, { scale: 2, borderColor: "rgba(34,211,238,0.6)", duration: 0.3 });
        gsap.to(dot, { scale: 0.5, duration: 0.3 });
      }
    };

    const handleLeaveLink = () => {
      variantRef.current = "default";
      if (labelEl) labelEl.textContent = "";
      gsap.to(ring, { scale: 1, borderColor: "rgba(34,211,238,0.3)", duration: 0.3 });
      gsap.to(dot, { scale: 1, backgroundColor: "#22d3ee", duration: 0.3 });
      if (labelEl) gsap.to(labelEl, { opacity: 0, duration: 0.2 });
    };

    const handleEnterDownload = () => {
      variantRef.current = "read";
      if (labelEl) labelEl.textContent = "Read";
      gsap.to(ring, { scale: 2.5, borderColor: "rgba(34,211,238,0.8)", duration: 0.3 });
      gsap.to(dot, { scale: 0.3, duration: 0.3 });
      if (labelEl) gsap.to(labelEl, { opacity: 1, duration: 0.2 });
    };

    // Initial opacity
    gsap.set(dot, { opacity: 0 });
    gsap.set(ring, { opacity: 0 });
    if (labelEl) gsap.set(labelEl, { opacity: 0 });

    window.addEventListener("mousemove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.documentElement.addEventListener("mouseenter", handleMouseEnter);

    // Deduplicate listeners using data attributes
    const observeInteractives = () => {
      document.querySelectorAll("a, button").forEach((el) => {
        if ((el as HTMLElement).dataset.cursorBound) return;
        (el as HTMLElement).dataset.cursorBound = "true";
        el.addEventListener("mouseenter", handleEnterLink);
        el.addEventListener("mouseleave", handleLeaveLink);
      });
      document.querySelectorAll("[data-cursor-download]").forEach((el) => {
        if ((el as HTMLElement).dataset.cursorDownloadBound) return;
        (el as HTMLElement).dataset.cursorDownloadBound = "true";
        el.addEventListener("mouseenter", handleEnterDownload);
        el.addEventListener("mouseleave", handleLeaveLink);
      });
    };

    observeInteractives();
    const observer = new MutationObserver(observeInteractives);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", move);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnter);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 bg-teal-400 rounded-full pointer-events-none z-[9999]"
        style={{
          transform: "translate(-50%, -50%)",
          mixBlendMode: "difference",
          willChange: "transform",
        }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 border border-teal-400/30 rounded-full pointer-events-none z-[9998] transition-[border-color] duration-300"
        style={{
          transform: "translate(-50%, -50%)",
          willChange: "transform",
        }}
      />
      <div
        ref={labelRef}
        className="fixed top-0 left-0 pointer-events-none z-[9997] -translate-x-1/2 translate-y-5"
        style={{ willChange: "transform" }}
      >
        <span className="text-[10px] font-bold tracking-wider uppercase text-white/80 bg-navy-900/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10" />
      </div>
    </>
  );
}
