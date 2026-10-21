import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import { getPublicProgram } from "@/lib/public-content";
import { headers } from "next/headers";

async function getProgram(slug: string) {
  return getPublicProgram(slug);
}

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
  const program = await getProgram(slug);
  if (!program) return { title: "Program Not Found" };

  const locale = await getLocaleFromHeaders();
  const title = locale === "bn" && program.titleBn ? program.titleBn : program.title;
  const description = locale === "bn" && program.descriptionBn ? program.descriptionBn : program.description;

  return {
    title: title,
    description: description,
    openGraph: { title: title, description: description },
    alternates: { languages: { en: `/programs/${slug}`, bn: `/programs/${slug}` } },
  };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = await getProgram(slug);
  if (!program) notFound();

  const locale = await getLocaleFromHeaders();
  const bn = locale === "bn";

  const title = bn && program.titleBn ? program.titleBn : program.title;
  const description = bn && program.descriptionBn ? program.descriptionBn : program.description;
  const content = bn && program.contentBn ? program.contentBn : (program.content || program.description);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <section className="relative py-20 bg-navy-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <nav className="text-sm text-slate-400 mb-6">
              <Link href="/" className="hover:text-teal-400">{bn ? "হোম" : "Home"}</Link>
              <span className="mx-2">/</span>
              <Link href="/programs" className="hover:text-teal-400">{bn ? "কর্মসূচি" : "Programs"}</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{title}</span>
            </nav>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-3 block">{program.category}</span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{title}</h1>
            {bn && program.titleBn && <p className="text-xl text-slate-300/60 mb-6">{program.titleBn}</p>}
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-3xl">{description}</p>
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
