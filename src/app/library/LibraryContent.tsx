"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { searchLibrary, type LibraryFilters } from "@/lib/actions/library";
import { trackDownload } from "@/lib/actions/research";

interface LibraryArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  tags: string;
  image: string | null;
  pdfUrl: string | null;
  downloads: number;
  datePublished: Date | null;
}

interface LibraryData {
  articles: LibraryArticle[];
  filters: { categories: string[]; years: string[]; topics: string[]; authors: string[] };
  total: number;
}

interface AutocompleteSuggestion {
  type: "article" | "category" | "topic" | "author";
  text: string;
  slug?: string;
  count?: number;
}

function LibraryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const autocompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const filters: LibraryFilters = {
    search: searchParams.get("q") || "",
    category: searchParams.get("category") || "all",
    year: searchParams.get("year") || "all",
    topic: searchParams.get("topic") || "all",
    sort: (searchParams.get("sort") as LibraryFilters["sort"]) || "newest",
  };

  // Debounced autocomplete
  const fetchSuggestions = useCallback((query: string) => {
    if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    autocompleteTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`);
        const result = await res.json();
        setSuggestions(result.suggestions || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 300);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await searchLibrary(filters);
    setData(result);
    setLoading(false);
  }, [filters.search, filters.category, filters.year, filters.topic, filters.sort]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/library?${params.toString()}`);
  };

  const handleSearchSubmit = (value: string) => {
    setShowSuggestions(false);
    updateFilter("q", value);
  };

  const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
    setShowSuggestions(false);
    if (suggestion.type === "article" && suggestion.slug) {
      router.push(`/library/${suggestion.slug}`);
    } else if (suggestion.type === "category") {
      updateFilter("category", suggestion.text);
    } else if (suggestion.type === "topic") {
      updateFilter("topic", suggestion.text);
    } else {
      setSearchInput(suggestion.text);
      handleSearchSubmit(suggestion.text);
    }
  };

  const handleDownload = async (id: string) => {
    await trackDownload("research", id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-950 via-[#061224] to-navy-950">
      {/* Hero */}
      <div className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(8,145,178,0.12)_0%,transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold tracking-[0.3em] uppercase text-teal-400 mb-3 block">Digital Knowledge Archive</span>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Research <span className="gradient-text">Library</span>
            </h1>
            <p className="text-slate-300/70 max-w-2xl mx-auto">
              Explore our collection of research reports, policy briefs, and working papers
              on media literacy, press freedom, and narrative ecosystems.
            </p>
          </div>

          {/* Search with Autocomplete */}
          <div className="max-w-2xl mx-auto" ref={searchRef}>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search research, topics, authors..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); fetchSuggestions(e.target.value); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearchSubmit(searchInput); }}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-400/50 focus:bg-white/10 transition-all text-lg"
              />
              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-navy-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${s.type}-${s.text}-${i}`}
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                    >
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.type === "article" ? "bg-teal-500/20 text-teal-400" :
                        s.type === "category" ? "bg-amber-500/20 text-amber-400" :
                        s.type === "topic" ? "bg-blue-500/20 text-blue-400" :
                        "bg-purple-500/20 text-purple-400"
                      }`}>
                        {s.type}
                      </span>
                      <span className="text-sm text-white truncate">{s.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          {data && (
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-400">{data.total}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gold-400">{data.filters.categories.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-300">{data.filters.years.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Years</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">Category</h3>
                <div className="space-y-1">
                  <button onClick={() => updateFilter("category", "all")} className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filters.category === "all" ? "bg-teal-500/20 text-teal-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    All Categories
                  </button>
                  {data?.filters.categories.map((cat) => (
                    <button key={cat} onClick={() => updateFilter("category", cat)} className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filters.category === cat ? "bg-teal-500/20 text-teal-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">Year</h3>
                <div className="space-y-1">
                  <button onClick={() => updateFilter("year", "all")} className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filters.year === "all" ? "bg-teal-500/20 text-teal-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    All Years
                  </button>
                  {data?.filters.years.map((year) => (
                    <button key={year} onClick={() => updateFilter("year", year)} className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filters.year === year ? "bg-teal-500/20 text-teal-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => updateFilter("topic", "all")} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filters.topic === "all" ? "bg-teal-500/20 text-teal-400 border border-teal-400/30" : "text-slate-400 border border-white/10 hover:border-white/20"}`}>
                    All
                  </button>
                  {data?.filters.topics.slice(0, 12).map((topic) => (
                    <button key={topic} onClick={() => updateFilter("topic", topic)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filters.topic === topic ? "bg-teal-500/20 text-teal-400 border border-teal-400/30" : "text-slate-400 border border-white/10 hover:border-white/20"}`}>
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">Author</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  <button onClick={() => updateFilter("author", "all")} className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filters.author === "all" || !filters.author ? "bg-teal-500/20 text-teal-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    All Authors
                  </button>
                  {data?.filters.authors?.map((a) => (
                    <button key={a} onClick={() => updateFilter("author", a)} className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${filters.author === a ? "bg-teal-500/20 text-teal-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">Sort By</h3>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-teal-400/50"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Downloaded</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-slate-400">
                {data ? `${data.total} result${data.total !== 1 ? "s" : ""}` : "Loading..."}
              </span>
              <div className="flex gap-1">
                <button onClick={() => setView("grid")} className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                </button>
                <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-24 mb-3" />
                    <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-white/10 rounded w-full mb-4" />
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : !data || data.articles.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                <h3 className="text-lg font-bold text-white mb-2">No results found</h3>
                <p className="text-slate-400 text-sm">Try adjusting your search or filters.</p>
              </div>
            ) : view === "grid" ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {data.articles.map((article) => (
                  <LibraryCard key={article.id} article={article} onDownload={handleDownload} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data.articles.map((article) => (
                  <LibraryListItem key={article.id} article={article} onDownload={handleDownload} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryCard({ article, onDownload }: { article: LibraryArticle; onDownload: (id: string) => void }) {
  let tags: string[] = [];
  try { tags = JSON.parse(article.tags); } catch {}

  return (
    <Link href={`/library/${article.slug}`} className="group block p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-teal-400/20 hover:bg-white/[0.06] transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-teal-500/10 text-teal-400 rounded-full border border-teal-400/20">
          {article.category}
        </span>
        {article.pdfUrl && (
          <button
            onClick={(e) => { e.preventDefault(); onDownload(article.id); }}
            className="p-1.5 text-slate-500 hover:text-teal-400 transition-colors"
            title="Download PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </button>
        )}
      </div>
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-teal-400 transition-colors line-clamp-2">
        {article.title}
      </h3>
      <p className="text-sm text-slate-400 line-clamp-3 mb-4">{article.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{article.author}</span>
          {article.datePublished && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-500">{new Date(article.datePublished).toLocaleDateString("en-US", { year: "numeric", month: "short" })}</span>
            </>
          )}
        </div>
        <span className="text-xs text-slate-600">{article.downloads} downloads</span>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-[10px] text-slate-500 bg-white/5 rounded-full">{tag}</span>
          ))}
        </div>
      )}
    </Link>
  );
}

function LibraryListItem({ article, onDownload }: { article: LibraryArticle; onDownload: (id: string) => void }) {
  return (
    <Link href={`/library/${article.slug}`} className="group flex gap-5 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-teal-400/20 hover:bg-white/[0.06] transition-all duration-300">
      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-500/10 to-navy-800/20 shrink-0 flex items-center justify-center">
        <svg className="w-8 h-8 text-teal-400/40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-teal-500/10 text-teal-400 rounded-full">{article.category}</span>
          <span className="text-xs text-slate-500">{article.author}</span>
        </div>
        <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors line-clamp-1">{article.title}</h3>
        <p className="text-sm text-slate-400 line-clamp-1 mt-0.5">{article.description}</p>
        <div className="flex items-center gap-3 mt-2">
          {article.datePublished && <span className="text-xs text-slate-500">{new Date(article.datePublished).toLocaleDateString("en-US", { year: "numeric", month: "short" })}</span>}
          <span className="text-xs text-slate-600">{article.downloads} downloads</span>
        </div>
      </div>
      {article.pdfUrl && (
        <button onClick={(e) => { e.preventDefault(); onDownload(article.id); }} className="shrink-0 p-2 text-slate-500 hover:text-teal-400 transition-colors self-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
        </button>
      )}
    </Link>
  );
}

export default LibraryContent;
