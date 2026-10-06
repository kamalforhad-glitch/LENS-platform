import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { formatFullDate, getPublicPublication } from "@/lib/public-content";

export const dynamic = "force-dynamic";

async function getPublication(slug: string) {
  return getPublicPublication(slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const publication = await getPublication(slug);
  if (!publication) return { title: "Publication Not Found" };
  return {
    title: `${publication.title} — Publications at LENS`,
    description: publication.description,
    openGraph: { title: publication.title, description: publication.description },
  };
}

export default async function PublicationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const publication = await getPublication(slug);
  if (!publication) notFound();

  const published = formatFullDate(publication.datePublished);

  let tags: string[] = [];
  try {
    const parsed = JSON.parse(publication.tags);
    tags = Array.isArray(parsed) ? parsed.filter((tag) => typeof tag === "string") : [];
  } catch {
    tags = publication.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <section className="relative py-20 bg-navy-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(212,168,67,0.08)_0%,transparent_50%)]" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <nav className="text-sm text-slate-400 mb-6">
              <Link href="/" className="hover:text-teal-400">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/publications" className="hover:text-teal-400">Publications</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{publication.title}</span>
            </nav>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-3 block">
              {publication.type}
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{publication.title}</h1>
            <p className="text-lg text-slate-300/80 leading-relaxed max-w-3xl">{publication.description}</p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1fr_300px] gap-10">
              <div>
                <p className="text-sm text-slate-500 leading-relaxed">{publication.description}</p>
                {tags.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-3 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="lg:sticky lg:top-28 lg:self-start">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4">Publication Details</h3>
                  <div className="space-y-3 text-sm">
                    <div><span className="text-slate-500">Type:</span> <span className="text-slate-900 font-medium">{publication.type}</span></div>
                    <div><span className="text-slate-500">Author:</span> <span className="text-slate-900 font-medium">{publication.author}</span></div>
                    {published && <div><span className="text-slate-500">Published:</span> <span className="text-slate-900 font-medium">{published}</span></div>}
                    {publication.pages ? <div><span className="text-slate-500">Pages:</span> <span className="text-slate-900 font-medium">{publication.pages}</span></div> : null}
                    <div><span className="text-slate-500">Downloads:</span> <span className="text-slate-900 font-medium">{publication.downloads}</span></div>
                  </div>
                  {publication.pdfUrl && (
                    <a
                      href={publication.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 w-full inline-flex items-center justify-center px-5 py-3 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-all"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
