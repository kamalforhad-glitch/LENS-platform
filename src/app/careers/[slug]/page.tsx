import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/lib/db";

async function getCareer(slug: string) {
  return db.career.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const career = await getCareer(slug);
  if (!career) return { title: "Position Not Found" };
  return {
    title: career.metaTitle || `${career.title} — Careers at LENS`,
    description: career.metaDescription || career.description,
    openGraph: { title: career.title, description: career.description },
  };
}

export default async function CareerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const career = await getCareer(slug);
  if (!career) notFound();

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
              <Link href="/careers" className="hover:text-teal-400">Careers</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{career.title}</span>
            </nav>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400">{career.department}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">{career.location}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">{career.type.replace("_", " ")}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{career.title}</h1>
            {career.salary && <p className="text-lg text-teal-400 mb-6">{career.salary}</p>}
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1fr_300px] gap-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Description</h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap mb-8">
                  {career.description}
                </div>
                {career.requirements && (
                  <>
                    <h2 className="text-xl font-bold text-slate-900 mb-4">Requirements</h2>
                    <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {career.requirements}
                    </div>
                  </>
                )}
              </div>
              <div className="lg:sticky lg:top-28 lg:self-start">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4">Job Details</h3>
                  <div className="space-y-3 text-sm">
                    <div><span className="text-slate-500">Department:</span> <span className="text-slate-900 font-medium">{career.department}</span></div>
                    <div><span className="text-slate-500">Location:</span> <span className="text-slate-900 font-medium">{career.location}</span></div>
                    <div><span className="text-slate-500">Type:</span> <span className="text-slate-900 font-medium">{career.type.replace("_", " ")}</span></div>
                    {career.salary && <div><span className="text-slate-500">Salary:</span> <span className="text-slate-900 font-medium">{career.salary}</span></div>}
                  </div>
                  {career.applicationUrl && (
                    <a href={career.applicationUrl} target="_blank" rel="noopener noreferrer" className="mt-6 w-full inline-flex items-center justify-center px-5 py-3 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold rounded-full transition-all">
                      Apply Now
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
