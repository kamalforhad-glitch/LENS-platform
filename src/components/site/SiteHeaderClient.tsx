// ============================================================
// SiteHeaderClient — Complete Bilingual Navigation & CMS Control
//
// - Disclosure-style dropdowns with multi-level nested support.
// - Keyboard navigation (Esc, Arrows, Tab) and outside click handling.
// - Real icon rendering via Lucide (never display literal icon strings).
// - Independent English and Bangla labels, descriptions, and badges.
// - Status handling: Active vs Soon vs Draft vs Disabled.
// - Fully responsive at 1440px, 768px, and 390px.
// ============================================================
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Home,
  Info,
  BookOpen,
  GraduationCap,
  FolderKanban,
  BarChart3,
  Users,
  Calendar,
  PenTool,
  Mail,
  FileText,
  Camera,
  Video,
  CheckCircle,
  TrendingUp,
  Globe,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher";
import {
  DONATE_CTA,
  type NavChild,
  type NavEntry,
  type NavLabel,
} from "@/lib/site-navigation";

const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  about: Info,
  info: Info,
  research: BarChart3,
  publications: BookOpen,
  book: BookOpen,
  programs: GraduationCap,
  courses: GraduationCap,
  graduation: GraduationCap,
  resources: FolderKanban,
  folder: FolderKanban,
  events: Calendar,
  calendar: Calendar,
  blog: PenTool,
  pen: PenTool,
  contact: Mail,
  mail: Mail,
  team: Users,
  users: Users,
  camera: Camera,
  photography: Camera,
  video: Video,
  check: CheckCircle,
  trending: TrendingUp,
  globe: Globe,
  award: Award,
  layers: Layers,
  sparkles: Sparkles,
  external: ExternalLink,
  filetext: FileText,
};

function NavItemIcon({ name, className = "w-4 h-4 shrink-0" }: { name?: string; className?: string }) {
  if (!name || typeof name !== "string") return null;
  const key = name.trim().toLowerCase().replace(/^lucide-|^icon-/, "");
  const IconComponent = ICON_MAP[key];
  if (!IconComponent) return null; // Never display literal icon name
  return <IconComponent className={className} aria-hidden="true" />;
}

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

function isEntryActive(pathname: string, entry: NavEntry | NavChild): boolean {
  if (entry.href) {
    if (entry.href === "/") return pathname === "/";
    if (pathname === entry.href || pathname.startsWith(`${entry.href}/`)) return true;
  }
  return entry.children?.some((child) => isEntryActive(pathname, child)) ?? false;
}

function SiteLogo({
  subtitle,
  logoUrl,
  destination = "/",
  altText = "LENS — Lighthouse for Evolving Narrative Systems",
  onNavigate,
}: {
  subtitle: string;
  logoUrl?: string;
  destination?: string;
  altText?: string;
  onNavigate?: () => void;
}) {
  const src = logoUrl || "/images/logo/lens-logo.png";
  const isRemote = /^https?:\/\//i.test(src);
  return (
    <Link href={destination} onClick={onNavigate} className="flex items-center gap-3 shrink-0 group py-1" aria-label={altText}>
      <div className="flex flex-col justify-center">
        {isRemote ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={altText} className="h-7 sm:h-8 w-auto object-contain transition-opacity duration-300 group-hover:opacity-90" />
        ) : (
          <Image
            src={src}
            alt={altText}
            width={126}
            height={32}
            className="h-7 sm:h-8 w-auto object-contain transition-opacity duration-300 group-hover:opacity-90"
            priority
          />
        )}
        <span className="hidden sm:block text-[9px] lg:text-[10px] leading-tight mt-0.5 text-slate-400 font-normal">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}

