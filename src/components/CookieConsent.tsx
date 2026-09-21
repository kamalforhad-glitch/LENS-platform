"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("analytics-consent");
      if (!stored) {
        const timer = setTimeout(() => setShow(true), 2000);
        return () => clearTimeout(timer);
      }
    } catch {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("analytics-consent", "true");
    } catch {}
    window.dispatchEvent(
      new CustomEvent("analytics-consent", { detail: { consent: true } })
    );
    setShow(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("analytics-consent", "false");
    } catch {}
    window.dispatchEvent(
      new CustomEvent("analytics-consent", { detail: { consent: false } })
    );
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9990] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Cookie Preferences
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We use analytics cookies to understand how you interact with our
              website and improve your experience. You can choose to accept or
              decline non-essential cookies.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-xs font-medium text-white bg-teal-500 hover:bg-teal-400 rounded-full transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="mt-3 text-[10px] text-teal-600 hover:text-teal-500 underline"
        >
          {expanded ? "Hide details" : "Cookie policy & details"}
        </button>
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
            <p>
              <strong>Essential:</strong> Required for site functionality.
              Cannot be disabled.
            </p>
            <p>
              <strong>Analytics:</strong> Google Analytics & Meta Pixel for
              measuring site usage. Only loaded with your consent.
            </p>
            <p>
              View our{" "}
              <a href="/privacy" className="text-teal-600 underline">
                Privacy Policy
              </a>{" "}
              for full details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
