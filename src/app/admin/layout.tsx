"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { logout, checkAuth } from "@/lib/actions/auth";
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Layers,
  Home,
  LayoutGrid,
  FolderTree,
  Menu,
  Settings,
  Image as ImageIcon,
  Languages,
  Send,
  History,
  Search,
  FileText,
  CheckSquare,
  Users,
  BookOpen,
  GraduationCap,
  PenTool,
  Newspaper,
  Calendar,
  FolderKanban,
  Briefcase,
  UserCheck,
  Mail,
  ShieldCheck,
  Bot,
  Database,
  ExternalLink,
  LogOut,
  X,
  LucideIcon,
} from "lucide-react";

interface NavItemConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  group: "Overview" | "Visual CMS" | "Content" | "Admin";
  superOnly?: boolean;
}

const navItems: NavItemConfig[] = [
  // Overview
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, group: "Overview" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, group: "Overview" },
  { label: "Impact", href: "/admin/impact", icon: TrendingUp, group: "Overview" },

  // Visual CMS & Dynamic Page Builder
  { label: "Pages", href: "/admin/pages", icon: Layers, group: "Visual CMS" },
  { label: "Homepage Builder", href: "/admin/pages/home", icon: Home, group: "Visual CMS" },
  { label: "Sections Library", href: "/admin/sections", icon: LayoutGrid, group: "Visual CMS" },
  { label: "Tabs & Inner Tabs", href: "/admin/tabs", icon: FolderTree, group: "Visual CMS" },
  { label: "Navigation & Menus", href: "/admin/navigation", icon: Menu, group: "Visual CMS" },
  { label: "Site Settings & Footer", href: "/admin/settings", icon: Settings, group: "Visual CMS" },
  { label: "Media Library", href: "/admin/media", icon: ImageIcon, group: "Visual CMS" },
  { label: "Translations (EN/BN)", href: "/admin/translations", icon: Languages, group: "Visual CMS" },
  { label: "Drafts & Publishing", href: "/admin/publishing", icon: Send, group: "Visual CMS" },
  { label: "Revision History", href: "/admin/revisions", icon: History, group: "Visual CMS" },
  { label: "Global SEO", href: "/admin/seo", icon: Search, group: "Visual CMS" },

  // Content Collections
  { label: "Research", href: "/admin/research", icon: FileText, group: "Content" },
  { label: "Review Queue", href: "/admin/review", icon: CheckSquare, group: "Content" },
  { label: "Authors", href: "/admin/authors", icon: Users, group: "Content" },
  { label: "Publications", href: "/admin/publications", icon: BookOpen, group: "Content" },
  { label: "Programs & Courses", href: "/admin/programs", icon: GraduationCap, group: "Content" },
  { label: "Blog", href: "/admin/blog", icon: PenTool, group: "Content" },
  { label: "Media & Press", href: "/admin/media-items", icon: Newspaper, group: "Content" },
  { label: "Events", href: "/admin/events", icon: Calendar, group: "Content" },
  { label: "Resources", href: "/admin/resources", icon: FolderKanban, group: "Content" },
  { label: "Careers", href: "/admin/careers", icon: Briefcase, group: "Content" },
  { label: "Team", href: "/admin/team", icon: UserCheck, group: "Content" },
  { label: "Contact Form", href: "/admin/contact", icon: Mail, group: "Content" },

  // Admin & Security
  { label: "Admin Accounts", href: "/admin/users", icon: ShieldCheck, superOnly: true, group: "Admin" },
  { label: "AI Assistant", href: "/admin/ai", icon: Bot, group: "Admin" },
  { label: "Backups", href: "/admin/backups", icon: Database, group: "Admin" },
];

function isNavItemActive(itemHref: string, currentPath: string, allHrefs: string[]): boolean {
  if (currentPath === itemHref) return true;
  if (itemHref === "/admin") return false;
  if (!currentPath.startsWith(itemHref + "/")) return false;
  // If another registered navItem is a more specific prefix of currentPath, yield to it
  return !allHrefs.some(
    (other) => other !== itemHref && other.length > itemHref.length && currentPath.startsWith(other)
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/admin/login" || pathname.startsWith("/admin/invite")) return;

    checkAuth()
      .then((data) => {
        if (!data.authenticated) {
          router.push("/admin/login");
        } else {
          setUserName(data.user?.name || "Admin");
          setUserRole(data.user?.role || null);
        }
      })
      .catch(() => router.push("/admin/login"));
  }, [pathname, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on Escape key press
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => !(item.superOnly && userRole !== "super_admin"));
  }, [userRole]);

  const allHrefs = useMemo(() => visibleNavItems.map((i) => i.href), [visibleNavItems]);

  const navGroups = useMemo(() => {
    const groups: Array<{ name: string; items: NavItemConfig[] }> = [
      { name: "Overview", items: visibleNavItems.filter((i) => i.group === "Overview") },
      { name: "Visual CMS", items: visibleNavItems.filter((i) => i.group === "Visual CMS") },
      { name: "Content", items: visibleNavItems.filter((i) => i.group === "Content") },
      { name: "Admin", items: visibleNavItems.filter((i) => i.group === "Admin") },
    ];
    return groups.filter((g) => g.items.length > 0);
  }, [visibleNavItems]);

  if (pathname === "/admin/login" || pathname.startsWith("/admin/invite")) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const formattedRole = userRole
    ? userRole
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Administrator";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        aria-label="Admin Navigation"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy-950 flex flex-col h-screen max-h-screen h-[100dvh] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Branding header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 group py-1 min-w-0"
            aria-label="LENS — return to home"
          >
            <Image
              src="/images/logo/lens-logo.png"
              alt="LENS"
              width={88}
              height={24}
              priority
              className="h-6 w-auto object-contain transition-opacity duration-300 group-hover:opacity-90 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold tracking-tight text-white group-hover:text-teal-300 transition-colors truncate">
                LENS Admin
              </span>
              <span className="text-[9px] text-slate-400 font-medium">Dashboard</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" aria-hidden="true" focusable="false" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <nav
          className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-5 overscroll-contain"
          aria-label="Admin Sections"
        >
          {navGroups.map((group) => (
            <div key={group.name} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.name}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(item.href, pathname, allHrefs);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-teal-500/20 text-teal-300 font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-teal-400" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                      aria-hidden="true"
                      focusable="false"
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Account controls at bottom of sidebar (in flex flow, non-overlapping) */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-navy-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 text-sm font-bold shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate" title={userName || "Admin"}>
                {userName || "Admin"}
              </p>
              <p className="text-[10px] text-teal-400 font-medium truncate" title={formattedRole}>
                {formattedRole}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" focusable="false" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile / Tablet Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={sidebarOpen}
              aria-controls="admin-sidebar"
            >
              <Menu className="w-5 h-5" aria-hidden="true" focusable="false" />
            </button>
            <span className="text-sm font-bold text-slate-800 truncate lg:hidden">
              LENS Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:text-teal-600 hover:bg-slate-100 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              title="Open live site in new tab"
            >
              <span>View Site</span>
              <ExternalLink className="w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" focusable="false" />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto text-slate-900 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
