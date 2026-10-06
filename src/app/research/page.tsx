import type { Metadata } from "next";
import ResearchContent from "./ResearchContent";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { getPublicResearch } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research & Insights",
  description: "Evidence-based research on media literacy, press freedom, narrative analysis, policy advocacy and cybersecurity in Bangladesh.",
};

export default async function ResearchPage() {
  const { items: research, error } = await getPublicResearch();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <ResearchContent research={research} error={error} />
      </main>
      <SiteFooter />
    </>
  );
}
