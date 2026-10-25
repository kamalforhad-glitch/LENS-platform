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

const Hero = dynamic(() => import("@/components/Hero"));
const FocusAreas = dynamic(() => import("@/components/FocusAreas"));
const FeaturedResearch = dynamic(() => import("@/components/FeaturedResearch"));
const ImpactStats = dynamic(() => import("@/components/ImpactStats"));
const EventsNewsletter = dynamic(() => import("@/components/EventsNewsletter"));
const PageSectionsView = dynamic(() => import("@/components/page/PageSectionsView"));
const SmoothScrollProvider = dynamic(() => import("@/components/SmoothScrollProvider"), { ssr: false });
const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), { ssr: false });
const BackToTop = dynamic(() => import("@/components/BackToTop"), { ssr: false });

function SectionSeparator() {
  return (
    <div className="relative h-px">
      <div className="section-separator absolute inset-0" />
    </div>
  );
}

export interface HomeSectionData {
  id: string;
  type: string;
  title: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  sortOrder: number;
  visible?: boolean;
  settings?: any;
  content?: any;
  contentBn?: any;
}

export default function HomeClient({
  header,
  footer,
  pageData,
}: {
  header: ReactNode;
  footer: ReactNode;
  pageData?: any;
}) {
  const rawSections: HomeSectionData[] = Array.isArray(pageData?.sections) ? pageData.sections : [];
  
  // Sort sections by sortOrder
  const sortedSections = [...rawSections].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const isVisible = (sec?: HomeSectionData) => (sec ? sec.visible !== false : true);
  const visibleSections = sortedSections.filter(isVisible);

  // Check if indexing_scanner is an explicit section in DB
  const hasExplicitScanner = visibleSections.some((s) => s.type === "indexing_scanner" || s.type === "indexing");

  const renderSection = (sec: HomeSectionData, index: number) => {
    switch (sec.type) {
      case "hero":
        return <Hero key={sec.id || `hero-${index}`} cmsData={sec} />;

      case "focus":
        return (
          <div key={sec.id || `focus-${index}`}>
            <SectionSeparator />
            <section id="focus">
              <FocusAreas cmsData={sec} />
            </section>
            {/* Auto-render IndexingScanner after focus if not an explicit custom section */}
            {!hasExplicitScanner && <IndexingScanner />}
          </div>
        );

      case "indexing_scanner":
      case "indexing":
        return <IndexingScanner key={sec.id || `scanner-${index}`} />;

      case "featured_research":
        return (
          <div key={sec.id || `research-${index}`}>
            <section id="research">
              <FeaturedResearch cmsData={sec} />
            </section>
          </div>
        );

      case "impact":
        return (
          <div key={sec.id || `impact-${index}`}>
            <SectionSeparator />
            <section id="impact">
              <ImpactStats cmsData={sec} />
            </section>
          </div>
        );

      case "events_newsletter":
        return (
          <div key={sec.id || `events-${index}`}>
            <SectionSeparator />
            <section id="events">
              <EventsNewsletter cmsData={sec} />
            </section>
          </div>
        );

      case "tabs":
      case "nested_tabs":
        return (
          <div key={sec.id || `tabs-${index}`}>
            <SectionSeparator />
            <section id="tabs" className="relative">
              <PageSectionsView sections={[{
                ...sec,
                id: sec.id,
                type: sec.type,
                title: sec.title || "",
                titleBn: sec.titleBn || "",
                description: sec.description || "",
                descriptionBn: sec.descriptionBn || "",
                sortOrder: sec.sortOrder ?? index,
                visible: true,
                settings: typeof sec.settings === "object" ? sec.settings : {},
                content: typeof sec.content === "object" ? sec.content : {},
                contentBn: typeof sec.contentBn === "object" ? sec.contentBn : {},
              } as any]} />
            </section>
          </div>
        );

      default:
        // Render any reusable block added from the CMS library
        return (
          <div key={sec.id || `sec-${index}`}>
            <SectionSeparator />
            <PageSectionsView sections={[{
              ...sec,
              id: sec.id,
              type: sec.type,
              title: sec.title || "",
              titleBn: sec.titleBn || "",
              description: sec.description || "",
              descriptionBn: sec.descriptionBn || "",
              sortOrder: sec.sortOrder ?? index,
              visible: true,
              settings: typeof sec.settings === "object" ? sec.settings : {},
              content: typeof sec.content === "object" ? sec.content : {},
              contentBn: typeof sec.contentBn === "object" ? sec.contentBn : {},
            } as any]} />
          </div>
        );
    }
  };

  return (
    <ErrorBoundary>
      <SmoothScrollProvider />
      <ScrollProgress />

      <div className="noise-overlay" aria-hidden="true" />

      {header}
      <main className="flex-1" id="main-content">
        {visibleSections.length > 0 ? (
          visibleSections.map((sec, idx) => renderSection(sec, idx))
        ) : (
          // Default fallback if sections array is empty
          <>
            <Hero />
            <SectionSeparator />
            <section id="focus"><FocusAreas /></section>
            <IndexingScanner />
            <section id="research"><FeaturedResearch /></section>
            <SectionSeparator />
            <section id="impact"><ImpactStats /></section>
            <SectionSeparator />
            <section id="events"><EventsNewsletter /></section>
          </>
        )}
      </main>
      {footer}
      <BackToTop />
    </ErrorBoundary>
  );
}
