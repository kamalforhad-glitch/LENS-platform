"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Info,
  Eye,
  Shield,
  Users,
  Handshake,
  BarChart3,
  BookOpen,
  Library,
  GraduationCap,
  Camera,
  Video,
  CheckCircle2,
  FolderKanban,
  Vote,
  Newspaper,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type SectionType = "about" | "theme" | "courses" | "resources";

interface SubnavItem {
  id: string;
  label: string;
  labelBn: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeBn?: string;
}

const SECTION_ITEMS: Record<SectionType, SubnavItem[]> = {
  about: [
    { id: "overview", label: "Overview", labelBn: "পরিচিতি", href: "/about", icon: Info },
    { id: "vision", label: "Our Vision", labelBn: "আমাদের ভিশন", href: "/about/vision", icon: Eye },
    { id: "governance", label: "Governance", labelBn: "গভর্ন্যান্স", href: "/about/governance", icon: Shield },
    { id: "team", label: "Our Team", labelBn: "আমাদের দল", href: "/about/team", icon: Users },
    { id: "partnerships", label: "Partnerships", labelBn: "অংশীদারিত্ব", href: "/about/partnerships", icon: Handshake },
  ],
  theme: [
    { id: "overview", label: "All Themes", labelBn: "সকল থিম", href: "/theme", icon: Layers },
    { id: "research", label: "Research", labelBn: "গবেষণা", href: "/theme/research", icon: BarChart3 },
    { id: "literature", label: "Literature", labelBn: "সাহিত্য ও পাঠ্য", href: "/theme/literature", icon: BookOpen },
    { id: "library", label: "Digital Library", labelBn: "ডিজিটাল লাইব্রেরি", href: "/library", icon: Library },
  ],
  courses: [
    { id: "overview", label: "All Courses", labelBn: "সকল কোর্স", href: "/courses", icon: GraduationCap },
    { id: "photography", label: "Photography", labelBn: "ফটোগ্রাফি", href: "/courses/photography", icon: Camera },
    { id: "mojo", label: "Mojo", labelBn: "মোজো", href: "/courses/mojo", icon: Video },
    { id: "fact-check", label: "Fact Check", labelBn: "ফ্যাক্ট চেক", href: "/courses/fact-check", icon: CheckCircle2 },
    { id: "data-journalism", label: "Data Journalism", labelBn: "ডাটা সাংবাদিকতা", href: "/courses/data-journalism", icon: BarChart3 },
    { id: "new-media", label: "New Media", labelBn: "নিউ মিডিয়া", href: "/courses/new-media", icon: Sparkles },
  ],
  resources: [
    { id: "overview", label: "All Resources", labelBn: "সকল রিসোর্স", href: "/resources", icon: FolderKanban },
    { id: "election", label: "Election", labelBn: "নির্বাচন", href: "/resources/election", icon: Vote },
    { id: "publications", label: "Publications", labelBn: "প্রকাশনা", href: "/resources/publications", icon: BookOpen },
    { id: "media", label: "Media Hub", labelBn: "মিডিয়া হাব", href: "/resources/media", icon: Newspaper },
    { id: "other", label: "Other Resources", labelBn: "অন্যান্য সম্পদ", href: "/resources/other", icon: Layers },
  ],
};

const THEME_STYLES: Record<
  SectionType,
  {
    border: string;
    activePill: string;
    activeText: string;
    hoverPill: string;
    indicator: string;
  }
> = {
  about: {
    border: "border-indigo-100",
    activePill: "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25",
    activeText: "text-indigo-600 font-semibold",
    hoverPill: "hover:text-indigo-600 hover:bg-indigo-50/70",
    indicator: "bg-indigo-600",
  },
  theme: {
    border: "border-teal-100",
    activePill: "bg-teal-600 text-white shadow-sm shadow-teal-500/25",
    activeText: "text-teal-600 font-semibold",
    hoverPill: "hover:text-teal-600 hover:bg-teal-50/70",
    indicator: "bg-teal-600",
  },
  courses: {
    border: "border-violet-100",
    activePill: "bg-violet-600 text-white shadow-sm shadow-violet-500/25",
    activeText: "text-violet-600 font-semibold",
    hoverPill: "hover:text-violet-600 hover:bg-violet-50/70",
    indicator: "bg-violet-600",
  },
  resources: {
    border: "border-emerald-100",
    activePill: "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25",
    activeText: "text-emerald-600 font-semibold",
    hoverPill: "hover:text-emerald-600 hover:bg-emerald-50/70",
    indicator: "bg-emerald-600",
  },
};

export default function SectionSubnav({
  section,
  activeHref,
}: {
  section: SectionType;
  activeHref?: string;
}) {
  const pathname = usePathname() || "";
  const currentPath = activeHref || pathname;
  const items = SECTION_ITEMS[section] || [];
  const styles = THEME_STYLES[section] || THEME_STYLES.about;

  return (
    <nav
      aria-label={`${section} section navigation`}
      className="sticky top-20 sm:top-24 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 py-2.5 overflow-x-auto no-scrollbar scroll-smooth">
          <span className="hidden md:inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 shrink-0">
            {section}:
          </span>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium shrink-0 transition-all duration-200 ${
                  isActive
                    ? styles.activePill
                    : `text-slate-600 ${styles.hoverPill}`
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-current"
                  }`}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
