import type { Metadata } from "next";
import AboutContent from "./AboutContent";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "About LENS — Our Mission, Values & Team",
  description: "Learn about LENS, a research-driven think tank working to strengthen Bangladesh's narrative ecosystem through evidence, media literacy and policy engagement.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <AboutContent />
      </main>
      <SiteFooter />
    </>
  );
}
