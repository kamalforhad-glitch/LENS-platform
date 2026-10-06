// ============================================================
// SiteHeaderClient — new IA navigation (Phase A).
//
// - Disclosure-style dropdowns: toggle on click/Enter/Space,
//   hover intent on desktop, full keyboard support (Esc, arrows).
// - Mobile sheet with single-open accordions, focus trap,
//   body scroll lock, Esc to close.
// - CSS transitions only — no GSAP/Three.js in navigation.
// - "soon" entries (Mojo, BPFI, ...) render as non-links with a
//   "Soon" badge: no invented routes, no 404s.
// - Donate CTA points at /contact until the /donate page lands
//   (Phase B). No payment processing here.
// ============================================================
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import {
  DONATE_CTA,
  type NavChild,
  type NavEntry,
  type NavLabel,
} from "@/lib/site-navigation";

function useNavLabel() {
  const { t, i18n } = useTranslation();
  return useCallback(
    (label: NavLabel) => {
      if (label.kind === "key") return t(label.key);
      return i18n.language === "bn" ? label.bn : label.en;
    },
    [t, i18n],
  );
}

function isEntryActive(pathname: string, entry: NavEntry): boolean {
  if (entry.href) {
    if (entry.href === "/") return pathname === "/";
    if (pathname === entry.href || pathname.startsWith(`${entry.href}/`)) return true;
  }
  return entry.children?.some((child) => isEntryActive(pathname, child as NavEntry)) ?? false;
}

function SiteLogo({ subtitle, onNavigate }: { subtitle: string; onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex items-center gap-3 shrink-0 group" aria-label="LENS — home">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-teal-500/30 transition-shadow duration-300">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path d="M12 2L2 19h20L12 2z" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>
      <div className="hidden sm:block">
        <span className="text-xl font-bold tracking-tight text-white">LENS</span>
        <span className="block text-[10px] leading-tight -mt-0.5 text-slate-400">{subtitle}</span>
      </div>
    </Link>
  );
}

function SoonBadge() {
  const { t } = useTranslation();
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-gold-500/40 bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-400">
      {t("sitenav.comingSoon")}
    </span>
  );
}