function StatusBadge({
  badgeText,
  badgeTextBn,
  badgeStyle = "gold",
  isSoon,
  isBn,
}: {
  badgeText?: string;
  badgeTextBn?: string;
  badgeStyle?: string;
  isSoon?: boolean;
  isBn?: boolean;
}) {
  const { t } = useTranslation();
  const text = isBn
    ? (badgeTextBn || (badgeText ? badgeText : (isSoon ? t("sitenav.comingSoon") : "")))
    : (badgeText || (isSoon ? "SOON" : ""));
  if (!text) return null;

  const styleClasses: Record<string, string> = {
    gold: "border-gold-500/40 bg-gold-500/10 text-gold-400",
    teal: "border-teal-500/40 bg-teal-500/10 text-teal-300",
    blue: "border-blue-500/40 bg-blue-500/10 text-blue-300",
    slate: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  };

  const currentStyle = styleClasses[badgeStyle || "gold"] || styleClasses.gold;

  return (
    <span className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${currentStyle}`}>
      {text}
    </span>
  );
}

export default function SiteHeaderClient({
  entries,
  logoUrl,
  settings,
}: {
  entries: NavEntry[];
  logoUrl?: string;
  settings?: Record<string, { value: string; valueBn: string }>;
}) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const resolveLabel = useNavLabel();
  const pathname = usePathname() ?? "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openSubSection, setOpenSubSection] = useState<string | null>(null);

  const headerRef = useRef<HTMLElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const menuListRefs = useRef(new Map<string, HTMLUListElement>());
  const refocusToggleOnClose = useRef(false);

  const isHome = pathname === "/";
  const solid = scrolled || !isHome;

  // Filter out items not visible on desktop
  const desktopEntries = entries.filter((e) => e.desktopVisible !== false);
  // Filter out items not visible on mobile
  const mobileEntries = entries.filter((e) => e.mobileVisible !== false);

  // Settings resolution
  const announcementEnabled = settings?.announcement_enabled?.value === "true";
  const announcementText = isBn
    ? (settings?.announcement_text?.valueBn || settings?.announcement_text?.value)
    : (settings?.announcement_text?.value || "");
  const announcementLink = settings?.announcement_link?.value || "/about";
  const logoDestination = settings?.site_logo_destination?.value || "/";
  const logoAlt = (isBn ? settings?.site_logo_alt?.valueBn : settings?.site_logo_alt?.value)
    || "LENS — Lighthouse for Evolving Narrative Systems";
  const ctaVisible = settings?.header_cta_visible?.value !== "false";
  const ctaLabel = (isBn ? settings?.header_cta_label?.valueBn : settings?.header_cta_label?.value)
    || (DONATE_CTA.label.kind === "key" ? t(DONATE_CTA.label.key) : t("nav.donate"));
  const ctaUrl = settings?.header_cta_url?.value || DONATE_CTA.href;

  // Scroll state
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

  // Close desktop dropdown when navigation link activated
  const onDesktopNavClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a")) {
      setOpenMenu(null);
      setOpenSubMenu(null);
    }
  }, []);

  // Auto-close mobile sheet at desktop breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Outside click closes desktop dropdowns
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setOpenSubMenu(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  // Mobile sheet: scroll lock, focus trap, Esc
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
    setOpenSubMenu(null);
    const toggle = headerRef.current?.querySelector<HTMLButtonElement>(
      `button[data-menu-toggle="${id}"]`,
    );
    toggle?.focus();
  }, []);

  const focusMenuItem = useCallback((menuId: string, index: number) => {
    const list = menuListRefs.current.get(menuId);
    const items = list?.querySelectorAll<HTMLElement>("a[href], button");
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
        setOpenSubMenu(null);
      }
    },
    [closeMenuAndRefocus, focusMenuItem],
  );

  const renderChildItem = (child: NavChild, menuId: string, itemIndex: number, itemCount: number) => {
    const label = resolveLabel(child.label);
    const hasNested = !!child.children?.length;
    const isSoon = child.status === "soon";
    const isClickable = child.isClickable !== false && !!child.href;
    const active = isEntryActive(pathname, child);

    return (
      <div
        key={child.id}
        className="relative group/nested"
        onMouseEnter={() => hasNested && setOpenSubMenu(child.id)}
        onMouseLeave={() => hasNested && setOpenSubMenu((cur) => (cur === child.id ? null : cur))}
      >
        {isClickable ? (
          <Link
            href={child.href!}
            target={child.target === "_blank" ? "_blank" : undefined}
            rel={child.target === "_blank" ? "noopener noreferrer" : undefined}
            aria-current={active && !hasNested ? "page" : undefined}
            onKeyDown={(e) => onMenuListKeyDown(e, menuId, itemIndex, itemCount)}
            className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors rounded-xl ${
              active ? "text-teal-300 bg-teal-500/10" : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              {child.icon && <NavItemIcon name={child.icon} />}
              <span className="truncate">{label}</span>
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <StatusBadge
                badgeText={child.badgeText}
                badgeTextBn={child.badgeTextBn}
                badgeStyle={child.badgeStyle}
                isSoon={isSoon}
                isBn={isBn}
              />
              {hasNested && <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
            </div>
          </Link>
        ) : (
          <div
            className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm rounded-xl ${
              isSoon ? "text-slate-400" : "text-slate-400"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              {child.icon && <NavItemIcon name={child.icon} />}
              <span className="truncate">{label}</span>
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <StatusBadge
                badgeText={child.badgeText}
                badgeTextBn={child.badgeTextBn}
                badgeStyle={child.badgeStyle}
                isSoon={isSoon}
                isBn={isBn}
              />
              {hasNested && <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
            </div>
          </div>
        )}

        {/* Nested Submenu (Flyout) */}
        {hasNested && openSubMenu === child.id && (
          <ul
            aria-label={label}
            className="animate-fade-in-up absolute top-0 left-full ml-1.5 min-w-56 rounded-2xl border border-white/10 bg-navy-900/98 backdrop-blur-2xl p-2 shadow-2xl shadow-navy-950/60 z-50"
          >
            {child.children!.map((subChild) => {
              const subLabel = resolveLabel(subChild.label);
              const subActive = isEntryActive(pathname, subChild);
              const subClickable = subChild.isClickable !== false && !!subChild.href;
              const subSoon = subChild.status === "soon";

              return (
                <li key={subChild.id}>
                  {subClickable ? (
                    <Link
                      href={subChild.href!}
                      target={subChild.target === "_blank" ? "_blank" : undefined}
                      rel={subChild.target === "_blank" ? "noopener noreferrer" : undefined}
                      aria-current={subActive ? "page" : undefined}
                      className={`flex items-center justify-between gap-3 px-3 py-2 text-xs transition-colors rounded-lg ${
                        subActive ? "text-teal-300 bg-teal-500/10" : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {subChild.icon && <NavItemIcon name={subChild.icon} className="w-3.5 h-3.5" />}
                        <span className="truncate">{subLabel}</span>
                      </span>
                      <StatusBadge
                        badgeText={subChild.badgeText}
                        badgeTextBn={subChild.badgeTextBn}
                        badgeStyle={subChild.badgeStyle}
                        isSoon={subSoon}
                        isBn={isBn}
                      />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-slate-400">
                      <span className="flex items-center gap-2 truncate">
                        {subChild.icon && <NavItemIcon name={subChild.icon} className="w-3.5 h-3.5" />}
                        <span className="truncate">{subLabel}</span>
                      </span>
                      <StatusBadge
                        badgeText={subChild.badgeText}
                        badgeTextBn={subChild.badgeTextBn}
                        badgeStyle={subChild.badgeStyle}
                        isSoon={subSoon}
                        isBn={isBn}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
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
      {/* Announcement Bar */}
      {announcementEnabled && announcementText && (
        <div className="bg-gradient-to-r from-teal-900/90 via-navy-900/95 to-teal-900/90 text-white text-xs py-1.5 px-4 border-b border-teal-500/20 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
            {announcementLink ? (
              <Link href={announcementLink} className="hover:text-teal-300 font-medium transition-colors underline decoration-teal-400/40 underline-offset-2 truncate">
                {announcementText}
              </Link>
            ) : (
              <span className="font-medium truncate">{announcementText}</span>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <SiteLogo
            subtitle={t("site.subtitle")}
            logoUrl={logoUrl}
            destination={logoDestination}
            altText={logoAlt}
            onNavigate={() => {
              setOpenMenu(null);
              setOpenSubMenu(null);
            }}
          />

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary" onClick={onDesktopNavClick}>
            <ul className="flex items-center gap-1">
              {desktopEntries.map((entry) => {
                const active = isEntryActive(pathname, entry);
                const hasMenu = !!entry.children?.length && entry.openSubmenu !== false;
                const menuOpen = openMenu === entry.id;
                const menuId = `sitenav-menu-${entry.id}`;
                const isClickable = entry.isClickable !== false && !!entry.href;

                return (
                  <li
                    key={entry.id}
                    className="relative"
                    onMouseEnter={() => hasMenu && setOpenMenu(entry.id)}
                    onMouseLeave={() => {
                      if (hasMenu) {
                        setOpenMenu((cur) => (cur === entry.id ? null : cur));
                        setOpenSubMenu(null);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      {isClickable ? (
                        <Link
                          href={entry.href!}
                          target={entry.target === "_blank" ? "_blank" : undefined}
                          rel={entry.target === "_blank" ? "noopener noreferrer" : undefined}
                          aria-current={active && !hasMenu ? "page" : undefined}
                          className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-md group ${
                            active ? "text-white" : "text-white/70 hover:text-white"
                          }`}
                        >
                          {entry.icon && <NavItemIcon name={entry.icon} />}
                          <span>{resolveLabel(entry.label)}</span>
                          <StatusBadge
                            badgeText={entry.badgeText}
                            badgeTextBn={entry.badgeTextBn}
                            badgeStyle={entry.badgeStyle}
                            isSoon={entry.status === "soon"}
                            isBn={isBn}
                          />
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
                          className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                            active ? "text-white" : "text-white/70 hover:text-white"
                          }`}
                        >
                          {entry.icon && <NavItemIcon name={entry.icon} />}
                          <span>{resolveLabel(entry.label)}</span>
                          <StatusBadge
                            badgeText={entry.badgeText}
                            badgeTextBn={entry.badgeTextBn}
                            badgeStyle={entry.badgeStyle}
                            isSoon={entry.status === "soon"}
                            isBn={isBn}
                          />
                          {hasMenu && (
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      )}
                      {isClickable && hasMenu && (
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
                        className="animate-fade-in-up absolute top-full left-0 mt-2 min-w-64 rounded-2xl border border-white/10 bg-navy-900/98 backdrop-blur-2xl p-2 shadow-2xl shadow-navy-950/60 z-50"
                      >
                        {entry.children!.map((child, i) => (
                          <li key={child.id}>
                            {renderChildItem(child, entry.id, i, entry.children!.length)}
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
            {/* Configurable Action / Support LENS CTA button */}
            {ctaVisible && (
              <Link
                href={ctaUrl}
                className="hidden sm:inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-white text-sm font-semibold rounded-full hover:from-gold-400 hover:to-gold-300 transition-all shadow-md hover:shadow-lg hover:shadow-gold-500/20"
              >
                {ctaLabel}
              </Link>
            )}
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
            className="lg:hidden border-t border-white/10 bg-navy-950/98 backdrop-blur-2xl py-4 max-h-[calc(100dvh-4rem)] overflow-y-auto"
          >
            <ul className="space-y-1">
              {mobileEntries.map((entry) => {
                const active = isEntryActive(pathname, entry);
                const hasMenu = !!entry.children?.length && entry.openSubmenu !== false;
                const expanded = openSection === entry.id;
                const sectionId = `sitenav-section-${entry.id}`;
                const isClickable = entry.isClickable !== false && !!entry.href;

                return (
                  <li key={entry.id} className="px-2">
                    {hasMenu ? (
                      <>
                        <div
                          className={`flex items-center rounded-lg transition-colors ${
                            active ? "bg-white/5" : ""
                          }`}
                        >
                          {isClickable ? (
                            <Link
                              href={entry.href!}
                              onClick={() => setMobileOpen(false)}
                              className={`flex-1 flex items-center justify-between px-3 py-3 text-sm font-semibold rounded-lg transition-colors ${
                                active ? "text-teal-300" : "text-white/80 hover:text-white"
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                {entry.icon && <NavItemIcon name={entry.icon} />}
                                <span className="truncate">{resolveLabel(entry.label)}</span>
                              </span>
                              <StatusBadge
                                badgeText={entry.badgeText}
                                badgeTextBn={entry.badgeTextBn}
                                badgeStyle={entry.badgeStyle}
                                isSoon={entry.status === "soon"}
                                isBn={isBn}
                              />
                            </Link>
                          ) : (
                            <span
                              aria-current={active ? "true" : undefined}
                              className={`flex-1 flex items-center justify-between px-3 py-3 text-sm font-semibold ${
                                active ? "text-teal-300" : "text-white/80"
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                {entry.icon && <NavItemIcon name={entry.icon} />}
                                <span className="truncate">{resolveLabel(entry.label)}</span>
                              </span>
                              <StatusBadge
                                badgeText={entry.badgeText}
                                badgeTextBn={entry.badgeTextBn}
                                badgeStyle={entry.badgeStyle}
                                isSoon={entry.status === "soon"}
                                isBn={isBn}
                              />
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
                            {entry.children!.map((child) => {
                              const childLabel = resolveLabel(child.label);
                              const childHasNested = !!child.children?.length;
                              const childExpanded = openSubSection === child.id;
                              const childClickable = child.isClickable !== false && !!child.href;
                              const childActive = isEntryActive(pathname, child);
                              const childSoon = child.status === "soon";

                              return (
                                <li key={child.id} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    {childClickable ? (
                                      <Link
                                        href={child.href!}
                                        onClick={() => setMobileOpen(false)}
                                        aria-current={pathname === child.href ? "page" : undefined}
                                        className={`flex-1 flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                          childActive
                                            ? "text-teal-300 bg-teal-500/10"
                                            : "text-white/70 hover:text-white hover:bg-white/5"
                                        }`}
                                      >
                                        <span className="flex items-center gap-2 truncate">
                                          {child.icon && <NavItemIcon name={child.icon} className="w-3.5 h-3.5" />}
                                          <span className="truncate">{childLabel}</span>
                                        </span>
                                        <StatusBadge
                                          badgeText={child.badgeText}
                                          badgeTextBn={child.badgeTextBn}
                                          badgeStyle={child.badgeStyle}
                                          isSoon={childSoon}
                                          isBn={isBn}
                                        />
                                      </Link>
                                    ) : (
                                      <div className="flex-1 flex items-center justify-between px-3 py-2.5 text-sm text-slate-400">
                                        <span className="flex items-center gap-2 truncate">
                                          {child.icon && <NavItemIcon name={child.icon} className="w-3.5 h-3.5" />}
                                          <span className="truncate">{childLabel}</span>
                                        </span>
                                        <StatusBadge
                                          badgeText={child.badgeText}
                                          badgeTextBn={child.badgeTextBn}
                                          badgeStyle={child.badgeStyle}
                                          isSoon={childSoon}
                                          isBn={isBn}
                                        />
                                      </div>
                                    )}
                                    {childHasNested && (
                                      <button
                                        type="button"
                                        onClick={() => setOpenSubSection(childExpanded ? null : child.id)}
                                        className="p-2 text-white/50 hover:text-white"
                                        aria-label={`Toggle sub-menu: ${childLabel}`}
                                      >
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${childExpanded ? "rotate-180" : ""}`} />
                                      </button>
                                    )}
                                  </div>

                                  {/* Mobile 3rd level */}
                                  {childHasNested && childExpanded && (
                                    <ul className="ml-3 space-y-0.5 border-l border-white/10 pl-3">
                                      {child.children!.map((subChild) => {
                                        const subLabel = resolveLabel(subChild.label);
                                        const subClickable = subChild.isClickable !== false && !!subChild.href;
                                        const subActive = isEntryActive(pathname, subChild);
                                        const subSoon = subChild.status === "soon";

                                        return (
                                          <li key={subChild.id}>
                                            {subClickable ? (
                                              <Link
                                                href={subChild.href!}
                                                onClick={() => setMobileOpen(false)}
                                                className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md ${
                                                  subActive ? "text-teal-300 bg-teal-500/10" : "text-white/60 hover:text-white"
                                                }`}
                                              >
                                                <span className="truncate">{subLabel}</span>
                                                <StatusBadge
                                                  badgeText={subChild.badgeText}
                                                  badgeTextBn={subChild.badgeTextBn}
                                                  badgeStyle={subChild.badgeStyle}
                                                  isSoon={subSoon}
                                                  isBn={isBn}
                                                />
                                              </Link>
                                            ) : (
                                              <div className="flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-400">
                                                <span className="truncate">{subLabel}</span>
                                                <StatusBadge
                                                  badgeText={subChild.badgeText}
                                                  badgeTextBn={subChild.badgeTextBn}
                                                  badgeStyle={subChild.badgeStyle}
                                                  isSoon={subSoon}
                                                  isBn={isBn}
                                                />
                                              </div>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </>
                    ) : isClickable ? (
                      <Link
                        href={entry.href!}
                        onClick={() => setMobileOpen(false)}
                        aria-current={pathname === entry.href ? "page" : undefined}
                        className={`flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                          active ? "text-teal-300 bg-teal-500/10" : "text-white/70 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {entry.icon && <NavItemIcon name={entry.icon} />}
                          <span className="truncate">{resolveLabel(entry.label)}</span>
                        </span>
                        <StatusBadge
                          badgeText={entry.badgeText}
                          badgeTextBn={entry.badgeTextBn}
                          badgeStyle={entry.badgeStyle}
                          isSoon={entry.status === "soon"}
                          isBn={isBn}
                        />
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between px-3 py-3 text-sm font-medium text-slate-400">
                        <span className="flex items-center gap-2 truncate">
                          {entry.icon && <NavItemIcon name={entry.icon} />}
                          <span className="truncate">{resolveLabel(entry.label)}</span>
                        </span>
                        <StatusBadge
                          badgeText={entry.badgeText}
                          badgeTextBn={entry.badgeTextBn}
                          badgeStyle={entry.badgeStyle}
                          isSoon={entry.status === "soon"}
                          isBn={isBn}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="px-4 pt-3 space-y-2">
              <LanguageSwitcher />
              {ctaVisible && (
                <Link
                  href={ctaUrl}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-white text-sm font-semibold rounded-full w-full justify-center shadow-md"
                >
                  {ctaLabel}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
