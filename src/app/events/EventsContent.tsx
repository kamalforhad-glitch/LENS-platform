"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { EventSchema } from "@/components/SchemaOrg";
import ContentListState from "@/components/ContentListState";
import type { EventCard } from "@/lib/public-content";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  events: EventCard[];
  error?: boolean;
};

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_BN = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

export default function EventsContent({ events, error = false }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { i18n, t } = useTranslation();
  const lang = String(i18n.language || "en").toLowerCase();
  const bn = lang.startsWith("bn");
  const months = bn ? MONTHS_BN : MONTHS_EN;

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(".events-hero-label", { opacity: 0, y: 20, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out", delay: 0.2 });
      gsap.fromTo(".events-hero-title", { opacity: 0, y: 30, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out", delay: 0.4 });
      gsap.fromTo(".events-hero-desc", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.6 });

      const timelineLine = gsap.utils.toArray<HTMLElement>(".event-timeline-line");
      timelineLine.forEach(line => {
        gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: "power2.out", scrollTrigger: { trigger: ".events-timeline", start: "top 80%" } });
      });

      const cards = gsap.utils.toArray<HTMLElement>(".event-card");
      cards.forEach((card, i) => {
        gsap.fromTo(card, { opacity: 0, x: -40, rotateY: 5 }, { opacity: 1, x: 0, rotateY: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 85%" }, delay: i * 0.12 });
      });

      gsap.fromTo(".events-bg-orb", { y: 40, opacity: 0 }, { y: -40, opacity: 0.05, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 2 } });
    }, sectionRef);

    return () => mm.revert();
  }, [events.length]);

  const eventSchemas = events.map((event) => (
    <EventSchema
      key={event.slug}
      name={bn && event.nameBn ? event.nameBn : event.name}
      description={bn && event.descriptionBn ? event.descriptionBn : event.description}
      startDate={event.startDate.toISOString()}
      endDate={event.startDate.toISOString()}
      location={event.location}
      url={`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.lensbd.org"}/events/${event.slug}`}
    />
  ));

  const emptyState = (
    <ContentListState
      variant={error ? "error" : "empty"}
      emptyMessage={t("events.emptyMessage") || "No events have been announced yet."}
    />
  );

  const timeline = (
    <div className="events-timeline relative pl-8">
      <div className="event-timeline-line absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-teal-400/30 via-teal-400/10 to-transparent origin-top" />
      <div className="space-y-8">
        {events.map((event) => (
          <div key={event.slug} className="relative">
            <div className="absolute -left-5 top-6 w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-white shadow-sm z-10" />
            <Link
              href={`/events/${event.slug}`}
              className="event-card block flex gap-6 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-lg shadow-teal-500/20">
                <span className="text-xs font-medium leading-none">
                  {event.startDate.getDate()}
                </span>
                <span className="text-[10px] font-medium leading-none mt-0.5">
                  {months[event.startDate.getMonth()]}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  {bn && event.nameBn ? event.nameBn : event.name}
                </h2>
                <p className="text-sm text-slate-500 mb-2">
                  {bn && event.descriptionBn ? event.descriptionBn : event.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{event.location}</span>
                  <span>{event.time}</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div ref={sectionRef}>
      <>
        {eventSchemas}
        <section className="relative py-20 bg-navy-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_60%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />
          <div className="events-bg-orb absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-400 rounded-full blur-3xl opacity-0 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <span className="events-hero-label text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
              {t("events.label")}
            </span>
            <h1 className="events-hero-title text-4xl lg:text-5xl font-bold text-white mb-6">
              {t("events.hero_title")}
            </h1>
            <p className="events-hero-desc text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
              {t("events.hero_description")}
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {events.length === 0 ? emptyState : timeline}
          </div>
        </section>
      </>
    </div>
  );
}