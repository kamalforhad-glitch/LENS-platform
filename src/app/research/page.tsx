import type { Metadata } from "next";
import ResearchContent from "./ResearchContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Research & Insights",
  description: "Evidence-based research on media literacy, press freedom, narrative analysis, policy advocacy and cybersecurity in Bangladesh.",
};

export default function ResearchPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <ResearchContent />
      </main>
      <Footer />
    </>
  );
}
