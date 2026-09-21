"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MapPin, Clock, ArrowRight, Mail } from "lucide-react";
import MagneticButton from "./MagneticButton";

gsap.registerPlugin(ScrollTrigger);

const eventsData = [
  {
    day: "24",
    month: "JUL",
    year: "2025",
    titleKey: "event1_title",
    locationKey: "event1_location",
    time: "8:00 AM – 6:00 PM",
    descriptionKey: "event1_desc",
    tags: ["Leadership", "Youth"],
  },
  {
    day: "15",
    month: "AUG",
    year: "2025",
    titleKey: "event2_title",
    locationKey: "event2_location",
    time: "2:00 PM – 5:00 PM",
    descriptionKey: "event2_desc",
    tags: ["Training", "Digital"],
  },
  {
    day: "05",
    month: "SEP",
    year: "2025",
    titleKey: "event3_title",
    locationKey: "event3_location",
    time: "10:00 AM – 4:00 PM",
    descriptionKey: "event3_desc",
    tags: ["Policy", "Rights"],
  },
];

function EventCard({ event, t }: { event: typeof eventsData[0]; t: (key: string) => string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className="event-card-wrap group flex gap-5 p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-400 cursor-pointer hover:border-teal-200/50"
    >
      <div className="shrink-0 relative">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-lg shadow-teal-500/20 relative z-10">
          <span className="text-xs font-medium leading-none">{event.day}</span>
          <span className="text-[10px] font-medium leading-none mt-0.5">{event.month}</span>
          <span className="text-[9px] opacity-70 leading-none mt-0.5">{event.year}</span>
        </div>
        <div className="absolute inset-0 rounded-xl border-2 border-teal-400/0 group-hover:border-teal-400/20 group-hover:scale-125 transition-all duration-500 opacity-0 group-hover:opacity-100" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-teal-50 text-teal-600 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-teal-600 transition-colors">
          {t(`events.${event.titleKey}`)}
        </h3>
        <p className="text-xs text-slate-400 mb-2 line-clamp-1">{t(`events.${event.descriptionKey}`)}</p>
        <div className="flex flex-col gap-1 mb-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-teal-500" />
            <span>{t(`events.${event.locationKey}`)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-3.5 h-3.5 text-teal-500" />
            <span>{event.time}</span>
          </div>
        </div>
        <MagneticButton className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-all shadow-md shadow-teal-500/20 hover:shadow-teal-400/30">
          {t("events.register_now")}
          <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </MagneticButton>
      </div>
    </div>
  );
}

export default function EventsNewsletter() {
  const sectionRef = useRef<HTMLElement>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".events-label",
        { opacity: 0, y: 15, filter: "blur(4px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
        }
      );

      gsap.fromTo(
        ".events-title",
        { opacity: 0, y: 25, filter: "blur(6px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
        }
      );

      gsap.fromTo(
        ".events-viewall",
        { opacity: 0, x: -10 },
        {
          opacity: 1, x: 0, duration: 0.5, delay: 0.3,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 60%" },
        }
      );

      gsap.fromTo(
        ".timeline-line",
        { scaleY: 0 },
        {
          scaleY: 1, duration: 1.5,
          ease: "power2.out",
          scrollTrigger: { trigger: ".events-timeline", start: "top 80%" },
        }
      );

      const cards = gsap.utils.toArray<HTMLElement>(".event-card-wrap");
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, x: -40, rotateY: 5 },
          {
            opacity: 1, x: 0, rotateY: 0, duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%" },
            delay: i * 0.12,
          }
        );
      });

      gsap.fromTo(
        ".newsletter-card",
        { opacity: 0, x: 40, rotateY: -5 },
        {
          opacity: 1, x: 0, rotateY: 0, duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: ".newsletter-card", start: "top 75%" },
        }
      );

      gsap.fromTo(
        ".newsletter-content > *",
        { opacity: 0, y: 15 },
        {
          opacity: 1, y: 0, duration: 0.5, stagger: 0.1, delay: 0.3,
          ease: "power2.out",
          scrollTrigger: { trigger: ".newsletter-card", start: "top 75%" },
        }
      );

      gsap.fromTo(
        ".events-bg-orb",
        { y: 30, opacity: 0 },
        {
          y: -30, opacity: 0.05, ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32 bg-white relative overflow-hidden" id="events">
      <div className="events-bg-orb absolute top-0 left-0 w-[600px] h-[600px] bg-teal-400 rounded-full blur-3xl opacity-0 pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_30%_50%,rgba(8,145,178,0.03)_0%,transparent_50%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12">
          {/* Left: Events with timeline */}
          <div>
            <span className="events-label text-xs font-semibold tracking-[0.2em] uppercase text-teal-600 mb-3 block opacity-0">
              {t("events.section_label")}
            </span>
            <h2 className="events-title text-3xl font-bold text-slate-900 mb-2 opacity-0">
              {t("events.section_title")}
            </h2>
            <a
              href="/events"
              className="events-viewall inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-500 transition-colors mb-8 group opacity-0"
            >
              {t("events.view_all")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <div className="events-timeline relative pl-8">
              <div className="timeline-line absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-teal-400/30 via-teal-400/10 to-transparent origin-top" />

              <div className="flex flex-col gap-6">
                {eventsData.map((event) => (
                  <div key={event.titleKey} className="relative">
                    <div className="absolute -left-5 top-6 w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-white shadow-sm" />
                    <EventCard event={event} t={t} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Newsletter */}
          <div className="newsletter-card flex flex-col justify-center">
            <div className="p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/8 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gold-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" viewBox="0 0 400 400">
                  <defs>
                    <pattern id="newsletter-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <circle cx="15" cy="15" r="0.5" fill="rgba(255,255,255,0.3)" />
                    </pattern>
                  </defs>
                  <rect width="400" height="400" fill="url(#newsletter-grid)" />
                </svg>
              </div>

              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />

              <div className="newsletter-content relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/20 flex items-center justify-center mb-5">
                  <Mail className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {t("newsletter.title")}
                </h3>
                <p className="text-slate-300/70 text-sm mb-6">
                  {t("newsletter.subtitle")}
                </p>

                <div className="flex gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-teal-400">2.5K+</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">{t("newsletter.subscribers")}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gold-400">{t("newsletter.frequency")}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">{t("newsletter.frequency_label")}</div>
                  </div>
                </div>

                <div className="flex gap-0">
                  <input
                    type="email"
                    placeholder={t("newsletter.email_placeholder")}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className={`flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-l-full text-white placeholder:text-slate-400 text-sm focus:outline-none transition-all duration-300 ${
                      emailFocused
                        ? "border-teal-400/50 bg-white/10 shadow-lg shadow-teal-500/10"
                        : ""
                    }`}
                  />
                  <button className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-r-full transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-400/30">
                    {t("newsletter.subscribe")}
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 mt-3">
                  {t("newsletter.disclaimer")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
