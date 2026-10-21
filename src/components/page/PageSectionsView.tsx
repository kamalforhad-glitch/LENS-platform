"use client";

import { useTranslation } from "react-i18next";
import { CLUBS } from "@/lib/clubs";
import type { PublicSectionData } from "@/lib/actions/cms";
import { extractMarkdownLinkUrl } from "@/lib/cms-validation";
import { pickLocale } from "@/lib/cms-content";
import type { ResolvedItems } from "./resolveSectionItems";
import ContactFormBlock from "./ContactFormBlock";

// ============================================================
// PageSectionsView — renders structured CMS page sections.
// All strings are React-escaped; no raw HTML/JS is ever stored or
// injected. Locale: current i18next language (fallback EN).
// ============================================================

export type SectionWithResolved = PublicSectionData & { resolved?: ResolvedItems };

export default function PageSectionsView({ sections }: { sections: SectionWithResolved[] }) {
  const { i18n } = useTranslation();
  const lang = String(i18n.language || "en").toLowerCase();
  const bn = lang.startsWith("bn");

  return (
    <div>
      {sections.map((section) => (
        <SectionBlock key={section.id} section={section} bn={bn} />
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// Section shell (width / background settings)
// ------------------------------------------------------------

function SectionBlock({ section, bn }: { section: SectionWithResolved; bn: boolean }) {
  const settings = section.settings || {};
  const width = String(settings.width || "default");
  const background = String(settings.background || "none");

  const containerCls =
    width === "narrow" ? "max-w-4xl mx-auto px-4 sm:px-6" :
    width === "wide" ? "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10" :
    "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";
  const bgCls =
    background === "muted" ? "bg-slate-50" :
    background === "navy" ? "bg-navy-950 text-slate-100" : "";

  return (
    <section className={`py-16 sm:py-20 ${bgCls}`}>
      <div className={containerCls}>
        {(section.title || section.description) && (
          <SectionHeading section={section} bn={bn} />
        )}
        <SectionContent section={section} bn={bn} />
      </div>
    </section>
  );
}
function SectionHeading({ section, bn }: { section: SectionWithResolved; bn: boolean }) {
  const title = bn && section.titleBn ? section.titleBn : section.title;
  const description = bn && section.descriptionBn ? section.descriptionBn : section.description;
  if (!title && !description) return null;
  return (
    <div className="mb-10 sm:mb-12">
      {title && <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h2>}
      {description && <p className="mt-3 text-slate-500 max-w-2xl text-sm sm:text-base">{description}</p>}
    </div>
  );
}

export function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// ------------------------------------------------------------
// Dispatch
// ------------------------------------------------------------

function SectionContent({ section, bn }: { section: SectionWithResolved; bn: boolean }) {
  const content = pickLocale(bn, section.content, section.contentBn) as Record<string, unknown>;
  switch (section.type) {
    case "hero":
    case "banner":
      return <HeroLike section={section} content={content} bn={bn} />;
    case "heading":
      return <HeadingBlock content={content} />;
    case "rich_text":
      return <RichText content={content} />;
    case "image_text":
      return <ImageText content={content} />;
    case "cards":
      return <CardGrid content={content} />;
    case "gallery":
      return <Gallery content={content} />;
    case "stats":
      return <Stats content={content} />;
    case "cta":
      return <CtaBlock content={content} />;
    case "featured":
      return <FeaturedItems content={content} items={section.resolved?.items ?? []} />;
    // Dynamic collection listing sections
    case "event_list":
    case "publication_list":
    case "blog_list":
    case "media_list":
    case "resource_list":
    case "program_list":
    case "research_list":
    case "career_list":
    case "researcher_grid":
      return <CollectionListing content={content} items={section.resolved?.items ?? []} sectionType={section.type} bn={bn} />;
    case "focus_areas":
      return <FocusListings content={content} />;
    case "clubs":
      return <ClubsListing />;
    case "team":
      return <FileCards items={section.resolved?.items ?? []} withImage />;
    case "embed":
      return <EmbedBlock content={content} />;
    case "video":
      return <VideoPlayer content={content} />;
    case "faq":
      return <FaqAccordion content={content} />;
    case "timeline":
      return <Timeline content={content} />;
    case "table":
      return <TableBlock content={content} />;
    case "contact_form":
      return <ContactFormBlock content={content} />;
    case "newsletter":
      return <NewsletterBlock content={content} />;
    case "library_search":
      return <LibrarySearchBlock content={content} bn={bn} />;
    case "search_filter":
      return <SearchFilterBlock content={content} />;
    case "testimonial":
      return <TestimonialBlock content={content} />;
    case "logo_cloud":
      return <LogoCloud content={content} />;
    case "accordion":
      return <AccordionBlock content={content} />;
    default:
      // Homepage machine sections are rendered by HomeClient; unknown types render nothing here.
      if (["focus", "featured_research", "impact", "events_newsletter", "indexing_scanner"].includes(section.type)) {
        return (
          <p className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg p-4">
            This homepage section is managed by the Homepage Editor and renders on the homepage.
          </p>
        );
      }
      return null;
  }
}

// ------------------------------------------------------------
// Presenters (LENS design tokens: navy / teal / gold)
// ------------------------------------------------------------

function safeHref(v: unknown): string | null {
  const url = typeof v === "string" ? v.trim() : "";
  if (!url) return null;
  if (url.startsWith("/") || url.startsWith("#")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return null;
}

function CtaButton({ label, url, variant }: { label: string; url: string; variant?: string }) {
  if (!label || !url) return null;
  const cls = variant === "ghost"
    ? "inline-flex px-6 py-3 rounded-xl border border-teal-500/40 text-teal-600 hover:bg-teal-50 text-sm font-semibold"
    : "inline-flex px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold";
  return (
    <a href={url} className={cls}>
      {label}
    </a>
  );
}

function HeroLike({ section, content, bn }: { section: SectionWithResolved; content: Record<string, unknown>; bn: boolean }) {
  const title = asString(pickLocale(bn, section.title, section.titleBn));
  const eyebrow = asString(content.eyebrow);
  const subtitle = asString(content.subtitle);
  const image = safeHref(content.image) || safeHref(content.backgroundImage);
  const backgroundVideo = safeHref(content.backgroundVideo) || safeHref(content.videoUrl);
  const posterImage = safeHref(content.posterImage) || image;
  const imageAlt = asString(content.imageAlt) || asString(content.alt) || "Hero media";
  const overlayColor = asString(content.overlayColor) || "navy";
  const overlayOpacityNum = typeof content.overlayOpacity === "number" || typeof content.overlayOpacity === "string"
    ? Math.max(0, Math.min(1, Number(content.overlayOpacity) || 0.6))
    : 0.6;
  const layoutVariant = asString(content.layoutVariant) || "default";
  const textAlignment = asString(content.textAlignment) || "left";
  const ctaLabel = asString(content.ctaLabel);
  const ctaUrl = safeHref(content.ctaUrl);
  const cta2Label = asString(content.ctaLabel2);
  const cta2Url = safeHref(content.ctaUrl2);

  const dark = Boolean(image || backgroundVideo);

  const overlayBg =
    overlayColor === "none" ? "transparent" :
    overlayColor === "teal" ? "rgb(15 118 110)" :
    overlayColor === "dark" ? "rgb(15 23 42)" :
    "rgb(10 25 47)";

  const isCentered = layoutVariant === "centered" || textAlignment === "center";
  const isSplit = layoutVariant === "split" && (image || backgroundVideo);

  return (
    <section className={`relative overflow-hidden rounded-2xl ${dark ? "bg-navy-950" : "bg-slate-50 border border-slate-100"}`}>
      {/* Background media if not split */}
      {!isSplit && (image || backgroundVideo) && (
        <div className="absolute inset-0">
          {backgroundVideo ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              poster={posterImage || undefined}
              className="w-full h-full object-cover"
              aria-label={imageAlt}
            >
              <source src={backgroundVideo} type="video/mp4" />
              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={imageAlt} className="w-full h-full object-cover" />
              )}
            </video>
          ) : image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={imageAlt} className="w-full h-full object-cover" />
          ) : null}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: overlayBg, opacity: overlayOpacityNum }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-transparent to-navy-950/40" />
        </div>
      )}

      <div className={`relative px-6 sm:px-10 py-16 sm:py-24 ${isSplit ? "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center" : isCentered ? "max-w-4xl mx-auto text-center" : "max-w-4xl"} ${dark ? "text-white" : "text-navy-950"}`}>
        <div className={isCentered ? "mx-auto" : ""}>
          {eyebrow && (
            <span className="inline-block mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">{eyebrow}</span>
          )}
          <h1 className={`text-3xl sm:text-5xl font-bold leading-tight tracking-tight ${dark ? "text-white" : "text-navy-950"}`}>{title}</h1>
          {subtitle && <p className={`mt-5 text-base sm:text-lg ${isCentered ? "max-w-2xl mx-auto" : "max-w-2xl"} ${dark ? "text-slate-300" : "text-slate-600"}`}>{subtitle}</p>}
          <div className={`mt-8 flex flex-wrap gap-3 ${isCentered ? "justify-center" : ""}`}>
            {ctaLabel && ctaUrl && (
              <a href={ctaUrl} className="inline-flex px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-xs">{ctaLabel}</a>
            )}
            {cta2Label && cta2Url && (
              <a href={cta2Url} className={`inline-flex px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${dark ? "border border-white/25 text-white hover:bg-white/10" : "border border-slate-300 text-slate-700 hover:bg-slate-100"}`}>{cta2Label}</a>
            )}
          </div>
        </div>

        {isSplit && (
          <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl aspect-video">
            {backgroundVideo ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                poster={posterImage || undefined}
                className="w-full h-full object-cover"
                aria-label={imageAlt}
              >
                <source src={backgroundVideo} type="video/mp4" />
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={imageAlt} className="w-full h-full object-cover" />
                )}
              </video>
            ) : image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={imageAlt} className="w-full h-full object-cover" />
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function HeadingBlock({ content }: { content: Record<string, unknown> }) {
  const title = asString(content.title);
  const eyebrow = asString(content.eyebrow);
  if (!title) return null;
  return (
    <div>
      {eyebrow && <span className="inline-block mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-500">{eyebrow}</span>}
      <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-navy-950">{title}</h2>
    </div>
  );
}

// Markdown-lite renderer. Input storage is plain text — React escapes it.
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else {
      const url = extractMarkdownLinkUrl(token);
      const label = token.slice(1, token.indexOf("]"));
      if (url !== null) {
        const external = /^https?:\/\//i.test(url);
        nodes.push(
          <a key={key++} href={url} className="text-teal-600 hover:underline"
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {label}
          </a>
        );
      } else {
        nodes.push(label);
      }
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function RichText({ content }: { content: Record<string, unknown> }) {
  const paragraphsRaw = Array.isArray(content.paragraphs) ? content.paragraphs : [content.text];
  const paragraphs = (paragraphsRaw as unknown[]).filter((p): p is string => typeof p === "string" && p.trim().length > 0);
  if (paragraphs.length === 0) return null;
  return (
    <div className="space-y-4 text-slate-600 text-base sm:text-lg leading-relaxed max-w-3xl">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">{renderInline(p)}</p>
      ))}
    </div>
  );
}

function ImageText({ content }: { content: Record<string, unknown> }) {
  const image = safeHref(content.image);
  const alt = asString(content.alt);
  const paragraphs = (Array.isArray(content.paragraphs) ? content.paragraphs : [content.text]).filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0
  );
  const position = asString(content.imagePosition) === "right" ? "right" : "left";
  return (
    <div className={`grid gap-8 md:gap-12 items-center grid-cols-1 md:grid-cols-2 ${position === "right" ? "" : ""}`}>
      {image && (
        <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 ${position === "right" ? "md:order-2" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={alt} className="w-full h-full object-cover" />
        </div>
      )}
      <div className={position === "right" ? "md:order-1" : ""}>
        {paragraphs.map((p, i) => (
          <p key={i} className="text-slate-600 leading-relaxed mb-4 whitespace-pre-line">{renderInline(p)}</p>
        ))}
      </div>
    </div>
  );
}

function CardGrid({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items : [];
  const columns = Number(content.columns) === 2 ? "sm:grid-cols-2" : Number(content.columns) === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid gap-6 grid-cols-1 ${columns}`}>
      {items.map((item, idx) => {
        const card = (item ?? {}) as Record<string, unknown>;
        const title = asString(card.title);
        const image = safeHref(card.image);
        const href = safeHref(card.linkUrl);
        const body = (
          <article className={`group rounded-xl border border-slate-200 bg-white p-6 h-full transition-all duration-200 hover:shadow-lg hover:border-teal-500/30 ${href ? "cursor-pointer" : ""}`}>
            {image && (
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg mb-4 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={asString(card.imageAlt) || title} className="w-full h-full object-cover" />
              </div>
            )}
            {title && <h3 className="text-lg font-semibold text-navy-950 mb-2">{title}</h3>}
            {typeof card.description === "string" && card.description && (
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{card.description}</p>
            )}
            {asString(card.linkLabel) && href && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 group-hover:gap-2 transition-all">
                {asString(card.linkLabel)}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </span>
            )}
          </article>
        );
        return href ? (
          <a key={idx} href={href} className="block">
            {body}
          </a>
        ) : (
          <div key={idx}>{body}</div>
        );
      })}
    </div>
  );
}

function Gallery({ content }: { content: Record<string, unknown> }) {
  const images = Array.isArray(content.images) ? content.images : [];
  const columns = Number(content.columns) === 2 ? "sm:grid-cols-2" : Number(content.columns) === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid gap-4 grid-cols-1 ${columns} sm:gap-6`}>
      {images.map((item, idx) => {
        const img = (item ?? {}) as Record<string, unknown>;
        const url = safeHref(img.url);
        if (!url) return null;
        return (
          <figure key={idx} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={asString(img.alt)} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          </figure>
        );
      })}
    </div>
  );
}

