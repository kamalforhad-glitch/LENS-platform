"use client";

import Link from "next/link";
import { ArrowRight, Mail, BookOpen, GraduationCap } from "lucide-react";
import type { SectionType } from "@/components/site/SectionSubnav";
import type { HeroAccent } from "@/components/site/PageHero";

interface CtaConfig {
  eyebrow: string;
  eyebrowBn: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  primaryLabel: string;
  primaryLabelBn: string;
  primaryHref: string;
  primaryIcon: typeof ArrowRight;
  secondaryLabel?: string;
  secondaryLabelBn?: string;
  secondaryHref?: string;
  accent: HeroAccent;
}

const SECTION_CTA_CONFIGS: Record<SectionType, CtaConfig> = {
  about: {
    eyebrow: "Partner & Collaborate",
    eyebrowBn: "সহযোগিতা ও নেটওয়ার্ক",
    title: "Strengthening Bangladesh's Narrative Ecosystem",
    titleBn: "বাংলাদেশের ন্যারেটিভ ইকোসিস্টেমের উন্নয়নে যুক্ত হোন",
    description:
      "We actively collaborate with researchers, academic institutions, civil society organizations, and independent journalists to produce rigorous evidence on the public sphere.",
    descriptionBn:
      "পাবলিক স্ফিয়ার নিয়ে তথ্যপ্রামাণিক গবেষণা ও পলিসি সংলাপ পরিচালনায় আমরা গবেষক, বিশ্ববিদ্যালয়, নাগরিক সমাজ ও সাংবাদিকদের সাথে কাজ করি।",
    primaryLabel: "Get in Touch",
    primaryLabelBn: "যোগাযোগ করুন",
    primaryHref: "/contact",
    primaryIcon: Mail,
    secondaryLabel: "Meet the Team",
    secondaryLabelBn: "টিম পরিচিতি",
    secondaryHref: "/about/team",
    accent: "indigo",
  },
  theme: {
    eyebrow: "Empirical Studies & Datasets",
    eyebrowBn: "উন্মুক্ত গবেষণা ও ডাটাবেজ",
    title: "Explore the Digital Knowledge Library",
    titleBn: "ডিজিটাল নলেজ লাইব্রেরি অনুসন্ধান করুন",
    description:
      "Access our full-text repository of policy briefs, open datasets, working papers, and media landscape indexes with structured search.",
    descriptionBn:
      "পলিসি ব্রিফ, উন্মুক্ত ডেটাসেট, ওয়ার্কিং পেপার এবং মিডিয়া ল্যান্ডস্কেপ ইনডেক্স অনুসন্ধান ও ডাউনলোড করুন।",
    primaryLabel: "Search Digital Library",
    primaryLabelBn: "লাইব্রেরিতে অনুসন্ধান",
    primaryHref: "/library",
    primaryIcon: BookOpen,
    secondaryLabel: "View All Themes",
    secondaryLabelBn: "সকল থিম দেখুন",
    secondaryHref: "/theme",
    accent: "teal",
  },
  courses: {
    eyebrow: "Capacity Building & Training",
    eyebrowBn: "দক্ষতা উন্নয়ন ও ফেলোশিপ",
    title: "Join Upcoming LENS Training Cohorts",
    titleBn: "লেন্স প্রশিক্ষণ ও ফেলোশিপে অংশগ্রহণ করুন",
    description:
      "Practical workshops and fellowships covering mobile journalism (mojo), forensic fact-checking, photojournalism, and data investigation.",
    descriptionBn:
      "মোবাইল জার্নালিজম (মোজো), ফ্যাক্ট-চেকিং ভেরিফিকেশন, ফটো সাংবাদিকতা ও ডেটা ইনভেস্টিগেশনের ব্যবহারিক কোর্স।",
    primaryLabel: "Explore Training Programs",
    primaryLabelBn: "প্রশিক্ষণ প্রোগ্রাম দেখুন",
    primaryHref: "/courses",
    primaryIcon: GraduationCap,
    secondaryLabel: "Inquire for Cohorts",
    secondaryLabelBn: "কোর্স সম্পর্কে জানুন",
    secondaryHref: "/contact",
    accent: "violet",
  },
  resources: {
    eyebrow: "Open Knowledge Base",
    eyebrowBn: "উন্মুক্ত তথ্য ও সহায়িকা",
    title: "Empowering Resilient Civic Journalism",
    titleBn: "নির্ভীক ও তথ্যপ্রামাণিক নাগরিক সাংবাদিকতা",
    description:
      "Freely download electoral monitoring checklists, digital security hygiene manuals, legal rights guides, and research methodologies.",
    descriptionBn:
      "নির্বাচন পর্যবেক্ষণ চেকলিস্ট, ডিজিটাল নিরাপত্তা নির্দেশিকা এবং সাংবাদিক সুরক্ষা ম্যানুয়াল উন্মুক্তভাবে ডাউনলোড করুন।",
    primaryLabel: "Browse Open Resources",
    primaryLabelBn: "রিসোর্স ব্রাউজ করুন",
    primaryHref: "/resources",
    primaryIcon: BookOpen,
    secondaryLabel: "Media Desk & Press Kit",
    secondaryLabelBn: "প্রেস কিট দেখুন",
    secondaryHref: "/resources/media",
    accent: "emerald",
  },
};

