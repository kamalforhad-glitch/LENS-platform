// ============================================================
// EditorialInsightGrid — research-grade bento showcase.
//
// Replaces the legacy synthetic 3D globe: a static, server-rendered
// editorial metric board (statement, live indicators, evidence
// cards, ecosystem nodes and a documentary photo slot) built from
// the site's slate/navy palette (#0F172A slate-900 / navy-950) with
// cyan-400 accents.
//
// Design rules:
//   • no canvas, no WebGL, no client state — it paints with the HTML
//     so the hero renders on the very first contentful paint;
//   • every media box has an explicit aspect ratio (zero CLS);
//   • borders/backdrops are CSS only (no layout thrash).
// ============================================================
"use client";

import { ArrowUpRight, FileText, Radio, Waypoints } from "lucide-react";
import { useTranslation } from "react-i18next";
import { resolveCmsValue } from "@/lib/cms-content";
import PrefetchLink from "./PrefetchLink";

type SectionContent = {
  content?: string | Record<string, unknown>;
  contentBn?: string | Record<string, unknown>;
};

type Indicator = { value: string; label: string };

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseJsonSafe(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object") return value as Record<string, unknown>;
  try {
    return JSON.parse(value as string) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** Indicators are authored in the CMS as `{ value, label }[]`. */
function readIndicators(payload: Record<string, unknown>): Indicator[] {
  const list = payload.indicators;
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const value = asString(record.value);
      const label = asString(record.label);
      return value && label ? { value, label } : null;
    })
    .filter((entry): entry is Indicator => entry !== null)
    .slice(0, 3);
}

const CARD =
  "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const HAIRLINE =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent";

export default function EditorialInsightGrid({
  cmsData,
  statement,
  statementAccent,
}: {
  cmsData?: SectionContent;
  /** Resolved CMS/i18n copy for the standfirst (falls back to i18n). */
  statement?: string;
  statementAccent?: string;
}) {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const contentEn = parseJsonSafe(cmsData?.content);
  const contentBn = parseJsonSafe(cmsData?.contentBn);

  const eyebrow =
    asString(resolveCmsValue(isBn, contentEn, contentBn, ["insightEyebrow"])) || t("hero.insight.eyebrow");
  const statementSource =
    asString(resolveCmsValue(isBn, contentEn, contentBn, ["insightSource"])) ||
    t("hero.insight.statement_source");
  const photo = asString(resolveCmsValue(false, contentEn, contentBn, ["insightPhoto"]));
  const statementLine = statement || t("hero.tagline_better");
  const statementAccentLine = statementAccent || t("hero.tagline_stronger");

  const authored = readIndicators(contentEn);
  const indicators: Indicator[] =
    authored.length > 0
      ? authored
      : [
          { value: "1,200+", label: t("hero.insight.outlets_label") },
          { value: "48", label: t("hero.insight.signals_label") },
          { value: "12", label: t("hero.insight.briefs_label") },
        ];

  const evidence: { label: string; href: string }[] = [
    { label: t("hero.insight.evidence_index"), href: "/indexing/press-freedom-index" },
    { label: t("hero.insight.evidence_literacy"), href: "/programs" },
  ];

  const nodes = (
    isBn ? ["ঢাকা", "চট্টগ্রাম", "খুলনা"] : ["Dhaka", "Chattogram", "Khulna"]
  ).slice(0, 3);

  return (
    <div
      className="w-full max-w-[520px] mx-auto grid grid-cols-2 gap-3"
      aria-label={eyebrow}
    >
      {/* Statement — the hero tagline, presented as an editorial standfirst */}
      <article className={`${CARD} col-span-2 flex flex-col justify-between p-5 min-h-[140px]`}>
        <span className={HAIRLINE} aria-hidden="true" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">{eyebrow}</p>
          <p className="mt-2.5 text-lg lg:text-xl font-bold leading-[1.25] text-white whitespace-pre-line">
            {statementLine}
          </p>
          <p className="text-lg lg:text-xl font-bold leading-[1.25] text-cyan-400 whitespace-pre-line">
            {statementAccentLine}
          </p>
        </div>
        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-slate-400">{statementSource}</p>
      </article>

      {/* Live indicators */}
      {indicators.map((indicator, index) => (
        <article
          key={indicator.label}
          className={`${CARD} p-4 flex flex-col justify-between min-h-[120px]`}
        >
          <span className={HAIRLINE} aria-hidden="true" />
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${
              index === 1
                ? "border-gold-500/30 bg-gold-500/10 text-gold-300"
                : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
            }`}
            aria-hidden="true"
          >
            {index === 1 ? <FileText className="h-4 w-4" /> : index === 2 ? <Waypoints className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
          </span>
          <div className="mt-3">
            <p className="text-2xl font-bold tabular-nums leading-none text-white">{indicator.value}</p>
            <p className="mt-1.5 text-[11px] leading-snug text-slate-400">{indicator.label}</p>
          </div>
        </article>
      ))}

      {/* Evidence cards — internal links, prefetched on hover */}
      <article className={`${CARD} p-4 min-h-[120px]`}>
        <span className={HAIRLINE} aria-hidden="true" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {t("hero.insight.evidence_title")}
        </p>
        <ul className="mt-2.5 space-y-2">
          {evidence.map((item) => (
            <li key={item.href}>
              <PrefetchLink
                href={item.href}
                className="group flex items-start gap-1.5 text-[11px] leading-snug text-slate-300 hover:text-cyan-300 transition-colors"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </PrefetchLink>
            </li>
          ))}
        </ul>
      </article>

      {/* Ecosystem nodes */}
      <article className={`${CARD} p-4 flex flex-col justify-between min-h-[120px]`}>
        <span className={HAIRLINE} aria-hidden="true" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          {t("hero.insight.nodes_title")}
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {nodes.map((node) => (
            <li key={node} className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/80" aria-hidden="true" />
              {node}
            </li>
          ))}
        </ul>
      </article>

      {/* Documentary photography slot — fixed ratio, zero CLS */}
      <figure className={`${CARD} relative aspect-[4/3]`}>
        <span className={HAIRLINE} aria-hidden="true" />
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={t("hero.insight.photo_alt")}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center saturate-[0.85]"
          />
        ) : (
          <div
            className="absolute inset-0 bg-slate-900"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(34,211,238,0.16) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/30 to-transparent"
          aria-hidden="true"
        />
        <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <span className="text-[10px] leading-snug text-slate-300">{t("hero.insight.photo_caption")}</span>
          <span className="hidden sm:inline-flex rounded-full border border-white/15 bg-slate-900/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-300 backdrop-blur-md">
            LENS
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
