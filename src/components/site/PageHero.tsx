// Server component: reusable page hero for hubs and detail pages.
// Keeps the premium institutional look (navy + teal glow + gold
// eyebrow). No GSAP, no client JavaScript — entrance polish is
// CSS-only via the global reduced-motion-safe keyframes.
import Breadcrumbs, { type Crumb } from "./Breadcrumbs";

export default function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbItems,
  actions,
  tone = "dark",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbItems?: Crumb[];
  actions?: React.ReactNode;
  tone?: "dark" | "light";
}) {
  if (tone === "light") {
    return (
      <section className="relative overflow-hidden bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          {breadcrumbItems && breadcrumbItems.length > 0 && (
            <div className="mb-6">
              <Breadcrumbs items={breadcrumbItems} tone="light" />
            </div>
          )}
          {eyebrow && (
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-teal-600 mb-4">{eyebrow}</p>
          )}
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-5">{title}</h1>
          {description && <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">{description}</p>}
          {actions && <div className="flex flex-wrap gap-3 mt-8">{actions}</div>}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-navy-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(8,145,178,0.12)_0%,transparent_50%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,rgba(212,168,67,0.06)_0%,transparent_35%)]" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 relative z-10">
        {breadcrumbItems && breadcrumbItems.length > 0 && (
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbItems} tone="dark" />
          </div>
        )}
        {eyebrow && (
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-gold-400 mb-4">{eyebrow}</p>
        )}
        <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">{title}</h1>
        {description && (
          <p className="text-lg text-slate-300/80 leading-relaxed max-w-3xl">{description}</p>
        )}
        {actions && <div className="flex flex-wrap gap-3 mt-8">{actions}</div>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-navy-950 to-transparent" aria-hidden="true" />
    </section>
  );
}
