"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPublication, createPublication, updatePublication } from "@/lib/actions/publications";

const TYPES = ["Policy Brief", "Working Paper", "Research Report", "Report"];
const STATUSES = ["draft", "published", "archived"];

export default function PublicationEditorPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Research Report");
  const [author, setAuthor] = useState("LENS Research Team");
  const [tags, setTags] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pages, setPages] = useState("");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    if (!isNew && params.id) {
      getPublication(params.id as string).then((item) => {
        if (item) {
          setId(item.id);
          setTitle(item.title);
          setDescription(item.description);
          setType(item.type);
          setAuthor(item.author);
          try { setTags(JSON.parse(item.tags).join(", ")); } catch { setTags(""); }
          setPdfUrl(item.pdfUrl || "");
          setPages(item.pages?.toString() || "");
          setStatus(item.status);
        }
        setLoading(false);
      });
    }
  }, [isNew, params.id]);

  const handleSave = async (publishStatus?: string) => {
    setSaving(true);
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const data = {
        title, description, type, author, tags: tagList,
        pdf_url: pdfUrl || undefined,
        pages: pages ? parseInt(pages) : undefined,
        status: (publishStatus || status) as "draft" | "published",
      };
      if (isNew) {
        const result = await createPublication(data);
        router.push(`/admin/publications/${result.id}`);
      } else {
        await updatePublication(id, data);
        alert("Saved");
      }
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{isNew ? "New Publication" : "Edit Publication"}</h1>
        <div className="flex gap-2">
          <button onClick={() => handleSave()} disabled={saving} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">{saving ? "Saving..." : "Save Draft"}</button>
          <button onClick={() => handleSave("published")} disabled={saving} className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-400 text-white rounded-lg disabled:opacity-50">Publish</button>
        </div>
      </div>
      <div className="space-y-5">
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Description *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label><select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg">{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg">{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Author</label><input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Pages</label><input type="number" value={pages} onChange={(e) => setPages(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label><input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">PDF URL</label><input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" placeholder="https://..." /></div>
      </div>
    </div>
  );
}