const DEFAULT_CTA_CONFIG: CtaConfig = {
  eyebrow: "LENS Bangladesh",
  eyebrowBn: "লেন্স বাংলাদেশ",
  title: "Evidence-Based Media Intelligence & Policy Research",
  titleBn: "তথ্যপ্রামাণিক মিডিয়া গবেষণা ও নীতি সংস্কার",
  description:
    "Strengthening Bangladesh's information ecosystem through rigorous analysis, open methodologies, and active civic participation.",
  descriptionBn:
    "নির্ভরযোগ্য বিশ্লেষণ, উন্মুক্ত পদ্ধতি এবং সক্রিয় নাগরিক অংশগ্রহণের মাধ্যমে তথ্য পরিসরকে সুরক্ষায় লেন্স প্রতিশ্রুতিবদ্ধ।",
  primaryLabel: "Contact Our Research Desk",
  primaryLabelBn: "যোগাযোগ করুন",
  primaryHref: "/contact",
  primaryIcon: Mail,
  secondaryLabel: "About Our Work",
  secondaryLabelBn: "আমাদের সম্পর্কে জানুন",
  secondaryHref: "/about",
  accent: "gold",
};

export default function InstitutionalCta({
  section,
  accentOverride,
}: {
  section?: SectionType | null;
  accentOverride?: HeroAccent;
}) {
  const config = section ? SECTION_CTA_CONFIGS[section] || DEFAULT_CTA_CONFIG : DEFAULT_CTA_CONFIG;
  const accent = accentOverride || config.accent;

  const glowStyles: Record<HeroAccent, string> = {
    indigo: "bg-[radial-gradient(ellipse_at_50%_50%,rgba(99,102,241,0.18)_0%,transparent_70%)]",
    teal: "bg-[radial-gradient(ellipse_at_50%_50%,rgba(20,184,166,0.18)_0%,transparent_70%)]",
    violet: "bg-[radial-gradient(ellipse_at_50%_50%,rgba(139,92,246,0.18)_0%,transparent_70%)]",
    emerald: "bg-[radial-gradient(ellipse_at_50%_50%,rgba(16,185,129,0.18)_0%,transparent_70%)]",
    gold: "bg-[radial-gradient(ellipse_at_50%_50%,rgba(212,168,67,0.14)_0%,transparent_70%)]",
  };

  const buttonStyles: Record<HeroAccent, string> = {
    indigo: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30",
    teal: "bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30",
    violet: "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30",
    emerald: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30",
    gold: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30",
  };

  const PrimaryIcon = config.primaryIcon;

  return (
    <section className="relative overflow-hidden bg-navy-950 py-20 lg:py-24 border-t border-white/10">
      {/* Background Radial Glow */}
      <div className={`absolute inset-0 ${glowStyles[accent]}`} aria-hidden="true" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3.5 py-1 rounded-full mb-6">
          {config.eyebrow}
        </span>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-6">
          {config.title}
        </h2>

        <p className="text-base sm:text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto mb-10 font-normal">
          {config.description}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={config.primaryHref}
            className={`inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-md hover:-translate-y-0.5 ${buttonStyles[accent]}`}
          >
            <PrimaryIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{config.primaryLabel}</span>
          </Link>

          {config.secondaryLabel && config.secondaryHref && (
            <Link
              href={config.secondaryHref}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-full text-sm font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>{config.secondaryLabel}</span>
              <ArrowRight className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
