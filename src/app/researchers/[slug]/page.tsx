import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import ResearcherProfileContent from "./ResearcherProfileContent";
import { getPublicResearcher } from "@/lib/public-content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const researcher = await getPublicResearcher(slug);
  if (!researcher) return { title: "Researcher Not Found" };

  return {
    title: researcher.name,
    description: researcher.bio?.slice(0, 160) || "",
    openGraph: { title: researcher.name, description: researcher.bio?.slice(0, 160) || "" },
  };
}

export default async function ResearcherProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const researcher = await getPublicResearcher(slug);
  if (!researcher) notFound();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <ResearcherProfileContent researcher={researcher} />
      </main>
      <SiteFooter />
    </>
  );
}