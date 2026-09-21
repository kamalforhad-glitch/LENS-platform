"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

interface LenisInstance {
  destroy: () => void;
  on: (event: "scroll" | "virtual-scroll", callback: () => void) => () => void;
  raf: (time: number) => void;
  scrollTo: (target: number | string | HTMLElement, options?: { offset?: number; duration?: number }) => void;
  stop: () => void;
  start: () => void;
}

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<LenisInstance | null>(null);
  const tickerCallbackRef = useRef<((time: number) => void) | null>(null);
  const pathname = usePathname();

  const handleAnchorClick = useCallback((e: Event) => {
    const target = e.currentTarget as HTMLAnchorElement;
    const href = target.getAttribute("href");
    if (!href?.startsWith("#")) return;

    const id = href.slice(1);
    const el = id ? document.getElementById(id) : null;
    if (el && lenisRef.current) {
      e.preventDefault();
      lenisRef.current.scrollTo(el, { offset: -80, duration: 0.8 });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const LenisModule = await import("lenis");
      if (cancelled) return;

      const lenis = new LenisModule.default({
        duration: 0.8,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      }) as LenisInstance;

      lenisRef.current = lenis;

      lenis.on("scroll", () => {
        ScrollTrigger.update();
      });

      const tickerCallback = (time: number) => {
        lenis.raf(time * 1000);
      };
      tickerCallbackRef.current = tickerCallback;
      gsap.ticker.add(tickerCallback);
      gsap.ticker.lagSmoothing(0);

      document.documentElement.style.scrollBehavior = "auto";

      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
      const savedScroll = sessionStorage.getItem(`scroll:${pathname}`);
      if (savedScroll) {
        requestAnimationFrame(() => {
          lenis.scrollTo(parseInt(savedScroll, 10), { duration: 0 });
        });
      }

      const handleBeforeUnload = () => {
        sessionStorage.setItem(`scroll:${pathname}`, String(window.scrollY));
      };
      window.addEventListener("beforeunload", handleBeforeUnload);

      document.addEventListener("click", (e) => {
        const anchor = (e.target as HTMLElement).closest("a[href^='#']");
        if (anchor) handleAnchorClick(e);
      });

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    };

    init();

    return () => {
      cancelled = true;
      if (tickerCallbackRef.current) {
        gsap.ticker.remove(tickerCallbackRef.current);
        tickerCallbackRef.current = null;
      }
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [pathname, handleAnchorClick]);

  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: 0 });
      sessionStorage.removeItem(`scroll:${pathname}`);
    }
  }, [pathname]);

  return <>{children}</>;
}
