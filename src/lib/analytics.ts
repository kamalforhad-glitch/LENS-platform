// ============================================================
// Analytics Event Taxonomy
// ============================================================
// Standardized event tracking for GA4 and Meta Pixel
// Dashboard-ready event structure

export const AnalyticsEvents = {
  // Page & Navigation
  PAGE_VIEW: "page_view",
  PAGE_EXIT: "page_exit",

  // Scroll & Engagement
  SCROLL_DEPTH: "scroll_depth",
  SECTION_VIEW: "section_view",
  TIME_ON_PAGE: "time_on_page",

  // Content Interaction
  RESEARCH_VIEW: "research_view",
  PUBLICATION_VIEW: "publication_view",
  FILE_DOWNLOAD: "file_download",
  EXTERNAL_LINK: "external_link",

  // Conversion Events
  NEWSLETTER_SIGNUP: "newsletter_signup",
  FORM_SUBMISSION: "form_submission",
  CONTACT_SUBMIT: "contact_submit",
  EVENT_REGISTER: "event_register",
  PARTNERSHIP_INQUIRY: "partnership_inquiry",
  CTA_CLICK: "cta_click",

  // Social
  SOCIAL_SHARE: "social_share",
} as const;

// ============================================================
// Event Parameter Types
// ============================================================

export interface AnalyticsEventParams {
  // Common
  event_category?: string;
  event_label?: string;
  value?: number;

  // Scroll
  scroll_percent?: number;
  section_id?: string;

  // Content
  content_type?: string;
  content_id?: string;
  content_title?: string;

  // Download
  file_name?: string;
  file_type?: string;

  // Form
  form_name?: string;
  form_destination?: string;

  // CTA
  cta_name?: string;
  cta_location?: string;
  cta_destination?: string;
}

// ============================================================
// Tracking Functions
// ============================================================

export function trackEvent(
  eventName: string,
  params?: AnalyticsEventParams
) {
  if (typeof window === "undefined") return;

  // GA4
  if (window.dataLayer) {
    window.dataLayer.push(["event", eventName, params]);
  }

  // Meta Pixel
  if (window._fbq) {
    const metaEvents: Record<string, string> = {
      [AnalyticsEvents.NEWSLETTER_SIGNUP]: "Lead",
      [AnalyticsEvents.CONTACT_SUBMIT]: "Contact",
      [AnalyticsEvents.EVENT_REGISTER]: "Lead",
      [AnalyticsEvents.PARTNERSHIP_INQUIRY]: "Lead",
      [AnalyticsEvents.CTA_CLICK]: "ViewContent",
      [AnalyticsEvents.FILE_DOWNLOAD]: "ViewContent",
    };

    const metaEvent = metaEvents[eventName];
    if (metaEvent) {
      window._fbq("track", metaEvent, params);
    }
  }
}

export function trackPageView(url: string, title?: string) {
  trackEvent(AnalyticsEvents.PAGE_VIEW, {
    event_label: title || url,
  });
}

export function trackScrollDepth(percent: number) {
  trackEvent(AnalyticsEvents.SCROLL_DEPTH, {
    scroll_percent: percent,
  });
}

export function trackSectionView(sectionId: string) {
  trackEvent(AnalyticsEvents.SECTION_VIEW, {
    section_id: sectionId,
  });
}

export function trackResearchView(slug: string, title: string) {
  trackEvent(AnalyticsEvents.RESEARCH_VIEW, {
    content_id: slug,
    content_title: title,
    content_type: "research",
  });
}

export function trackPublicationView(slug: string, title: string) {
  trackEvent(AnalyticsEvents.PUBLICATION_VIEW, {
    content_id: slug,
    content_title: title,
    content_type: "publication",
  });
}

export function trackFileDownload(fileName: string, fileType: string) {
  trackEvent(AnalyticsEvents.FILE_DOWNLOAD, {
    file_name: fileName,
    file_type: fileType,
  });
}

export function trackCTAClick(ctaName: string, ctaLocation: string) {
  trackEvent(AnalyticsEvents.CTA_CLICK, {
    cta_name: ctaName,
    cta_location: ctaLocation,
  });
}

export function trackNewsletterSignup() {
  trackEvent(AnalyticsEvents.NEWSLETTER_SIGNUP, {
    event_category: "conversion",
  });
}

export function trackFormSubmission(formName: string) {
  trackEvent(AnalyticsEvents.FORM_SUBMISSION, {
    form_name: formName,
    event_category: "conversion",
  });
}

export function trackExternalLink(url: string, label: string) {
  trackEvent(AnalyticsEvents.EXTERNAL_LINK, {
    event_label: label,
    value: 1,
  });
}

// ============================================================
// Section View Observer
// ============================================================

export function initSectionTracking() {
  if (typeof window === "undefined") return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id) {
          trackSectionView(entry.target.id);
        }
      });
    },
    { threshold: 0.3 }
  );

  // Observe all sections with IDs
  document.querySelectorAll("section[id]").forEach((section) => {
    observer.observe(section);
  });

  return () => observer.disconnect();
}
