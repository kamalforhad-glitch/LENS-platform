const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lens.org.bd";

// ============================================================
// Enhanced Organization Schema
// ============================================================
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "ResearchOrganization", "EducationalOrganization"],
    name: "LENS",
    alternateName: "Lighthouse for Evolving Narrative Systems",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    description:
      "LENS is a research-driven think tank working to strengthen Bangladesh's narrative ecosystem through evidence, media literacy, strategic communication and policy engagement.",
    foundingDate: "2024",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BD",
      addressLocality: "Dhaka",
      addressRegion: "Dhaka Division",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "General Inquiries",
        email: "info@lens.org.bd",
        availableLanguage: ["English", "Bengali"],
      },
      {
        "@type": "ContactPoint",
        contactType: "Media Inquiries",
        email: "media@lens.org.bd",
        availableLanguage: ["English", "Bengali"],
      },
    ],
    sameAs: [
      "https://www.facebook.com/lensorgbd",
      "https://twitter.com/lensorgbd",
      "https://www.linkedin.com/company/lensorgbd",
      "https://www.youtube.com/@lensorgbd",
    ],
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    knowsAbout: [
      "Media Literacy",
      "Press Freedom",
      "Narrative Research",
      "Policy Advocacy",
      "Digital Rights",
      "Journalist Safety",
      "Cybersecurity",
      "Media Indexing",
      "Strategic Communication",
      "Civic Engagement",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Research & Programs",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Research & Insights",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Media Literacy Training",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Policy Advocacy",
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// Website Schema with SearchAction
// ============================================================
export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LENS — Lighthouse for Evolving Narrative Systems",
    url: BASE_URL,
    description:
      "Research-driven think tank strengthening Bangladesh's narrative ecosystem.",
    publisher: {
      "@type": "Organization",
      name: "LENS",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// Breadcrumb Schema
// ============================================================
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// Article / Research Schema
// ============================================================
export function ArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  author,
  image,
  category,
  keywords,
  inLanguage,
}: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
  category?: string;
  keywords?: string[];
  inLanguage?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: title,
    description,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Organization",
      name: author || "LENS",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "LENS",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/research`,
    },
    inLanguage: inLanguage || "en",
    isAccessibleForFree: true,
    ...(category && { about: { "@type": "Thing", name: category } }),
    ...(keywords && { keywords: keywords.join(", ") }),
    ...(image && {
      image: {
        "@type": "ImageObject",
        url: image,
        width: 1200,
        height: 630,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// Event Schema (Enhanced)
// ============================================================
export function EventSchema({
  name,
  description,
  startDate,
  endDate,
  location,
  url,
  offers,
}: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  url: string;
  offers?: { price: string; currency: string; url?: string };
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description,
    startDate,
    endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: location,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dhaka",
        addressCountry: "BD",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "LENS",
      url: BASE_URL,
    },
    performer: {
      "@type": "Organization",
      name: "LENS",
    },
    url,
    offers: offers
      ? {
          "@type": "Offer",
          price: offers.price,
          priceCurrency: offers.currency,
          availability: "https://schema.org/InStock",
          validFrom: startDate,
          ...(offers.url && { url: offers.url }),
        }
      : {
          "@type": "Offer",
          price: "0",
          priceCurrency: "BDT",
          availability: "https://schema.org/InStock",
        },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================================
// FAQ Schema
// ============================================================
export function FAQSchema({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
