"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { getMediaFiles } from "@/lib/actions/dashboard";
import type { AdminMediaFile, PaginatedResult } from "@/lib/admin-types";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, alt?: string) => void;
  title?: string;
}

export default function MediaPickerModal({
  open,
  onClose,
  onSelect,
  title = "Select Media",
}: MediaPickerModalProps) {
  const [data, setData] = useState<PaginatedResult<AdminMediaFile> | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMediaFiles(1, 40, search);
      setData(res);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (open) {
      loadMedia();
    }
  }, [open, loadMedia]);

  if (!open) return null;

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("alt", file.name.replace(/\.[^/.]+$/, ""));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error || "Upload failed");
        return;
      }

      await loadMedia();
      if (json.file?.url) {
        onSelect(json.file.url, json.file.originalName);
        onClose();
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-navy-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "+ Upload New"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Alerts */}
        <div className="p-4 border-b border-white/5 flex items-center gap-4">
          <input
            type="text"
            placeholder="Search media by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
          {uploadError && (
            <span className="text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
              {uploadError}
            </span>
          )}
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-video bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-slate-400 text-sm">No media files found.</p>
              <p className="text-slate-500 text-xs mt-1">Upload an image to add it to your library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.items.map((file) => {
                const isImage = file.mimeType.startsWith("image/");
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => {
                      onSelect(file.url, file.alt || file.originalName);
                      onClose();
                    }}
                    className="group flex flex-col rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-teal-400/50 hover:bg-white/[0.08] transition-all text-left focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <div className="aspect-video relative bg-black/40 flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        <Image
                          src={file.url}
                          alt={file.alt || file.originalName}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized={file.url.startsWith("http")}
                        />
                      ) : (
                        <span className="text-xs uppercase font-bold text-slate-500">
                          {file.mimeType.split("/")[1] || "File"}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium text-white truncate">{file.originalName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
