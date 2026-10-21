"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getMediaLibrary, updateMediaFile, getMediaReferences, type MediaReference } from "@/lib/actions/media";
import { deleteMediaFile } from "@/lib/actions/dashboard";

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  alt: string;
  title?: string;
  description?: string;
  width?: number | null;
  height?: number | null;
  dateCreated: string | Date;
}

export default function AdminMediaPage() {
  const [data, setData] = useState<{ items: MediaFile[]; total: number; page: number; pages: number } | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [editing, setEditing] = useState<MediaFile | null>(null);
  const [refsFor, setRefsFor] = useState<{ file: MediaFile; refs: MediaReference[] } | null>(null);
  const [refsLoading, setRefsLoading] = useState(false);
  const [toast, setToast] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMediaLibrary(page, 24, search || undefined);
      setData({ items: result.items as MediaFile[], total: result.total, page: result.page, pages: result.pages });
    } catch {
      setError("Failed to load media files.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt", file.name.replace(/\.[^/.]+$/, ""));
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Upload failed"); return; }
      setPage(1);
      await load();
      setToast("File uploaded.");
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Delete "${file.originalName}"? Files still in use are protected.`)) return;
    try {
      // Expected failures (referenced in content) arrive as values, because
      // Next.js redacts thrown Server Action errors across the RSC boundary.
      const result = await deleteMediaFile(file.id) as { success?: boolean; error?: string } | null;
      if (result && result.success === false) {
        setError(result.error || "File is still in use. Delete blocked.");
        return;
      }
      setToast("File deleted.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const showReferences = async (file: MediaFile) => {
    setRefsLoading(true);
    setRefsFor({ file, refs: [] });
    try {
      const refs = await getMediaReferences(file.id);
      setRefsFor({ file, refs });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan references");
      setRefsFor(null);
    } finally {
      setRefsLoading(false);
    }
  };

  const copyUrl = async (file: MediaFile) => {
    try {
      await navigator.clipboard.writeText(file.url);
      setToast("URL copied.");
    } catch {
      setError("Copy failed — select the URL manually.");
    }
  };

  const saveEdit = async (file: MediaFile, values: { title: string; description: string; alt: string }) => {
    try {
      // Expected failures arrive as values (Server Action throws are redacted
      // across the RSC boundary in production).
      const result = await updateMediaFile(file.id, values);
      if (result && result.success === false) {
        setError(result.error || "Save failed");
        return;
      }
      setEditing(null);
      setToast("Metadata saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Clear transient toast automatically
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Media Library</h1>
          <p className="text-sm text-slate-500 mt-1">Upload and manage files. Files referenced by content cannot be deleted.</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.mp4,.webm"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? "border-teal-400 bg-teal-50" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-slate-500">Drag & drop a file here, or click Upload above</p>
        <p className="text-xs text-slate-400 mt-1">
          Images (JPEG, PNG, GIF, WebP, AVIF) up to 10MB | Documents (PDF, DOC, DOCX) up to 50MB | Videos (MP4, WebM) up to the configured video limit. File content is verified by magic bytes on upload.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}
      {toast && (
        <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-700">{toast}</div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-60"
        />
        {data && <span className="text-xs text-slate-400">{data.total} file{data.total === 1 ? "" : "s"}</span>}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No media files found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">File</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Size</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Dimensions</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Uploaded</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((file) => (
                  <tr key={file.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {file.mimeType.startsWith("image/") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={file.url} alt={file.alt || file.originalName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 truncate max-w-[220px]">{file.title || file.originalName}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[220px]" title={file.url}>/{file.filename.replace(/^uploads\//, "uploads/…/")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="text-xs text-slate-500">{file.mimeType.replace("application/", "").replace("image/", "")}</span></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><span className="text-xs text-slate-500">{formatSize(file.size)}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className="text-xs text-slate-500">{file.width && file.height ? `${file.width}×${file.height}` : "—"}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className="text-xs text-slate-500">{new Date(file.dateCreated).toLocaleDateString()}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <a href={file.url} target="_blank" rel="noopener" className="px-2 py-1 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors">View</a>
                        <button onClick={() => copyUrl(file)} className="px-2 py-1 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors">Copy URL</button>
                        <button onClick={() => setEditing(file)} className="px-2 py-1 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors">Edit</button>
                        <button onClick={() => showReferences(file)} className="px-2 py-1 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors">Where used?</button>
                        <button onClick={() => handleDelete(file)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <span className="text-xs text-slate-500">Page {data.page} of {data.pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 transition-colors">Previous</button>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page >= data.pages} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Edit file details</h3>
            <p className="text-xs text-slate-400 mb-4 truncate">{editing.originalName}</p>
            <form onSubmit={(e) => { e.preventDefault(); saveEdit(editing, {
              title: (new FormData(e.currentTarget).get("title") as string) || "",
              description: (new FormData(e.currentTarget).get("description") as string) || "",
              alt: (new FormData(e.currentTarget).get("alt") as string) || "",
            }); }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                <input name="title" type="text" defaultValue={editing.title || ""} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Alt text</label>
                <input name="alt" type="text" defaultValue={editing.alt || ""} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <textarea name="description" rows={3} defaultValue={editing.description || ""} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {refsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRefsFor(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Where is this file used?</h3>
            <p className="text-xs text-slate-400 mb-4 truncate">{refsFor.file.originalName}</p>
            {refsLoading ? (
              <p className="text-sm text-slate-400 py-4">Scanning content…</p>
            ) : refsFor.refs.length === 0 ? (
              <p className="text-sm text-slate-600 py-2">Not referenced anywhere — safe to delete.</p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {refsFor.refs.map((r, i) => (
                  <li key={i} className="text-sm bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                    <span className="text-[11px] uppercase tracking-wider text-teal-600 font-semibold mr-2">{r.source}</span>
                    <span className="text-slate-800">{r.label || r.id}</span>
                    <span className="text-xs text-slate-400 ml-2">({r.field})</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end pt-4">
              <button onClick={() => setRefsFor(null)} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
