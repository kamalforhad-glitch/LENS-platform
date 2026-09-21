"use client";

import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/ErrorBoundary";

const Header = dynamic(() => import("@/components/Header"), { ssr: false });
const Hero = dynamic(() => import("@/components/Hero"), { ssr: false });
const FocusAreas = dynamic(() => import("@/components/FocusAreas"), { ssr: false });
const FeaturedResearch = dynamic(() => import("@/components/FeaturedResearch"), { ssr: false });
const AISection = dynamic(() => import("@/components/AISection"), { ssr: false });
const ImpactStats = dynamic(() => import("@/components/ImpactStats"), { ssr: false });
const EventsNewsletter = dynamic(() => import("@/components/EventsNewsletter"), { ssr: false });
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });
const SmoothScrollProvider = dynamic(() => import("@/components/SmoothScrollProvider"), { ssr: false });
const CustomCursor = dynamic(() => import("@/components/CustomCursor"), { ssr: false });
const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), { ssr: false });
const BackToTop = dynamic(() => import("@/components/BackToTop"), { ssr: false });
const FloatingAIButton = dynamic(() => import("@/components/FloatingAIButton"), { ssr: false });

function SectionSeparator() {
  return (
    <div className="relative h-px">
      <div className="section-separator absolute inset-0" />
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <SmoothScrollProvider>
        <ScrollProgress />

        <div className="noise-overlay" aria-hidden="true" />

        <Header />
        <main className="flex-1" id="main-content">
          <Hero />
          <SectionSeparator />
          <section id="focus">
            <FocusAreas />
          </section>
          <SectionSeparator />
          <section id="research">
            <FeaturedResearch />
          </section>
          <SectionSeparator />
          <section id="ai-assistant">
            <AISection />
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
        <Footer />
        <BackToTop />
        <FloatingAIButton />
      </SmoothScrollProvider>
    </ErrorBoundary>
  );
}
