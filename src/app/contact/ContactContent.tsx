"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ContactContent() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".contact-hero-label", { opacity: 0, y: 20, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out", delay: 0.2 });
      gsap.fromTo(".contact-hero-title", { opacity: 0, y: 30, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power3.out", delay: 0.4 });
      gsap.fromTo(".contact-hero-desc", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.6 });

      gsap.fromTo(".contact-info", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".contact-form-section", start: "top 70%" } });
      gsap.fromTo(".contact-form", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".contact-form-section", start: "top 70%" } });

      gsap.fromTo(".contact-bg-orb", { y: 40, opacity: 0 }, { y: -40, opacity: 0.06, ease: "none", scrollTrigger: { trigger: sectionRef.current, start: "top bottom", end: "bottom top", scrub: 2 } });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef}>
      <section className="relative py-20 bg-navy-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />
        <div className="contact-bg-orb absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-teal-400 rounded-full blur-3xl opacity-0 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="contact-hero-label text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-4 block opacity-0">
            Contact
          </span>
          <h1 className="contact-hero-title text-4xl lg:text-5xl font-bold text-white mb-6 opacity-0">
            Get in Touch
          </h1>
          <p className="contact-hero-desc text-lg text-slate-300/80 leading-relaxed max-w-2xl mx-auto opacity-0">
            Have a question, partnership inquiry, or media request? We&apos;d
            love to hear from you.
          </p>
        </div>
      </section>

      <section className="contact-form-section py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="contact-info opacity-0">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Email</h3>
                  <p className="text-sm text-slate-500">info@lens.org.bd</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Address</h3>
                  <p className="text-sm text-slate-500">Dhaka, Bangladesh</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">General Inquiries</h3>
                  <p className="text-sm text-slate-500">info@lens.org.bd</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Media Queries</h3>
                  <p className="text-sm text-slate-500">media@lens.org.bd</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form opacity-0">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Send a Message
              </h2>
              <form className="space-y-4" action="#" method="POST">
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
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
