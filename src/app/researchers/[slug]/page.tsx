import type { Metadata } from "next";
import ResearcherProfileContent from "./ResearcherProfileContent";

export const metadata: Metadata = {
  title: "Researcher Profile",
  description: "View the profile, publications and research contributions of this LENS-affiliated researcher.",
};

export default function ResearcherProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  return <ResearcherProfileContent params={params} />;
}
