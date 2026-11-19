"use client";

import { useEffect, useRef } from "react";
import { useContactForm } from "@/lib/api/useContactForm";

interface ContactSettingsProps {
  contactEmail?: string;
  mediaEmail?: string;
  officeAddress?: string;
  contactPhone?: string;
  officeHours?: string;
}

export default function ContactContent({
  contactEmail = "info@lensbd.org",
  mediaEmail = "media@lensbd.org",
  officeAddress = "Dhaka, Bangladesh",
  contactPhone,
  officeHours,
}: ContactSettingsProps = {}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { submitState, statusMessage, handleSubmit, isPending } = useContactForm();

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    // Defer heavy GSAP animation bundle until client hydration
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, stModule]) => {
      const gsap = gsapModule.default || gsapModule;
      const { ScrollTrigger } = stModule;
      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".contact-info",
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".contact-form-section", start: "top 70%" } }
        );
        gsap.fromTo(
          ".contact-form",
          { opacity: 0, x: 30 },
          { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".contact-form-section", start: "top 70%" } }
        );
        gsap.fromTo(
          ".contact-bg-orb",
          { y: 40, opacity: 0 },
          { y: -40, opacity: 0.06, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 2 } }
        );
      }, sectionRef);

      ctx = mm;
    });

    return () => {
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={sectionRef}>
      <section className="relative py-20 bg-navy-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />
        <div className="contact-bg-orb absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-teal-400 rounded-full blur-3xl opacity-0 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="contact-hero-label text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block">
            Contact
          </span>
          <h1 className="contact-hero-title text-4xl lg:text-5xl font-bold text-white mb-6">
            Get in Touch
          </h1>
          <p className="contact-hero-desc text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto">
            Have a question, partnership inquiry, or media request? We&apos;d
            love to hear from you.
          </p>
        </div>
      </section>

      <section className="contact-form-section py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="contact-info">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Email</h3>
                  <a href={`mailto:${contactEmail}`} className="text-sm text-slate-500 hover:text-teal-600 transition-colors">{contactEmail}</a>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Address</h3>
                  <p className="text-sm text-slate-500">{officeAddress}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">General Inquiries</h3>
                  <a href={`mailto:${contactEmail}`} className="text-sm text-slate-500 hover:text-teal-600 transition-colors">{contactEmail}</a>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Media Queries</h3>
                  <a href={`mailto:${mediaEmail}`} className="text-sm text-slate-500 hover:text-teal-600 transition-colors">{mediaEmail}</a>
                </div>
                {contactPhone && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Phone</h3>
                    <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="text-sm text-slate-500 hover:text-teal-600 transition-colors">{contactPhone}</a>
                  </div>
                )}
                {officeHours && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Office Hours</h3>
                    <p className="text-sm text-slate-500">{officeHours}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Send a Message
              </h2>
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors resize-none"
                    placeholder="Your message..."
                  />
                </div>
                {submitState === "error" && (
                  <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {statusMessage}
                  </p>
                )}
                {submitState === "success" && (
                  <p role="status" className="text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                    {statusMessage}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? "Sending…" : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
