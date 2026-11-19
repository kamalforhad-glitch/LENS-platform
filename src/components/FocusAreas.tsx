"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Pencil } from "lucide-react";
import { resolveCmsValue } from "@/lib/cms-content";
import { focusAccent, renderFocusIcon } from "@/lib/focus-icons";
import {
  FOCUS_I18N_KEY_BY_SLUG,
  FOCUS_LIST_KEY,
  type FocusAreaDto,
  type FocusListResponse,
} from "@/lib/focus-types";

const FocusCmsDrawer = dynamic(() => import("@/components/admin/FocusCmsDrawer"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

export interface CmsSectionData {
  id?: string;
  type?: string;
  title?: string;
  titleBn?: string;
  description?: string;
  descriptionBn?: string;
  sortOrder?: number;
  visible?: boolean;
  settings?: string | Record<string, unknown>;
  content?: string | Record<string, unknown>;
  contentBn?: string | Record<string, unknown>;
}

interface CardOverride {
  title?: string;
  desc?: string;
  detail?: string;
}

type JsonRecord = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseJsonSafe(value: unknown): JsonRecord {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as JsonRecord;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as JsonRecord)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

function cardMap(value: unknown): JsonRecord {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .filter((item): item is JsonRecord => Boolean(item) && typeof item === "object")
        .map((item) => [(asString(item.key) || asString(item.id)), item])
    );
  }
  return parseJsonSafe(value);
}

function readOverride(value: unknown): CardOverride | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as JsonRecord;
  const title = asString(record.title);
  const desc = asString(record.desc || record.description);
  const detail = asString(record.detail);
  return title || desc || detail ? { title, desc, detail } : undefined;
}

async function fetchFocusAreas(): Promise<FocusListResponse> {
  const response = await fetch(FOCUS_LIST_KEY);
  if (!response.ok) throw new Error("Could not load focus areas");
  return response.json() as Promise<FocusListResponse>;
}

