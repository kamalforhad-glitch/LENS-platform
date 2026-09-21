import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en/common.json";
import bn from "@/locales/bn/common.json";

const savedLocale = typeof window !== "undefined"
  ? localStorage.getItem("lens-locale") || "en"
  : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    bn: { common: bn },
  },
  lng: savedLocale,
  fallbackLng: "en",
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

export function setLocale(locale: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("lens-locale", locale);
  }
  i18n.changeLanguage(locale);
}

export function getLocale(): string {
  return i18n.language || "en";
}
