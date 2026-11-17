"use client";

import { useEffect, useState } from "react";
import { mutate as globalMutate } from "swr";
import useSWRMutation from "swr/mutation";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { FOCUS_ICON_OPTIONS } from "@/lib/focus-icons";
import { focusUpdateSchema, type FocusUpdateInput } from "@/lib/focus-schema";
import {
  FOCUS_LIST_KEY,
  type FocusAreaDto,
  type FocusListResponse,
} from "@/lib/focus-types";

interface FocusCmsDrawerProps {
  open: boolean;
  areas: FocusAreaDto[];
  initialSlug?: string | null;
  onClose: () => void;
  onSaved?: (area: FocusAreaDto) => void;
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  icon: string;
  content: string;
  imageUrl: string;
  order: string;
}

interface SaveResponse {
  area: FocusAreaDto;
}

function toForm(area: FocusAreaDto): FormState {
  return {
    title: area.title,
    slug: area.slug,
    description: area.description,
    icon: area.icon ?? "Sparkles",
    content: area.content ?? "",
    imageUrl: area.imageUrl ?? "",
    order: String(area.order),
  };
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function FocusCmsDrawer({
  open,
  areas,
  initialSlug,
  onClose,
  onSaved,
}: FocusCmsDrawerProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(() =>
    areas[0] ? toForm(areas[0]) : { title: "", slug: "", description: "", icon: "Sparkles", content: "", imageUrl: "", order: "0" }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedArea = areas.find((a) => a.id === selectedId) ?? areas[0] ?? null;

  useEffect(() => {
    if (!open || !selectedArea) return;
    setSelectedId(selectedArea.id);
    setForm(toForm(selectedArea));
    setErrors({});
    setServerError(null);
    setSaved(false);
    // Re-seed the form only when a different area is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSlug, selectedArea?.id]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const { trigger, isMutating } = useSWRMutation<SaveResponse, Error, string | null, FocusUpdateInput>(
    selectedArea ? `/api/focus/${selectedArea.id}` : null,
    async (url, { arg }) => {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.error || `Could not save (${response.status})`;
        const detail = Array.isArray(payload?.details) ? `: ${payload.details[0]?.message ?? ""}` : "";
        throw new Error(`${message}${detail}`);
      }
      return payload as SaveResponse;
    },
    { revalidate: false }
  );

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
    if (errors[key]) setErrors((current) => ({ ...current, [key]: "" }));
  };

  const handleSave = async () => {
    if (!selectedArea) return;

    const order = Number.parseInt(form.order, 10);
    const input: FocusUpdateInput = {
      title: form.title,
      slug: form.slug,
      description: form.description,
      icon: form.icon,
      content: form.content,
      imageUrl: form.imageUrl.trim() || null,
      ...(Number.isFinite(order) ? { order } : {}),
    };

    const parsed = focusUpdateSchema.safeParse(input);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "form");
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      setServerError(null);
      return;
    }

    setErrors({});
    setServerError(null);

    const optimistic = areas.map((area) =>
      area.id === selectedArea.id ? { ...area, ...parsed.data } : area
    );
    await globalMutate<FocusListResponse>(
      FOCUS_LIST_KEY,
      { areas: optimistic, count: optimistic.length },
      { revalidate: false }
    );

    try {
      const result = await trigger(parsed.data);
      const reconciled = areas.map((area) =>
        area.id === result.area.id ? result.area : area
      );
      await globalMutate<FocusListResponse>(
        FOCUS_LIST_KEY,
        { areas: reconciled, count: reconciled.length },
        { revalidate: false }
      );
      setSaved(true);
      onSaved?.(result.area);
    } catch (error) {
      await globalMutate(FOCUS_LIST_KEY);
      setServerError(error instanceof Error ? error.message : "Could not save focus area.");
    }
  };

  if (!open || !selectedArea) return null;

  const previewHref = `/focus/${form.slug || selectedArea.slug}`;
  const IconOption = FOCUS_ICON_OPTIONS.find((option) => option.value === form.icon)?.icon;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Close focus area editor"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="focus-drawer-title"
        className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
              Focus Area CMS
            </p>
            <h2 id="focus-drawer-title" className="mt-1 text-xl font-bold text-slate-900">
              Edit Focus Area
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Updates the homepage card and its dedicated sub-page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <label className="block text-xs font-semibold text-slate-700" htmlFor="focus-area-picker">
            Focus area
          </label>
          <select
            id="focus-area-picker"
            value={selectedArea.id}
            onChange={(event) => {
              const area = areas.find((item) => item.id === Number(event.target.value));
              if (area) {
                setSelectedId(area.id);
                setForm(toForm(area));
                setErrors({});
                setServerError(null);
                setSaved(false);
              }
            }}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.title}
              </option>
            ))}
          </select>

          <div className="mt-5 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700" htmlFor="focus-title">
                Title
              </label>
              <input
                id="focus-title"
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <FieldError message={errors.title} />
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-700">Icon</span>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {FOCUS_ICON_OPTIONS.map((option) => {
                  const OptionIcon = option.icon;
                  const active = form.icon === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      title={option.label}
                      aria-label={option.label}
                      aria-pressed={active}
                      onClick={() => setField("icon", option.value)}
                      className={`flex h-11 items-center justify-center rounded-lg border transition-colors ${
                        active
                          ? "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <OptionIcon size={18} strokeWidth={1.8} />
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                {IconOption ? `Selected: ${IconOption.displayName ?? form.icon}` : form.icon}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700" htmlFor="focus-description">
                Description
              </label>
              <textarea
                id="focus-description"
                rows={3}
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-relaxed text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <FieldError message={errors.description} />
            </div>

            <div>
              <div className="flex items-end justify-between gap-3">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="focus-slug">
                  Slug
                </label>
                <button
                  type="button"
                  onClick={() => setField("slug", slugifyTitle(form.title))}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                      Generate from title
                </button>
              </div>
              <input
                id="focus-slug"
                value={form.slug}
                onChange={(event) => setField("slug", event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                Public URL:
                <a href={previewHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700">
                  {previewHref} <ExternalLink size={12} />
                </a>
              </p>
              <FieldError message={errors.slug} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700" htmlFor="focus-content">
                Edit Content for New Page
              </label>
              <textarea
                id="focus-content"
                rows={14}
                value={form.content}
                onChange={(event) => setField("content", event.target.value)}
                placeholder={"## Section heading\n\nYour paragraph here.\n\n- Key point one\n- Key point two"}
                className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-xs leading-relaxed text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Markdown supported: <code>## heading</code>, <code>**bold**</code>, <code>- list</code>, <code>&gt; quote</code>, <code>[link](url)</code>.
              </p>
              <FieldError message={errors.content} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="focus-image">
                  Image URL (optional)
                </label>
                <input
                  id="focus-image"
                  value={form.imageUrl}
                  onChange={(event) => setField("imageUrl", event.target.value)}
                  placeholder="https://…"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <FieldError message={errors.imageUrl} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="focus-order">
                  Display order
                </label>
                <input
                  id="focus-order"
                  type="number"
                  value={form.order}
                  onChange={(event) => setField("order", event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <FieldError message={errors.order} />
              </div>
            </div>

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {serverError}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-xs text-slate-500">
            {saved ? (
              <span className="inline-flex items-center gap-1.5 text-teal-700">
                <Check size={14} /> Saved and published
              </span>
            ) : (
              "Changes publish immediately."
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isMutating}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isMutating ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {isMutating ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
