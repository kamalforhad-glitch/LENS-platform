"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getResearchArticle, createResearchArticle, updateResearchArticle, saveVersion, getVersions, getCitations, addCitation, deleteCitation } from "@/lib/actions/research";
import { getAuthorProfiles, linkAuthorToArticle } from "@/lib/actions/authors";
import { assignReviewer, getArticleReviews } from "@/lib/actions/review";

const CATEGORIES = ["Research Report", "Working Paper", "Policy Brief", "Data Analysis"];
const STATUSES = ["draft", "published", "archived"];
const CITATION_TYPES = ["journal", "book", "conference", "report", "web", "other"];

export default function ResearchEditorPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === "new";
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "academic" | "versions" | "citations" | "reviews">("details");

  const [id, setId] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Research Report");
  const [author, setAuthor] = useState("LENS Research Team");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [abstract, setAbstract] = useState("");
  const [methodology, setMethodology] = useState("");
  const [doi, setDoi] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterAffiliation, setSubmitterAffiliation] = useState("");
  const [version, setVersion] = useState(1);
  const [changelog, setChangelog] = useState("");

  const [versions, setVersions] = useState<{ id: string; version: number; title: string; changelog: string; createdAt: Date; creator: { name: string } | null }[]>([]);
  const [citations, setCitations] = useState<{ id: string; type: string; authors: string; title: string; journal: string | null; year: number | null; doi: string | null }[]>([]);
  const [reviews, setReviews] = useState<{ id: string; status: string; reviewer: { name: string } | null; _count: { comments: number } }[]>([]);
  const [authors, setAuthors] = useState<{ id: string; name: string }[]>([]);

  // New citation form
  const [citType, setCitType] = useState("journal");
  const [citAuthors, setCitAuthors] = useState("");
  const [citTitle, setCitTitle] = useState("");
  const [citJournal, setCitJournal] = useState("");
  const [citYear, setCitYear] = useState("");
  const [citDoi, setCitDoi] = useState("");

  // Reviewer assignment
  const [reviewerId, setReviewerId] = useState("");
  const [deadline, setDeadline] = useState("");

  // DOI lookup
  const [doiLookupQuery, setDoiLookupQuery] = useState("");
  const [doiLookupLoading, setDoiLookupLoading] = useState(false);
  const [doiLookupResult, setDoiLookupResult] = useState<string | null>(null);

  // ORCID lookup
  const [orcidQuery, setOrcidQuery] = useState("");
  const [orcidLoading, setOrcidLoading] = useState(false);
  const [orcidResult, setOrcidResult] = useState<string | null>(null);

  useEffect(() => {
    getAuthorProfiles(1, 100).then((r) => setAuthors(r.items.map((a) => ({ id: a.id, name: a.name }))));
    if (!isNew && params.id) {
      getResearchArticle(params.id as string).then((item) => {
        if (item) {
          setId(item.id);
          setSlug(item.slug);
          setTitle(item.title);
          setDescription(item.description);
          setContent(item.content);
          setCategory(item.category);
          setAuthor(item.author);
          try { setTags(JSON.parse(item.tags).join(", ")); } catch { setTags(""); }
          setImage(item.image || "");
          setPdfUrl(item.pdfUrl || "");
          setStatus(item.status);
          setFeatured(!!item.featured);
          setAbstract(item.abstract || "");
          setMethodology(item.methodology || "");
          setDoi(item.doi || "");
          setVersion(item.version);
          setSubmitterName(item.submitterName || "");
          setSubmitterEmail(item.submitterEmail || "");
          setSubmitterAffiliation(item.submitterAffiliation || "");
          // Load versions, citations, reviews
          getVersions(item.id).then((v) => setVersions(v));
          getCitations(item.id).then((c) => setCitations(c as typeof citations));
          getArticleReviews(item.id).then((r) => setReviews(r as typeof reviews));
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
        title, description, content, category, author,
        tags: tagList, image: image || undefined, pdf_url: pdfUrl || undefined,
        status: (publishStatus || status) as "draft" | "published",
        featured, abstract, methodology, doi: doi || undefined,
        submitterName: submitterName || undefined, submitterEmail: submitterEmail || undefined,
        submitterAffiliation: submitterAffiliation || undefined,
      };
      if (isNew) {
        const result = await createResearchArticle(data);
        router.push(`/admin/research/${result.id}`);
      } else {
        await updateResearchArticle(id, data);
        alert("Saved successfully");
      }
    } finally { setSaving(false); }
  };

  const handleSaveVersion = async () => {
    if (!id) return;
    setSaving(true);
    const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const result = await saveVersion(id, { title, description, content, tags: tagList, changelog });
    setVersion(result.version);
    setChangelog("");
    const v = await getVersions(id);
    setVersions(v);
    setSaving(false);
  };

  const handleAddCitation = async () => {
    if (!id || !citTitle.trim()) return;
    await addCitation(id, {
      type: citType, authors: citAuthors, title: citTitle,
      journal: citJournal || undefined, year: citYear ? parseInt(citYear) : undefined,
      doi: citDoi || undefined,
    });
    const c = await getCitations(id);
    setCitations(c as typeof citations);
    setCitAuthors(""); setCitTitle(""); setCitJournal(""); setCitYear(""); setCitDoi("");
  };

  const handleDoiLookup = async () => {
    if (!doiLookupQuery.trim()) return;
    setDoiLookupLoading(true);
    setDoiLookupResult(null);
    try {
      const res = await fetch(`/api/academic/doi/${encodeURIComponent(doiLookupQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          setDoi(data.doi || doiLookupQuery);
          setTitle(data.title);
          if (data.abstract) setAbstract(data.abstract);
          if (data.authors?.length) setAuthor(data.authors.map((a: { given: string; family: string }) => `${a.given} ${a.family}`).join(", "));
          if (data.journal) setCitJournal(data.journal);
          setDoiLookupResult("Auto-filled fields from DOI metadata");
        } else {
          setDoiLookupResult("No metadata found for this DOI");
        }
      } else {
        setDoiLookupResult("DOI lookup failed");
      }
    } catch {
      setDoiLookupResult("Error looking up DOI");
    } finally {
      setDoiLookupLoading(false);
    }
  };

  const handleOrcidLookup = async () => {
    if (!orcidQuery.trim()) return;
    setOrcidLoading(true);
    setOrcidResult(null);
    try {
      const res = await fetch(`/api/academic/orcid?q=${encodeURIComponent(orcidQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.type === "profile" && data.profile) {
          setSubmitterName(data.profile.name);
          if (data.profile.employments?.[0]?.organization) setSubmitterAffiliation(data.profile.employments[0].organization);
          setOrcidResult(`Found: ${data.profile.name} - ${data.profile.employments?.[0]?.organization || "No affiliation"}`);
        } else if (data.type === "search" && data.results?.length > 0) {
          setOrcidResult(`Found ${data.numFound} results. First: ${data.results[0].name} (${data.results[0].orcid})`);
        } else {
          setOrcidResult("No ORCID profiles found");
        }
      } else {
        setOrcidResult("ORCID lookup failed");
      }
    } catch {
      setOrcidResult("Error looking up ORCID");
    } finally {
      setOrcidLoading(false);
    }
  };

  const handleAssignReviewer = async () => {
    if (!id || !reviewerId) return;
    await assignReviewer(id, reviewerId, deadline || undefined);
    const r = await getArticleReviews(id);
    setReviews(r as typeof reviews);
    setReviewerId(""); setDeadline("");
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  const tabs = [
    { id: "details", label: "Details" },
    { id: "academic", label: "Academic" },
    { id: "versions", label: `Versions (${versions.length})` },
    { id: "citations", label: `Citations (${citations.length})` },
    { id: "reviews", label: `Reviews (${reviews.length})` },
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isNew ? "New Research Article" : "Edit Article"}</h1>
          {slug && <p className="text-xs text-slate-400 mt-1">Slug: {slug} &middot; v{version}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave()} disabled={saving} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button onClick={() => handleSave("published")} disabled={saving} className="px-4 py-2 text-sm bg-teal-500 hover:bg-teal-400 text-white rounded-lg disabled:opacity-50">
            Publish
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-teal-500 text-teal-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg">{STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image URL</label>
              <input value={image} onChange={(e) => setImage(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PDF URL</label>
              <input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="rounded border-slate-300 text-teal-500" />
            Featured article
          </label>
        </div>
      )}

      {/* Academic Tab */}
      {activeTab === "academic" && (
        <div className="space-y-5">
          {/* DOI Lookup */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">DOI Lookup</h3>
            <div className="flex gap-3">
              <input
                value={doiLookupQuery}
                onChange={(e) => setDoiLookupQuery(e.target.value)}
                placeholder="Enter DOI (e.g., 10.1234/example) or paste a DOI URL"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
              />
              <button
                onClick={handleDoiLookup}
                disabled={doiLookupLoading || !doiLookupQuery.trim()}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {doiLookupLoading ? "Looking up..." : "Lookup DOI"}
              </button>
            </div>
            {doiLookupResult && (
              <p className={`text-xs mt-2 ${doiLookupResult.includes("Auto-filled") ? "text-green-600" : "text-slate-500"}`}>
                {doiLookupResult}
              </p>
            )}
          </div>

          {/* ORCID Lookup */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">ORCID Lookup</h3>
            <div className="flex gap-3">
              <input
                value={orcidQuery}
                onChange={(e) => setOrcidQuery(e.target.value)}
                placeholder="Enter ORCID iD (0000-0000-0000-0000) or author name"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
              />
              <button
                onClick={handleOrcidLookup}
                disabled={orcidLoading || !orcidQuery.trim()}
                className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                {orcidLoading ? "Looking up..." : "Lookup ORCID"}
              </button>
            </div>
            {orcidResult && (
              <p className="text-xs mt-2 text-slate-500">{orcidResult}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">DOI</label>
            <input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="10.1234/example.doi" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Abstract</label>
            <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={5} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Methodology</label>
            <textarea value={methodology} onChange={(e) => setMethodology(e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg" />
          </div>

          {/* Citation Export */}
          {id && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Export Article Citation</h3>
              <div className="flex flex-wrap gap-2">
                {(["bibtex", "ris", "apa", "chicago", "vancouver"] as const).map((fmt) => (
                  <a
                    key={fmt}
                    href={`/api/academic/cite/${id}?format=${fmt}`}
                    target="_blank"
                    rel="noopener"
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                  >
                    {fmt.toUpperCase()}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Submitter Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Name</label>
                <input value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Email</label>
                <input value={submitterEmail} onChange={(e) => setSubmitterEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Affiliation</label>
                <input value={submitterAffiliation} onChange={(e) => setSubmitterAffiliation(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Versions Tab */}
      {activeTab === "versions" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Save New Version</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Changelog</label>
                <input value={changelog} onChange={(e) => setChangelog(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="What changed in this version?" />
              </div>
              <button onClick={handleSaveVersion} disabled={saving} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50">
                Save Version Snapshot (current: v{version})
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-700">Version History</h3>
            </div>
            {versions.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No versions saved yet.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {versions.map((v) => (
                  <div key={v.id} className="px-4 py-3 hover:bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-slate-900">v{v.version}</span>
                        {v.changelog && <span className="text-xs text-slate-500 ml-2">{v.changelog}</span>}
                      </div>
                      <div className="text-xs text-slate-400">
                        {v.creator?.name} &middot; {new Date(v.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Citations Tab */}
      {activeTab === "citations" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Citation</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <select value={citType} onChange={(e) => setCitType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {CITATION_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <input value={citAuthors} onChange={(e) => setCitAuthors(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Authors" />
              <input value={citTitle} onChange={(e) => setCitTitle(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Title *" />
            </div>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <input value={citJournal} onChange={(e) => setCitJournal(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Journal" />
              <input value={citYear} onChange={(e) => setCitYear(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Year" type="number" />
              <input value={citDoi} onChange={(e) => setCitDoi(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="DOI" />
              <button onClick={handleAddCitation} disabled={!citTitle.trim()} className="px-4 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50">Add</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {citations.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No citations added yet.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {citations.map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 mr-2">{c.type}</span>
                      <span className="text-sm text-slate-900">{c.authors && `${c.authors}. `}{c.title}{c.journal && `. ${c.journal}`}{c.year && ` (${c.year})`}</span>
                      {c.doi && <span className="text-xs text-slate-400 ml-2">DOI: {c.doi}</span>}
                    </div>
                    <button onClick={async () => { await deleteCitation(c.id); const ci = await getCitations(id); setCitations(ci as typeof citations); }} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === "reviews" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Assign Reviewer</h3>
            <div className="flex gap-3">
              <select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select reviewer...</option>
                {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <button onClick={handleAssignReviewer} disabled={!reviewerId} className="px-4 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50">Assign</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-700">Review Assignments</h3>
            </div>
            {reviews.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No reviews assigned yet.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {reviews.map((r) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <span className="text-sm text-slate-900">{r.reviewer?.name || "Unknown"}</span>
                      <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${r.status === "completed" ? "bg-green-50 text-green-600" : r.status === "in_progress" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>{r.status}</span>
                    </div>
                    <div className="text-xs text-slate-400">{r._count.comments} comments</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
