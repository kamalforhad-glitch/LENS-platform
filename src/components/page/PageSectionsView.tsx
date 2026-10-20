"use client";

import { useTranslation } from "react-i18next";
import { CLUBS } from "@/lib/clubs";
import type { PublicSectionData } from "@/lib/actions/cms";
import { extractMarkdownLinkUrl } from "@/lib/cms-validation";
import type { ResolvedItems } from "./resolveSectionItems";

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

function pick(bn: boolean, en: unknown, bnv: unknown): unknown {
  if (bn && bnv !== undefined && bnv !== "" && bnv !== null) return bnv;
  return en;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// ------------------------------------------------------------
// Dispatch
// ------------------------------------------------------------

function SectionContent({ section, bn }: { section: SectionWithResolved; bn: boolean }) {
  const content = pick(bn, section.content, section.contentBn) as Record<string, unknown>;
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
    case "focus_areas":
      return <FocusListings content={content} />;
    case "clubs":
      return <ClubsListing />;
    case "team":
      return <FileCards items={section.resolved?.items ?? []} withImage />;
    case "embed":
      return <EmbedBlock content={content} />;
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
  const title = asString(pick(bn, section.title, section.titleBn));
  const eyebrow = asString(content.eyebrow);
  const subtitle = asString(content.subtitle);
  const image = safeHref(content.image) || safeHref(content.backgroundImage);
  const ctaLabel = asString(content.ctaLabel);
  const ctaUrl = safeHref(content.ctaUrl);
  const cta2Label = asString(content.ctaLabel2);
  const cta2Url = safeHref(content.ctaUrl2);

  const dark = Boolean(image);
  return (
    <section className={`relative overflow-hidden rounded-2xl ${dark ? "bg-navy-950" : "bg-slate-50 border border-slate-100"}`}>
      {image && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/60 to-navy-950/30" />
        </div>
      )}
      <div className={`relative px-6 sm:px-10 py-16 sm:py-24 max-w-4xl ${dark ? "text-white" : "text-navy-950"}`}>
        {eyebrow && (
          <span className="inline-block mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-500">{eyebrow}</span>
        )}
        <h1 className={`text-3xl sm:text-5xl font-bold leading-tight tracking-tight ${dark ? "text-white" : "text-navy-950"}`}>{title}</h1>
        {subtitle && <p className={`mt-5 text-base sm:text-lg max-w-2xl ${dark ? "text-slate-300" : "text-slate-600"}`}>{subtitle}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          {ctaLabel && ctaUrl && (
            <a href={ctaUrl} className="inline-flex px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold">{ctaLabel}</a>
          )}
          {cta2Label && cta2Url && (
            <a href={cta2Url} className={`inline-flex px-6 py-3 rounded-xl text-sm font-semibold ${dark ? "border border-white/25 text-white hover:bg-white/10" : "border border-slate-300 text-slate-700 hover:bg-slate-100"}`}>{cta2Label}</a>
          )}
        </div>
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

function FeaturedItems({ content, items }: { content: Record<string, unknown>; items: Array<{ title: string; description?: string; image?: string | null; href?: string; meta?: string }> }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No published items yet.</p>;
  }
  const columns = items.length === 3 ? "lg:grid-cols-3" : items.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-1";
  return (
    <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 ${columns}`}>
      {items.map((item, idx) => (
        <a key={idx} href={item.href || "#"} className="group rounded-xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-teal-500/40 transition-all">
          {item.meta && <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">{item.meta}</span>}
          <h3 className="text-lg font-semibold text-navy-950 mt-1.5 group-hover:text-teal-700 transition-colors">{item.title}</h3>
          {item.description && <p className="text-sm text-slate-600 mt-2 line-clamp-3">{item.description}</p>}
        </a>
      ))}
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
  try {
    const url = new URL(raw);
    const rule = EMBED_HOSTS.find((h) => h.pattern.test(url.hostname));
    if (!rule) return <p className="text-sm text-slate-400">Embedded media from this host is not approved.</p>;
    src = rule.toEmbed(url);
    hostLabel = url.hostname;
  } catch {
    if (raw && raw.startsWith("/") ) {
      // Allow same-origin relative embeds (e.g. /og preview images are NOT iframes; only paths ending with known patterns) — deny for safety.
      return <p className="text-sm text-slate-400">Embedded media from this host is not approved.</p>;
    }
    return <p className="text-sm text-slate-400">Invalid embed URL.</p>;
  }
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
