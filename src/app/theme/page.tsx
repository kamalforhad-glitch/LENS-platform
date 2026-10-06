import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PageHero from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Theme",
  description:
    "LENS research themes — evidence-based research, curated literature, and the digital knowledge library.",
};

const themes = [
  {
    title: "Research",
    href: "/theme/research",
    description: "Evidence-based analysis, trend monitoring and narrative research on Bangladesh's information landscape.",
  },
  {
    title: "Literature",
    href: "/theme/literature",
    description: "Curated reading and reference resources supporting media studies and narrative research.",
  },
  {
    title: "Library",
    href: "/library",
    description: "The advanced digital knowledge archive — search reports, briefs and working papers.",
  },
];

export default function ThemePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-24">
        <PageHero
          eyebrow="Theme"
          title="Research Themes"
          description="How LENS organises its knowledge work — from original research to curated reading to the searchable archive."
          breadcrumbItems={[{ label: "Home", href: "/" }, { label: "Theme" }]}
        />

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map((theme) => (
                <Link
                  key={theme.title}
                  href={theme.href}
                  className="group flex flex-col p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
                >
                  <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
                    {theme.title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{theme.description}</p>
                  <span className="mt-4 text-sm font-semibold text-teal-600">Explore →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