function Stats({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items : [];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, idx) => {
        const stat = (item ?? {}) as Record<string, unknown>;
        return (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-3xl sm:text-4xl font-bold text-navy-950">
              {asString(stat.value)}
              <span className="text-teal-600">{asString(stat.suffix)}</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">{asString(stat.label)}</p>
          </div>
        );
      })}
    </div>
  );
}

function CtaBlock({ content }: { content: Record<string, unknown> }) {
  const title = asString(content.title);
  const description = asString(content.description);
  const buttonLabel = asString(content.buttonLabel);
  const buttonUrl = safeHref(content.buttonUrl);
  const variant = String(content.variant || "");
  const solid = variant === "solid";
  return (
    <div className={`rounded-2xl p-8 sm:p-12 text-center ${solid ? "bg-teal-600 text-white" : "bg-navy-950"}`}>
      {title && <h2 className={`text-2xl sm:text-3xl font-bold ${solid ? "text-white" : "text-white"}`}>{title}</h2>}
      {description && <p className={`mt-3 max-w-2xl mx-auto text-sm sm:text-base ${solid ? "text-teal-50" : "text-slate-300"}`}>{description}</p>}
      {buttonLabel && buttonUrl && (
        <div className="mt-8">
          <a
            href={buttonUrl}
            className={`inline-flex px-7 py-3 rounded-xl text-sm font-semibold ${
              solid ? "bg-white text-teal-700 hover:bg-teal-50" : "bg-gold-500 text-navy-950 hover:bg-gold-400"
            }`}
          >
            {buttonLabel}
          </a>
        </div>
      )}
    </div>
  );
}

