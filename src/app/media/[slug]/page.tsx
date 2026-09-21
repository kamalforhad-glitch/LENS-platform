import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/lib/db";

async function getMediaItem(slug: string) {
  return db.mediaItem.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getMediaItem(slug);
  if (!item) return { title: "Media Not Found" };
  return {
    title: item.metaTitle || item.title,
    description: item.metaDescription || item.description,
    openGraph: { title: item.title, description: item.description },
  };
}

export default async function MediaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getMediaItem(slug);
  if (!item) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 pt-24">
        <section className="relative py-20 bg-navy-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(8,145,178,0.08)_0%,transparent_50%)]" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <nav className="text-sm text-slate-400 mb-6">
              <Link href="/" className="hover:text-teal-400">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/media" className="hover:text-teal-400">Media</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{item.title}</span>
            </nav>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-3 block">{item.type.replace("_", " ")}</span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{item.title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              {item.source && <span>{item.source}</span>}
              {item.datePublished && <span>{new Date(item.datePublished).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>}
            </div>
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {item.content || item.description}
            </div>
            {item.contentBn && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">বাংলা সংস্করণ</h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {item.contentBn}
                </div>
              </div>
            )}
            {item.sourceUrl && (
              <div className="mt-8">
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline text-sm">
                  View Original Source →
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
