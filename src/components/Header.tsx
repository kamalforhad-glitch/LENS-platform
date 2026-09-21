"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import MagneticButton from "./MagneticButton";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const navLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.research"), href: "/research" },
    { label: t("nav.programs"), href: "/programs" },
    { label: t("nav.publications"), href: "/publications" },
    { label: t("nav.media"), href: "/media" },
    { label: t("nav.partnerships"), href: "/partnerships" },
    { label: t("nav.events"), href: "/events" },
    { label: t("nav.blog"), href: "/blog" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  useEffect(() => {
    let raf: number;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 50));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (navRef.current) {
      const links = navRef.current.querySelectorAll("a");
      gsap.fromTo(
        links,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, delay: 0.5, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (mobileMenuRef.current) {
      if (mobileOpen) {
        gsap.fromTo(
          mobileMenuRef.current,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
        );
        const items = mobileMenuRef.current.querySelectorAll("a");
        gsap.fromTo(
          items,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.3, stagger: 0.04, delay: 0.1, ease: "power2.out" }
        );
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-navy-950/80 backdrop-blur-xl shadow-lg shadow-navy-950/20 border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-teal-500/30 transition-shadow duration-300">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2L2 19h20L12 2z" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold tracking-tight text-white">
                LENS
              </span>
              <span className={`block text-[10px] leading-tight -mt-0.5 transition-colors duration-500 ${scrolled ? "text-slate-400" : "text-white/60"}`}>
                {t("site.subtitle")}
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav ref={navRef} className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-md group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-teal-400 rounded-full group-hover:w-4/5 transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <MagneticButton
              href="/contact"
              className="hidden sm:inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-white text-sm font-semibold rounded-full hover:from-gold-400 hover:to-gold-300 transition-all shadow-md hover:shadow-lg hover:shadow-gold-500/20"
            >
              {t("nav.donate")}
            </MagneticButton>
            <button
              className="lg:hidden p-2 text-white/60 hover:text-teal-400 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? t("common.close") : "Menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div
            ref={mobileMenuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            className="lg:hidden border-t border-white/10 bg-navy-950/95 backdrop-blur-xl py-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-sm font-medium text-white/70 hover:text-teal-400 hover:bg-white/5 rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="px-4 pt-3 space-y-2">
              <LanguageSwitcher />
              <a
                href="/contact"
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-white text-sm font-semibold rounded-full w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                {t("nav.donate")}
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
