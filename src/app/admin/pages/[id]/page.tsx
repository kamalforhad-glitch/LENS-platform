"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Globe, ExternalLink } from "lucide-react";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import PageSectionEditor from "@/components/admin/PageSectionEditor";

interface PageData {
  id?: string;
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogImage: string;
  parentId: string;
  status: "draft" | "published" | "archived";
  sortOrder: number;
}

interface ParentOption { id: string; slug: string; title: string; }

export default function PageEditor() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const isNew = rawId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<PageData>({
    slug: "",
    title: "",
    titleBn: "",
    description: "",
    descriptionBn: "",
    metaTitle: "",
    metaDescription: "",
    keywords: "[]",
    canonicalUrl: "",
    ogImage: "",
    parentId: "",
    status: "draft",
    sortOrder: 0,
  });
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  useEffect(() => {
    if (!isNew && rawId) {
      // Load parent-page options for the hierarchy dropdown.
      fetch("/api/admin/pages")
        .then((r) => r.json())
        .then((d) => {
          setParents(
            (d.pages || [])
              .filter((p: { id: string; slug: string; title: string }) => p.id !== rawId && p.slug !== "home")
              .map((p: { id: string; slug: string; title: string }) => ({ id: p.id, slug: p.slug, title: p.title }))
          );
        })
        .catch(() => { /* parent options are optional */ });

      fetch(`/api/admin/pages?id=${rawId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.page) {
            setForm({
              id: d.page.id,
              slug: d.page.slug || "",
              title: d.page.title || "",
              titleBn: d.page.titleBn || "",
              description: d.page.description || "",
              descriptionBn: d.page.descriptionBn || "",
              metaTitle: d.page.metaTitle || "",
              metaDescription: d.page.metaDescription || "",
              keywords: d.page.keywords || "[]",
              canonicalUrl: d.page.canonicalUrl || "",
              ogImage: d.page.ogImage || "",
              parentId: d.page.parentId || "",
              status: d.page.status || "draft",
              sortOrder: d.page.sortOrder || 0,
            });
          } else {
            setError("Page not found");
          }
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to load page");
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
      const url = "/api/admin/pages";
      const method = isNew ? "POST" : "PUT";
      // Optional fields must be omitted entirely when empty ("" is not a valid FK / og URL).
      const payload = { ...form, id: rawId };
      const body: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(payload)) {
        if (v === "" && ["ogImage", "canonicalUrl", "parentId", "metaTitle", "metaTitleBn", "metaDescription"].includes(k)) continue;
        body[k] = v;
      }
      if (isNew) delete body.id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save page");
      }

      setSuccess("Page saved successfully!");
      if (isNew && data.page?.id) {
        router.push(`/admin/pages/${data.page.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this page? All associated sections will be deleted.")) return;
    try {
      const res = await fetch("/api/admin/pages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rawId }),
      });
      if (res.ok) {
        router.push("/admin/pages");
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
        Loading page details...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pages"
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isNew ? "Create New Page" : `Edit Page: ${form.title || form.slug}`}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Manage page metadata, bilingual titles, and publishing status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {form.slug === "home" && (
            <Link
              href="/admin/pages/home"
              className="px-3.5 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-lg text-xs font-semibold hover:bg-teal-500/20 transition-colors flex items-center gap-1.5"
            >
              Open Landing Page Editor
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
          {!isNew && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Delete page"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
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
            <Globe className="w-4 h-4 text-teal-400" />
            Basic Page Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Page Title (EN) *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="e.g. About Us"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Page Title (বাংলা)</label>
              <input
                type="text"
                value={form.titleBn}
                onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-bangla"
                placeholder="যেমন: আমাদের সম্পর্কে"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Summary (EN)</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                placeholder="Short description shown in page lists and used as meta fallback"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Summary (বাংলা)</label>
              <textarea
                rows={2}
                value={form.descriptionBn}
                onChange={(e) => setForm({ ...form, descriptionBn: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none font-bangla"
                placeholder="সংক্ষিপ্ত বিবরণ"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">URL Slug *</label>
              <div className="flex items-center">
                <span className="text-xs text-slate-500 px-2.5 py-2 bg-white/5 border border-r-0 border-white/10 rounded-l-lg">/</span>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-") })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-r-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  placeholder="about"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PageData["status"] })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="draft" className="bg-[#0b121e]">Draft</option>
                <option value="published" className="bg-[#0b121e]">Published</option>
                {!isNew && <option value="archived" className="bg-[#0b121e]">Archived</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Parent page (optional)</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="" className="bg-[#0b121e]">— None (top level) —</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#0b121e]">{p.title} (/{p.slug})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>
        </div>

        {/* SEO Metadata */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <h2 className="text-base font-semibold text-white">SEO & Social Meta</h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Meta Title (Browser Tab Title)</label>
            <input
              type="text"
              value={form.metaTitle}
              onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              placeholder="Defaults to Page Title | LENS"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Meta Description</label>
            <textarea
              rows={3}
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
              placeholder="Search engine summary (approx 150-160 characters)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Canonical URL</label>
              <input
                type="url"
                value={form.canonicalUrl}
                onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="https://www.lensbd.org/about"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Keywords (Comma separated or JSON array)</label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="youth, policy, research, bangladesh"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Social share image (og:image)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.ogImage}
                  onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  placeholder="Image URL"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  Browse…
                </button>
              </div>
            </div>
          </div>
        </div>

        {showMediaPicker && (
          <MediaPickerModal
            open
            onClose={() => setShowMediaPicker(false)}
            onSelect={(url) => { setForm({ ...form, ogImage: url }); setShowMediaPicker(false); }}
            title="Select Social Image"
          />
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/admin/pages"
            className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            Back to Pages
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-400 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : isNew ? "Create Page" : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Visual page builder — explicit pages only; the homepage has its own editor. */}
      {!isNew && rawId && form.slug !== "home" && (
        <div className="mt-8">
          <PageSectionEditor pageId={rawId} />
        </div>
      )}
    </div>
  );
}
