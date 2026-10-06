"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  // Keep <html lang> in sync with the active locale so screen readers,
  // hyphenation, and the html[lang="bn"] font rules actually apply.
  // (Root layout hardcodes lang="en"; this corrects it client-side.)
  useEffect(() => {
    const sync = (lng: string) => {
      const active = (lng || "en").split("-")[0];
      if (document.documentElement.lang !== active) {
        document.documentElement.lang = active;
      }
    };
    sync(i18n.language);
    i18n.on("languageChanged", sync);
    return () => {
      i18n.off("languageChanged", sync);
    };
  }, []);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
