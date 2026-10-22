"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  Plus,
  Layout,
  Filter,
} from "lucide-react";
import { SECTION_TYPE_DEFS } from "@/components/admin/PageSectionEditor";

interface PageOption {
  id: string;
  slug: string;
  title: string;
  sections?: Array<{ id: string; type: string; title: string }>;
}

export default function SectionsLibraryAdmin() {
  const [pages, setPages] = useState<PageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((d) => {
        setPages(d.pages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredDefs = SECTION_TYPE_DEFS.filter((def) => {
    const matchesSearch =
      def.label.toLowerCase().includes(search.toLowerCase()) ||
      def.type.toLowerCase().includes(search.toLowerCase()) ||
      def.description.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reusable Sections Library</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse approved visual section components and see which pages use them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/pages/home"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Homepage Builder →
          </Link>
          <Link
            href="/admin/tabs"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            Tabs & Nested Tabs Builder →
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search section types (e.g. tabs, hero, cards, stats, faq)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {/* Grid of Section Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDefs.map((def) => {
          return (
            <div
              key={def.type}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-teal-500/50 hover:shadow-xs transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                    {def.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {def.fields.length} configurable field{def.fields.length === 1 ? "" : "s"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{def.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{def.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-teal-600">Bilingual ready (EN / BN)</span>
                <Link
                  href="/admin/pages"
                  className="text-xs font-semibold text-slate-700 hover:text-teal-600 transition-colors inline-flex items-center gap-1"
                >
                  Add to page <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