function FeaturedItems({ content, items }: { content: Record<string, unknown>; items: Array<{ title: string; titleBn?: string; description?: string; descriptionBn?: string; image?: string | null; href?: string; meta?: string; dateLabel?: string }> }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No published items yet.</p>;
  }
  const columns = items.length === 3 ? "lg:grid-cols-3" : items.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-1";
  return (
    <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 ${columns}`}>
      {items.map((item, idx) => (
        <a key={idx} href={item.href || "#"} className="group rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-teal-500/40 transition-all">
          {item.meta && <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">{item.meta}</span>}
          {item.dateLabel && <span className="text-xs text-slate-400 mt-1 block">{item.dateLabel}</span>}
          <h3 className="text-lg font-semibold text-navy-950 mt-1.5 group-hover:text-teal-700 transition-colors">{item.title}</h3>
          {item.description && <p className="text-sm text-slate-600 mt-2 line-clamp-3">{item.description}</p>}
        </a>
      ))}
    </div>
  );
}

// Dynamic collection listing renderer for event_list, publication_list, blog_list, media_list, resource_list, program_list, research_list
function CollectionListing({
  content,
  items,
  sectionType,
  bn,
}: {
  content: Record<string, unknown>;
  items: Array<{ title: string; titleBn?: string; description?: string; descriptionBn?: string; image?: string | null; href?: string; meta?: string; dateLabel?: string }>;
  sectionType: string;
  bn: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No published items yet.</p>;
  }

  const layout = String(content.layout || "grid"); // grid | list
  const showDate = Boolean(content.showDate);
  const showMeta = Boolean(content.showMeta);
  const columns = Number(content.columns) === 2 ? "sm:grid-cols-2" : Number(content.columns) === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";

  const title = asString(bn && content.titleBn ? content.titleBn : content.title);
  const description = asString(bn && content.descriptionBn ? content.descriptionBn : content.description);

  // Section header
  const header = (title || description) ? (
    <div className="mb-10">
      {title && <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h2>}
      {description && <p className="mt-3 text-slate-500 max-w-2xl text-sm sm:text-base">{description}</p>}
    </div>
  ) : null;

  if (layout === "list") {
    return (
      <div>
        {header}
        <div className="space-y-4">
          {items.map((item, idx) => (
            <a
              key={idx}
              href={item.href || "#"}
              className="group flex gap-6 p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
            >
              {item.dateLabel && (
                <div className="shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex flex-col items-center justify-center text-white shadow-lg shadow-teal-500/20">
                  <span className="text-[10px] font-medium leading-none">{item.dateLabel.split(" ")[0]?.slice(0, 3).toUpperCase()}</span>
                  <span className="text-xs font-medium leading-none mt-0.5">{item.dateLabel.split(" ")[1]}</span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {showMeta && item.meta && (
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-teal-600">{item.meta}</span>
                  )}
                  {showDate && item.dateLabel && (
                    <>
                      {showMeta && item.meta && <span className="text-[10px] text-slate-300">·</span>}
                      <span className="text-[10px] text-slate-400">{item.dateLabel}</span>
                    </>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-teal-600 transition-colors">
                  {bn && item.titleBn ? item.titleBn : item.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {bn && item.descriptionBn ? item.descriptionBn : item.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div>
      {header}
      <div className={`grid gap-6 grid-cols-1 ${columns}`}>
        {items.map((item, idx) => (
          <a
            key={idx}
            href={item.href || "#"}
            className="group rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-teal-500/40 transition-all"
          >
            {item.meta && <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">{item.meta}</span>}
            {showDate && item.dateLabel && <span className="text-xs text-slate-400 mt-1 block">{item.dateLabel}</span>}
            <h3 className="text-lg font-semibold text-navy-950 mt-1.5 group-hover:text-teal-700 transition-colors">
              {bn && item.titleBn ? item.titleBn : item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-slate-600 mt-2 line-clamp-3">
                {bn && item.descriptionBn ? item.descriptionBn : item.description}
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

function FileCards({ items, withImage }: { items: Array<{ title: string; description?: string; image?: string | null; href?: string; meta?: string }>; withImage?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, idx) => (
        <a key={idx} href={item.href || "#"} className="group text-center">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 mx-auto ring-2 ring-white shadow-md">
            {withImage && item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-teal-600">
                {item.title.charAt(0)}
              </div>
            )}
          </div>
          <h3 className="mt-3 text-sm font-semibold text-navy-950 group-hover:text-teal-700 transition-colors">{item.title}</h3>
          <p className="text-xs text-slate-500">{item.description}</p>
        </a>
      ))}
    </div>
  );
}

function FocusListings({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items : [];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((raw, idx) => {
        const item = (raw ?? {}) as Record<string, unknown>;
        const title = asString(item.title);
        if (!title) return null;
        return (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6 hover:border-teal-500/40 transition-colors">
            <span className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mb-4 text-lg font-bold">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <h3 className="text-base font-semibold text-navy-950 mb-1.5">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{asString(item.description)}</p>
          </div>
        );
      })}
    </div>
  );
}

function ClubsListing() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {CLUBS.map((club) => (
        <a key={club.slug} href={`/clubs/${club.slug}`} className="group rounded-xl border border-slate-200 bg-white p-6 hover:border-teal-500/40 hover:shadow-md transition-all">
          <h3 className="text-lg font-semibold text-navy-950 group-hover:text-teal-700 transition-colors">{club.name}</h3>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-600">
            Visit club
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </span>
        </a>
      ))}
    </div>
  );
}

// Embed host allowlist — must match CSP frame-src entries in src/proxy.ts.
const EMBED_HOSTS: Array<{ pattern: RegExp; toEmbed: (url: URL) => string }> = [
  {
    pattern: /^www\.youtube\.com$/,
    toEmbed: (url) => `https://www.youtube.com/embed${url.pathname}${url.search}`,
  },
  {
    pattern: /^www\.youtube-nocookie\.com$/,
    toEmbed: (url) => `https://www.youtube-nocookie.com/embed${url.pathname}${url.search}`,
  },
  {
    pattern: /^youtu\.be$/,
    toEmbed: (url) => `https://www.youtube.com/embed${url.pathname}`,
  },
  {
    pattern: /^player\.vimeo\.com$/,
    toEmbed: (url) => `https://player.vimeo.com/video${url.pathname.replace(/^\/video/, "")}`,
  },
  {
    pattern: /^www\.google\.com$/,
    toEmbed: (url) => (url.pathname.startsWith("/maps") ? url.toString() : ""),
  },
];

