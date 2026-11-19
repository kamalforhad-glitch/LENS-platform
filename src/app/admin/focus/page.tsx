"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import useSWR from "swr";
import { ExternalLink, Loader2, Pencil, RefreshCw } from "lucide-react";

const FocusCmsDrawer = dynamic(() => import("@/components/admin/FocusCmsDrawer"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
      <div className="rounded-lg bg-white px-4 py-3 text-sm text-slate-600 shadow-lg">Loading editor...</div>
    </div>
  ),
});
import { focusAccent, renderFocusIcon } from "@/lib/focus-icons";
import {
  FOCUS_LIST_KEY,
  type FocusAreaDto,
  type FocusListResponse,
} from "@/lib/focus-types";

async function fetchFocusAreas(): Promise<FocusListResponse> {
  const response = await fetch(FOCUS_LIST_KEY);
  if (!response.ok) throw new Error("Could not load focus areas");
  return response.json() as Promise<FocusListResponse>;
}

export default function FocusAdminPage() {
  const { data, error, isLoading, mutate } = useSWR<FocusListResponse>(
    FOCUS_LIST_KEY,
    fetchFocusAreas,
    { revalidateOnFocus: false }
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const areas = data?.areas ?? [];

  const openEditor = (slug: string) => {
    setSelectedSlug(slug);
    setNotice(null);
    setDrawerOpen(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Focus Areas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the eight homepage cards and their dedicated{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/focus/[slug]</code> pages.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void mutate()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <Link
            href="/?editFocus=1#focus-areas"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink size={15} /> Edit on homepage
          </Link>
          <button
            type="button"
            onClick={() => openEditor(areas[0]?.slug ?? "")}
            disabled={areas.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil size={15} /> Open editor
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : "Failed to load focus areas."}
        </div>
      )}
      {isLoading && (
        <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading focus areas…
        </div>
      )}

      {!isLoading && areas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {areas.map((area) => {
            const { accent, glow } = focusAccent(area.order);
            return (
              <article
                key={area.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{ color: accent, borderColor: accent, background: glow }}
                  >
                    {renderFocusIcon(area.icon, area.order, {
                      size: 20,
                      strokeWidth: 1.8,
                    })}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    #{area.order}
                  </span>
                </div>

                <h2 className="mt-4 text-base font-bold text-slate-900">{area.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">
                  {area.description}
                </p>

                <dl className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex justify-between gap-3">
                    <dt>Slug</dt>
                    <dd className="truncate font-mono text-slate-700">{area.slug}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Page content</dt>
                    <dd>{area.content?.trim() ? `${area.content.trim().split(/\s+/).length} words` : "Not written"}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditor(area.slug)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <Link
                    href={`/focus/${area.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    View page <ExternalLink size={12} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {drawerOpen && (
        <FocusCmsDrawer
          open
          areas={areas}
          initialSlug={selectedSlug}
          onClose={() => setDrawerOpen(false)}
          onSaved={(area: FocusAreaDto) =>
            setNotice(`Saved “${area.title}”. Live pages were revalidated.`)
          }
        />
      )}
    </div>
  );
}
