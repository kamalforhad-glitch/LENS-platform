// Client body of the homepage. Header/footer arrive as server-rendered
// slots from page.tsx (React allows server components as props of client
// components) so the home route keeps CMS-driven navigation without a
// new public API. Everything else is byte-identical to the previous
// client home page.
"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import IndexingScanner from "@/components/IndexingScanner";

const Hero = dynamic(() => import("@/components/Hero"), { ssr: false });
const FocusAreas = dynamic(() => import("@/components/FocusAreas"), { ssr: false });
const FeaturedResearch = dynamic(() => import("@/components/FeaturedResearch"), { ssr: false });
const ImpactStats = dynamic(() => import("@/components/ImpactStats"), { ssr: false });
const EventsNewsletter = dynamic(() => import("@/components/EventsNewsletter"), { ssr: false });
const SmoothScrollProvider = dynamic(() => import("@/components/SmoothScrollProvider"), { ssr: false });
const CustomCursor = dynamic(() => import("@/components/CustomCursor"), { ssr: false });
const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), { ssr: false });
const BackToTop = dynamic(() => import("@/components/BackToTop"), { ssr: false });

function SectionSeparator() {
  return (
    <div className="relative h-px">
      <div className="section-separator absolute inset-0" />
    </div>
  );
}

export default function HomeClient({ header, footer }: { header: ReactNode; footer: ReactNode }) {
  return (
    <ErrorBoundary>
      <SmoothScrollProvider>
        <ScrollProgress />

        <div className="noise-overlay" aria-hidden="true" />

        {header}
        <main className="flex-1" id="main-content">
          <Hero />
          <SectionSeparator />
          <section id="focus">
            <FocusAreas />
          </section>
          {/* Press Freedom Index live-radar section (replaces the old separator gap). */}
          <IndexingScanner />
          <section id="research">
            <FeaturedResearch />
          </section>
          <SectionSeparator />
          <section id="impact">
            <ImpactStats />
          </section>
          <SectionSeparator />
          <section id="events">
            <EventsNewsletter />
          </section>
        </main>
        {footer}
        <BackToTop />
      </SmoothScrollProvider>
    </ErrorBoundary>
  );
}
