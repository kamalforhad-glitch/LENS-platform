import type { Metadata } from "next";
import { Suspense } from "react";
import LibraryContent from "./LibraryContent";

export const metadata: Metadata = {
  title: "Research Library",
  description: "Explore our digital knowledge archive of research reports, policy briefs and working papers.",
};

export default function ResearchLibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">Loading...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
