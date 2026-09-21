import type { Metadata } from "next";
import LibraryArticleContent from "./LibraryArticleContent";

export const metadata: Metadata = {
  title: "Library Article",
  description: "Read this research article from the LENS digital library.",
};

export default function LibraryArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  return <LibraryArticleContent params={params} />;
}