export default function SiteHeaderClient({ entries }: { entries: NavEntry[] }) {
  const { t } = useTranslation();
  const resolveLabel = useNavLabel();
  const pathname = usePathname() ?? "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const headerRef = useRef<HTMLElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const menuListRefs = useRef(new Map<string, HTMLUListElement>());
  const refocusToggleOnClose = useRef(false);

  const isHome = pathname === "/";
  const solid = scrolled || !isHome;

  // --- scroll state -------------------------------------------------
  useEffect(() => {
    let raf = 0;
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

  // --- close the open desktop dropdown when a nav link is activated --
  // (event-driven; no pathname effect needed) -------------------------
  const onDesktopNavClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) setOpenMenu(null);
  }, []);

  // --- auto-close mobile sheet at desktop breakpoint -----------------
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // --- outside click closes desktop dropdowns ------------------------
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  // --- mobile sheet: scroll lock, focus trap, Esc --------------------
  useEffect(() => {
    if (!mobileOpen) {
      if (refocusToggleOnClose.current) {
        refocusToggleOnClose.current = false;
        mobileToggleRef.current?.focus();
      }
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = mobilePanelRef.current;
    panel?.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        refocusToggleOnClose.current = true;
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ).filter((el) => el.getClientRects().length > 0);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const closeMenuAndRefocus = useCallback((id: string) => {
    setOpenMenu(null);
    const toggle = headerRef.current?.querySelector<HTMLButtonElement>(
      `button[data-menu-toggle="${id}"]`,
    );
    toggle?.focus();
  }, []);

  const focusMenuItem = useCallback((menuId: string, index: number) => {
    const list = menuListRefs.current.get(menuId);
    const items = list?.querySelectorAll<HTMLElement>("a[href]");
    if (!items || items.length === 0) return;
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    items[clamped].focus();
  }, []);

  const onMenuListKeyDown = useCallback(
    (e: React.KeyboardEvent, menuId: string, itemIndex: number, itemCount: number) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenuAndRefocus(menuId);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        focusMenuItem(menuId, (itemIndex + 1) % itemCount);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusMenuItem(menuId, (itemIndex - 1 + itemCount) % itemCount);
      } else if (e.key === "Home") {
        e.preventDefault();
        focusMenuItem(menuId, 0);
      } else if (e.key === "End") {
        e.preventDefault();
        focusMenuItem(menuId, itemCount - 1);
      } else if (e.key === "Tab") {
        setOpenMenu(null);
      }
    },
    [closeMenuAndRefocus, focusMenuItem],
  );

  const renderChildLink = (child: NavChild, menuId: string, itemIndex: number, itemCount: number) => {
    const label = resolveLabel(child.label);
    if (child.status === "live" && child.href) {
      const active = pathname === child.href;
      return (
        <Link
          href={child.href}
          target={child.target === "_blank" ? "_blank" : undefined}
          rel={child.target === "_blank" ? "noopener noreferrer" : undefined}
          aria-current={active ? "page" : undefined}
          onKeyDown={(e) => onMenuListKeyDown(e, menuId, itemIndex, itemCount)}
          className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg ${
            active ? "text-teal-300 bg-teal-500/10" : "text-slate-300 hover:text-white hover:bg-white/5"
          }`}
        >
          {label}
        </Link>
      );
    }
    return (
      <span aria-disabled="true" className="flex items-center px-4 py-2.5 text-sm text-slate-500">
        {label}
        <SoonBadge />
      </span>
    );
  };

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        solid
          ? "bg-navy-950/80 backdrop-blur-xl shadow-lg shadow-navy-950/20 border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <SiteLogo subtitle={t("site.subtitle")} onNavigate={() => setOpenMenu(null)} />

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary" onClick={onDesktopNavClick}>
            <ul className="flex items-center gap-1">
              {entries.map((entry) => {
                const active = isEntryActive(pathname, entry);
                const hasMenu = !!entry.children?.length;
                const menuOpen = openMenu === entry.id;
                const menuId = `sitenav-menu-${entry.id}`;
                return (
                  <li
                    key={entry.id}
                    className="relative"
                    onMouseEnter={() => hasMenu && setOpenMenu(entry.id)}
                    onMouseLeave={() => hasMenu && setOpenMenu((cur) => (cur === entry.id ? null : cur))}
                  >
                    <div className="flex items-center">
                      {entry.href ? (
                        <Link
                          href={entry.href}
                          aria-current={active && !hasMenu ? "page" : undefined}
                          className={`relative px-3 py-2 text-sm font-medium transition-colors rounded-md group ${
                            active ? "text-white" : "text-white/70 hover:text-white"
                          }`}
                        >
                          {resolveLabel(entry.label)}
                          <span
                            className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-teal-400 rounded-full transition-all duration-300 ${
                              active ? "w-4/5" : "w-0 group-hover:w-4/5"
                            }`}
                          />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          data-menu-toggle={entry.id}
                          aria-expanded={hasMenu ? menuOpen : undefined}
                          aria-controls={hasMenu ? menuId : undefined}
                          aria-current={active ? "true" : undefined}
                          onClick={() => hasMenu && setOpenMenu(menuOpen ? null : entry.id)}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown" && hasMenu) {
                              e.preventDefault();
                              setOpenMenu(entry.id);
                              requestAnimationFrame(() => focusMenuItem(entry.id, 0));
                            } else if (e.key === "Escape" && menuOpen) {
                              closeMenuAndRefocus(entry.id);
                            }
                          }}
                          className={`relative flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                            active ? "text-white" : "text-white/70 hover:text-white"
                          }`}
                        >
                          {resolveLabel(entry.label)}
                          {hasMenu && (
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      )}
                      {entry.href && hasMenu && (
                        <button
                          type="button"
                          data-menu-toggle={entry.id}
                          aria-expanded={menuOpen}
                          aria-controls={menuId}
                          aria-label={`${menuOpen ? t("sitenav.closeSubmenu") : t("sitenav.openSubmenu")}: ${resolveLabel(entry.label)}`}
                          onClick={() => setOpenMenu(menuOpen ? null : entry.id)}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setOpenMenu(entry.id);
                              requestAnimationFrame(() => focusMenuItem(entry.id, 0));
                            } else if (e.key === "Escape" && menuOpen) {
                              closeMenuAndRefocus(entry.id);
                            }
                          }}
                          className="p-1.5 -ml-1 text-white/60 hover:text-white transition-colors rounded-md"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </div>

                    {hasMenu && menuOpen && (
                      <ul
                        id={menuId}
                        ref={(el) => {
                          if (el) menuListRefs.current.set(entry.id, el);
                          else menuListRefs.current.delete(entry.id);
                        }}
                        aria-label={resolveLabel(entry.label)}
                        className="animate-fade-in-up absolute top-full left-0 mt-2 min-w-60 rounded-2xl border border-white/10 bg-navy-900/95 backdrop-blur-xl p-2 shadow-2xl shadow-navy-950/50"
                      >
                        {entry.children!.map((child, i) => (
                          <li key={child.id}>
                            {renderChildLink(child, entry.id, i, entry.children!.length)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {/* Informational /donate page; no payment processing (Phase B scope). */}
            <Link
              href={DONATE_CTA.href}
              className="hidden sm:inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-white text-sm font-semibold rounded-full hover:from-gold-400 hover:to-gold-300 transition-all shadow-md hover:shadow-lg hover:shadow-gold-500/20"
            >
              {t(DONATE_CTA.label.kind === "key" ? DONATE_CTA.label.key : "nav.donate")}
            </Link>
            <button
              ref={mobileToggleRef}
              type="button"
              className="lg:hidden p-2 text-white/60 hover:text-teal-400 transition-colors"
              onClick={() => {
                if (mobileOpen) refocusToggleOnClose.current = false;
                setMobileOpen(!mobileOpen);
              }}
              aria-label={mobileOpen ? t("sitenav.closeMenu") : t("sitenav.openMenu")}
              aria-expanded={mobileOpen}
              aria-controls="sitenav-mobile-menu"
            >
              {mobileOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile sheet */}
        {mobileOpen && (
          <div
            ref={mobilePanelRef}
            id="sitenav-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={t("sitenav.openMenu")}
            className="lg:hidden border-t border-white/10 bg-navy-950/95 backdrop-blur-xl py-4 max-h-[calc(100dvh-4rem)] overflow-y-auto"
          >
            <ul className="space-y-1">
              {entries.map((entry) => {
                const active = isEntryActive(pathname, entry);
                const hasMenu = !!entry.children?.length;
                const expanded = openSection === entry.id;
                const sectionId = `sitenav-section-${entry.id}`;
                return (
                  <li key={entry.id} className="px-2">
                    {hasMenu ? (
                      <>
                        <div
                          className={`flex items-center rounded-lg transition-colors ${
                            active ? "bg-white/5" : ""
                          }`}
                        >
                          {entry.href ? (
                            <Link
                              href={entry.href}
                              onClick={() => setMobileOpen(false)}
                              className={`flex-1 block px-3 py-3 text-sm font-semibold rounded-lg transition-colors ${
                                active ? "text-teal-300" : "text-white/80 hover:text-white"
                              }`}
                            >
                              {resolveLabel(entry.label)}
                            </Link>
                          ) : (
                            <span
                              aria-current={active ? "true" : undefined}
                              className={`flex-1 block px-3 py-3 text-sm font-semibold ${
                                active ? "text-teal-300" : "text-white/80"
                              }`}
                            >
                              {resolveLabel(entry.label)}
                            </span>
                          )}
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={sectionId}
                            aria-label={`${expanded ? t("sitenav.closeSubmenu") : t("sitenav.openSubmenu")}: ${resolveLabel(entry.label)}`}
                            onClick={() => setOpenSection(expanded ? null : entry.id)}
                            className="p-3 text-white/60 hover:text-teal-300 transition-colors"
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                        {expanded && (
                          <ul id={sectionId} aria-label={resolveLabel(entry.label)} className="ml-3 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                            {entry.children!.map((child) =>
                              child.status === "live" && child.href ? (
                                <li key={child.id}>
                                  <Link
                                    href={child.href}
                                    onClick={() => setMobileOpen(false)}
                                    aria-current={pathname === child.href ? "page" : undefined}
                                    className={`block px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                      pathname === child.href
                                        ? "text-teal-300 bg-teal-500/10"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                    }`}
                                  >
                                    {resolveLabel(child.label)}
                                  </Link>
                                </li>
                              ) : (
                                <li key={child.id}>
                                  <span aria-disabled="true" className="flex items-center px-3 py-2.5 text-sm text-slate-500">
                                    {resolveLabel(child.label)}
                                    <SoonBadge />
                                  </span>
                                </li>
                              ),
                            )}
                          </ul>
                        )}
                      </>
                    ) : entry.href ? (
                      <Link
                        href={entry.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={pathname === entry.href ? "page" : undefined}
                        className={`block px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                          active ? "text-teal-300 bg-teal-500/10" : "text-white/70 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {resolveLabel(entry.label)}
                      </Link>
                    ) : (
                      <span aria-disabled="true" className="flex items-center px-3 py-3 text-sm font-medium text-slate-500">
                        {resolveLabel(entry.label)}
                        <SoonBadge />
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="px-4 pt-3 space-y-2">
              <LanguageSwitcher />
              {/* Informational /donate page; no payment processing (Phase B scope). */}
              <Link
                href={DONATE_CTA.href}
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-white text-sm font-semibold rounded-full w-full justify-center"
              >
                {t("nav.donate")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