function EmbedBlock({ content }: { content: Record<string, unknown> }) {
  const raw = asString(content.url).trim();
  let src = "";
  let hostLabel = "";
  let error: string | null = null;
  try {
    const url = new URL(raw);
    const rule = EMBED_HOSTS.find((h) => h.pattern.test(url.hostname));
    if (!rule) {
      error = "Embedded media from this host is not approved.";
    } else {
      src = rule.toEmbed(url);
      hostLabel = url.hostname;
    }
  } catch {
    if (raw && raw.startsWith("/") ) {
      // Allow same-origin relative embeds (e.g. /og preview images are NOT iframes; only paths ending with known patterns) — deny for safety.
      error = "Embedded media from this host is not approved.";
    } else {
      error = "Invalid embed URL.";
    }
  }
  if (error) return <p className="text-sm text-slate-400">{error}</p>;
  if (!src) return <p className="text-sm text-slate-400">Embedded media from this host is not approved.</p>;

  return (
    <figure className="rounded-2xl overflow-hidden border border-slate-200 bg-black/5">
      <div className="relative w-full aspect-video">
        <iframe
          src={src}
          title={hostLabel}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>
    </figure>
  );
}

// Video player — local file (MP4/WebM). Validates same-origin or https:// MP4/WebM
// URLs and renders with captions, poster, and fallback text so playback never
// depends on JavaScript.
function VideoPlayer({ content }: { content: Record<string, unknown> }) {
  // The poster must be an IMAGE (posterImage) — never the video source itself.
  const poster = safeHref(content.posterImage) ?? "";
  const source = asString(content.url).trim();
  const caption = asString(content.caption).trim();

  const isValidSource =
    (source.startsWith("/") || source.startsWith("#")) &&
    /\.(mp4|webm)($|\?)/i.test(source);
  if (!isValidSource) {
    return (
      <figure className="rounded-2xl overflow-hidden border border-slate-200 bg-black/5 p-8">
        <p className="text-sm text-slate-400 text-center">Video file is not available.</p>
      </figure>
    );
  }

  return (
    <figure className="rounded-2xl overflow-hidden border border-slate-200 bg-black/5">
      <video
        controls
        playsInline
        preload="metadata"
        poster={poster || undefined}
        className="w-full h-auto block max-h-[64vh] aspect-video"
      >
        <source src={source} type={source.endsWith(".webm") ? "video/webm" : "video/mp4"} />
        <track kind="captions" label="Captions" />
        Your browser does not support the video tag.
      </video>
      {caption && <figcaption className="mt-3 text-slate-500 text-sm max-w-md">{caption}</figcaption>}
    </figure>
  );
}

