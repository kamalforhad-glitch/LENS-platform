import type { Metadata } from "next";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import LibraryArticleContent from "./LibraryArticleContent";
import { getLibraryArticle } from "@/lib/actions/library";
import { headers } from "next/headers";

async function getLocaleFromHeaders(): Promise<string> {
  try {
    const headersList = await headers();
    const acceptLanguage = headersList.get("accept-language") || "";
    return acceptLanguage.startsWith("bn") ? "bn" : "en";
  } catch {
    return "en";
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getLibraryArticle(slug).catch(() => null);
  if (!article) return { title: "Article Not Found" };

  const locale = await getLocaleFromHeaders();
  const title = locale === "bn" && article.article.titleBn ? article.article.titleBn : article.article.title;
  const description = locale === "bn" && article.article.descriptionBn ? article.article.descriptionBn : article.article.description;

  return {
    title: title,
    description: description,
    openGraph: { title: title, description: description },
    alternates: { languages: { en: `/library/${slug}`, bn: `/library/${slug}` } },
  };
}

export default function LibraryArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <LibraryArticleContent params={params} />
      </main>
      <SiteFooter />
    </>
  );
}
