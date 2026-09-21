"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

export default function FloatingAIButton() {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <a
      href="/assistant"
      aria-label={t("ai.button_aria_label")}
      className="fixed bottom-6 right-6 z-50 group"
    >
      <span className={`absolute inset-0 rounded-full bg-teal-400/20 ${prefersReducedMotion ? "" : "animate-ping"}`} style={{ animationDuration: "2s" }} />
      <span className="relative flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-teal-400/20">
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">{t("nav.assistant")}</span>
      </span>
    </a>
  );
}
