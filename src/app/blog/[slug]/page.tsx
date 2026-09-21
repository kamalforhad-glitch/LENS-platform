import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/lib/db";

async function getBlogPost(slug: string) {
  return db.blogPost.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.description,
    openGraph: { title: post.title, description: post.description },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

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
              <Link href="/blog" className="hover:text-teal-400">Blog</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{post.title}</span>
            </nav>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-teal-400 mb-3 block">{post.category}</span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>{post.author}</span>
              {post.datePublished && <span>{new Date(post.datePublished).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>}
            </div>
          </div>
        </section>
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {post.content || post.description}
            </div>
            {post.contentBn && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4">বাংলা সংস্করণ</h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {post.contentBn}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
