// Shared course-subject catalogue (Phase B).
//
// The five subjects come from the approved IA. No syllabus, audience,
// or format is stated here — subject pages stay CMS-ready and render
// empty states until Program rows are published for them. In
// particular, "Mojo" is kept verbatim with no expansion.
export interface CourseSubject {
  slug: string;
  name: string;
}

export const COURSE_SUBJECTS: CourseSubject[] = [
  { slug: "photography", name: "Photography" },
  { slug: "mojo", name: "Mojo" },
  { slug: "fact-check", name: "Fact Check" },
  { slug: "data-journalism", name: "Data Journalism" },
  { slug: "new-media", name: "New Media" },
];

export function getCourseSubject(slug: string): CourseSubject | undefined {
  return COURSE_SUBJECTS.find((s) => s.slug === slug);
}
