"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useContactForm } from "@/lib/api/useContactForm";
import PageSectionsView, { type SectionWithResolved } from "@/components/page/PageSectionsView";
import {
  Mail,
  MessageSquare,
  MapPin,
  Phone,
  Clock,
  Send,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface ContactFormField {
  name: string;
  label: string;
  labelBn?: string;
  type?: string;
  placeholder?: string;
  placeholderBn?: string;
  required?: string | boolean;
}

export interface ContactContentProps {
  // Hero CMS props
  eyebrow?: string;
  eyebrowBn?: string;
  title?: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  breadcrumbs?: Array<{ label: string; labelBn?: string; href?: string }>;

  // Contact Info CMS props
  infoTitle?: string;
  infoTitleBn?: string;
  infoDescription?: string;
  infoDescriptionBn?: string;
  infoParagraphs?: string[];
  infoParagraphsBn?: string[];

  // Site Settings
  contactEmail?: string;
  contactEmailBn?: string;
  mediaEmail?: string;
  mediaEmailBn?: string;
  officeAddress?: string;
  officeAddressBn?: string;
  contactPhone?: string;
  contactPhoneBn?: string;
  officeHours?: string;
  officeHoursBn?: string;

  // Contact Form CMS props
  formTitle?: string;
  formTitleBn?: string;
  formDescription?: string;
  formDescriptionBn?: string;
  submitLabel?: string;
  submitLabelBn?: string;
  fields?: ContactFormField[];

  // Additional CMS sections if any
  extraSections?: SectionWithResolved[];
}

export default function ContactContent({
  eyebrow,
  eyebrowBn,
  title,
  titleBn,
  description,
  descriptionBn,
  breadcrumbs,
  infoTitle,
  infoTitleBn,
  infoDescription,
  infoDescriptionBn,
  infoParagraphs,
  infoParagraphsBn,
  contactEmail = "info@lensbd.org",
  contactEmailBn,
  mediaEmail = "media@lensbd.org",
  mediaEmailBn,
  officeAddress = "Dhaka, Bangladesh",
  officeAddressBn,
  contactPhone,
  contactPhoneBn,
  officeHours,
  officeHoursBn,
  formTitle,
  formTitleBn,
  formDescription,
  formDescriptionBn,
  submitLabel,
  submitLabelBn,
  fields,
  extraSections = [],
}: ContactContentProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const isBn = String(i18n?.language || "en").toLowerCase().startsWith("bn");
  const { submitState, statusMessage, handleSubmit, isPending } = useContactForm();

  // Localized fallbacks
  const resolvedEyebrow = (isBn && eyebrowBn) || eyebrow || (isBn ? "যোগাযোগ" : "Contact");
  const resolvedTitle = (isBn && titleBn) || title || (isBn ? "যোগাযোগ করুন" : "Get in Touch");
  const resolvedDesc =
    (isBn && descriptionBn) ||
    description ||
    (isBn
      ? "প্রশ্ন, অংশীদারিত্ব খোঁজা বা মিডিয়া অনুসন্ধান থাকলে আমাদের সাথে যোগাযোগ করুন।"
      : "Have a question, partnership inquiry, or media request? We'd love to hear from you.");

  const resolvedInfoTitle = (isBn && infoTitleBn) || infoTitle || (isBn ? "যোগাযোগের তথ্য" : "Contact Information");
  const resolvedInfoDesc =
    (isBn && infoDescriptionBn) ||
    infoDescription ||
    (isBn
      ? "গবেষণা অংশীদারিত্ব, মিডিয়া অনুসন্ধান এবং সাধারণ তথ্যের জন্য আমাদের সাথে যোগাযোগ করুন।"
      : "Get in touch with our team for research inquiries, partnerships, and media queries.");

  const resolvedFormTitle = (isBn && formTitleBn) || formTitle || (isBn ? "বার্তা পাঠান" : "Send a Message");
  const resolvedFormDesc =
    (isBn && formDescriptionBn) ||
    formDescription ||
    (isBn
      ? "নিচের ফর্মটি পূরণ করুন, আমরা দ্রুত আপনার সাথে যোগাযোগ করব।"
      : "Fill out the form below and our team will get back to you as soon as possible.");

  const resolvedSubmitLabel =
    (isBn && submitLabelBn) || submitLabel || (isBn ? "বার্তা পাঠান" : "Send Message");

  const resolvedEmail = (isBn && contactEmailBn) || contactEmail;
  const resolvedMedia = (isBn && mediaEmailBn) || mediaEmail;
  const resolvedAddress = (isBn && officeAddressBn) || officeAddress;
  const resolvedPhone = (isBn && contactPhoneBn) || contactPhone;
  const resolvedHours = (isBn && officeHoursBn) || officeHours;

  const breadcrumbList = breadcrumbs && breadcrumbs.length > 0
    ? breadcrumbs.map((b) => ({
        label: (isBn && b.labelBn) || b.label,
        href: b.href,
      }))
    : [
        { label: isBn ? "হোম" : "Home", href: "/" },
        { label: isBn ? "যোগাযোগ" : "Contact Us" },
      ];

  // Optional subtle GSAP scroll animation if user has no reduced motion preference
  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([gsapModule, stModule]) => {
        const gsap = gsapModule.default || gsapModule;
        const { ScrollTrigger } = stModule;
        gsap.registerPlugin(ScrollTrigger);

        const mm = gsap.matchMedia();
        mm.add("(prefers-reduced-motion: no-preference)", () => {
          gsap.fromTo(
            ".contact-card-info",
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: ".contact-main-grid", start: "top 80%" },
            }
          );
          gsap.fromTo(
            ".contact-card-form",
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              delay: 0.15,
              ease: "power2.out",
              scrollTrigger: { trigger: ".contact-main-grid", start: "top 80%" },
            }
          );
        }, sectionRef);

        ctx = mm;
      })
      .catch(() => {
        // Fallback gracefully if GSAP bundle fails to import
      });

    return () => {
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={sectionRef} className="w-full">
      {/* ============================================================ */}
      {/* 1. HERO SECTION — Institutional Navy & Deep Teal Atmosphere */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        {/* Deep teal radial glow accents */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(8,145,178,0.22)_0%,transparent_50%)] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_25%,rgba(20,184,166,0.12)_0%,transparent_40%)] pointer-events-none"
          aria-hidden="true"
        />
        {/* Subtle geometric grid texture */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#0891b20d_1px,transparent_1px),linear-gradient(to_bottom,#0891b20d_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"
          aria-hidden="true"
        />
        {/* Top subtle highlight border */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-400/40 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative z-10">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
              {breadcrumbList.map((crumb, idx) => {
                const isLast = idx === breadcrumbList.length - 1;
                return (
                  <li key={idx} className="inline-flex items-center gap-1.5">
                    {idx > 0 && (
                      <span className="text-slate-500 shrink-0" aria-hidden="true">
                        /
                      </span>
                    )}
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="text-slate-400 hover:text-teal-300 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current="page" className="text-slate-200 font-medium">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Eyebrow & Badge */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-teal-400">
              {resolvedEyebrow}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" aria-hidden="true" />
              <span>{isBn ? "গবেষণা ও নীতি" : "Research & Policy"}</span>
            </span>
          </div>

          {/* Title & Description */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
            {resolvedTitle}
          </h1>
          <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-2xl">
            {resolvedDesc}
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. MAIN CONTACT AREA — Balanced Two-Column Composition */}
      {/* ============================================================ */}
      <section className="bg-slate-50/70 border-b border-slate-200/70 py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="contact-main-grid grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* -------------------------------------------------------- */}
            {/* LEFT COLUMN: Contact Information & Organization Details */}
            {/* -------------------------------------------------------- */}
            <div className="contact-card-info lg:col-span-5 space-y-6">
              
              {/* Primary Contact Card */}
              <div className="relative rounded-2xl bg-white border border-slate-200/80 shadow-xs p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300/80">
                {/* Brand Accent Top Stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-navy-900 via-teal-600 to-teal-400"
                  aria-hidden="true"
                />

                {/* Soft decorative background shape */}
                <div
                  className="absolute -top-12 -right-12 w-44 h-44 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"
                  aria-hidden="true"
                />

                <div className="relative z-10">
                  <div className="mb-6">
                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-teal-600 block mb-1">
                      {isBn ? "সরাসরি যোগাযোগ" : "Direct Channels"}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {resolvedInfoTitle}
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                      {resolvedInfoDesc}
                    </p>
                  </div>

                  {/* Contact Items List */}
                  <div className="space-y-4">
                    {/* General Email */}
                    <div className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-white hover:border-teal-500/40 hover:shadow-xs transition-all duration-200">
                      <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
                        <Mail className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 block mb-0.5">
                          {isBn ? "সাধারণ অনুসন্ধান" : "General Inquiries"}
                        </span>
                        <a
                          href={`mailto:${resolvedEmail}`}
                          className="text-sm font-semibold text-slate-900 hover:text-teal-600 transition-colors break-all block"
                        >
                          {resolvedEmail}
                        </a>
                      </div>
                    </div>

                    {/* Media Queries */}
                    <div className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-white hover:border-teal-500/40 hover:shadow-xs transition-all duration-200">
                      <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-200">
                        <MessageSquare className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 block mb-0.5">
                          {isBn ? "মিডিয়া ও প্রেস অনুসন্ধান" : "Media & Press Inquiries"}
                        </span>
                        <a
                          href={`mailto:${resolvedMedia}`}
                          className="text-sm font-semibold text-slate-900 hover:text-teal-600 transition-colors break-all block"
                        >
                          {resolvedMedia}
                        </a>
                      </div>
                    </div>

                    {/* Office Address */}
                    <div className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-white hover:border-teal-500/40 hover:shadow-xs transition-all duration-200">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                        <MapPin className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 block mb-0.5">
                          {isBn ? "অফিসের অবস্থান" : "Office Address"}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 leading-snug">
                          {resolvedAddress}
                        </p>
                      </div>
                    </div>

                    {/* Phone (if available) */}
                    {resolvedPhone && (
                      <div className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-white hover:border-teal-500/40 hover:shadow-xs transition-all duration-200">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                          <Phone className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 block mb-0.5">
                            {isBn ? "ফোন নম্বর" : "Telephone"}
                          </span>
                          <a
                            href={`tel:${resolvedPhone.replace(/\s+/g, "")}`}
                            className="text-sm font-semibold text-slate-900 hover:text-teal-600 transition-colors block"
                          >
                            {resolvedPhone}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Office Hours (if available) */}
                    {resolvedHours && (
                      <div className="group flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:bg-white hover:border-teal-500/40 hover:shadow-xs transition-all duration-200">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200">
                          <Clock className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 block mb-0.5">
                            {isBn ? "অফিসের সময়সূচি" : "Office Hours"}
                          </span>
                          <p className="text-sm font-semibold text-slate-900 leading-snug">
                            {resolvedHours}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Response Reassurance & Institutional Trust Card */}
              <div className="relative rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-[#0c1f36] text-white border border-navy-800/80 p-6 sm:p-7 shadow-xs overflow-hidden">
                <div
                  className="absolute bottom-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"
                  aria-hidden="true"
                />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2.5 text-teal-400">
                    <ShieldCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {isBn ? "প্রাতিষ্ঠানিক সহযোগিতা" : "Institutional Inquiries"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {isBn
                      ? "গবেষক, বিশ্ববিদ্যালয়, নাগরিক সমাজ এবং মিডিয়া অংশীদারদের সাথে লেন্স যৌথভাবে কাজ করে। সব বার্তা আমাদের টিম সরাসরি পর্যালোচনা করে থাকে।"
                      : "LENS collaborates with universities, civic organizations, researchers, and media partners across Bangladesh and internationally."}
                  </p>
                  <div className="pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
                    <span>
                      {isBn
                        ? "সক্রিয় যোগাযোগ ও গবেষণা ডেস্ক"
                        : "Active research & communications desk"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* -------------------------------------------------------- */}
            {/* RIGHT COLUMN: Modern Contact Form Card */}
            {/* -------------------------------------------------------- */}
            <div className="contact-card-form lg:col-span-7">
              <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-6 sm:p-8 lg:p-10 transition-all duration-300 hover:shadow-md hover:border-slate-300/80">
                <div className="mb-6">
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-teal-600 block mb-1">
                    {isBn ? "সরাসরি বার্তা" : "Online Inquiry"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {resolvedFormTitle}
                  </h2>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    {resolvedFormDesc}
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                  {/* Two-column on tablet and above for Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                      >
                        {isBn ? "পুরো নাম" : "Full Name"}{" "}
                        <span className="text-teal-600 font-bold" aria-hidden="true">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                        placeholder={isBn ? "আপনার নাম" : "Your name"}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                      >
                        {isBn ? "ইমেইল" : "Email"}{" "}
                        <span className="text-teal-600 font-bold" aria-hidden="true">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                    >
                      {isBn ? "বিষয়" : "Subject"}{" "}
                      <span className="text-teal-600 font-bold" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      placeholder={isBn ? "আমরা কীভাবে সাহায্য করতে পারি?" : "How can we help?"}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
                    >
                      {isBn ? "বার্তা" : "Message"}{" "}
                      <span className="text-teal-600 font-bold" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 resize-none"
                      placeholder={isBn ? "আপনার বিস্তারিত বার্তা লিখুন..." : "Your message..."}
                    />
                  </div>

                  {/* Submit state feedback alerts */}
                  {submitState === "error" && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in duration-200"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="leading-relaxed">{statusMessage}</span>
                    </div>
                  )}

                  {submitState === "success" && (
                    <div
                      role="status"
                      className="flex items-start gap-3 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm animate-in fade-in duration-200"
                    >
                      <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="leading-relaxed font-medium">{statusMessage}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow-md hover:shadow-teal-500/20 focus:outline-none focus:ring-2 focus:ring-teal-500/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                        <span>{isBn ? "বার্তা পাঠানো হচ্ছে…" : "Sending…"}</span>
                      </>
                    ) : (
                      <>
                        <span>{resolvedSubmitLabel}</span>
                        <Send className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. EXTRA CMS SECTIONS (if configured by editor in CMS)       */}
      {/* ============================================================ */}
      {extraSections && extraSections.length > 0 && (
        <div className="w-full border-t border-slate-200/60">
          <PageSectionsView sections={extraSections} />
        </div>
      )}
    </div>
  );
}
