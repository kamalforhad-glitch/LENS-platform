import type { Metadata } from "next";
import PublicationsContent from "./PublicationsContent";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { getPublicPublications } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publications",
  description: "Policy briefs, working papers, research reports and analysis from the LENS research team.",
};

export default async function PublicationsPage() {
  const { items: publications, error } = await getPublicPublications();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PublicationsContent publications={publications} error={error} />
      </main>
      <SiteFooter />
    </>
  );
}
