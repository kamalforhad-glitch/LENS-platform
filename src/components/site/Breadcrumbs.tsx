// Server component: accessible breadcrumbs + BreadcrumbList JSON-LD.
// Pages pass the full trail (labels as plain strings); Phase B will
// wire this into every hub/detail page alongside PageHero.
import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({
  items,
  tone = "dark",
}: {
  items: Crumb[];
  tone?: "dark" | "light";
}) {
  if (items.length === 0) return null;
  const muted = tone === "dark" ? "text-slate-400" : "text-slate-500";
  const current = tone === "dark" ? "text-white" : "text-slate-900";

  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={`${item.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && (
                  <span className={`mx-1 ${muted}`} aria-hidden="true">
                    /
                  </span>
                )}
                {item.href && !isLast ? (
                  <Link href={item.href} className={`${muted} hover:text-teal-400 transition-colors`}>
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className={current}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: items.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.label,
              ...(item.href ? { item: item.href } : {}),
            })),
          }),
        }}
      />
    </>
  );
}
