// ============================================================
// Content Type Definitions for CMS-ready Architecture
// ============================================================

export interface ResearchArticle {
  slug: string;
  title: string;
  description: string;
  category: "Research Report" | "Working Paper" | "Policy Brief" | "Data Analysis";
  datePublished: string;
  dateModified?: string;
  author: string;
  tags: string[];
  image?: string;
  pdfUrl?: string;
  content: string;
  featured?: boolean;
}

export interface Publication {
  slug: string;
  title: string;
  description: string;
  type: "Policy Brief" | "Working Paper" | "Research Report" | "Report";
  datePublished: string;
  dateModified?: string;
  author: string;
  tags: string[];
  pdfUrl?: string;
  pages?: number;
}

export interface Event {
  slug: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  time: string;
  location: string;
  locationUrl?: string;
  registrationUrl?: string;
  category: "Summit" | "Workshop" | "Conference" | "Launch" | "Webinar";
  capacity?: number;
  registered?: number;
}

export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  image?: string;
  email?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
  };
}

export interface ContentMetadata {
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  category?: string;
  tags?: string[];
}

// ============================================================
// Static content data (replace with CMS fetch in production)
// ============================================================

export const researchArticles: ResearchArticle[] = [
  {
    slug: "narratives-in-the-digital-age",
    title: "Narratives in the Digital Age",
    description:
      "Mapping trends, risks and opportunities in Bangladesh's information ecosystem.",
    category: "Research Report",
    datePublished: "2025-05-15",
    author: "LENS Research Team",
    tags: ["digital media", "narratives", "Bangladesh", "information ecosystem"],
    featured: true,
    content: "",
  },
  {
    slug: "media-index-bangladesh-2025",
    title: "Media Index Bangladesh 2025",
    description:
      "Trends, risks and emerging narratives in the local media landscape.",
    category: "Research Report",
    datePublished: "2025-02-20",
    author: "LENS Research Team",
    tags: ["media index", "press freedom", "Bangladesh"],
    content: "",
  },
  {
    slug: "youth-narratives-civic-engagement",
    title: "Youth, Narratives and Civic Engagement",
    description:
      "Insights from a national study on young people's media consumption and trust.",
    category: "Working Paper",
    datePublished: "2025-03-10",
    author: "LENS Research Team",
    tags: ["youth", "civic engagement", "media consumption"],
    content: "",
  },
  {
    slug: "media-literacy-resilient-democracy",
    title: "Media Literacy for a Resilient Democracy",
    description:
      "Recommendations for a safer and more informed digital public sphere.",
    category: "Policy Brief",
    datePublished: "2025-04-05",
    author: "LENS Policy Team",
    tags: ["media literacy", "democracy", "digital public sphere"],
    content: "",
  },
];

export const publications: Publication[] = [
  {
    slug: "media-literacy-resilient-democracy",
    title: "Media Literacy for a Resilient Democracy",
    description: "Recommendations for a safer and more informed digital public sphere.",
    type: "Policy Brief",
    datePublished: "2025-04-05",
    author: "LENS Policy Team",
    tags: ["media literacy", "democracy"],
    pages: 24,
  },
  {
    slug: "youth-narratives-civic-engagement",
    title: "Youth, Narratives and Civic Engagement",
    description: "Insights from a national study on young people's media consumption and trust.",
    type: "Working Paper",
    datePublished: "2025-03-10",
    author: "LENS Research Team",
    tags: ["youth", "civic engagement"],
    pages: 48,
  },
  {
    slug: "media-index-bangladesh-2025",
    title: "Media Index Bangladesh 2025",
    description: "Trends, risks and emerging narratives in the local media landscape.",
    type: "Research Report",
    datePublished: "2025-02-20",
    author: "LENS Research Team",
    tags: ["media index", "press freedom"],
    pages: 72,
  },
];

export const events: Event[] = [
  {
    slug: "young-educators-leadership-summit-2025",
    name: "Young Educators' Leadership Summit 2025",
    description: "A summit bringing together young educators to discuss media literacy and civic engagement.",
    startDate: "2025-07-24",
    endDate: "2025-07-24",
    time: "8:00 AM - 6:00 PM",
    location: "NAEM, Dhaka",
    category: "Summit",
    capacity: 200,
    registered: 156,
  },
  {
    slug: "media-literacy-workshop-series",
    name: "Media Literacy Workshop Series",
    description: "Interactive workshop on digital media literacy for journalists and civil society.",
    startDate: "2025-08-15",
    endDate: "2025-08-15",
    time: "10:00 AM - 4:00 PM",
    location: "Online (Zoom)",
    category: "Workshop",
  },
  {
    slug: "bpfi-2025-launch",
    name: "BPFI 2025 Launch Event",
    description: "Launch of the Bangladesh Press Freedom Index 2025 report.",
    startDate: "2025-09-10",
    endDate: "2025-09-10",
    time: "6:00 PM - 8:00 PM",
    location: "Dhaka Press Club",
    category: "Launch",
  },
];
