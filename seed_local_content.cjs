// TEMPORARY local dev content seeder (deleted after use).
// Creates published + draft records so the CMS→public flow can be verified.
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres@127.0.0.1:5432/lens";
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient({ log: [] });

const D = (s) => new Date(s);

async function main() {
  const upsert = async (model, slug, data) => {
    await db[model].upsert({ where: { slug }, update: data, create: { slug, ...data } });
  };

  // ---- Blog posts ----
  await upsert("blogPost", "understanding-media-narratives-social-media", {
    title: "Understanding Media Narratives in the Age of Social Media",
    description: "How social media platforms are reshaping the way narratives form and spread in Bangladesh.",
    content:
      "Social platforms have changed the speed at which narratives travel. This analysis maps how framing, repetition and amplification shape public understanding of current affairs in Bangladesh.\n\nWe look at three case studies from 2025 and set out practical steps for newsrooms and educators.",
    author: "LENS Research Team",
    category: "Analysis",
    status: "published",
    featured: true,
    datePublished: D("2025-09-15"),
  });
  await upsert("blogPost", "press-freedom-bangladesh-2025-review", {
    title: "The State of Press Freedom in Bangladesh: 2025 Review",
    description: "A comprehensive look at press freedom indicators and challenges facing independent journalism.",
    content:
      "A year-on-year review of press freedom indicators, legal pressures and the operating environment for independent journalism.",
    author: "LENS Editorial",
    category: "Research",
    status: "published",
    datePublished: D("2025-09-10"),
  });
  await upsert("blogPost", "draft-post-must-not-appear", {
    title: "DRAFT: Internal editorial planning note",
    description: "This draft must never appear on the public blog listing or detail page.",
    content: "Draft content.",
    author: "LENS Editorial",
    category: "Policy",
    status: "draft",
    datePublished: null,
  });

  // ---- Programs ----
  await upsert("program", "media-literacy-academy", {
    title: "Media Literacy Academy",
    description:
      "Comprehensive media literacy program equipping journalists and civil society with critical skills to analyze and counter misinformation.",
    content: "Twelve weeks of workshops, field exercises and certification.",
    category: "Education",
    status: "published",
    featured: true,
  });
  await upsert("program", "digital-rights-fellowship", {
    title: "Digital Rights Fellowship",
    description:
      "Intensive fellowship for early-career researchers focusing on digital rights, cybersecurity, and internet governance in South Asia.",
    content: "Six months of mentorship, research stipends and policy exposure.",
    category: "Fellowship",
    status: "published",
  });
  await upsert("program", "draft-program-must-not-appear", {
    title: "DRAFT: Unannounced program",
    description: "This draft must never appear on the public programs listing.",
    content: "",
    category: "Workshop",
    status: "draft",
  });

  // ---- Media items ----
  await upsert("mediaItem", "lens-launches-media-index-bangladesh-2025", {
    title: "LENS Launches Media Index Bangladesh 2025",
    description: "Comprehensive analysis of media landscape trends, risks, and emerging narratives in Bangladesh.",
    content: "The Media Index measures plurality, independence and resilience across Bangladesh's information ecosystem.",
    type: "press_release",
    source: "LENS Press Office",
    status: "published",
    datePublished: D("2025-02-01"),
  });
  await upsert("mediaItem", "director-discusses-media-literacy-national-conference", {
    title: "Director Discusses Media Literacy at National Conference",
    description: "LENS leadership speaks on the importance of media literacy education in strengthening democratic discourse.",
    content: "Interview transcript covering curriculum design, teacher training and community outreach.",
    type: "interview",
    source: "The Daily Star",
    status: "published",
    datePublished: D("2025-03-10"),
  });
  await upsert("mediaItem", "draft-media-must-not-appear", {
    title: "DRAFT: Embargoed press release",
    description: "This draft must never appear on the public media listing.",
    content: "",
    type: "statement",
    source: "LENS Press Office",
    status: "draft",
    datePublished: null,
  });

  // ---- Resources ----
  await upsert("resource", "media-monitoring-methodology-guide", {
    title: "Media Monitoring Methodology Guide",
    description: "Step-by-step guide to our media monitoring approach and methodology.",
    content: "Sampling, coding, inter-coder reliability and publication workflow.",
    category: "Research Tools",
    type: "tool",
    status: "published",
  });
  await upsert("resource", "media-literacy-curriculum", {
    title: "Media Literacy Curriculum",
    description: "Complete curriculum for teaching media literacy in schools and universities.",
    content: "Twelve modules with lesson plans, slides and assessment rubrics.",
    category: "Educational Materials",
    type: "document",
    status: "published",
  });
  await upsert("resource", "draft-resource-must-not-appear", {
    title: "DRAFT: Restricted dataset",
    description: "This draft must never appear on the public resources listing.",
    content: "",
    category: "Datasets",
    type: "dataset",
    status: "draft",
  });

  // ---- Careers ----
  await upsert("career", "research-analyst", {
    title: "Research Analyst",
    department: "Research",
    location: "Dhaka, Bangladesh",
    type: "full_time",
    description: "Conduct research on Bangladesh's information ecosystem, media narratives, and policy issues.",
    requirements: "Bachelor's degree in a relevant field. Strong writing and quantitative skills.",
    status: "open",
  });
  await upsert("career", "media-literacy-trainer", {
    title: "Media Literacy Trainer",
    department: "Programs",
    location: "Dhaka, Bangladesh",
    type: "full_time",
    description: "Design and deliver media literacy training programs for journalists, youth, and civil society.",
    requirements: "Proven facilitation experience and fluency in Bangla and English.",
    status: "open",
  });
  await upsert("career", "draft-career-must-not-appear", {
    title: "DRAFT: Unapproved position",
    department: "Policy",
    location: "Dhaka, Bangladesh",
    type: "contract",
    description: "This draft must never appear on the public careers listing.",
    requirements: "",
    status: "draft",
  });

  // ---- Events ----
  await upsert("event", "young-educators-summit-2025", {
    name: "Young Educators' Leadership Summit 2025",
    description: "A summit bringing together young educators to discuss media literacy and civic engagement.",
    startDate: D("2025-07-24T08:00:00"),
    endDate: D("2025-07-24T18:00:00"),
    time: "8:00 AM - 6:00 PM",
    location: "NAEM, Dhaka",
    category: "Workshop",
    status: "published",
  });
  await upsert("event", "media-literacy-workshop-series", {
    name: "Media Literacy Workshop Series",
    description: "Interactive workshop on digital media literacy for journalists and civil society.",
    startDate: D("2025-08-15T10:00:00"),
    endDate: D("2025-08-15T16:00:00"),
    time: "10:00 AM - 4:00 PM",
    location: "Online (Zoom)",
    category: "Workshop",
    status: "published",
  });
  await upsert("event", "draft-event-must-not-appear", {
    name: "DRAFT: Internal planning session",
    description: "This draft must never appear on the public events listing.",
    startDate: D("2025-12-01T10:00:00"),
    endDate: D("2025-12-01T12:00:00"),
    time: "10:00 AM - 12:00 PM",
    location: "LENS Office",
    category: "Internal",
    status: "draft",
  });

  // ---- Research articles ----
  await upsert("researchArticle", "narratives-in-the-digital-age", {
    title: "Narratives in the Digital Age",
    description: "Mapping trends, risks and opportunities in Bangladesh's information ecosystem.",
    content: "An overview of narrative formation, platform dynamics and civic information flows in Bangladesh.",
    category: "Research Report",
    author: "LENS Research Team",
    status: "published",
    featured: true,
    datePublished: D("2025-05-01"),
    submitterEmail: "private-researcher@example.com",
    submitterName: "Internal Submitter",
    reviewStatus: "approved",
  });
  await upsert("researchArticle", "media-index-bangladesh-2025", {
    title: "Media Index Bangladesh 2025",
    description: "Trends, risks and emerging narratives in the local media landscape.",
    content: "The 2025 edition of the Media Index, with indicators, methodology and regional breakdowns.",
    category: "Research Report",
    author: "LENS Research Team",
    status: "published",
    datePublished: D("2025-02-01"),
    doi: "10.5555/lens.2025.0001",
    reviewStatus: "approved",
  });
  await upsert("researchArticle", "draft-research-must-not-appear", {
    title: "DRAFT: Unreviewed manuscript",
    description: "This draft must never appear on public listings or detail pages.",
    content: "Draft content.",
    category: "Working Paper",
    author: "LENS Research Team",
    status: "draft",
    datePublished: null,
    submitterEmail: "private-draft@example.com",
    reviewStatus: "pending",
  });

  // ---- Publications ----
  await upsert("publication", "media-literacy-resilient-democracy", {
    title: "Media Literacy for a Resilient Democracy",
    description: "Recommendations for a safer and more informed digital public sphere.",
    type: "Policy Brief",
    author: "LENS Policy Team",
    status: "published",
    datePublished: D("2025-04-01"),
    pages: 18,
  });
  await upsert("publication", "youth-narratives-civic-engagement", {
    title: "Youth, Narratives and Civic Engagement",
    description: "Insights from a national study on young people's media consumption and trust.",
    type: "Working Paper",
    author: "LENS Youth Division",
    status: "published",
    datePublished: D("2025-03-01"),
    pages: 32,
  });
  await upsert("publication", "draft-publication-must-not-appear", {
    title: "DRAFT: Confidential policy memo",
    description: "This draft must never appear on the public publications listing.",
    type: "Policy Brief",
    author: "LENS Policy Team",
    status: "draft",
    datePublished: null,
  });

  // ---- Researcher profiles (public /researchers page) ----
  await upsert("researcherProfile", "dr-nusrat-jahan", {
    name: "Dr. Nusrat Jahan",
    affiliation: "University of Dhaka",
    position: "Senior Research Fellow",
    bio: "Researches media systems, journalism practice and public discourse in South Asia.",
    researchAreas: JSON.stringify(["Media Systems", "Journalism"]),
    expertise: JSON.stringify(["Qualitative Research", "Policy Analysis"]),
    status: "active",
    featured: true,
    email: "private-researcher@example.com",
  });
  await upsert("researcherProfile", "tanvir-ahmed", {
    name: "Tanvir Ahmed",
    affiliation: "LENS",
    position: "Research Analyst",
    bio: "Works on narrative analysis, digital rights and misinformation resilience.",
    researchAreas: JSON.stringify(["Digital Rights", "Misinformation"]),
    expertise: JSON.stringify(["Data Visualization", "Survey Research"]),
    status: "active",
    featured: false,
    email: "private-analyst@example.com",
  });
  await upsert("researcherProfile", "inactive-researcher-must-not-appear", {
    name: "Inactive Researcher",
    affiliation: "Former Affiliation",
    position: "Adjunct",
    bio: "Inactive profile that must never appear publicly.",
    status: "inactive",
    featured: false,
  });

  console.log("SEED_COMPLETE");
}

main()
  .catch((e) => {
    console.error("SEED_ERROR", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
