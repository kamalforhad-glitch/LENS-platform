"use client";

import { useEffect, useState, useCallback } from "react";
import {
  trackEvent,
  trackPageView,
  trackScrollDepth,
  trackSectionView,
  trackCTAClick,
  trackNewsletterSignup,
  trackFormSubmission,
  initSectionTracking,
} from "@/lib/analytics";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Google Analytics 4
function initGA4() {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    send_page_view: true,
    cookie_flags: "SameSite=None;Secure",
  });
}

// Meta Pixel
function initMetaPixel() {
  if (!META_PIXEL_ID || typeof window === "undefined") return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f: any = window.fbq;
  if (f) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fbq: any = (...args: unknown[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fbq.callMethod ? fbq.callMethod : fbq.push).apply(fbq, args);
  };
  if (!window._fbq) window._fbq = fbq;
  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView");
}

export function useAnalytics() {
  return {
    trackEvent,
    trackPageView,
    trackScrollDepth,
    trackSectionView,
    trackCTAClick,
    trackNewsletterSignup,
    trackFormSubmission,
  };
}

export default function Analytics() {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("analytics-consent");
    if (stored === "true") {
      setConsent(true);
      initGA4();
      initMetaPixel();
      initSectionTracking();
    }

    // Scroll depth tracking
    let maxDepth = 0;
    const handleScroll = () => {
      const depth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      if (depth > maxDepth && depth % 25 === 0) {
        maxDepth = depth;
        trackScrollDepth(depth);
      }
    };

    if (stored === "true") {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen for consent changes
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.consent) {
        setConsent(true);
        initGA4();
        initMetaPixel();
        initSectionTracking();
      } else {
        setConsent(false);
      }
    };
    window.addEventListener("analytics-consent", handler);
    return () => window.removeEventListener("analytics-consent", handler);
  }, []);

  return null;
}

// Type declarations for global objects
declare global {
  interface Window {
    dataLayer?: unknown[][];
    _fbq?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}
