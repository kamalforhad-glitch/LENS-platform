"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, FileText, Image as ImageIcon, X } from "lucide-react";
import MediaPickerModal from "@/components/admin/MediaPickerModal";

interface ResourceFormData {
  title: string;
  titleBn: string;
  slug: string;
  description: string;
  descriptionBn: string;
  content: string;
  contentBn: string;
  image: string;
  fileUrl: string;
  externalUrl: string;
  category: string;
  type: string;
  tags: string;
  status: "draft" | "published";
  metaTitle: string;
  metaDescription: string;
}

export default function ResourceEditor() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const isNew = rawId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"image" | "file">("image");

  const [form, setForm] = useState<ResourceFormData>({
    title: "",
    titleBn: "",
    slug: "",
    description: "",
    descriptionBn: "",
    content: "",
    contentBn: "",
    image: "",
    fileUrl: "",
    externalUrl: "",
    category: "Document",
    type: "document",
    tags: "[]",
    status: "draft",
    metaTitle: "",
    metaDescription: "",
  });

  useEffect(() => {
    if (!isNew && rawId) {
      fetch(`/api/admin/resources?id=${rawId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.resource) {
            const res = d.resource;
            setForm({
              title: res.title || "",
              titleBn: res.titleBn || "",
              slug: res.slug || "",
              description: res.description || "",
              descriptionBn: res.descriptionBn || "",
              content: res.content || "",
              contentBn: res.contentBn || "",
              image: res.image || "",
              fileUrl: res.fileUrl || "",
              externalUrl: res.externalUrl || "",
              category: res.category || "Document",
              type: res.type || "document",
              tags: res.tags || "[]",
              status: res.status || "draft",
              metaTitle: res.metaTitle || "",
              metaDescription: res.metaDescription || "",
            });
          } else {
            setError("Resource not found");
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load resource");
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
      const url = "/api/admin/resources";
      const method = isNew ? "POST" : "PUT";
      const payload: Record<string, unknown> = { ...form };
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
        throw new Error(data.error || "Failed to save resource");
      }

      setSuccess("Resource saved successfully!");
      if (isNew && data.resource?.id) {
        router.push(`/admin/resources/${data.resource.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      const res = await fetch("/api/admin/resources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rawId }),
      });
      if (res.ok) {
        router.push("/admin/resources");
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
        Loading resource...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/resources"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isNew ? "Create Resource" : `Edit Resource: ${form.title}`}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Toolkits, datasets, policy briefs, and downloadable documents.
            </p>
          </div>
        </div>

        {!isNew && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors self-start sm:self-auto"
            title="Delete resource"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {success}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            Resource Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Title (EN) *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                placeholder="Youth Data Toolkit 2026"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Title (বাংলা)</label>
              <input
                type="text"
                value={form.titleBn}
                onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors font-bangla"
                placeholder="ইয়ুথ ডেটা টুলকিট ২০২৬"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">URL Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-") })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                placeholder="youth-data-toolkit-2026"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                placeholder="Toolkit, Document, Dataset"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Format Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              >
                <option value="document" >PDF / Document</option>
                <option value="dataset" >Dataset (CSV / JSON)</option>
                <option value="tool" >Interactive Tool</option>
                <option value="link" >External Web Link</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Downloadable File URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  placeholder="/uploads/... or https://..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPickerTarget("file");
                    setShowMediaPicker(true);
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  Browse
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">External Resource URL (optional)</label>
              <input
                type="url"
                value={form.externalUrl}
                onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                placeholder="https://github.com/... or https://data.gov.bd"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Publishing Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}
              className="w-full sm:w-60 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
            >
              <option value="draft" >Draft</option>
              <option value="published" >Published</option>
            </select>
          </div>
        </div>

        {/* Preview Image */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-teal-400" />
            Cover Thumbnail
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {form.image ? (
              <div className="relative group w-40 h-24 rounded-lg overflow-hidden bg-black/40 border border-slate-200">
                <img src={form.image} alt="Resource cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: "" })}
                  className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-500 text-white rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-40 h-24 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 text-xs">
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
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPickerTarget("image");
                    setShowMediaPicker(true);
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  Choose Media
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Summary Description</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Description (EN) *</label>
              <textarea
                rows={4}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors resize-none"
                placeholder="Resource abstract and contents summary..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Description (বাংলা)</label>
              <textarea
                rows={4}
                value={form.descriptionBn}
                onChange={(e) => setForm({ ...form, descriptionBn: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors resize-none font-bangla"
                placeholder="রিসোর্সের বিবরণ বাংলায়..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/admin/resources"
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-2xs transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : isNew ? "Create Resource" : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => {
          if (pickerTarget === "image") {
            setForm({ ...form, image: url });
          } else {
            setForm({ ...form, fileUrl: url });
          }
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
}