function FocusCard({
  area,
  cardOverride,
  detail,
  learnMore,
}: {
  area: FocusAreaDto;
  cardOverride?: CardOverride;
  detail: string;
  learnMore: string;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const { accent, glow } = focusAccent(area.order);

  function handleMouseMove(event: React.MouseEvent<HTMLAnchorElement>) {
    const card = cardRef.current;
    const glowEl = glowRef.current;
    if (!card || !glowEl) return;

    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const tiltX = ((y - 50) / 50) * -6;
    const tiltY = ((x - 50) / 50) * 6;

    gsap.to(card, {
      rotateX: tiltX,
      rotateY: tiltY,
      transformPerspective: 800,
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(glowEl, {
      opacity: 1,
      background: `radial-gradient(circle at ${x}% ${y}%, ${glow} 0%, transparent 55%)`,
      duration: 0.3,
    });
  }

  function handleMouseEnter() {
    const card = cardRef.current;
    const detailEl = detailRef.current;
    if (card) {
      gsap.to(card, {
        scale: 1.02,
        boxShadow: `0 20px 60px -12px ${glow}`,
        duration: 0.4,
        ease: "power2.out",
      });
    }
    if (detailEl) {
      gsap.to(detailEl, { height: "auto", opacity: 1, marginTop: 12, duration: 0.4, ease: "power2.out" });
    }
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    const glowEl = glowRef.current;
    const detailEl = detailRef.current;

    if (card) {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        boxShadow: "0 0 0 0 transparent",
        duration: 0.5,
        ease: "power2.out",
      });
    }
    if (glowEl) gsap.to(glowEl, { opacity: 0, duration: 0.3 });
    if (detailEl) {
      gsap.to(detailEl, { height: 0, opacity: 0, marginTop: 0, duration: 0.3, ease: "power2.in" });
    }
  }

  return (
    <Link
      ref={cardRef}
      href={`/focus/${area.slug}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex min-h-full overflow-hidden rounded-2xl border border-slate-100 bg-white transition-colors duration-300 hover:border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div ref={glowRef} className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-0" />

      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      <div className="relative z-10 flex gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 transition-colors duration-300 group-hover:bg-slate-100">
          {renderFocusIcon(area.icon, area.order, {
            className: "h-6 w-6 transition-all duration-500 group-hover:scale-110",
            style: { color: accent },
            strokeWidth: 1.5,
          })}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-base font-bold text-slate-900 transition-colors group-hover:text-slate-950">
            {cardOverride?.title || area.title}
          </h3>
          <p className="mb-2 text-sm leading-relaxed text-slate-500">
            {cardOverride?.desc || area.description}
          </p>

          <div ref={detailRef} className="overflow-hidden" style={{ height: 0, opacity: 0, marginTop: 0 }}>
            <p className="text-xs leading-relaxed text-slate-400">{detail}</p>
          </div>

          <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 transition-colors group-hover:text-teal-500">
            {learnMore}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FocusAreas({
  cmsData,
  initialAreas = [],
}: {
  cmsData?: CmsSectionData;
  initialAreas?: FocusAreaDto[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const [editMode, setEditMode] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fallback = { areas: initialAreas, count: initialAreas.length };
  const { data } = useSWR<FocusListResponse>(FOCUS_LIST_KEY, fetchFocusAreas, {
    fallbackData: fallback,
    revalidateOnFocus: false,
    // The server already rendered the same list. Avoid a duplicate browser
    // fetch on mount; CMS saves call globalMutate() explicitly.
    revalidateOnMount: false,
  });
  const areas = data?.areas ?? initialAreas;

  useEffect(() => {
    const isEdit = new URLSearchParams(window.location.search).get("editFocus") === "1";
    setEditMode(isEdit);
    if (!isEdit) return;

    let cancelled = false;
    fetch("/api/auth/check", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Unauthorized"))))
      .then((payload: { authenticated?: boolean; user?: { role?: string } }) => {
        if (cancelled) return;
        const role = payload.user?.role;
        setCanEdit(
          Boolean(payload.authenticated) &&
            (role === "admin" || role === "super_admin")
        );
      })
      .catch(() => {
        if (!cancelled) setCanEdit(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cEn = parseJsonSafe(cmsData?.content);
  const cBn = parseJsonSafe(cmsData?.contentBn);

  const sectionLabel =
    asString(resolveCmsValue(isBn, cEn, cBn, ["sectionLabel", "label"])) ||
    t("focus.section_label");
  const rowTitle = asString(isBn ? cmsData?.titleBn || cmsData?.title : cmsData?.title);
  const sectionTitle =
    asString(resolveCmsValue(isBn, cEn, cBn, ["sectionTitle", "title"])) ||
    rowTitle ||
    t("focus.section_title");
  const rowDesc = asString(isBn ? cmsData?.descriptionBn || cmsData?.description : cmsData?.description);
  const sectionDesc =
    asString(resolveCmsValue(isBn, cEn, cBn, ["sectionDescription", "description"])) ||
    rowDesc ||
    t("focus.section_description");

  const aboutLinkText =
    asString(resolveCmsValue(isBn, cEn, cBn, ["aboutLinkText"])) || t("focus.about_lens");
  const aboutLinkUrl =
    asString(resolveCmsValue(false, cEn, cBn, ["aboutLinkUrl"])) || "/about";

  const cardsMapEn = cardMap(cEn.cards);
  const cardsMapBn = cardMap(cBn.cards);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        ".focus-label",
        { opacity: 0, y: 15, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );
      gsap.fromTo(
        ".focus-title",
        { opacity: 0, y: 25, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 70%" },
        }
      );
      gsap.fromTo(
        ".focus-desc",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 65%" },
        }
      );
      gsap.fromTo(
        ".focus-link",
        { opacity: 0, x: -10 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 60%" },
        }
      );

      const cards = gsap.utils.toArray<HTMLElement>(".focus-card-wrap");
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 60, rotateX: -15, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 85%" },
            delay: index * 0.06,
          }
        );
      });

      gsap.fromTo(
        ".focus-grid-line",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: ".focus-grid", start: "top 80%" },
        }
      );
    }, sectionRef);

    return () => mm.revert();
  }, [areas.length]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-white py-24 lg:py-32" id="focus-areas">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #0891b2 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/[0.02] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[340px_1fr] lg:gap-16">
          <div>
            <span id="about" className="focus-label mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
              {sectionLabel}
            </span>
            <h2 className="focus-title mb-5 text-3xl font-bold leading-tight text-slate-900 lg:text-4xl">
              {sectionTitle}
            </h2>
            <p className="focus-desc mb-6 leading-relaxed text-slate-500">{sectionDesc}</p>
            <a
              href={aboutLinkUrl}
              className="focus-link group inline-flex items-center gap-2 font-semibold text-teal-600 transition-colors hover:text-teal-500"
            >
              {aboutLinkText}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>

            {editMode && canEdit && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
              >
                <Pencil size={14} /> Edit focus areas
              </button>
            )}
          </div>

          <div className="focus-grid relative grid gap-5 sm:grid-cols-2">
            <div className="focus-grid-line pointer-events-none absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 origin-left bg-gradient-to-r from-transparent via-teal-400/10 to-transparent lg:block" />

            {areas.map((area) => {
              const i18nKey = FOCUS_I18N_KEY_BY_SLUG[area.slug] || "";
              const override = isBn
                ? readOverride(cardsMapBn[i18nKey] ?? cardsMapEn[i18nKey])
                : readOverride(cardsMapEn[i18nKey]);
              const translatedDetail = i18nKey ? String(t(`focus.${i18nKey}.detail`)) : "";
              const detail =
                override?.detail ||
                (isBn && translatedDetail && !translatedDetail.startsWith("focus.")
                  ? translatedDetail
                  : area.description);

              return (
                <div key={area.id} className="focus-card-wrap" style={{ perspective: "800px" }}>
                  <FocusCard
                    area={area}
                    cardOverride={override}
                    detail={detail}
                    learnMore={t("focus.learn_more")}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <FocusCmsDrawer
          open
          areas={areas}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </section>
  );
}
