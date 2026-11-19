// Client body of the homepage. Header/footer arrive as server-rendered
// slots from page.tsx (React allows server components as props of client
// components) so the home route keeps CMS-driven navigation without a
// new public API. Everything else is byte-identical to the previous
// client home page.
"use client";

import dynamic from "next/dynamic";
import { useMemo, type ReactNode } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Hero from "@/components/Hero";
import PageSectionsView from "@/components/page/PageSectionsView";
import type { FocusAreaDto } from "@/lib/focus-types";

// Below-the-fold sections are dynamically code-split with SSR enabled so
// initial server HTML and SEO remain 100% intact while client JS is deferred.
const FocusAreas = dynamic(() => import("@/components/FocusAreas"));
const FeaturedResearch = dynamic(() => import("@/components/FeaturedResearch"));
const ImpactStats = dynamic(() => import("@/components/ImpactStats"));
const EventsNewsletter = dynamic(() => import("@/components/EventsNewsletter"));
const IndexingScanner = dynamic(() => import("@/components/IndexingScanner"));

// Behavior-only widgets: client-side scroll/overlay chrome that would add
// nothing to the first paint, so they stay out of the critical bundle.
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

/** Coerce a CMS blob field into an object (CMS may store null/scalar). */
const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/**
 * Normalize a raw CMS section for PageSectionsView: every field it reads
 * must be present, so defaults are applied once here rather than being
 * re-inlined at each call site.
 */
function toPageSection(sec: HomeSectionData, index: number): HomeSectionData {
  return {
    ...sec,
    title: sec.title || "",
    titleBn: sec.titleBn || "",
    description: sec.description || "",
    descriptionBn: sec.descriptionBn || "",
    sortOrder: sec.sortOrder ?? index,
    visible: true,
    settings: asObject(sec.settings),
    content: asObject(sec.content),
    contentBn: asObject(sec.contentBn),
  };
}

export default function HomeClient({
  header,
  footer,
  pageData,
  initialFocusAreas = [],
}: {
  header: ReactNode;
  footer: ReactNode;
  pageData?: any;
  initialFocusAreas?: FocusAreaDto[];
}) {
  // Section prep is pure and only depends on `pageData`, so it runs once
  // per payload instead of on every render of the home tree.
  const { visibleSections, hasExplicitScanner } = useMemo(() => {
    const rawSections: HomeSectionData[] = Array.isArray(pageData?.sections)
      ? pageData.sections
      : [];
    const sorted = [...rawSections].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    const visible = sorted.filter((sec) => sec.visible !== false);
    return {
      visibleSections: visible,
      hasExplicitScanner: visible.some(
        (s) => s.type === "indexing_scanner" || s.type === "indexing"
      ),
    };
  }, [pageData]);

  const renderSection = (sec: HomeSectionData, index: number) => {
    const key = sec.id || `sec-${index}`;
    switch (sec.type) {
      case "hero":
        return <Hero key={key} cmsData={sec} />;

      case "focus":
        return (
          <div key={key}>
            <SectionSeparator />
            <section id="focus">
              <FocusAreas cmsData={sec} initialAreas={initialFocusAreas} />
            </section>
            {/* Auto-render IndexingScanner after focus if not an explicit custom section */}
            {!hasExplicitScanner && <IndexingScanner cmsData={sec} />}
          </div>
        );

      case "indexing_scanner":
      case "indexing":
        return <IndexingScanner key={key} cmsData={sec} />;

      case "featured_research":
        return (
          <section key={key} id="research">
            <FeaturedResearch cmsData={sec} />
          </section>
        );

      case "impact":
        return (
          <div key={key}>
            <SectionSeparator />
            <section id="impact">
              <ImpactStats cmsData={sec} />
            </section>
          </div>
        );

      case "events_newsletter":
        return (
          <div key={key}>
            <SectionSeparator />
            <section id="events">
              <EventsNewsletter cmsData={sec} />
            </section>
          </div>
        );

      case "tabs":
      case "nested_tabs":
        return (
          <div key={key}>
            <SectionSeparator />
            <section id="tabs" className="relative">
              <PageSectionsView sections={[toPageSection(sec, index) as any]} />
            </section>
          </div>
        );

      default:
        // Render any reusable block added from the CMS library
        return (
          <div key={key}>
            <SectionSeparator />
            <PageSectionsView sections={[toPageSection(sec, index) as any]} />
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
            <section id="focus"><FocusAreas initialAreas={initialFocusAreas} /></section>
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
