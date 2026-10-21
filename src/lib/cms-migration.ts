// Pure migration descriptors for hardcoded pages that can be taken over by
// the CMS. No DB access, no server actions — imported by the admin-only
// migration action and by tests.
//
// Content policy: these skeletons contain NO Bangla titles. The hardcoded
// pages they mirror are English-only today, so nothing Bangla is invented
// here; editors add the Bangla strings in the PageSectionEditor (titleBn /
// descriptionBn / contentBn), which fall back to English until then.
import { CMS_MIGRATABLE_SLUGS } from "@/lib/cms-validation";

export interface MigrationSectionSpec {
  type: string;
  title: string;
  titleBn: string;
  description: string;
  visible: boolean;
}

export interface MigrationPlanEntry {
  slug: string;
  exists: boolean;
  sections: MigrationSectionSpec[];
  message: string;
}

const S = (type: string, title: string, description = ""): MigrationSectionSpec => ({
  type,
  title,
  titleBn: "",
  description,
  visible: true,
});

/**
 * Suggested section skeleton per migratable slug. The section TYPES match the
 * existing page-builder types, so an editor can complete the content with the
 * normal typed fields (no raw JSON needed) and the published page renders
 * through the standard PageSectionsView.
 */
export const SECTION_SKELETONS: Record<string, MigrationSectionSpec[]> = {
  about: [
    S("hero", "About LENS", "Lighthouse for Evolving Narrative Systems."),
    S("rich_text", "Our Mission"),
    S("cards", "Our Journey"),
    S("cards", "Our Values"),
    S("cta", "Get in Touch", "Meet the team behind LENS."),
  ],
  privacy: [
    S("hero", "Privacy Policy", "Last updated: September 2025"),
    S("rich_text", "1. Information We Collect"),
    S("rich_text", "2. How We Use Your Information"),
    S("rich_text", "3. Analytics"),
    S("rich_text", "4. Data Protection"),
    S("rich_text", "5. Third-Party Services"),
    S("rich_text", "6. Your Rights"),
    S("rich_text", "7. Contact"),
  ],
  terms: [
    S("hero", "Terms & Conditions", "Last updated: September 2025"),
    S("rich_text", "1. Acceptance of Terms"),
    S("rich_text", "2. Intellectual Property"),
    S("rich_text", "3. Use of Content"),
    S("rich_text", "4. Disclaimer"),
    S("rich_text", "5. Limitation of Liability"),
    S("rich_text", "6. Changes to Terms"),
    S("rich_text", "7. Contact"),
  ],
  donate: [
    S("hero", "Support LENS", "What your support sustains."),
    S("cards", "What Your Support Sustains"),
    S("rich_text", "Our Transparency Commitment"),
    S("cta", "Get in Touch", "Online donations are not yet available — contact our team."),
  ],
  theme: [
    S("hero", "Research Themes", "How LENS organises its knowledge work."),
    S("cards", "Themes"),
  ],
  clubs: [S("hero", "Clubs"), S("clubs", "")],
  research: [
    S("hero", "Research & Insights", "Evidence-based research for Bangladesh's narrative ecosystem."),
    S("research_list", "Latest Research", "Our most recent published research articles and reports."),
    S("featured", "Featured Research", "Highlighted research publication."),
    S("cta", "Explore Research Library", "Access our advanced research library with search, filters, and downloadable reports."),
  ],
  publications: [
    S("hero", "Publications", "Policy briefs, working papers, and research reports."),
    S("publication_list", "All Publications", "Complete listing of all published policy briefs, working papers, and reports."),
  ],
  events: [
    S("hero", "Events & Workshops", "Join our events to strengthen the narrative ecosystem."),
    S("event_list", "Upcoming Events", "Join our upcoming workshops, conferences and community gatherings."),
    S("event_list", "Past Events", "Highlights from our previous events and workshops."),
    S("newsletter", "Never Miss an Event", "Subscribe to get event announcements and research updates."),
  ],
  blog: [
    S("hero", "Blog & Analysis", "Insights and commentary on Bangladesh's media landscape."),
    S("blog_list", "Latest Posts", "Our most recent blog posts and commentary pieces."),
  ],
  media: [
    S("hero", "Media & Press", "Press releases, interviews, and media coverage."),
    S("media_list", "All Media Coverage", "Complete listing of press releases, interviews, and media mentions."),
  ],
  resources: [
    S("hero", "Resources & Tools", "Research tools, datasets, and educational materials."),
    S("resource_list", "All Resources", "Browse our complete collection of research tools, datasets, guides and documents."),
  ],
  programs: [
    S("hero", "Programs & Training", "Training programs for media literacy, digital rights, and narrative research."),
    S("program_list", "All Programs", "Browse our training programs, workshops, and capacity building initiatives."),
  ],
  researchers: [
    S("hero", "Researcher Network", "Meet our affiliated researchers and their contributions."),
    S("team", "Featured Researchers", "Our researcher network."),
  ],
  impact: [
    S("hero", "Impact & Data", "Data visualizations and impact metrics from LENS research."),
    S("stats", "Key Metrics", "Numerical indicators of our institutional impact."),
  ],
  courses: [
    S("hero", "Courses & Subjects", "Educational courses and subject areas."),
    S("program_list", "Courses by Category", "Browse courses organized by subject area."),
  ],
  library: [
    S("hero", "Research Library", "Advanced digital knowledge archive."),
    S("search_filter", "Search & Filter", "Search reports, briefs, and working papers."),
  ],
  careers: [
    S("hero", "Careers at LENS", "Join our team to strengthen Bangladesh's narrative ecosystem."),
    S("rich_text", "Open Positions", "Current job openings and opportunities."),
  ],
  indexing: [
    S("hero", "Media Indexing", "Tracking media trends, content analysis and narrative mapping."),
    S("rich_text", "The Practice", "How LENS turns media observation into structured evidence."),
    S("cards", "Index Products", "Flagship indexes published by LENS."),
    S("research_list", "Latest Findings", "Recent research from the indexing program."),
  ],
};

/** Build the (read-only) migration plan for the given slug, or all slugs. */
export function migrationPlan(slug?: string): MigrationPlanEntry[] {
  const targets = slug ? [slug] : Array.from(CMS_MIGRATABLE_SLUGS);
  return targets.map((s) => ({
    slug: s,
    exists: false, // filled in by the caller after the DB check
    sections: SECTION_SKELETONS[s] ?? [],
    message: "",
  }));
}
