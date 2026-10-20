"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Newspaper, Image as ImageIcon, Sparkles, X } from "lucide-react";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

interface MediaItemFormData {
  title: string;
  titleBn: string;
  slug: string;
  description: string;
  descriptionBn: string;
  content: string;
  contentBn: string;
  image: string;
  type: string;
  source: string;
  sourceUrl: string;
  status: "draft" | "published";
  featured: boolean;
  datePublished: string;
  metaTitle: string;
  metaDescription: string;
}

export default function MediaItemEditor() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const isNew = rawId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const [form, setForm] = useState<MediaItemFormData>({
    title: "",
    titleBn: "",
    slug: "",
    description: "",
    descriptionBn: "",
    content: "",
    contentBn: "",
    image: "",
    type: "press_release",
    source: "",
    sourceUrl: "",
    status: "draft",
    featured: false,
    datePublished: new Date().toISOString().split("T")[0],
    metaTitle: "",
    metaDescription: "",
  });

  useEffect(() => {
    if (!isNew && rawId) {
      fetch(`/api/admin/media-items?id=${rawId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.item) {
            const item = d.item;
            setForm({
              title: item.title || "",
              titleBn: item.titleBn || "",
              slug: item.slug || "",
              description: item.description || "",
              descriptionBn: item.descriptionBn || "",
              content: item.content || "",
              contentBn: item.contentBn || "",
              image: item.image || "",
              type: item.type || "press_release",
              source: item.source || "",
              sourceUrl: item.sourceUrl || "",
              status: item.status || "draft",
              featured: !!item.featured,
              datePublished: item.datePublished
                ? new Date(item.datePublished).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              metaTitle: item.metaTitle || "",
              metaDescription: item.metaDescription || "",
            });
          } else {
            setError("Media item not found");
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load media item");
          setLoading(false);
        });
    }
  }, [isNew, rawId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const url = "/api/admin/media-items";
      const method = isNew ? "POST" : "PUT";
      const payload: Record<string, unknown> = {
        ...form,
        datePublished: form.datePublished ? new Date(form.datePublished).toISOString() : null,
      };
      if (!isNew) {
        payload.id = rawId;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save media item");
      }

      setSuccess("Media item saved successfully!");
      if (isNew && data.item?.id) {
        router.push(`/admin/media-items/${data.item.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this media item?")) return;
    try {
      const res = await fetch("/api/admin/media-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rawId }),
      });
      if (res.ok) {
        router.push("/admin/media-items");
      } else {
        const d = await res.json();
        alert(d.error || "Delete failed");
      }
    } catch {
      alert("Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-slate-400 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading media coverage...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/media-items"
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isNew ? "Create Media Item" : `Edit Item: ${form.title}`}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Press releases, media mentions, interview features, and public notices.
            </p>
          </div>
        </div>

        {!isNew && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors self-start sm:self-auto"
            title="Delete media item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 mb-6 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-teal-400" />
            Media Coverage Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Headline (EN) *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="LENS Releases National Youth Survey"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Headline (বাংলা)</label>
              <input
                type="text"
                value={form.titleBn}
                onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-bangla"
                placeholder="লেন্স এর জাতীয় যুব জরিপ প্রকাশ"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">URL Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-") })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="lens-releases-national-youth-survey"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Media Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="press_release" className="bg-[#0b121e]">Press Release</option>
                <option value="interview" className="bg-[#0b121e]">Interview</option>
                <option value="report" className="bg-[#0b121e]">Media Report</option>
                <option value="statement" className="bg-[#0b121e]">Official Statement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="draft" className="bg-[#0b121e]">Draft</option>
                <option value="published" className="bg-[#0b121e]">Published</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Source Outlet Name</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="The Daily Star, Prothom Alo"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Source URL</label>
              <input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="https://thedailystar.net/..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Published Date</label>
              <input
                type="date"
                value={form.datePublished}
                onChange={(e) => setForm({ ...form, datePublished: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>

          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="rounded border-white/20 text-teal-500 focus:ring-teal-500/30"
              />
              <span className="text-sm text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Featured Press Item
              </span>
            </label>
          </div>
        </div>

        {/* Media Thumbnail */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-teal-400" />
            Media Image / Clipping
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {form.image ? (
              <div className="relative group w-40 h-24 rounded-lg overflow-hidden bg-black/40 border border-white/10">
                <img src={form.image} alt="Media cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: "" })}
                  className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-500 text-white rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-40 h-24 rounded-lg bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500 text-xs">
                <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                No image
              </div>
            )}

            <div className="flex-1 w-full">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://... or choose from media"
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="px-3 py-2 bg-white/10 border border-white/10 text-white text-sm rounded-lg hover:bg-white/15 transition-colors whitespace-nowrap"
                >
                  Choose Media
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Short Summary */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-base font-semibold text-white">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Summary (EN) *</label>
              <textarea
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                placeholder="Press release lead paragraph..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Summary (বাংলা)</label>
              <textarea
                rows={3}
                value={form.descriptionBn}
                onChange={(e) => setForm({ ...form, descriptionBn: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none font-bangla"
                placeholder="সংক্ষিপ্ত সারসংক্ষেপ বাংলায়..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/admin/media-items"
            className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-400 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : isNew ? "Create Media Item" : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => {
          setForm({ ...form, image: url });
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
}
