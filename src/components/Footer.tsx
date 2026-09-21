"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MagneticButton from "./MagneticButton";

gsap.registerPlugin(ScrollTrigger);

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function RssIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M19.199 24C19.199 13.467 10.533 4.8 0 4.8V0c13.165 0 24 10.835 24 24h-4.801zM3.291 17.415c1.814 0 3.293 1.479 3.293 3.295 0 1.813-1.479 3.293-3.293 3.293-1.813 0-3.293-1.48-3.293-3.293 0-1.816 1.48-3.295 3.293-3.295zM12.096 24c0-6.627-5.373-12-12.001-12C5.468 12 .097 17.373.097 24h4.8c0-4.418 3.588-8.002 8.001-8.002 4.418 0 8.001 3.584 8.001 8.002h4.8c0-6.627-5.373-12-11.999-12z" />
    </svg>
  );
}

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const { t } = useTranslation();

  const quickLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.research"), href: "/research" },
    { label: t("nav.programs"), href: "/programs" },
    { label: t("nav.publications"), href: "/publications" },
  ];

  const supportLinks = [
    { label: t("nav.events"), href: "/events" },
    { label: t("nav.blog"), href: "/blog" },
    { label: t("nav.resources"), href: "/resources" },
    { label: t("nav.partnerships"), href: "/partnerships" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  const socialLinks = [
    { Icon: FacebookIcon, href: "https://www.facebook.com/lensorgbd", label: "Facebook" },
    { Icon: XIcon, href: "https://twitter.com/lensorgbd", label: "X" },
    { Icon: LinkedinIcon, href: "https://www.linkedin.com/company/lensorgbd", label: "LinkedIn" },
    { Icon: YoutubeIcon, href: "https://www.youtube.com/@lensorgbd", label: "YouTube" },
    { Icon: RssIcon, href: "/rss.xml", label: "RSS" },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".footer-col",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 85%",
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="bg-navy-950 text-slate-300 pt-16 pb-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-teal-500/3 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="footer-col sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2L2 19h20L12 2z" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold text-white">LENS</span>
                <span className="block text-[10px] text-slate-400 leading-tight">{t("site.subtitle")}</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{t("footer.about_text")}</p>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-gold-500 mb-4">{t("footer.quick_links")}</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-400 hover:text-teal-400 transition-colors duration-300">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer-col">
            <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-gold-500 mb-4">{t("footer.support")}</h4>
            <ul className="space-y-2.5">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-400 hover:text-teal-400 transition-colors duration-300">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div className="footer-col">
            <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-gold-500 mb-4">{t("footer.follow_us")}</h4>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <MagneticButton
                  key={social.label}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-teal-500/20 hover:text-teal-400 transition-all duration-300"
                >
                  <social.Icon />
                </MagneticButton>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 gap-4 text-xs text-slate-500">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <div className="flex gap-4 items-center">
            <a href="/privacy" className="hover:text-teal-400 transition-colors duration-300">{t("footer.privacy_policy")}</a>
            <span className="text-slate-600">|</span>
            <a href="/terms" className="hover:text-teal-400 transition-colors duration-300">{t("footer.terms")}</a>
            <span className="text-slate-600">|</span>
            <a href="/admin/login" className="text-slate-400 hover:text-teal-400 transition-colors duration-300">Admin</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
