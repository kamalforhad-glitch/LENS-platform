import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/lib/db";

async function getResource(slug: string) {
  return db.resource.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) return { title: "Resource Not Found" };
  return {
    title: resource.metaTitle || resource.title,
    description: resource.metaDescription || resource.description,
    openGraph: { title: resource.title, description: resource.description },
  };
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await getResource(slug);
  if (!resource) notFound();

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
              <Link href="/resources" className="hover:text-teal-400">Resources</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{resource.title}</span>
            </nav>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-3 block">{resource.category}</span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{resource.title}</h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-3xl">{resource.description}</p>
            <div className="flex gap-3 mt-6">
              {resource.fileUrl && (
                <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-all">
                  Download
                </a>
              )}
              {resource.externalUrl && (
                <a href={resource.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-5 py-2.5 border border-white/20 text-white text-sm font-semibold rounded-full hover:border-teal-400 hover:text-teal-300 transition-colors">
                  Visit Resource
                </a>
              )}
            </div>
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {resource.content || resource.description}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
