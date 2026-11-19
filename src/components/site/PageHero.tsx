// Server component: reusable page hero for hubs and detail pages.
// Keeps the premium institutional look (navy + section-specific glow).
// CSS-only transitions and keyframes, completely safe for reduced motion.
import Breadcrumbs, { type Crumb } from "./Breadcrumbs";

export type HeroAccent = "indigo" | "teal" | "violet" | "emerald" | "gold";

export default function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbItems,
  actions,
  tone = "dark",
  accent = "gold",
  badge,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbItems?: Crumb[];
  actions?: React.ReactNode;
  tone?: "dark" | "light";
  accent?: HeroAccent;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  if (tone === "light") {
    const lightEyebrowColors: Record<HeroAccent, string> = {
      indigo: "text-indigo-600",
      teal: "text-teal-600",
      violet: "text-violet-600",
      emerald: "text-emerald-600",
      gold: "text-gold-600",
    };

    return (
      <section className="relative overflow-hidden bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-18">
          {breadcrumbItems && breadcrumbItems.length > 0 && (
            <div className="mb-6">
              <Breadcrumbs items={breadcrumbItems} tone="light" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {eyebrow && (
              <p className={`text-xs font-bold tracking-[0.2em] uppercase ${lightEyebrowColors[accent]}`}>
                {eyebrow}
              </p>
            )}
            {badge}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-5">
            {title}
          </h1>
          {description && (
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
          {actions && <div className="flex flex-wrap gap-3 mt-8">{actions}</div>}
          {children}
        </div>
      </section>
    );
  }

  // Dark Tone Configurations
  const darkGradients: Record<HeroAccent, string> = {
    indigo: "bg-[radial-gradient(ellipse_at_20%_20%,rgba(99,102,241,0.18)_0%,transparent_50%)]",
    teal: "bg-[radial-gradient(ellipse_at_20%_20%,rgba(20,184,166,0.18)_0%,transparent_50%)]",
    violet: "bg-[radial-gradient(ellipse_at_20%_20%,rgba(139,92,246,0.18)_0%,transparent_50%)]",
    emerald: "bg-[radial-gradient(ellipse_at_20%_20%,rgba(16,185,129,0.18)_0%,transparent_50%)]",
    gold: "bg-[radial-gradient(ellipse_at_20%_20%,rgba(8,145,178,0.12)_0%,transparent_50%)]",
  };

  const darkSecondaryGradients: Record<HeroAccent, string> = {
    indigo: "bg-[radial-gradient(ellipse_at_85%_15%,rgba(59,130,246,0.12)_0%,transparent_40%)]",
    teal: "bg-[radial-gradient(ellipse_at_85%_15%,rgba(6,182,212,0.12)_0%,transparent_40%)]",
    violet: "bg-[radial-gradient(ellipse_at_85%_15%,rgba(192,132,252,0.12)_0%,transparent_40%)]",
    emerald: "bg-[radial-gradient(ellipse_at_85%_15%,rgba(52,211,153,0.12)_0%,transparent_40%)]",
    gold: "bg-[radial-gradient(ellipse_at_85%_15%,rgba(212,168,67,0.08)_0%,transparent_35%)]",
  };

  const darkAccentPillBorder: Record<HeroAccent, string> = {
    indigo: "via-indigo-500/40",
    teal: "via-teal-400/40",
    violet: "via-violet-400/40",
    emerald: "via-emerald-400/40",
    gold: "via-gold-400/40",
  };

  const darkEyebrowColors: Record<HeroAccent, string> = {
    indigo: "text-indigo-400",
    teal: "text-teal-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    gold: "text-gold-400",
  };

  return (
    <section className="relative overflow-hidden bg-navy-950">
      {/* Primary Radial Glow */}
      <div className={`absolute inset-0 ${darkGradients[accent]}`} aria-hidden="true" />
      {/* Secondary Radial Glow */}
      <div className={`absolute inset-0 ${darkSecondaryGradients[accent]}`} aria-hidden="true" />
      {/* Subtle Top Accent Horizon Line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${darkAccentPillBorder[accent]} to-transparent`}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-18 relative z-10">
        {breadcrumbItems && breadcrumbItems.length > 0 && (
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbItems} tone="dark" />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {eyebrow && (
            <p className={`text-xs font-bold tracking-[0.2em] uppercase ${darkEyebrowColors[accent]}`}>
              {eyebrow}
            </p>
          )}
          {badge}
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-base sm:text-lg text-slate-300/85 leading-relaxed max-w-3xl font-normal">
            {description}
          </p>
        )}
        {actions && <div className="flex flex-wrap items-center gap-3 mt-8">{actions}</div>}
        {children}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-navy-950 to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </section>
  );
}
