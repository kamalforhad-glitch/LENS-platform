"use client";

import { useTranslation } from "react-i18next";
import { setLocale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language || "en";

  const toggle = () => {
    const next = current === "en" ? "bn" : "en";
    setLocale(next);
  };

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 text-xs font-bold rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-95"
      title={current === "en" ? "বাংলায় পরিবর্তন করুন" : "Switch to English"}
      aria-label={current === "en" ? "Switch to Bengali" : "Switch to English"}
    >
      {current === "en" ? "বাং" : "EN"}
    </button>
  );
}
