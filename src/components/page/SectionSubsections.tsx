"use client";

import Link from "next/link";
import {
  Info,
  Eye,
  Shield,
  Users,
  Handshake,
  Layers,
  BarChart3,
  BookOpen,
  Library,
  GraduationCap,
  Camera,
  Video,
  CheckCircle2,
  Sparkles,
  FolderKanban,
  Vote,
  Newspaper,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { SectionType } from "@/components/site/SectionSubnav";

export interface SubsectionCard {
  id: string;
  title: string;
  titleBn: string;
  href: string;
  icon: LucideIcon;
  badge: string;
  badgeBn: string;
  description: string;
  descriptionBn: string;
  tags?: string[];
  coverImage?: string | null;
}

export interface DynamicSubsectionCard {
  id: string;
  title: string;
  titleBn: string;
  href: string;
  icon?: string | null;
  badge?: string | null;
  badgeBn?: string | null;
  description: string;
  descriptionBn: string;
  tags?: string[];
  coverImage?: string | null;
}

const CARD_ICON_MAP: Record<string, LucideIcon> = {
  info: Info,
  eye: Eye,
  shield: Shield,
  users: Users,
  handshake: Handshake,
  barchart3: BarChart3,
  bookopen: BookOpen,
  library: Library,
  graduationcap: GraduationCap,
  camera: Camera,
  video: Video,
  checkcircle2: CheckCircle2,
  folderkanban: FolderKanban,
  vote: Vote,
  newspaper: Newspaper,
  layers: Layers,
  sparkles: Sparkles,
};

function resolveCardIcon(name?: string | null, fallback: LucideIcon = Layers): LucideIcon {
  if (!name) return fallback;
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return CARD_ICON_MAP[key] || fallback;
}

const SECTION_CARDS: Record<SectionType, SubsectionCard[]> = {
  about: [
    {
      id: "overview",
      title: "Mission & History",
      titleBn: "মিশন ও পরিচিতি",
      href: "/about",
      icon: Info,
      badge: "Institutional Overview",
      badgeBn: "প্রাতিষ্ঠানিক পরিচিতি",
      description:
        "LENS is a research-driven think tank in Dhaka working to strengthen Bangladesh's narrative ecosystem through evidence, media literacy, and policy advocacy.",
      descriptionBn:
        "প্রমাণ, মিডিয়া সাক্ষরতা এবং পলিসি অ্যাডভোকেসির মাধ্যমে বাংলাদেশের ন্যারেটিভ ইকোসিস্টেমকে শক্তিশালী করতে কাজ করছে গবেষণাভিত্তিক থিংক ট্যাংক লেন্স।",
      tags: ["Think Tank", "Dhaka", "Public Sphere"],
    },
    {
      id: "vision",
      title: "Vision & Strategic Pillars",
      titleBn: "ভিশন ও কৌশলগত স্তম্ভ",
      href: "/about/vision",
      icon: Eye,
      badge: "Core Framework",
      badgeBn: "কৌশলগত কাঠামো",
      description:
        "Our strategic foundation for advancing democratic discourse, independent press freedoms, and empirical media research across South Asia.",
      descriptionBn:
        "গণতান্ত্রিক আলোচনা, মুক্ত গণমাধ্যম এবং দক্ষিণ এশিয়ায় তথ্যপ্রামাণিক মিডিয়া গবেষণার অগ্রগতিতে আমাদের কৌশলগত লক্ষ্য।",
      tags: ["Democracy", "Ethics", "Policy"],
    },
    {
      id: "governance",
      title: "Governance & Ethics",
      titleBn: "গভর্ন্যান্স ও নৈতিকতা",
      href: "/about/governance",
      icon: Shield,
      badge: "Accountability",
      badgeBn: "স্বচ্ছতা ও জবাবদিহিতা",
      description:
        "Non-partisan standards, transparent institutional governance, conflict of interest safeguards, and editorial independence guidelines.",
      descriptionBn:
        "নিরপেক্ষতার নীতিমালা, প্রাতিষ্ঠানিক স্বচ্ছতা, স্বার্থের সংঘাত রোধ এবং সম্পাদকীয় স্বাধীনতার কঠোর গাইডলাইন।",
      tags: ["Independence", "Standards", "Transparency"],
    },
    {
      id: "team",
      title: "Our Researchers & Team",
      titleBn: "গবেষক ও বিশেষজ্ঞ দল",
      href: "/about/team",
      icon: Users,
      badge: "Roster & Fellows",
      badgeBn: "রিসার্চ টিম ও ফেলো",
      description:
        "Investigators, data scientists, journalists, and policy analysts combining field reporting craft with rigorous empirical methods.",
      descriptionBn:
        "অনুসন্ধানী সাংবাদিক, ডেটা সায়েন্টিস্ট এবং পলিসি বিশ্লেষকদের সমন্বয়ে গঠিত আমাদের বহুমুখী গবেষক দল।",
      tags: ["Researchers", "Journalists", "Data Specialists"],
    },
    {
      id: "partnerships",
      title: "Partnerships & Alliances",
      titleBn: "পার্টনারশিপ ও বৈশ্বিক সংযোগ",
      href: "/about/partnerships",
      icon: Handshake,
      badge: "Collaborative Network",
      badgeBn: "সহযোগিতা নেটওয়ার্ক",
      description:
        "Collaborations with universities, press clubs, civic organizations, and international fact-checking coalitions.",
      descriptionBn:
        "বিশ্ববিদ্যালয়, প্রেস ক্লাব, নাগরিক সমাজ ও আন্তর্জাতিক ফ্যাক্ট-চেকিং নেটওয়ার্কের সাথে যৌথ প্রাতিষ্ঠানিক উদ্যোগ।",
      tags: ["Academia", "Civil Society", "Alliances"],
    },
  ],
  theme: [
    {
      id: "overview",
      title: "Thematic Framework",
      titleBn: "থিম্যাটিক ফ্রেমওয়ার্ক",
      href: "/theme",
      icon: Layers,
      badge: "Architecture",
      badgeBn: "কাঠামো",
      description:
        "How LENS organizes its intellectual and empirical work across media monitoring, policy advocacy, and digital civic space.",
      descriptionBn:
        "মিডিয়া মনিটরিং, নীতি সংস্কার এবং ডিজিটাল নাগরিক পরিসরে লেন্সের বুদ্ধিবৃত্তিক ও গবেষণামূলক কাজের সামগ্রিক বিন্যাস।",
      tags: ["Architecture", "Taxonomy", "Synthesis"],
    },
    {
      id: "research",
      title: "Empirical Research & Studies",
      titleBn: "তথ্যপ্রামাণিক গবেষণা ও সমীক্ষা",
      href: "/theme/research",
      icon: BarChart3,
      badge: "Field Studies",
      badgeBn: "মাঠপর্যায়ের গবেষণা",
      description:
        "Original quantitative and qualitative investigations tracking media ownership, disinformation campaigns, and algorithmic bias.",
      descriptionBn:
        "মিডিয়া মালিকানা, অপতথ্য প্রবাহ এবং অ্যালগরিদমিক পক্ষপাত নিয়ে মৌলিক গুণগত ও পরিমাণগত অনুসন্ধান।",
      tags: ["Disinformation", "Analytics", "Media Trends"],
    },
    {
      id: "literature",
      title: "Scholarly Literature & Texts",
      titleBn: "পাঠ্য ও মৌলিক সাহিত্য",
      href: "/theme/literature",
      icon: BookOpen,
      badge: "Curated Syllabi",
      badgeBn: "নির্বাচিত পঠনতালিকা",
      description:
        "Foundational readings, media theory bibliographies, and academic literature supporting critical civic and journalistic studies.",
      descriptionBn:
        "মিডিয়া তত্ত্ব, সাংবাদিকতার ইতিহাস ও নাগরিক অধিকার নিয়ে নির্বাচিত শিক্ষামূলক রেফারেন্স ও পঠনতালিকা।",
      tags: ["Theory", "Reading Lists", "Methodology"],
    },
    {
      id: "library",
      title: "Digital Knowledge Library",
      titleBn: "ডিজিটাল নলেজ লাইব্রেরি",
      href: "/library",
      icon: Library,
      badge: "Searchable Archive",
      badgeBn: "অনুসন্ধানযোগ্য আর্কাইভ",
      description:
        "Open-access digital repository of policy briefs, working papers, primary datasets, and interview transcripts with full-text search.",
      descriptionBn:
        "পলিসি ব্রিফ, ওয়ার্কিং পেপার, উন্মুক্ত ডেটাসেট ও গবেষণা সাক্ষাৎকারের উন্মুক্ত ডিজিটাল ভান্ডার।",
      tags: ["Policy Briefs", "Datasets", "Open Access"],
    },
  ],
  courses: [
    {
      id: "overview",
      title: "Academy Overview",
      titleBn: "অ্যাকাডেমি পরিচিতি",
      href: "/courses",
      icon: GraduationCap,
      badge: "Training Hub",
      badgeBn: "প্রশিক্ষণ হাব",
      description:
        "Practical capacity building designed for field reporters, university students, civil society monitors, and emerging digital creators.",
      descriptionBn:
        "মাঠপর্যায়ের সাংবাদিক, বিশ্ববিদ্যালয়ের শিক্ষার্থী ও ডিজিটাল নির্মাতাদের জন্য ব্যবহারিক দক্ষতা উন্নয়ন পাঠক্রম।",
      tags: ["Pedagogy", "Mentorship", "Hands-on"],
    },
    {
      id: "photography",
      title: "Documentary Photography",
      titleBn: "ডকুমেন্টারি ফটোগ্রাফি",
      href: "/courses/photography",
      icon: Camera,
      badge: "Visual Storytelling",
      badgeBn: "ভিজ্যুয়াল জার্নালিজম",
      description:
        "Master visual framing, ethical consent, adverse-light craft, and long-term photojournalistic narrative sequencing in the field.",
      descriptionBn:
        "ভিজ্যুয়াল ফ্রেমিং, নৈতিক সম্মতি, প্রতিকূল আলোয় কাজ এবং দীর্ঘমেয়াদী ফটো জার্নালিজমের কৌশল আয়ত্ত করুন।",
      tags: ["Ethics", "Composition", "Field Craft"],
    },
    {
      id: "mojo",
      title: "Mobile Journalism (Mojo)",
      titleBn: "মোবাইল জার্নালিজম (মোজো)",
      href: "/courses/mojo",
      icon: Video,
      badge: "Field Video Rigs",
      badgeBn: "মোবাইল ভিডিও প্রোডাকশন",
      description:
        "Smartphone video shooting, mobile mic arrays, low-latency live streaming, fast multi-track timeline editing, and mobile OPSEC.",
      descriptionBn:
        "স্মার্টফোনে উচ্চমানের ভিডিও শুটিং, লাইভ স্ট্রিমিং এবং দ্রুত টাইমলাইন এডিটিংয়ের পেশাদার কৌশল।",
      tags: ["Video", "Fast Turnaround", "Livestream"],
    },
    {
      id: "fact-check",
      title: "Forensic Fact-Checking & OSINT",
      titleBn: "ফ্যাক্ট-চেকিং ও ওসিন্ট ভেরিফিকেশন",
      href: "/courses/fact-check",
      icon: CheckCircle2,
      badge: "Verification Labs",
      badgeBn: "তথ্য যাচাই ল্যাব",
      description:
        "Open-source intelligence (OSINT) tools, reverse image geolocations, metadata extraction, and synthetic deepfake debunking workflows.",
      descriptionBn:
        "ওপেন সোর্স ইন্টেলিজেন্স (OSINT), মেটাডাটা অ্যানালাইসিস এবং অপতথ্য শনাক্তকরণের আধুনিক টুলস ও পদ্ধতি।",
      tags: ["OSINT", "Forensics", "Debunking"],
    },
    {
      id: "data-journalism",
      title: "Data Journalism & Investigation",
      titleBn: "ডেটা সাংবাদিকতা ও অনুসন্ধান",
      href: "/courses/data-journalism",
      icon: BarChart3,
      badge: "Public Records",
      badgeBn: "উপাত্ত বিশ্লেষণ",
      description:
        "Public budget scraping, spreadsheet forensic cleaning, interactive charting, and investigative storytelling backed by empirical data.",
      descriptionBn:
        "উন্মুক্ত ডেটা স্ক্র্যাপিং, স্প্রেডশিট বিশ্লেষণ, ভিজ্যুয়ালাইজেশন এবং উপাত্তনির্ভর অনুসন্ধানী প্রতিবেদন।",
      tags: ["Data Scraping", "Visualization", "Public Records"],
    },
    {
      id: "new-media",
      title: "New Media & Algorithm Literacy",
      titleBn: "নিউ মিডিয়া ও প্ল্যাটফর্ম স্ট্র্যাটেজি",
      href: "/courses/new-media",
      icon: Sparkles,
      badge: "Digital Audiences",
      badgeBn: "অডিয়েন্স গ্রোথ",
      description:
        "Decoding social recommendation engines, short-form civic narratives, newsletter architecture, and audience engagement safety.",
      descriptionBn:
        "সোশ্যাল মিডিয়া অ্যালগরিদম লিটারেসি, ইন্টারঅ্যাক্টিভ ফরম্যাট এবং ডিজিটাল প্ল্যাটফর্মে নিরাপদ অডিয়েন্স এনগেজমেন্ট।",
      tags: ["Algorithms", "Short-Form", "Civic Media"],
    },
  ],
  resources: [
    {
      id: "overview",
      title: "Resource Catalog",
      titleBn: "রিসোর্স ক্যাটালগ",
      href: "/resources",
      icon: FolderKanban,
      badge: "All Repositories",
      badgeBn: "সার্বিক রিসোর্স ভান্ডার",
      description:
        "The central index of open research toolkits, citizen guidebooks, datasets, and regulatory compliance digests.",
      descriptionBn:
        "উন্মুক্ত গবেষণা টুলকিট, নাগরিক নির্দেশিকা, ডেটাসেট এবং মিডিয়া আইনের সার্বিক কেন্দ্রীয় সূচি।",
      tags: ["Open Knowledge", "Catalog", "Toolkits"],
    },
    {
      id: "election",
      title: "Election Monitoring & Safety",
      titleBn: "নির্বাচন পর্যবেক্ষণ ও সাংবাদিক সুরক্ষা",
      href: "/resources/election",
      icon: Vote,
      badge: "Democratic Integrity",
      badgeBn: "গণতান্ত্রিক নিষ্ঠা",
      description:
        "Electoral disinformation checklists, Election Commission press regulation digests, and field risk mitigation toolkits.",
      descriptionBn:
        "নির্বাচনী অপতথ্য ট্র্যাকিং চেকলিস্ট, আইনি অধিকার এবং ভোটকেন্দ্রে সাংবাদিকদের পেশাগত নিরাপত্তা নির্দেশিকা।",
      tags: ["Elections", "Field Safety", "Media Law"],
    },
    {
      id: "publications",
      title: "Research Publications",
      titleBn: "গবেষণা প্রকাশনা ও প্রতিবেদন",
      href: "/resources/publications",
      icon: BookOpen,
      badge: "White Papers",
      badgeBn: "শ্বেতপত্র ও রিপোর্ট",
      description:
        "Monographs, peer-reviewed articles, annual media reviews, and policy white papers available in open PDF downloads.",
      descriptionBn:
        "বার্ষিক মিডিয়া পর্যালোচনা, পিয়ার-রিভিউড প্রবন্ধ এবং ডাউনলোডযোগ্য গবেষণামূলক মনোগ্রাফ ও রিপোর্ট।",
      tags: ["Monographs", "PDF Download", "White Papers"],
    },
    {
      id: "media",
      title: "Media Hub & Press Kit",
      titleBn: "মিডিয়া হাব ও প্রেস কিট",
      href: "/resources/media",
      icon: Newspaper,
      badge: "Official Releases",
      badgeBn: "প্রেস রিলিজ",
      description:
        "Official statements, institutional media contacts, high-resolution branding assets, and press briefing archives.",
      descriptionBn:
        "প্রাতিষ্ঠানিক প্রেস রিলিজ, অফিসিয়াল ব্র্যান্ডিং কিট এবং গণমাধ্যম প্রতিনিধিদের জন্য জরুরি তথ্য ও যোগাযোগ।",
      tags: ["Press Kits", "Statements", "Media Desk"],
    },
    {
      id: "other",
      title: "Toolkits & Reference Guides",
      titleBn: "টুলকিট ও সহায়ক নির্দেশিকা",
      href: "/resources/other",
      icon: Layers,
      badge: "Field Handbooks",
      badgeBn: "ফিল্ড হ্যান্ডবুক",
      description:
        "Checklists for cybersecurity hygiene, digital source protection, RTI filing manuals, and public data verification sheets.",
      descriptionBn:
        "ডিজিটাল নিরাপত্তা স্বাস্থ্যবিধি, তথ্য অধিকার আইন (RTI) আবেদন ম্যানুয়াল এবং উৎস সুরক্ষা নির্দেশিকা।",
      tags: ["Cyber Hygiene", "RTI Manuals", "Handbooks"],
    },
  ],
};

const ACCENT_STYLES: Record<
  SectionType,
  {
    tagText: string;
    iconBg: string;
    iconBorder: string;
    iconText: string;
    hoverBorder: string;
    arrowText: string;
    activeRing: string;
  }
> = {
  about: {
    tagText: "text-indigo-600",
    iconBg: "bg-indigo-50",
    iconBorder: "border-indigo-100",
    iconText: "text-indigo-600",
    hoverBorder: "hover:border-indigo-300",
    arrowText: "text-indigo-600",
    activeRing: "ring-2 ring-indigo-500/30 border-indigo-500/50 bg-indigo-50/20",
  },
  theme: {
    tagText: "text-teal-600",
    iconBg: "bg-teal-50",
    iconBorder: "border-teal-100",
    iconText: "text-teal-600",
    hoverBorder: "hover:border-teal-300",
    arrowText: "text-teal-600",
    activeRing: "ring-2 ring-teal-500/30 border-teal-500/50 bg-teal-50/20",
  },
  courses: {
    tagText: "text-violet-600",
    iconBg: "bg-violet-50",
    iconBorder: "border-violet-100",
    iconText: "text-violet-600",
    hoverBorder: "hover:border-violet-300",
    arrowText: "text-violet-600",
    activeRing: "ring-2 ring-violet-500/30 border-violet-500/50 bg-violet-50/20",
  },
  resources: {
    tagText: "text-emerald-600",
    iconBg: "bg-emerald-50",
    iconBorder: "border-emerald-100",
    iconText: "text-emerald-600",
    hoverBorder: "hover:border-emerald-300",
    arrowText: "text-emerald-600",
    activeRing: "ring-2 ring-emerald-500/30 border-emerald-500/50 bg-emerald-50/20",
  },
};

export default function SectionSubsections({
  section,
  currentSlug,
  customCards,
}: {
  section: SectionType;
  currentSlug: string;
  customCards?: DynamicSubsectionCard[];
}) {
  const defaultCards = SECTION_CARDS[section] || [];
  const cards: SubsectionCard[] = customCards && customCards.length > 0
    ? customCards.map((cc, idx) => ({
        id: cc.id,
        title: cc.title,
        titleBn: cc.titleBn || cc.title,
        href: cc.href,
        icon: resolveCardIcon(cc.icon, defaultCards[idx]?.icon || Layers),
        badge: cc.badge || "Resource Track",
        badgeBn: cc.badgeBn || "রিসোর্স ট্র্যাক",
        description: cc.description,
        descriptionBn: cc.descriptionBn || cc.description,
        tags: cc.tags,
        coverImage: cc.coverImage,
      }))
    : defaultCards;

  const styles = ACCENT_STYLES[section] || ACCENT_STYLES.about;
  const normalizedCurrent = currentSlug.startsWith("/") ? currentSlug : `/${currentSlug}`;

  return (
    <section className="py-16 sm:py-20 bg-slate-50/80 border-t border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <p className={`text-xs font-bold tracking-[0.2em] uppercase ${styles.tagText} mb-3`}>
            In This Section
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Explore {section.charAt(0).toUpperCase() + section.slice(1)} Tracks
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Discover all dedicated subsections, research programs, and specialized knowledge portals.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {cards.map((card) => {
            const Icon = card.icon;
            const isCurrent = normalizedCurrent === card.href;

            return (
              <Link
                key={card.id}
                href={card.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`group relative flex flex-col p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${styles.hoverBorder} ${
                  isCurrent ? styles.activeRing : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div
                    className={`w-12 h-12 rounded-2xl ${styles.iconBg} border ${styles.iconBorder} ${styles.iconText} flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2.5 tracking-tight group-hover:text-slate-900 transition-colors">
                  {card.title}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-6">
                  {card.description}
                </p>

                {card.tags && card.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  className={`flex items-center gap-2 text-xs font-bold ${styles.arrowText} group-hover:translate-x-1 transition-transform`}
                >
                  <span>{isCurrent ? "Current Track" : "Explore Track"}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
