import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/site/Breadcrumbs";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { estimateReadingMinutes, renderFocusContent } from "@/lib/focus-content";
import { getFocusAreaBySlug, getFocusAreas } from "@/lib/focus-areas";
import { focusAccent, resolveFocusIcon } from "@/lib/focus-icons";
import { safeFocusUrl } from "@/lib/focus-url";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const areas = await getFocusAreas();
  return areas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = await getFocusAreaBySlug(slug);

  if (!area) {
    return {
      title: "Focus Area Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${area.title} — LENS Focus Area`;
  const description = area.description.slice(0, 160);
  const imageUrl = safeFocusUrl(area.imageUrl);

  return {
    title,
    description,
    alternates: { canonical: `/focus/${area.slug}` },
    openGraph: {
      title,
      description,
      url: `/focus/${area.slug}`,
      type: "article",
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FocusAreaPage({ params }: PageProps) {
  const { slug } = await params;
  const [area, allAreas] = await Promise.all([
    getFocusAreaBySlug(slug),
    getFocusAreas(),
  ]);

  if (!area) notFound();

  const Icon = resolveFocusIcon(area.icon, area.order);
  const { accent, glow } = focusAccent(area.order);
  const minutes = estimateReadingMinutes(area.content);
  const imageUrl = safeFocusUrl(area.imageUrl);
  const others = allAreas.filter((item) => item.slug !== area.slug);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-navy-950 pt-32 pb-20 text-white">
          {imageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url("${imageUrl.replace(/"/g, "%22")}")` }}
              aria-hidden="true"
            />
          )}
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(20,184,166,0.12)_0%,transparent_55%)]"
            aria-hidden="true"
          />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Focus Areas", href: "/#focus-areas" },
                { label: area.title },
              ]}
            />

            <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{ color: accent, borderColor: accent, background: glow }}
                  >
                    <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-300">
                    LENS Focus Area
                  </span>
                </div>

                <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  {area.title}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
                  {area.description}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" aria-hidden="true" />
                    {minutes} min read
                  </span>
                  <span>Updated by the LENS editorial team</span>
                  <Link href="/about" className="text-teal-300 hover:text-teal-200">
                    About LENS →
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Area index
                </p>
                <p className="mt-3 text-5xl font-semibold text-white">
                  {String(area.order).padStart(2, "0")}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  of {String(allAreas.length).padStart(2, "0")} civic priorities
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
            <article className="focus-prose min-w-0" aria-label={`${area.title} details`}>
              {renderFocusContent(area.content, `focus-${area.slug}`)}
            </article>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Other focus areas
                </h2>
                <nav aria-label="Other focus areas" className="mt-4 space-y-1">
                  {others.map((item) => {
                    const OtherIcon = resolveFocusIcon(item.icon, item.order);
                    const otherAccent = focusAccent(item.order).accent;
                    return (
                      <Link
                        key={item.slug}
                        href={`/focus/${item.slug}`}
                        className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-white hover:text-slate-950"
                      >
                        <OtherIcon
                          size={17}
                          strokeWidth={1.8}
                          className="shrink-0 text-slate-400 group-hover:text-slate-900"
                          style={{ color: otherAccent }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">{item.title}</span>
                        <span className="ml-auto text-slate-300 transition-transform group-hover:translate-x-0.5">
                          →
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </aside>
          </div>
        </section>

        <section className="relative overflow-hidden bg-navy-950 py-16 text-white sm:py-20">
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(20,184,166,0.12)_0%,transparent_55%)]"
            aria-hidden="true"
          />
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">
                Work with us
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Collaborate with this Hub
              </h2>
              <p className="mt-3 max-w-xl text-slate-300">
                Bring your research question, newsroom challenge or community programme to LENS.
                We build practical responses with evidence, training and a network of partners.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-teal-400 px-7 py-3.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-teal-300"
            >
              Join Our Network →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