// FAQ Accordion
function FaqAccordion({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items : [];
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const faq = item as Record<string, unknown>;
        return (
          <details key={idx} className="group rounded-xl border border-slate-200 bg-white p-6">
            <summary className="flex items-center justify-between cursor-pointer list-none text-lg font-semibold text-navy-950">
              {asString(faq.question)}
              <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="mt-4 text-slate-600 leading-relaxed whitespace-pre-line">{asString(faq.answer)}</div>
          </details>
        );
      })}
    </div>
  );
}

// Timeline
function Timeline({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items : [];
  if (items.length === 0) return null;
  return (
    <div className="relative pl-8 border-l-2 border-teal-500/30">
      {items.map((item, idx) => {
        const tl = item as Record<string, unknown>;
        return (
          <div key={idx} className="relative pb-8 last:pb-0">
            <div className="absolute -left-10 top-1 w-6 h-6 rounded-full bg-teal-500 border-4 border-white shadow-sm" />
            <span className="text-sm font-medium text-teal-600 mb-1 block">{asString(tl.date)}</span>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{asString(tl.title)}</h3>
            <p className="text-sm text-slate-600">{asString(tl.description)}</p>
          </div>
        );
      })}
    </div>
  );
}

// Table Block
function TableBlock({ content }: { content: Record<string, unknown> }) {
  const headers = asString(content.headers).split(",").map(h => h.trim()).filter(Boolean);
  const rows = Array.isArray(content.rows) ? content.rows : [];
  if (headers.length === 0 || rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {headers.map((h, i) => <th key={i} className="px-4 py-3 text-left font-semibold text-slate-900">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: Record<string, unknown>, rowIdx: number) => {
            const cells = Array.isArray(row.cells) ? row.cells : asString(row.cells).split(",").map(c => c.trim());
            return (
              <tr key={rowIdx} className="border-b border-slate-100 hover:bg-slate-50">
                {cells.map((cell: string, cellIdx: number) => <td key={cellIdx} className="px-4 py-3 text-slate-600">{cell}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Newsletter Block
function NewsletterBlock({ content }: { content: Record<string, unknown> }) {
  const title = asString(content.title) || "Stay Updated";
  const description = asString(content.description);
  const placeholder = asString(content.placeholder) || "Your email address";
  const buttonLabel = asString(content.buttonLabel) || "Subscribe";
  const disclaimer = asString(content.disclaimer);
  return (
    <div className="rounded-2xl p-8 bg-navy-950 text-white max-w-xl">
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      {description && <p className="text-slate-300 mb-6">{description}</p>}
      <form className="flex gap-3 flex-wrap" action="/api/newsletter" method="POST">
        <input type="email" name="email" placeholder={placeholder} required className="flex-1 min-w-[250px] px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <button type="submit" className="px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-400 transition-colors whitespace-nowrap">{buttonLabel}</button>
      </form>
      {disclaimer && <p className="mt-4 text-xs text-slate-400">{disclaimer}</p>}
    </div>
  );
}

// Search Filter Block (placeholder - actual implementation would be more complex)
function SearchFilterBlock({ content }: { content: Record<string, unknown> }) {
  const placeholder = asString(content.placeholder) || "Search...";
  const collection = asString(content.collection) || "research";
  return (
    <div className="max-w-xl">
      <form className="flex gap-3" action={`/${collection}`} method="GET">
        <input type="search" name="q" placeholder={placeholder} className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
        <button type="submit" className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">Search</button>
      </form>
      <p className="mt-3 text-sm text-slate-500">Filter by: {asString(content.filters)}</p>
    </div>
  );
}

// Library Search Block - full-featured search and filter for the digital knowledge archive
function LibrarySearchBlock({ content, bn }: { content: Record<string, unknown>; bn: boolean }) {
  const placeholder = asString(bn && content.placeholderBn ? content.placeholderBn : content.placeholder) || (bn ? "গবেষণা, বিষয়, লেখক খুঁজুন..." : "Search research, topics, authors...");
  const showCategoryFilter = Boolean(content.showCategoryFilter);
  const showYearFilter = Boolean(content.showYearFilter);
  const showTopicFilter = Boolean(content.showTopicFilter);
  const showAuthorFilter = Boolean(content.showAuthorFilter);
  const showSortControl = Boolean(content.showSortControl);
  const showViewToggle = Boolean(content.showViewToggle);
  const defaultSort = asString(content.defaultSort) || "newest";
  const autocompleteEnabled = Boolean(content.autocompleteEnabled);

  return (
    <div className="min-h-[600px] bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950 rounded-3xl p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <span className="text-xs font-semibold tracking-[0.3em] uppercase text-teal-400 mb-3 block">
            {bn ? "ডিজিটাল জ্ঞান আর্কাইভ" : "Digital Knowledge Archive"}
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            {bn ? "গবেষণা <span className=\"gradient-text\">লাইব্রেরি</span>" : "Research <span className=\"gradient-text\">Library</span>"}
          </h1>
          <p className="text-slate-300/70 max-w-2xl mx-auto">
            {bn ? "মিডিয়া সাক্ষরতা, প্রেস স্বাধীনতা এবং ন্যারেটিভ ইকোসিস্টেম সম্পর্কে গবেষণা রিপোর্ট, নীতি বিবরণী এবং ওয়ার্কিং পেপার অনুসন্ধান, ফিল্টার ও এক্সপ্লোর করুন।" : "Explore our collection of research reports, policy briefs, and working papers on media literacy, press freedom, and narrative ecosystems."}
          </p>
        </div>

        {/* Search with Autocomplete */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder={placeholder}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400/50 focus:bg-white/10 transition-all text-lg"
            />
          </div>
          {autocompleteEnabled && (
            <p className="mt-2 text-xs text-slate-500 text-center">
              {bn ? "লিখতে থাকুন স্বয়ংসম্পূর্ণ পরামর্শ পেতে..." : "Keep typing for autocomplete suggestions..."}
            </p>
          )}
        </div>

        {/* Filter Sidebar Toggle (simplified for CMS section) */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {showCategoryFilter && (
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
              {bn ? "বিভাগ" : "Category"}
            </button>
          )}
          {showYearFilter && (
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
              {bn ? "বছর" : "Year"}
            </button>
          )}
          {showTopicFilter && (
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
              {bn ? "বিষয়" : "Topics"}
            </button>
          )}
          {showAuthorFilter && (
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
              {bn ? "লেখক" : "Author"}
            </button>
          )}
          {showSortControl && (
            <select defaultValue={defaultSort} className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400/50">
              <option value="newest">{bn ? "নতুনতম" : "Newest First"}</option>
              <option value="oldest">{bn ? "পুরাতনতম" : "Oldest First"}</option>
              <option value="popular">{bn ? "সবচেয়ে জনপ্রিয়" : "Most Downloaded"}</option>
              <option value="title">{bn ? "শিরোনাম অনুযায়ী" : "Title A-Z"}</option>
            </select>
          )}
        </div>

        {/* Results placeholder */}
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-teal-400/20 hover:bg-white/[0.06] transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-teal-500/10 text-teal-400 rounded-full border border-teal-400/20">
                  {bn ? "গবেষণা" : "Research"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                {bn ? "গবেষণা নিবন্ধের শিরোনাম এখানে আসবে" : "Research Article Title Placeholder"}
              </h3>
              <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                {bn ? "এটি লাইব্রেরি সার্চ সেকশনের একটি প্লেসহোল্ডার ফলাফল। প্রকৃত ফলাফল অনুসন্ধান করার পর দেখাবে।" : "This is a placeholder result for the library search section. Actual results appear after searching."}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{bn ? "লেখক নাম" : "Author Name"}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-500">{bn ? "২০২৪" : "2024"}</span>
                </div>
                <span className="text-xs text-slate-600">{bn ? "০ ডাউনলোড" : "0 downloads"}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-slate-500">
            {bn ? "আসল লাইব্রেরি পৃষ্ঠায় সম্পূর্ণ ফিচারসহ অনুসন্ধান উপলব্ধ।" : "Full-featured search available on the actual Library page."}
          </p>
        </div>
      </div>
    </div>
  );
}

// Testimonial Block
function TestimonialBlock({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items : [];
  if (items.length === 0) return null;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, idx) => {
        const t = item as Record<string, unknown>;
        return (
          <blockquote key={idx} className="p-6 rounded-2xl border border-slate-200 bg-white relative">
            <svg className="w-8 h-8 text-teal-500/30 mb-3" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.381c0-5.937 3.714-10.415 9.407-11.785v-2.622h-7.44v11.142c0 2.082-1.513 3.773-3.544 3.773H4.189c-2.549 0-4.617-2.068-4.617-4.617V4.617C0 2.068 1.64 0 4.189 0h16.222C22.932 0 24 2.068 24 4.617v11.142c0 2.082-1.513 3.773-3.544 3.773h-7.44v2.622c5.693 1.37 9.407 5.848 9.407 11.785V21h-2.983zM6.687 12.304c0 2.082 1.513 3.773 3.544 3.773h6.722c2.03 0 3.544-1.69 3.544-3.773V4.617c0-2.082-1.513-3.773-3.544-3.773h-6.722C8.2 0.844 6.687 2.535 6.687 4.617v7.687z"/></svg>
            <p className="text-slate-600 leading-relaxed mb-4">&ldquo;{asString(t.quote)}&rdquo;</p>
            <footer className="flex items-center gap-3">
              {asString(t.image) && <img src={asString(t.image)} alt="" className="w-10 h-10 rounded-full object-cover" />}
              <div>
                <cite className="font-semibold text-slate-900 not-italic">{asString(t.author)}</cite>
                {asString(t.role) && <p className="text-sm text-slate-500">{asString(t.role)}</p>}
              </div>
            </footer>
          </blockquote>
        );
      })}
    </div>
  );
}

// Logo Cloud
function LogoCloud({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items : [];
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 items-center">
      {items.map((item, idx) => {
        const logo = item as Record<string, unknown>;
        const url = safeHref(logo.url);
        const image = safeHref(logo.image);
        const alt = asString(logo.alt);
        if (!image) return null;
        const logoEl = (
          <img src={image} alt={alt} className="h-12 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity grayscale" />
        );
        return url ? (
          <a key={idx} href={url} className="flex items-center justify-center" target="_blank" rel="noopener noreferrer">
            {logoEl}
          </a>
        ) : (
          <div key={idx} className="flex items-center justify-center">{logoEl}</div>
        );
      })}
    </div>
  );
}

// Accordion Block
function AccordionBlock({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items : [];
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const acc = item as Record<string, unknown>;
        return (
          <details key={idx} className="group rounded-xl border border-slate-200 bg-white p-6">
            <summary className="flex items-center justify-between cursor-pointer list-none text-lg font-semibold text-navy-950">
              {asString(acc.title)}
              <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="mt-4 text-slate-600 leading-relaxed whitespace-pre-line">{asString(acc.content)}</div>
          </details>
        );
      })}
    </div>
  );
}
