"use client";

import { useState, useEffect } from "react";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  onPublish: () => void;
  title: string;
  content: string;
  status: string;
  metaTitle?: string;
  metaDescription?: string;
}

export default function PreviewModal({ open, onClose, onPublish, title, content, status, metaTitle, metaDescription }: PreviewModalProps) {
  const [tab, setTab] = useState<"preview" | "seo">("preview");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">Preview</h2>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status === "published" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{status}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button onClick={() => setTab("preview")} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${tab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Preview</button>
              <button onClick={() => setTab("seo")} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${tab === "seo" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>SEO</button>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "preview" ? (
            <div>
              <div className="bg-slate-50 rounded-xl p-6 mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Page Title</h3>
                <p className="text-xl font-bold text-slate-900">{title}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Content</h3>
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">{content || "No content yet."}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Google Search Preview</h3>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-blue-700 text-lg font-medium hover:underline cursor-pointer truncate">{metaTitle || title}</p>
                  <p className="text-green-700 text-xs mt-1">lens.org.bd/{title.toLowerCase().replace(/\s+/g, "-")}</p>
                  <p className="text-slate-600 text-sm mt-1 line-clamp-2">{metaDescription || content?.slice(0, 160) || "No description set."}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Social Preview</h3>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-teal-500 to-navy-800 flex items-center justify-center">
                    <span className="text-white/80 text-xs">OG Image</span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-slate-400 uppercase">lens.org.bd</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">{metaTitle || title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{metaDescription || content?.slice(0, 120) || "No description set."}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Close</button>
          {status === "draft" && (
            <button onClick={onPublish} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">Publish</button>
          )}
        </div>
      </div>
    </div>
  );
}
